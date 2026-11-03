---
phase: 4
round: 5
verdict: changes_requested
base: 4df12b0823f1a777cf37c501271201fdf4daca64
head: 39616dc
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 4, round 5: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #18 (reviews/landing/round-1.md) found
L1-04 and L1-05 (notes) in the plant runner, which phase 4 built. On 2026-11-03 the operator chose to fold both into
this pull request. Recorded as an operator round so that the fix procedure (label fix-5) and a round 6 review apply.
The operator's answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O5-01 | blocking | gates/lib/plant-judge.ts (breaking `error` plants) | Landing review L1-04: a breaking plant passes on any exit 2; the cause is never checked, so a plant that breaks for an unrelated reason still counts as proving the gate's "could not run" path. Operator: "L1-04, L1-05 plants (Recommended)": "Breaking plants check the cause of exit 2, not just the code; pass plants may not set 'base'." | Red test first; a breaking plant states the expected cause (for example a substring of the gate's "could not run" message, a new optional plant.json field documented in data-model.md and contracts/plants.md), and the judge fails the plant when exit 2 comes with a different cause. Update every existing breaking plant. |
| O5-02 | blocking | gates/lib/plant-judge.ts / plant-runner.ts (`base` field) | Landing review L1-05: `base` is accepted on pass plants, so a pass plant with `base: HEAD` could pass vacuously. Same operator answer. | Red test first; `base` is rejected (plant definition error) on pass plants, and allowed only where contracts/plants.md says. |

## Verdict

changes_requested (operator round).
