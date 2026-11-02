#!/usr/bin/env bash
# Records the commit a phase starts from (once) and prints {"phase":"N","base":"<sha>"}.
# The review of the phase diffs from this commit, so it covers the phase's changes and its fixes.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
story_require_phase "${1:-}"
phase=$1
feature_dir=$(story_feature_dir)
dir="$feature_dir/reviews/phase-$phase"
mkdir -p "$dir"
[[ -s "$dir/base.sha" ]] || git rev-parse HEAD > "$dir/base.sha"
printf '{"phase":"%s","base":"%s"}\n' "$phase" "$(tr -d '[:space:]' < "$dir/base.sha")"
