# Operator decisions on the T001 recheck (reviews/recheck.md)

- **Date:** 2026-11-17
- **Decided by:** human:jeroennouwsdev

- **Q1, eyebrow tokens:** (a) the column headers use all four of 011's eyebrow tokens (size, tracking, colour and
  weight, weight 600), superseding plan-gate Q-B (a) "medium, ink-muted".
- **Q2, per-instance sheet:** (c) the end fade is written as the measured px inline size of `.region-edge` (as 009's
  module measures it), so the data table's sheet holds only px figures; the README convention is amended only for the
  count of per-instance sheets.
- **Q3, history folds after the merge:** (a) fold each phase with bases at 8ee3351 or later; the main merge commit
  stays in the branch's history and /ocelle-land handles the PR-level shape.
- **Q4, stale line citations:** (a) the planner updates the citations in R-06 and R-07.
- **Q5, pre-upgrade rule placement:** (b) the timeline and chain pre-upgrade rules go in the base layer of `base.css`
  beside 013's facts rule; the per-phase `source.test.ts` changes follow.
- **Q6, the stale end-fade line in `contracts/ocelle-data-table.md` (second recheck pass):** (a) the planner corrects
  the parenthesis to the measured px inline size of `.region-edge.end` in a docs commit; the implementer then
  rechecks that line and ticks T001.
