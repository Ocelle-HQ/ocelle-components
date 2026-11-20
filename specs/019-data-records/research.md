# Research: Data Records (Data Table, Event Timeline, Evidence Chain)

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-15

This mission is planned before its dependencies are on `main`. Mission 009's overflow-region module and its token
`--ocelle-tracking-caps` are read from `origin/claude/015-workflow-layouts`, mission 013's conventions and elements
from `origin/claude/013-data-display`, and op 016's `--affected` mode from `origin/claude/041-plants-affected`. Every
reading below that depends on one of them is marked **(branch)** and is rechecked against `main` by the first task
(R-14). No measurement has run in this session: the spikes named below run in their phase, before its scaffold, and a
failing result goes to the operator before the red commit.

**After the recheck (2026-11-17).** `main` (b594b7e) is merged into this branch (8ee3351), and T001 rechecked every
**(branch)** reading against it (`reviews/recheck.md`). The operator's decisions on its five questions
(`reviews/recheck-decisions.md`) are applied below and listed in `reviews/recheck-fixes.md`: Q1 (a), the column
headers use 011's four eyebrow tokens (R-06, R-13; `--ocelle-tracking-caps` is not on `main`); Q2 (c), the end fade is
written as a measured px figure (R-07); Q3 (a), phase folds from bases at 8ee3351 or later (plan § Phases); Q4 (a),
the `base.css` and `source.test.ts` line citations of R-06 and R-07 are those at 8ee3351; Q5 (b), the pre-upgrade
list rules sit in `base.css`'s base layer beside 013's facts rule (R-06, R-08).

**After the library inventory (2026-11-18).** The operator's decisions on `reviews/phase-1/inventory-questions.md`
(`reviews/phase-1/inventory-decisions.md`) are applied below and listed in `reviews/phase-1/inventory-fixes.md`:
IQ-1 (a), the spec-kitty design library's own variant set, re-read at its newest line `develop` (a6518cd), is the
inventory (R-16); IQ-2, the sticky header row, with an opt-in block-axis option in 009's module (R-18); IQ-3, the
numeric-cell hook (R-19); IQ-4 and IQ-5, striped rows and row hover (R-20); IQ-6 (a) and IQ-7 (a), README statements
(R-16). R-06, R-07, R-13 and R-15 take the additions.

**After the inventory follow-up questions (2026-11-18).** The operator's answers to Q-I1 to Q-I5
(`reviews/phase-1/inventory-fixes.md`, answered at the end of `reviews/phase-1/inventory-decisions.md`): Q-I1, Q-I2
and Q-I3 confirm the defaults (the `sheet` header ground, the light-theme hover collision accepted, the hover always
on; R-13, R-18, R-20); Q-I4 adds a block-end fade to the module's block-axis option (R-18); Q-I5 adds a one-line
pointer to this mission's amendment in 009's contract file (R-18).

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

**Result (T003, 2026-11-17, `reviews/phase-1/spike.md` § 1).** The shadow wrappers add only `generic` nodes while the
table fits and the `group` while it overflows; the table's nodes (`table` named by its caption, `rowheader`, `cell`
under its column header, `headers`/`id` association) are the same inside and outside, and axe `td-headers-attr`,
`th-has-data-cells`, `table-fake-caption` and a full run pass inside (`scrollable-region-focusable` passes while the
box overflows). One difference: Chromium names each column header and its static text by its drawn text, upper case
from block 1's `text-transform` ("ID", not "Id"), as the elements README already records for 011's eyebrow heading.
The tree is equal when the outside table's column headers are given the same `text-transform` by a test-only rule.

**Decision on the difference (spike Q2 (a), operator, 2026-11-18).** The column headers stay upper case (FR-006).
US1-1's oracle compares the element's subtree with the same table outside whose column headers get `text-transform:
uppercase` from a test-only rule (in the fixture harness a constructed sheet adopted by the document, so the strict
CSP holds), and adds one assertion that the column headers are named in upper case ("ID", "TITLE", "LANE", "OWNER",
"LINK" for the US1-1 table). Both READMEs state that the accessible names of column headers follow the drawn
upper-case text (T011, T013).

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

**Result (T003, 2026-11-17, `reviews/phase-1/spike.md` § 6).** In an open `<dialog>`, a `display: inline-block`
wrapper and a start-aligned column flex the host is the table plus 10 px of ring room (never 0 px), with one
`.box-size` callback, one box-size write, a stable width after two more `settle` and no loop error. The one-long-word
body widens the table to the caption's longest word with no `tabindex` and no `data-fade`. Its precondition (a
fractional part between 0.1 and 0.4 px) depends on the font, so the test-only `letter-spacing` on the caption is per
harness: **0.07 px in process** (fallback font, `@font-face` removed; box 91.297 px) and **0.02 px on the fixture**
with Schibsted Grotesk (box 89.203 px). Without `letter-spacing` the fraction is 0.609 in the fallback font, outside
the range. A `clientWidth` write raises the loop error at in-range fractions and not at 0.609 or 0.906, so the
precondition is what makes the plant bite.

**Rationale.** Operator decision Q2 (b); FR-008. The module already gives the conditional tab stop, the named group,
arrow keys, fades, focus clearance and focus handover, and its triggers (box and track resize, `slotchange` on the
box, `scroll`) cover a swapped table and a swapped `<tbody>` (R-05).

**Alternatives.** 003's prose scroll box (Q2 (c), rejected by the operator: a permanent or absent tab stop, no fade).
Wrapping and never scrolling (Q2 (a), rejected: columns become unreadable at 320 px).

## R-03 The track's inline size for a table (decided at the plan gate: decision 1 (a))

**Finding (branch, from the source).** `overflowRegionStyles` sets `.region-track { inline-size: max-content;
min-inline-size: 100%; }`. A table inside a max-content track is laid out at its max-content width: no cell ever wraps,
so a table with one long text cell overflows at any width below its unwrapped width, and US1-9 ("the identifier
breaks inside its cell before the table overflows") cannot hold. The scroller and the board want max-content (a row of
cards or lanes never wraps); a table wants its cells to wrap first and to scroll only when its min-content width does
not fit.

**Decision (decision 1 (a), operator, plan gate 2026-11-16).** The data table's own stylesheet sets
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

**Result (T003, 2026-11-17, `reviews/phase-1/spike.md` § 3).** As expected: cells wrap first, and the table overflows
only when its min-content width does not fit. A hyphenated identifier (`mission-019-data-records-x`) breaks at its
hyphens, so the US1 table with it fits at 320 px (310 px). The US1 table with an unbroken 26-character identifier
(`01JD8X2K7Q9M4N6P3R5T0V2W8Y`) overflows at 320 px (scroll width 504, `group` "Work packages", `data-fade="end"`, page
scroll width 320). A two-column table with a 26-letter identifier fits at 320 px with or without `wrap="anywhere"`; a
36-character unbroken identifier overflows (366 / 320) without it and fits with `wrap="anywhere"` set later, as on a
fresh load. So the US1 table's identifier in the red bodies has no break opportunity (a ULID-like string, not a
slug), or US1-4 cannot overflow.

**Alternatives (the options at the plan gate; the operator chose (a)).** (a) The host override above (recommended: one
property, no module change). (b) A `track` sizing option added to 009's module (rejected for this mission: it changes 009's interface,
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
the operator if the module cannot see it. T003 records the result here: either the unobserved changes, each with the
README's remedy and a README test statement (T013), or "none", in which case no README line is needed (FR-014;
analysis G5).

**Rationale.** With R-03's `fit-content` the track's inline size follows the table's content, unlike the board's
contained lanes, so no unobserved case is expected.

**Result (T003, 2026-11-17, `reviews/phase-1/spike.md` § 4).** None. A `<tbody>` swap, a whole-`<table>` swap
(`innerHTML` and `replaceChild`), a cell's text edit, a late web font, a `hidden` table shown again and `wrap="anywhere"`
set later each left the same overflow state as a fresh load. No README line is needed and T013 adds no conditional
statement.

**Correction (phase 1 review round 1, R1-01, 2026-11-20).** The result above is incomplete. A caption that grows
after the first measure, in a shrink-to-fit host (an open `<dialog>`, an inline-block, a start-aligned column flex),
did not give a fresh load's state: there the box is as wide as the table, so once `--data-table-box-size` was written
the cap held the caption to the table's old width. A caption word edited longer then overflowed the region and was
clipped, with a tab stop and `data-fade="end"` a fresh load does not have; the caption's letter-spacing raised after
mount (as a late web font widens it) overflowed it with no tab stop at all, so the clipped text could not be reached
by keyboard. T003's spike did not grow a caption, and the red body of the one-long-word case was written around it
instead of stopping. The operator decided to fix it (`reviews/phase-1/operator-round-1-decisions.md`, (a)):

`@ocelle/styles`' caption rule (block 1) sets `min-inline-size: min-content`, so the caption is never narrower than
its longest word, whatever the cap: a word that grows widens the table, the box with it in a shrink-to-fit host, and
the element's `.box-size` observer then writes the wider cap, as on a fresh load; nothing the caption holds
overflows it. That is the whole fix. A table caption adds only its min-content (its longest word) to the table's width,
never its max-content, so a caption whose words stay narrower than the cap wraps the same way grown or fresh. The fix
round measured that: "Deployment approvals pending" edited to "Deployment approvals pending for review" gives a host of
90.6 px grown and fresh, in all three hosts. A second observer that remeasured at the fallback cap after every track
change was tried and removed, because no case needs it: every one of its mutants survived. The module's triggers above
are unchanged, and the element gains no observer.

