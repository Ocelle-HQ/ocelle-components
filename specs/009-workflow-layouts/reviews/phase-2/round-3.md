---
phase: 2
round: 3
verdict: changes_requested
base: 247991d7f2fdd7163d768f771279d17014d9c0b3
head: 86ad7fe
tdd_check: pass
reviewer: human:MOES-Media (operator round, recorded by the orchestrator)
---

# Phase 2, round 3: operator round from the landing pass

<!-- Not a reviewer-renata phase review. The /ocelle-land pass of PR #46 found a red CI check and, in the landing review
(reviews/landing/round-1.md), blocking finding L1-02 and notes L1-03, L1-04 and L1-05, all in what phase 2 built (the
overflow-region module, ocelle-scroller and its stories). On 2026-11-16 the operator chose to fix them in this pull
request. Recorded as an operator round so that the fix procedure (label fix-3) and a round 4 review apply. The
operator's answers are quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | storybook/stories/scroller.stories.ts (`scrolled()`); storybook/test/integration/elements-stories.test.ts:223 | CI run 43791016532 (job Unit tests, https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43791016532/job/133049203432) fails 2 of 3774: `elements-ocelle-scroller--overflowing-at-the-end` in light and dark is not at its end when observed. Both pass locally. Likely cause: the story sets `scrollLeft` once at the first `updateComplete`, and the strip grows afterwards (for example when fonts load). Operator: "Operator round on phase 2 (Recommended)". | Red test first that reproduces the late growth deterministically (it must fail on an assertion locally, not only in CI). Then make the end (and middle) story hold its share of the scroll range once the layout settles, and keep the visual capture deterministic. |
| O3-02 | blocking | packages/elements/src/overflow-region.ts:357-358; its equivalent-mutant record | Landing review L1-02: the record calls the mutant `observe(box)` (dropping `{ box: "border-box" }`) equivalent and says test/browser/scrollbar.test.ts covers it; with the mutant applied, all 231 elements-browser and 435 elements tests pass. With classic scrollbars, a board whose lane card grows past the board's end then becomes neither `tabindex="0"` nor `role="region"`. Operator: "Also fix L1-03, L1-04, L1-05". | Red first: an elements-browser test that fails with the mutant applied (classic scrollbars, content growing past the end). Remove the equivalent record, or correct it to name the killing test. |
| O3-03 | blocking | packages/elements/src/overflow-region.ts; contracts/overflow-region.md:120 | Landing review L1-03: the contract says a new box takes over the observer and the attributes, but the code leaves the old box observed and keeps its attributes. This is the seam #13 reuses. Same operator answer. | Red test first; when the box changes, the old box is unobserved and loses the region attributes, and the new box takes them over, as the contract says. |
| O3-04 | blocking | the hostDisconnected wording (phase 2 R2-02) | Landing review L1-04: phase 2's R2-02 wording note is still open. Same operator answer. | Fix the wording R2-02 names, in the contract and any JSDoc or README that repeats it. |
| O3-05 | blocking | the test-only `passCount` counter | Landing review L1-05: `passCount` ships in `dist/` and the browser build. Same operator answer. | Keep the counter out of the shipped build (red first where a test can show it, for example a build-output or manifest assertion), without weakening the tests that use it. Note: the counter is in list-detail code (phase 4); fix it in this round's commits and say so in the fix note. |

## Verdict

changes_requested (operator round).
