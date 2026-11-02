#!/usr/bin/env bash
# Checks that a delegated role touched only the files it may. Usage: scope-check.sh <role> <base-sha>
# Looks at commits since <base-sha> plus uncommitted and untracked changes. Prints
#   {"role":"...","ok":true|false,"outside":["path", ...]}
# Always exits 0 (except on bad arguments): the orchestrator redoes a step whose "ok" is false.
set -euo pipefail
role=${1:-}; base=${2:-}
declare -A allowed=(
  [triage]='triage/*'
  [review]='specs/*/reviews/phase-* ops/*/reviews/phase-*'
  [spec-check]='specs/*/reviews/spec/* ops/*/reviews/spec/*'
  [analyze]='specs/*/analysis-report.md ops/*/analysis-report.md'
  [lens]='specs/*/reviews/plan/round-*/lens-*.yaml'
  [refute]='specs/*/reviews/plan/round-*'
  [verify]='specs/*/reviews/plan/round-*/verify-*.md'
  [planner]='specs/* ops/*'
  [implement]='*'
)
[[ -n "$role" && -n "${allowed[$role]+x}" ]] || { echo "scope-check: role must be one of: ${!allowed[*]}" >&2; exit 2; }
[[ "$base" =~ ^[0-9a-f]{7,40}$ ]] && git cat-file -e "$base^{commit}" 2>/dev/null || { echo "scope-check: base must be a commit sha" >&2; exit 2; }
cd "$(git rev-parse --show-toplevel)"
mapfile -t changed < <({ git diff --name-only "$base" HEAD; git status --porcelain --untracked-files=all | sed 's/^...//; s/.* -> //'; } | sort -u)
read -r -a pats <<< "${allowed[$role]}"
outside=()
for f in "${changed[@]}"; do
  [[ -n "$f" ]] || continue
  ok=false
  for p in "${pats[@]}"; do [[ "$f" == $p ]] && { ok=true; break; }; done
  $ok || outside+=("$f")
done
out='['; first=1
for f in "${outside[@]}"; do (( first )) || out+=','; first=0; out+="\"${f//\"/\\\"}\""; done
out+=']'
if (( ${#outside[@]} == 0 )); then ok=true; else ok=false; fi
printf '{"role":"%s","ok":%s,"outside":%s}\n' "$role" "$ok" "$out"
