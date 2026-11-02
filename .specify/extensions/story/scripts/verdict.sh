#!/usr/bin/env bash
# Prints {"phase":"N","round":k,"verdict":"approved|changes_requested|missing","file":"..."} for the latest review.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
story_require_phase "${1:-}"
phase=$1
feature_dir=$(story_feature_dir)
round=$(story_latest_round "$feature_dir" "$phase")
file="$feature_dir/reviews/phase-$phase/round-$round.md"
verdict=missing
(( round > 0 )) && verdict=$(story_verdict_of "$file")
printf '{"phase":"%s","round":%d,"verdict":"%s","file":"%s"}\n' "$phase" "$round" "$verdict" "$(story_json_escape "$file")"
