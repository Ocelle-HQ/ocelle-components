#!/usr/bin/env bash
# Writes the run summary of the current feature into the OKF bundle (knowledge_dir in story-config.yml)
# as runs/<feature>.md, regenerates runs/index.md, and prints {"file": "...", "phases": n}.
# Usage: summary.sh [--commit]   --commit commits only those two files.
# Reads only files under specs/<feature>/: tasks.md and reviews/phase-N/.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
root=$(story_repo_root); feature_dir=$(story_feature_dir); feature=$(basename "$feature_dir")
kdir=$(story_config knowledge_dir); kdir=${kdir:-knowledge/speckit-flows}
[[ "$kdir" =~ ^[A-Za-z0-9._/-]+$ && "$kdir" != /* && "$kdir" != *..* ]] || { echo "story: bad knowledge_dir '$kdir'" >&2; exit 2; }
runs="$root/$kdir/runs"; mkdir -p "$runs"
out="$runs/$feature.md"; now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
rel="../../../${feature_dir#"$root"/}"   # from <kdir>/runs/ back to the repo root; kdir is two levels deep

rows=""; sources=""; phases=0; t_rounds=0; t_blocking=0; t_accepted=0; t_second=0; t_tddfail=0; t_disputed=0
while IFS=$'\t' read -r phase title open total; do
  phases=$((phases + 1))
  dir="$feature_dir/reviews/phase-$phase"
  round=$(story_latest_round "$feature_dir" "$phase")
  verdict="not reviewed"; (( round > 0 )) && verdict=$(story_verdict_of "$dir/round-$round.md")
  tdd=$(sed -n 's/.*"status":"\([a-z]*\)".*/\1/p' "$dir/tdd-check.json" 2>/dev/null | head -n 1); tdd=${tdd:-none}
  reds=0; [[ -s "$dir/red-commits" ]] && reds=$(grep -c . "$dir/red-commits")
  accepted=no; [[ -f "$dir/operator-accepted.md" ]] && accepted=yes
  blocking=""; disputed=0
  for ((k = 1; k <= round; k++)); do
    n=$(grep -cE '^\|[[:space:]]*R[0-9]+-[0-9]+[[:space:]]*\|[[:space:]]*blocking' "$dir/round-$k.md" 2>/dev/null || true)
    blocking+="${blocking:+, }${n:-0}"; t_blocking=$((t_blocking + ${n:-0}))
    d=$(grep -ciE '^\|.*\|[[:space:]]*disputed' "$dir/round-$k-fixes.md" 2>/dev/null || true); disputed=$((disputed + ${d:-0}))
    sources+="  - id: p$phase-r$k"$'\n'"    resource: $rel/reviews/phase-$phase/round-$k.md"$'\n'
  done
  t_rounds=$((t_rounds + round)); t_disputed=$((t_disputed + disputed))
  (( round > 3 )) && t_second=$((t_second + 1))
  [[ $accepted == yes ]] && t_accepted=$((t_accepted + 1))
  [[ $tdd == fail ]] && t_tddfail=$((t_tddfail + 1))
  rows+="| $phase | ${title//|/\\|} | $((total - open))/$total | $round | ${blocking:--} | $verdict | $tdd | $reds | $disputed | $accepted |"$'\n'
done < <(story_phase_table "$feature_dir/tasks.md")

{
  printf -- '---\ntype: Run Summary\ntitle: %s\n' "$feature"
  printf 'description: Review rounds, findings and TDD checks per phase of %s, generated from its review files\n' "$feature"
  printf 'tags: [run, %s]\ngenerated: { by: process:story-summary, at: %s }\n' "$feature" "$now"
  [[ -n "$sources" ]] && printf 'sources:\n%s' "$sources"
  printf -- '---\n\n# Totals\n\n'
  printf '| Phases | Review rounds | Blocking findings | Phases past round 3 | Accepted by operator | TDD check failing now | Disputed findings |\n'
  printf '|---|---|---|---|---|---|---|\n| %d | %d | %d | %d | %d | %d | %d |\n\n' \
    "$phases" "$t_rounds" "$t_blocking" "$t_second" "$t_accepted" "$t_tddfail" "$t_disputed"
  printf '# Phases\n\n'
  printf '| Phase | Title | Tasks done | Rounds | Blocking per round | Verdict | TDD check | Red commits | Disputed | Accepted |\n'
  printf '|---|---|---|---|---|---|---|---|---|---|\n%s' "$rows"
  printf '\nReview files: `%s/reviews/`.\n' "${feature_dir#"$root"/}"
} > "$out"

{
  printf '# Run summaries\n\n'
  for f in "$runs"/*.md; do
    b=$(basename "$f"); [[ "$b" == index.md || "$b" == log.md ]] && continue
    printf '* [%s](%s) - %s\n' "${b%.md}" "$b" "$(sed -n 's/^description:[[:space:]]*//p' "$f" | head -n 1)"
  done
} > "$runs/index.md"

if [[ "${1:-}" == --commit ]]; then
  git add -- "$out" "$runs/index.md"
  git diff --cached --quiet -- "$out" "$runs/index.md" || git commit -q -s -m "docs(flows): run summary for $feature" -- "$out" "$runs/index.md"
fi
printf '{"file":"%s","phases":%d}\n' "$(story_json_escape "${out#"$root"/}")" "$phases"