The shared body "R-02 a caption that grows at run time (review R1-01)" grows a caption by a text edit and by
letter-spacing raised after mount, in the three hosts, and compares each with a fresh host of the same caption (the
same width within 1 px, no region overflow, the caption's text inside the caption and the box, the same tab stop and
fade, no `ResizeObserver` loop error). The README's sizing and fresh-load statements say so, each with a test
statement (T013).

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
| caption | `font-size: var(--ocelle-font-size-sm)`; `font-weight: var(--ocelle-font-weight-medium)`; `line-height: var(--ocelle-line-height-normal)`; `color: var(--ocelle-color-ink)`; `text-align: start`; `padding-block-end: var(--ocelle-space-2)`; `position: static` (not sticky until 009's option of R-17 lands; Q-F (b)); `min-inline-size: min-content` (its longest word widens the table whatever the cap, R-05's correction); the measured `max-inline-size` cap of R-07 and no inline size containment (it scrolls with the table and wraps inside the box's unmasked width at rest; PLAN-FRESH-3-002 (b)) |
| body cell (`td`, and `th` per FR-006's row rule) | `padding: var(--ocelle-space-1) var(--ocelle-space-2)` (4 px / 8 px, below 003's 8 px / 12 px); `font-size: var(--ocelle-font-size-sm)`; `line-height: var(--ocelle-line-height-compact)`; `color: var(--ocelle-color-ink-soft)`; `text-align: start`; `vertical-align: top`; `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)` (decorative, FR-013) |
| column header (FR-006's selection) | 011's eyebrow tokens (recheck Q1 (a)): `font-size: var(--ocelle-font-size-eyebrow)`; `font-weight: var(--ocelle-font-weight-eyebrow)`; `text-transform: uppercase`; `letter-spacing: var(--ocelle-tracking-eyebrow)`; `color: var(--ocelle-color-eyebrow)`; `border-block-end-color: var(--ocelle-color-rule-strong)` (decorative); same padding as body cells |
| row header (FR-006's selection) | `font-size: var(--ocelle-font-size-sm)`; `font-weight: var(--ocelle-font-weight-medium)`; `color: var(--ocelle-color-ink)`; no upper case, no tracking |
| last body row | `border-block-end: 0` on its cells, selected as `ocelle-data-table > table > :is(tbody, tfoot):last-child > tr:last-child > :is(td, th)`: the last row of the table's last row group only, so consecutive rows across two `<tbody>` groups, or a `<tbody>` and a `<tfoot>`, keep the rule between them (PLAN-CORRECTNESS-1-009). HTML puts a `<tfoot>` after the body row groups; a `<tfoot>` written before a `<tbody>` is still rendered last, but the selector follows source order, so its last row keeps its rule and the last `<tbody>` row has none. The README states this |
| `ocelle-data-table[wrap="anywhere"]` body cells | `overflow-wrap: anywhere` (never on header cells) |
| forced colours | cells `CanvasText`, rules `CanvasText` (decorative lines stay visible, FR-013); no `forced-color-adjust: none` (003's `source.test.ts` rejects it in `base.css`) |

FR-006's selection, in source order so the later rule wins where two match: column header = `thead th`,
`th[scope="col"]`, `th[scope="colgroup"]`; row header = `th[scope="row"]`, `th[scope="rowgroup"]`,
`:is(tbody, tfoot) th:not([scope])` (a corner cell with `scope="row"` in `<thead>` is a row header). The column
header's size, weight, tracking and colour are 011's four eyebrow tokens, as `ocelle-page-header` and
`ocelle-section-header` use them (`packages/tokens/src/source.ts` 48 to 55 and 151 to 153 at 8ee3351:
`--ocelle-color-eyebrow` is `ink-muted` with its own text declaration on the main grounds, `--ocelle-font-size-eyebrow`
is `font-size-xs`, `--ocelle-font-weight-eyebrow` is `font-weight-strong`, 600, and `--ocelle-tracking-eyebrow` is
0.08em). This is the recheck's Q1 (a) (2026-11-17), which supersedes the plan gate's Q-B (a), medium in `ink-muted`:
the weight is now 600, the colour token `color-eyebrow` (the same ink), and `--ocelle-tracking-caps`, which 009 did not
land, is replaced by `--ocelle-tracking-eyebrow`. The block names the eyebrow tokens, not the tokens they alias, so a
later change to 011's eyebrow reaches the table's headers.

A second block, the prose override (FR-012), restates every property 003's prose rules set on the same targets,
with the data table's value, under `[data-ocelle-prose=""] :where(…the same targets…)` at (0,1,0), placed after
003's prose rules in `base.css`. 003's prose rules set today (`base.css` lines 139 to 235 at 8ee3351): on the table
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
`:where(table:focus-visible)` at `base.css` lines 210 to 213 at 8ee3351), and fails on any property of those rules that the
override does not restate on the matching target. A property that cannot apply inside the element is recorded in the
test's own not-applicable list with its reason, and the list is asserted exactly: `outline` and `outline-offset` of
`:where(table:focus-visible)` (the region's box is the tab stop; a consumer who makes the table focusable keeps 003's
inset ring, and US1-10 compares the rest). So a later 003 rule on `tr`, a row group, `col` or a pseudo-class is read,
and fails the test until the override or the list takes it. US1-10's body compares every property in the list on every
target with the same table outside prose (SPEC-3-01).

**003's existing test (PLAN-CORRECTNESS-1-005).** `packages/styles/test/source.test.ts` (lines 195 to 212 at
8ee3351) pins the rule order in four slices: the base layer (`baseLayer`, lines 31 to 53, asserted at 196 to 198, with
013's facts rule at line 50 between the code rule and the focus rule), the compact scale, the prose slice at its exact
position (204 to 207), and `rules(root).slice(start)` equal to `[wrap]` (209 to 212), so any rule added after the wrap
rule fails it. Each phase's red commit changes that test for the rules its own green adds, so every green passes it
(PLAN-CORRECTNESS-1-005, PLAN-FRESH-1-004; recheck Q5 (b)):

- Phase 1's red: the rule table gains block 1 (the data-table rules, with the sticky-header, stripe, hover and
  forced-colours band rules of R-18 and R-20), block 2 (the prose override, with the sticky-header table's
  `border-collapse`) and block 4 (the numeric-cell hook of R-19), transcribed with their declarations, after the wrap
  rule, and the last-rule assertion becomes "the wrap rule, then block 1, then block 2, then block 4, in that order".
  That is its final form: no later phase adds a rule after block 4.
- Phase 2's red: `baseLayer` gains the timeline's two pre-upgrade rules (R-08, block 3's first two: the visible-item
  rule and the `aria-hidden` rule), transcribed with their declarations, right after 013's facts rule and before the
  focus rule, so the base-layer assertion reads "…the code rule, the facts rule, the timeline's two rules, the focus
  rule, the forced-colours focus rule". The later slices start from `baseLayer.length`, so they move with it.
- Phase 3's red: `baseLayer` gains the chain's two pre-upgrade rules right after the timeline's, before the focus
  rule.

Each red commit's message names this change and its reason (Principle VIII: an existing test changed for a planned
addition, not to pass). The new
styles tests follow the package's own layout: browser bodies in `packages/styles/test/browser/data-table.test.ts`, the
override's node test in `packages/styles/test/prose-override.test.ts` (the package has no `test/node/`).

**Additions for the inventory decisions (2026-11-18).** Block 1 gains the rows of `contracts/styles-data-table.md`
for `sticky-header` (R-18), `striped` and the row hover (R-20) and the forced-colours row band (R-20); block 2 gains
the sticky-header table's `border-collapse: separate` (003's prose table rule sets `collapse`, so the override node
test reads it on that target); block 4, after block 2, is the numeric-cell hook (R-19). 003's prose rules set no
`background-color`, `position` or `border-spacing` on a table part, so nothing else needs restating.

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
bound too (`base.css` lines 199 to 221 at 8ee3351: `max-inline-size: var(--ocelle-measure-container)`, `100cqi`,
against the prose table's query container). The data table bounds its caption without a query container:

- **No query container.** No box of the data table sets `container-type`. Inline size containment on `.region-box`
  collapses the element to 0 px in every shrink-to-fit host (R-02, PLAN-FRESH-2-001).
- **A measured width.** The element observes a measuring element with its own `ResizeObserver`
  (PLAN-FRESH-3-001, operator decision (a)). The measuring element is an empty `<div class="box-size"
  aria-hidden="true">` in the data table's shadow root, a sibling after `.region-frame` and outside 009's structure,
  styled `:host .box-size { block-size: 0; }`. Its inline size is the host's content width, which equals
  `.region-box`'s in every host. Its block size never depends on the caption or the table; its inline size does not
  in a bounded host, and in a shrink-to-fit host it follows the table's width ("No feedback" below). It adds
  one internal node and changes nothing of 009's module (FR-008). The observer does not watch `.region-box`: the cap
  it writes rewraps the caption, which changes the box's block size, and a write that changes the observed box raises
  the "ResizeObserver loop" error on `window`. The squad measured that in headless Chrome on a plain block host on
  first load, whenever the caption's line count differs between the fallback cap and the measured one; the same page
  observing a `block-size: 0` sibling gave one callback, no error and the same cap. 009's observer belongs to the
  module and is not reached into. This observer sizes the caption only, so R-05's overflow triggers are unchanged. On
  each callback the observer writes the measuring element's unrounded inline size (the entry's
  `contentBoxSize[0].inlineSize`, in px, not transformed), which is `.region-box`'s exact width: 009's box has no
  inline padding or border and, with no bounded block size, no vertical scrollbar. (With `sticky-header` the box
  has a block-axis scrollbar while it overflows in the block axis, whose room, `offsetWidth − clientWidth` (0 with
  hidden scrollbars, no gutter reserved), the write subtracts and rewrites when it comes or goes, R-18, spike-2
  Q-3 (c) and Q-A1 (a).) It never writes `clientWidth`,
  which rounds to a whole pixel (PLAN-FRESH-3-002 verify 1, "No feedback" below). The value is written as the
  inherited custom property `--data-table-box-size` on `.region-track`. It writes it into the element's own per-instance constructed
  stylesheet, adopted after `overflowRegionStyles` and after the module's own per-instance sheet (`replaceSync` once,
  then `setProperty`, as 009's module does for its mask figures). There is no `style` attribute, so strict CSP holds.
  The sheet holds only px figures the element measured from layout, as the README's Styles convention requires; that
  convention, which on `main` allows "at most one" per-instance sheet, is amended in phase 1 for the count only (recheck
  Q2 (c); "The README's Styles convention" below). The slotted table and its caption inherit the
  property through the flat tree. The property has no `--ocelle-` prefix and is not a token, and `token-only` checks
  `--ocelle-*` names only, so it needs no new allowance. It is not manifest surface (the element writes it and never
  reads it), but `@ocelle/styles` reads it, so it is a documented base-style hook between the two packages, public
  surface under constitution VII, named in both READMEs and CHANGELOGs (analysis I7 (a), 2026-11-16): a rename in one
  package would otherwise break the caption cap in the other with no semver signal.
