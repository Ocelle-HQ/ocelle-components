#!/usr/bin/env bash
set -euo pipefail
triage_root() { git rev-parse --show-toplevel; }
triage_json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/ /g'; }
# Latest triage/NNN-*.md, or empty.
triage_latest() {
  local root f n max=0 best=""
  root=$(triage_root)
  for f in "$root"/triage/[0-9]*-*.md; do
    [[ -e "$f" ]] || continue
    n=${f##*/}; n=${n%%-*}; n=$((10#$n))
    (( n > max )) && { max=$n; best=$f; }
  done
  printf '%s' "$best"
}
# Value of a frontmatter key (first block only), quotes stripped.
triage_field() {
  local v
  v=$(awk -v k="$2" 'NR==1 && $0=="---" {fm=1; next} fm && $0=="---" {exit} fm && index($0, k":")==1 {sub("^"k":[[:space:]]*", ""); print; exit}' "$1")
  v=${v#\"}; v=${v%\"}; printf '%s' "$v"
}
