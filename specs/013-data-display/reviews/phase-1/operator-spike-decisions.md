# Operator decisions on the phase 1 spike stop (2026-11-14, human:jeroennouwsdev)

Spike record: `reviews/phase-1/spike.md` (commit da01cc2).

- **ResizeObserver loop error:** "(a) Defer + 2-frame wait". The measure pass runs one animation frame after the
  observer callback, not inside it, so a layout switch raises no "ResizeObserver loop completed with undelivered
  notifications". The layout-settle wait polls at least 2 frames before it compares two consecutive frames
  (contracts/checks.md § Oracles "Layout settle" and the T003 `layout` driver test). The old layout shows for one
  frame after an observed resize, which is accepted.
- **Round 3 content margin:** "Widen the margin". The implementer picks content whose two-column size is at least
  16 px either side of the 384 px threshold, re-measures it, and records it in `spike.md` and research R-02.
- **Visual baselines:** as decided earlier in this phase ("Try dockerd first", `operator-decisions.md`).
