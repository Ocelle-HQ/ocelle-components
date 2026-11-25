#!/usr/bin/env bash
# Independent red/green check of a phase, run before every review. Usage: tdd-check.sh <phase>
# Checks, each in a clean worktree:
#   1. every recorded red commit changes only test files and its tests fail at that commit;
#   2. the phase's final test files, run against the code from before the phase (base), fail
#      (so tests rewritten after the red step cannot pass vacuously);
#   3. if the phase has a scaffold commit (scaffold.sh), the final test files, run against the scaffold, fail too:
#      against the base a missing module alone makes them fail, so only the scaffold run shows they test behaviour;
#   4. the tests pass at HEAD.
# Writes reviews/phase-N/tdd-check.json and prints it, both redacted (op 023). status: pass | fail | exempt | unavailable.
# Always exits 0: the review reads the status, and a "fail" is a blocking finding.
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
story_require_phase "${1:-}"
story_require_redactor
phase=$1
root=$(story_repo_root); feature_dir=$(story_feature_dir); feature_rel=${feature_dir#"$root"/}
focused=$(story_config focused_runner)
if [[ -n "$focused" ]]; then
  cd "$root"
  exec node "$root/$focused" check "$feature_rel" "$phase" "$(story_config setup_command)" "$(story_config test_pathspec)"
fi
dir="$feature_dir/reviews/phase-$phase"; mkdir -p "$dir"
out="$dir/tdd-check.json"
# The record, redacted (op 023), is written and printed.
emit() { printf '%s\n' "$1" | "$(story_redactor)" | tee "$out"; exit 0; }

[[ -f "$dir/base.sha" ]] || emit "{\"phase\":\"$phase\",\"status\":\"fail\",\"problems\":[\"no base.sha: the phase was not started by the story workflow\"]}"
base=$(tr -d '[:space:]' < "$dir/base.sha")
head=$(git rev-parse HEAD)

if [[ -f "$dir/tdd-exempt.md" && ! -s "$dir/red-commits" ]]; then
  emit "{\"phase\":\"$phase\",\"status\":\"exempt\",\"reason_file\":\"$(story_json_escape "$dir/tdd-exempt.md")\",\"head\":\"$head\"}"
fi
[[ -n "$(story_config test_command)" ]] || emit "{\"phase\":\"$phase\",\"status\":\"unavailable\",\"problems\":[\"test_command is not set in story-config.yml\"],\"head\":\"$head\"}"

problems=()
reds='['
first=1
if [[ -s "$dir/red-commits" ]]; then
  while read -r label sha; do
    [[ -n "$label" ]] || continue
    non_test=$(story_non_test_changes "$sha^" "$sha" "$feature_rel" | tr '\n' ' ')
    code=$(story_run_tests_at "$sha" "$dir/check-red-$label.log" "")
    [[ -z "$non_test" ]] || problems+=("red commit $label ($sha) changes non-test files: $non_test")
    (( code != 0 )) || problems+=("red commit $label ($sha): tests pass, so they were not red")
    git merge-base --is-ancestor "$sha" "$head" || problems+=("red commit $label ($sha) is not in the history of HEAD")
    (( first )) || reds+=','; first=0
    reds+="{\"label\":\"$label\",\"sha\":\"$sha\",\"exit_code\":$code}"
  done < "$dir/red-commits"
else
  problems+=("no red commit recorded (red.sh) and no tdd-exempt.md")
fi
reds+=']'

mapfile -t final_tests < <(story_test_changes "$base" "$head")
if (( ${#final_tests[@]} == 0 )); then
  problems+=("the phase changed no test file")
  vs_base=null
else
  vs_base=$(story_run_tests_at "$base" "$dir/check-final-tests-on-base.log" "$head" "${final_tests[@]}")
  (( vs_base != 0 )) || problems+=("the final tests pass against the code from before the phase: they do not test the change")
fi

if [[ -f "$dir/scaffold.sha" ]]; then
  scaffold=$(tr -d '[:space:]' < "$dir/scaffold.sha")
  if (( ${#final_tests[@]} > 0 )); then
    vs_scaffold=$(story_run_tests_at "$scaffold" "$dir/check-final-tests-on-scaffold.log" "$head" "${final_tests[@]}")
    (( vs_scaffold != 0 )) || problems+=("the final tests pass against the scaffold (no behaviour): they do not test the change")
  fi
  git merge-base --is-ancestor "$scaffold" "$head" || problems+=("scaffold commit ($scaffold) is not in the history of HEAD")
else
  vs_scaffold=null
fi

at_head=$(story_run_tests_at "$head" "$dir/check-head.log" "")
(( at_head == 0 )) || problems+=("tests fail at HEAD")

status=pass; (( ${#problems[@]} == 0 )) || status=fail
plist='['; first=1
for p in "${problems[@]}"; do (( first )) || plist+=','; first=0; plist+="\"$(story_json_escape "$p")\""; done
plist+=']'
emit "{\"phase\":\"$phase\",\"status\":\"$status\",\"base\":\"$base\",\"head\":\"$head\",\"red_commits\":$reds,\"final_tests_on_base_exit\":$vs_base,\"final_tests_on_scaffold_exit\":${vs_scaffold:-null},\"head_exit\":$at_head,\"problems\":$plist}"
