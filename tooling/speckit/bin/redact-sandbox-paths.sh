#!/usr/bin/env bash
# Redacts sandbox paths (op 023, #60; ops/023-public-repo-hygiene/spec.md FR-006). Usage:
#   redact-sandbox-paths.sh                       stdin to stdout
#   redact-sandbox-paths.sh --in-place <file>...  rewrites each file (no backup)
# A sandbox path is a match of the rule of FR-001 (gates/lib/sandbox-paths.ts). Only the matched prefix changes, in
# this order: pnpm's store (the root home's .local/share/pnpm/store/v<N>) becomes <pnpm store>; the checkout root (the
# user home's ocelle-components, when no path-name character follows it) becomes <repo>; any other prefix of the root
# home or the user home followed by a path-name character becomes <home>/. The character before the path is kept, and
# every other byte, the lines and their order stay. Each substitution repeats until the line holds no match, so a
# match right after another one is redacted too. This source writes each prefix with a group after its leading
# slash, so it holds no line that matches the rule.
set -euo pipefail
export LC_ALL=C

usage() { echo "usage: redact-sandbox-paths.sh [--in-place <file>...]" >&2; exit 2; }

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

case "${1:-}" in
  "") [[ $# -eq 0 ]] || usage; exec sed -E -e "$program" ;;
  --in-place) shift; [[ $# -gt 0 ]] || usage; exec sed -E -i -e "$program" -- "$@" ;;
  *) usage ;;
esac
