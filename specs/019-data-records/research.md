# Research: Data Records (Data Table, Event Timeline, Evidence Chain)

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-15

This mission is planned before its dependencies are on `main`. Mission 009's overflow-region module and its token
`--ocelle-tracking-caps` are read from `origin/claude/015-workflow-layouts`, mission 013's conventions and elements
from `origin/claude/013-data-display`, and op 016's `--affected` mode from `origin/claude/041-plants-affected`. Every
reading below that depends on one of them is marked **(branch)** and is rechecked against `main` by the first task
(R-14). No measurement has run in this session: the spikes named below run in their phase, before its scaffold, and a
failing result goes to the operator before the red commit.

## R-01 The data table's content model: the consumer's `<table>`, slotted unchanged

**Decision.** `ocelle-data-table` attaches its shadow root with `slotAssignment: "manual"` and renders 009's region
structure (R-02) with one unnamed `<slot>` inside `.region-track`. In `updated()`, and from a `MutationObserver` on its
own child list, it assigns its first direct child whose `localName` is `table` to that slot (`slot.assign(table)`), or
nothing when there is none. No other child is ever assigned, so text, a second table or a `<div>` is neither shown nor
exposed after upgrade (FR-003). The element never touches the table: no attribute, class, role or style is written
on it or its descendants.

**Rationale.** Operator decision Q1 (a). A slotted table stays in the light DOM, so its caption, `scope`, `headers` and
`id` references all live in the consumer's tree and the platform builds the table semantics as it does outside the
element (FR-004); the flattened tree adds only the shadow wrappers, which carry no role while the table fits and a
`group` role while it overflows (R-02). Manual assignment is the library's slotted-items convention (013), so the
"first table child only" rule needs no `slot=""` attribute from the consumer.

**Spike (phase 1, before the scaffold).** In Chromium with Lit 3.3.3 and axe-core 4.14.0, the US1-1 table inside the
element against the same table outside: the accessibility tree (table name from caption, `columnheader`,
`rowheader`, `cell` with header association, `headers`/`id`), axe `td-headers-attr`, `th-has-data-cells`,
`table-fake-caption`, `scrollable-region-focusable` and a full run, fitting and overflowing. Any difference beyond the
region's `group` node goes to the operator.

