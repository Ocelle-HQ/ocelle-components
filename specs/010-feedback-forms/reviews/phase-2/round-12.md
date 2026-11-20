---
phase: 2
round: 12
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: fcf85241
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 2, round 12: operator round, a surviving mutant in the announcer's release step

<!-- Not a reviewer-renata review. CI run 44735391703 on 3aeb24ad was a docs-only change from f3a8534b, where run
44727062211 was all green. In that run the `Mutation shard (packages/elements/src/live.ts:151-180, 30)` job failed
with one survivor: "packages/elements/src/live.ts:162: mutation: ConditionalExpression: Survived: replaced by false".
The same shard passed on the same source in run 44727062211. The fake-timer tests in
packages/elements/test/announcer.test.ts never call trigger() while a release is pending (phase `releasing`). Their
hold tests trigger once from `holding`, or trigger and then alert. So only the real-time browser timing tests reach
this line, and they kill the mutant only on some runs. The orchestrator binned the result as a PR defect (a coverage
gap), not a flake. The operator was asked on 2026-11-20 how to go on, and the answer is quoted verbatim. The fix round
that follows resolves O12-01, and a phase 2 review round covers it. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O12-01 | blocking | packages/elements/src/live.ts:162 (`trigger()`: `if (this.phase === "releasing") return;`); packages/elements/test/announcer.test.ts | The `ConditionalExpression` → `false` mutant at line 162 survived on run 44735391703 and was killed on run 44727062211, on identical source. No deterministic test triggers while a held copy waits for its minimum hold. Operator, asked how to proceed: "Fix test-first via op round (Recommended)". The option read: "Record a phase 2 operator round. The planner adds a task. implementer-ivan adds one fake-timer test to announcer.test.ts: hold 'A', trigger at +10 ms and again at +20 ms, and the copy is emptied at W from its write. The test is behaviour-neutral, so the red evidence is the hand-applied mutant (allowed by R-08). Then a review round, the push and CI." | Add a fake-timer test to announcer.test.ts that triggers a second time while a release is pending. It must assert that the pending release is kept: the copy is emptied at W from its write, and the wait then runs W from the empty state. It must fail with line 162's mutant applied by hand, and pass on the current source. Record the hand-applied mutant run as the red evidence (behaviour-neutral coverage fix, as R-08 allows). Then run the mutation gate locally on `packages/elements/src/live.ts:151-180` and show the shard has no survivor. |

## Verdict

changes_requested (operator round).