- **The end fade, only while it shows, written one frame later (PLAN-FRESH-3-002, operator decision (b); verify 1).**
  The cap subtracts the end fade only while `.region-box` has `data-fade="end"` or `data-fade="both"`. The element
  writes the inherited property `--data-table-end-fade` on `.region-track` in the same per-instance sheet: while the
  end fade shows, the measured px inline size of the module's `.region-edge.end` (its unrounded
  `getBoundingClientRect().width`, the fade depth from layout, as 009's module itself reads the fade depth from a
  `.region-edge` for focus clearance), and the property removed otherwise (recheck Q2 (c), 2026-11-17). A token's
  text such as `var(--ocelle-scroller-fade-size)` is never written: the per-instance sheet holds measured px figures
  only. The edge is laid out in every state (`.region-edge { inline-size: var(--ocelle-scroller-fade-size);
  block-size: 0 }`, `overflow-region.ts` 160 to 164 at 8ee3351), so its width is the fade depth whether or not the
  fade shows. No shadow rule on
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
  The frame callback reads `.region-box`'s current `data-fade` and, with the end fade showing, `.region-edge.end`'s
  width, and writes it in px or removes the property. The read comes before the write, so it costs at most one layout
  flush ahead of the frame's own; the edge's size never depends on the caption or the table, so the read adds no
  feedback path. Animation frame
  callbacks run before the frame's layout and its `ResizeObserver` gathering, so the rewrap reaches 009's observer as
  a fresh notification in that frame, not as a change inside a delivery. The cap changes only how the caption wraps:
  a table that overflows by its grid still overflows, a fitting table's caption contribution stays within the box less
  the ring room, and a caption word that overflows a bounded box still overflows it, so 009 leaves `data-fade` as it
  is and there is no second write. A scroll that moves the fade between `both` and `start` takes the same deferred
  write, outside any delivery. The cost is one frame: for the frame in which the end fade first shows the caption may
  run under it, and for the frame in which it goes the caption is up to the fade's depth narrower than its cap. After
  `settle` (two animation frames) both are gone. The property has no `--ocelle-` prefix and is part of the same
  base-style hook as `--data-table-box-size` (analysis I7 (a)).
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
  - *The observed node.* `.box-size`'s block size is 0 and never depends on the caption or the table, so a rewrap
    never changes it (PLAN-FRESH-3-001). Its inline size does not depend on the caption or the table in a bounded
    host, so there the box size write never changes the node the element's observer watches. In a shrink-to-fit
    host its inline size follows the table's width, which the caption's longest word can set, and the write leaves
    it unchanged only because the width written is exact (the next bullet). A rewrap does change `.region-box`'s
    block size, but `.region-box` is deeper than `.box-size`, so 009's observer receives it in the same frame.
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
  **Result (T003, 2026-11-17, `reviews/phase-1/spike.md` §§ 5, 6):** the caption computes `position: static`, and
  `--data-table-box-size` written on `.region-track` reaches it (its computed value is the written px figure); at
  320 px at rest its cap is 278 px (320 − 10 − 32) and every line is inside the unmasked extent; no loop error in any
  listed case, and each of R-07's three loop plants raises one. The end-fade body's caption depends on the font: in
  the in-process harness's fallback font "Deploy approvals Deploy approvals Deploy approvals D" is one line (369.6 px)
  at the fitting cap of 390 px and two lines inside the unmasked extent (≤ 368 px) once the table overflows, with
  `--data-table-end-fade` `32px`, equal to `.region-edge.end`'s width. The body asserts its precondition (one line at
  the fitting cap) first, and the fixture harness, which loads Schibsted Grotesk, may need its own caption text.
