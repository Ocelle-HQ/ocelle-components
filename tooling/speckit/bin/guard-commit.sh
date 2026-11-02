#!/usr/bin/env bash
# Claude Code PreToolUse hook for Bash. Blocks (exit 2, reason on stderr):
#   - any git commit with --no-verify;
#   - a git commit while code is changed (anything outside the governance paths below) unless the current
#     feature or op is linked to an approved triage record (constitution: no code change without one).
# The current feature is .specify/feature.json; its link is <feature>/triage.ref (a mission) or the
# "triage:" field of <feature>/op.md (an op). Everything else passes untouched.
set -uo pipefail
input=$(cat)
[[ "$input" == *"git commit"* || "$input" == *"git -c"*"commit"* ]] || exit 0
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root"
if [[ "$input" == *"--no-verify"* ]]; then
  echo "Blocked: git commit --no-verify skips the repository's checks." >&2; exit 2
fi
mapfile -t changed < <({ git diff --name-only HEAD 2>/dev/null; git diff --cached --name-only; git ls-files --others --exclude-standard; } | sort -u)
code=()
for f in "${changed[@]}"; do
  [[ -n "$f" ]] || continue
  case "$f" in
    specs/*|ops/*|triage/*|knowledge/*|tooling/*|.specify/*|.claude/*|docs/*|*.md|LICENSE*|.gitignore) ;;
    *) code+=("$f") ;;
  esac
done
(( ${#code[@]} == 0 )) && exit 0
fd=$(sed -n 's/.*"feature_directory"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' .specify/feature.json 2>/dev/null)
fd=${fd#"$root"/}
ref=""
[[ -n "$fd" && -f "$fd/triage.ref" ]] && ref=$(tr -d '[:space:]' < "$fd/triage.ref")
[[ -z "$ref" && -n "$fd" && -f "$fd/op.md" ]] && ref=$(sed -n 's/^triage:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$fd/op.md" | head -n 1)
status=""
[[ -n "$ref" && -f "$ref" ]] && status=$(awk 'NR==1&&$0=="---"{f=1;next} f&&$0=="---"{exit} f&&/^status:/{sub(/^status:[[:space:]]*/,"");print;exit}' "$ref")
if [[ "$status" != approved ]]; then
  echo "Blocked: this commit changes code (${code[*]:0:5}) but the current feature (${fd:-none}) is not linked to an approved triage record (${ref:-no triage.ref or op.md triage field}). Run ocelle-triage or /ocelle-run first; see the constitution's development workflow." >&2
  exit 2
fi
exit 0
