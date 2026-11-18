# Changes for the library inventory decisions

Source: `reviews/phase-1/inventory-questions.md` (2026-11-18) and the operator's decisions in
`reviews/phase-1/inventory-decisions.md` (2026-11-18, human:jeroennouwsdev). Design artifacts only; no source or test
file is touched. T003 and T005 stay unticked for the implementer. The library clone
(`/home/user/spec-kitty/spec-kitty-design`) was read as data, role names and behaviour only (constitution VI).

## Re-inventory on `develop` (IQ-1 (a), IQ-25)

| Item | Change | Where |
|---|---|---|
| Both commits recorded | `main` 19fb6a2 (2026-09-22) and `develop` a6518cd (2026-09-28), both packages at 1.0.0; tree comparison (358 paths, 354 added, 4 modified, none deleted) | sources/spec-kitty-design-inventory.md (header table) |
| What `develop` adds or changes | New section: no role, modifier, state, story, property or part of the three families changes (no path under `packages/` or `docs/design-system/` differs); added: #470's Desktop V2 source contract (22 families, data table and timeline in, evidence chain out; metric and pill tag in), required states per family and token closure, `desktop-v2-*` baselines, a frozen hand-off payload (source `6f4cfdda`) whose data-table and timeline files are byte-identical, mission and evidence records; rc.10 absent | sources/spec-kitty-design-inventory.md § What `develop` adds or changes |
| Per family | An **On `develop`** note under each of §§ 1 to 3 (unchanged roles; the contract's required states; the chain's absence from the family set), and under § Where the issues are (#470 cited by its hand-off material; #517 and #533 still nowhere) | sources/spec-kitty-design-inventory.md |
| #470 hand-off background | New file: what was read, statements (purpose, the 22 families, source forms, required states for the data table, timeline and metric, the prototype as composition evidence, the consumer boundary, Stage A done and Stage B pending, rights, gates) and a table of what bears on this mission | sources/issue-470-handoff-background.md |
| New inventory questions | IQ-26 (the timeline's compact and narrow forms are Desktop V2 required states), IQ-27 (the evidence chain is not a Desktop V2 family; metric and pill tag are), IQ-28 (Kitty Desktop vendors the library's own data table and timeline): each with options and a recommendation, for phases 2 and 3, nothing decided | reviews/phase-1/inventory-questions.md § Added after the `develop` re-inventory |
| R-16 | Rewritten: the inventory is the library's variant set (IQ-1 (a)), one row per modifier, state, structure role and part, no counts, rc.10 variants when named; what `develop` adds; **the data table's mapping table** (scroller wrapper, table class, caption, header cells, body cells, numeric cell, sticky header, zebra rows, row hover, forced colours, overflowing scroller, tone) with IQ-6 (a) and IQ-7 (a) in their rows; phases 2 and 3 tied to IQ-8 to IQ-28 | research.md R-16 |

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| IQ-1 | (a) | FR-058 and SC-001 rewritten: one mapping row per modifier, state, structure role and part of the library's variant set (at `main` and `develop`), plus rc.10 variants the operator names; "pending inventory" gone; the data-table rows asserted in phase 1's red and written in its green | spec.md FR-058, SC-001, § Operator decisions on the library inventory; plan.md decision 9, § Decisions on the library inventory (1), § Phases (step 3, phase 0, phase 1 red and green, phase 4); research.md R-16; tasks.md § Library inventory decisions in force, § Stop-and-ask points, T005 (text only, unticked), T013, T021, T076; quickstart.md § Prerequisites, step 5; checklists/requirements.md § Notes |
| IQ-1 | (a) | Phases 2 and 3: the inventory is recorded; T028 and T054 become the operator's answers to IQ-8 to IQ-17 and IQ-26 to IQ-28 (phase 2), IQ-18 to IQ-24 and IQ-27 (phase 3), and the pasted issue bodies (IQ-25); T037 and T062 lose the late-`.sk-data-table` clauses | tasks.md T028, T037, T054, T062; research.md R-16 |
| IQ-2 | sticky header row, "Mission changes module" | FR-017 (`sticky-header`, reflected boolean; `<thead>` pinned; the page's block bound on the host; `--ocelle-color-sheet` header ground; separated borders with zero spacing; focus kept clear of the header; toggling) | spec.md FR-017, User Story 1 text, Independent Test, US1-17 to US1-21, Edge Cases (no `<thead>`, two header rows, caption, no bound, toggling, print), Key Entities, Assumptions, Scope |
| IQ-2 | same | FR-008 amended to allow exactly one module change; FR-018 the opt-in block-axis option (default = 009's contract; set = both axes, overflow in either axis, ArrowUp/ArrowDown, block clearance under a named pinned box, handover, no block fade, scrollbars unmasked); Scope and Out of scope; SC-007 extended to 009's tests and baselines | spec.md FR-008, FR-018, Scope, SC-007, Assumptions |
| IQ-2 | same | The module change's contract, amending 009's: options `blockAxis` and `blockStartBox`, `data-axis="both"`, `overflow-y: auto` with `scrollbar-gutter: stable`, the three-layer mask, keys, block clearance (`blockClearanceScroll`), handover, stylesheet additions, what a host must not do, and its tests (009's test files unedited; the README's inputs sentence the only changed statement). 009's own contract file is referenced, not edited (Q-I5) | contracts/overflow-region-block-axis.md (new) |
| IQ-2 | same | The data table's side: the module options, the host's and frame's column flex for the bound, the pin and its ground, the caption cap less the reserved gutter, toggling | contracts/ocelle-data-table.md (header, § Public surface, § Shadow structure, § Sticky header row, § Look); data-model.md (`stickyHeader`, pinned box, block bound, box size, overflow state, States) |
| IQ-2 | same | Research and spike: R-18 (the decision, the option, the data table's side, the caption cap with the gutter, the spike's measurement list); a second phase 1 spike T082 recorded in `reviews/phase-1/spike-2.md` (T003 untouched) | research.md R-18, R-07 (one sentence), intro; plan.md § Phases phase 1 (Spike 2); tasks.md T082 |
| IQ-2 | same | Plan: Technical Context (dependency changed, test files, scale), Constitution Check (intro, rows I, III, VI, VII, VIII), decision 8, Project Structure (`overflow-region.ts` changed, new test files and fixture, the new contract), Complexity Tracking note (not an exception: scope, rationale, no sunset needed) | plan.md |
| IQ-2 | same | Tasks: T079 (red: the module option's test host, the driver's `scrollTop`/`setScrollTop`, its bodies in both harnesses, the option-off guard; no 009 test file edited), T081 (green: the module option, first in green, README conventions entry, CHANGELOG line), T080 (red: US1-17 to US1-21 and the sticky edge cases), T004 (scaffold fields), T013 (the inputs sentence change, statements), T015 (red commit list and body), T016, T017, T018, T022 (`git diff --stat` showing no 009 test file changed), T024, T025 (mutation of `overflow-region.ts`) | tasks.md |
| IQ-3 | add, a documented base-style hook | FR-019: `data-ocelle-align="end"` in `@ocelle/styles`, `text-align: end` and tabular figures at (0,1,0), block 4 placed after block 2, any element, public surface; Assumptions and Out of scope updated | spec.md FR-019, US1-22, Edge Cases, Assumptions, Scope, FR-057; research.md R-19, R-06 (block 4, last-rule assertion "wrap, block 1, block 2, block 4"); contracts/styles-data-table.md (intro, § Block 4); contracts/ocelle-data-table.md § Striped rows, row hover and numeric cells; data-model.md (numeric cell); plan.md (scale: four blocks, two hooks; rows I, VII); tasks.md T011, T013, T017, T021, T075, T080 |
| IQ-4 | add | FR-060: `striped`, reflected boolean; each `<tbody>`'s even rows on `--ocelle-color-inset`, hidden rows counted; forced-colours band | spec.md FR-060, US1-23, Edge Cases; research.md R-20; contracts/styles-data-table.md block 1; contracts/ocelle-data-table.md; data-model.md; tasks.md T004, T011, T016, T017, T018, T021, T080 |
| IQ-5 | add | FR-061: a hovered `<tbody>` row on `--ocelle-color-hover-bg`, after the stripe, always on, a look only (no event, tab stop or cursor); forced-colours band in `Highlight` | spec.md FR-061, US1-24, Edge Cases; research.md R-20; contracts/styles-data-table.md block 1; tasks.md T011, T017, T021, T080 |
| IQ-2, IQ-4, IQ-5 | contrast and forced colours (FR-013 classes) | FR-013's table gains the stripe ground, the hover ground (decorative grounds, text held to its declaration on them), the pinned header ground and the forced-colours row band (`--ocelle-bar-width`; `CanvasText`, `Highlight`, `Canvas`); US1-11 reworded (grounds only with the new attributes); US1-25 for forced colours; R-13: no new token or contrast row, the three grounds are main grounds, the light-theme `hover-bg` = `inset` collision recorded (Q-I2) | spec.md FR-013, US1-11, US1-25; research.md R-13; contracts/checks.md § Oracles (forced colours, contrast source and rendered); plan.md row II and III |
| IQ-2 to IQ-5 | stories and baselines | Five data-table stories: sticky header, bounded; numeric column; striped; row hovered; striped, an even row hovered (the last two through #10's pointer parameter). Phase 1: 19 stories, 38 baselines (`visual:update` `(38 added, 0 changed, 0 removed)`); mission 42 and 84; per-phase `<n>` 38, 22, 24 | spec.md FR-050 (and the spike decision's count note); contracts/checks.md § Stories; research.md R-15; plan.md § Summary, § Technical Context (Scale/Scope), row V, decisions after the analysis and after the spike (count notes); tasks.md § Baselines, § Library inventory decisions in force, phase 1 Goal, T014, T019, T020, T078; quickstart.md step 5 |
| IQ-2 to IQ-5 | element plants | Sixteen plants: the sticky `position`, the separated borders, the header ground, block 2's sticky `border-collapse`, `data-axis` never set, block clearance skipped, ArrowDown handled with the option off, the third mask layer dropped, the gutter not subtracted, the host's column flex removed, the hook before block 2, the hook without figures, the stripe on odd rows, the stripe after the hover, the hover on header and footer rows, the band removed or misordered | contracts/checks.md § Element plants; tasks.md T024 |
| IQ-2 to IQ-5 | bodies the platform alone could pass | Six rows with their paired assertions (no-bound sticky, hover's unchanged rows, stripes' odd rows, the hook's other cells, the option off, the header link not cleared) | contracts/checks.md § Bodies that the platform alone could pass |
| IQ-2 to IQ-5 | oracles and helpers | Oracles extended (AX tree, computed style, geometry, scroll width, keyboard, a new pointer row with the merged `hover`, forced colours, contrast); keyboard bodies US1-18, US1-19 and the module's; driver additions `scrollTop` and `setScrollTop` in phase 1 (T079), `itemTexts` still phase 2 | contracts/checks.md § Harnesses, § Oracles, § Keyboard bodies; plan.md § Technical Context (Testing) |
| IQ-2 to IQ-5 | README and CHANGELOG entries | `@ocelle/elements`: the data-table section's statements (sticky header and its bound, caption, print; striped with hidden rows; hover a look only; the hook pointer), the module's conventions entry naming the option and its one user, CHANGELOG naming `sticky-header`, `striped` as surface and the module option as internal. `@ocelle/styles`: the Hooks table row `data-ocelle-align`, § Numeric cells, the sticky header's ground and border model, stripes, hover, the forced-colours band; CHANGELOG naming block 4 and the hook as surface | spec.md FR-056, FR-057; contracts/styles-data-table.md § Consumer rules; tasks.md T011, T013, T017, T021, T075, T081 |
| IQ-6 | (a) | FR-010's README sentence: give an overflowing table a `label` that differs from its caption's text; a README statement (T013) and the scroller row of R-16's mapping | spec.md FR-010; research.md R-16; tasks.md T013, T021; quickstart.md step 5 |
| IQ-7 | (a) | The header cells' mapping row: the library's header look (medium weight, muted, sentence case, untracked, no row-header style) mapped to the eyebrow headers, the consumer's own rule for sentence case; FR-006 unchanged | spec.md FR-058; research.md R-16; tasks.md T013, T021; quickstart.md step 5 |
| IQ-25 | "I'll paste them" | Recorded: the bodies are pasted before phase 2's red and recorded verbatim in `sources/`; the `develop` hand-off material recorded as background now | spec.md § Operator decisions on the library inventory; plan.md § Decisions on the library inventory (8), row VI; tasks.md T028; sources/issue-470-handoff-background.md |
| All | record | Decision blocks added; superseded earlier decisions marked (T005 "Proceed, map later"; the 14/28 and 37/74 counts) | spec.md § Operator decisions on the library inventory, Status line; plan.md § Summary bullet, § Decisions on the library inventory, Constitution Check intro; tasks.md § Library inventory decisions in force, § Phase flow; checklists/requirements.md § Notes; research.md intro |

`tasks.md` still parses: `units.sh` reports phase 1 with 27 tasks (T003 to T025 and the new T079 to T082), all open;
phase 2 26, phase 3 23 and phase 4 4, as before. No ticked task was renumbered; the 82 task IDs are unique.

## Questions for the operator

Each names the plan's default, which the artifacts above follow until the operator answers. An answer that differs
changes the spec, plan, contracts and tasks before phase 1's red commit (T015); after it, it enters as a test-first
fix (tasks.md § Stop-and-ask points).

**Q-I1. The pinned header row's ground.** A pinned header must paint an opaque ground, or the rows show through it,
but the data table does not know the ground it sits on. Options:

- (a) `--ocelle-color-sheet` (the plan's default): the card ground, as the library's card surface; on a sheet or card
  it is invisible, on the canvas, a panel or the inspector it reads as a light band in light theme and a slightly
  raised one in dark.
- (b) `--ocelle-color-inset`: the header always reads as a band, the same ground as the stripes.
- (c) `--ocelle-color-canvas`: invisible on the page, a band on cards and panes.
- (d) A further documented base-style hook (for example `--data-table-header-ground`) the consumer sets to its own
  ground token, `--ocelle-color-sheet` by default; new public surface (constitution VII), a README statement and
  tests.

**Q-I2. A hovered striped row in the light theme.** IQ-4 (b) named `--ocelle-color-inset` for the stripe and IQ-5 (b)
`--ocelle-color-hover-bg` for the hover; in the light theme both are `#E2DDD3`, so a hovered even row of a striped
table does not change (dark: `#2A261F` against `#302B23`). Options:

- (a) Accept it (the plan's default): the hover is decorative, the stripe already marks the row, and the README says
  a striped row shows no hover in light.
- (b) Stripes on `--ocelle-color-rail` (light `#E9E5DD`, distinct from `hover-bg`); but in dark `rail` equals `pane`
  (`#1C1A15`), so stripes vanish on a pane in dark.
- (c) Keep both grounds and add, on the hovered row only, a decorative inline-start bar on its first cell in
  `--ocelle-color-rule-strong` (`--ocelle-bar-width`), so a hover shows on any ground in both themes; one more plant
  and one more FR-013 row.
- (d) A new ground token for the hover of a striped row, through FR-040 (records, generator, contrast rows); the most
  work, and a token for one case.

**Q-I3. The row hover: always on or opt-in.** IQ-5 (b) describes a hover ground with no attribute, and IQ-5's own
recommendation warned that a hover on rows that do nothing suggests an action. Options:

- (a) Always on (the plan's default, as IQ-5 (b) reads), like the library.
- (b) Opt-in by a reflected boolean attribute (for example `hover-rows`), for tables whose rows hold links or open a
  detail; the default table shows no hover. One more property, story change and plant.

**Q-I4. A fade at the block end.** 009's module fades the inline edges that have content off-screen; the block-axis
option draws no fade (R-18), so a bounded sticky table shows only the scrollbar as a cue that rows continue. Options:

- (a) No block fade (the plan's default): the pinned header and the scrollbar show the position; the module change
  stays smallest.
- (b) The module also fades the block end while content is below it (a block-axis `data-fade` state and mask layer,
  never under the pinned header); more module surface, tests and plants, and the focus clearance must clear the fade.

**Q-I5. 009's contract file.** The block-axis option amends `specs/009-workflow-layouts/contracts/overflow-region.md`;
this step wrote the amendment in this feature's `contracts/overflow-region-block-axis.md` and did not edit 009's
feature directory. Options:

- (a) As done (the plan's default): 009's directory stays as merged; the 019 contract and the README's conventions
  entry carry the option.
- (b) Also add a one-line pointer at the top of 009's contract to the 019 amendment, in a documentation commit of its
  own.
