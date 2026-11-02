#!/usr/bin/env bash
# Prints {"critical":n,"high":n,"medium":n,"low":n,"coverage":"..","present":true|false,"file":"..."} from the
# frontmatter of FEATURE_DIR/analysis-report.md.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
fd=$(squad_feature_dir); file="$fd/analysis-report.md"
num() { local v; v=$(sed -n "1,/^---\$/!{/^---\$/q}; s/^$1:[[:space:]]*\([0-9.]*\).*/\1/p" "$file" 2>/dev/null | head -n 1); printf '%s' "${v:-0}"; }
if [[ -f "$file" ]]; then present=true; else present=false; fi
cov=$(num coverage); [[ "$cov" =~ ^[0-9]+(\.[0-9]+)?$ ]] || cov=0
printf '{"present":%s,"critical":%d,"high":%d,"medium":%d,"low":%d,"coverage":%s,"file":"%s"}\n' \
  "$present" "$(num critical)" "$(num high)" "$(num medium)" "$(num low)" "$cov" "$(squad_json_escape "$file")"