- **The README's Styles convention (recheck Q2 (c)).** `packages/elements/README.md` § Element conventions, Styles
  (lines 1284 to 1289 at 8ee3351), allows "at most one per-instance constructed stylesheet that holds only px figures
  the element measured from layout" and names the overflow-region module's mask size and `ocelle-list-detail`'s
  intrinsic sizes as its two uses; `packages/elements/test/node/readme.test.ts` (lines 55 to 58) pins those two
  sentences word for word. The data table adopts the module's sheet and one of its own, so phase 1 amends the count
  and the list of uses, and nothing else (the px-only rule, the no-token-text rule and `CSSStyleRule.style` stay).
  The two sentences become:
  - "An element's styles are its shared `static styles`, one or more `css` tagged templates built only from
    `--ocelle-*` tokens and the values the `style-lint` gate allows, which every instance adopts, plus at most one
    per-instance constructed stylesheet of its own that holds only px figures the element measured from layout, and,
    in an element that uses the overflow-region module, the module's per-instance sheet beside it";
  - "A per-instance sheet never holds a value from an attribute, a property, a token's text or slotted text, and it is
    written through `CSSStyleRule.style`, never through an element's `style`: the overflow-region module's mask size,
    `ocelle-list-detail`'s intrinsic sizes and `ocelle-data-table`'s caption cap (its box size and end fade depth) are
    its uses".

  Phase 1's red changes the two pinned strings of `readme.test.ts` to these (an existing test changed for a planned
  addition, named in the red commit's message with its reason, as for `source.test.ts`), and phase 1's green writes
  them into the README. The end-fade body asserts the written value is a px figure equal to the edge's measured width
  (a computed `--data-table-end-fade` of `2rem`, the token's text substituted, fails it).
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
  (`scrollLeft` 0), that the caption has two line boxes, that each lies inside the box's unmasked extent, and that
  the computed `--data-table-end-fade` on `.region-track` is a px length equal to `.region-edge.end`'s width within
  0.01 px (recheck Q2 (c)). The edit
  is then undone, and after `settle` the box has no `data-fade`, the caption has one line box again and the computed
  `--data-table-end-fade` on `.region-track` is empty.
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
who prints sets a print rule of its own. No print rule is added (spec edge case). **Result (T003, spike § 8):** the
region keeps `overflow-x: auto` and the end fade's mask in print, so the columns past the box are clipped and the
content at the box's end fades; the README states that printed content past the box is clipped and that a consumer
who prints sets a print rule of its own. Before upgrade the base rules style
the table, there is no region and no shadow root, so other children show and a wide table can widen the page; the
README says so (FR-012).

## R-08 The timeline and the chain: shadow lists with manual assignment

**Decision.** Both containers attach a manual-assignment shadow root and render `<ol role="list" part="list">` with
one `<li role="listitem">` per visible item, in source order; each `<li>` holds the decorative marker
(`<span class="marker" aria-hidden="true">`), the decorative connector (`<span class="connector"
aria-hidden="true">`, a real element, PLAN-TESTABILITY-1-001 operator decision (b)) and a `<slot>` to which the
container assigns its item. A visible item is a direct child with the item tag and neither `hidden` nor
`aria-hidden="true"` (013's facts rule). One `MutationObserver` per container re-renders on a change of its children
and of an item's `hidden`, `aria-hidden`, `variant` (chain) or `time` (timeline); in the chain a change inside an
item's content needs no re-render. The timeline's observer also watches its events' subtrees (`subtree: true`,
`characterData`, and the `slot` attribute besides the ones above), because an event's slotted time decides its
`has-time` and its previous `<li>`'s `next-has-time` (R-10, plan gate Q-E); a record from inside content re-renders
to the same classes. The item properties the containers read (`time`, `variant`) reflect to attributes, so a property
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
ocelle-fact:not([hidden]))` rule does for facts. They sit where that rule sits, in `base.css`'s base layer (recheck
Q5 (b), 2026-11-17): the timeline's two right after the facts rule (`base.css` lines 46 to 52 at 8ee3351), then the
chain's two, all before the focus rule. The base layer's header comment (line 8, "…code elements, ocelle-facts before
upgrade, the focus ring…") names them beside the facts, and `packages/styles/README.md` documents them beside
§ Facts before upgrade (lines 107 to 113 at 8ee3351). Block 3 is this group of four rules; it is the third block this
mission adds, not the third after the wrap rule:

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
UA's own rule. An event's attribute time is rendered only in shadow, so it does not show before upgrade; a slotted
time (plan gate Q-E) is the consumer's light-DOM node and shows inline where it is written, an `aria-hidden="true"`
one included (shown, not exposed), and no rule is added for it. The README's "Before upgrade" line per container says
so. The styles browser bodies
(`packages/styles/test/browser/data-table.test.ts`, the records section) run with the elements undefined. For each
container they assert three things: each visible item's box starts below the previous one, a `hidden` item is not
shown, and an `aria-hidden="true"` item is not shown (its box is empty and the next visible item starts directly below
the one before it). The spec's edge cases gain this case.

**Rationale.** Operator decision Q3 (a); 013's slotted-item pattern (R-01 of 013) measured that a shadow list with
manual assignment gives one clean list in Chromium. Rendering no `<ol>` when empty avoids an empty named list.

**Spike (phase 2).** The Chromium tree of a timeline of three events (`list` named, three `listitem`, each holding the
event's time and content as `StaticText`), with the FR-016 item-text oracle (R-11) and axe `list`, `listitem`,
`aria-allowed-role` and a full run. Also, for the `time` slot (plan gate Q-E): a slotted `<time datetime>` written
after the content gives its `StaticText` before the content's; an unrendered `time` slot leaves an empty or hidden
`slot="time"` child out of the tree and out of layout; and `slot[name="time"]::slotted(*)` sets the type on a `<b>`
over its UA bold.

## R-09 Naming the lists: a blank host `aria-label` counts as absent (FR-022)

**Decision.** `name = resolveName(host aria-label, label)`, set on the `<ol>`; with no name the `<ol>` has no
`aria-label`. `resolveName(hostAriaLabel, label)` is the function 009's `overflow-region.ts` already exports (line 91 on
the branch; `ocelle-workflow-lane.ts` imports it): the host's non-blank `aria-label`, trimmed, else the trimmed
non-blank `label`, else none. Both containers import it from `./overflow-region.ts` (PLAN-CORRECTNESS-1-011, operator
decision (a)); no `list-name.ts` is added. The README's overflow-region entry lists the timeline and the chain as users
of that export, and T001 rechecks its name and rule (R-14).

The host's own `aria-label` attribute is the consumer's and is not removed; whether Chromium exposes it on the host's
generic node, and whether axe reports `aria-prohibited-attr` for it, is measured in phase 2's spike against 009's lane, which renders its named role on a shadow wrapper the same way (branch). If the host
attribute is exposed as a second name, the element follows whatever 009's lane does on `main` (R-14). No story sets a
host `aria-label` on the timeline or the chain: those states are plan.md § Complexity Tracking's one Principle V
exception (analysis C1 (c), 2026-11-16), proven by the browser bodies (US2-10, US3-10). The spikes (T026, T052) run
axe on the state; a clean result meets the row's sunset and goes to the operator. For the data table it was met in
phase 1: axe-core 4.14.0 with the `axe` gate's selection is clean on an overflowing or fitting data table named by a
non-blank host `aria-label`, on a blank one and on 009's `ocelle-scroller` (`reviews/phase-1/spike.md` § 2; Chromium
shows the host as a `generic` node of the same name beside the `group`, which axe does not report). The operator chose
two stories for it, non-blank and blank (spike Q1 (b), 2026-11-18), and T006's FR-010 body stays.

**Rationale.** FR-022 and the README's Host ARIA rule for elements whose role sits on a shadow node (009). The library
helper `accessibleName` in `naming.ts` implements the other rule ("decides alone"), so the containers do not use it.

## R-10 The timeline's look (FR-021, FR-023, FR-027)

**Decision (Q-C decided (a) and Q-E decided "Yes: named time slot" at the plan gate, 2026-11-16).** The event
renders its own shadow root, with the platform's named slot assignment: `<span part="time">` (only when the event has
a time) above `<span part="content"><slot></slot></span>`, each `display: block`. Inside `part="time"` it renders
`<slot name="time">` when the event has a slotted time, and the `time` attribute's text otherwise, never both.

**"Has a time" (PLAN-CORRECTNESS-1-003; plan gate Q-E).** `time` reflects to its attribute, as 013's `ocelle-fact`
reflects `label`, so the container's `MutationObserver` sees a property set from script. The internal module
`src/timeline-time.ts` (PLAN-FRESH-2-003) has two predicates on the event element, which both
`ocelle-timeline-event.ts` and `ocelle-event-timeline.ts` import:

- `hasSlottedTime(event)`: true when at least one of the event's direct children with `slot="time"`, with neither
  `hidden` nor `aria-hidden="true"`, has a trimmed `textContent` that is not empty. It reads the light DOM, not
  `assignedNodes()`, because the `time` slot is not rendered while the event has no slotted time, and so that the
  container gets the same answer as the event.
- `hasTime(event)`: `hasSlottedTime(event)`, or the event's `time` attribute is a string whose trimmed value is not
  empty.

`hasTime` decides the time box, the `<li>`'s `has-time` class and the previous `<li>`'s `next-has-time` class;
`hasSlottedTime` decides whether the time box holds the slot or the attribute's text. So the slotted time takes
precedence: while the event has one, the `time` attribute is neither rendered nor exposed. An empty, white-space-only,
`hidden` or `aria-hidden="true"` slotted time counts as none: the slot is not rendered, so those nodes are unassigned
(not shown, not in the tree), and a non-blank `time` attribute applies instead (the reading of "precedence" the
operator chose, Q-G (a) below). Beside a visible non-blank slotted node, every other `slot="time"` child is assigned
with it in source order: a blank one adds no text (the item text collapses white space; analysis A1), and a hidden
one is assigned too, so the event's styles add
`slot[name="time"]::slotted([hidden]), slot[name="time"]::slotted([aria-hidden="true"]) { display: none; }`.

The slotted time is styled through `slot[name="time"]::slotted(*)` with the attribute time's declarations (below), so
a `<time>`, or a `<b>` whose UA weight is bold, takes the time's type; the element writes nothing on the slotted
nodes, and a consumer rule on them wins (the cascade puts outer rules above `::slotted()`), which the README states.
The time box comes before the content in the shadow tree, so the item text is time first wherever the consumer wrote
the slotted node.

The event observes itself with one `MutationObserver` (`childList`, `characterData`, `subtree`, and the attributes
`slot`, `hidden` and `aria-hidden`) while connected, recomputes `hasSlottedTime` per record batch and requests an
update when it changed, so the time box follows a slotted time added, removed, emptied, filled, hidden or shown, also
outside a timeline. The container's observer watches the same changes in its events' subtrees (R-08) for the classes.

The file name is outside the manifest's glob (`src/ocelle-*.ts`) and the module is not in the package's `exports`
map, so neither predicate is manifest surface nor importable from a public entry point, which is how 009's
`overflow-region.ts` stays internal. No element module exports a function. Phase 2's red commit adds a manifest test
statement: the module of `ocelle-timeline-event` declares only the class `OcelleTimelineEvent`, and its exports name
nothing else but the element's definition; and a manifest statement that the event declares the default slot and the
`time` slot. So `time=""` and a white-space `time`, with no slotted time, render no time box and set no `has-time`,
and the item text is the content alone (the data model's "empty or absent renders no time box"). A non-blank time is
shown as given. Phase 2's red commit has bodies for `time` set, changed and cleared by property after mount,
`time=""` and `time=" "`, each measuring the marker's centre against the first line box of the event (the time's
line, or the content's when it has no time) and asserting the reflected attribute. It also has the slot bodies
US2-11 to US2-14 (a slotted `<time datetime>` after the content, shown above it and read first, with the attribute
time's computed type, a `<b slot="time">` included; the attribute ignored while the slot has content and shown again
when the slotted node is removed; an empty, white-space-only, `hidden` and `aria-hidden="true"` slotted time, with and
without a `time` attribute; the slotted time filled, emptied, hidden and shown after mount, and a child's `slot`
attribute set to `time` and removed, analysis G1), an event outside a timeline with a slotted time, two slotted time
nodes of which one is `aria-hidden="true"`, two visible ones of which one is blank (both assigned, no added text;
analysis A1), and a slotted time with its own `lang`. The time is
`--ocelle-font-size-xs`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`, `--ocelle-figures`, line height
`--ocelle-line-height-normal`; the content is `--ocelle-font-size-sm`, regular weight, `--ocelle-color-ink`,
`--ocelle-line-height-normal`; time and content differ by size and weight (FR-023). The container's `<li>` is a
two-column grid: a marker column of `--ocelle-size-dot` plus `--ocelle-space-3` of gap, and the item. The marker sits
in a `1lh` wrapper whose line box is set to the time's type when the event has a time and to the content's type when
it has none (the container reads `hasTime(event)`, the slotted time or the reflected `time`, and sets `has-time` on
the `<li>`), so it is
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
  visible event has a time, by the same `hasTime(event)`, so an event timed by its `time` slot counts and one whose
  slotted time is empty or hidden does not (unless its `time` attribute is non-blank), and re-renders it from its
  `MutationObserver` like `has-time`, a change to the next event's slotted time included. So a
  timeline that mixes events with and without a time still ends each connector the same distance before the next dot.
  With a centre-to-centre span, each end would be off by half the difference of the two line heights, about 1.45 px.
- **Figures.** The offsets are `calc()` over tokens: the two types' sizes and `--ocelle-line-height-normal`,
  `--ocelle-size-dot`, `--ocelle-space-1` and the row gap `--ocelle-space-3`. No new `style-lint` allowance is used.
  The phase 2 spike records the exact form `style-lint` accepts, and a form it rejects goes to the operator.

Phase 2's red commit has connector geometry bodies on a timeline of three timed events and on a mixed timeline
(timed, untimed, timed by its `time` slot, untimed with an empty slotted time). For each connector they assert:

- its block start is at or after its dot's block end, and its block end is at or before the next dot's block start;
- both gaps, the dot's end to the connector's start and the connector's end to the next dot's start, equal
  `--ocelle-space-1` within 0.5 px;
- `elementFromPoint` at the centre of each dot returns that marker, not a connector.

Element plants: the connector started at its dot's centre again, and `next-has-time` never set. The first must fail
the geometry bodies, the second the mixed timeline's body. For the slot (plan gate Q-E): `hasTime` reading the `time`
attribute only must fail US2-11 and the mixed body; the attribute's text rendered beside the slot must fail US2-12;
`hasSlottedTime` counting a `hidden` or `aria-hidden="true"` node, or blank text, must fail US2-13; the event's
observer without `characterData` must fail US2-14's filled case; the container's observer without `subtree` must fail
US2-14's marker and connector halves; `slot` dropped from the event's or the container's observer's attribute filter
must fail US2-14's `slot` change (analysis G1); and the `::slotted(*)` type rule removed must fail US2-11's `<b>`
case.

`wrap="anywhere"` on an event sets `overflow-wrap: anywhere` on `part="content"` only.

Outside a timeline the event's own shadow content (time above content, slotted or attribute) shows as plain text,
with no marker or role.

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

**Decision (Q-A decided (a) at the plan gate, 2026-11-16).**

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

**Decision.** No new token. Every value above is an existing token on `main` as merged (8ee3351); the column headers
use 011's eyebrow tokens (`--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow`,
`--ocelle-color-eyebrow`; recheck Q1 (a)), and `--ocelle-tracking-caps`, which the plan once took from 009's branch,
is not used (009 landed without it). Every text colour (`ink`, `ink-soft`, `ink-muted`, and `color-eyebrow` on the
column headers) and every structural mark (`ink-muted`) has a text declaration on the nine main grounds; the decorative lines use `color-rule` and `color-rule-strong`, which have none
(FR-013). No contrast row is added: `color-eyebrow`'s rows are 011's (`packages/tokens/contrast/pairs.json`, `checked`
on the nine main grounds in both themes). The plan gate's answers (Q-A to Q-C all (a), 2026-11-16) change no colour,
and a slotted time is painted in the attribute time's `ink-muted`, so no new pair arises.

**Contrast oracles (PLAN-TESTABILITY-1-003, operator decision (c)).** Two checks, so a mark painted in the wrong token
cannot pass on the token source alone:

