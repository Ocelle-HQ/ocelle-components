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
