#!/usr/bin/env bash
# Records the commit a phase starts from (once) and prints {"phase":"N","base":"<sha>"}.
# The review of the phase diffs from this commit, so it covers the phase's changes and its fixes.
# After merging main, use base.sh <phase> --with-main <full-main-sha> to pin focused replay to that integration.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
story_require_phase "${1:-}"
phase=$1
feature_dir=$(story_feature_dir)
dir="$feature_dir/reviews/phase-$phase"
if (( $# > 1 )); then
  upstream=${3:-}
  if [[ $# != 3 || $2 != --with-main || ! "$upstream" =~ ^([a-f0-9]{40}|[a-f0-9]{64})$ ]]; then
    echo 'usage: base.sh <phase> [--with-main <full-main-sha>]' >&2
    exit 2
  fi
  if [[ ! -s "$dir/base.sha" ]] || ! merge_base=$(git merge-base --all HEAD refs/remotes/origin/main) ||
    [[ "$upstream" != "$merge_base" ]]; then
    echo 'story: pin the unique merge base of HEAD and origin/main for an existing phase' >&2
    exit 2
  fi
  printf '%s\n' "$upstream" > "$dir/replay-upstream.sha"
  printf '{"phase":"%s","replay_upstream":"%s"}\n' "$phase" "$upstream"
  exit 0
fi
mkdir -p "$dir"
[[ -s "$dir/base.sha" ]] || git rev-parse HEAD > "$dir/base.sha"
printf '{"phase":"%s","base":"%s"}\n' "$phase" "$(tr -d '[:space:]' < "$dir/base.sha")"