- **Source (node).** As 013's `progress-pairs.test.ts`: `packages/elements/test/node/records-pairs.test.ts` (with
  `records-pairs-check.ts`) for the five element templates, and `packages/styles/test/data-table-pairs.test.ts` for
  the data-table block of `base.css` (the column header's colour is tied to `color-eyebrow`'s rows). Each reads every
  colour the source paints (cell, header, row header, caption,
  time, content, marker, ring, ordinal, chip outline, chip text) and asserts each foreground and structural colour is
  tied to a `checked` row of `packages/tokens/contrast/pairs.json` on all nine main grounds in both themes, and each
  decorative line uses a rule token. A fixture with one row removed (`fixtures/pairs-missing-row.json`, as 013's) must
  make the check fail. This covers US1-11, US2-8 and US3-8.
- **Rendered (browser).** US1-11, US2-8 and US3-8 read each rendered colour (cell, header, time, content, marker,
  ring, ordinal, chip outline) in light and dark and assert it equals the probe-resolved value of the token the source
  names, then look that token up in the declarations. Element plants (checks.md): the timeline marker in
  `rule-strong`, the step ring in `rule`, the chip outline in `control-border`, the header text in `rule-strong`; the
  rendered body must fail for each.

**Additions for the inventory decisions (2026-11-18).** Still no new token and no new contrast row. The stripe paints
`--ocelle-color-inset`, the hover `--ocelle-color-hover-bg` and the pinned header `--ocelle-color-sheet` (R-18, R-20):
three of the nine main grounds, on which every text colour the data table paints (`ink-soft`, `ink`, `color-eyebrow`)
already has `checked` rows in both themes, and a slotted link keeps `color-link`, declared on all main grounds. The
grounds themselves are decorative (FR-013's table), so they need no non-text pair. The forced-colours band uses
`--ocelle-bar-width` and the system colours `Canvas`, `CanvasText` and `Highlight`. The source node check
(`data-table-pairs.test.ts`) also ties each ground block 1 paints to a main ground of `source.ts`, and each text colour
painted on it to a `checked` row on that ground; the rendered bodies (US1-17, US1-23, US1-24) compare each ground with
its probe-resolved token. In the light theme `hover-bg` and `inset` share the value `#E2DDD3` (`source.ts`), so a
hovered striped row shows no change in light; the operator accepted it (Q-I2, 2026-11-18) and the README notes it.

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

**Done (2026-11-17).** `reviews/recheck.md` found five differences; the operator answered them in
`reviews/recheck-decisions.md` (Q1 (a), Q2 (c), Q3 (a), Q4 (a), Q5 (b)), and the changes they make to this plan are
listed in `reviews/recheck-fixes.md`. The list above is the recheck's scope as planned; `--ocelle-tracking-caps` in it
is the token that turned out absent (Q1).

## R-15 Gate runs per phase (FR-051, FR-059)

**Decision.** Each phase runs the gates its diff touches, the plants by op 016's selection:
`pnpm run gate:plants -- --affected <phase base>`, the run itself recorded in `reviews/phase-<N>/plants.md` in op
016's form (base, command, exit, verbatim output) and rerun by the reviewer with `--list` to compare the affected
lines; phase 4 uses the mission's base (phase 1's), as it changes no source (quickstart step 4). Never a full
`gate:plants` locally (CI's required Plants check judges the full set).
Baselines: `pnpm run visual:update` only in #10's pinned container under docker (start `dockerd` as root; after a
container restart, `pnpm run setup:online`); the command must report `<n> added, 0 changed, 0 removed` with `<n>`
twice the phase's new stories (42, 22 and 24 for phases 1 to 3, from checks.md § Stories; phase 1's 28 since spike
Q1 (b), 38 since the inventory decisions IQ-2 to IQ-5 added five stories, 40 since the re-analysis decision C1 (b)
added the unbounded sticky-header story, 42 since the answer to fixes-2 Q-1 (b) added the room-rule sticky-header
story), so no existing baseline
moves (013's baselines among them, SC-007). Conflicting PNGs are regenerated in the container, never hand-picked. Mutation follows #23 and op 015 on `main`.

## R-16 The inventory (FR-058)

**Decision (inventory decision IQ-1 (a), operator, 2026-11-18).** The inventory behind the README mapping rows is the
spec-kitty design library's own variant set for the three families this mission replaces (`.sk-data-table`,
`.sk-event-timeline`, `sk-evidence-chain`), recorded in `sources/spec-kitty-design-inventory.md` from a read-only
clone of the open-source library (MIT): first at `main` 19fb6a2 (1.0.0), then re-read at the newest line, `develop`
a6518cd (2026-09-28), because the remote has no release tags and the operator chose the newest line over rc.10. Role
names and behaviour only, no code (constitution VI). It stands in for kitty-mission-ui's usage: **one README mapping
row per modifier, state, structure role and part, no counts**, because a consumer can only use what the library
defines. A variant that exists only in kitty-mission-ui's rc.10 line gets a row too, when the operator names it. A
variant no element covers goes to the operator; the surface is not widened by review. This supersedes the spike's
"Proceed, map later" on T005: no row reads "pending inventory".

**What `develop` adds.** Nothing to the families' roles, modifiers, states, stories, properties or parts (no path
under the library's `packages/` or `docs/design-system/` differs). It adds #470's Desktop V2 source contract, which
lists the data table and the event timeline among 22 families with required states, and not the evidence chain; a
frozen hand-off payload whose data-table and timeline files are byte-identical to 1.0.0's; and baselines per required
state (`sources/spec-kitty-design-inventory.md` § What `develop` adds or changes;
`sources/issue-470-handoff-background.md`). Its bearing on phases 2 and 3 is asked as IQ-26 to IQ-28.

**Phase 1: the data table's rows** (T013 asserts each statement by role name, with no `sk-` string; T021 writes them):

