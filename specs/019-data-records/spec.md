# Feature Specification: Data Records (Data Table, Event Timeline, Evidence Chain)

**Feature Branch**: `019-data-records` (work happens on `claude/013-data-display-2`)

**Created**: 2026-11-15

**Status**: Draft

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
and the triage record. The plan's research reads #470, #517 and #533 where it can (from the operator or a verbatim copy
in the repository) and records anything in them that changes or adds to a requirement here; such a change goes to the
operator. Spec Kitty's `sk-*` names are kitty-mission-ui roles, not names in this library.

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

## Scope

**In scope:** five new custom elements in `@ocelle/elements`: `ocelle-data-table`, `ocelle-event-timeline` with its
item `ocelle-timeline-event`, and `ocelle-evidence-chain` with its item `ocelle-evidence-step`. This covers their
stories, tests, manifest entries and README sections; the `@ocelle/styles` rules that style a data table's light-DOM
cells (FR-005); any new tokens these elements need that no existing token provides (FR-040); and the README's
§ Element conventions amendment for a container whose content is one native element (FR-056).

**Out of scope:**

- `ocelle-disclosure` and `ocelle-code-block` (mission 020);
- mission 013's elements (`ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`), which this mission
  does not change;
- mission 009's overflow-region module itself, which this mission uses as its contract states and does not change
  (FR-008);
- sorting, filtering, selection, pagination, resizable or sticky columns, and any other interactive table behaviour:
  the data table is a readout and emits no event;
