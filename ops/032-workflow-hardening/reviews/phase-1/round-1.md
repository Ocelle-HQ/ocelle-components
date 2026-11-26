---
phase: 1
round: 1
verdict: changes_requested
base: b8f06d5c652aae2c308d0a09f3e991e800138004
head: 074388dfa1158881a2fb7df2e73a30622e85ed66
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `tooling/speckit/bin/scope-check.sh:25–29` | The guard checks the net change from the role base to HEAD. In a disposable repository, a planner committed a change to a forbidden path and restored its contents in a second commit. The guard exited 0 with `"ok":true`, so a push chained on success could publish both commits. | Prove the base is an ancestor, examine paths changed across the issued commit range as well as the index and worktree, and record a regression for a forbidden path that is restored later in the range. |
| R1-02 | blocking | `gates/bin/test-shards.ts:67–69`, `gates/lib/test-evidence.ts:227` | The shard job verifies its report after replacing its real index with 0. A direct test of `runTestShards` for shard 1 failed with a diagnostic naming shard 0, while the saved receipt correctly said 1. The new diagnostic can send artifact triage to the wrong shard. | Retain the matrix index in the failed job's diagnostic. Cover a nonzero shard failure and check that the diagnostic and receipt identify the same shard. |
| R1-03 | blocking | `.specify/extensions/story/commands/speckit.story.review.md:37–41,53–56` | The exact reviewed candidate has no hosted Unit tests receipt yet. The changed-source mutation run was still pending when this review started. | Verify passing Unit tests for the exact candidate and inspect the changed-source mutation report before approval. |
| R1-04 | blocking | `ops/032-workflow-hardening/reviews/phase-1/` | The phase has no `plants.md`. A list-only check selects all 326 Plants because `gates/bin/story-evidence.ts` is shared gate source. | Record the phase base, matching selection, and passing Plants evidence. |
| R1-05 | blocking | `ops/032-workflow-hardening/tasks.md:5–14` | T001–T010 remain unchecked. | Close the tasks against the completed work and its evidence. |

## Test quality

Tests-only commit `1412c1d5` records 14 failures on assertions across the scope guard, shard diagnostics, and pinned-main replay. Final replay returned assertion failures on the phase base and passed at `d4d8e368`, with no CI-deferred test files. The intervening commit adds replay records only. No test changed after the tests-only commit. The real Git replay fixture exercises a shared test file and a separate upstream test, rejects a nonintegrated pin, and records the unchanged historical base and red revision. The Planner and landing instructions cover the planned Storybook ownership, pointer delivery, and named check verification.

## Checks run

- Focused red/green evidence inspected. Base exit 1 and head exit 0, with no reported problems.
- Configuration copies and sign-off gates passed. The installed and source replay scripts and reviewer instructions match byte for byte.
- `gate:plants -- --affected b8f06d5c652aae2c308d0a09f3e991e800138004 --list` selected 326 of 326. The command judged no Plant.
- Disposable Git scope reproduction and nonzero shard CLI reproduction confirmed R1-01 and R1-02.

## Earlier findings

First round.
