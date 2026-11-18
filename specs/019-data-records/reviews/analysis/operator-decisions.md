# Operator decisions on the analysis after tasks, 019-data-records

- **Date:** 2026-11-16
- **Decided by:** human:jeroennouwsdev
- **Report:** `specs/019-data-records/analysis-report.md` (1 critical, 0 high, 5 medium, 10 low; coverage 100)

- **C1 (critical), states without a story:** (c). Add stories for a standalone `ocelle-timeline-event` (in the
  timeline's stories file) and a standalone `ocelle-evidence-step` (in the chain's), and record one Principle V
  exception row in the plan's Complexity Tracking, with scope, rationale and a sunset, only for the states named by
  a host `aria-label` (the timeline, the chain and the data table's region; R-09's axe risk), proven by browser tests.
- **I7 (medium), the caption-cap properties across packages:** (a). Document `--data-table-box-size` and
  `--data-table-end-fade` as a base-style hook between `@ocelle/elements` and `@ocelle/styles`: public surface under
  constitution VII, named in both CHANGELOGs and READMEs.
- **Scope of the fix pass:** "Fix medium + low": resolve every medium finding and every low finding with a concrete
  remedy; the optional lows (C2, I5, D1) at the planner's judgement, with the outcome recorded.

## Tasks gate

- **Date:** 2026-11-16, human:jeroennouwsdev
- **Shown:** analysis-status present, 1 critical, 0 high, 5 medium, 10 low, coverage 100 (counts from before the fix
  pass); C1 resolved per (c), I7 per (a), all medium and low findings resolved in `fixes.md` (C2 left for a
  constitution amendment, D1 in part); 78 tasks, 35 stories, 70 baselines.
- **Decision:** approve. Implementation waits until missions 009 (#15) and 013 are on `main`; T001 then rechecks.

## Re-analysis at 4ad3073 (analysis-report.md, 1 critical, 3 medium, 3 low), 2026-11-18, human:jeroennouwsdev

- **C1, block-axis states without a story:** (b) add a "sticky header, unbounded" story (phase 1: 20 stories and 40
  baselines; mission 43 and 86); one Principle V exception row covers only the two scroll-position states (scrolled
  to the block end, and the room-rule state).
- **A1, the pinned-header measure for the room rule and block clearance:** (c) T082's spike measures both (current
  block-end edge and block size as if pinned) at 320 px with a two-line caption and stops for the operator's choice
  before the scaffold.
- **A2, row hover on devices without hover:** (a) wrap the rule in `@media (hover: hover)`, with a body under emulated
  `hover: none` and an element plant that removes the guard.
- **G1, block-axis keys beyond the arrows:** (a) PageUp, PageDown, Home, End, Space and Shift+Space are left to the
  browser; FR-018 and the contract say so; bodies assert each key scrolls the box, the fade follows and the header
  stays pinned.
- **Low findings:** I1 and I2 are fixed in the same pass; C2 stays as it is.
