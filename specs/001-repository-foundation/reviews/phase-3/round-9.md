---
phase: 3
round: 9
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: cb128ad
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 9: operator round, shard split within files

<!-- Not a reviewer-renata review. Round 8 (changes_requested, R8-01) is open. On 2026-11-03, during the /ocelle-land
pass of PR #18, GitHub run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41635769914 (head fffb7e7)
took 9:49 for the shard `gates/lib/plant-judge.ts` alone (216 changed lines, 353 mutants) against the 10-minute
limit. The operator chose to fold a fix into this phase's next fix round. The fix round that follows (label fix-9)
resolves both R8-01 of round 8 and O9-01 below, and a round 10 review covers both. The answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O9-01 | blocking | gates/lib/mutation/shards.ts, gates/lib/mutation/ranges.ts, gates/bin/mutation.ts (`--plan`, `--files`); spec.md FR-013, SC-005; research.md R-08 | A single file is always one shard, so the line bound cannot shorten it; plant-judge.ts reached 9:49 of 10 minutes. Operator, answering "Split within files (Recommended)": "Fold it into the phase 3 fix round that's coming anyway (R8-01): the shard planner splits one file's changed line ranges across shards (Stryker already takes path:start-end), so no shard exceeds ~120 lines of one file. Needs an FR-013 amendment, test-first." | Planner amends FR-013/SC-005/R-08 and adds the task; then red first (`red.sh 3 fix-9`): the plan splits a file whose changed lines exceed the per-file bound into several shard entries by line range, `--files` (or its successor) accepts `path:start-end` entries, and the mutation run limits Stryker to those ranges; CI's matrix passes them through unchanged. |
| R8-01 | blocking | see round-8.md | Carried from round 8 (line terminators in paths). | As round-8.md says. |

## Verdict

changes_requested (operator round).
