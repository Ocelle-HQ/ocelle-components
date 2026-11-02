#!/usr/bin/env bash
# Prints the latest triage record as JSON:
#   {"record":"triage/NNN-slug.md","triage":N,"decision":"...","status":"...","target":"...","in_scope":"[..]",
#    "semver":"...","spec_prompt":"..."}
# decision is one of mission, op, fold, none, decision-needed, or "invalid" for anything else.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
root=$(triage_root); f=$(triage_latest)
[[ -n "$f" ]] || { printf '{"record":"","decision":"missing","status":"missing"}\n'; exit 0; }
d=$(triage_field "$f" decision)
case "$d" in mission|op|fold|none|decision-needed) ;; *) d=invalid ;; esac
printf '{"record":"%s","triage":%d,"decision":"%s","status":"%s","target":"%s","in_scope":"%s","semver":"%s","spec_prompt":"%s"}\n' \
  "$(triage_json_escape "${f#"$root"/}")" "$((10#$(triage_field "$f" triage)))" "$d" \
  "$(triage_json_escape "$(triage_field "$f" status)")" "$(triage_json_escape "$(triage_field "$f" target)")" \
  "$(triage_json_escape "$(triage_field "$f" in_scope)")" "$(triage_json_escape "$(triage_field "$f" semver)")" \
  "$(triage_json_escape "$(triage_field "$f" spec_prompt)")"
