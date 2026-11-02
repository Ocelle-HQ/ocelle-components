#!/usr/bin/env bash
# Records a phase's scaffold commit. Usage: scaffold.sh <phase>
# Run right after committing the scaffold: the new modules with their signatures and no behaviour, so the red
# tests that follow fail on their assertions, not on a missing module. At most one scaffold per phase, before the
# red commit. The commit must change no test file. Writes reviews/phase-N/scaffold.sha and prints
#   {"phase":"N","sha":"...","tests_touched":false,"recorded":true}
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
story_require_phase "${1:-}"
phase=$1
root=$(story_repo_root); feature_dir=$(story_feature_dir)
dir="$feature_dir/reviews/phase-$phase"; mkdir -p "$dir"
[[ -f "$dir/base.sha" ]] || { echo "story: run base.sh $phase before the scaffold" >&2; exit 1; }
[[ -s "$dir/red-commits" ]] && { echo "story: phase $phase already has a red commit; the scaffold comes before it" >&2; exit 1; }
[[ -f "$dir/scaffold.sha" ]] && { echo "story: phase $phase already has a scaffold ($(cat "$dir/scaffold.sha"))" >&2; exit 1; }
sha=$(git rev-parse HEAD); base=$(tr -d '[:space:]' < "$dir/base.sha")
[[ "$sha" != "$base" ]] || { echo "story: commit the scaffold first" >&2; exit 1; }
touched=$(story_test_changes "$sha^" "$sha" | head -n 1)
if [[ -n "$touched" ]]; then
  printf '{"phase":"%s","sha":"%s","tests_touched":true,"recorded":false}\n' "$phase" "$sha"; exit 1
fi
echo "$sha" > "$dir/scaffold.sha"
printf '{"phase":"%s","sha":"%s","tests_touched":false,"recorded":true}\n' "$phase" "$sha"
