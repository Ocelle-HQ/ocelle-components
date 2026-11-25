#!/usr/bin/env bash
# Records a red commit and proves it is red. Usage: red.sh <phase> <label>
#   label: "phase" for the phase's tests, "fix-<round>" for a review fix's tests.
# Run right after committing the failing tests (tests only). Runs the tests at that commit (the log redacted, op 023) and,
# only when the commit is tests-only AND red, appends "<label> <sha>" to reviews/phase-N/red-commits.
# A commit that is not red is not recorded: strengthen the tests, amend, and run again. Prints
#   {"phase":"N","label":"...","sha":"...","tests_only":true,"red":true,"log":"..."}
# "red" must be true: tests that pass before the implementation exist prove nothing.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
story_require_phase "${1:-}"
story_require_redactor
phase=$1; label=${2:-phase}
[[ "$label" =~ ^(phase|fix-[0-9]+)$ ]] || { echo "story: label must be 'phase' or 'fix-<round>'" >&2; exit 2; }
root=$(story_repo_root); feature_dir=$(story_feature_dir); feature_rel=${feature_dir#"$root"/}
focused=$(story_config focused_runner)
if [[ -n "$focused" ]]; then
  cd "$root"
  exec node "$root/$focused" red "$feature_rel" "$phase" "$(story_config setup_command)" "$(story_config test_pathspec)" "$label"
fi
dir="$feature_dir/reviews/phase-$phase"; mkdir -p "$dir"
sha=$(git rev-parse HEAD)
[[ -n "$(story_config test_command)" ]] || { printf '{"phase":"%s","label":"%s","sha":"%s","status":"unavailable","reason":"test_command is not set in story-config.yml"}\n' "$phase" "$label" "$sha"; exit 0; }
non_test=$(story_non_test_changes "$sha^" "$sha" "$feature_rel")
log="$dir/red-$label.log"
code=$(story_run_tests_at "$sha" "$log" "")
tests_only=true; [[ -z "$non_test" ]] || tests_only=false
red=false; (( code != 0 )) && red=true
recorded=false
if [[ "$tests_only" == true && "$red" == true ]]; then
  sed -i "/^$label /d" "$dir/red-commits" 2>/dev/null || true
  echo "$label $sha" >> "$dir/red-commits"
  recorded=true
fi
printf '{"phase":"%s","label":"%s","sha":"%s","tests_only":%s,"red":%s,"recorded":%s,"exit_code":%d,"log":"%s"}\n' \
  "$phase" "$label" "$sha" "$tests_only" "$red" "$recorded" "$code" "$(story_json_escape "$log")"
