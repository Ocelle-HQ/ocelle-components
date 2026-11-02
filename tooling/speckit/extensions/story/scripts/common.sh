#!/usr/bin/env bash
# Shared helpers for the story extension. Sourced, not executed.
set -euo pipefail

story_repo_root() { git rev-parse --show-toplevel; }

# Absolute feature directory of the current feature, from Spec Kit's own prerequisite check.
story_feature_dir() {
  local root json
  root=$(story_repo_root)
  json=$("$root/.specify/scripts/bash/check-prerequisites.sh" --json --require-tasks --include-tasks)
  printf '%s' "$json" | sed -n 's/.*"FEATURE_DIR"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# Fails unless the argument is a phase number (the only value that ever reaches a path or a shell).
story_require_phase() {
  [[ "${1:-}" =~ ^[0-9]+$ ]] || { echo "story: phase must be a number, got '${1:-}'" >&2; exit 2; }
}

story_json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

# Highest review round recorded for a phase, 0 when none.
story_latest_round() {
  local dir="$1/reviews/phase-$2" n max=0 f
  [[ -d "$dir" ]] || { echo 0; return; }
  for f in "$dir"/round-*.md; do
    [[ -e "$f" ]] || continue
    n=${f##*/round-}; n=${n%.md}
    [[ "$n" =~ ^[0-9]+$ ]] && (( n > max )) && max=$n
  done
  echo "$max"
}

# Verdict line of a review file: approved | changes_requested | missing.
story_verdict_of() {
  local file="$1" v
  [[ -f "$file" ]] || { echo missing; return; }
  v=$(sed -n 's/^verdict:[[:space:]]*\([a-z_]*\).*/\1/p' "$file" | head -n 1)
  case "$v" in approved|changes_requested) echo "$v" ;; *) echo missing ;; esac
}
