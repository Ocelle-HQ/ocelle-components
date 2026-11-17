# R-04 amendment after phase 2 (operator decision 5)

Applied by the planner under operator decision 5 of `reviews/operator-decisions-implementation.md` (reviews R1-04,
R2-03, R3-02; `round-1-fixes.md`; `notes.md` departures 4 and 6). It brings `research.md` to the section header as
built in `packages/elements/src/ocelle-section-header.ts`, before phase 3 builds the page header from it.

## Changed

- `research.md` R-04, Decision: the actions wrapper keeps the initial `flex: 0 1 auto` (was `flex: 0 0 auto`), so
  actions on a line of their own shrink to it and wrap rather than overflow; six actions at 320 px fit (FR-004). The
  side-by-side test of FR-010 is unchanged, since flex line breaking uses unshrunk sizes.
- `research.md` R-04, Decision: the heading column is hidden while it shows nothing (empty `heading`, and empty
  `description` or the eyebrow variant), and the actions then take `margin-inline-start: auto`
  (`.heading-column.empty + .actions`) to stay at the inline end (FR-005, FR-010). The row's own hiding when heading,
  description and actions are all empty, already built, is stated too. R-04 says the page header uses these rules.
- `research.md` R-04, Rationale: names the two departures and the reviews that judged them right.
- `research.md` R-07: where it says the actions follow R-04's wrap rule, it now states the amended wrapper
  (`flex: 0 1 auto`) and the hidden empty heading column with `margin-inline-start: auto` on the actions; for the page
  header, which has no eyebrow variant, the column is hidden when `heading` and `description` are both empty.

## Checked, not changed

- `plan.md` (decision 3, R-04 summary; R-07 summary), `data-model.md`, `contracts/elements-package.md`,
  `contracts/checks.md` and `tasks.md` (T002, T020, T026, T029) refer to R-04 or R-07 by name and do not repeat the
  wrapper's `flex` value or the column's visibility, so they inherit the amendment. T029's "R-04's wrap rule" now reads
  the amended rule.
- R-04's "Measure before red" paragraph records the phase-1 spike's conditions and fallback; it is left as written.

No FR, scenario or task scope changes.
