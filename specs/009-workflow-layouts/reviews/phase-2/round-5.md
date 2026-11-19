---
phase: 2
round: 5
verdict: changes_requested
base: 247991d7f2fdd7163d768f771279d17014d9c0b3
head: 33e0832
tdd_check: pass
reviewer: human:MOES-Media (operator round, recorded by the orchestrator)
---

# Phase 2, round 5: operator round from the landing pass

<!-- Not a reviewer-renata phase review. CI run 44087406429 on the final landing head 33e0832, which adds only record
commits to 93365f8, failed Unit tests: 1 of 7014, the T067 case for "Overflowing in the middle" in light, with
`first: false`. The same code passed in run 44080933084. On 2026-11-17 the operator chose to fix it through an operator
round on phase 2. The orchestrator recorded it so that the fix procedure (label fix-4) and a round 6 review apply. The
operator's answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O5-01 | blocking | storybook/test/integration/elements-stories.test.ts:262-293 (T067), with `open()` at :98-111 | The T067 case reads the story's first scroll position (`scrollFigures`) as soon as `open()` returns, and `open()` waits only for `updateComplete`. When the strip's layout changes after that, for example when fonts load late, the story's `ResizeObserver` re-writes the position one frame later. A read in between sees a stale position, so `first` is `false`. This is intermittent: [run 44087406429](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44087406429) failed and run 44080933084 passed on the same code. The story's behaviour is right; the test races it. Operator: "Operator round on phase 2 (Recommended)", for the test-only fix: "wait for document.fonts.ready and two animation frames before the first read (as openHovered already does)". | Show the race first. In a commit proven by `red.sh 2 fix-4`, or by a hand-applied reproduction if the reviewer accepts that for a test-only fix, make the page's layout change late, for example by delaying a font or injecting a late width change before the first read. Show the case failing on `first` with the current reads. Then make the T067 reads, and the T020 position check `observeScrollers` (which reads the same position after `open()`), wait for `document.fonts.ready` and two animation frames before reading. Do not loosen any assertion or tolerance. |

## Verdict

changes_requested (operator round).
