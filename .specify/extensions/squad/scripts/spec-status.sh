#!/usr/bin/env bash
# Prints {"check":k,"verdict":"clean|issues|missing","blocking":n,"operator_questions":q,"file":"..."} for the latest
# spec check (reviews/spec/check-K.md).
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
fd=$(squad_feature_dir); [[ -n "$fd" ]] || { echo "squad: no feature directory" >&2; exit 1; }
dir="$fd/reviews/spec"; k=$(squad_latest "$dir" check- .md); file="$dir/check-$k.md"
verdict=missing; blocking=0; questions=0
if (( k > 0 )); then
  v=$(sed -n 's/^verdict:[[:space:]]*\([a-z]*\).*/\1/p' "$file" | head -n 1)
  case "$v" in clean|issues) verdict=$v ;; esac
  blocking=$(squad_table_rows "$file" | awk -F'|' '$2 == "blocking"' | wc -l)
  questions=$(squad_table_rows "$file" | awk -F'|' '$2 == "operator"' | wc -l)
fi
printf '{"check":%d,"verdict":"%s","blocking":%d,"operator_questions":%d,"file":"%s"}\n' "$k" "$verdict" "$blocking" "$questions" "$(squad_json_escape "$file")"