**Alternatives.** Row and cell item elements rendered with ARIA table roles (Q1 (b), rejected by the operator: more
tags, ARIA ownership across slots). A data property (Q1 (c), rejected: no server-rendered markup). Moving the table
into the shadow root (rejected: breaks htmx targets and the consumer's own CSS).

## R-02 The scroll region: 009's `OverflowRegion`, used as its contract states (branch)

**Decision.** The element uses `OverflowRegion` with `{ box: () => this.renderRoot.querySelector(".region-box") }`
and the default role `group`, adds `overflowRegionStyles` after its own styles, renders the contract's
`.region-frame > .region-box[data-fade] > .region-track > slot` plus `.region-ring` and the two `.region-edge` nodes
(the `data-fade` binding through `ifDefined`), lists `aria-label` in `observedAttributes` with `requestUpdate()` on
change, and calls `setLabel(name)` in `updated()` with the name of R-04. Nothing of the module is copied or changed.

**Rationale.** Operator decision Q2 (b); FR-008. The module already gives the conditional tab stop, the named group,
arrow keys, fades, focus clearance and focus handover, and its triggers (box and track resize, `slotchange` on the
box, `scroll`) cover a swapped table and a swapped `<tbody>` (R-05).

**Alternatives.** 003's prose scroll box (Q2 (c), rejected by the operator: a permanent or absent tab stop, no fade).
Wrapping and never scrolling (Q2 (a), rejected: columns become unreadable at 320 px).

## R-03 The track's inline size for a table (an operator decision at the plan gate)

**Finding (branch, from the source).** `overflowRegionStyles` sets `.region-track { inline-size: max-content;
min-inline-size: 100%; }`. A table inside a max-content track is laid out at its max-content width: no cell ever wraps,
so a table with one long text cell overflows at any width below its unwrapped width, and US1-9 ("the identifier
breaks inside its cell before the table overflows") cannot hold. The scroller and the board want max-content (a row of
cards or lanes never wraps); a table wants its cells to wrap first and to scroll only when its min-content width does
not fit.

**Decision (plan default, pending the operator, Decision 1 of the plan).** The data table's own stylesheet sets
`:host .region-track { inline-size: fit-content; }`, which beats the module's `.region-track` rule by specificity
((0,2,0) over (0,1,0)) whatever the sheet order. `fit-content` resolves to `min(max-content, max(min-content,
available))`, with the module's `min-inline-size: 100%` still applied: the table fills the box and wraps its cells
while its min-content width fits, and from that width on the track is as wide as the table's min-content width and the
box scrolls. No other module rule is overridden, and the module's interface and behaviour are unchanged: its
`ResizeObserver` still observes the track and the box.

**Spike (phase 1).** At 1280, 600 and 320 px: the US1-1 table and a table whose only wide content is the 26-character
identifier with and without `wrap="anywhere"`; the track's and table's inline sizes, the box's overflow state, the
focus clearance on a link off-screen, and the fades. Expected: wrap before overflow; overflow only with an unbroken
identifier without the policy, or with more columns than fit at their longest word.

**Alternatives (the options at the plan gate).** (a) The host override above (recommended: one property, no module
change). (b) A `track` sizing option added to 009's module (rejected for this mission: it changes 009's interface,
FR-008; it would go to 009's owner). (c) Keep max-content: cells never wrap inside the element, the table scrolls
whenever it is wider than its unwrapped width, and US1-9 changes to "the identifier breaks inside its cell" only once
the cell is given a width by the consumer.

## R-04 The region's name

**Decision.** `name = label?.trim() || captionText || undefined`, passed to `setLabel`; the module itself puts a
non-blank host `aria-label` first (contract § Inputs) and treats a blank one as absent. `captionText` is the
whitespace-collapsed, trimmed `textContent` of the assigned table's `caption` (`table.caption`), and a caption whose
trimmed text is empty counts as absent (spec check 3, SPEC-3-05; the README states it, and US1-7 gets that case in the
red commit). The element re-reads the caption from its `MutationObserver`, which observes its subtree for `childList`
and `characterData` (a swapped table, a replaced or edited caption, US1-16). The caption is never referenced by ID.

**Rationale.** FR-010. The accessible name of the `group` must not need an ID reference across the root; text copied
into `aria-label` is the established pattern (013's progress takes a heading's text as `label`).

**Alternatives.** `aria-labelledby` on the box pointing into the light DOM (rejected: crosses the shadow root). Naming
from the first column header (rejected: not a name for the whole table).

## R-05 What re-decides the overflow state (FR-014)

**Decision.** The module's own triggers: the table swapped (manual re-assignment fires `slotchange` on the box);
rows, cells or text changed in the assigned table (the track's size follows the table, so the track's
`ResizeObserver` fires); the box resized. The element adds no observer for overflow. The phase 1 spike swaps a
`<tbody>`, a whole `<table>` (fitting to overflowing and back, US1-13, US1-15), edits a cell's text and loads a late
web font, each against a fresh load; any case where the state differs is recorded here and in the README, and goes to
the operator if the module cannot see it.

**Rationale.** With R-03's `fit-content` the track's inline size follows the table's content, unlike the board's
contained lanes, so no unobserved case is expected.

## R-06 The cell rules in `@ocelle/styles` (FR-005, FR-006, FR-007, FR-012)

**Decision.** `packages/styles/src/base.css` gains a "data table" block, every selector of which is wrapped whole in
`:where()` (specificity (0,0,0)) and limited to the direct table: `:where(ocelle-data-table > table)`, its
`:where(ocelle-data-table > table > caption)`, its row groups and the cells of its rows,
`:where(ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th))` (the parser always creates a
`<tbody>`, so `table > tr` needs no case). A table nested in a cell is not selected (spec edge case). The values (all
tokens):

| Target | Values |
|---|---|
| table | `border-collapse: collapse`; `inline-size: 100%` (it fills the track, R-03); `margin: 0`; `font-family: var(--ocelle-font-sans)`; `font-variant-numeric: var(--ocelle-figures)` |
| caption | `font-size: var(--ocelle-font-size-sm)`; `font-weight: var(--ocelle-font-weight-medium)`; `line-height: var(--ocelle-line-height-normal)`; `color: var(--ocelle-color-ink)`; `text-align: start`; `padding-block-end: var(--ocelle-space-2)`; `position: sticky; inset-inline-start: 0` (it stays at the region's start edge while the region scrolls, R-07) |
| body cell (`td`, and `th` per FR-006's row rule) | `padding: var(--ocelle-space-1) var(--ocelle-space-2)` (4 px / 8 px, below 003's 8 px / 12 px); `font-size: var(--ocelle-font-size-sm)`; `line-height: var(--ocelle-line-height-compact)`; `color: var(--ocelle-color-ink-soft)`; `text-align: start`; `vertical-align: top`; `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)` (decorative, FR-013) |
| column header (FR-006's selection) | `font-size: var(--ocelle-font-size-xs)`; `font-weight: var(--ocelle-font-weight-medium)`; `text-transform: uppercase`; `letter-spacing: var(--ocelle-tracking-caps)`; `color: var(--ocelle-color-ink-muted)`; `border-block-end-color: var(--ocelle-color-rule-strong)` (decorative); same padding as body cells |
| row header (FR-006's selection) | `font-size: var(--ocelle-font-size-sm)`; `font-weight: var(--ocelle-font-weight-medium)`; `color: var(--ocelle-color-ink)`; no upper case, no tracking |
| last body row | `border-block-end: 0` on its cells |
| `ocelle-data-table[wrap="anywhere"]` body cells | `overflow-wrap: anywhere` (never on header cells) |
| forced colours | cells `CanvasText`, rules `CanvasText` (decorative lines stay visible, FR-013) |

FR-006's selection, in source order so the later rule wins where two match: column header = `thead th`,
`th[scope="col"]`, `th[scope="colgroup"]`; row header = `th[scope="row"]`, `th[scope="rowgroup"]`,
`:is(tbody, tfoot) th:not([scope])` (a corner cell with `scope="row"` in `<thead>` is a row header). The open
questions Q-A and Q-B (below) may change the header's weight and colour.

A second block, the prose override (FR-012), restates every property 003's prose rules set on the same targets,
with the data table's value, under `[data-ocelle-prose=""] :where(…the same targets…)` at (0,1,0), placed after
003's prose rules in `base.css`. 003's prose rules set today (`base.css` lines 127 to 223 on `main`): on the table
`margin-block` (the shared `:where(p, ul, ol, blockquote, pre, table, hr)` rule; spec check 3, SPEC-3-01),
`display`, `overflow-x`, `max-inline-size`, `container-type`, `border-collapse`; on `th, td` `min-inline-size`,
`padding`, `border-block-end`, `text-align`; on `th` font weight, size, figures and the rule colour; on the caption
`position`, `inset-inline-start`, `max-inline-size`, `text-align`, and the caption inherits `line-height-prose`. The
override restates each, plus `display: table`, `overflow-x: visible`, `max-inline-size: none`, `container-type:
normal` and `min-inline-size: auto`, and the caption's font size and line height (set by the data table, so
the prose line height does not reach it). A node test reads 003's prose table rules from `base.css` and fails when
one of their properties is not restated in the override (so a later 003 change cannot slip through), and US1-10's
body compares every property in the list on every target with the same table outside prose (SPEC-3-01).

**Rationale.** Shadow styles cannot reach a slotted table's cells (`::slotted()` reaches the table only). Zero
specificity outside prose lets a consumer's `td` rule win (US1-14). Inside prose only (0,1,0) after 003's rules can
win, and the README states that a consumer rule there needs more (FR-012).

**Alternatives.** A constructed stylesheet the element adopts on its root node (rejected: it would write to the
consumer's document or shadow root from an element, a side effect outside the element; and it cannot style the
pre-upgrade table). `::slotted(table)` for the table box only (used for nothing: the base rule styles it already).

## R-07 Caption, print and pre-upgrade

**Decision.** The caption is sticky at the inline start (R-06) so the table's name stays visible while the region
scrolls; it wraps within the region's visible width because the track's inline padding and the box clip it. The
spike measures at 320 px that the caption's text is never cut. Print: the phase 1 spike prints the overflowing story to
PDF in Chromium and records whether content past the box is clipped; the README states the result and that a consumer
who prints sets a print rule of its own. No print rule is added (spec edge case). Before upgrade the base rules style
the table, there is no region and no shadow root, so other children show and a wide table can widen the page; the
README says so (FR-012).

## R-08 The timeline and the chain: shadow lists with manual assignment

**Decision.** Both containers attach a manual-assignment shadow root and render `<ol role="list" part="list">` with
one `<li role="listitem">` per visible item, in source order; each `<li>` holds the decorative marker
(`<span class="marker" aria-hidden="true">`) and a `<slot>` to which the container assigns its item. A visible item
is a direct child with the item tag and neither `hidden` nor `aria-hidden="true"` (013's facts rule). One
`MutationObserver` per container re-renders on a change of its children and of an item's `hidden`, `aria-hidden`,
`variant` (chain) or `time` (timeline); a change inside an item's content needs no re-render. With no visible item the
container renders no `<ol>` at all (so no empty list node is exposed; FR-025's "set in the plan"). The list is named
on the `<ol>` with `aria-label` from the name of R-09.

`list-style: none` is set on the `<ol>` (the marker is the element's), and the explicit `role="list"` and
`role="listitem"` keep the list semantics in WebKit, which drops an unstyled list's role (spec check 1, SPEC-1-11);
Chromium is unaffected.

**Rationale.** Operator decision Q3 (a); 013's slotted-item pattern (R-01 of 013) measured that a shadow list with
manual assignment gives one clean list in Chromium. Rendering no `<ol>` when empty avoids an empty named list.

**Spike (phase 2).** The Chromium tree of a timeline of three events (`list` named, three `listitem`, each holding the
event's time and content as `StaticText`), with the FR-016 item-text oracle (R-11) and axe `list`, `listitem`,
`aria-allowed-role` and a full run.

## R-09 Naming the lists: a blank host `aria-label` counts as absent (FR-022)

**Decision.** `name = nonBlank(host aria-label) ?? nonBlank(label) ?? undefined`, set on the `<ol>`; with no name the
`<ol>` has no `aria-label`. The host's own `aria-label` attribute is the consumer's and is not removed; whether
Chromium exposes it on the host's generic node, and whether axe reports `aria-prohibited-attr` for it, is measured in
phase 2's spike against 009's lane, which renders its named role on a shadow wrapper the same way (branch). If the host
attribute is exposed as a second name, the element follows whatever 009's lane does on `main` (R-14) and no story sets
a host `aria-label` unless axe is clean on it (Complexity Tracking, if needed).

**Rationale.** FR-022 and the README's Host ARIA rule for elements whose role sits on a shadow node (009). The library
helper `accessibleName` in `naming.ts` implements the other rule ("decides alone"), so the containers do not use it.

## R-10 The timeline's look (FR-021, FR-023, FR-027)

**Decision (plan default; Q-C below may change it).** The event renders its own shadow root: `<span part="time">`
(only when `time` is non-empty) above `<span part="content"><slot></slot></span>`, each `display: block`. The time is
`--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, `--ocelle-figures`, line height
`--ocelle-line-height-normal`; the content is `--ocelle-font-size-sm`, regular weight, `--ocelle-color-ink`,
`--ocelle-line-height-normal`; time and content differ by size and weight (FR-023). The container's `<li>` is a
two-column grid: a marker column of `--ocelle-size-dot` plus `--ocelle-space-3` of gap, and the item. The marker sits
in a `1lh` wrapper whose line box is set to the time's type when the event has a time and to the content's type when
it has none (the container reads the item's `time` attribute and sets a class on the `<li>`), so it is centred on the
event's first line (the slot convention's `1lh` technique, which `style-lint` allows). The marker is a filled square
of `--ocelle-size-dot` in `--ocelle-color-ink-muted` with `--ocelle-radius-1` (the tokens README's radius for small
marks; Q-D below). The connector is the `<li>`'s `::before` in the marker column, `--ocelle-border-width` wide in
`--ocelle-color-rule-strong` (decorative), from the marker's centre to the next `<li>`'s marker centre (it spans the
`<li>`'s block size plus the row gap); the last `<li>` has none (`:last-child`, and hidden items render no `<li>`).
Rows are separated by `--ocelle-space-3`. All positions are logical (`inset-inline-start`), so `dir="rtl"` mirrors
them.

`wrap="anywhere"` on an event sets `overflow-wrap: anywhere` on `part="content"` only.

Outside a timeline the event's own shadow content (time above content) shows as plain text, with no marker or role.

**Contrast.** `ink-muted` on the nine main grounds is a text declaration in the token source (4.5:1 or more), above
the 3:1 FR-013 requires of the marker (branch values; the contrast gate reads them).

## R-11 The item-text oracle (FR-016)

**Decision.** A driver function `itemTexts(list)` reads the full Chromium accessibility tree through CDP
(`Accessibility.getFullAXTree`, ignored nodes left out), finds the `list` node of the container and, for each child
`listitem`, joins the `name` of its `StaticText` descendants in tree order with single spaces, collapses white space
and trims. It is added to both harnesses with its own test (a plain `<ol>` with two items, one holding nested inline
markup), and every body that asserts an item text also asserts it is not empty. The browser harness uses its existing
CDP session (013's `commands.ts` reads the AX tree for value properties).

## R-12 The chain's look and line ends (FR-031 to FR-036)

**Decision (plan default; Q-A and Q-D below may change it).**

- The `<ol>` is `display: flex; flex-wrap: wrap; align-items: flex-start`, with `row-gap: var(--ocelle-space-3)` and
  no column gap: each `<li>` carries the gap after it as `padding-inline-end: var(--ocelle-space-5)`, inside which its
  connector (`::after`) is drawn, `--ocelle-border-width` thick in `--ocelle-color-rule-strong` (decorative), vertically
  centred on the marker, from `--ocelle-space-1` after the step to `--ocelle-space-1` before the padding's end.
- **Line ends.** CSS cannot tell a line's last flex item. The container measures: after each render and from a
  `ResizeObserver` on the `<ol>` and on each `<li>`, it compares each visible `<li>`'s block-start offset with the
  next one's and sets `data-line-end` on each `<li>` whose next item starts a new line, and on the last; the rule
  `li[data-line-end]::after { content: none }` hides that connector. The connector is absolutely positioned in
  padding that exists either way, so toggling it changes no size and the observer cannot loop; the write happens in
  the observer callback. The result depends only on the current layout, so it is the same whatever the history. The
  phase 3 spike measures it at 1280, 600 and 320 px, after a step's text changes, a step added and hidden, a late web
  font and `dir="rtl"`, against a fresh load.
- **Default step.** The `<li>` is an inline flex row: marker, `--ocelle-space-2`, item. The marker is
  `--ocelle-size-step` square, `box-sizing: border-box`, no fill, a `--ocelle-ring-step` solid border in
  `--ocelle-color-ink-muted` (structural, 3:1 through its text declaration), `--ocelle-radius-1` (Q-D), with the
  ordinal centred in `--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`,
  `--ocelle-figures`, line height 1 (`--ocelle-line-height-tight` is 1.15; the plan uses it). The ordinal is text inside
  the `aria-hidden` marker. The step content is `--ocelle-font-size-sm`, `--ocelle-color-ink`,
  `--ocelle-line-height-normal`, set on the slotted item through `::slotted(ocelle-evidence-step)`, and is
  vertically centred with the marker on its first line (the `1lh` wrapper again).
- **Ordinals.** Each default step's ordinal is its 1-based position among the visible steps, chip steps counted (spec
  check 3, SPEC-3-02: the numbers shown can skip, for example 1, 2, 4 with a chip third). The red commit's US3-6 body
  asserts exactly that, with a case where a chip step is hidden and shown again.
- **Two-digit fit (SPEC-3-03).** The marker's inner box is 22.4 − 2 × 1.5 = 19.4 px; "20" at 12 px tabular is about
  14 px wide and 13.8 px tall. The check: for ordinal 20 in a twenty-step chain, the ordinal's rendered box lies inside
  the marker's inner (padding) box, with `scrollWidth <= clientWidth` on the marker.
- **Chip step (FR-035).** The container styles a chip through `::slotted(ocelle-evidence-step[variant="chip"])` and
  renders no marker in its `<li>`: `--ocelle-font-size-xs` (one step below the default's `sm`),
  `--ocelle-line-height-normal`, `padding-block: 0`, `padding-inline: var(--ocelle-space-2)`, a `--ocelle-ring-step`
  solid border in `--ocelle-color-ink-muted`, `border-radius: var(--ocelle-radius-2)`, `--ocelle-color-ink`. The sum:
  12 px × 1.45 = 17.4 px line + 2 × 1.5 px border = 20.4 px, below `--ocelle-size-step`'s 22.4 px (US3-4). No fill
  (Q-A). Nothing of `ocelle-pill-tag` is imported or read; a node test greps the chain's source and styles for
  `pill`.
- `variant` and `wrap` on the step reflect to attributes, so the container's `::slotted()` selectors and the
  `MutationObserver` see a property set from script.

Outside a chain a step's own shadow root shows its content as plain text, with no marker, ordinal or chip box (the
chip box is the container's styling).

**Alternatives.** A clip trick that hides the line-start connector with `overflow: clip` and
`overflow-clip-margin` (rejected: WebKit, Kitty Desktop's engine, has no `overflow-clip-margin`, so a focus ring at a
line's start would be clipped there). A dangling connector at each line's end (rejected: FR-034 draws connectors
between consecutive steps on one line only).

## R-13 Tokens

**Decision.** No new token. Every value above is an existing token on `main`, plus `--ocelle-tracking-caps` from 009
(branch). Every text colour (`ink`, `ink-soft`, `ink-muted`) and every structural mark (`ink-muted`) has a text
declaration on the nine main grounds; the decorative lines use `color-rule` and `color-rule-strong`, which have none
(FR-013). No contrast row is added. If Q-A to Q-D change a colour, the plan checks the new pair against the token
source before tasks are generated.

## R-14 The recheck against `main` (the first task)

**Decision.** Before any phase starts, task T001 compares, on `main` as merged: 009's `overflow-region.ts` exports,
constructor options, `setLabel`, the class names, the `.region-track` rule (R-03 depends on it) and the README's
conventions entry; `--ocelle-tracking-caps` in the token source; 013's README § Element conventions (slotted items,
container import, wrap, `undefined` defaults) and its driver functions; 011's or 012's eyebrow tokens, if any is on
`main` (FR-006); op 016's `gate:plants -- --affected <base>` and `--list`, and its `reviews/phase-<N>/plants.md`
record; #10's gate commands and container. Each difference is written to `reviews/recheck.md`, and the flow stops for
the operator on any difference before phase 1's spike.

## R-15 Gate runs per phase (FR-051, FR-059)

**Decision.** Each phase runs the gates its diff touches, the plants by op 016's selection:
`pnpm run gate:plants -- --affected <phase base>` (with `--list` recorded first) and the result in
`reviews/phase-<N>/plants.md`, never a full `gate:plants` locally (CI's required Plants check judges the full set).
Baselines: `pnpm run visual:update` only in #10's pinned container under docker (start `dockerd` as root; after a
container restart, `pnpm run setup:online`); the command must report `<n> added, 0 changed, 0 removed` with `<n>`
twice the phase's new stories, so no existing baseline moves (013's baselines among them, SC-007). Conflicting PNGs
are regenerated in the container, never hand-picked. Mutation follows #23 and op 015 on `main`.

## R-16 The kitty-mission-ui inventory (FR-058)

**Decision.** The README mapping rows need the inventory of kitty-mission-ui's `.sk-data-table` variants (modifiers
and states, with counts, role names only) and of any event-history or evidence-chain class family. kitty-mission-ui is
outside this session's GitHub scope, so, as in 013, the inventory is an operator input recorded here before each
phase's red commit (tasks T00x per phase); a gap goes to the operator, and the surface is not widened by review.

## Open questions for the plan gate (spec SPEC-1-06 (b))

The plan's choices below stand until the operator answers; an answer that changes a requirement is written into the
spec before tasks are generated.

- **Q-A. The chip step's look (FR-035, #517).** (a) Outline only, no fill (the plan's choice: the chip reads as the
  chain's own and cannot be mistaken for #7's filled pill tag). (b) Outline and a `--ocelle-color-inset` fill (a
  stronger chip; the chip's text then needs its declaration on inset, which ink has). (c) Fill only, no outline (the
  boundary would need 3:1 from the fill, which no fill token gives on all grounds). Recommendation: (a).
- **Q-B. The column headers' weight and colour (FR-006, #533).** (a) `--ocelle-font-weight-medium` in
  `--ocelle-color-ink-muted` (the plan's choice, the same eyebrow 013's empty-state eyebrow uses). (b)
  `--ocelle-font-weight-strong` in `--ocelle-color-ink-muted` (heavier, closer to a heading). (c)
  `--ocelle-font-weight-medium` in `--ocelle-color-ink-soft` (the cells' colour, distinct only by size and case).
  Recommendation: (a).
- **Q-C. The event's time position (FR-023, which sets FR-021's marker line; #470).** (a) The time on its own line
  above the content, the marker centred on the time's line (the plan's choice: the content keeps the full width at
  320 px). (b) The time before the content on the same line, the marker centred on that shared first line (a narrower
  content column; a long time wraps). (c) The time after the content, at the inline end. Recommendation: (a).
- **Q-D. The markers' shape (constitution II's radius rule).** (a) `--ocelle-radius-1` for both the timeline dot and
  the step marker (the plan's choice: the tokens README gives `radius-1` to small marks, dots included; at 22.4 px the
  step marker reads as a rounded square). (b) Round marks: a new token `--ocelle-radius-round: 50%` under FR-040,
  recorded as a mark shape, not a corner radius. (c) `radius-1` for the dot and a round step marker (the token of
  (b) for the step only). Recommendation: (a), unless #470 or #517 shows round markers, then (b).

And one decision from the research itself:

- **Decision 1 (R-03). The track's inline size.** (a) The data table's host rule `:host .region-track { inline-size:
  fit-content }` (recommended). (b) A track-sizing option in 009's module (a change to 009's interface, outside this
  mission). (c) Keep the module's max-content: cells never wrap inside the element, and US1-9 changes.
