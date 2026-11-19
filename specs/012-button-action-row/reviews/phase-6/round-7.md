---
phase: 6
round: 7
verdict: changes_requested
base: 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809
head: 571a8ed5
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 6, round 7: operator round on the visual integration test's time limit

<!-- Not a reviewer-renata phase review. CI run 44481594952 on 571a8ed5 failed one job: Unit tests, 1 of 7765 tests,
the visual integration test's 388-story-theme capture timing out at 600 s. The operator decided on 2026-11-19.
Recorded as an operator round on phase 6, which owns the plant and capture sizing (T067, T068), so that the fix
procedure and a round 8 review apply. The operator's answer is quoted verbatim. -->

Operator, 2026-11-19, multiple choice: "Fold a limit raise", described as "Raise the visual integration test's timeout,
for example to 900 s, test-first as a landing fold with an operator round, plus a review and a CI run. That's slower,
but it removes the flake for #49, #54 and 018."

## Evidence

- Run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44481594952, attempt 1, head 571a8ed5: 148 of 149
  jobs green. Unit tests failed:
  `gates/test/integration/visual.test.ts:115: ... captures the repository's 388 story-themes twice under docker and
  exits 0 naming them and the engine (US2 scenario 1): Error: Test timed out in 600000ms.`; "1 of 7765 tests failed".
  The Unit tests job took 2238 s.
- Run 44298568583 on ac2d73a (same 194 stories, 388 story-themes): Unit tests passed; the job took 1817 s.
- The limit is `const timeout = 600_000;` in gates/test/integration/visual.test.ts:26, shared by its tests. At 171
  stories the test took 519 s (landing round 1, R1-06; carried as R2-03).
- Same run: Plants shard 41 (`visual/fail-token-changed`) ran its gate step 624 s, over the 570 s stop-and-ask mark
  (it passed; shard jobs have no timeout). Recorded here; the operator's answer covers the integration test's limit
  only, and the shard time stays with the plant-design follow-up.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O7-01 | blocking | gates/test/integration/visual.test.ts:26 | The 600 s limit of the visual integration tests is too tight at 194 stories (388 story-themes): the whole-repository capture timed out on CI run 44481594952 and passed at 1817 s of job time on the run before. | Raise the limit (for example to 900 s), with the reason and the measurements in the comment; test first, or, as a behaviour-neutral change, with the evidence the reviewer accepts. Update the places that cite the 600 s limit (006 plan's accepted cost, gates/README.md if it says so, ci-run.md or notes). The CI run on the pushed head is the evidence. |

## Verdict

changes_requested (operator round).