- an end-aligned numeric column (#13 does not ask for one; see Assumptions);
- copying text to the clipboard (constitution I; #14 and the host);
- the eyebrow tokens of 011 or 012, which the data table uses if they are on `main` first and does not add (FR-006);
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

**Independent Test**: render an `ocelle-data-table` holding a table with a caption, five columns and four rows, one
cell a 26-character identifier. At 1280 px and 320 px, check the cells' computed type and padding, the header style,
the region's tab stop and name, the page's scroll width and the accessibility tree.

**Acceptance Scenarios**:

1. **Given** an `ocelle-data-table` holding a `<table>` with a `<caption>`, one header row of five `<th scope="col">`
   cells and four body rows, in a 1280 px block container, **When** it renders, **Then** the accessibility tree in
   Chromium holds one table named by its caption, with five column headers and four data rows, each cell associated
   with its column header, exactly as the same `<table>` outside the element; the element adds no table, row or cell
   node of its own (FR-003, FR-004).
2. **Given** that table, **When** a body cell's computed style is read, **Then** its font family resolves through
   `--ocelle-font-sans`, its colour through `--ocelle-color-ink-soft`, its `font-variant-numeric` is `tabular-nums`
   through `--ocelle-figures`, and its block and inline padding are the compact token steps the plan names, each
   smaller than 003's base table cell padding (`--ocelle-space-2` block, `--ocelle-space-3` inline). No computed font
   family in the table is a monospace family (FR-005).
3. **Given** a column header cell (a `<th>` in the table's `<thead>`, or one with `scope="col"`), **When** its computed
   style is read, **Then** it is at `--ocelle-font-size-xs`, `text-transform: uppercase`, letter spacing through
   `--ocelle-tracking-caps` (or 011's eyebrow tokens if those are on `main` when the phase starts), in the colour the
   plan names from the tokens' contrast declarations; a row header cell (`<th scope="row">` in the body) is at the
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
10. **Given** the element inside a `[data-ocelle-prose]` container (003's prose rules), **When** it renders, **Then**
    the table is not a scroll box of its own: there is exactly one sideways scroll box, the element's region, and the
    table keeps its table display (FR-012).
11. **Given** the page in light or dark theme, **When** it renders, **Then** cell text, header text and the row rules
    meet the contrast check on each main ground the tokens declare (the element paints no ground of its own). **Given**
    forced colours, **Then** every cell's and header's computed text colour is a system colour and the row rules are
    visible (FR-005, FR-013).
12. **Given** the table under `dir="rtl"`, **When** it renders and overflows, **Then** its first column is at the right,
    cell text aligns to the inline start, and the region's start edge is the right edge (FR-008, FR-005).
13. **Given** an overflowing data table, **When** its rows are replaced by an htmx-style swap of the `<tbody>` or of the
    whole `<table>` with a narrower one that fits, **Then** the region re-decides its overflow state without a resize of
    the page: it is no longer a tab stop, and if it had focus, focus moves as 009's focus handover states (FR-008,
    FR-014).

---

### User Story 2 - An event history as an ordered list (Priority: P2)

A Kitty Desktop mission view shows its event history: "Mission created", "Plan approved", "Review requested", each with
a time. The developer writes `<ocelle-event-timeline label="Mission history">` with one `<ocelle-timeline-event
time="14:02">` per event and the event's text as its content. Each event shows a small dot marker on a vertical line
that joins the events, its time in tabular figures and its text. A screen-reader user hears a list named "Mission
history" with three items, in order, each with its time and its text, and hears nothing of the dots or the line. An
htmx poll appends an event at the end and the list grows.

**Why this priority**: the event history is a Desktop V2 primitive (#470) every mission view uses; it is a static
readout on 013's slotted-item pattern.

**Independent Test**: render an `ocelle-event-timeline` with four events, one with a 26-character identifier in its
text. At 1280 px and 320 px, check the marker size, the accessibility tree, the reading order and the page's scroll
width.

**Acceptance Scenarios**:

1. **Given** an `ocelle-event-timeline` with `label="Mission history"` and three `ocelle-timeline-event` children,
   **When** the accessibility tree is read in Chromium, **Then** it holds one list named "Mission history" with three
   list items in source order, each item's text being its time followed by its content; no marker or connector is in
   the tree, and axe reports no serious or critical finding, `list` and `listitem` included (FR-020, FR-022).
2. **Given** the same element, **When** its markers are measured, **Then** each event has one marker of inline and block
   size `--ocelle-size-dot`, centred on the first line of its event, and a connector joins each marker to the next
   one; the last event has no connector after it (FR-021).
3. **Given** an event with `time="14:02"`, **When** its computed style is read, **Then** the time is in
   `--ocelle-font-sans` with `tabular-nums` through `--ocelle-figures` and is distinct from the content by more than
   colour (size or weight, the plan names it); **Given** an event with no `time`, **Then** it shows its content with no
   empty time box and the list item's text is its content alone (FR-023).
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
   contrast check on each main ground, the markers meet 3:1 non-text contrast against each main ground, and in forced
   colours the markers and connectors are drawn in a system colour (FR-027).
9. **Given** the timeline under `dir="rtl"`, **When** it renders, **Then** the markers and connector are on the inline
   start side (the right) (FR-021).

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
   order, each item's text being its content only (no visible number, no connector text); axe reports no serious or
   critical finding (FR-030, FR-032).
2. **Given** the chain in a 1280 px container where the six steps fit, **When** it renders, **Then** the steps sit in
   one row from the inline start, in source order, each default step with a marker of inline and block size
   `--ocelle-size-step` drawn with a ring of `--ocelle-ring-step` showing the step's ordinal (1 to 6) in tabular figures,
   and a connector between each pair of consecutive steps on the row (FR-031, FR-033).
3. **Given** the same chain in a 320 px container, **When** it renders, **Then** the steps wrap onto further lines,
   each line filled from the inline start in source order, no step is cut or overlaps another, no connector extends
   past the chain's inline edges or crosses from one line to the next, and the page's scroll width equals the viewport
   width (FR-034, FR-009).
4. **Given** a step with `variant="chip"`, **When** it renders, **Then** it is drawn compact, as FR-035 states, from the
   element's own tokens; no token, part or hook of #7's pill tag is read, and the chain's list semantics and order are
   unchanged (FR-035).
5. **Given** a step whose content is long text, **When** the chain is 320 px wide, **Then** the text wraps between words
   inside the step and never widens the chain; with `wrap="anywhere"` on a step holding an unbroken identifier, the
   identifier breaks inside the step (FR-034, FR-024).
6. **Given** a step added, removed or given `hidden`, **When** the chain updates, **Then** the visible ordinals stay
   1 to N in source order of the visible steps, and the list item count matches the visible steps (FR-033, FR-025).
7. **Given** children that are not `ocelle-evidence-step`, **When** it renders, **Then** they are neither shown nor
   exposed (FR-030).
8. **Given** light and dark themes and forced colours, **When** it renders, **Then** step text meets the contrast check,
   markers, rings and chip borders meet 3:1 non-text contrast against each main ground, and in forced colours markers,
   rings, connectors and chip borders are drawn in system colours (FR-036).
9. **Given** the chain under `dir="rtl"`, **When** it renders, **Then** the first step is at the inline start (the
   right) and lines fill towards the left (FR-034).

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
  shows the table before upgrade; a wide table may then widen the page until upgrade (FR-012).
- **Data table at 200% zoom and 320 px.** The table scrolls inside its region; the page does not scroll sideways (WCAG
  1.4.10's exception for two-dimensional data tables applies to the table's own content, not the page).
- **Data table print.** The plan's research records what 009's region does in print (scrolled content may be clipped).
  No print requirement is added here beyond that record; the README states the behaviour.
- **Caption while the region scrolls.** The caption is part of the table and scrolls with it unless the plan keeps it
  at the region's start edge (as 003's prose table does); either way it is never cut at 320 px (it wraps).
- **A timeline or chain with no items.** It renders nothing visible, exposes no list item, and throws nothing; whether
  an empty list node is exposed is set in the plan and tested (FR-025).
- **`ocelle-timeline-event` outside `ocelle-event-timeline`, `ocelle-evidence-step` outside `ocelle-evidence-chain`.**
  The item shows its time (for an event) and content as plain text, with no marker, no connector and no list item
  role. It throws nothing (FR-020, FR-030).
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
- **Lang and dir on items.** An item's `lang` and `dir` apply to its own content and time (WCAG 3.1.2).
- **Two copies of the package on a page.** As the library's existing rule: the first definition wins.

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
- **FR-013**: Every text colour an element sets MUST pass the tokens' text-contrast declaration on each main ground,
  and every marker, ring, connector, rule or border that conveys structure MUST meet 3:1 non-text contrast on each main
  ground, in light and dark. In forced colours, text is a system text colour and every such line is visible in a system
  colour.

### `ocelle-data-table` (P1)

- **FR-003**: `ocelle-data-table` MUST take a native `<table>` as its first direct light-DOM `<table>` child (operator
  decision Q1 (a)) and show it, unchanged, inside its region: the element never copies, moves or rewrites the table or
  its cells. Other direct children are neither shown nor exposed. The table is assigned to the region's slot by manual
  slot assignment (the library's slotted-items convention).
- **FR-004**: The accessibility tree MUST expose the consumer's table with the platform's own table semantics (a table
  named by its caption, rows, column and row headers, cells associated with their headers, `headers`/`id` references
  between cells), measured in Chromium against the same table outside the element, with no serious or critical axe
  finding. The element adds no table, row, cell or header role and no ID reference across a shadow root.
- **FR-005**: Body cells MUST use `--ocelle-font-sans`, `--ocelle-figures`, `--ocelle-color-ink-soft` and a compact
  padding from the `--ocelle-space-*` scale smaller than 003's base table cell, with a row rule in a token colour
  between body rows, at a font size and line height the plan names from the tokens. Because shadow-root styles cannot
  reach a slotted table's cells, these rules MUST ship in `@ocelle/styles`, selected on `ocelle-data-table > table`
  (and its cells) at zero added specificity beyond the element selector, so a consumer rule wins; they MUST NOT need a
  class. The README MUST say that the table's look needs `@ocelle/styles` on the page (or adopted in a consumer's
  shadow root) and what the table shows without it.
- **FR-006**: Column header cells (each `<th>` in the table's `<thead>`, and each `<th scope="col">`) MUST be eyebrows:
  `--ocelle-font-size-xs`, upper case, letter spacing `--ocelle-tracking-caps`, at the weight and colour the plan names
  from existing tokens and their contrast declarations (#533). If 011's or 012's eyebrow tokens are on `main` when the
  phase starts, the headers use them instead and the plan records it; this mission adds no eyebrow token. Row header
  cells (`<th scope="row">`) MUST use the body cell size in `--ocelle-color-ink` at a weight the plan names, not upper
  case.
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
  or change the module; a need the module does not meet goes to the operator.
- **FR-010**: The region's name MUST be, in order: a non-blank host `aria-label`; else the element's non-blank `label`;
  else the trimmed text content of the table's `<caption>`, read by the element and passed to the module as its
  label (no ID reference), and re-read when the caption changes; else none, which the contract handles (tab stop, no
  role, no name). The README MUST tell consumers to give an overflowing table a caption or a `label`.
- **FR-012**: Inside a `[data-ocelle-prose]` container, the element MUST override 003's prose table rule so that the
  table keeps `display: table` and is not a scroll box of its own: the element's region is the only sideways scroll
  box. Before the element is defined, the `@ocelle/styles` cell rules apply to the table (FR-005); the README states
  that a wide table may widen the page until upgrade.
- **FR-014**: The element MUST re-decide its overflow state after a change of its table, its rows or its cells (an htmx
  swap of the `<tbody>` or of the `<table>`), as the module's `slotchange` and resize triggers allow; a change the
  module does not observe is named in the plan's research from measurement, and the README tells consumers what to do
  there.
- **FR-015**: The element's `label` property (string, unset by default) names the region (FR-010) and nothing else; it
  is not shown. A host `aria-hidden="true"` or `hidden` follows the library's Host ARIA rule.

### `ocelle-event-timeline` (P2)

- **FR-020**: `ocelle-event-timeline` MUST take its events as `ocelle-timeline-event` direct children (operator
  decision Q3 (a)), assigned by manual slot assignment into an ordered list it renders in its shadow root, one list item
  per event in source order. Other children are neither shown nor exposed. `ocelle-timeline-event` is an item element
  on the public surface under FR-001, and the timeline module imports it. Outside a timeline an event shows its time
  and content as plain text, with no marker and no list-item role.
- **FR-021**: Each event MUST show one marker of inline and block size `--ocelle-size-dot`, centred on the first line of
  the event, on the inline-start side, and a connector line from each marker to the next visible event's marker, drawn
  in token colours. The last visible event has no connector after it. Markers and connectors are decorative: they
  MUST NOT appear in the accessibility tree.
- **FR-022**: The list MUST be named by a non-blank host `aria-label` or the timeline's non-blank `label`, under the
  library's Host ARIA rule; with neither it is unnamed.
- **FR-023**: `ocelle-timeline-event` MUST offer a `time` property (string, unset by default): the event's time as the
  consumer formats it, shown before or above the content in `--ocelle-font-sans` with `--ocelle-figures`, distinct from
  the content by more than colour. The element does not parse or format times. With no `time` there is no time box.
  The time and the content together are the list item's text, time first.
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
  ring of `--ocelle-ring-step` in a token colour, before its content on the inline-start side.
- **FR-032**: The list MUST be named as FR-022 states. Connectors, markers and the ordinals inside markers MUST NOT
  appear in the accessibility tree; each list item's text is the step's content only. The list's own ordered semantics
  convey position.
- **FR-033**: Each default step's marker MUST show the step's ordinal among the visible steps (1 to N, chip steps
  counted), in `--ocelle-font-sans` with `--ocelle-figures`, fitting two digits inside the marker.
- **FR-034**: The steps MUST lie in rows from the inline start that wrap onto further lines when the chain's inline size
  is too small for them, filled line by line in source order (mirrored under `dir="rtl"`), with token gaps. A connector
  MUST be drawn between consecutive steps on the same line and MUST NOT extend past the chain's inline edges or cross
  from one line to the next. A step's content wraps between words inside the step and never widens the chain beyond its
  container; nothing overflows or is cut at 320 px.
- **FR-035**: `ocelle-evidence-step` MUST offer a `variant` property with the one value `chip` (unset by default; any
  other value acts as unset; operator decision Q4 (a)). A chip step has no marker or ordinal and shows its content at a
  smaller type step inside a token-radius outline drawn from `--ocelle-ring-step` (or another existing token the plan
  names), with compact token padding, so it is visibly smaller than a default step. It MUST NOT import, extend or read
  any element, token, part or hook of #7's pill tag, and MUST NOT copy its look (#517: the chip is the chain's own). A
  chip step keeps its list item and its position.
- **FR-036**: Step content MUST use `--ocelle-font-sans` in a text colour that meets FR-013; marker ring, connectors and
  the chip outline meet FR-013's 3:1 rule.

### Tokens

- **FR-040**: A new token MAY be added to `@ocelle/tokens` only where no existing token gives the value (for example a
  connector width or a chip radius). Each new token MUST go through the token package's existing validation (records,
  generator, contrast declaration for any foreground colour, and tests) and be listed in the plan with the reason no
  existing token fits. `--ocelle-tracking-caps` is 009's token and is not re-added here.

### Evidence (#7's checklist)

- **FR-050**: Each element MUST have a story per variant and per state in `storybook/stories/<element>.stories.ts`,
  rendered in light and dark, following #10's contributor note (`specs/006-storybook-workbench` FR-025). The item
  elements have no stories file of their own: their states (with and without time, wrap, hidden, chip) are stories in
  their container's file, and their behaviour outside the container is proven by browser tests only, as 013 did for
  `ocelle-fact`. Data-table stories include a fitting table, an overflowing table (the region focusable and named), a
  table with row headers, and a table named by its caption. Any further state without a story is a constitution V
  exception recorded in the plan's Complexity Tracking and approved by the operator.
- **FR-051**: Visual baselines and the `axe` run follow #10 on `main`. Each phase that adds stories MUST commit their
  light and dark baselines, produced in #10's pinned container by its baseline command under docker, and its stories
  MUST pass #10's `storybook-build`, `visual` and `axe` gates with no serious or critical finding and no
  `storybook/a11y-exceptions.json` entry unless the operator approves one. Conflicting baseline images are regenerated
  in the container, never hand-picked.
- **FR-052**: Browser tests MUST cover every acceptance scenario, run on the element source (in process) and on the built
  browser build on strict-CSP fixture pages, as the README's § Files and tests describes. Keyboard tests cover the data
  table's region (tab stop, arrows, focus clearance, handover); accessibility-tree tests cover every element.
- **FR-053**: Each of the three containers MUST have a reflow test at 320 px CSS width (US1-4, US2-4, US3-3).
- **FR-054**: Each of the five elements MUST have its own manifest entry listing every public property, attribute, slot
  and part, and an empty event list. The `manifest` gate passes.
- **FR-055**: The built output MUST pass the strict-CSP check.
- **FR-056**: The README's § Element conventions MUST record the pattern this mission adds: a container whose content
  is one native element (the data table's `<table>`), styled by `@ocelle/styles` rules scoped to the container because
  shadow styles cannot reach its descendants, and assigned by manual slot assignment. It MUST also list the data table
  as a user of the overflow-region module beside 009's elements.
- **FR-057**: Each package changed gets a changelog entry naming its surface additions: the five elements and their
  properties, any added tokens, and the added `@ocelle/styles` rules (constitution VII, MINOR).
- **FR-058**: The README MUST map each kitty-mission-ui `.sk-data-table` variant, and any event-history or
  evidence-chain class family the plan's research inventories, to the element and variant that replaces it, or to the
  consumer's remedy, or to "not this mission" with the operator's decision. The mapping names roles only and copies no
  code (constitution VI). Readme tests assert the rows by role names, with no `sk-` string in test code (013's operator
  decision I1). A variant no element covers goes to the operator.
- **FR-059**: Each phase's gate runs MUST use op 016's affected-plants mode once op 016 is on `main` (operator, via the
  orchestrator, 2026-11-15), not a full `gate:plants`; mutation testing follows #23's and op 015's rules on `main`.

### Key Entities

- **Data table** (`ocelle-data-table`): one consumer `<table>`, a region label, a wrap policy.
- **Event** (`ocelle-timeline-event`): an optional time (text), content (inline markup), a wrap policy.
- **Event timeline** (`ocelle-event-timeline`): its events in source order, a name.
- **Evidence step** (`ocelle-evidence-step`): content, a variant (default or chip), a wrap policy; its ordinal is
  derived.
- **Evidence chain** (`ocelle-evidence-chain`): its steps in source order, a name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The README mapping (FR-058) has a row for every `.sk-data-table` variant kitty-mission-ui uses, and for
  every event-history or evidence-chain family the research inventories, each naming the element and variant with no
  `class` attribute, the consumer's remedy, or "not this mission" with the operator's decision. Checked in review.
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
  013's elements' tests and baselines are unchanged.

## Assumptions

- Implementation waits until #15 (mission 009), mission 013 and op 016 are on `main`. The plan is written against
  009's contract and 013's conventions as on their branches (`origin/claude/015-workflow-layouts`,
  `origin/claude/013-data-display`); the first task rechecks the plan and tasks against `main` as merged (the module's
  interface, `--ocelle-tracking-caps`, 013's README conventions, op 016's affected-plants command) and stops for the
  operator on any difference.
- The compact cell padding, cell font size, header weight and colours, connector width and chip padding are set in the
  plan from the existing scale. The spec fixes only their order (data-table cells more compact than 003's base table,
  chip step smaller than a default step).
- Cells align to the inline start. An end-aligned numeric column is not asked for by #13 and would need an API that is
  not a class (a later issue); `--ocelle-figures` keeps digits aligned within a column of equal-length numbers.
- The evidence chain's step markers show ordinals (an informed choice: the prototype's chain is numbered and #13 asks
  for step markers); per-step states (done, current, pending) are not asked for by #13 and are out of scope. The
  timeline's markers have one look; a tone or state on events is out of scope.
- The data table has no density property: its default is the compact look #13 asks for.
- Kitty Desktop's WebKit is not measured, the same as the library's existing Engines note. Only Chromium is.
- The data table is a further user of 009's overflow-region module; the contract names `ocelle-code-block` as its next
  user, and using it in the data table first changes nothing in the module.
