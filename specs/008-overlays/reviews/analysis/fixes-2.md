# Analysis fixes 2

Input: `specs/008-overlays/analysis-report.md` (head 1f8db65). Operator decision of 2026-11-13 (human:MOES-Media):
the drawer's two inner-edge corners take `--ocelle-radius-2`; the edge against the viewport stays square.
`analysis-report.md` is unchanged. No task was renumbered. research.md R-09 states no drawer shape, so it is unchanged.

| ID | Resolution | Where |
|----|------------|-------|
| U4 | decided: the drawer's two inner-edge corners (the edge facing the page) are `radius-2`; the two corners on the viewport edge are 0. FR-003 states it; data-model § `ocelle-drawer` gives the logical properties per `side`; T036 names them; the drawer Styles row asserts, for each `side` × `dir`, viewport-edge corners 0 and inner-edge corners equal to the computed `radius-2`, with the physical corners spelled out (T030 updated to match). The plan's Constitution Check II and the drawer's note on the dialog's non-inherited rows were aligned. | spec.md FR-003; data-model.md § `ocelle-drawer` (Shape); tasks.md T030, T036; contracts/checks.md § Drawer (preamble, Styles); plan.md Constitution Check II |
