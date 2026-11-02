#!/usr/bin/env bash
# Links the current feature to the latest approved mission triage record: writes <feature>/triage.ref and commits
# it alone. Fails when there is no approved mission record (constitution: no code change without one).
# Prints {"feature":"...","triage":"..."}.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
root=$(triage_root); cd "$root"
fd=$(sed -n 's/.*"feature_directory"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' .specify/feature.json 2>/dev/null); fd=${fd#"$root"/}
[[ -n "$fd" && -d "$fd" ]] || { echo "triage: no current feature in .specify/feature.json" >&2; exit 1; }
rec=""
for f in $(ls -1 triage/[0-9]*-*.md 2>/dev/null | sort -r); do
  [[ "$(triage_field "$f" status)" == approved && "$(triage_field "$f" decision)" == mission ]] && { rec=$f; break; }
done
[[ -n "$rec" ]] || { echo "triage: no approved mission triage record; run ocelle-triage first" >&2; exit 1; }
printf '%s\n' "$rec" > "$fd/triage.ref"
git add -- "$fd/triage.ref"
git diff --cached --quiet -- "$fd/triage.ref" || git commit -q -s -m "docs(spec): link $(basename "$fd") to $(basename "$rec" .md)" -- "$fd/triage.ref"
printf '{"feature":"%s","triage":"%s"}\n' "$(triage_json_escape "$fd")" "$(triage_json_escape "$rec")"
