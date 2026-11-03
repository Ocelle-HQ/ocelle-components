---
phase: 3
round: 5
verdict: changes_requested
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: 085c786
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 5: operator addendum at the feature gate

<!-- Not a reviewer-renata review. Phase 3 was approved in round 4 with notes R4-02 and R4-03, to be offered to the
operator at mission end. At the feature gate on 2026-11-03 the operator chose to fix them in this pull request. As
for round 3, the orchestrator records the decision as a round so that the fix procedure (label fix-5) and a round 6
review apply. The operator's answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O5-01 | blocking | gates/lib/spawn.ts (`child.on("error")`) | Round 4 note R4-02: no test kills a mutant of the spawn error path (a command that cannot be started). Operator: "Fix in this PR" ("One more fix round now, test-first, before merge."). | A test that starts a command that does not exist through `gates/lib/spawn.ts` and asserts the exact outcome the gate contract requires (exit 2, "could not run"), red first. If the line can only be reached through a process boundary, a `gates-integration` case, and the record on it names that case (research.md R-08). |
| O5-02 | blocking | gates/bin/config-copies.ts, gates/bin/test-lint.ts (equivalent-mutant records) | Round 4 note R4-03: these records do not name their covering `gates-integration` case, as research.md R-08 requires. Operator: "Fix in this PR". | Each record names the integration case that runs its line; where no such case exists, add it red first, or remove the record and kill the mutant. |

## Verdict

changes_requested (operator addendum).
