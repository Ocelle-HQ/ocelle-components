#!/usr/bin/env bash
# Redacts sandbox paths (op 023, #60; ops/023-public-repo-hygiene/spec.md FR-006). Usage:
#   redact-sandbox-paths.sh                       stdin to stdout
#   redact-sandbox-paths.sh --in-place <file>...  rewrites each file (no backup)
#   redact-sandbox-paths.sh --verify <rev>        checks <rev> against its first parent (FR-011)
#   redact-sandbox-paths.sh --verify <from>..<to> checks that range
# A sandbox path is a match of the rule of FR-001 (gates/lib/sandbox-paths.ts). Only the matched prefix changes, in
# this order: pnpm's store (the root home's .local/share/pnpm/store/v<N>) becomes <pnpm store>; the checkout root (the
# user home's ocelle-components, when no path-name character follows it) becomes <repo>; any other prefix of the root
# home or the user home followed by a path-name character becomes <home>/. The character before the path is kept, and
# every other byte, the lines and their order stay. Each substitution repeats until the line holds no match, so a
# match right after another one is redacted too. This source writes each prefix with a group after its leading
# slash, so it holds no line that matches the rule.
# --verify (op 023, FR-011) proves a commit is only this redaction: each file of `git diff --raw --no-renames` must be
# a modified regular file, with the same mode on both sides, whose new blob is byte for byte this program run over its
# old blob (cmp). It exits 0 with a summary, 1 with one finding per file, and 2 with a cause. It reads git objects
# only: it writes no file and no index, and prints no line of a file.
set -euo pipefail
export LC_ALL=C

usage() { echo "usage: redact-sandbox-paths.sh [--in-place <file>... | --verify <rev> | --verify <from>..<to>]" >&2; exit 2; }

before='(^|[^A-Za-z0-9._~-])'
program="
:store
s#${before}/(root)/\\.local/share/pnpm/store/v[0-9]+#\\1<pnpm store>#
t store
:repo
s#${before}/(home)/(user)/ocelle-components([^A-Za-z0-9._-]|\$)#\\1<repo>\\4#
t repo
:home
s#${before}/(root|home/user)/([A-Za-z0-9._-])#\\1<home>/\\3#
t home
"

verify_fail() { echo "redact-sandbox-paths: verify: $1" >&2; exit 2; }

verify_commit() {
  git rev-parse --verify --quiet "$1^{commit}" > /dev/null || verify_fail "$1 is not a commit"
}

verify_finding() { echo "redact-sandbox-paths: verify: $1: $2"; findings=$((findings + 1)); }

verify() {
  [[ $# -eq 1 ]] || verify_fail "takes exactly one argument, <rev> or <from>..<to>"
  local err code=0 from to
  err=$(git rev-parse --git-dir 2>&1 > /dev/null) || verify_fail "${err%%$'\n'*}"
  if [[ "$1" == *..* ]]; then
    from=${1%%..*}; to=${1#*..}
    verify_commit "$from"; verify_commit "$to"
  else
    to=$1; from="$1^1"
    verify_commit "$to"
    git rev-parse --verify --quiet "$from^{commit}" > /dev/null || verify_fail "$to has no parent"
  fi
  # git diff --quiet: 0 is no change, 1 is a change, anything else is a git failure (its first error line).
  err=$(git diff --quiet --no-renames "$from" "$to" 2>&1 > /dev/null) || code=$?
  case $code in
    0) verify_fail "no change in $from..$to" ;;
    1) ;;
    *) verify_fail "${err%%$'\n'*}" ;;
  esac
  local entries=()
  mapfile -d '' entries < <(git diff --raw --no-renames -z "$from" "$to")
  local findings=0 files=0 i path old_mode new_mode status
  for (( i = 0; i + 1 < ${#entries[@]}; i += 2 )); do
    path=${entries[i+1]}; files=$((files + 1))
    read -r old_mode new_mode _ _ status <<< "${entries[i]#:}"
    case "$status" in
      A) verify_finding "$path" added; continue ;;
      D) verify_finding "$path" deleted; continue ;;
    esac
    if [[ "$old_mode" != "$new_mode" ]]; then verify_finding "$path" "mode changed"; continue; fi
    if [[ "$new_mode" != 100644 && "$new_mode" != 100755 ]]; then verify_finding "$path" "not a regular file"; continue; fi
    cmp -s <(git cat-file blob "$from:$path" | sed -E -e "$program") <(git cat-file blob "$to:$path") \
      || verify_finding "$path" "not the redaction of its old content"
  done
  (( findings == 0 )) || exit 1
  echo "redact-sandbox-paths: verify: $files files changed, each only by the redaction"
}

case "${1:-}" in
  "") [[ $# -eq 0 ]] || usage; exec sed -E -e "$program" ;;
  --in-place) shift; [[ $# -gt 0 ]] || usage; exec sed -E -i -e "$program" -- "$@" ;;
  --verify) shift; verify "$@" ;;
  *) usage ;;
esac
