---
phase: 3
round: 10
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 1eaa0f9
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 10: operator round, chunks of one file never share a shard

<!-- Not a reviewer-renata review. The fix round for round 9 (label fix-9, commits f67d2cb and 1eaa0f9) resolved
R8-01 and met the amended FR-013 text, but its fix note (round-9-fixes.md) reports two gaps, which the orchestrator
put to the operator on 2026-11-03 during the /ocelle-land pass of PR #18. The fix round that follows (label fix-10)
resolves O10-01 and O10-02, and a round 11 review covers rounds 9 and 10 together. The answers are quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O10-01 | blocking | gates/lib/mutation/shards.ts (greedy fill); spec.md FR-013, SC-005; research.md R-08 | Entries of one file are filled greedily into the same shard, so `--base bdb9b70 --plan` puts `gates/lib/plant-judge.ts:1-120,gates/lib/plant-judge.ts:121-216` in one shard: the same 353 mutants that took 9:49 on GitHub. The same holds for mutation.ts, pins.ts, plants.ts, pins-rules.ts and plant-repo.ts. The operator's aim in O9-01 ("no shard exceeds ~120 lines of one file") is not met. Operator, answering "Chunks never share (Recommended)": "Two chunks of one file never go in the same shard; a chunk can still share a shard with other files. That gives about 25 shards of at most ~120 lines of any one file. The planner amends the spec, then a test-first fix." | Planner amends FR-013/SC-005/R-08 and adds the task; then red first (`red.sh 3 fix-10`): no shard holds two entries of the same file; the 10-entry and 250-line bounds stay. Re-run `--plan` against bdb9b70 and re-time every shard one at a time in mutation-shards.md. |
| O10-02 | blocking | spec.md FR-013; research.md R-08; gates/README.md; gates/bin/mutation.ts (`--plan` output) | A mutant whose node spans a cut is mutated in no shard (Stryker mutates only nodes wholly inside one range); measured on csp.ts, 279 of 281 mutants across two shards, the two lost being block statements across lines 120/121. Operator, answering "Accept, record it (Recommended)": "The lost mutants are only large blocks across a cut; the statements inside them are still mutated. Record the limit in research R-08 and gates/README.md, and have the plan print how many cuts it made." | Record the limit in R-08, FR-013 (as an accepted limit) and gates/README.md; `--plan` reports the number of cuts it made, red first. |

## Verdict

changes_requested (operator round).
