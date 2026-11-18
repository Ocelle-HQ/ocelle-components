# Analysis after tasks: fixes 2

Applied from `analysis-report.md` (head 321ea0f; 0 critical, 0 high, 1 medium, 4 low) with the operator's decisions
in `operator-decisions.md`, section "On the re-run analysis". No task ID changed and no task was added. No new
analysis run follows, as the operator decided.

| ID | Resolution | Where |
|----|------------|-------|
| U1 | decided: new plant | spec pairing table row "Content changes while scrolled" (plant: the fades and the tab stop computed from a cached `scrollLeft`, the value before the removal, instead of the clamped one), operator decisions on the re-run analysis; tasks T032 edge case "Content changes while scrolled" (new plant; the old one stays US1-3's); plan phase 3 edge cases |
| F5 | fixed | tasks T032 US2-14 (second plant: the board's `::slotted(*)` without inline-size containment, as plan phase 3 and R-08 say); contracts/overflow-region.md (the board's "slotted children's `contain: inline-size`") |
| F6 | fixed | tasks T033 (no [P]; it follows T032, whose bodies it runs), Parallel Opportunities phase 3 |
| C8 | fixed | tasks T036 § `ocelle-workflow-board` ("a board holds lanes") |
| F7 | decided: reword now | spec Edge Case "One lane, or no lanes" (the board's inline size less its ring room on each inline side), operator decisions on the re-run analysis |

**Notes.**

- U1: the cached value is the end position read before the removal. After the second removal the board fits, so a
  correct state has no fade, while the cached `scrollLeft` (above 0) keeps the start fade, so the case is expected to
  fail on the plant even though the clamp's `scroll` event fires. T044 still proves that it bites. US1-3 keeps the
  `slotchange` and resize plant.
