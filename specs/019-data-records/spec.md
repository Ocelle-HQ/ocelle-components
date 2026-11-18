# Feature Specification: Data Records (Data Table, Event Timeline, Evidence Chain)

**Feature Branch**: `019-data-records` (work happens on `claude/013-data-display-2`)

**Created**: 2026-11-15

**Status**: Approved at the spec gate (2026-11-15); amended after the plan gate and after the analysis (2026-11-16),
the recheck (2026-11-17), the phase 1 spike, the library inventory and its follow-up questions (2026-11-18)

**Input**: User description: "Mission for the rest of #13 (triage/019-data-display-follow-on.md; triage/013-data-display.md
option B), spec directory specs/019-data-records. The operator chose option B at the triage gate: this mission builds
ocelle-data-table, ocelle-event-timeline and ocelle-evidence-chain; ocelle-disclosure and ocelle-code-block are mission
020's. In @ocelle/elements, following README § Element conventions as amended by mission 013 (slotted items by manual
slot assignment with the container importing its item element, the wrap="anywhere" identifier policy, undefined
defaults, no class= API), no monospace, values in Schibsted Grotesk with --ocelle-figures, and mission 013's elements
unchanged; (P1) ocelle-data-table, compact cells with tabular figures, --ocelle-color-ink-soft cell text and tracked
uppercase eyebrow headers (#533) built from existing tokens (--ocelle-font-size-xs, --ocelle-tracking-caps from 009)
unless 011 has landed its own eyebrow tokens, keeping table semantics (role table, rows, column headers, caption) for
assistive technology and a narrow-column behaviour decided at clarify; (P2) ocelle-event-timeline, the Desktop V2 event
history (#470) as an ordered or plain list of event items with --ocelle-size-dot markers; (P3) ocelle-evidence-chain,
an ordered list that wraps onto further lines in narrow columns, connectors hidden from assistive technology, step
markers at --ocelle-size-step with --ocelle-ring-step, and an optional compact chip step (#517) that does not redraw
#7's pill tag; new tokens only where none fits, added to @ocelle/tokens with validation; done when #7's checklist holds
for each element and item element (a story per variant and state with light and dark baselines through #10's gates on
main, interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical
finding, manifest entries, strict-CSP check) plus a 320 px reflow test per element; settle at clarify the questions the
triage record lists (data-table content model and overflow, item element names, timeline list kind, chip-step
surface)."

**Issues**: #13, partly (triage record `triage/019-data-display-follow-on.md`, approved by the operator on
2026-11-15). Mission 013 (`specs/013-data-display`, PR #43) built `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`
and `ocelle-progress`. This mission builds three more of #13's elements. `ocelle-disclosure` and `ocelle-code-block`
are mission 020's (`specs/020-disclosure-code-block`, own session), and #13 stays open until 020 lands. The
spec-kitty-design issues #13 cites for these three (#470, #517, #533) were not read from this session. The requirements
below come from #13's body (re-read on 2026-11-15: unchanged since 2026-11-02, no comments), the epic #1's gap table
and the triage record. Planning proceeds on #13's text (operator decision SPEC-1-06 (b), below): the plan's research
lists each point #470, #517 and #533 could change as an open question for the plan gate, where the operator answers.
Spec Kitty's `sk-*` names are kitty-mission-ui roles, not names in this library.

**Consumers** (constitution VI): kitty-mission-ui (Kitty Desktop and Kitty Dashboard) replaces its `.sk-data-table`
class family, and the event history and evidence-chain markup of the Desktop V2 prototype, with these elements. The
Ocelle web console uses them in server-rendered pages under a strict CSP, filled by htmx swaps.

**Operator decisions while specifying** (2026-11-15, human:jeroennouwsdev):

- Split, at the triage gate: option B, as above.
- Data-table content model (Q1), "(a) Slotted `<table>`": the consumer writes a native `<table>` as the element's
  content. Its semantics (caption, header cells, rows) stay the platform's in one tree, and the element styles its
  cells from `@ocelle/styles` rules scoped to the element (FR-003, FR-005).
- Data-table overflow (Q2), "(b) 009 overflow region": a table wider than its column scrolls sideways in a region built
  on mission 009's internal overflow-region module (`specs/009-workflow-layouts/contracts/overflow-region.md`), which
  is a tab stop and a named group only while it overflows (FR-008). The data table becomes a user of that module
  besides `ocelle-scroller`, `ocelle-workflow-board` and 020's code block.
- Item names and list kind (Q3), "(a) Ordered, two items": the timeline is an ordered list of `ocelle-timeline-event`
  items, and the chain is an ordered list of `ocelle-evidence-step` items (FR-020, FR-030).
- Chip step (Q4), "(a) Variant on the step": `variant="chip"` on an `ocelle-evidence-step` draws that step compact
  (FR-035).
- Orchestrator note from the operator (2026-11-15): implementation waits until #15 (mission 009), mission 013 and
  op 016 (#41, affected plants) are on `main`. Per-phase plant runs are planned as op 016's affected plants, not a full
  `gate:plants`, and the first task rechecks the tasks against op 016 as merged.
- Unread spec-kitty-design issues (spec check 1, SPEC-1-06), "(b) Plan on #13, ask later": planning proceeds on #13's
  text now. The plan's research lists each point the unread issues #470, #517 and #533 could change as an open question
  for the plan gate, where the operator answers: at least the chip step's look (FR-035, #517), the column headers'
  weight and colour (FR-006, #533), and whether an event's time sits before or above its content (FR-023, which also
  decides the line FR-021 centres the marker on; #470). The plan's own choices on these points stand until the
  operator answers; an answer that changes a requirement here is recorded in the spec before tasks are generated.

**Operator decisions at the plan gate** (2026-11-16, human:jeroennouwsdev; `reviews/plan/operator-gate.md`):

- Decision 1 (R-03), the track's inline size: (a), the data table's host rule `:host .region-track { inline-size:
  fit-content }`; 009's module unchanged (FR-008, US1-9 as written).
- Q-A, the chip step's look (#517): (a), outline only, no fill (FR-035).
- Q-B, the column headers' weight and colour (#533): (a), `--ocelle-font-weight-medium` in `--ocelle-color-ink-muted`
  (FR-006). Superseded on 2026-11-17 by the recheck's Q1 (a) below: 011's eyebrow tokens, weight 600.
- Q-C, the event's time position (#470): (a), the time on its own line above the content, the marker centred on the
  time's line (FR-023, FR-021).
- Q-E, marked-up times (#470): "Yes: named time slot". `ocelle-timeline-event` gets a named `time` slot that takes
  precedence over the `time` attribute, styled through `::slotted()`, the item text still time first (FR-023, US2-11
  to US2-14). A slotted time that is empty, white space only or hidden counts as no slotted time, and the `time`
  attribute then applies.
- Q-G, an empty, white-space-only or hidden slotted time beside a `time` attribute: (a), the attribute applies; the
  slot takes precedence only when it has visible non-blank text (FR-023, US2-13).

**Operator decisions after the analysis** (2026-11-16, human:jeroennouwsdev; `reviews/analysis/operator-decisions.md`):

- C1, states without a story: (c). A standalone `ocelle-timeline-event` and a standalone `ocelle-evidence-step` get a
  story in their container's file; the states named by a host `aria-label` (the data table's region, the timeline,
  the chain) are one Principle V exception in the plan's Complexity Tracking, proven by browser tests (FR-050). The
  data table's region left the exception after the phase 1 spike (Q1 (b), below).
- I7, the caption cap's custom properties: (a). `--data-table-box-size` and `--data-table-end-fade` are a documented
  base-style hook between `@ocelle/elements` and `@ocelle/styles`, public surface under constitution VII (FR-057).

**Operator decisions on the T001 recheck** (2026-11-17, human:jeroennouwsdev; `reviews/recheck.md`, decisions in
`reviews/recheck-decisions.md`, changes listed in `reviews/recheck-fixes.md`):

- Q1, the column headers' tokens: (a). `--ocelle-tracking-caps` is not on `main` (009 uses 011's
  `--ocelle-tracking-eyebrow`), and 011's eyebrow tokens are, so the column headers use all four of them:
  `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow` (600), `--ocelle-tracking-eyebrow` and
  `--ocelle-color-eyebrow`, as 011's page and section headers do. This supersedes Q-B (a) (FR-006, US1-3).
- Q2, the data table's per-instance sheet: (c). The end fade's share of the caption cap is written as the measured px
  inline size of the module's `.region-edge.end`, so the data table's own sheet holds only px figures measured from
  layout; the README's Styles convention is amended only for the number of per-instance sheets (an element that uses
  the overflow-region module may hold one of its own beside the module's).
- Q3, history folds after the merge of `main` (8ee3351): (a). Each phase is folded from a base at 8ee3351 or later;
  the merge commit stays in the branch's history and `/ocelle-land` handles the pull request's shape.
- Q4, stale line citations: (a). The plan's research cites `base.css` and `source.test.ts` at their merged lines.
- Q5, the pre-upgrade rules' place: (b). The timeline's and the chain's pre-upgrade rules go in the base layer of
  `base.css`, beside 013's `ocelle-facts` rule, and 003's `source.test.ts` transcribes them in its base-layer slice.

**Operator decisions on the phase 1 spike** (2026-11-18, human:jeroennouwsdev; `reviews/phase-1/spike.md`, decisions
in `reviews/phase-1/operator-spike-decisions.md`, changes listed in `reviews/phase-1/spike-fixes.md`):

- Q1, the data table named by a host `aria-label`: (b). The pinned axe-core reports no serious or critical finding
  on it, so the data table's region leaves the Principle V exception: phase 1 adds two stories, an overflowing data
  table named by a non-blank host `aria-label` and one with a blank host `aria-label` (14 data-table stories, 37 in
  all; 19 and 42 since the inventory decisions below). The timeline and the chain stay in the exception until their own spikes measure them (FR-050).
- Q2, upper-case column-header names: (a). The column headers stay upper case (FR-006). Chromium names each column
  header by its drawn, upper-case text, so US1-1 compares the element's table with the same table outside given the
  same upper case, and asserts that the column headers are named in upper case; both READMEs state it (FR-006).
- T005, the `.sk-data-table` inventory: "Proceed, map later". Phase 1 proceeds without it; the README's data-table
  mapping rows (FR-058) read "pending inventory" until the operator supplies the inventory, which is recorded and
  mapped before the pull request lands. SC-001 stays open until then. Superseded on 2026-11-18 by IQ-1 (a) below.

**Operator decisions on the library inventory** (2026-11-18, human:jeroennouwsdev; questions in
`reviews/phase-1/inventory-questions.md`, decisions in `reviews/phase-1/inventory-decisions.md`, changes listed in
`reviews/phase-1/inventory-fixes.md`; the source is the open-source spec-kitty design library, MIT, read from a clone,
role names only, constitution VI):

- IQ-1, the inventory: (a). The library's own variant set (`sources/spec-kitty-design-inventory.md`, at `main`
  19fb6a2 and re-read at the newest line, `develop` a6518cd, since no release tag exists) is the inventory for T005,
  T028 and T054 and SC-001: one README mapping row per modifier, state, structure role and part, no counts (FR-058).
  The data-table rows no longer read "pending inventory": they are written test first in phase 1.
- IQ-2, the sticky header row: added in this mission. This mission extends 009's overflow-region module with an
  opt-in block-axis option (FR-018), and FR-008 is amended to allow exactly that change; `ocelle-scroller` and the
  workflow board are unchanged (FR-017, FR-018).
- IQ-3, the numeric end-aligned cell: added, as a documented base-style hook in `@ocelle/styles` (FR-019).
- IQ-4, zebra rows: added (FR-060). IQ-5, row hover: added (FR-061).
- IQ-6: (a). FR-010's caption fallback stands; the README tells consumers to give an overflowing table a `label`
  that differs from its caption (FR-010).
- IQ-7: (a). The eyebrow headers stand (FR-006); the README maps the library's header look to them (FR-058).
- IQ-25: the operator pastes #470, #517 and #533 before phase 2's red, and the planner records them verbatim in
  `sources/`; the #470 hand-off material on `develop` is recorded as background
  (`sources/issue-470-handoff-background.md`). IQ-8 to IQ-24, and IQ-26 to IQ-28 found on `develop`, are asked before
  phases 2 and 3.

**Operator decisions on the inventory follow-up questions** (2026-11-18, human:jeroennouwsdev; questions Q-I1 to Q-I5
in `reviews/phase-1/inventory-fixes.md`, answers at the end of `reviews/phase-1/inventory-decisions.md`):

- Q-I1, the pinned header row's ground: `--ocelle-color-sheet`, the default (FR-017).
- Q-I2, a hovered striped row in the light theme (`inset` = `hover-bg`): accepted; the README notes it (FR-061).
- Q-I3, the row hover: always on, the default (FR-061).
- Q-I4, a fade at the block end: added (changes the default). While the block-axis option is on and content is below
  the region's block end, the module fades the block end, never under the pinned header, with a line in forced
  colours (FR-018, US1-26 to US1-28).
- Q-I5, 009's contract: a one-line pointer to this mission's amendment (`contracts/overflow-region-block-axis.md`) is
  added to `specs/009-workflow-layouts/contracts/overflow-region.md`, nothing else of 009 is changed (FR-018).

## Scope

**In scope:** five new custom elements in `@ocelle/elements`: `ocelle-data-table`, `ocelle-event-timeline` with its
item `ocelle-timeline-event`, and `ocelle-evidence-chain` with its item `ocelle-evidence-step`. This covers their
stories, tests, manifest entries and README sections; the `@ocelle/styles` rules that style a data table's light-DOM
cells (FR-005), its sticky header row, striped rows and row hover (FR-017, FR-060, FR-061); the `@ocelle/styles`
end-alignment hook for numeric cells (FR-019); one opt-in block-axis option in mission 009's internal overflow-region
module (FR-018, IQ-2); any new tokens these elements need that no existing token provides (FR-040); and the README's
§ Element conventions amendment for a container whose content is one native element (FR-056).

**Out of scope:**

- `ocelle-disclosure` and `ocelle-code-block` (mission 020);
- mission 013's elements (`ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`), which this mission
  does not change;
- any change to mission 009's overflow-region module other than FR-018's opt-in block-axis option, and any change to
  `ocelle-scroller` or `ocelle-workflow-board` (FR-008, FR-018);
- sorting, filtering, selection, pagination, resizable or sticky columns, and any other interactive table behaviour:
  the data table is a readout and emits no event (the sticky header row of FR-017 and the row hover ground of FR-061
  are looks, not interactions);
- copying text to the clipboard (constitution I; #14 and the host);
- 011's eyebrow tokens, which are on `main` and which the data table's column headers use and do not add (FR-006);
- the `storybook-build`, `visual` and `axe` gates and #10's pinned container, which are on `main`; this mission writes
  the stories they read and commits their baselines (FR-051);
- WebKit measurement (the library's Engines note).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A compact data table without classes (Priority: P1)

A Kitty Desktop inspector lists a mission's work packages: id, title, lane, estimate and updated date. The developer
writes `<ocelle-data-table label="Work packages">` around their own `<table>` with a `<caption>`, a header row of
`<th scope="col">` cells and body rows, instead of a `<table class="sk-data-table">`. The cells are compact, the cell
text is soft ink with tabular figures, and the column headers are small, tracked, uppercase eyebrows. A screen-reader
user hears a table with its caption, its column headers and each cell under its header. In a wide column the table
fits. In a 320 px column the table keeps its columns and scrolls sideways inside its own region, which then becomes a
keyboard tab stop named "Work packages"; the page itself never scrolls sideways. Once the column is wide again the
region is no longer a tab stop.

**Why this priority**: it replaces the `.sk-data-table` class family (#533, epic #1's gap row) and is the only one of
the three with a scroll region, so it carries the most risk.

A long list uses `sticky-header` with a block size the page bounds, so the column headers stay in view while the rows
scroll inside the region; a cost column carries `data-ocelle-align="end"` on its cells so its figures line up at the
end; `striped` puts a ground on every other body row, and a hovered body row is brightened (inventory decisions
IQ-2 to IQ-5). While rows continue below the region's block end, the last visible rows fade out there (Q-I4).

**Independent Test**: render an `ocelle-data-table` holding a table with a caption, five columns and four rows, one
cell a 26-character identifier with no space or hyphen in it (so it cannot break and the table overflows at
320 px). At 1280 px and 320 px, check the cells' computed type and padding, the header style,
the region's tab stop and name, the page's scroll width and the accessibility tree. Then render twenty rows with
`sticky-header`, `striped`, an end-aligned numeric column and a bounded host block size, and check the pinned header,
the block-axis keyboard and focus clearance, the block-end fade, the row grounds and the end alignment.

**Acceptance Scenarios**:

1. **Given** an `ocelle-data-table` holding a `<table>` with a `<caption>`, one header row of five `<th scope="col">`
   cells and four body rows, in a 1280 px block container, **When** it renders, **Then** the accessibility tree in
   Chromium holds one table named by its caption, with five column headers and four data rows, each cell associated
   with its column header, exactly as the same `<table>` outside the element whose column headers are also drawn in
   upper case; each column header is named by its drawn, upper-case text ("ID" for a header written "Id"); the
   element adds no table, row or cell node of its own (FR-003, FR-004, FR-006; spike Q2 (a)).
2. **Given** that table, **When** a body cell's computed style is read, **Then** its font family resolves through
   `--ocelle-font-sans`, its colour through `--ocelle-color-ink-soft`, its `font-variant-numeric` is `tabular-nums`
   through `--ocelle-figures`, and its block and inline padding are the compact token steps the plan names, each
   smaller than 003's prose table cell padding (`--ocelle-space-2` block, `--ocelle-space-3` inline). No computed font
   family in the table is a monospace family (FR-005).
3. **Given** a column header cell (a `<th>` in the table's `<thead>`, or one with `scope="col"`), **When** its computed
   style is read, **Then** its font size, weight, letter spacing and colour resolve through 011's eyebrow tokens
   (`--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow`,
   `--ocelle-color-eyebrow`; recheck Q1 (a)) and it has `text-transform: uppercase`; a row header cell (`<th scope="row">` in the body) is at the
   body cell size in `--ocelle-color-ink`, not uppercase (FR-006).
4. **Given** the table in a 320 px block container, wider than it, **When** it renders, **Then** the table keeps its
   columns, the element's region scrolls sideways, the page's scroll width equals the viewport width, and the region's
   scroll box has `tabindex="0"`, role `group` and the accessible name "Work packages" from `label` (FR-008, FR-009).
5. **Given** that overflowing region focused from the keyboard, **When** the user presses ArrowRight and then
   ArrowLeft, **Then** the region scrolls towards the inline end and back by the module's step, and a fade shows on
   each side with content off-screen, as 009's contract states (FR-008).
6. **Given** the same element in a 1280 px container, where the table fits, **When** it renders, **Then** the scroll
   box has no `tabindex`, no `role` and no `aria-label`, and no fade shows (FR-008).
7. **Given** an overflowing data table with no `label` and no host `aria-label`, holding a `<caption>` "Work packages",
   **When** it renders, **Then** the scroll box's accessible name is the caption's text, read from it (no ID reference
   across the shadow root); **Given** no `label`, no host `aria-label` and no caption, **Then** the scroll box has
   `tabindex="0"` and no role and no name, as 009's contract states (FR-010).
8. **Given** a link in a body cell of an overflowing table, scrolled to the inline start, with the link off-screen at
   the inline end, **When** the user tabs to the link, **Then** the region scrolls so the link's focus ring is clear of
   every fading edge (009's focus clearance), and the link keeps its own tab stop and focus ring (FR-008, FR-011).
9. **Given** a cell holding a 26-character identifier with no spaces inside a `<span data-ocelle-wrap="anywhere">`, or
   with `wrap="anywhere"` on the element, **When** the table is narrower than its content, **Then** the identifier
   breaks inside its cell before the table overflows; and copying the cell gives the identifier unchanged (FR-007).
10. **Given** the element inside a `[data-ocelle-prose]` container (003's prose rules), holding the US1-1 table,
    **When** it renders in a 1280 px and a 320 px container, **Then** the table is not a scroll box of its own: there is
    exactly one sideways scroll box, the element's region; the table's computed `display` is `table`, its `overflow-x`
    is `visible` and its `container-type` is `normal`; the table's rendered inline size is not smaller than outside a
    prose container; and the table's `border-collapse`, every body cell's and header cell's computed padding,
    `min-inline-size`, font weight and `text-align`, and the caption's `position` and `text-align` equal those of the
    same table outside a prose container, so the cell padding is still the
    compact padding of US1-2 (FR-012).
11. **Given** the page in light or dark theme, **When** it renders, **Then** cell text and header text meet the tokens'
    text-contrast declaration on each main ground (without `striped`, a hovered row or `sticky-header` no ground is
    painted; with them, on the grounds FR-013's table names); the row rules and the
    header rule are decorative and are not held to 3:1 (FR-013). **Given** forced colours, **Then** every cell's and
    header's computed text colour is a system colour, and the row rules and the header rule are drawn in a system
    colour and visible (FR-005, FR-013).
12. **Given** the table under `dir="rtl"`, **When** it renders and overflows, **Then** its first column is at the right,
    cell text aligns to the inline start, and the region's start edge is the right edge (FR-008, FR-005).
13. **Given** an overflowing data table, **When** its rows are replaced by an htmx-style swap of the `<tbody>` or of the
    whole `<table>` with a narrower one that fits, **Then** the region re-decides its overflow state without a resize of
    the page: it is no longer a tab stop, and if it had focus, focus moves as 009's focus handover states (FR-008,
    FR-014).
14. **Given** a consumer stylesheet rule `td { padding-inline: <a token step> }` (specificity (0,0,1)), outside a
    prose container, **When** the table renders, **Then** every body cell's computed `padding-inline` is the
    consumer's value, not the data table's (FR-005).
15. **Given** a data table that fits its 1280 px container, **When** its `<table>` is replaced by an htmx-style swap
    with a wider one that overflows, **Then** the new table is shown (the slot is re-assigned) and the region becomes a
    tab stop with role `group` and its name, without a resize of the page (FR-003, FR-008, FR-014).
16. **Given** an overflowing data table with no `label` and no host `aria-label`, named "Work packages" by its caption,
    **When** the caption's text changes to "Open work packages", **Then** the region's accessible name becomes "Open
    work packages" (FR-010).
17. **Given** an `ocelle-data-table` with `sticky-header`, `label="Work packages"`, a host block size bounded by a
    page rule (`max-block-size`) below the table's height, and a table of a caption, one header row and twenty body
    rows that fits its 1280 px container inline, **When** the region is scrolled in the block axis to its middle and to
    its end, **Then** the `<thead>`'s block-start edge stays at the scroll box's client block-start edge (within
    0.5 px) while the body rows move; the point at the centre of each column header returns that header cell (no body
    cell paints over it, and its ground is `--ocelle-color-sheet`); the header rule is drawn below the header row at
    every scroll position; and the page's scroll height does not change (FR-017, FR-018).
18. **Given** that table, **When** it renders, **Then** the scroll box has `tabindex="0"`, role `group` and the name
    "Work packages", although nothing overflows inline; **When** the box is focused and the user presses ArrowDown and
    then ArrowUp, **Then** it scrolls towards the block end and back by the module's step; ArrowLeft and ArrowRight
    and a modified ArrowDown do not scroll it; **When** the host's bound is removed so the table fits, **Then** the box
    has no `tabindex`, role or name (FR-018).
19. **Given** that table with a link in its twelfth body row, scrolled so the row sits under the pinned header, **When**
    the user tabs to the link, **Then** the box scrolls in the block axis so the link's focus ring box is wholly below
    the header row's block-end edge and inside the box (WCAG 2.4.11, focus not obscured); **When** a link inside a
    header cell is focused, **Then** the box does not scroll in the block axis (FR-017, FR-018).
20. **Given** `sticky-header` with no bound on the host's block size, **When** it renders, **Then** the table is shown
    at its full height, the scroll box does not scroll in the block axis (its scroll height equals its client height)
    and, while it fits inline, it has no `tabindex`, role or name, as without `sticky-header` (FR-017).
21. **Given** the US1-17 table with the twenty rows' identifiers unbroken, in a 320 px container, **When** the region
    is scrolled to the inline end and then in the block axis, **Then** the page's scroll width equals the viewport
    width, the header row stays pinned at the box's block start, each column header stays above its column's cells
    (equal inline start within 0.5 px) at every scroll position, and the inline fades of 009's contract show as before
    (FR-017, FR-018, FR-009).
22. **Given** a table whose estimate column's header and body cells carry `data-ocelle-align="end"`, inside an
    `ocelle-data-table`, inside a `[data-ocelle-prose]` container, and in a plain prose table, **When** it renders,
    **Then** each such cell's computed `text-align` is `end` and its `font-variant-numeric` `tabular-nums`, and the
    inline-end edge of its text's line box is at its content box's inline-end edge (within 0.5 px); under `dir="rtl"`
    the text sits at the cell's left; the other cells stay start-aligned; and the header keeps its eyebrow type (FR-019).
23. **Given** `striped` on an `ocelle-data-table` whose table has two `<tbody>` groups of five rows and a `<tfoot>`,
    **When** it renders in light and dark, **Then** every cell of each group's second and fourth row has the
    background `--ocelle-color-inset`, every other cell (odd rows, header and footer rows) paints none, the cells' text
    colours are unchanged (each with a text declaration on inset, FR-013), and the row rules are still drawn; **When**
    `striped` is removed, **Then** no cell has a ground (FR-060).
24. **Given** a data table with and without `striped`, **When** the pointer hovers a body cell, **Then** every cell of
    that body row has the background `--ocelle-color-hover-bg`, over a stripe too, and no other row changes; hovering
    a header or footer row paints nothing; no event is emitted, no tab stop is added and the computed `cursor` stays
    `auto` (FR-061, FR-011).
25. **Given** forced colours, **When** a striped table renders with one body row hovered and with `sticky-header` and a
    bound, **Then** the first cell of every body row has an inline-start border of width `--ocelle-bar-width`: in
    `CanvasText` on the even rows of the striped table, in `Highlight` on the hovered row and in `Canvas` on the others,
    so the stripes and the hovered row stay distinguishable; the pinned header is opaque (a system background) with its
    rule in `CanvasText`; and cell text is a system text colour (FR-013, FR-017, FR-060, FR-061).
26. **Given** the US1-17 table at its block start, **When** it renders, **Then** the region shows a fade at its block
    end: the scroll box carries `data-block-fade="end"`, and its mask fades the content over the fade depth
    (`--ocelle-scroller-fade-size`) towards the box's client block-end edge, with the fade's block-start edge at or
    below the pinned header row's block-end edge, so the header row and both scrollbars are never faded; **When** it is
    scrolled to its block end, **Then** no block-end fade shows (no `data-block-fade`), and scrolled back by ArrowUp it
    shows again; **Given** a bound that leaves less than twice the fade depth below the header row, **Then** no
    block-end fade shows although rows are below (FR-018).
27. **Given** the US1-21 table at 320 px, scrolled to the inline middle and the block start, **When** it renders,
    **Then** the inline fades of 009's contract and the block-end fade show together, the box carrying both
    `data-fade="both"` and `data-block-fade="end"`, and a point under both fades is faded by both; **Given** a link in
    the last body row that shows above the box's block end, inside the fade, **When** the user tabs to it, **Then** the
    box scrolls in the block axis so the link's focus ring box is wholly above the fade's block-start edge (or the
    fade is gone at the block end) and below the header row (WCAG 2.4.11, FR-018).
28. **Given** forced colours, **When** the US1-17 table renders at its block start, **Then** no mask is drawn and a
    line of `--ocelle-border-width` in `CanvasText` marks the region's block end while rows are below, beside the
    inline lines of 009's contract when it also overflows sideways; scrolled to its block end, **Then** that line is
    gone (FR-013, FR-018).

---

### User Story 2 - An event history as an ordered list (Priority: P2)

A Kitty Desktop mission view shows its event history: "Mission created", "Plan approved", "Review requested", each with
a time. The developer writes `<ocelle-event-timeline label="Mission history">` with one `<ocelle-timeline-event
time="14:02">` per event and the event's text as its content; where the time must be machine-readable, they write it as
`<time slot="time" datetime="…">14:02</time>` inside the event instead. Each event shows a small dot marker on a
vertical line that joins the events, its time in tabular figures and its text. A screen-reader user hears a list named
"Mission history" with three items, in order, each with its time and its text, and hears nothing of the dots or the
line. An htmx poll appends an event at the end and the list grows.

**Why this priority**: the event history is a Desktop V2 primitive (#470) every mission view uses; it is a static
readout on 013's slotted-item pattern.

**Independent Test**: render an `ocelle-event-timeline` with four events, one with a 26-character identifier in its
text and one with its time in the `time` slot. At 1280 px and 320 px, check the marker size, the accessibility tree,
the reading order and the page's scroll width.

**Acceptance Scenarios**:

1. **Given** an `ocelle-event-timeline` with `label="Mission history"` and three `ocelle-timeline-event` children,
   **When** the accessibility tree is read in Chromium, **Then** it holds one list named "Mission history" with three
   list items in source order, each item's item text (FR-016) being its time, a space and its content (for example
   "14:02 Mission created"); no marker or connector is in the tree, and axe reports no serious or critical finding,
   `list` and `listitem` included (FR-020, FR-022, FR-016).
2. **Given** the same element, **When** its markers are measured, **Then** each event has one marker of inline and block
   size `--ocelle-size-dot`, centred on the first line of its event, and a connector joins each marker to the next
   one; the last event has no connector after it (FR-021).
3. **Given** an event with `time="14:02"`, **When** its computed style is read, **Then** the time is in
   `--ocelle-font-sans` with `tabular-nums` through `--ocelle-figures` and is distinct from the content by more than
   colour (size or weight, the plan names it); **Given** an event with no time (no non-blank `time` and no slotted
   time), **Then** it shows its content with no empty time box and the list item's item text (FR-016) is its content
   alone (FR-023).
4. **Given** an event whose content holds a 26-character identifier and whose `wrap="anywhere"` is set, **When** the
   timeline is 320 px wide, **Then** the identifier wraps inside the event, the page's scroll width equals the viewport
   width, and copying the content gives the identifier unchanged (FR-024, FR-009).
5. **Given** a timeline with three events, **When** a fourth `ocelle-timeline-event` is appended, one is removed, or one
   gets `hidden`, **Then** the list and its markers follow at once: the list item count matches the visible events, the
   connectors join only visible events, and nothing throws (FR-025).
6. **Given** a timeline whose children include text, a `<div>` and an `<li>`, **When** it renders, **Then** only the
   `ocelle-timeline-event` children are shown and exposed (FR-020).
7. **Given** an event holding a link, **When** the user tabs, **Then** the link keeps its own tab stop and focus ring
   and the timeline adds no tab stop (FR-026).
8. **Given** light and dark themes and forced colours, **When** it renders, **Then** time and content text meet the
   tokens' text-contrast declaration on each main ground, the markers (structural) are drawn in one of the ink tokens
   FR-013 allows and meet 3:1 non-text contrast against each of the nine main grounds FR-013 names (canvas, sheet,
   pane, panel, inspector, rail, inset, accent-low, hover-bg), the connectors (decorative) are not held to 3:1, and in
   forced colours the markers and connectors are drawn in a system colour and visible (FR-013, FR-027).
9. **Given** the timeline under `dir="rtl"`, **When** it renders, **Then** the markers and connector are on the inline
   start side (the right) (FR-021).
10. **Given** a timeline with `label="Mission history"` and a blank host `aria-label` (`aria-label=""` or only white
    space), **When** the accessibility tree is read, **Then** the list is named "Mission history": the blank host
    `aria-label` counts as absent; **Given** a blank host `aria-label` and no `label` (or a blank one), **Then** the
    list is unnamed; **Given** a non-blank host `aria-label` "History" and `label="Mission history"`, **Then** the list
    is named "History" (FR-022).
11. **Given** a timeline whose second event has no `time` attribute and holds `<time slot="time"
    datetime="2026-11-15T14:20">14:20</time>` written after its content "Plan approved", **When** it renders, **Then**
    the slotted `<time>` is shown in the event's `part="time"` box above the content, unchanged (its `datetime`
    attribute and text are the consumer's, nothing is written on it); its computed font family, font size, font weight,
    colour, `font-variant-numeric` and line height equal those of an attribute time (US2-3), also when the slotted
    element is a `<b slot="time">` (whose own default weight is bold); the list item's item text (FR-016) is "14:20
    Plan approved", time first although the `<time>` follows the content in source; and the marker is centred on the
    time's line, as for an attribute time (FR-023, FR-021, FR-016).
12. **Given** an event with `time="09:00"` and a slotted time "14:20", **When** it renders, **Then** only "14:20" is
    shown and exposed: no rendered text and no `StaticText` of the event is "09:00", and the item text is "14:20" a
    space and the content; **When** the slotted time is then removed, **Then** "09:00" is shown and the item text is
    "09:00" a space and the content, without a page reload (FR-023, FR-025).
13. **Given** an event with no `time` attribute whose only slotted time is empty (`<time slot="time"></time>`), white
    space only, `hidden` or `aria-hidden="true"`, **When** it renders in a timeline, **Then** it has no time box, the
    slotted node is neither shown nor exposed, the item text is its content alone, the marker is centred on the
    content's first line, and the previous event's connector ends as before an untimed event (FR-021, FR-023);
    **Given** the same event with `time="09:00"` as well, **Then** "09:00" is shown and exposed as its time (FR-023).
14. **Given** an event whose slotted time is empty, **When** its text is filled ("14:20"), and **Given** one whose
    slotted time is `hidden`, **When** `hidden` is removed, **Then** in each case the time box appears with the slotted
    time, the item text becomes time first, the marker moves to the time's line and the previous connector's end
    follows, without a page reload or resize; the reverse changes remove the time box again; **Given** an event whose
    `<time>` child has no `slot` attribute (so it is part of the content), **When** `slot="time"` is set on that child,
    **Then** the same follows, and **When** the `slot` attribute is removed again, **Then** the time box goes and the
    node is shown in the content (FR-023, FR-025).

---

### User Story 3 - An evidence chain that wraps (Priority: P3)

A review screen shows the chain of evidence behind a verdict: "Spec", "Plan", "Tasks", "Red commit", "Green commit",
"Review". The developer writes `<ocelle-evidence-chain label="Evidence">` with one `<ocelle-evidence-step>` per link.
In a wide column the steps sit in one row, each with a round step marker showing its number, joined by connectors. In a
narrow column the steps wrap onto further lines and stay in order; nothing scrolls sideways. A compact summary uses
`variant="chip"` on some steps, so they read as small chips in the row. A screen-reader user hears an ordered list
named "Evidence" with six items, and hears nothing of the connectors or the visible numbers.

**Why this priority**: the evidence chain is an epic #1 gap (#517); it reuses US2's list pattern and adds wrapping and
the chip variant.

**Independent Test**: render an `ocelle-evidence-chain` with six steps, two of them chips. At 1280 px, 600 px and
320 px, check line wrapping, reading order, marker size and ring, connector exposure and the page's scroll width.

**Acceptance Scenarios**:

1. **Given** an `ocelle-evidence-chain` with `label="Evidence"` and six `ocelle-evidence-step` children, **When** the
   accessibility tree is read in Chromium, **Then** it holds one list named "Evidence" with six list items in source
   order, each item's item text (FR-016) being its content only (for example "Red commit": no visible number, no
   connector text); axe reports no serious or critical finding (FR-030, FR-032, FR-016).
2. **Given** the chain in a 1280 px container where the six steps fit, **When** it renders, **Then** the steps sit in
   one row from the inline start, in source order, each default step with a marker of inline and block size
   `--ocelle-size-step` drawn with a ring of `--ocelle-ring-step` showing the step's ordinal (1 to 6) in tabular figures,
   and a connector between each pair of consecutive steps on the row (FR-031, FR-033).
3. **Given** the same chain in a 320 px container, **When** it renders, **Then** the steps wrap onto further lines,
   each line filled from the inline start in source order, no step is cut or overlaps another, no connector extends
   past the chain's inline edges or crosses from one line to the next, and the page's scroll width equals the viewport
   width (FR-034, FR-009).
4. **Given** a step with `variant="chip"` beside a default step, **When** it renders, **Then** it has no marker and no
   ordinal; its outline's computed corner radius is the value of `--ocelle-radius-2`, not of `--ocelle-radius-pill`;
   its rendered block size is less than `--ocelle-size-step`; its content's computed font size is one step below the
   default step content's on FR-035's scale (xs < sm < md < lg < xl < 2xl); no custom property, part or hook of `ocelle-pill-tag`
   is read by its styles; and the chain's list semantics and order are unchanged (FR-035).
5. **Given** a step whose content is long text, **When** the chain is 320 px wide, **Then** the text wraps between words
   inside the step and never widens the chain; with `wrap="anywhere"` on a step holding an unbroken identifier, the
   identifier breaks inside the step (FR-034, FR-024).
6. **Given** a step added, removed or given `hidden`, **When** the chain updates, **Then** the visible ordinals stay
   1 to N in source order of the visible steps, and the list item count matches the visible steps (FR-033, FR-025).
7. **Given** children that are not `ocelle-evidence-step`, **When** it renders, **Then** they are neither shown nor
   exposed (FR-030).
8. **Given** light and dark themes and forced colours, **When** it renders, **Then** step text, chip text and the
   ordinals meet the tokens' text-contrast declaration on each main ground (the ordinal against the marker's inside:
   each main ground, or the fill FR-031 allows), the marker rings and chip outlines (structural) are drawn in one of the ink tokens FR-013 allows and meet
   3:1 non-text contrast against each of the nine main grounds FR-013 names (canvas, sheet, pane, panel, inspector,
   rail, inset, accent-low, hover-bg), the connectors (decorative) are not held to 3:1, and in forced colours
   markers, rings, ordinals, connectors and chip outlines are drawn in system colours and visible (FR-013, FR-036).
9. **Given** the chain under `dir="rtl"`, **When** it renders, **Then** the first step is at the inline start (the
   right) and lines fill towards the left (FR-034).
10. **Given** a chain with `label="Evidence"` and a blank host `aria-label` (`aria-label=""` or only white space),
    **When** the accessibility tree is read, **Then** the list is named "Evidence": the blank host `aria-label` counts
    as absent; **Given** a blank host `aria-label` and no `label` (or a blank one), **Then** the list is unnamed;
    **Given** a non-blank host `aria-label` "Proof" and `label="Evidence"`, **Then** the list is named "Proof" (FR-032,
    FR-022).

---

### Edge Cases

- **Data table with no `<table>` child, or with more than one.** The element shows its first direct `<table>` child
  only; other children (text, a second table, a `<div>`) are neither shown nor exposed. With no table it renders an
  empty region that never overflows and throws nothing (FR-003).
- **A table nested in a cell.** Only the direct `<table>` child is the element's; a table inside a cell is the
  consumer's and keeps the scoped cell rules only where the plan's selectors reach it (the plan states which).
- **A table with no rows, or no `<thead>`.** It renders as the consumer wrote it. An empty table pairs with
  `ocelle-empty-state` outside or below it (the consumer's); the element adds no text.
- **Row headers and multi-row headers.** `<th scope="row">` in the body takes the row-header style (US1-3). A header
  cell with `colspan` or a second header row keeps the eyebrow style; `headers` and `id` references between cells stay
  in the consumer's tree and keep working (FR-004).
- **A table inside a consumer's shadow root.** `@ocelle/styles` rules do not cross into a consumer's shadow root; the
  consumer adopts the library's stylesheet there, and the README says so (FR-005).
- **Data table before the elements are defined.** The `<table>` is in the page from the start and shows with the
  `@ocelle/styles` cell rules (which select the undefined element too) and no scroll region, so a server-rendered page
  shows the table before upgrade; a wide table may then widen the page until upgrade, and direct children that are
  not the table are shown and exposed until upgrade, because no shadow root exists yet (FR-012).
- **Timeline and chain before the elements are defined.** A server-rendered timeline or chain shows its items one per
  line before upgrade (an `@ocelle/styles` rule at specificity (0,0,0) selects the undefined containers' visible
  items, as for 013's facts), so the items do not run together. Before upgrade an attribute `time` does not show (the
  event renders it in its shadow root), while a slotted time is the consumer's light-DOM node and shows inline where
  it is written (before the content when written first; an `aria-hidden="true"` one shows too, unexposed, until
  upgrade). No marker, connector or ordinal shows; the README's "Before upgrade" line for each container says so
  (squad round 1, PLAN-FRESH-1-004, operator decision (a); plan gate Q-E).
- **Data table at 200% zoom and 320 px.** The table scrolls inside its region; the page does not scroll sideways (WCAG
  1.4.10's exception for two-dimensional data tables applies to the table's own content, not the page).
- **Data table print.** The plan's research records what 009's region does in print (scrolled content may be clipped).
  No print requirement is added here beyond that record; the README states the behaviour. A bounded `sticky-header`
  table prints its box only (rows past the bound are clipped too); the README says so.
- **Sticky header with no `<thead>`, or with two header rows.** With no `<thead>` nothing is pinned and the table
  scrolls whole in the block axis. All rows of the `<thead>` are pinned together, as one group (FR-017). A header row
  written in `<tbody>` (`<th scope="col">` cells there) is not pinned.
- **Sticky header and the caption.** The caption is above the header row and scrolls away in the block axis with the
  body; it is not pinned (FR-017; it is not sticky in the inline axis either, Q-F (b)).
- **Sticky header without a bound.** As US1-20: nothing scrolls in the block axis and nothing changes but the border
  model (FR-017). The README says the bound is the page's rule on the host.
- **`sticky-header` toggled after mount.** Setting or removing the attribute switches the region between the two axes
  and the table's border model without a page reload; the tab stop follows the new overflow state, and the block-end
  fade goes with the option (FR-017, FR-018).
- **Block-end fade and the pinned header.** The fade is at the block end only, never at the block start, where the
  header row is pinned; its block-start edge is never above the header row's block-end edge. A bound that leaves less
  than twice the fade depth below the header row shows no block-end fade (the scrollbar still shows that rows are
  below). A table with no `<thead>` measures that space from the box's own block start (FR-018).
- **Block-end fade with the sideways fades.** Both show together when the region overflows in both axes; a corner
  under both is faded by both, the inline fades still span the header row as 009's do, and neither fade covers a
  scrollbar (FR-018).
- **Block-end fade and focus.** A focused element in the faded rows is scrolled clear of the fade and of the header;
  one taller than the space between them is aligned below the header and the block-end fade is held off until focus
  leaves it or the user scrolls, as 009's inline fallback (FR-018, WCAG 2.4.11).
- **Block-end fade in forced colours.** No mask is drawn; a `CanvasText` line marks the block end while rows are below,
  as 009's inline lines mark the inline edges (FR-013, FR-018).
- **Block-end fade without a bound.** With no bound nothing scrolls in the block axis, so no block-end fade shows
  (US1-20).
- **Striped rows with hidden rows.** A `hidden` body row still counts in the alternation (the stripes follow source
  positions, `:nth-child`), so the visible rows may show two plain or two striped rows together; the README says so.
  Each `<tbody>` starts its own count (FR-060).
- **Hover on a row holding a link.** The link keeps its colour (`--ocelle-color-link` has a text declaration on
  `hover-bg`); the hover adds no event, focus or cursor change (FR-061). On a device with no hover nothing shows.
- **The numeric hook outside a data table, or on a non-cell element.** The hook sets the same two declarations on any
  element (FR-019); on a 003 prose table it overrides the prose cell's `text-align`. A header cell of a numeric column
  takes it the same way, and keeps its eyebrow type.
- **Caption while the region scrolls.** The caption is part of the table and scrolls with it unless the plan keeps it
  at the region's start edge (as 003's prose table does); either way it is never cut at 320 px (it wraps).
- **A timeline or chain with no items.** It renders nothing visible, exposes no list item, and throws nothing; whether
  an empty list node is exposed is set in the plan and tested (FR-025).
- **`ocelle-timeline-event` outside `ocelle-event-timeline`, `ocelle-evidence-step` outside `ocelle-evidence-chain`.**
  The item shows its time (for an event: the slotted time, else the attribute's, FR-023) and content as plain text,
  with no marker, no connector and no list item role. It throws nothing (FR-020, FR-030). Each has a story in its
  container's stories file (FR-050).
- **More than one slotted time.** The event has a slotted time when at least one visible direct child with
  `slot="time"` has non-blank text (FR-023). It then shows every visible one in the time box in source order, a blank
  one beside a non-blank one included: the blank one adds no text to the item text (white space is collapsed,
  FR-016). With no non-blank one, none is shown (FR-023). The README asks for one time element per event.
- **A hidden item.** An item with `hidden` or `aria-hidden="true"` is not shown, not exposed, gets no marker or ordinal
  and is skipped by the connectors, until the attribute is removed (FR-025).
- **Order.** The timeline and the chain keep source order. Neither sorts by time; newest-first or oldest-first is the
  consumer's markup order, and the README says the ordered list announces that order.
- **Live updates.** Appended events are not announced: neither element adds a live region. A consumer that needs an
  announcement owns its own live region (FR-026).
- **A very long chain.** A chain of twenty steps wraps onto as many lines as it needs; markers and ordinals stay legible
  (ordinals of two digits fit the marker, FR-033).
- **Chip steps mixed with default steps.** They share a row and wrap together; a chip step has no marker and no
  ordinal (FR-035), and the ordinals of the default steps count every visible step, chip steps included, so the
  numbers match the list's positions.
- **Lang and dir on items.** An item's `lang` and `dir` apply to its own content and time (WCAG 3.1.2). A slotted
  time may carry its own `lang` and `dir`, which apply to it alone.
- **Two copies of the package on a page.** As the library's existing rule: the first definition wins.
- **Loading.** None of the five elements has a loading or busy state, during an htmx swap or otherwise; a consumer
  that needs one marks it on its own markup.

## Requirements *(mandatory)*

### Common to the five elements

- **FR-001**: Each element MUST follow the README's § Element conventions: its own module `src/<tag>.ts` with one
  `define` call (a container module also imports its item element), `static properties` with `declare` fields, a
  `@tagname` JSDoc tag, a description and `@default undefined` for every public property, one `static styles` built only
  from `--ocelle-*` tokens, `:host([hidden]) { display: none; }`, variant rules inside
  `@media not (forced-colors: active)`, an entry in the committed `custom-elements.json`, an export from `src/index.ts`,
  and a README section (the item elements documented in their container's section).
- **FR-002**: An element MUST NOT require or document a `class` attribute for its look. Every variant is a property or
  attribute (spec-kitty-design#523). No `sk-` name and no monospace family MAY appear in source, styles, stories or
  build output (the `prefix` gate).
- **FR-009**: No element MAY cause horizontal scrolling of the page at 320 px CSS width or at 200% zoom for content that
  wraps between words or carries the wrap policy (FR-007, FR-024). A data table wider than its column scrolls inside
  its own region (FR-008), never the page.
- **FR-011**: The elements emit no event. Only the data table's overflowing region is a tab stop (FR-008); otherwise no
  element adds a tab stop. Focusable content a consumer puts in a cell, an event or a step keeps its own tab stop and
  focus ring.
- **FR-013**: The **main grounds** are the nine grounds of the tokens' contrast declarations on which content sits:
  `--ocelle-color-canvas`, `-sheet`, `-pane`, `-panel`, `-inspector`, `-rail`, `-inset`, `-accent-low` and
  `-hover-bg`. Every text colour an element sets (cell, header, time, content, step and chip text, and the ordinal
  inside a step marker) MUST use a token whose text-contrast declaration covers each main ground, in light and dark;
  the ordinal's ground is the marker's inside (FR-031). Each line and mark the elements draw is classed as follows, and
  only the structural ones MUST meet 3:1 non-text contrast (WCAG 1.4.11) against each main ground, in light and dark:

  | Line or mark | Class |
  |---|---|
  | Data-table row rule (between body rows) | decorative, exempt from 3:1 (table semantics convey rows) |
  | Data-table header rule (below the header row) | decorative, exempt from 3:1 |
  | Timeline marker (`--ocelle-size-dot`) | structural, 3:1 |
  | Timeline connector | decorative, exempt from 3:1 |
  | Evidence-step marker ring (`--ocelle-ring-step`) | structural, 3:1 |
  | Evidence-chain connector | decorative, exempt from 3:1 |
  | Chip-step outline | structural, 3:1 (it is the chip's only boundary) |
  | Data-table stripe ground (`--ocelle-color-inset`, even body rows, FR-060) | decorative ground, exempt from 3:1 against its neighbours (table semantics and the row rules convey rows); text on it is held to the text declaration, inset being a main ground |
  | Data-table hover ground (`--ocelle-color-hover-bg`, the hovered body row, FR-061) | decorative ground, exempt from 3:1; text on it is held to the text declaration, hover-bg being a main ground |
  | Data-table pinned header ground (`--ocelle-color-sheet`, FR-017) | a ground, opaque so no row shows through; header text on it is held to the text declaration, sheet being a main ground |
  | Data-table forced-colours row band (the first body cell's inline-start border, `--ocelle-bar-width`; FR-060, FR-061) | forced colours only: `CanvasText` on striped even rows, `Highlight` on the hovered row, `Canvas` otherwise; it stands in for the two grounds, which forced colours remove |
  | Region block-end fade (the module's mask, FR-018) | not a line: a mask over the content, as 009's inline fades; drawn only outside forced colours |
  | Region block-end line (`--ocelle-border-width`, forced colours only; FR-018) | forced colours only: `CanvasText`, as 009's inline edge lines; it stands in for the block-end fade |

  A decorative line MAY use `--ocelle-color-rule` or `--ocelle-color-rule-strong`. A structural one MUST use a token
  whose contrast declaration, text or non-text, covers all nine main grounds in both themes: a text declaration
  qualifies because its threshold (4.5:1) is above 3:1. The rule tokens have no declaration and MUST NOT be used for a
  structural mark (they are decorative, constitution II). `--ocelle-color-control-border` (no declaration on inset,
  accent-low or hover-bg) and `--ocelle-color-accent-strong` (none on the first six grounds) do not qualify. Of the
  existing tokens that qualify, a structural mark MUST use one of the ink tokens (`--ocelle-color-ink`, `-ink-soft`,
  `-ink-muted`), which the plan picks; it MUST NOT use `--ocelle-color-focus` or `--ocelle-color-current` (a mark must
  not look like focus or the current item), `--ocelle-color-link` or a state colour (`--ocelle-color-danger`, and so
  on: per-step and per-event states are out of scope, Assumptions). Because the ink tokens qualify, no mark-colour
  token is added under FR-040. In forced colours, text is a system text colour, and every line and mark classed above,
  decorative ones included, is drawn in a system colour and visible.
- **FR-016**: The **item text** of a list item, used by every scenario that asserts what a timeline or chain item
  exposes, is measured in Chromium's accessibility tree (the full tree, ignored nodes left out): the names of the text
  nodes (role `StaticText`) in the list item's subtree, in tree order, joined with single spaces, with every run of
  white space collapsed to one space and the result trimmed. It is not the list item's accessible name (Chromium
  computes none for `listitem` from content) and not `textContent`. A test that asserts an item text MUST also assert
  that the item text is not empty when the item has content, so the assertion cannot pass on an empty subtree.

### `ocelle-data-table` (P1)

- **FR-003**: `ocelle-data-table` MUST take a native `<table>` as its first direct light-DOM `<table>` child (operator
  decision Q1 (a)) and show it, unchanged, inside its region: the element never copies, moves or rewrites the table or
  its cells. Other direct children are neither shown nor exposed. The table is assigned to the region's slot by manual
  slot assignment (the library's slotted-items convention), and the element re-assigns the slot whenever its direct
  children change, so a `<table>` replaced by a swap is shown at once.
- **FR-004**: The accessibility tree MUST expose the consumer's table with the platform's own table semantics (a table
  named by its caption, rows, column and row headers, cells associated with their headers, `headers`/`id` references
  between cells), measured in Chromium against the same table outside the element, with no serious or critical axe
  finding. The element adds no table, row, cell or header role and no ID reference across a shadow root.
- **FR-005**: Body cells MUST use `--ocelle-font-sans`, `--ocelle-figures`, `--ocelle-color-ink-soft` and a compact
  padding from the `--ocelle-space-*` scale smaller than 003's prose table cell (`--ocelle-space-2` block,
  `--ocelle-space-3` inline), with a row rule in a token colour between body rows, at a font size and line height the
  plan names from the tokens. Because shadow-root styles cannot reach a slotted table's cells, these rules MUST ship in
  `@ocelle/styles` and MUST NOT need a class. Outside a prose container every data-table rule MUST have specificity
  (0,0,0) (the whole selector inside `:where()`, for example `:where(ocelle-data-table > table td)`), so any consumer
  rule that matches the same element wins, whatever its specificity. The prose override is FR-012's separate rule set.
  The README MUST say that the table's look needs `@ocelle/styles` on the page (or adopted in a consumer's shadow
  root), what the table shows without it, and the specificity a consumer rule needs inside a prose container
  (FR-012).
- **FR-006**: Column header cells (each `<th>` in the table's `<thead>`, and each `<th scope="col">`) MUST be eyebrows
  (#533) in 011's four eyebrow tokens, as 011's page and section headers use them: font size
  `--ocelle-font-size-eyebrow`, weight `--ocelle-font-weight-eyebrow`, upper case, letter spacing
  `--ocelle-tracking-eyebrow` and colour `--ocelle-color-eyebrow`, whose text declaration covers the main grounds
  (FR-013). This mission adds no eyebrow token (recheck Q1 (a), 2026-11-17, which replaces `--ocelle-tracking-caps`,
  not on `main`, and plan-gate Q-B's weight and colour). Row header
  cells (`<th scope="row">`) MUST use the body cell size in `--ocelle-color-ink` at a weight the plan names, not upper
  case. Where the rules meet: `scope="row"` takes the row-header style wherever it is (a corner cell in `<thead>`
  included); a `<th>` with no `scope` in `<tbody>` or `<tfoot>` takes the row-header style; `scope="colgroup"` takes
  the column-header style and `scope="rowgroup"` the row-header style. Because the column headers are drawn in upper
  case, Chromium names each by its upper-case text; the README of each package (`@ocelle/elements` and
  `@ocelle/styles`) MUST state that the accessible names of column headers follow the drawn upper-case text (spike
  Q2 (a), 2026-11-18).
- **FR-007**: The element MUST take a `wrap` property with the one value `anywhere`, which sets
  `overflow-wrap: anywhere` on its body cells (never on header cells), and a cell element with `data-ocelle-wrap="anywhere"`
  (003's hook) MUST keep that behaviour inside the element. Without it, cell text wraps between words. The element
  never truncates a cell (no ellipsis); copying gives the cell's text unchanged.
- **FR-008**: The element MUST build its region on mission 009's internal overflow-region module exactly as
  `specs/009-workflow-layouts/contracts/overflow-region.md` states (operator decision Q2 (b)): the `OverflowRegion`
  controller with the default role `group`, `overflowRegionStyles`, and the `.region-frame`, `.region-box`,
  `.region-track`, `.region-ring` and `.region-edge` structure with the table's slot inside `.region-track`, the label
  passed through `setLabel`, and `aria-label` in `observedAttributes`. While the table overflows its column the scroll
  box is a tab stop, named, with arrow-key scrolling, fades, focus clearance and focus handover as the contract states;
  while it fits, the box has no tab stop, role or name. The element MUST NOT reimplement any of the module's behaviour
  or change the module, except for exactly one change: the opt-in block-axis option of FR-018, which this mission adds
  to the module for the sticky header row (inventory decision IQ-2, 2026-11-18). Any other need the module does not
  meet goes to the operator.
- **FR-010**: The region's name MUST be, in order: a non-blank host `aria-label`; else the element's non-blank `label`;
  else the trimmed text content of the table's `<caption>`, read by the element and passed to the module as its
  label (no ID reference), and re-read when the caption changes; else none, which the contract handles (tab stop, no
  role, no name). The README MUST tell consumers to give an overflowing table a caption or a `label`, and to give it
  a `label` that differs from its caption's text, because a region named by its caption is announced with the same
  name as the table it holds (inventory decision IQ-6 (a), 2026-11-18: the caption fallback stands).
- **FR-012**: 003's prose table rules (`[data-ocelle-prose=""] :where(table)`, `:where(th, td)`, `:where(th)` and
  `:where(caption)`, each at specificity (0,1,0)) beat FR-005's (0,0,0) rules inside a `[data-ocelle-prose]`
  container. `@ocelle/styles` MUST therefore ship a separate prose override rule set for a data table's table, cells,
  header cells and caption inside a prose container, at specificity (0,1,0) placed after 003's prose table rules in
  the stylesheet, or at a higher specificity. It MUST reset every property 003's prose table rules set to the value
  the data table has outside prose. "Every property" governs; the properties 003's rules set today are: on the table
  `display` (to `table`), `overflow-x`, `max-inline-size`, `container-type` (to `normal`, so the table does not
  collapse in the region's track) and `border-collapse`; on cells `min-inline-size`, `padding`, `border-block-end` and
  `text-align`; on header cells the font weight, size, figures and rule colour; on the caption `position`,
  `inset-inline-start`, `max-inline-size` and `text-align`. Inside prose the table then looks exactly as
  outside, and the element's region is the only sideways scroll box. A consumer rule inside a prose container needs a
  specificity above (0,1,0), or (0,1,0) placed after `@ocelle/styles`, to win; the README states this. Before the
  element is defined, the `@ocelle/styles` cell rules apply to the table (FR-005); the README states that a wide table
  may widen the page until upgrade and that other direct children are shown until upgrade.
- **FR-014**: The element MUST re-decide its overflow state after a change of its table, its rows or its cells (an htmx
  swap of the `<tbody>` or of the `<table>`), as the module's `slotchange` and resize triggers allow; a change the
  module does not observe is named in the plan's research from measurement, and the README tells consumers what to do
  there.
- **FR-015**: The element's `label` property (string, unset by default) names the region (FR-010) and nothing else; it
  is not shown. A host `aria-hidden="true"` or `hidden` follows the library's Host ARIA rule.
- **FR-017** (inventory decision IQ-2, 2026-11-18): The element MUST take a `stickyHeader` property, reflected as the
  boolean attribute `sticky-header` (present with any value, the empty string included; unset by default). While it
  is set:
  - the region scrolls on both axes through FR-018's option, and the table's `<thead>` (all its rows, as one group)
    stays pinned at the scroll box's client block-start edge while the body rows scroll in the block axis; the
    caption and any header row outside `<thead>` scroll with the body;
  - the **block bound** is the page's: the consumer bounds the host's block size with a rule of its own
    (`block-size` or `max-block-size` on the host; no attribute, no `style` attribute), and the region fills that
    bound. With no bound the table is shown at full height and nothing scrolls in the block axis (US1-20);
  - the header cells paint the opaque ground `--ocelle-color-sheet` (the operator's decision Q-I1, 2026-11-18), so no
    row shows through, and the header rule
    travels with the pinned row (the table uses separated borders with no spacing, which draws the row rules as before);
  - a focused element in a body row is kept clear of the pinned header row (US1-19, WCAG 2.4.11);
  - the cell rules ship in `@ocelle/styles` like FR-005's, at (0,0,0) outside prose and with FR-012's override inside
    it.
  Setting or removing the attribute after mount takes effect without a page reload. The README MUST state the bound,
  the caption's behaviour, the header ground, the block-end fade while rows are below (FR-018) and print.
- **FR-018** (inventory decision IQ-2): This mission MUST add exactly one change to mission 009's internal
  overflow-region module: an opt-in **block-axis option**, specified in `contracts/overflow-region-block-axis.md`,
  which amends `specs/009-workflow-layouts/contracts/overflow-region.md` for hosts that set it:
  - **Unset (the default):** the module behaves exactly as 009's contract states. `ocelle-scroller`,
    `ocelle-workflow-board` and the test-only overflow host do not set it, and 009's existing tests pass unchanged
    (no 009 behaviour test file is edited; the README's pinned sentence on the module's inputs is the one test
    statement changed, for the new option).
  - **Set:** the scroll box also scrolls in the block axis. It overflows when its content overflows in either axis
    (more than 1 px), and then takes the tab stop, role and name of 009's contract. ArrowUp and ArrowDown, unmodified
    and with the box as target, scroll it in the block axis by the module's step. The focus clearance also works in
    the block axis, keeping the ring box clear of the block-start box the host names (the pinned header, which is
    not cleared when it holds the focus itself) and of the box's block end. The focus handover applies when overflow
    ends in both axes, and every scroll write is instant. While content is below the box's block end, the block end
    fades over the fade depth of 009's inline fades (the operator's decision Q-I4, 2026-11-18); there is no
    block-start fade. The fade never covers the block-start box the host names: when the space below it is less than
    twice the fade depth, no block-end fade is drawn. It combines with the inline fades (a corner under both is faded
    by both), the focus clearance keeps the ring box clear of it, with 009's fallback (the fade held off) for a ring
    box too tall to clear, and in forced colours a line in `CanvasText` at the block end stands in for it. No fade
    covers either scrollbar.
  - 009's own contract file gets one line pointing to `contracts/overflow-region-block-axis.md` (the operator's
    decision Q-I5) and is otherwise unchanged.
  - The module stays internal and not public surface (009's contract, constitution VII). The README's § Element
    conventions entry for the module names the option.
- **FR-019** (inventory decision IQ-3, 2026-11-18): `@ocelle/styles` MUST add a documented base-style hook for numeric
  cells: the attribute `data-ocelle-align` with the one value `end`, which sets `text-align: end` and
  `font-variant-numeric: var(--ocelle-figures)` on the element that carries it, at specificity (0,1,0), and is placed
  after FR-012's prose override so it wins inside a prose container too. Any other value has no effect. It works on
  any element (a cell of a data table, of a prose table or any table) and is documented for the body and header cells
  of a numeric column; it changes nothing else (no font, colour or padding), so a header cell keeps its eyebrow type.
  It is public surface (constitution VII, MINOR): the `@ocelle/styles` README's Hooks table and CHANGELOG name it,
  and the `@ocelle/elements` README's data-table section points to it.

- **FR-060** (inventory decision IQ-4, 2026-11-18): The element MUST take a `striped` property, reflected as the
  boolean attribute `striped` (present with any value; unset by default). While it is set, every cell of each even
  body row (the second, fourth and so on among the rows of each `<tbody>`, counted by source position, hidden rows
  included) paints the ground `--ocelle-color-inset`; header and footer rows paint none. The cell text keeps its
  colour, declared on inset (FR-013), and the row rules stay. The rules ship in `@ocelle/styles` at (0,0,0), so a
  consumer rule wins. In forced colours the stripe is drawn by the row band of FR-013's table.
- **FR-061** (inventory decision IQ-5, 2026-11-18): A hovered body row (a row of a `<tbody>`) MUST paint the ground
  `--ocelle-color-hover-bg` on all its cells, over a stripe too; header and footer rows do not. The hover is a look
  only: no event, no tab stop, no focus and no cursor change (FR-011); the text keeps its colour, declared on hover-bg
  (FR-013). In the light theme `hover-bg` and `inset` have the same value, so a hovered striped row does not change
  there (accepted by the operator's decision Q-I2, 2026-11-18; the README notes it). It is always on, with no
  attribute (the operator's decision Q-I3). The rule
  ships in `@ocelle/styles` at (0,0,0), after the stripe rule. In forced colours the hovered row is drawn by the row
  band of FR-013's table in `Highlight`.

### `ocelle-event-timeline` (P2)

- **FR-020**: `ocelle-event-timeline` MUST take its events as `ocelle-timeline-event` direct children (operator
  decision Q3 (a)), assigned by manual slot assignment into an ordered list it renders in its shadow root, one list item
  per event in source order. Other children are neither shown nor exposed. `ocelle-timeline-event` is an item element
  on the public surface under FR-001, and the timeline module imports it. Outside a timeline an event shows its time
  and content as plain text, with no marker and no list-item role.
- **FR-021**: Each event MUST show one marker of inline and block size `--ocelle-size-dot`, centred on the first line of
  the event, on the inline-start side, and a connector line from each marker to the next visible event's marker, drawn
  in token colours (the marker in an ink token, FR-013). The last visible event has no connector after it. Markers and connectors MUST NOT appear in the
  accessibility tree. For contrast, the marker is structural (3:1) and the connector decorative, as FR-013's table
  states.
- **FR-022**: The list's name MUST be, in order: a non-blank host `aria-label`; else the timeline's non-blank
  `label`; else none (the list is unnamed). A blank host `aria-label` (empty or only white space) counts as absent, so
  a non-blank `label` still names the list: the timeline follows the Host ARIA rule of the elements whose role and
  name sit on a shadow node (the overflow-region elements), not the general rule that a host `aria-label` decides
  alone, because its name sits on the shadow `<ol>`. The README's Host ARIA section lists the timeline and the chain
  with those elements.
- **FR-023**: `ocelle-timeline-event` MUST offer a `time` property (string, unset by default) and a named `time` slot
  (plan gate Q-E, "Yes: named time slot"), each giving the event's time as the consumer formats it. The **slotted
  time** is the event's direct children with `slot="time"` that have neither `hidden` nor `aria-hidden="true"`; the
  event **has a slotted time** when the trimmed text content of at least one of them is not empty. The event's time
  is, in order: its slotted time, when it has one, with the `time` attribute then ignored (neither shown nor exposed);
  else its `time` when that is a non-blank string; else none. An empty, white-space-only or hidden slotted time counts
  as no slotted time and is neither shown nor exposed (the `time` attribute then applies; plan gate Q-G (a)). While
  the event has a slotted time, every visible `slot="time"` child is shown in source order, a blank one included
  (it adds no item text). The time is shown on its own line above the content (Q-C (a)) in
  `--ocelle-font-sans` with `--ocelle-figures`, distinct from the content by more than colour; a slotted time is
  styled through `::slotted()` to the same type as an attribute time, and the element writes nothing on the slotted
  nodes (a consumer rule on them wins, and their attributes, such as `datetime`, `title`, `lang` or `dir`, stay
  theirs). The element does not parse, format or read times. With no time there is no time box. The list item's item
  text (FR-016) is the time, a space and the content, time first wherever the slotted time sits in source; with no
  time it is the content alone. Adding, removing, emptying, filling, hiding or showing a slotted time, or changing its
  `slot` attribute, MUST update the time box, the marker's line and the connectors (FR-021, FR-025) without a page
  reload or resize.
- **FR-024**: `ocelle-timeline-event` and `ocelle-evidence-step` MUST each take a `wrap` property with the one value
  `anywhere`, which sets `overflow-wrap: anywhere` on its content (never on the time); content with
  `data-ocelle-wrap="anywhere"` keeps that behaviour. Without it, content wraps between words. Neither element
  truncates content.
- **FR-025**: An item with `hidden` or `aria-hidden="true"` MUST NOT be shown, exposed, marked, numbered or joined.
  Adding, removing, hiding or showing an item MUST update the list, markers, connectors and ordinals without a page
  reload or resize. With no visible item, the container renders nothing visible, exposes no list item and throws
  nothing; whether an empty list node is exposed is set in the plan and tested.
- **FR-026**: Neither the timeline nor the chain adds a live region, a landmark, a heading or a tab stop; the README
  says a consumer that needs appended events announced owns its own live region.
- **FR-027**: Event content MUST use `--ocelle-font-sans` in a text colour the plan names; the time in
  `--ocelle-color-ink-muted` or `-soft` as the plan settles against the contrast declarations (FR-013).

### `ocelle-evidence-chain` (P3)

- **FR-030**: `ocelle-evidence-chain` MUST take its steps as `ocelle-evidence-step` direct children (operator decision
  Q3 (a)), assigned by manual slot assignment into an ordered list it renders in its shadow root, one list item per step
  in source order. Other children are neither shown nor exposed. `ocelle-evidence-step` is an item element under
  FR-001, and the chain module imports it. Outside a chain a step shows its content as plain text, with no marker,
  ordinal or connector and no list-item role.
- **FR-031**: Each default step MUST show a round marker of inline and block size `--ocelle-size-step` drawn with a
  ring of `--ocelle-ring-step` in a token colour (FR-013), before its content on the inline-start side. The marker's
  inside is the main ground behind the chain (no fill) unless the plan names a fill token; with a fill, the token the
  ordinal uses MUST have a text-contrast declaration that includes that fill as a ground, and the fill is tested as
  the ordinal's ground in US3-8 (FR-013).
- **FR-032**: The list MUST be named as FR-022 states. Connectors, markers and the ordinals inside markers MUST NOT
  appear in the accessibility tree; each list item's item text (FR-016) is the step's content only. The list's own
  ordered semantics convey position.
- **FR-033**: Each default step's marker MUST show the step's ordinal among the visible steps (1 to N, chip steps
  counted), in `--ocelle-font-sans` with `--ocelle-figures`, fitting two digits inside the marker.
- **FR-034**: The steps MUST lie in rows from the inline start that wrap onto further lines when the chain's inline size
  is too small for them, filled line by line in source order (mirrored under `dir="rtl"`), with token gaps. A connector
  MUST be drawn between consecutive steps on the same line and MUST NOT extend past the chain's inline edges or cross
  from one line to the next. A step's content wraps between words inside the step and never widens the chain beyond its
  container; nothing overflows or is cut at 320 px.
- **FR-035**: `ocelle-evidence-step` MUST offer a `variant` property with the one value `chip` (unset by default; any
  other value acts as unset; operator decision Q4 (a)). A chip step has no marker or ordinal and shows its content
  inside an outline of width `--ocelle-ring-step` (or another existing token the plan names) with corner radius
  `--ocelle-radius-2` (constitution II: the one radius; `--ocelle-radius-pill` is for state pills only and MUST NOT
  be used), with inline padding from the `--ocelle-space-*` scale and a block padding and line height the plan names
  from the tokens (zero block padding allowed), chosen so the bound below holds; the plan shows the sum. It is
  smaller than a default step, measured as: the chip step's rendered block size (outline included) is less than
  `--ocelle-size-step`, and its content's computed font size is one step below the default step content's on the
  scale xs < sm < md < lg < xl < 2xl of `--ocelle-font-size-*` (`font-size-fact` and `font-size-subhead` are not
  steps of this scale), so the default step content is at `sm` or above. It MUST NOT import, extend or read any
  element, token, part or hook of #7's pill tag (`ocelle-pill-tag`), and its radius is not `--ocelle-radius-pill`
  (#517: the chip is the chain's own). The chip has no fill (plan gate Q-A (a)). A chip step keeps its list item and
  its position.
- **FR-036**: Step content MUST use `--ocelle-font-sans` in a text colour the plan names. Its text colour, the marker
  ring, the chip outline and the connectors follow FR-013, which classes each of them and states the colour, contrast
  and forced-colours rules.

### Tokens

- **FR-040**: A new token MAY be added to `@ocelle/tokens` only where no existing token gives the value (for example a
  connector width). No new radius token is added: the chip uses `--ocelle-radius-2` (FR-035). Each new token MUST
  go through the token package's existing validation (records, generator, contrast declaration for any foreground
  colour, and tests) and be listed in the plan with the reason no existing token fits. 011's eyebrow tokens are used as
  they are and are not re-added here (FR-006).

### Evidence (#7's checklist)

- **FR-050**: Each element MUST have a story per variant and per state in `storybook/stories/<element>.stories.ts`,
  rendered in light and dark, following #10's contributor note (`specs/006-storybook-workbench` FR-025). The item
  elements have no stories file of their own: their states (with and without time, a slotted time, wrap, hidden, chip,
  and the item outside its container) are stories in their container's file (analysis C1 (c)). Data-table stories
  include a fitting table, an overflowing table (the region focusable and named), a table with row headers, and a
  table named by its caption, and two overflowing tables named through a host `aria-label`: one non-blank (the region
  named by it) and one blank (the region named by `label`), added once the phase 1 spike found the pinned axe-core
  clean on that state (spike Q1 (b), 2026-11-18), and, for the inventory decisions IQ-2 to IQ-5, a bounded
  `sticky-header` table, a table with an end-aligned numeric column, a striped table, a hovered body row and a striped
  table with an even row hovered (the two hover states through #10's pointer parameter). The states named by a host `aria-label` of the timeline and the
  chain have no story: they are a constitution V exception recorded in the plan's Complexity Tracking, chosen by the
  operator (analysis C1 (c)), and proven by browser tests, until their own phase's spike measures them. Any further
  state without a story is a constitution V exception recorded there and approved by the operator.
- **FR-051**: Visual baselines and the `axe` run follow #10 on `main`. Each phase that adds stories MUST commit their
  light and dark baselines, produced in #10's pinned container by its baseline command under docker, and its stories
  MUST pass #10's `storybook-build`, `visual` and `axe` gates with no serious or critical finding and no
  `storybook/a11y-exceptions.json` entry unless the operator approves one. Conflicting baseline images are regenerated
  in the container, never hand-picked.
- **FR-052**: Browser tests MUST cover every acceptance scenario and every edge case that states behaviour (for
  example a data table with no table or two tables, items outside their container, empty containers, `aria-hidden`
  items, a chain of twenty steps, `lang` and `dir` on items), run on the element source (in process) and on the built
  browser build on strict-CSP fixture pages, as the README's § Files and tests describes. Keyboard tests cover the data
  table's region (tab stop, arrows, focus clearance, handover); accessibility-tree tests cover every element.
- **FR-053**: Each of the three containers MUST have a reflow test at 320 px CSS width (US1-4, US2-4, US3-3).
- **FR-054**: Each of the five elements MUST have its own manifest entry listing every public property, attribute, slot
  and part, and an empty event list. The `manifest` gate passes.
- **FR-055**: The built output MUST pass the strict-CSP check.
- **FR-056**: The README's § Element conventions MUST record the pattern this mission adds: a container whose content
  is one native element (the data table's `<table>`), styled by `@ocelle/styles` rules scoped to the container because
  shadow styles cannot reach its descendants, and assigned by manual slot assignment. It MUST also list the data table
  as a user of the overflow-region module beside 009's elements, the only one that sets the block-axis option
  (FR-018), and the module's entry MUST name that option and its block-end fade.
- **FR-057**: Each package changed gets a changelog entry naming its surface additions: the five elements and their
  properties (the data table's `sticky-header` and `striped` among them), any added tokens, the added `@ocelle/styles`
  rules and the `data-ocelle-align` hook (FR-019) (constitution VII, MINOR). The overflow-region module's block-axis
  option is internal and not surface (FR-018); the `@ocelle/elements` changelog entry mentions it as an internal
  change with no effect on `ocelle-scroller` or `ocelle-workflow-board`. The custom properties
  `ocelle-data-table` writes and `@ocelle/styles`' caption cap reads (`--data-table-box-size`,
  `--data-table-end-fade`) are a documented base-style hook between the two packages: both packages' changelogs and
  READMEs name them as surface, and the READMEs say a consumer does not set them (analysis I7 (a)).
- **FR-058**: The README MUST map each variant of the inventory to the element and variant that replaces it, or to the
  consumer's remedy, or to "not this mission" with the operator's decision. The inventory is the spec-kitty design
  library's own variant set for the three families (research R-16, `sources/spec-kitty-design-inventory.md`, read at
  `main` 19fb6a2 and `develop` a6518cd; inventory decision IQ-1 (a), 2026-11-18): **one mapping row per modifier,
  state, structure role and part** of each family, with no counts, plus a row for any variant the operator names from
  kitty-mission-ui's rc.10 line. The data table's rows are written in phase 1, the timeline's in phase 2 and the
  chain's in phase 3. The data table's rows include the library's header look mapped to the eyebrow headers, with the
  consumer's own rule for sentence case (IQ-7 (a)), and the duplicate-name rule mapped to FR-010's `label` advice
  (IQ-6 (a)). The mapping names roles only and copies no code (constitution VI). Readme tests assert the rows by role
  names, with no `sk-` string in test code (013's operator decision I1). A variant no element covers goes to the
  operator. No row reads "pending inventory" (spike decision on T005 superseded by IQ-1 (a)).
- **FR-059**: Each phase's gate runs MUST use op 016's affected-plants mode once op 016 is on `main` (operator, via the
  orchestrator, 2026-11-15), not a full `gate:plants`; mutation testing follows #23's and op 015's rules on `main`.

### Key Entities

- **Data table** (`ocelle-data-table`): one consumer `<table>`, a region label, a wrap policy, a sticky header row
  (with the page's block bound) and striped rows; numeric cells carry `@ocelle/styles`' `data-ocelle-align="end"` hook.
- **Event** (`ocelle-timeline-event`): an optional time (the `time` attribute's text, or marked-up nodes in the `time`
  slot, which take precedence), content (inline markup), a wrap policy.
- **Event timeline** (`ocelle-event-timeline`): its events in source order, a name.
- **Evidence step** (`ocelle-evidence-step`): content, a variant (default or chip), a wrap policy; its ordinal is
  derived.
- **Evidence chain** (`ocelle-evidence-chain`): its steps in source order, a name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The README mapping (FR-058) has a row for every modifier, state, structure role and part of the three
  families in research R-16's inventory (the library's variant set, inventory decision IQ-1 (a)), and for any rc.10
  variant the operator names, each naming the element and variant with no `class` attribute, the consumer's remedy,
  or "not this mission" with the operator's decision, and no row reads "pending inventory". Checked in review (T076).
- **SC-002**: At 320 px CSS width, every story of the three containers has a page scroll width equal to the viewport
  width.
- **SC-003**: Every story of the five elements reports no serious or critical axe finding by #10's `axe` gate, in light
  and dark, in the phase that adds it; the accessibility-tree assertions of US1 to US3 are proven by this mission's own
  browser tests.
- **SC-004**: Every foreground and non-text pair the five elements introduce passes the contrast check in light and
  dark.
- **SC-005**: An overflowing data table is reachable and scrollable by keyboard alone, and a fitting one adds no tab
  stop, in 100% of the region tests.
- **SC-006**: Every acceptance scenario has at least one test that fails against the code before its phase (the
  red/green check), and mutation testing under #23's rules leaves no surviving mutant in the phase's changed source,
  except mutants the review records as equivalent with the reason.
- **SC-007**: The manifest, strict-CSP, prefix and style-lint gates pass with the five elements added, and mission
  013's elements' tests and baselines are unchanged. Mission 009's tests of the overflow-region module,
  `ocelle-scroller` and `ocelle-workflow-board` pass unchanged after FR-018's option, and their baselines do not move.

## Assumptions

- Implementation waits until #15 (mission 009), mission 013 and op 016 are on `main`. The plan is written against
  009's contract and 013's conventions as on their branches (`origin/claude/015-workflow-layouts`,
  `origin/claude/013-data-display`); the first task rechecks the plan and tasks against `main` as merged (the module's
  interface, `--ocelle-tracking-caps`, 013's README conventions, op 016's affected-plants command) and stops for the
  operator on any difference. Done on 2026-11-17 after `main` was merged (8ee3351): `reviews/recheck.md`, answered by
  the operator's recheck decisions above.
- The compact cell padding, cell font size, header weight and colours, connector width and chip padding are set in the
  plan from the existing scale. The spec fixes only their order (data-table cells more compact than 003's prose table,
  chip step smaller than a default step).
- Cells align to the inline start. A numeric column is end-aligned by the consumer through `@ocelle/styles`'
  `data-ocelle-align="end"` hook on its cells (FR-019, inventory decision IQ-3), not by a class or an element
  property; `--ocelle-figures` keeps digits aligned within the column.
- The evidence chain's step markers show ordinals (an informed choice: the prototype's chain is numbered and #13 asks
  for step markers); per-step states (done, current, pending) are not asked for by #13 and are out of scope. The
  timeline's markers have one look; a tone or state on events is out of scope.
- The data table has no density property: its default is the compact look #13 asks for.
- Kitty Desktop's WebKit is not measured, the same as the library's existing Engines note. Only Chromium is.
- The data table is a further user of 009's overflow-region module; the contract names `ocelle-code-block` as its next
  user. Using it in the data table changes the module by FR-018's opt-in block-axis option only, which no other user
  sets (inventory decision IQ-2).
- The sticky header row needs a bounded block size, which is the page's layout decision (the consumer's rule on the
  host), as the library's own sticky header needs the consumer's bound.
