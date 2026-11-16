#!/usr/bin/env bash
# Evidence-preserving history fold for a mission or op branch (operator decisions 2026-11-03 and 2026-11-04).
# Usage: fold-history.sh <base-sha> <feature-dir> [label]   (feature-dir: specs/NNN-x or ops/NNN-x)
#
# /ocelle-run folds each phase right after its approval: base = the phase's base.sha, label = phase-N. /ocelle-land
# folds only what came after the last phase fold (its own folds), label = landing (the default).
#
# Rewrites <base>..HEAD into a shorter linear history that keeps every commit the red/green evidence needs:
# for each phase, base.sha, scaffold.sha and the scaffold's parent, and each red commit and its parent. Every other
# commit folds forward into the next kept commit. A group never spans two authors. Each new commit takes the exact
# tree, author and date of the last commit of its group; its message is the group's first feat/fix commit's message
# (else the last commit's), with the other subjects listed in its body and the union of the group's trailers (Signed-off-by and the rest).
# Then one commit remaps base.sha, scaffold.sha and red-commits of every phase, and the `- base:` line of its plants.md
# (op 016, operator round 3, O3-04; that line only: the command and the verbatim output keep their SHAs), to the new
# SHAs and appends a section to <feature>/reviews/history-map.txt (old -> new for every commit of the range that maps
# to a new one).
#
# Leaves HEAD on the folded history and keeps the old head as refs/ocelle/prefold/<label>/<branch>. Never pushes.
# Prints {"ok":true|false,"old_head":..,"new_head":..,"commits_before":n,"commits_after":n,"problems":[..]}.
# Exit 0 when ok, 1 when a verification failed (HEAD is reset to the old head), 2 when it could not run.
set -euo pipefail
base=${1:-}; feature=${2:-}; label=${3:-landing}
die() { printf '{"ok":false,"problems":["%s"]}\n' "$1"; exit 2; }
[[ "$base" =~ ^[0-9a-f]{7,40}$ ]] && git cat-file -e "$base^{commit}" 2>/dev/null || die "pr-base must be a commit sha"
[[ -n "$feature" && -d "$feature/reviews" ]] || die "feature-dir must hold reviews/"
[[ "$label" =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "label must be lower-case letters, digits and hyphens"
cd "$(git rev-parse --show-toplevel)"
[[ -z "$(git status --porcelain)" ]] || die "working tree not clean"
branch=$(git symbolic-ref --short HEAD 2>/dev/null) || die "HEAD is detached"
old_head=$(git rev-parse HEAD)
base=$(git rev-parse "$base^{commit}")
git merge-base --is-ancestor "$base" "$old_head" || die "pr-base is not an ancestor of HEAD"
[[ -z "$(git rev-list --merges "$base..$old_head")" ]] || die "history has merge commits; fold before merging main"

# Commits the evidence needs, as full SHAs.
declare -A keep=()
add_keep() { local s; s=$(git rev-parse -q --verify "$1^{commit}" 2>/dev/null) || return 0
  [[ "$s" == "$base" ]] && return 0
  git merge-base --is-ancestor "$base" "$s" && git merge-base --is-ancestor "$s" "$old_head" && keep[$s]=1 || true; }
for dir in "$feature"/reviews/phase-*; do
  [[ -d "$dir" ]] || continue
  [[ -f "$dir/base.sha" ]] && add_keep "$(tr -d '[:space:]' < "$dir/base.sha")"
  if [[ -f "$dir/scaffold.sha" ]]; then s=$(tr -d '[:space:]' < "$dir/scaffold.sha"); add_keep "$s"; add_keep "$s^"; fi
  if [[ -f "$dir/red-commits" ]]; then
    while read -r _ s; do [[ -n "${s:-}" ]] || continue; add_keep "$s"; add_keep "$s^"; done < "$dir/red-commits"
  fi
done
keep[$old_head]=1

mapfile -t commits < <(git rev-list --reverse "$base..$old_head")
parent=$base; group=(); declare -A map=(); new_count=0
author_of() { git log -1 --format='%an <%ae>' "$1"; }
emit_group() {
  local last=${group[-1]} lead="" msg body trailers folded="" c
  # The message comes from the group's first feat/fix commit (the work), else from its last commit.
  for c in "${group[@]}"; do git log -1 --format=%s "$c" | grep -qE '^(feat|fix)[(:!]' && { lead=$c; break; }; done
  [[ -n "$lead" ]] || lead=$last
  for c in "${group[@]}"; do [[ "$c" == "$lead" ]] || folded+="- $(git log -1 --format=%s "$c")"$'\n'; done
  msg=$(git log -1 --format=%B "$lead")
  trailers=$(for c in "${group[@]}"; do git log -1 --format=%B "$c" | git interpret-trailers --parse; done | awk '!seen[$0]++')
  # The last commit's message without its trailing trailer block (trailer lines and blank lines at the end).
  body=$(printf '%s\n' "$msg" | awk -v t="$(printf '%s\n' "$msg" | git interpret-trailers --parse)" '
      BEGIN { n = split(t, a, "\n"); for (i = 1; i <= n; i++) if (a[i] != "") tr[a[i]] = 1 }
      { line[NR] = $0 }
      END { e = NR; while (e > 0 && (line[e] == "" || (line[e] in tr))) e--; for (i = 1; i <= e; i++) print line[i] }')
  [[ -n "$folded" ]] && body+=$'\n\n'"Folded commits:"$'\n'"${folded%$'\n'}"
  body+=$'\n\n'"$trailers"
  local tree an ae ad cn ce
  tree=$(git rev-parse "$last^{tree}")
  an=$(git log -1 --format=%an "$last"); ae=$(git log -1 --format=%ae "$last"); ad=$(git log -1 --format=%aD "$last")
  cn=$(git log -1 --format=%cn "$last"); ce=$(git log -1 --format=%ce "$last")
  parent=$(printf '%s\n' "$body" | GIT_AUTHOR_NAME="$an" GIT_AUTHOR_EMAIL="$ae" GIT_AUTHOR_DATE="$ad" \
    GIT_COMMITTER_NAME="$cn" GIT_COMMITTER_EMAIL="$ce" git commit-tree "$tree" -p "$parent")
  map[$last]=$parent; new_count=$((new_count + 1)); group=()
}
for c in "${commits[@]}"; do
  if (( ${#group[@]} )) && [[ "$(author_of "${group[-1]}")" != "$(author_of "$c")" ]]; then emit_group; fi
  group+=("$c")
  [[ -n "${keep[$c]+x}" ]] && emit_group
done
(( ${#group[@]} )) && emit_group

problems=()
# Every kept commit maps to a new commit with the identical tree.
for s in "${!keep[@]}"; do
  [[ -n "${map[$s]+x}" ]] || { problems+=("kept commit $s has no new commit"); continue; }
  [[ "$(git rev-parse "$s^{tree}")" == "$(git rev-parse "${map[$s]}^{tree}")" ]] || problems+=("tree differs for $s")
done
[[ "$(git rev-parse "$parent^{tree}")" == "$(git rev-parse "$old_head^{tree}")" ]] || problems+=("folded head tree differs from the old head")
if (( ${#problems[@]} )); then
  printf '{"ok":false,"old_head":"%s","problems":[%s]}\n' "$old_head" "$(printf '"%s",' "${problems[@]}" | sed 's/,$//')"; exit 1
fi

git update-ref "refs/ocelle/prefold/$label/$branch" "$old_head"
git reset -q --hard "$parent"

# Remap the evidence files and write the map.
remap() { local s full; s=$1; full=$(git rev-parse -q --verify "$s^{commit}" 2>/dev/null) || { echo "$s"; return; }
  [[ -n "${map[$full]+x}" ]] && echo "${map[$full]}" || echo "$full"; }
for dir in "$feature"/reviews/phase-*; do
  [[ -d "$dir" ]] || continue
  for f in base.sha scaffold.sha; do [[ -f "$dir/$f" ]] && remap "$(tr -d '[:space:]' < "$dir/$f")" > "$dir/$f"; done
  if [[ -f "$dir/red-commits" ]]; then
    tmp=$(mktemp); while read -r l s; do [[ -n "${s:-}" ]] && echo "$l $(remap "$s")"; done < "$dir/red-commits" > "$tmp"; mv "$tmp" "$dir/red-commits"
  fi
  # plants.md: the first `- base: <sha>` line only, so its base stays equal to base.sha (the review checks it).
  if [[ -f "$dir/plants.md" ]]; then
    old=$(sed -n -E 's/^- base: ([0-9a-f]{7,40})$/\1/p' "$dir/plants.md" | head -n 1)
    if [[ -n "$old" ]]; then
      new=$(remap "$old"); tmp=$(mktemp)
      awk -v o="- base: $old" -v n="- base: $new" '!done && $0 == o { print n; done = 1; next } { print }' "$dir/plants.md" > "$tmp"; mv "$tmp" "$dir/plants.md"
    fi
  fi
done
map_file="$feature/reviews/history-map.txt"
{ [[ -s "$map_file" ]] && echo
  echo "# History fold $label of $branch: old commit -> new commit (pre-fold head kept as refs/ocelle/prefold/$label/$branch, $old_head)."
  for c in "${commits[@]}"; do [[ -n "${map[$c]+x}" ]] && echo "$c ${map[$c]}"; done; } >> "$map_file"
git add "$feature/reviews"
GIT_EDITOR=true git commit -q -s -m "chore($label): remap evidence SHAs after the history fold" \
  -m "base.sha, scaffold.sha and red-commits of every phase, and the base line of its plants.md, now name the folded commits; reviews/history-map.txt maps old to new. Review files, and plants.md's command and output, keep the SHAs they were written with; the map resolves them."
new_head=$(git rev-parse HEAD)
# A phase's plants.md may differ only in its `- base:` line: one line out, one line in.
base_line_only() { local changes
  changes=$(git diff --unified=0 "$old_head" "$new_head" -- "$1" | grep -E '^[-+]' | grep -v -E '^(--- (a/|/dev/null)|\+\+\+ (b/|/dev/null))' || true)
  [[ "$(printf '%s\n' "$changes" | grep -c -E '^-- base: [0-9a-f]{7,40}$')" == 1 && "$(printf '%s\n' "$changes" | grep -c -E '^\+- base: [0-9a-f]{7,40}$')" == 1 && "$(printf '%s\n' "$changes" | wc -l | tr -d ' ')" == 2 ]]; }
outside=$(git diff --name-only "$old_head" "$new_head" | grep -v -E "^$feature/reviews/(phase-[^/]+/(base\.sha|scaffold\.sha|red-commits)|history-map\.txt)$" \
  | while read -r f; do [[ "$f" =~ ^$feature/reviews/phase-[^/]+/plants\.md$ ]] && base_line_only "$f" || echo "$f"; done || true)
if [[ -n "$outside" ]]; then
  git reset -q --hard "$old_head"
  printf '{"ok":false,"old_head":"%s","problems":["final tree differs outside the evidence files: %s"]}\n' "$old_head" "$(echo $outside)"; exit 1
fi
printf '{"ok":true,"old_head":"%s","new_head":"%s","commits_before":%d,"commits_after":%d,"problems":[]}\n' \
  "$old_head" "$new_head" "${#commits[@]}" "$((new_count + 1))"
