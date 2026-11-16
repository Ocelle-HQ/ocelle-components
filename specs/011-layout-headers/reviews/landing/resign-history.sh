#!/usr/bin/env bash
# Re-sign one commit in a mission branch without changing anything else (operator decision 11 of mission 011,
# landing of PR #44). fold-history.sh refuses histories with merge commits; this script rebuilds <base>..HEAD with
# git commit-tree, oldest first, keeping every commit's tree, author, committer, dates and message, and the merge
# commits with their outside parents. Only the commits named on the command line gain a Signed-off-by trailer for
# their author. Then one commit remaps base.sha, scaffold.sha and red-commits of every phase to the new SHAs and
# appends a section to <feature>/reviews/history-map.txt. Review files keep the SHAs they were written with.
#
# Usage: resign-history.sh <base-sha> <feature-dir> <commit-to-sign>...
# Runs in a clean tree on the branch; moves the branch to the rebuilt head; keeps the old head as
# refs/ocelle/prefold/resign/<branch>. Never pushes. Exit 0 ok, 1 a verification failed (branch reset), 2 could not run.
set -euo pipefail
base=${1:?base}; feature=${2:?feature-dir}; shift 2
(( $# > 0 )) || { echo "resign: name at least one commit to sign" >&2; exit 2; }
[[ -z "$(git status --porcelain)" ]] || { echo "resign: tree not clean" >&2; exit 2; }
branch=$(git symbolic-ref --short HEAD); old_head=$(git rev-parse HEAD)
base=$(git rev-parse "$base^{commit}")
declare -A sign=() map=()
for c in "$@"; do
  full=$(git rev-parse "$c^{commit}")
  git rev-list "$base..$old_head" | grep -qx "$full" || { echo "resign: $c not in $base..HEAD" >&2; exit 2; }
  sign[$full]=1
done
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

for c in $(git rev-list --reverse --topo-order "$base..$old_head"); do
  parents=()
  for p in $(git log -1 --format=%P "$c"); do parents+=(-p "${map[$p]:-$p}"); done
  # the raw message as stored, so an unsigned commit's message is byte for byte the same
  git cat-file commit "$c" | sed '1,/^$/d' > "$tmp/msg"
  if [[ -n "${sign[$c]:-}" ]]; then
    who=$(git log -1 --format='%an <%ae>' "$c")
    git interpret-trailers --in-place --if-exists addIfDifferent --trailer "Signed-off-by: $who" "$tmp/msg"
  fi
  map[$c]=$(
    GIT_AUTHOR_NAME=$(git log -1 --format=%an "$c") GIT_AUTHOR_EMAIL=$(git log -1 --format=%ae "$c") \
    GIT_AUTHOR_DATE=$(git log -1 --format=%ad --date=raw "$c") \
    GIT_COMMITTER_NAME=$(git log -1 --format=%cn "$c") GIT_COMMITTER_EMAIL=$(git log -1 --format=%ce "$c") \
    GIT_COMMITTER_DATE=$(git log -1 --format=%cd --date=raw "$c") \
    git -c commit.gpgsign=false commit-tree --no-gpg-sign "${parents[@]}" -F "$tmp/msg" "$c^{tree}")
done
new_head=${map[$old_head]}

problems=()
for c in "${!map[@]}"; do
  n=${map[$c]}
  [[ $(git rev-parse "$c^{tree}") == $(git rev-parse "$n^{tree}") ]] || problems+=("tree differs: $c")
  [[ $(git log -1 --format='%an%ae%ad%cn%ce%cd' "$c") == $(git log -1 --format='%an%ae%ad%cn%ce%cd' "$n") ]] \
    || problems+=("identity or date differs: $c")
  if [[ -z "${sign[$c]:-}" ]]; then
    cmp -s <(git cat-file commit "$c" | sed '1,/^$/d') <(git cat-file commit "$n" | sed '1,/^$/d') \
      || problems+=("message differs: $c")
  else
    git cat-file commit "$n" | sed '1,/^$/d' | grep -q '^Signed-off-by: ' || problems+=("not signed: $c")
  fi
done
(( $(git rev-list --count "$base..$old_head") == $(git rev-list --count "$base..$new_head") )) || problems+=("commit count differs")
if (( ${#problems[@]} )); then printf 'resign: %s\n' "${problems[@]}" >&2; exit 1; fi

git update-ref "refs/ocelle/prefold/resign/$branch" "$old_head"
git reset -q --keep "$new_head"

# Remap the evidence SHAs (base.sha, scaffold.sha, red-commits) of every phase, as fold-history.sh does.
changed=0
for f in "$feature"/reviews/phase-*/base.sha "$feature"/reviews/phase-*/scaffold.sha "$feature"/reviews/phase-*/red-commits; do
  [[ -f "$f" ]] || continue
  cp "$f" "$tmp/f"
  for c in "${!map[@]}"; do sed -i "s/$c/${map[$c]}/g" "$tmp/f"; done
  cmp -s "$f" "$tmp/f" || { cp "$tmp/f" "$f"; changed=1; }
done
{
  echo
  echo "# History re-sign of $branch (commits signed: ${!sign[*]}): old commit -> new commit (old head kept as refs/ocelle/prefold/resign/$branch, $old_head)."
  for c in $(git rev-list --reverse --topo-order "$base..$old_head"); do echo "$c ${map[$c]}"; done
} >> "$feature/reviews/history-map.txt"
git add "$feature/reviews"
outside=$(git diff --cached --name-only | grep -vE "^$feature/reviews/(history-map\.txt|phase-[0-9]+/(base\.sha|scaffold\.sha|red-commits))$" || true)
[[ -z "$outside" ]] || { echo "resign: remap touched $outside" >&2; git reset -q --hard "$old_head"; exit 1; }
git commit -q -s -F - <<EOF
chore(landing): remap evidence SHAs after the history fold (re-sign)

The history from $base was rebuilt so that ${!sign[*]} carries a Signed-off-by line;
every tree, author, committer, date and other message is unchanged. Old -> new SHAs are in reviews/history-map.txt.
${RESIGN_TRAILERS:+
$RESIGN_TRAILERS}
EOF
printf '{"ok":true,"old_head":"%s","new_head":"%s","remap_commit":"%s","evidence_changed":%s}\n' \
  "$old_head" "$new_head" "$(git rev-parse HEAD)" "$changed"
