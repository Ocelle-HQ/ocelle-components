#!/usr/bin/env bash
# Shared helpers for the squad extension. Sourced, not executed.
set -euo pipefail
squad_repo_root() { git rev-parse --show-toplevel; }
# Feature directory; needs spec.md only, so it works before plan.md and tasks.md exist.
squad_feature_dir() {
  local root json
  root=$(squad_repo_root)
  json=$("$root/.specify/scripts/bash/check-prerequisites.sh" --json --paths-only 2>/dev/null || true)
  printf '%s' "$json" | sed -n 's/.*"FEATURE_DIR"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}
squad_json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
# Highest N among <dir>/<prefix>N<suffix>, 0 when none.
squad_latest() {
  local dir="$1" prefix="$2" suffix="$3" f n max=0
  for f in "$dir"/"$prefix"*"$suffix"; do
    [[ -e "$f" ]] || continue
    n=${f##*/"$prefix"}; n=${n%"$suffix"}
    [[ "$n" =~ ^[0-9]+$ ]] && (( n > max )) && max=$n
  done
  echo "$max"
}
# Rows of a markdown table whose first cell is a finding id (PLAN-... or SPEC-...), as "id|col2|col3|...".
squad_table_rows() {
  [[ -f "$1" ]] || return 0
  awk -F'|' '/^\|[[:space:]]*(PLAN|SPEC)-[A-Z0-9-]+[[:space:]]*\|/ {
    out=""; for (i = 2; i < NF; i++) { c=$i; gsub(/^[[:space:]]+|[[:space:]]+$/, "", c); out = out (i > 2 ? "|" : "") tolower(c) }
    print out }' "$1"
}
