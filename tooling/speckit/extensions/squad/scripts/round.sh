#!/usr/bin/env bash
# Opens the next squad round directory reviews/plan/round-R/ and prints {"round":R,"lenses":[...],"dir":"..."}.
# Round 1 runs every lens; later rounds run only the fresh-eyes lens on the fixed spec and plan.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
fd=$(squad_feature_dir); [[ -n "$fd" ]] || { echo "squad: no feature directory" >&2; exit 1; }
[[ -f "$fd/plan.md" ]] || { echo "squad: no plan.md in $fd" >&2; exit 1; }
base="$fd/reviews/plan"; mkdir -p "$base"
r=$(( $(squad_latest "$base" round- "") + 1 ))
mkdir -p "$base/round-$r"
git rev-parse HEAD > "$base/round-$r/base.sha"
if (( r == 1 )); then lenses='["correctness","a11y-security","testability","fresh"]'; else lenses='["fresh"]'; fi
printf '{"round":%d,"lenses":%s,"dir":"%s"}\n' "$r" "$lenses" "$(squad_json_escape "$base/round-$r")"
