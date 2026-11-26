#!/usr/bin/env bash
# Checks that a delegated role touched only the files it may. Usage: scope-check.sh <role> <base-sha>
# Looks at commits since <base-sha> plus uncommitted and untracked changes. Prints
#   {"role":"...","ok":true|false,"outside":["path", ...]}
# Exit 0 allows the step, 1 rejects paths outside its scope, and 2 means the check could not run.
set -euo pipefail
role=${1:-}; base=${2:-}
declare -A allowed=(
  [triage]='triage/*'
  [review]='specs/*/reviews/phase-* ops/*/reviews/phase-*'
  [landing]='specs/*/reviews/landing/* ops/*/reviews/landing/* triage/*-landing-*.md'
  [spec-check]='specs/*/reviews/spec/* ops/*/reviews/spec/*'
  [analyze]='specs/*/analysis-report.md ops/*/analysis-report.md'
  [lens]='specs/*/reviews/plan/round-*/lens-*.yaml'
  [refute]='specs/*/reviews/plan/round-*'
  [verify]='specs/*/reviews/plan/round-*/verify-*.md'
  [planner]='specs/* ops/*'
  [implement]='*'
)
[[ -n "$role" && -n "${allowed[$role]+x}" ]] || { echo "scope-check: role must be one of: ${!allowed[*]}" >&2; exit 2; }
[[ "$base" =~ ^[0-9a-f]{7,64}$ ]] && git cat-file -e "$base^{commit}" 2>/dev/null || { echo "scope-check: base must be a commit sha" >&2; exit 2; }
root=$(git rev-parse --show-toplevel) && cd "$root" || exit 2
git merge-base --is-ancestor "$base" HEAD || { echo "scope-check: base is not an ancestor of HEAD" >&2; exit 2; }
paths=$(mktemp) || exit 2
trap 'rm -f -- "$paths"' EXIT
# Read exact paths, including both sides of a rename. Check the index and the worktree separately.
git log --format= --diff-merges=first-parent --no-renames --name-only -z "$base..HEAD" -- > "$paths" &&
  git diff --cached --no-renames --name-only -z -- >> "$paths" &&
  git diff --no-renames --name-only -z -- >> "$paths" &&
  git ls-files --others --exclude-standard -z -- >> "$paths" || exit 2
read -r -a pats <<< "${allowed[$role]}"
outside=()
while IFS= read -r -d '' f; do
  ok=false
  for p in "${pats[@]}"; do [[ "$f" == $p ]] && { ok=true; break; }; done
  $ok || outside+=("$f")
done < "$paths"
printf '%s\0' "${outside[@]}" | node -e '
  const outside = [...new Set(require("node:fs").readFileSync(0, "utf8").split("\0").filter(Boolean))].sort();
  console.log(JSON.stringify({ role: process.argv[1], ok: outside.length === 0, outside }));
' "$role" || exit 2
(( ${#outside[@]} == 0 ))
