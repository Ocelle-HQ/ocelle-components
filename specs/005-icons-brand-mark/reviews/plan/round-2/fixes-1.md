# Squad round 2: fixes 1

The four confirmed fixes and the operator's fork decision of `refute.md` (Decision column: PLAN-FRESH-2-002 (a)).

Re-measured in this pass (Chromium 1243, scratchpad probes, nothing committed):

- Slot row padding: a shadow `<button>` row (`inline-flex`, `align-items: flex-start`, 1 px border) with R-10's wrapper
  and `::slotted` rules. `padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2)` computes to 0 px at md/normal
  (a negative `calc()` padding is clamped to 0), 1.30 px at xs/normal, 1.95 px at sm/tight and 4.41 px with a 32 px
  icon. With it, the slotted icon lies inside the button's border box in all four cases, single-line and wrapped.
  Without it, the icon is outside the border box in the last three. Centring is unchanged. The lens's `max(0px, …)`
  form gives the same boxes. The plan takes the `calc()` form because it needs no `max()` and no `0px` literal, only
  R-03's `1lh` admitted inside `calc()`.
- Mark sizing: with `inline-size: max-content`, the mark is 20 × 20 px in a paragraph, a flex row and a 300 px flex
  column. A host `block-size: 32px` gives 32 × 32 and a host `inline-size: 32px` gives 32 × 20. With
  `inline-size: auto`, the flex column gives 300 × 20.
- `hidden`: R-09's sheet with `:host([hidden]) { display: none; }` gives 0 × 0 px. Without the rule it gives
  20 × 20 px.
- Engine data: caniuse-lite 1.0.30001819 gives `css-dir-pseudo` at Chrome 120 and Safari 16.4, and
  `css-media-range-syntax` at Chrome 104 and Safari 16.4.

No fix of this round adds to `packages/tokens/src/source.ts`, so op 004's change to that file needs nothing here.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-001 | fixed | spec Host ARIA, pairing table (row for `hidden`, plant: the `:host([hidden])` rule removed), US1-19, US4-15, Edge Cases (hidden elements), FR-008, FR-034, SC-003; research R-04 (rule, measurement), R-09 § Sizing, R-11 (shared bodies list), R-15 (README convention, host ARIA); data-model § `ocelle-icon` Box, § `ocelle-brand-mark` Box; contracts/elements-package.md (both elements); plan Constitution Check III, phases 2 and 5 |
| PLAN-FRESH-2-002 | decided: (a) | spec round-2 operator decision, US3-1 and US3-10 (icon inside the control's border box at the four type and size cases), FR-021; research R-03 (`1lh` inside `calc()`, plants `pass-one-line-calc`, `fail-lh-multiple-calc`), R-10 (`.icon-row { padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2) }`, clamp, measurement, containment assertion and plant, test host's button is the row), R-15 (README slot convention); data-model § Slot convention; contracts/elements-package.md § Slot convention, contracts/checks.md style-lint row; plan Constitution Check II, decisions 5 and 6, Project Structure, phase 4 |
| PLAN-FRESH-2-003 | fixed | spec US4-7 (column flex case, 20 × 20); research R-09 § Sizing (`inline-size: max-content`, measured, plant `inline-size: auto`); data-model § `ocelle-brand-mark` Box; contracts/elements-package.md (mark box); plan decision 12, phase 5 |
| PLAN-FRESH-2-004 | fixed | spec Edge Cases (without `tokens.css`), FR-008 (peer dependency, README sentence), FR-031 (CHANGELOG names the peer dependency); research R-01, R-04 and R-09 (behaviour without tokens), R-15 (README tokens sentence and convention, `package.json` `peerDependencies`, CHANGELOG, readme test); data-model (both elements' tokens); contracts/elements-package.md § Tokens; plan Technical Context, decision 15, Project Structure, phase 2, phase 5 (mark without tokens) |
| PLAN-FRESH-2-005 | fixed | spec FR-008 (README states the floor with the feature behind each figure, and that an element raising it updates it); research R-05 (floor Chromium 120+ / WebKit 16.4+ with each feature and version; the optional presentation-attribute hardening not adopted), R-15 (README engines section and convention); contracts/elements-package.md § Engines; plan Technical Context, Constitution Check IV, decision 15, phase 2 |