| Library role (kind) | Mapped to |
|---|---|
| the scroller wrapper (structure role) | the element's region: a named `group` tab stop only while the table overflows (FR-008, FR-010), with 009's focus ring (the "focus" state of #470's contract); the library's rule that the region's name must differ from the caption maps to the README advice of FR-010: give an overflowing table a `label` that differs from its caption (IQ-6 (a)) |
| the table class (structure role) | the consumer's own `<table>` inside `ocelle-data-table`, with no class (FR-003, FR-005) |
| the caption (structure role) | the caption rules of block 1 (R-06, R-07) |
| the header cells (structure role) | the eyebrow column headers (FR-006); the library's look (medium weight, muted colour, sentence case, no tracking, no row-header style) maps to them, and a consumer that wants sentence case uses its own rule, which wins over the (0,0,0) rules (IQ-7 (a)); row headers are this library's addition |
| the body cells (structure role) | block 1's compact body cells (FR-005) |
| the numeric cell (modifier) | `data-ocelle-align="end"` on the column's cells, `@ocelle/styles`' hook (FR-019, IQ-3) |
| the sticky header (modifier) | `sticky-header` on the element, with the page's block bound on the host (FR-017, FR-018, IQ-2) |
| zebra rows (state) | `striped` on the element (FR-060, IQ-4) |
| row hover (state) | the built-in hover ground (FR-061, IQ-5) |
| forced colours (state) | system colours for text and rules, and the row band for the stripe and the hover (FR-013) |
| the overflowing scroller (state) | the region's conditional tab stop, role and name (FR-008, FR-010) |
| tone (state, none by ruling) | none: the data table carries no tone (spec scope); no row colouring |

The data table has no part in the library (styles only), so no part row. #470's contract adds no role: its required
states (default, light mode, responsive narrow, hover, focus, sticky header) are covered by the rows above.

**Phases 2 and 3 (T028, T054).** The timeline's and the chain's rows come from the same source, one per modifier,
state, structure role and part, mapped by the operator's answers to IQ-8 to IQ-17 and IQ-26 to IQ-28 (phase 2) and
IQ-18 to IQ-24 and IQ-27 (phase 3), asked before each phase's red; the issue bodies of #470, #517 and #533 are
supplied by the operator before phase 2's red and recorded verbatim in `sources/` (IQ-25).

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

## R-18 The sticky header row and the module's block-axis option (FR-017, FR-018; inventory decision IQ-2)

**Decision (operator, 2026-11-18, IQ-2: "Mission changes module").** The sticky header row is added in this mission.
A pinned header needs a scroll container in the block axis, and the data table's only scroll container is 009's
`.region-box`, which scrolls inline only (`overflow-y: hidden`). So this mission adds one opt-in option to 009's
module, specified in `contracts/overflow-region-block-axis.md`, and FR-008 now allows exactly that change. Without the
option the module is 009's, byte for byte in behaviour: `ocelle-scroller`, `ocelle-workflow-board` and the test-only
overflow host do not set it, and 009's existing behaviour tests are not edited and pass (SC-007). It is not R-17's
pinned-start option (the caption stays non-sticky, Q-F (b)); that request to 009's owner stays open.

**The option** (`blockAxis`, `blockStartBox`): the box scrolls on both axes and, while it overflows in the block axis
(`data-axis="both"`, spike-2 Q-3 (c)), has `overflow-y: auto`, with no `scrollbar-gutter`: the block-axis scrollbar
takes its room only where the platform draws one (`offsetWidth − clientWidth`, 15 px with classic scrollbars, 0 with
hidden ones; the operator's answer to Q-A1 (a), 2026-11-18, below); it overflows, and so takes the tab stop, role and name, when either axis overflows;
ArrowUp and ArrowDown scroll it by `step`; PageUp, PageDown, Home, End, Space and Shift+Space are left to the
browser, which scrolls the focused box in the block axis once it has `overflow-y: auto`, and the module neither
handles nor prevents them (the operator's decision G1 (a) on the re-analysis, 2026-11-18: these were blocked by
`overflow-y: hidden` before the option, so they are new keyboard paths of the region, each asserted in T079 and
T080); the focus clearance also works in the block axis below the pinned box; the block end fades while content is
below it (Q-I4, below); no fade covers either scrollbar.

**The block-end fade (operator, 2026-11-18, Q-I4: "add a fade at the block end while content is below"; it replaces
the earlier default of no block fade).** The pinned header and the scrollbar alone were judged too weak a cue that
rows continue. The module, while the option is on, fades the box's block end over the inline fades' depth
(`--ocelle-scroller-fade-size`) whenever content is more than 1 px below the client block end, and writes
`data-block-fade="end"` on the box itself (as it writes `data-axis`), so the host binds nothing new. Choices made, each
from 009's inline fades where one applies:

- **Block end only.** No block-start fade: the block start is where the header is pinned, and a start fade would
  fade the header row the option exists to keep in view; the pinned header shows that rows are above.
- **The room rule.** The fade is drawn only when the space between the pinned box's block-end edge (the client
  block-start edge without a `<thead>`) and the client block-end edge is at least twice the fade depth, so the fade
  never reaches under the header and at least as many rows show unfaded as faded; in a smaller bound the scrollbar is
  the only cue. Twice, not once, because a fade as deep as the whole visible body leaves no row legible at rest
  (the operator confirmed the factor two, Q-I6 (a), 2026-11-18).
- **The pinned-box measure (re-analysis A1 (c), 2026-11-18; decided (a) on spike 2, 2026-11-18).** The room rule and
  the block clearance measure from one point below the pinned box, `pinnedEnd` (contracts/overflow-region-block-axis.md
  § The pinned-box measure). At the block start the `<thead>` is not yet pinned: a caption above it pushes it down by
  the caption's height, and a two-line caption at 320 px can push its block-end edge below `clientHeight − fade
  depth`. T082 measured both candidates (spike-2 § 11), and the operator chose (a), **the `<thead>`'s current
  block-end edge** (Q-1 (a)): the fade never covers the header and the clearance always clears the header where it
  is; under a tall caption in a small bound the fade is absent at rest until the caption scrolls away. Measured at
  320 px with the two-line caption (in process, fallback font; the header's block-end edge 80.6 px below the client
  block start at rest, 27 px once pinned, fade depth 32 px): a 100 px bound has no fade at rest (space 19.4 px) and a
  fade past the caption (73 px); 120 px none at rest; 140 px none at rest and a fade with half the caption away; 300 px
  a fade at rest, its block-start edge 187.4 px below the header. A link in row 1, tabbed to: in the 100 px bound at
  rest Chromium's focus scroll and the clearance leave its ring 1 px below the header; past the caption its ring's
  block-start edge is 0.4 px under the pinned header's block-end edge (scroll rounding, inside the 0.5 px tolerance).
  The other candidate (client block start plus the `<thead>`'s block size) faded the header's lower 12.6 px at rest in
  the 100 px bound and is not used. Without a caption the two differ only by the ring room at rest (32 against 27).
- **Mask composition.** Four layers while the option is on: the inline fade layer and the block-end fade layer, each
  sized to the client area and opaque when its fade is off; and the two opaque scrollbar layers. The two fade layers
  intersect (`mask-composite: intersect`; alpha multiplied), so in a corner both fades apply and neither undoes the
  other, as an `add` would; the scrollbar layers are added to the result, so both scrollbars stay unmasked. Measured
  (spike-2 § 3, LTR and RTL): top first the block-scrollbar layer, the inline-scrollbar layer, the block-end fade
  layer and the inline fade layer, with `mask-composite: add, add, intersect, add` (corner alpha 0.24 against the
  product 0.24; with every layer `add`, 1.00 under one fade alone; with the order reversed both scrollbars masked);
  the fade layers at the client area's side, the block-scrollbar layer at its side (left under `dir="rtl"`). The
  figures stay px written to the per-instance sheet (009's R-05). Hosts without the option, and a box with the option
  but no block overflow (no `data-axis`), keep 009's two layers. Under the harnesses' hidden scrollbars the
  block-scrollbar layer is `0px 100%`; its classic-scrollbar figure (`<room>px 100%`, the room above 0) is asserted in
  the classic-scrollbar suite (Q-A3 (a), Result below).
- **Focus clearance.** 009's inline clearance keeps the ring clear of every edge that will still fade, and falls back
  to suppressing a fade for a ring too large to clear (WCAG 2.4.11). The block clearance does the same against the
  block-end fade: clear of the pinned box above and of the fade below (if it still shows at the new position), and
  for a ring box taller than that space, aligned below the pinned box with the fade suppressed until `focusout` or a
  `scroll` of more than 1 px from the recorded `scrollTop`. `blockClearanceScroll` returns `{ scrollTop, suppressEnd }`.
  A focused element before the pinned box in tree order (a link in the caption) sits above the `<thead>` in flow, so
  no scroll position puts it below `pinnedEnd`: measured from it, the clearance would scroll the link towards the
  header at rest (or clamp and suppress the fade) and could not clear it once the caption is under the pinned header.
  For such an element the upper bound is the box's client block-start edge (the operator's answer to Q-S2-1 (a),
  2026-11-18, raised in `reviews/phase-1/spike-2-fixes.md`): the `<thead>` follows it in flow and cannot cover it,
  and the box scrolls back to show it; `blockClearanceScroll` takes this as `before`. Measured with T082's addendum
  (spike-2 § Addendum A4, A5): at rest nothing is written; fully past the caption Chromium's own focus scroll centres
  the link and clamps at `scrollTop` 0 before `focusin`, so the clearance writes nothing there with or without
  `before`; with the link 2 to 12 px above the client block-start edge the variants differ (Chromium alone leaves the
  ring box at −4.7 px, the clearance without `before` scrolls to 0 and leaves it at 21.3 px, with `before` at 0.3 px).
  The bodies therefore assert the rule at that partly scrolled position and keep the fully-past position as a paired
  assertion the platform alone meets (the operator's answer to Q-A2 (a), 2026-11-18).
  The depth is measured from layout, the block size of a new `.region-edge.block-end` (009's rule: never parse a
  custom property's text).
- **Forced colours.** Masks are not drawn in forced colours (009's rule sits inside `@media not (forced-colors:
  active)`); `.region-edge.block-end`, rendered by the host after 009's two edges, draws a `CanvasText` line of
  `--ocelle-border-width` at the frame's block end while `data-block-fade="end"`, as 009's inline edges do. It is
  full width only in forced colours; outside them it is zero-wide (spike-2 Q-4 (a)), because laid out full width over
  the rows it made axe-core 4.14.0 report a serious `color-contrast` incomplete result (`bgOverlap`) on those rows in
  every data table, which the `axe` gate counts (spike-2 § 9). It is a
  new class on a new node in the template of a host that sets the option, so 009's hosts and their DOM do not change.
- **The pinned header in the fade.** It never is (the room rule). The header row's opaque `sheet` ground and the
  stripes are masked like any content where the fade covers them; the caption, above the header, scrolls away with
  the body and is masked only when it reaches the box's block end.
- **The caption cap.** Unchanged: the block-end fade is not in the inline axis, so `--data-table-end-fade` (the inline
  end fade's depth) and the block-axis scrollbar's room subtraction stand.
- **Stories and baselines.** The block-end fade adds no story: the bounded sticky-header story shows it at rest (its
  baselines capture it) and its story test asserts `data-block-fade="end"`; no story for the fade's off state (the
  operator's decision Q-I7 (a), 2026-11-18). The re-analysis decision C1 (b) (2026-11-18) adds one story for the
  sticky header with no bound (US1-20), and the answer to fixes-2 Q-1 (b) (2026-11-18) one for the room-rule state
  (a bound leaving rows below but less than twice the fade depth under the header, no caption: no fade at rest), so
  phase 1 has 21 stories and 42 baselines, the mission 44 and 88. The one scroll-position state left, scrolled to the
  block end, is a Principle V exception row in plan.md § Complexity Tracking, proven by US1-26, US1-28 and T079's
  bodies.

**009's contract file (Q-I5, 2026-11-18).** One line at the top of `specs/009-workflow-layouts/contracts/overflow-region.md`
points to `contracts/overflow-region-block-axis.md` as this mission's amendment; nothing else of 009's directory is
changed. The line is added in a documentation commit of its own.

**The data table's side.** `sticky-header` (reflected boolean, unset by default, as `ocelle-card`'s `inset`) turns the
option on; `blockStartBox` is the assigned table's `<thead>`. `@ocelle/styles` pins the `<thead>` (`position: sticky;
inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`: sticky positioning
measures from the box's padding edge, and the box keeps the 5 px ring room as block padding, so at `0` the header
pinned 5 px low with rows showing above it, spike-2 § 1; the operator's decision Q-2 (a)), gives its cells the opaque `--ocelle-color-sheet` ground, and switches the sticky table to
`border-collapse: separate; border-spacing: 0`: in the collapsed model a sticky row group's borders belong to the
table and stay behind, so the header rule would not travel with it (the library makes the same switch, behaviour only;
inventory § 1). Each cell draws only its block-end border, so the row rules look as before. The block bound is the
page's rule on the host; the host and `.region-frame` become a column flex while `sticky-header` is set, so the bound
reaches `.region-box` and, with no bound, the box is as tall as the table.

**The caption cap with a block-axis scrollbar (R-07).** R-07's measured width assumes no block-axis scrollbar (the
box has none without a bounded block size). With the option a block-axis scrollbar is drawn while the box overflows
in the block axis (spike-2 Q-3 (c)); no gutter is reserved (Q-A1 (a)), so its room is 15 px in Chromium with classic
scrollbars and 0 with hidden ones (the harnesses, the stories and the baselines). The element subtracts
`offsetWidth − clientWidth` of `.region-box`, read in its `.box-size` callback, from the written
`--data-table-box-size`, and rewrites it one animation frame after the box's `data-axis` changes (`.box-size` does
not change size when the scrollbar comes or goes; contracts/ocelle-data-table.md § The caption cap). The scrollbar
appears only with a block overflow that a narrower cap can only keep (a narrower caption makes the table taller), so
the write cannot oscillate; measured before the red commit without the gutter (spike-2 § Addendum: 305px and 320px
following with classic scrollbars, 320px throughout with hidden ones, no loop error, no oscillation). Under hidden
scrollbars the subtraction is 0, so no hidden-scrollbar body can tell it from no subtraction; the operator's
answer to Q-A3 (a) (2026-11-18) adds a classic-scrollbar half, `packages/elements/test/browser/data-table-scrollbar.test.ts`
in `elements-browser`, launched without `--hide-scrollbars` as 009's `test/browser/scrollbar.test.ts`, which guards
it (Result below). Measured earlier with the gutter always reserved (spike-2 § 7): at 320 px `--data-table-box-size` 305px and every caption line inside the unmasked
width, no loop error over 320 → 600 → 320 px; in the open `<dialog>` the shrink-to-fit host gets two `.box-size`
callbacks (the gutter appearing after the first delivery widens it once), not one.

**To measure in the spike (phase 1, before the scaffold; recorded in `reviews/phase-1/spike-2.md`).** T003's spike is
done and stays the implementer's to tick; the new points get a second spike task (T082):

- a slotted `<thead>` with `position: sticky` pins to the shadow `.region-box` (the flat tree's scroll container) in
  Chromium, at 1280 and 320 px, scrolled in both axes; the cells' ground is opaque and paints over the body rows;
- the module with `data-axis="both"` and `scrollbar-gutter: stable`: `clientWidth`, `offsetWidth` and the gutter in
  LTR and `dir="rtl"` (which side the block-axis scrollbar is on), and a four-layer `mask-size` that leaves both
  scrollbars unmasked, with the layer order and `mask-composite` values under which the inline and block-end fade
  layers intersect (a corner under both faded by both) and the scrollbar layers add;
- the block-end fade: at rest with rows below, gone at the block end, its block-start edge at or below the pinned
  header's block-end edge, absent under the room rule, and in forced colours the `.region-edge.block-end` line in
  `CanvasText` at the frame's block end;
- the column flex bound: a `max-block-size` and a `block-size` on the host bound `.region-box`; no bound leaves it as
  tall as the table; the shrink-to-fit hosts of R-02 with `sticky-header` (never 0 px wide);
- the pinned-box measure (A1 (c)): at 320 px with a two-line caption above the `<thead>`, at the block start and
  scrolled past the caption, both candidates (the `<thead>`'s current block-end edge, and the box's client block
  start plus its block size), the room rule and the fade's block-start edge under each, and where a link just below
  the header is cleared to under each; the record states both and stops for the operator's choice before the
  scaffold;
- the keys the browser keeps (G1 (a)): PageUp, PageDown, Home, End, Space and Shift+Space on the focused box scroll it
  in the block axis in Chromium, with no `preventDefault` from the module, the block-end fade following and the
  header staying pinned;
- block clearance: a link scrolled under the pinned header reaches a position clear of it after `pressTab`, with
  Chromium's own focus scrolling and the module's write in the same frame (no jump back); a link in the faded rows
  reaches a position clear of the block-end fade; a link inside the header is not cleared;
- the caption cap with the gutter subtracted: the caption's line boxes inside the unmasked width, and no
  `ResizeObserver` loop error;
- separated borders: the row rules' rendered positions equal the collapsed ones within 0.5 px, and the header rule
  moves with the pinned row;
- forced colours: the pinned header opaque, its rule `CanvasText`;
- axe on a bounded sticky table (overflowing in the block axis only): no serious or critical finding.

A result that contradicts this section stops for the operator.

**Result (spike 2, T082, 2026-11-18; `reviews/phase-1/spike-2.md`).** Every point above was measured in Chromium 156
with hidden and classic scrollbars. It held, apart from four points the operator decided on 2026-11-18, with one
question those decisions raised (Q-S2-1) answered the same day (`reviews/phase-1/operator-spike-2-decisions.md`,
human:jeroennouwsdev; changes in `reviews/phase-1/spike-2-fixes.md`):

- **Q-1 (a), the pinned-box measure:** the current edge (above).
- **Q-2 (a), the header pinned 5 px low:** block 1's negative block-start inset on the `<thead>` (above). Measured:
  0 px once scrolled 5 px or more, +5 px at rest, also after `PageDown`, `End`, `Space` and `ArrowDown` (0) and
  `Home`, `PageUp` and `Shift+Space` (+5). US1-17, US1-18 and T079's keys body read "at the client block-start edge
  once scrolled; at the at-rest position back at the block start". Not measured: once pinned, the block-start ring of
  a focused control in a header cell (cell padding 4 px, ring room 5 px) may reach 1 px above the client edge.
- **Q-3 (c), RTL and the gutter:** `data-axis="both"` only while the box overflows in the block axis. Under
  `dir="rtl"` a box with `scrollbar-gutter: stable` that overflows inline but not in the block axis starts at
  `scrollLeft` −15 and never reaches 0 (the first 15 px unreachable; with block overflow too it starts at 0). Not
  measured in the spike: the implementer measures it before the red commit and stops if it fails (T082, a
  stop-and-ask point): LTR and RTL, hidden and classic scrollbars, inline-only, block-only and both, the bound set
  and lifted at run time (the attribute, the gutter, the four or two mask layers, the caption cap rewritten, no
  `ResizeObserver` loop error, no oscillation), and a classic-scrollbar box whose block overflow comes only from the
  inline scrollbar the gutter causes.
- **Q-4 (a), axe and `.region-edge.block-end`:** zero-wide outside forced colours (above); measured clean (no
  violation, no incomplete result, `scrollable-region-focusable` passing).
- **Q-S2-1 (a), a focusable element before the pinned box** (asked in `reviews/phase-1/spike-2-fixes.md`, answered
  2026-11-18): the block clearance's upper bound for it is the box's client block-start edge (Focus clearance,
  above). Not measured in the spike: the implementer measures a caption link at rest and past the caption with the
  Q-3 (c) addendum before the red commit (T082) and stops if it fails.

**Result (T082's addendum, 2026-11-18; `reviews/phase-1/spike-2.md` § Addendum).** Measured on the scratch module
with the four decisions and Q-S2-1 (a) applied, hidden and classic scrollbars, LTR and RTL: no `ResizeObserver` loop
error, no oscillation of `data-axis`, the cap rewritten one frame after each change; two results stopped the phase
and were answered the same day (`reviews/phase-1/operator-spike-2-decisions.md` § T082 addendum questions,
human:jeroennouwsdev; changes in `reviews/phase-1/spike-2-fixes.md`):

- **Q-A1 (a), no `scrollbar-gutter`.** With `scrollbar-gutter: stable` and hidden scrollbars Chromium reserves 15 px
  (`clientWidth` 305 at 320 px) but sizes the inline scroll range as if not (170 against 185 with classic
  scrollbars), so a both-ways table loses its last 15 px in LTR and its first 14 px in RTL (`scrollLeft` −14,
  `data-fade="both"` at rest); with classic scrollbars an RTL table is left at −14 when the gutter goes at run time
  (A1, A2). The spike's "with block overflow too the start is reachable" (§ 2, Q-3 above) held for classic
  scrollbars only. Without the gutter, both modes and directions measured clean (the full inline range, `scrollLeft`
  0 at rest and after the bound is set and lifted, the four layers with a 0 px block-scrollbar layer under hidden
  scrollbars). `[data-axis="both"]` gives `overflow-y: auto` only; the scrollbar's room is `offsetWidth −
  clientWidth`.
- **Q-A2 (a), the caption link at a partly scrolled position.** Fully past the caption Chromium's focus scroll alone
  meets the guarantee (A4); with the link's border box 2 to 12 px above the client block-start edge the three
  variants differ (A5, Focus clearance above), and the red bodies assert the rule there, the fully-past position
  kept as a paired platform-alone assertion.
- Not reproduced (A3): a classic-scrollbar box whose block overflow comes only from the inline scrollbar a gutter
  causes; Chromium drew no inline scrollbar for it.

The settled facts the red bodies use: the mask layer order and `mask-composite: add, add, intersect, add`; no
gutter, the block-axis scrollbar's room 15 px with classic scrollbars and 0 with hidden ones (the earlier "gutter
15 px in both scrollbar modes" described `scrollbar-gutter: stable`, now dropped); "within 0.5 px" is inclusive (`≤ 0.5`), the separated row rules being exactly
0.5 px from the collapsed ones (whole against half pixels) with the header rule 1 px in both; the stripe counted per
`<tbody>` with a `hidden` row counted; in light a hovered striped row's ground equals the stripe (`rgb(226, 221,
211)`), so a body asserting the hover over a stripe reads it in dark (`hover-bg` `rgb(42, 38, 31)` against `inset`
`rgb(48, 43, 35)`) or on an odd row; Chromium's focus scroll runs before `focusin`, the clearance writing once with no
jump back; `PageDown` and `Space` move 262 px in a 300 px box (bodies assert the direction and a non-zero move);
the keys sent as real key events; the shrink-to-fit `<dialog>` host's two `.box-size` callbacks; a bounded sticky
table prints its box only (spike-2 § 12).

**Q-A3 (a), a classic-scrollbar half (the operator's answer, 2026-11-18, end of
`reviews/phase-1/operator-spike-2-decisions.md`).** Without `scrollbar-gutter` the block-axis scrollbar's room is 0
under `--hide-scrollbars`, which Playwright adds to every headless launch: both harnesses, the stories and the
baselines. Three things depend on that room and so cannot be seen there: the caption cap's subtraction, the RTL
table's `scrollLeft` when the scrollbar comes and goes (spike-2 § Addendum A2: −14 with the gutter going, classic
only), and the block-scrollbar mask layer's figure. Decision: one more fixture-harness file,
`packages/elements/test/browser/data-table-scrollbar.test.ts`, in the `elements-browser` project (node environment,
the global setup's browser build), whose `beforeAll` launches Playwright's `chromium` with `ignoreDefaultArgs:
["--hide-scrollbars"]` as 009's `test/browser/scrollbar.test.ts` does, and drives the data table's fixture page with
`fixtureDriver`. Its bodies: the sticky caption body at 320 px (the room 15 px, `--data-table-box-size` 305px with
every caption line inside the unmasked width, 320px one frame after the bound is lifted and 305px after it is set
again, no loop error); the RTL both-ways table (`scrollLeft` 0 and `data-fade="end"` at rest, the far end reachable,
and after each change of the bound); and T079's mask figure on the block-axis test host, on the fixture page T079's
browser file visits (`<room>px 100%` as the first layer, at the left under `dir="rtl"`). Each asserts
`data-axis="both"` and a room above 0 first. Rejected: (b) the caption cap alone (the RTL lift and the figure would stay unguarded where
they matter); (c) an accepted gap (a behaviour with no failing test, constitution VIII). The plants that only this
suite can make fail: the `.box-size` write without the room, the block-scrollbar layer written `0px 100%` whatever the
room (one new element plant), and, besides its hidden-scrollbar guards, `scrollbar-gutter: stable` (the RTL lift);
they run in `elements-browser` (contracts/checks.md § Element plants). Mutants on the room survive the in-process
mutation run (room 0) and are recorded naming the classic body that kills them, as 009's landing review L1-02 did.

## R-19 The numeric-cell hook (FR-019; inventory decision IQ-3)

**Decision (operator, 2026-11-18, IQ-3 (b)).** A documented base-style hook in `@ocelle/styles`, not an element
property and not a class: `data-ocelle-align="end"`, as IQ-3's option named it, in the README's Hooks family and
form (one `data-ocelle-` attribute, one documented value, (0,1,0), like 003's `data-ocelle-wrap`). It sets
`text-align: end` (mirrored under `dir="rtl"` by the logical keyword) and `font-variant-numeric: var(--ocelle-figures)`
(already on data-table cells, added for prose tables and any other cell). It goes after block 2 as block 4, so it beats
003's prose cell rule and block 2's `text-align: start` at the same specificity by order. It works on any element;
the README documents it for the header and body cells of a numeric column. It is public surface (constitution VII,
MINOR): the Hooks table, a § Numeric cells section and the CHANGELOG. No token: `end` is a keyword.

**Tests (phase 1's red).** US1-22's bodies (inside a data table, inside prose, in a plain prose table, `dir="rtl"`,
a header cell keeping its eyebrow type, a cell without the hook staying start-aligned); `source.test.ts`'s last-rule
assertion (wrap, block 1, block 2, block 4); a styles README statement and the Hooks table row; element plants
(below).

## R-20 Striped rows, row hover and the forced-colours band (FR-060, FR-061, FR-013; inventory decisions IQ-4, IQ-5)

**Decision (operator, 2026-11-18, IQ-4 (b) and IQ-5 (b)).** `striped` (reflected boolean, unset by default) paints
each `<tbody>`'s even rows' cells `--ocelle-color-inset`, as IQ-4 (b) named; the row hover paints a hovered `<tbody>`
row's cells `--ocelle-color-hover-bg`, as IQ-5 (b) named, with no attribute, after the stripe rule so it wins on a
striped row. Both are block 1 rules at (0,0,0), so a consumer rule wins. Grounds go on the cells, not the row, so a
cell's own consumer ground wins and the sticky header's cells keep theirs. Both grounds are main grounds, so every
text colour the data table paints keeps its declaration (R-13); both are decorative (FR-013's table).

**Forced colours.** Forced colours replace every author ground with the system background, so neither the stripe nor
the hover would show. As the library does (behaviour only, inventory § 1), a band on each body row's first cell
stands in: `border-inline-start: var(--ocelle-bar-width) solid Canvas` on every first body cell (reserved, so a hover
moves nothing), `CanvasText` on a striped table's even rows and `Highlight` on the hovered row, in that order. System
colours are kept as written in forced colours. The band scrolls away with the row when the table is scrolled
sideways (the library documents the same limit; the README says so).

**Known collision.** In the light theme `hover-bg` and `inset` are both `#E2DDD3`, so hovering a striped even row
shows no change in light (dark: `#2A261F` against `#302B23`). The plan keeps IQ-4 (b)'s and IQ-5 (b)'s tokens; the
operator accepted the collision (Q-I2, 2026-11-18), and the `@ocelle/elements` and `@ocelle/styles` READMEs note that
a hovered striped row shows no change in the light theme.

**Hover is always on** (IQ-5 (b) gives no attribute; confirmed by the operator, Q-I3, 2026-11-18). The hover adds no event, tab stop, focus or cursor (FR-011).

**Only on a device that can hover (re-analysis A2 (a), 2026-11-18).** Touch browsers apply `:hover` to a tapped row
until the next tap elsewhere, so an unguarded rule would leave a hover ground on the last row tapped. The hover rule
and the forced-colours band's `Highlight` rule sit inside `@media (hover: hover)`, as the spec's edge case promises
("on a device with no hover nothing shows"). Tests: US1-24's no-hover half in 008's touch context (`elements-touch`
and `visit(…, { touch: true })`, where Chromium matches `(hover: none)`, 008 research R-14), with no driver
addition; element plants remove each guard. `source.test.ts` transcribes the two rules inside their media block. Stories capture it through #10's
pointer parameter (`parameters.ocelle.pointer.hover`, one selector matching one row inside the 1280 × 800 viewport).

**To measure in the spike (T082).** `:nth-child(even)` per `<tbody>` with a `hidden` row; the hover ground over a
stripe; the band's `Canvas`, `CanvasText` and `Highlight` kept under `emulateMedia({ forcedColors: "active" })`; the
band reserving its width outside a hover, so a hover changes no cell's box.

**Result (spike 2, T082, 2026-11-18; `reviews/phase-1/spike-2.md` § 8).** All held. With two `<tbody>` groups and a
`hidden` second row in the first, the hidden row and row 4 of the first group and row 2 of the second are painted
`inset`, the odd rows not: each `<tbody>` counts its own rows, hidden rows included. A hovered even row computes
`rgb(226, 221, 211)` in light, equal to `inset` (Q-I2's collision), and `rgb(42, 38, 31)` (`hover-bg`) against
`inset` `rgb(48, 43, 35)` in dark: a body asserting the hover over a stripe reads it in the dark theme, or on an odd
row. In forced colours every first body cell has the 3 px band, `Canvas`, `CanvasText` on the striped even rows (the
hidden one included) and `Highlight` on the hovered row, and the cells' boxes are the same hovered or not.

## Questions of the plan gate (spec SPEC-1-06 (b)), answered 2026-11-16

The operator answered at the plan gate (`reviews/plan/operator-gate.md`, human:jeroennouwsdev): decision 1 (a), Q-A
(a), Q-B (a), Q-C (a) and Q-E "Yes: named time slot". Q-D and Q-F were decided during the squad rounds. The answer to
Q-E changed FR-023, which the spec now records; Q-G, the one question that answer left open, was decided (a) on the
same day (`reviews/plan/operator-gate.md`).

- **Q-A. The chip step's look (FR-035, #517). Decided: (a).** (a) Outline only, no fill (the plan's choice: the chip
  reads as the chain's own and cannot be mistaken for #7's filled pill tag). (b) Outline and a `--ocelle-color-inset`
  fill (a stronger chip; the chip's text then needs its declaration on inset, which ink has). (c) Fill only, no
  outline (the boundary would need 3:1 from the fill, which no fill token gives on all grounds).
- **Q-B. The column headers' weight and colour (FR-006, #533). Decided: (a).** (a) `--ocelle-font-weight-medium` in
  `--ocelle-color-ink-muted` (the plan's choice, the same eyebrow 013's empty-state eyebrow uses). (b)
  `--ocelle-font-weight-strong` in `--ocelle-color-ink-muted` (heavier, closer to a heading). (c)
  `--ocelle-font-weight-medium` in `--ocelle-color-ink-soft` (the cells' colour, distinct only by size and case).
  **Superseded (2026-11-17)** by the recheck's Q1 (a): 011's four eyebrow tokens, weight 600 in `color-eyebrow`
  (R-06).
- **Q-C. The event's time position (FR-023, which sets FR-021's marker line; #470). Decided: (a).** (a) The time on
  its own line above the content, the marker centred on the time's line (the plan's choice: the content keeps the
  full width at 320 px). (b) The time before the content on the same line, the marker centred on that shared first
  line (a narrower content column; a long time wraps). (c) The time after the content, at the inline end.
- **Q-D. The markers' shape (decided, PLAN-CORRECTNESS-1-004 operator decision (a), 2026-11-16).** Both the timeline
  dot and the step marker use `border-radius: 50%` with no token, recorded under constitution II as a mark shape and
  not a corner radius. This meets FR-031 ("a round marker") and FR-040 ("No new radius token is added"); `token-only.ts`
  allows `%`. The earlier options are withdrawn: `radius-1` (a rounded square, against FR-031) and a new
  `--ocelle-radius-round` token (against FR-040, `brand-rules.ts`'s closed radius set and constitution II).
- **Q-E. Marked-up times (FR-023, #470; PLAN-FRESH-1-006 operator decision (b)). Decided: "Yes: named time slot".**
  The question was whether #470's history needs machine-readable or marked-up times: a `<time datetime>`, a title, its
  own `lang` or `dir`, or an htmx target on the time. The operator answered yes. `ocelle-timeline-event` gets a named
  `time` slot that takes precedence over the `time` attribute, styled through `::slotted()`, with the item text still
  time first (FR-023, R-10, US2-11 to US2-14). The attribute stays for plain times. The README states that the slot
  carries these and the attribute does not.
- **Q-F. The caption until 009's option exists (decided, (b): PLAN-FRESH-2-002 operator decision (c), 2026-11-16;
  R-17; PLAN-A11Y-SECURITY-1-002).** Not sticky until 009's option lands. The caption scrolls with the table, is
  capped by R-07's measured rule so it wraps inside the box at rest, and is reached by scrolling back. It has no inset
  at any scroll position, so it starts at the table's start edge. It becomes sticky (inset 0) when the option lands, a
  later MINOR as a look change. The other options are withdrawn. (a) was sticky with a fade-depth inset, and that
  inset applied at rest and to a fitting table too: the caption sat 28 px off the first column in every state, not
  only "while the table is scrolled" as round 1 described it (PLAN-FRESH-2-002). (c) waited for the option before
  phase 1's green.
- **Q-G. An empty or hidden slotted time beside a `time` attribute (FR-023). Decided: (a)** (2026-11-16,
  `reviews/plan/operator-gate.md`). The answer to
  Q-E says the slot takes precedence and that an empty or hidden slotted time counts as no time, but not whether the
  attribute then applies. (a) The attribute applies: the slot wins only when it has content, so an empty or hidden
  slotted time falls back to a non-blank `time` (the plan's reading, written into FR-023 and US2-13). (b) The event
  has no time: any `slot="time"` child, empty or hidden included, silences the attribute, so a consumer can clear a
  time by emptying the slotted node. (a), the plan's reading, is taken; FR-023, US2-13 and `hasTime` stand as
  written.

And one decision from the research itself:

- **Decision 1 (R-03). The track's inline size. Decided: (a).** (a) The data table's host rule `:host .region-track {
  inline-size: fit-content }` (recommended). (b) A track-sizing option in 009's module (a change to 009's interface,
  outside this mission). (c) Keep the module's max-content: cells never wrap inside the element, and US1-9 changes.
