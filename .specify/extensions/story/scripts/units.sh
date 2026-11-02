#!/usr/bin/env bash
# Prints a JSON array of the tasks.md phases that still need work: a phase with open tasks,
# or a phase whose latest review is not approved (unless the operator accepted that round). Each entry:
#   {"phase":3,"title":"User Story 1 - ...","story":"US1","open":4,"total":6,"latest_round":0,"verdict":"missing"}
# A phase is one "## Phase N: ..." section of tasks.md; user-story phases carry their USn.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

feature_dir=$(story_feature_dir)
tasks="$feature_dir/tasks.md"
[[ -f "$tasks" ]] || { echo "story: no tasks.md in $feature_dir" >&2; exit 1; }

first=1
printf '['
while IFS=$'\t' read -r phase title open total; do
  round=$(story_latest_round "$feature_dir" "$phase")
  verdict=missing
  (( round > 0 )) && verdict=$(story_verdict_of "$feature_dir/reviews/phase-$phase/round-$round.md")
  if (( open == 0 )) && [[ "$verdict" == approved ]]; then continue; fi
  accepted="$feature_dir/reviews/phase-$phase/operator-accepted.md"
  if (( open == 0 )) && [[ -f "$accepted" ]] \
    && [[ "$(sed -n 's/^accepted_round:[[:space:]]*//p' "$accepted")" == "$round" ]]; then continue; fi
  (( total == 0 )) && continue
  story=$(printf '%s' "$title" | grep -oE 'User Story [0-9]+' | head -n 1 | sed 's/User Story /US/' || true)
  (( first )) || printf ','
  first=0
  printf '{"phase":%d,"title":"%s","story":"%s","open":%d,"total":%d,"latest_round":%d,"verdict":"%s"}' \
    "$phase" "$(story_json_escape "$title")" "$story" "$open" "$total" "$round" "$verdict"
done < <(awk '
  function flush() { if (phase != "") printf "%s\t%s\t%d\t%d\n", phase, title, open, total }
  /^## Phase [0-9]+:/ {
    flush()
    phase = $3; sub(/:$/, "", phase)
    title = $0; sub(/^## Phase [0-9]+:[[:space:]]*/, "", title); gsub(/\t/, " ", title)
    open = 0; total = 0; next
  }
  /^## / { flush(); phase = ""; next }
  phase != "" && /^[[:space:]]*- \[[ xX]\] T[0-9]+/ { total++; if ($0 ~ /^[[:space:]]*- \[ \]/) open++ }
  END { flush() }
' "$tasks")
printf ']\n'
