#!/usr/bin/env bash
# Records the operator's decision on the latest triage record. Usage: decide.sh approved|rejected
# Sets status, decided_at and decided_by (the operator id) in its frontmatter and commits the record alone.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
case "${1:-}" in approved|rejected) ;; *) echo "triage: decide.sh approved|rejected" >&2; exit 2 ;; esac
f=$(triage_latest); [[ -n "$f" ]] || { echo "triage: no triage record" >&2; exit 1; }
# The operator's id comes from OCELLE_OPERATOR or `git config ocelle.operator`, never from git's user.name (an
# agent's environment may set that to the agent). No id: refuse, so no record names the wrong approver.
who=${OCELLE_OPERATOR:-$(git config ocelle.operator || true)}
[[ "$who" =~ ^[A-Za-z0-9._-]{1,64}$ ]] || { echo "set the operator id: git config ocelle.operator <id> (or OCELLE_OPERATOR)" >&2; exit 1; }
now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
awk -v s="$1" -v w="$who" -v t="$now" '
  NR==1 && $0=="---" {fm=1; print; next}
  fm && /^(decided_at|decided_by):/ {next}
  fm && /^status:/ {print "status: " s; print "decided_by: \"human:" w "\""; print "decided_at: " t; next}
  fm && $0=="---" {fm=0}
  {print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
git add -- "$f"
git commit -q -s -m "docs(triage): $(basename "$f" .md) $1 by the operator" -- "$f"
printf '{"record":"%s","status":"%s"}\n' "$(triage_json_escape "$f")" "$1"
