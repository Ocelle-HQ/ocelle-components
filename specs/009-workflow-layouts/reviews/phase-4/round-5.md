---
phase: 4
round: 5
verdict: changes_requested
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: 86ad7fe
tdd_check: pass
reviewer: human:MOES-Media (operator round, recorded by the orchestrator)
---

# Phase 4, round 5: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #46 (reviews/landing/round-1.md) found
blocking finding L1-01 in ocelle-list-detail, which phase 4 built. On 2026-11-16 the operator chose to fix it in this
pull request, red first. Recorded as an operator round so that the fix procedure (label fix-4) and a round 6 review
apply. The operator's answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O5-01 | blocking | packages/elements/src/list-detail-measure.ts:67-87; ocelle-list-detail.ts:217-221, 295-299, 329 | Landing review L1-01: an `ocelle-list-detail` that first renders while hidden (in a closed `<dialog>`, under a `display: none` ancestor, or a `hidden` host) writes 0 px for both intrinsic sizes in the only pass after upgrade. Shown later, the probe's ResizeObserver re-chooses the tier but schedules no pass, so it stays at 0 px in one column (reproduced: closed dialog opened with `showModal()` shows 0 px, one column, where an open dialog gives 1100 px, three columns). `remeasure()` on a hidden element reads `auto`, sets the measured size to `NaN` and picks the wrong tier. Breaks FR-025; the README names a dialog as a shrink-to-fit host. Operator: "Fix it, red first (Recommended)". | Red test first: a closed `<dialog>` opened with `showModal()`, and a hidden wrapper (inline-block and flex item) that is then shown, each reaching the same figures and tier as when rendered from the start; and `remeasure()` on a hidden element writing no `NaN`. Fix: run a fresh pass when the element becomes rendered, and make a pass on a hidden element write nothing. Update FR-025, the contract and the README where they describe passes. |

## Verdict

changes_requested (operator round).
