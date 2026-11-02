#!/usr/bin/env bash
# Status of the latest squad round, from its refute.md and latest verify-K.md tables:
#   {"round":R,"lens_files":n,"confirmed":c,"fixes":x,"forks":f,"undecided":u,"verify":k,"unresolved":v,"dir":"..."}
# refute.md rows:  | ID | Verdict (confirmed/refuted/duplicate) | Kind (fix/fork) | Decision | Reason |
# verify-K.md rows: | ID | Status (resolved/unresolved) | Reason |
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
fd=$(squad_feature_dir); base="$fd/reviews/plan"
r=$(squad_latest "$base" round- ""); dir="$base/round-$r"
lens_files=0; confirmed=0; fixes=0; forks=0; undecided=0; k=0; unresolved=0
if (( r > 0 )); then
  lens_files=$( (ls "$dir"/lens-*.yaml 2>/dev/null || true) | wc -l)
  rows=$(squad_table_rows "$dir/refute.md")
  if [[ -n "$rows" ]]; then
    confirmed=$(awk -F'|' '$2 == "confirmed"' <<< "$rows" | wc -l)
    fixes=$(awk -F'|' '$2 == "confirmed" && $3 == "fix"' <<< "$rows" | wc -l)
    forks=$(awk -F'|' '$2 == "confirmed" && $3 == "fork"' <<< "$rows" | wc -l)
    undecided=$(awk -F'|' '$2 == "confirmed" && $3 == "fork" && ($4 == "" || $4 == "-" || $4 == "undecided")' <<< "$rows" | wc -l)
  fi
  k=$(squad_latest "$dir" verify- .md)
  (( k > 0 )) && unresolved=$(squad_table_rows "$dir/verify-$k.md" | awk -F'|' '$2 != "resolved"' | wc -l)
  (( k == 0 )) && unresolved=$confirmed
fi
printf '{"round":%d,"lens_files":%d,"confirmed":%d,"fixes":%d,"forks":%d,"undecided":%d,"verify":%d,"unresolved":%d,"dir":"%s"}\n' \
  "$r" "$lens_files" "$confirmed" "$fixes" "$forks" "$undecided" "$k" "$unresolved" "$(squad_json_escape "$dir")"
