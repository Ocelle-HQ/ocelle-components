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

**Host sizing (PLAN-A11Y-SECURITY-1-004, operator decision (a)).** The element's own styles set `:host {
min-inline-size: 0; }`. As a default flex item, or a grid item in an `auto` or `1fr` track, the host's automatic
minimum is otherwise its content's min-content width, so the region would never overflow and the page would scroll
sideways (FR-009; 015's README documents the same limit for 009's own elements). Phase 1's red commit has two 320 px
bodies: the element as a default flex item and as a `1fr` grid item, each asserting that the page's scroll width
equals the viewport width and that the region overflows (its box is a tab stop). The README states that a host that is
not itself the flex or grid item (a wrapper around it) needs `min-inline-size: 0` on that wrapper.

**Shrink-to-fit hosts (PLAN-FRESH-2-001, operator decision (a)).** The data table sets no `container-type` on any of
its boxes (R-07). Inline size containment on `.region-box` would make the box add nothing to its ancestors' intrinsic
sizes, so in a shrink-to-fit host the host, the box and the caption would be 0 px wide. Such hosts are a `<dialog>`, a
popover or other absolutely positioned panel, an inline-block, a float, a table cell, a start-aligned column flex or
grid, and a `width: fit-content` card. The squad measured this in headless Chrome. 015's README rule says the same: no
`container-type` on a host that may shrink to fit. In such a host the data table takes its table's width, as 009's
elements take their content's. It does not overflow unless its own inline size is bounded, so the page may scroll
sideways instead; the README's Sizing line states this, as 015's does for the scroller. Phase 1's red commit has
three shrink-to-fit bodies: the element in an open `<dialog>`, in a `display: inline-block` wrapper, and in a column
flex with `align-items: flex-start`. Each runs with a fitting table and asserts three things. The host's inline size
equals the table's width plus the track's ring room on both sides (2 × (`focus-offset` + `focus-width`)), within
0.5 px, and is above 0. The caption is not narrower than its longest word. A long caption over a narrow table wraps at
the table's width, within 0.5 px, and does not widen the host: a CSS table takes its caption's min-content width (the
longest word), not its max-content width (R-07, PLAN-FRESH-3-002 (b)).

**A caption word wider than its table (PLAN-FRESH-3-002, operator decision (b)).** The caption has no inline size
containment (R-07), so its longest word widens the table, as CSS tables do, and a fitting table never overflows
because of its caption. Phase 1's red commit has one more shrink-to-fit body: a two-column narrow table ("Ok" and "3")
whose caption, "Deployment approvals pending", has words wider than the grid, in an inline-block. It asserts that the region does not overflow (the box has no tab stop, no `role` and no
`data-fade`), that the table is as wide as the caption's longest word within 0.5 px, and that the host is the table
plus the ring room on both sides. It is one of the no-loop bodies of R-07, with the precondition that the box's
unrounded width rounds down, so it also guards the unrounded box size write (PLAN-FRESH-3-002 verify 1). In a host
whose inline size is bounded, a caption word wider than the box less the
ring room overflows the box as any unbreakable content does, and the region scrolls; the README states this with the
caption rules.

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
non-blank host `aria-label` first (contract § Inputs) and treats a blank one as absent. `captionText` is the caption
text of the assigned table's `caption` (`table.caption`), computed by walking its subtree in tree order
(PLAN-A11Y-SECURITY-1-005, operator decision (a)):

- a text node contributes its data;
- an element with the `hidden` attribute or `aria-hidden="true"` contributes nothing, nor does its subtree;
- an `<img>` contributes its `alt` (nothing when it has none);
- the result has every run of white space collapsed to one space and is trimmed.

So the group's name matches the name the platform gives the table from its caption in these cases, where
`textContent` would not. A caption hidden by a consumer stylesheet (`display: none` from CSS) is not detected; the
README asks for the `hidden` attribute instead. A caption whose caption text is empty counts as absent (spec check 3,
SPEC-3-05; the README states it, and US1-7 gets that case in the red commit). The element re-reads the caption from
its `MutationObserver`, which observes its subtree for `childList`, `characterData` and the attributes `hidden`,
`aria-hidden` and `alt` (a swapped table, a replaced or edited caption, US1-16, a part of the caption hidden or shown).
The caption is never referenced by ID.

Phase 1's red commit has one body per rule: a caption holding a `hidden` span, one holding an `aria-hidden="true"`
span, and one holding an `<img alt="…">` between two words. Each asserts the region's name, and the `hidden` one also
asserts the name changes when the attribute is removed.

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
| caption | `font-size: var(--ocelle-font-size-sm)`; `font-weight: var(--ocelle-font-weight-medium)`; `line-height: var(--ocelle-line-height-normal)`; `color: var(--ocelle-color-ink)`; `text-align: start`; `padding-block-end: var(--ocelle-space-2)`; `position: static` (not sticky until 009's option of R-17 lands; Q-F (b)); the measured `max-inline-size` cap of R-07 and no inline size containment (it scrolls with the table and wraps inside the box's unmasked width at rest; PLAN-FRESH-3-002 (b)) |
| body cell (`td`, and `th` per FR-006's row rule) | `padding: var(--ocelle-space-1) var(--ocelle-space-2)` (4 px / 8 px, below 003's 8 px / 12 px); `font-size: var(--ocelle-font-size-sm)`; `line-height: var(--ocelle-line-height-compact)`; `color: var(--ocelle-color-ink-soft)`; `text-align: start`; `vertical-align: top`; `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)` (decorative, FR-013) |
| column header (FR-006's selection) | `font-size: var(--ocelle-font-size-xs)`; `font-weight: var(--ocelle-font-weight-medium)`; `text-transform: uppercase`; `letter-spacing: var(--ocelle-tracking-caps)`; `color: var(--ocelle-color-ink-muted)`; `border-block-end-color: var(--ocelle-color-rule-strong)` (decorative); same padding as body cells |
| row header (FR-006's selection) | `font-size: var(--ocelle-font-size-sm)`; `font-weight: var(--ocelle-font-weight-medium)`; `color: var(--ocelle-color-ink)`; no upper case, no tracking |
| last body row | `border-block-end: 0` on its cells, selected as `ocelle-data-table > table > :is(tbody, tfoot):last-child > tr:last-child > :is(td, th)`: the last row of the table's last row group only, so consecutive rows across two `<tbody>` groups, or a `<tbody>` and a `<tfoot>`, keep the rule between them (PLAN-CORRECTNESS-1-009). HTML puts a `<tfoot>` after the body row groups; a `<tfoot>` written before a `<tbody>` is still rendered last, but the selector follows source order, so its last row keeps its rule and the last `<tbody>` row has none. The README states this |
| `ocelle-data-table[wrap="anywhere"]` body cells | `overflow-wrap: anywhere` (never on header cells) |
| forced colours | cells `CanvasText`, rules `CanvasText` (decorative lines stay visible, FR-013); no `forced-color-adjust: none` (003's `source.test.ts` rejects it in `base.css`) |

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
override restates each, plus `display: table`, `overflow-x: visible`, `max-inline-size: none` on the table,
`container-type: normal` and `min-inline-size: auto`, and the caption's `position: static`, `inset-inline-start:
auto`, font size, line height and R-07's measured `max-inline-size` cap (set by the data
table, so neither 003's sticky prose caption, the prose line height nor the prose cap reaches it).

**The override's node test (PLAN-TESTABILITY-1-008).** It does not list 003's selector forms. It parses `base.css`,
selects every `[data-ocelle-prose=""]` rule whose selector can match a table, caption, row group (`thead`, `tbody`,
`tfoot`), row (`tr`), column (`col`, `colgroup`) or cell (`th`, `td`), pseudo-classes included (for example
`:where(table:focus-visible)` at `base.css` lines 198 to 201), and fails on any property of those rules that the
override does not restate on the matching target. A property that cannot apply inside the element is recorded in the
test's own not-applicable list with its reason, and the list is asserted exactly: `outline` and `outline-offset` of
`:where(table:focus-visible)` (the region's box is the tab stop; a consumer who makes the table focusable keeps 003's
inset ring, and US1-10 compares the rest). So a later 003 rule on `tr`, a row group, `col` or a pseudo-class is read,
and fails the test until the override or the list takes it. US1-10's body compares every property in the list on every
target with the same table outside prose (SPEC-3-01).

**003's existing test (PLAN-CORRECTNESS-1-005).** `packages/styles/test/source.test.ts` (lines 192 to 203) pins the
prose slice to its exact position and requires `rules(root).slice(start)` to equal `[wrap]`, so any rule added after
the wrap rule fails it. Each phase's red commit changes that test for the rules its own green adds, so every green
passes it (PLAN-CORRECTNESS-1-005, PLAN-FRESH-1-004):

- Phase 1's red: the rule table gains block 1 (the data-table rules) and block 2 (the prose override), transcribed
  with their declarations, after the wrap rule, and the last-rule assertion becomes "the wrap rule, then block 1,
  then block 2, in that order".
- Phase 2's red: the table gains the timeline's two pre-upgrade rules (R-08, block 3's first two: the visible-item rule
  and the `aria-hidden` rule) after block 2, and the assertion becomes "the wrap rule, block 1, block 2, then the
  timeline's rules".
- Phase 3's red: the table gains the chain's two pre-upgrade rules after the timeline's, and the assertion becomes the
  final order "the wrap rule, block 1, block 2, block 3 (the timeline's rules, then the chain's)".

Each red commit's message names this change and its reason (Principle VIII: an existing test changed for a planned
addition, not to pass). The new
styles tests follow the package's own layout: browser bodies in `packages/styles/test/browser/data-table.test.ts`, the
override's node test in `packages/styles/test/prose-override.test.ts` (the package has no `test/node/`).

**Rationale.** Shadow styles cannot reach a slotted table's cells (`::slotted()` reaches the table only). Zero
specificity outside prose lets a consumer's `td` rule win (US1-14). Inside prose only (0,1,0) after 003's rules can
win, and the README states that a consumer rule there needs more (FR-012).

**Alternatives.** A constructed stylesheet the element adopts on its root node (rejected: it would write to the
consumer's document or shadow root from an element, a side effect outside the element; and it cannot style the
pre-upgrade table). `::slotted(table)` for the table box only (used for nothing: the base rule styles it already).

## R-07 Caption, print and pre-upgrade

**Decision.** This section follows PLAN-CORRECTNESS-1-001 (operator decision (a): the caption is bound so it wraps
inside the box), PLAN-FRESH-2-001 (operator decision (a): a measured cap, no query container) and PLAN-FRESH-2-002
(operator decision (c), which answers Q-F as (b)). Until 009's module has the option of R-17, the caption is not
sticky (R-06). It is part of the table, scrolls with it, starts at the table's start edge at every scroll position
(no inset), and is reached by scrolling back to the start. The spec's edge case "Caption while the region scrolls"
allows this. The caption is still given a bound. A caption as wide as the table grid would otherwise run past the
box's end edge at rest and be clipped there, and clipping by the box is not wrapping. 003's prose caption has such a
bound too (`base.css` lines 187 to 209: `max-inline-size: var(--ocelle-measure-container)`, `100cqi`, against the
prose table's query container). The data table bounds its caption without a query container:

- **No query container.** No box of the data table sets `container-type`. Inline size containment on `.region-box`
  collapses the element to 0 px in every shrink-to-fit host (R-02, PLAN-FRESH-2-001).
- **A measured width.** The element observes a measuring element with its own `ResizeObserver`
  (PLAN-FRESH-3-001, operator decision (a)). The measuring element is an empty `<div class="box-size"
  aria-hidden="true">` in the data table's shadow root, a sibling after `.region-frame` and outside 009's structure,
  styled `:host .box-size { block-size: 0; }`. Its inline size is the host's content width, which equals
  `.region-box`'s in every host, and its size depends on neither the caption nor the table's block size. It adds
  one internal node and changes nothing of 009's module (FR-008). The observer does not watch `.region-box`: the cap
  it writes rewraps the caption, which changes the box's block size, and a write that changes the observed box raises
  the "ResizeObserver loop" error on `window`. The squad measured that in headless Chrome on a plain block host on
  first load, whenever the caption's line count differs between the fallback cap and the measured one; the same page
  observing a `block-size: 0` sibling gave one callback, no error and the same cap. 009's observer belongs to the
  module and is not reached into. This observer sizes the caption only, so R-05's overflow triggers are unchanged. On
  each callback the observer writes the measuring element's unrounded inline size (the entry's
  `contentBoxSize[0].inlineSize`, in px, not transformed), which is `.region-box`'s exact width: 009's box has no
  inline padding or border and, with no bounded block size, no vertical scrollbar. It never writes `clientWidth`,
  which rounds to a whole pixel (PLAN-FRESH-3-002 verify 1, "No feedback" below). The value is written as the
  inherited custom property `--data-table-box-size` on `.region-track`. It writes it into the element's own per-instance constructed
  stylesheet, adopted after `overflowRegionStyles` (`replaceSync` once, then `setProperty`, as 009's module does for
  its mask figures). There is no `style` attribute, so strict CSP holds. The slotted table and its caption inherit the
  property through the flat tree. The property is internal: it has no `--ocelle-` prefix, it is not a token, not
  manifest surface and not a documented hook, and `token-only` checks `--ocelle-*` names only, so it needs no new
  allowance.
- **The end fade, only while it shows, written one frame later (PLAN-FRESH-3-002, operator decision (b); verify 1).**
  The cap subtracts the end fade only while `.region-box` has `data-fade="end"` or `data-fade="both"`. The element
  writes the inherited internal property `--data-table-end-fade` on `.region-track` in the same per-instance sheet:
  `var(--ocelle-scroller-fade-size)` while the end fade shows, and the property removed otherwise. No shadow rule on
  `.region-box[data-fade=…]` sets it, and it is never written in the task in which the fade changes. 009's module
  decides the fade in its own `ResizeObserver` callback on `.region-box`, and the element renders the new `data-fade`
  in Lit's update, a microtask inside that delivery. A cap that changed there would rewrap the caption and change
  `.region-box`'s block size at the depth just delivered, and the platform raises the "ResizeObserver loop" error. The
  squad measured that in headless Chrome: a 400 px block host whose table fits, a caption one line long at the 390 px
  cap and two lines at 358 px, and a cell edit that makes the table overflow gave "ResizeObserver loop completed with
  undelivered notifications."; the same page with the fade subtracted unconditionally gave none. A `tbody` or table
  swap, a late web font, a `hidden` host shown or any change that toggles the end fade while the host's inline size
  stays put takes the same path. So `updated()` compares the rendered fade's end state with the one last written and,
  when they differ, requests one animation frame (at most one pending request per instance, cancelled on disconnect).
  The frame callback reads `.region-box`'s current `data-fade` and writes or removes the property. Animation frame
  callbacks run before the frame's layout and its `ResizeObserver` gathering, so the rewrap reaches 009's observer as
  a fresh notification in that frame, not as a change inside a delivery. The cap changes only how the caption wraps:
  a table that overflows by its grid still overflows, a fitting table's caption contribution stays within the box less
  the ring room, and a caption word that overflows a bounded box still overflows it, so 009 leaves `data-fade` as it
  is and there is no second write. A scroll that moves the fade between `both` and `start` takes the same deferred
  write, outside any delivery. The cost is one frame: for the frame in which the end fade first shows the caption may
  run under it, and for the frame in which it goes the caption is up to the fade's depth narrower than its cap. After
  `settle` (two animation frames) both are gone. The property has no `--ocelle-` prefix and is not surface, as
  `--data-table-box-size`.
- **The cap.** Block 1 and the prose override cap the caption at `max-inline-size: calc(var(--data-table-box-size,
  var(--ocelle-measure-container)) - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)) -
  var(--data-table-end-fade, 0 * var(--ocelle-scroller-fade-size)))`. That is the box's visible width, less the
  track's ring room on both inline sides (009's `.region-track` pads each side by `focus-offset` + `focus-width`,
  5 px), less the end fade while it shows. The fallback is a zero length written over a token, because `token-only`
  admits no `0px`. The caption then wraps inside the box's unmasked width at rest, and a fitting table's cap is the
  table's own width: no fade, and the box is the table plus the ring room.
- **No feedback.** The caption has no inline size containment (PLAN-FRESH-3-002 (b); round 2's `contain:
  inline-size` is dropped). Its min-content width, its longest word, takes part in the table's width as CSS tables
  give it, so a fitting table is never made to overflow by a caption word; its max-content width does not, so a long
  caption over a narrow table wraps at the table's width. Three paths that could feed a write back into a
  `ResizeObserver` delivery are closed:
  - *The observed node.* Neither axis of `.box-size` depends on the caption or the table, so the box size write never
    changes the node the element's observer watches (PLAN-FRESH-3-001). A rewrap does change `.region-box`'s block
    size, but `.region-box` is deeper than `.box-size`, so 009's observer receives it in the same frame.
  - *The exact width.* The written width is unrounded, so in a fitting shrink-to-fit host the cap equals the table's
    width exactly, which the caption's min-content contribution already fits: the write shrinks nothing and the
    host's width is stable after one write. A `clientWidth` write would round to a whole pixel. When the box's width
    has a fraction under 0.5 px and the table's width is set by the caption's longest word, the cap would come out
    under that word, `max-inline-size` would clamp the caption's min-content contribution, and the table, the host and
    `.box-size` would shrink after the write: a loop error on first load. The squad measured that in headless Chrome
    with the one-long-word body of R-02 (an inline-block, cells "a" and "b", caption "Deployment approvals pending":
    box 95.4 then 95.0 px, table 85.4 then 85.0 px, the loop error); writing the exact width gave one callback and no
    error.
  - *The end fade.* It is written one animation frame after the fade changes, outside any delivery (above).

  In a bounded host the measuring element's inline size does not depend on the table. Phase 1's spike confirms all
  three: one callback, no error and a stable width in each shrink-to-fit host, and one end fade write per fade change
  in a block host. A caption word wider than a bounded box less the ring room overflows the box as unbreakable cell
  content does, and the region scrolls; the README states it (R-02).
- **The flat tree.** The caption is slotted content (a descendant of the slotted table), so both properties must
  reach it through the flat tree. Phase 1's spike measures this in Chromium, and that no `ResizeObserver` loop error
  is raised in a block host on first load with a caption that rewraps between the fallback and the measured cap, in
  the narrow-column resize, when a `hidden` host is shown, when a cell edit takes a block-host table from fitting to
  overflowing and back with a caption that rewraps across the end fade's depth, and in the shrink-to-fit hosts of
  R-02, the one-long-word body with a box width that rounds down among them. A failure goes to the operator.
- **Before upgrade.** Outside the element (pre-upgrade) both properties are unset. The fallback
  `--ocelle-measure-container` (`100cqi`) resolves against the nearest query container or, with none, the small
  viewport, and the end fade falls back to zero. That bounds the caption at the viewport's width less the ring room.

Phase 1's red commit has these caption bodies:

- **320 px, overflowing, at rest** (`scrollLeft` 0). Every line box of the caption (`Range` client rects over its
  text) lies inside the box's unmasked extent: the box's visible rect, less the depth of each fade that shows (the
  `.region-edge` widths). The caption's inline start equals the table's within 0.5 px (no inset, PLAN-FRESH-2-002).
- **320 px, scrolled to the middle (the `both` fade) and to the end.** The caption's inline start still equals the
  table's within 0.5 px: it scrolls with the table and is not sticky.
- **A fitting table.** The box has no `data-fade`. The caption's inline start equals the table's, its line boxes lie
  inside the box, and a caption longer than the table wraps at the table's width within 0.5 px (the cap is the
  table's width, no fade subtracted).
- **A narrow column** (a 400 px wrapper at a 1280 px viewport, then resized to 600 px; PLAN-FRESH-3-003). Its table
  overflows at both widths, and its caption is longer than the box at both widths. After `settle`, at each width the
  body first asserts `data-fade="end"` at rest (`scrollLeft` 0), then that every caption line box lies inside the
  box's unmasked extent. With a fitting table the caption lies inside the box whatever the cap is, so the table must
  overflow for the body to prove that the cap follows the measured box and not the viewport.
- **The end fade toggled by content** (PLAN-FRESH-3-002 verify 1). A 400 px block host whose table fits and fills the box, with a
  caption one line long at the fitting cap (the box less the ring room, 390 px) and two lines at that cap less the end
  fade's depth (358 px).
  A cell's text is edited so the table overflows. After `settle` the body asserts `data-fade="end"` at rest
  (`scrollLeft` 0), that the caption has two line boxes, and that each lies inside the box's unmasked extent. The edit
  is then undone, and after `settle` the box has no `data-fade` and the caption has one line box again.
- **No loop.** The in-process test records `error` events and `console.error`, and asserts none carries
  "ResizeObserver loop", around each of these (PLAN-FRESH-3-001, PLAN-FRESH-3-002 verify 1): a block host on first
  load whose caption wraps to a different line count at the fallback cap and at the measured cap (a caption one line
  long at the table's width and two lines at the measured cap); the narrow-column resize; a `hidden` host shown; the
  end-fade body above, both edits; and the shrink-to-fit bodies of R-02, the one-long-word body among them. That
  body first asserts, as a precondition, that the box's unrounded inline size has a fractional part between 0.1 and
  0.4 px, so a rounded write would land under the caption's longest word; phase 1's spike picks the caption text (or a
  test-only `letter-spacing` on it) that gives this in the test font. It uses the recorder and synthetic self-check
  that R-12 describes; phase 1 builds them in `packages/elements/test/data-table.test.ts`, and phase 3 reuses them.
  Three element plants must fail it (contracts/checks.md): "the observer back on `.region-box`, writing
  synchronously" (the first-load body), "the box size written as `clientWidth`" (the one-long-word body) and "the end
  fade written in the task in which the fade changes" (the end-fade body).

The spec edge case "never cut at 320 px (it wraps)" is then measured, not only spiked.

Print: the phase 1 spike prints the overflowing story to
PDF in Chromium and records whether content past the box is clipped; the README states the result and that a consumer
who prints sets a print rule of its own. No print rule is added (spec edge case). Before upgrade the base rules style
the table, there is no region and no shadow root, so other children show and a wide table can widen the page; the
README says so (FR-012).

## R-08 The timeline and the chain: shadow lists with manual assignment

**Decision.** Both containers attach a manual-assignment shadow root and render `<ol role="list" part="list">` with
one `<li role="listitem">` per visible item, in source order; each `<li>` holds the decorative marker
(`<span class="marker" aria-hidden="true">`), the decorative connector (`<span class="connector"
aria-hidden="true">`, a real element, PLAN-TESTABILITY-1-001 operator decision (b)) and a `<slot>` to which the
container assigns its item. A visible item is a direct child with the item tag and neither `hidden` nor
`aria-hidden="true"` (013's facts rule). One `MutationObserver` per container re-renders on a change of its children
and of an item's `hidden`, `aria-hidden`, `variant` (chain) or `time` (timeline); a change inside an item's content
needs no re-render. The item properties the containers read (`time`, `variant`) reflect to attributes, so a property
set from script is seen (R-10, R-12). With no visible item the
container renders no `<ol>` at all (so no empty list node is exposed; FR-025's "set in the plan"). The list is named
on the `<ol>` with `aria-label` from the name of R-09.

`list-style: none` is set on the `<ol>` (the marker is the element's), and the explicit `role="list"` and
`role="listitem"` keep the list semantics in WebKit, which drops an unstyled list's role (spec check 1, SPEC-1-11);
Chromium is unaffected.

**Connectors as elements.** The connectors are spans, not `::before` or `::after`, so the drivers' existing `boxes`
and `styles` readers measure them (no driver reads a pseudo-element) and the forced-colours bodies can read their
painted colour and box (R-10, R-12). Each connector span is empty and `aria-hidden="true"`; the AX bodies assert that
no node of a marker or connector is in the tree, and a DOM assertion pins `aria-hidden="true"` on each (R-11's probe:
an empty span adds no node in Chromium either way).

**Before upgrade (PLAN-FRESH-1-004, operator decision (a); PLAN-FRESH-2-005, operator decision (a)).**
`@ocelle/styles` gains four (0,0,0) rules, two per container, as 013's `:where(ocelle-facts:not(:defined) >
ocelle-fact:not([hidden]))` rule does for facts:

- `:where(ocelle-event-timeline:not(:defined) > ocelle-timeline-event:not([hidden]):not([aria-hidden="true"])) {
  display: block; }`;
- `:where(ocelle-event-timeline:not(:defined) > ocelle-timeline-event[aria-hidden="true"]) { display: none; }`;
- `:where(ocelle-evidence-chain:not(:defined) > ocelle-evidence-step:not([hidden]):not([aria-hidden="true"])) {
  display: block; }`;
- `:where(ocelle-evidence-chain:not(:defined) > ocelle-evidence-step[aria-hidden="true"]) { display: none; }`.

A server-rendered timeline or chain then shows one visible item per line before upgrade instead of running its items
together. The `display: none` rules are needed because an undefined item that only misses the first rule falls back
to inline display and still shows. With them, an `aria-hidden="true"` item is not shown before upgrade either, as
FR-025 requires and as the upgraded containers do, so nothing shifts on upgrade. A `hidden` item is hidden by the
UA's own rule. An event's time is an attribute rendered only in shadow, so it does not show before upgrade, and the
README's "Before upgrade" line per container says so. The styles browser bodies
(`packages/styles/test/browser/data-table.test.ts`, the records section) run with the elements undefined. For each
container they assert three things: each visible item's box starts below the previous one, a `hidden` item is not
shown, and an `aria-hidden="true"` item is not shown (its box is empty and the next visible item starts directly below
the one before it). The spec's edge cases gain this case.

**Rationale.** Operator decision Q3 (a); 013's slotted-item pattern (R-01 of 013) measured that a shadow list with
manual assignment gives one clean list in Chromium. Rendering no `<ol>` when empty avoids an empty named list.

**Spike (phase 2).** The Chromium tree of a timeline of three events (`list` named, three `listitem`, each holding the
event's time and content as `StaticText`), with the FR-016 item-text oracle (R-11) and axe `list`, `listitem`,
`aria-allowed-role` and a full run.

## R-09 Naming the lists: a blank host `aria-label` counts as absent (FR-022)

**Decision.** `name = resolveName(host aria-label, label)`, set on the `<ol>`; with no name the `<ol>` has no
`aria-label`. `resolveName(hostAriaLabel, label)` is the function 009's `overflow-region.ts` already exports (line 91 on
the branch; `ocelle-workflow-lane.ts` imports it): the host's non-blank `aria-label`, trimmed, else the trimmed
non-blank `label`, else none. Both containers import it from `./overflow-region.ts` (PLAN-CORRECTNESS-1-011, operator
decision (a)); no `list-name.ts` is added. The README's overflow-region entry lists the timeline and the chain as users
of that export, and T001 rechecks its name and rule (R-14).

The host's own `aria-label` attribute is the consumer's and is not removed; whether Chromium exposes it on the host's
generic node, and whether axe reports `aria-prohibited-attr` for it, is measured in phase 2's spike against 009's lane, which renders its named role on a shadow wrapper the same way (branch). If the host
attribute is exposed as a second name, the element follows whatever 009's lane does on `main` (R-14) and no story sets
a host `aria-label` unless axe is clean on it (Complexity Tracking, if needed).

**Rationale.** FR-022 and the README's Host ARIA rule for elements whose role sits on a shadow node (009). The library
helper `accessibleName` in `naming.ts` implements the other rule ("decides alone"), so the containers do not use it.

## R-10 The timeline's look (FR-021, FR-023, FR-027)

**Decision (plan default; Q-C below may change it).** The event renders its own shadow root: `<span part="time">`
(only when the event has a time) above `<span part="content"><slot></slot></span>`, each `display: block`.

**"Has a time" (PLAN-CORRECTNESS-1-003).** `time` reflects to its attribute, as 013's `ocelle-fact` reflects `label`,
so the container's `MutationObserver` sees a property set from script. One predicate, `hasTime(time)`, decides the
time box, the `<li>`'s `has-time` class and the previous `<li>`'s `next-has-time` class: true when `time` is a string
whose trimmed value is not empty. It lives in the internal module `src/timeline-time.ts` (PLAN-FRESH-2-003), which
both `ocelle-timeline-event.ts` and `ocelle-event-timeline.ts` import. The file name is outside the manifest's glob
(`src/ocelle-*.ts`) and the module is not in the package's `exports` map, so `hasTime` is neither manifest surface nor
importable from a public entry point, which is how 009's `overflow-region.ts` stays internal. No element module
exports a function. Phase 2's red commit adds a manifest test statement: the module of `ocelle-timeline-event`
declares only the class `OcelleTimelineEvent`, and its exports name nothing else but the element's definition. So
`time=""` and a white-space `time` render no time box and set no `has-time`, and the item text is the content alone
(the data model's "empty or absent renders no time box"). A non-blank time is shown as given. Phase 2's red commit has
bodies for `time` set, changed and cleared by property after mount, `time=""` and `time=" "`, each measuring the
marker's centre against the first line box of the event (the time's line, or the content's when it has no time) and
asserting the reflected attribute. The time is
`--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, `--ocelle-figures`, line height
`--ocelle-line-height-normal`; the content is `--ocelle-font-size-sm`, regular weight, `--ocelle-color-ink`,
`--ocelle-line-height-normal`; time and content differ by size and weight (FR-023). The container's `<li>` is a
two-column grid: a marker column of `--ocelle-size-dot` plus `--ocelle-space-3` of gap, and the item. The marker sits
in a `1lh` wrapper whose line box is set to the time's type when the event has a time and to the content's type when
it has none (the container reads `hasTime` of the item's reflected `time` and sets `has-time` on the `<li>`), so it is
centred on the event's first line (the slot convention's `1lh` technique, which `style-lint` allows). The marker is a
round dot of `--ocelle-size-dot`: `box-sizing: border-box`, inline and block size `--ocelle-size-dot`, drawn as a
border, `border: calc(var(--ocelle-size-dot) / 2) solid var(--ocelle-color-ink-muted)`, so the mark is painted by a
foreground property and not a background (forced colours, below), and `border-radius: 50%` (Q-D, decided: a mark
shape, not a corner radius, constitution II). The connector is the `<li>`'s `<span class="connector"
aria-hidden="true">`, absolutely positioned in the marker column with no inline size and a `border-inline-start:
var(--ocelle-border-width) solid var(--ocelle-color-rule-strong)` (decorative). The last visible `<li>` renders no
connector span (hidden items render no `<li>`). Rows are separated by `--ocelle-space-3`. All positions are logical
(`inset-inline-start`, `inset-block-start`, `inset-block-end`), so `dir="rtl"` mirrors them.

**A gapped connector (PLAN-FRESH-2-004, operator decision (a)).** Each connector runs from its own dot to the next
one and never crosses either dot, so no lighter line is painted over a structural mark:

- **Start.** It starts `--ocelle-space-1` after its own dot's block end. That offset follows this `<li>`'s marker line
  (the time's line box with `has-time`, the content's without).
- **End.** It ends `--ocelle-space-1` before the next visible dot's block start. That offset follows the next
  `<li>`'s marker line, read from the `next-has-time` class. The container sets the class on each `<li>` whose next
  visible event has a time, by the same `hasTime`, and re-renders it from its `MutationObserver` like `has-time`. So a
  timeline that mixes events with and without a time still ends each connector the same distance before the next dot.
  With a centre-to-centre span, each end would be off by half the difference of the two line heights, about 1.45 px.
- **Figures.** The offsets are `calc()` over tokens: the two types' sizes and `--ocelle-line-height-normal`,
  `--ocelle-size-dot`, `--ocelle-space-1` and the row gap `--ocelle-space-3`. No new `style-lint` allowance is used.
  The phase 2 spike records the exact form `style-lint` accepts, and a form it rejects goes to the operator.

Phase 2's red commit has connector geometry bodies on a timeline of three timed events and on a mixed timeline
(timed, untimed, timed, untimed). For each connector they assert:

- its block start is at or after its dot's block end, and its block end is at or before the next dot's block start;
- both gaps, the dot's end to the connector's start and the connector's end to the next dot's start, equal
  `--ocelle-space-1` within 0.5 px;
- `elementFromPoint` at the centre of each dot returns that marker, not a connector.

Element plants: the connector started at its dot's centre again, and `next-has-time` never set. The first must fail
the geometry bodies, the second the mixed timeline's body.

`wrap="anywhere"` on an event sets `overflow-wrap: anywhere` on `part="content"` only.

Outside a timeline the event's own shadow content (time above content) shows as plain text, with no marker or role.

**Forced colours (PLAN-A11Y-SECURITY-1-001).** In forced colours the browser forces `background-color` to `Canvas`, so
a mark drawn as a background would be Canvas on Canvas. Every mark is therefore drawn with a border, and the
timeline's styles add, outside the variant block, `@media (forced-colors: active) { .marker, .connector {
border-color: CanvasText; } }`: the dot and the connector are drawn in `CanvasText`, and the time and content text are
forced to the system text colour. No `forced-color-adjust: none` is needed. US2-8's forced-colours half asserts, on
the real spans, that each marker's and connector's drawing border colour is a foreground system colour (`CanvasText`,
not the ground's `Canvas`) and that each box is not empty (the marker's border box is `--ocelle-size-dot` square; the
connector's border box has the border width and a block size above zero). Plant: the dot drawn as a
`background-color` with no border; US2-8 must fail.

**Contrast.** `ink-muted` on the nine main grounds is a text declaration in the token source (4.5:1 or more), above
the 3:1 FR-013 requires of the marker (branch values; the contrast gate reads them). R-13 has the two oracles that tie
what is painted to those declarations.

## R-11 The item-text oracle (FR-016)

**Decision.** A driver function `itemTexts(list)` reads the full Chromium accessibility tree through CDP
(`Accessibility.getFullAXTree`, ignored nodes left out), finds the `list` node of the container and, for each child
`listitem`, joins the `name` of its `StaticText` descendants in tree order with single spaces, collapses white space
and trims. It is added to both harnesses with its own test (a plain `<ol>` with two items, one holding nested inline
markup), and every body that asserts an item text also asserts it is not empty. The browser harness uses its existing
CDP session (013's `commands.ts` reads the AX tree for value properties).

## R-12 The chain's look and line ends (FR-031 to FR-036)

**Decision (plan default; Q-A below may change it).**

- The `<ol>` is `display: flex; flex-wrap: wrap; align-items: flex-start`, with `row-gap: var(--ocelle-space-3)` and
  no column gap: each `<li>` carries the gap after it as `padding-inline-end: var(--ocelle-space-5)`, inside which its
  connector (`<span class="connector" aria-hidden="true">`, absolutely positioned) is drawn as a
  `border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule-strong)` with no block size
  (decorative), from `--ocelle-space-1` after the step to `--ocelle-space-1` before the padding's end.
- **One centre line (PLAN-FRESH-1-005, operator decision (a)).** Every `<li>` reserves a `--ocelle-size-step` line
  box: `min-block-size: var(--ocelle-size-step)`. A default step's marker fills it. A chip `<li>` (class `chip`) sets
  `align-items: center`, so a one-line chip (20.4 px) is centred in that box, 1 px from each edge. Every connector is
  placed at `inset-block-start: calc(var(--ocelle-size-step) / 2 - var(--ocelle-border-width) / 2)` from its `<li>`'s
  block start, so all connectors on a row share the default marker's centre line, chips or not. A chip that wraps onto
  more lines is taller than the box and starts at its top; its connector stays on the same centre line. Phase 3's red
  commit has a mixed-chips geometry body: in a row of default and chip steps, each connector's centre equals the row's
  marker centre within 0.5 px, and each one-line chip's centre does too.
- **Line ends.** CSS cannot tell a line's last flex item. The container measures: after each render and from a
  `ResizeObserver` on the `<ol>` and on each `<li>`, it compares each visible `<li>`'s block-start offset with the
  next one's and sets `data-line-end` on each `<li>` whose next item starts a new line, and on the last; the rule
  `li[data-line-end] > .connector { display: none; }` hides that connector. The connector is absolutely positioned in
  padding that exists either way, so toggling it changes no size and the observer should not loop; the write happens
  in the observer callback. The result depends only on the current layout, so it is the same whatever the history. The
  phase 3 spike measures it at 1280, 600 and 320 px, after a step's text changes, a step added and hidden, a late web
  font and `dir="rtl"`, against a fresh load.
- **No observer loop, tested (PLAN-TESTABILITY-1-007).** "Should not loop" is proven by 013's in-process test, in
  `packages/elements/test/evidence-chain.test.ts`: around a run of changes (the host resized 1280 → 320 → 1280 px, a
  step added, then hidden), each read after the layout wait of checks.md, the test records every `window` `error` event
  (capture phase) and every `console.error` call and asserts none carries "ResizeObserver loop". Paired: the same test
  asserts that the line ends changed at each step (the set of `<li>` with `data-line-end` differs at 320 px from
  1280 px, and follows the added and hidden step), and that the recorder sees a synthetic `ErrorEvent` with that
  message dispatched by the test itself. Plant: the callback also writes a size-changing property (the `<li>`'s
  `padding-inline-end` toggled with `data-line-end`); the test must fail.
- **Default step.** The `<li>` is an inline flex row: marker, `--ocelle-space-2`, item. The marker is
  `--ocelle-size-step` square, `box-sizing: border-box`, no fill, a `--ocelle-ring-step` solid border in
  `--ocelle-color-ink-muted` (structural, 3:1 through its text declaration), `border-radius: 50%` (a round marker,
  FR-031; Q-D, decided), with the ordinal centred in `--ocelle-font-size-xs`, `--ocelle-font-weight-medium`,
  `--ocelle-color-ink-muted`, `--ocelle-figures`, line height `--ocelle-line-height-tight` (1.15). The ordinal is text
  inside the `aria-hidden` marker. The step content is `--ocelle-font-size-sm`, `--ocelle-color-ink`,
  `--ocelle-line-height-normal`, set on the slotted item through `::slotted(ocelle-evidence-step)`, and is
  vertically centred with the marker on its first line (the `1lh` wrapper again).
- **Ordinals.** Each default step's ordinal is its 1-based position among the visible steps, chip steps counted (spec
  check 3, SPEC-3-02: the numbers shown can skip, for example 1, 2, 4 with a chip third). The red commit's US3-6 body
  asserts exactly that, with a case where a chip step is hidden and shown again.
- **Two-digit fit (SPEC-3-03).** The marker's inner box is 22.4 − 2 × 1.5 = 19.4 px; "20" at 12 px tabular is about
  14 px wide and 13.8 px tall (12 px × 1.15). The check: for ordinal 20 in a twenty-step chain, the ordinal's
  rendered box lies inside the marker's inner (padding) box, with `scrollWidth <= clientWidth` on the marker.
- **Chip step (FR-035).** The container styles a chip through `::slotted(ocelle-evidence-step[variant="chip"])` and
  renders no marker in its `<li>`: `--ocelle-font-size-xs` (one step below the default's `sm`),
  `--ocelle-line-height-normal`, `padding-block: 0`, `padding-inline: var(--ocelle-space-2)`, a `--ocelle-ring-step`
  solid border in `--ocelle-color-ink-muted`, `border-radius: var(--ocelle-radius-2)`, `--ocelle-color-ink`. The chip's
  box (border width and style, radius, padding, type) is one rule outside the `@media not (forced-colors: active)`
  block, because the outline is structural (FR-013: the chip's only boundary); only its colours sit in the variant
  block. The sum:
  12 px × 1.45 = 17.4 px line + 2 × 1.5 px border = 20.4 px, below `--ocelle-size-step`'s 22.4 px (US3-4). No fill
  (Q-A). Nothing of `ocelle-pill-tag` is imported or read; a node test greps the chain's source and styles for
  `pill`.
- `variant` and `wrap` on the step reflect to attributes, so the container's `::slotted()` selectors and the
  `MutationObserver` see a property set from script.
- **Forced colours (PLAN-A11Y-SECURITY-1-001).** Every mark is a border (the ring, the connector, the chip outline),
  never a background, and the chain's styles add, outside the variant block, `@media (forced-colors: active) {
  .marker, .connector { border-color: CanvasText; } ::slotted(ocelle-evidence-step[variant="chip"]) { border-color:
  CanvasText; } }`. The ordinal and the step text are forced to the system text colour. US3-8's forced-colours half
  asserts, on the real elements, that each ring's, connector's and chip outline's drawing border colour is a
  foreground system colour (`CanvasText`, not `Canvas`) with a border width above zero, that the ordinal's colour is a
  system text colour, and that each box is not empty. Plants: the chip's box rule moved inside the variant block (the
  chip loses its outline in forced colours), and a connector drawn as a `background-color`; US3-8 must fail for each.

Outside a chain a step's own shadow root shows its content as plain text, with no marker, ordinal or chip box (the
chip box is the container's styling).

**Alternatives.** Connectors as `::before` or `::after` (the earlier plan; replaced because no driver reads a
pseudo-element, PLAN-TESTABILITY-1-001). A clip trick that hides the line-start connector with `overflow: clip` and
`overflow-clip-margin` (rejected: WebKit, Kitty Desktop's engine, has no `overflow-clip-margin`, so a focus ring at a
line's start would be clipped there). A dangling connector at each line's end (rejected: FR-034 draws connectors
between consecutive steps on one line only).

## R-13 Tokens

**Decision.** No new token. Every value above is an existing token on `main`, plus `--ocelle-tracking-caps` from 009
(branch). Every text colour (`ink`, `ink-soft`, `ink-muted`) and every structural mark (`ink-muted`) has a text
declaration on the nine main grounds; the decorative lines use `color-rule` and `color-rule-strong`, which have none
(FR-013). No contrast row is added. If Q-A to Q-C change a colour, the plan checks the new pair against the token
source before tasks are generated.

**Contrast oracles (PLAN-TESTABILITY-1-003, operator decision (c)).** Two checks, so a mark painted in the wrong token
cannot pass on the token source alone:

- **Source (node).** As 013's `progress-pairs.test.ts`: `packages/elements/test/node/records-pairs.test.ts` (with
  `records-pairs-check.ts`) for the five element templates, and `packages/styles/test/data-table-pairs.test.ts` for
  the data-table block of `base.css`. Each reads every colour the source paints (cell, header, row header, caption,
  time, content, marker, ring, ordinal, chip outline, chip text) and asserts each foreground and structural colour is
  tied to a `checked` row of `packages/tokens/contrast/pairs.json` on all nine main grounds in both themes, and each
  decorative line uses a rule token. A fixture with one row removed (`fixtures/pairs-missing-row.json`, as 013's) must
  make the check fail. This covers US1-11, US2-8 and US3-8.
- **Rendered (browser).** US1-11, US2-8 and US3-8 read each rendered colour (cell, header, time, content, marker,
  ring, ordinal, chip outline) in light and dark and assert it equals the probe-resolved value of the token the source
  names, then look that token up in the declarations. Element plants (checks.md): the timeline marker in
  `rule-strong`, the step ring in `rule`, the chip outline in `control-border`, the header text in `rule-strong`; the
  rendered body must fail for each.

## R-14 The recheck against `main` (the first task)

**Decision.** Before any phase starts, task T001 compares, on `main` as merged:

- 009's `overflow-region.ts`: its exports (`resolveName` among them, with R-09's rule), constructor options,
  `setLabel`, the class names, the `.region-track` rule (R-03 depends on it), the `.region-box` padding and mask rules
  and `--ocelle-scroller-fade-size` (R-07 depends on them), and the README's conventions entry;
- whether 009's module has the pinned-start option of R-17, and its name; if it has, the caption uses it and is
  sticky at `inset-inline-start: 0` (R-17), and if not, it is not sticky (Q-F, decided (b));
- `--ocelle-tracking-caps` and `--ocelle-measure-container` in the token source;
- 013's README § Element conventions (slotted items, container import, wrap, `undefined` defaults);
- both drivers as merged (PLAN-CORRECTNESS-1-006). On the branches, 009's (015's) driver has `press`, `tabWalk`,
  `activeElement`, `focus`, `scrollLeft`, `setScrollLeft`, `frameRecord`, `settle`, `computed(target: Target)` and
  `reducedMotion(on: boolean)`; 013's has `pressTab`, `focused`, `frames`, `layout`, `computed(id: string)`,
  `reducedMotion(mode)`, `viewport`, `scrollWidth`, `copy` and `text`. T001 records which names and signatures `main`
  kept, how `computed`, `reducedMotion` and the focus readers (`focused` against `activeElement`, `pressTab` against
  `press("Tab")` and `tabWalk`) were reconciled, and rewrites checks.md's helper names to match. The harness paths are
  013's: `packages/elements/test/in-process.ts`, `test/browser/driver.ts` and `test/scenarios/driver.ts`;
- 011's or 012's eyebrow tokens, if any is on `main` (FR-006);
- op 016's `gate:plants -- --affected <base>` and `--list`, and its `reviews/phase-<N>/plants.md` record;
- #10's gate commands and container.

Each difference is written to `reviews/recheck.md`, and the flow stops for the operator on any difference before phase
1's spike.

## R-15 Gate runs per phase (FR-051, FR-059)

**Decision.** Each phase runs the gates its diff touches, the plants by op 016's selection:
`pnpm run gate:plants -- --affected <phase base>` (with `--list` recorded first) and the result in
`reviews/phase-<N>/plants.md`, never a full `gate:plants` locally (CI's required Plants check judges the full set).
Baselines: `pnpm run visual:update` only in #10's pinned container under docker (start `dockerd` as root; after a
container restart, `pnpm run setup:online`); the command must report `<n> added, 0 changed, 0 removed` with `<n>`
twice the phase's new stories (24, 18 and 22 for phases 1 to 3, from checks.md § Stories), so no existing baseline
moves (013's baselines among them, SC-007). Conflicting PNGs are regenerated in the container, never hand-picked. Mutation follows #23 and op 015 on `main`.

## R-16 The kitty-mission-ui inventory (FR-058)

**Decision.** The README mapping rows need the inventory of kitty-mission-ui's `.sk-data-table` variants (modifiers
and states, with counts, role names only) and of any event-history or evidence-chain class family. kitty-mission-ui is
outside this session's GitHub scope, so, as in 013, the inventory is an operator input recorded here before each
phase's red commit (tasks T00x per phase); a gap goes to the operator, and the surface is not widened by review.

## R-17 A request to 009's owner: a pinned start box out of the start fade (PLAN-A11Y-SECURITY-1-002)

**Finding (branch, from the source).** 009's start fade is a mask on `.region-box`, the scrollport:
`linear-gradient(to right, transparent, ink var(--ocelle-scroller-fade-size))` while `data-fade` is `start` or `both`.
`.region-box` has block padding only, so a caption with `position: sticky; inset-inline-start: 0` pins to the masked
edge and its first `--ocelle-scroller-fade-size` of text fades out whenever the table is scrolled away from the start.

**Decision (operator decision (c), 2026-11-16).** Ask 009's owner for a module option that keeps a box pinned at the
start edge (here the sticky caption) out of the start fade's mask. This mission does not change 009's module (FR-008):
the request is recorded here, in the plan's dependencies and in T001's recheck, and goes to 009's owner through the
operator. What it asks for, not how: with the option set, the start fade covers the scrolling content only, and a
sticky box at the start edge is painted unmasked; the module's interface gains that option and its test, and nothing
changes for the existing users that do not set it. Once the option is on `main`, the data table sets it, and the
caption becomes sticky at `inset-inline-start: 0` with R-07's measured cap as written. That is a later MINOR as a
look change, or part of phase 1 if T001 finds the option on `main` (R-14). With inset 0 the caption still starts at
the table's start edge at rest, so PLAN-FRESH-2-002's misalignment cannot arise.

**Until then (Q-F, decided (b)).** The caption is not sticky (R-07): it scrolls with the table, is capped so it wraps
inside the box at rest, and has no inset at any scroll position. PLAN-FRESH-2-002, operator decision (c), 2026-11-16,
settles round 1's Q-F this way.

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
- **Q-D. The markers' shape (decided, PLAN-CORRECTNESS-1-004 operator decision (a), 2026-11-16).** Both the timeline
  dot and the step marker use `border-radius: 50%` with no token, recorded under constitution II as a mark shape and
  not a corner radius. This meets FR-031 ("a round marker") and FR-040 ("No new radius token is added"); `token-only.ts`
  allows `%`. The earlier options are withdrawn: `radius-1` (a rounded square, against FR-031) and a new
  `--ocelle-radius-round` token (against FR-040, `brand-rules.ts`'s closed radius set and constitution II).
- **Q-E. Marked-up times (FR-023, #470; PLAN-FRESH-1-006 operator decision (b)).** Does #470's history need
  machine-readable or marked-up times: a `<time datetime>`, a title, its own `lang` or `dir`, or an htmx target on the
  time? The plan keeps `time` attribute-only, as FR-023 approves, and the README states the limit: the time is plain
  text rendered in the event's shadow root, so it carries none of these, and a consumer that needs them puts them in
  the content. If the answer is yes, a named `time` slot is a spec change to FR-023 before tasks.
- **Q-F. The caption until 009's option exists (decided, (b): PLAN-FRESH-2-002 operator decision (c), 2026-11-16;
  R-17; PLAN-A11Y-SECURITY-1-002).** Not sticky until 009's option lands. The caption scrolls with the table, is
  capped by R-07's measured rule so it wraps inside the box at rest, and is reached by scrolling back. It has no inset
  at any scroll position, so it starts at the table's start edge. It becomes sticky (inset 0) when the option lands, a
  later MINOR as a look change. The other options are withdrawn. (a) was sticky with a fade-depth inset, and that
  inset applied at rest and to a fitting table too: the caption sat 28 px off the first column in every state, not
  only "while the table is scrolled" as round 1 described it (PLAN-FRESH-2-002). (c) waited for the option before
  phase 1's green.

And one decision from the research itself:

- **Decision 1 (R-03). The track's inline size.** (a) The data table's host rule `:host .region-track { inline-size:
  fit-content }` (recommended). (b) A track-sizing option in 009's module (a change to 009's interface, outside this
  mission). (c) Keep the module's max-content: cells never wrap inside the element, and US1-9 changes.
