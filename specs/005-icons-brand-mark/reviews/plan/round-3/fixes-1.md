# Squad round 3: fixes 1

The three confirmed fixes and the operator's fork decision of `refute.md` (PLAN-FRESH-3-002: (a)). Re-probed in this
pass (Chromium 1243, scratchpad only): with a page rule setting `--ocelle-icon-size: 2rem` on a slotted element, the
icon is 32 x 32 px and outside the row's border box without the pin and 20 x 20 px inside it with
`--ocelle-icon-size: inherit !important`, while a standalone icon stays 32 x 32 px; the mark with `block-size: 100%`
is 48 x 48 px in a 48 px `block-size` flex bar and 300 x 300 px in a `min-block-size: 48px` bar; today's `rawValues`
gives `[]` for `scale: calc(2)`, `aspect-ratio: calc(2)` and `--ocelle-icon-size: inherit`. For (a) the refute's note
was taken up: `1lh` is also limited to one occurrence per `calc()` expression (plant `fail-lh-calc-twice`), and R-03
names the one spelling still admitted (a factor on a parenthesised group holding `1lh` beside a token, which the
padding rule's own `/ 2` needs), left to review and stated in the README conventions.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-001 | fixed | research R-10 (`::slotted(*)` rule gains `--ocelle-icon-size: inherit !important`; new "token pin" paragraph with the measurement, tests and plant), R-15 (README sentence); data-model § Slot convention; contracts/elements-package.md § Slot convention; spec FR-022, US3-9 (token on `ocelle-icon` and on a slotted `<svg class="big">`), pairing table (new row, plant: pin removed), Edge Cases (host page styles, compact root), documentation-test list (FR-022), round-3 decision note; plan Key decisions 5, phase 4 plants |
| PLAN-FRESH-3-002 | decided: (a) | research R-03 (`calc()` rule: whole-value check for `scale` and `aspect-ratio`, `1lh` only as one `+`/`-` operand beside a token; plants `fail-scale-calc`, `fail-aspect-calc`, `fail-lh-calc-factor`, `fail-lh-calc-twice`; what is and is not closed; corrected sentences; Alternatives), R-15 (README names the remaining limit); contracts/checks.md `style-lint` row; plan summary, Constitution Check II, Key decisions 6, project structure, phases 3 to 5 plant lists; spec round-3 decision note |
| PLAN-FRESH-3-003 | fixed | research R-09 (new "Percentage heights" paragraph), R-15 (README sentence); data-model § `ocelle-brand-mark` Box; contracts/elements-package.md mark Box; spec FR-024 (definite sizes, 300 px fallback), US4-7 (48 px bar case, "definite size"), Edge Cases, documentation-test list (FR-024); plan Key decisions 12, phase 5 |
| PLAN-FRESH-3-004 | fixed | research R-05 (README's engines section is the one list; a later feature records its floor feature in its own research), R-15; contracts/elements-package.md § Engines; plan Key decisions 15 |
