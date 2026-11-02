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

# Value of a key in story-config.yml (installed copy first, then the source copy), or empty.
story_config() {
  local root f v
  root=$(story_repo_root)
  for f in "$root/.specify/extensions/story/story-config.yml" "$root/tooling/speckit/extensions/story/story-config.yml"; do
    [[ -f "$f" ]] || continue
    v=$(sed -n "s/^$1:[[:space:]]*//p" "$f" | head -n 1)
    v=${v#\"}; v=${v%\"}
    printf '%s' "$v"
    return
  done
}

# Files changed between two commits that are NOT test files and not under the feature's specs dir.
story_non_test_changes() {
  local from="$1" to="$2" feature_rel="$3" spec
  local -a specs args=()
  read -r -a specs <<< "$(story_config test_pathspec)"
  for spec in "${specs[@]}"; do
    if [[ "$spec" == ":("* ]]; then args+=(":(exclude,${spec#:(}"); else args+=(":(exclude)$spec"); fi
  done
  git diff --name-only "$from" "$to" -- . ":(exclude)$feature_rel" "${args[@]}"
}

# Test files changed between two commits that still exist at the second.
story_test_changes() {
  local -a specs
  read -r -a specs <<< "$(story_config test_pathspec)"
  git diff --name-only --diff-filter=d "$1" "$2" -- "${specs[@]}"
}

# Runs setup and tests in a detached worktree of a commit; prints the test exit code.
# $1 commit, $2 log file, $3 optional: commit whose versions of $4.. files are checked out on top.
story_run_tests_at() {
  local commit="$1" log="$2" overlay="${3:-}" wt code setup tests
  shift 3
  # Commands come from the current configuration, never from the commit being checked out: an old commit may
  # predate the test runner, and its empty test_command would make every run "pass".
  setup=$(story_config setup_command); tests=$(story_config test_command)
  [[ -n "$tests" ]] || { echo "story: test_command is not set" > "$log"; echo 2; return; }
  wt=$(mktemp -d)
  git worktree add --quiet --detach "$wt" "$commit" >/dev/null
  if [[ -n "$overlay" && $# -gt 0 ]]; then (cd "$wt" && git checkout --quiet "$overlay" -- "$@"); fi
  set +e
  (
    cd "$wt"
    { [[ -z "$setup" ]] || bash -c "$setup"; } && bash -c "$tests"
  ) > "$log" 2>&1
  code=$?
  set -e
  git worktree remove --force "$wt" >/dev/null 2>&1 || rm -rf "$wt"
  echo "$code"
}

# Tab-separated "phase title open total" for every "## Phase N:" section of a tasks.md.
story_phase_table() {
  awk '
    function flush() { if (phase != "") printf "%s\t%s\t%d\t%d\n", phase, title, open, total }
    /^## Phase [0-9]+:/ {
      flush()
      phase = $3; sub(/:$/, "", phase)
      title = $0; sub(/^## Phase [0-9]+:[[:space:]]*/, "", title); gsub(/\t/, " ", title)
      open = 0; total = 0; next
    }
    /^## / { flush(); phase = ""; next }
    phase != "" && /^[[:space:]]*- \[[ xX]\] T[0-9]+/ { total++; if ($0 ~ /^[[:space:]]*- \[ \]/) open++ }
    END { flush() }
  ' "$1"
}
