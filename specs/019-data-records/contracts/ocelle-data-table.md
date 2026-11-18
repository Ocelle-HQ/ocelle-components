# Contract: `ocelle-data-table`

Module `packages/elements/src/ocelle-data-table.ts`, class `OcelleDataTable`, one `define("ocelle-data-table", …)`.
It uses 009's internal `overflow-region.ts` exactly as `specs/009-workflow-layouts/contracts/overflow-region.md`
states (rechecked by T001), with the one amendment of [overflow-region-block-axis.md](overflow-region-block-axis.md):
while `sticky-header` is set it turns the module's block-axis option on (FR-017, FR-018; inventory decision IQ-2).

## Usage

```html
<ocelle-data-table label="Work packages">
  <table>
    <caption>Work packages</caption>
    <thead><tr><th scope="col">Id</th><th scope="col">Title</th><th scope="col">Lane</th></tr></thead>
    <tbody><tr><th scope="row">WP01</th><td>Spec</td><td>Done</td></tr></tbody>
  </table>
</ocelle-data-table>
```

## Public surface (manifest)

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `label` | `string \| undefined` | `undefined` | Names the scroll region while the table overflows; not shown. |
| property / attribute | `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks long identifiers in body cells anywhere. |
| property / attribute | `stickyHeader` / `sticky-header` (reflected, boolean) | `boolean \| undefined` | `undefined` | Present (any value): the `<thead>` stays pinned at the region's block start while the body scrolls in a block size the page bounds on the host (FR-017). |
| property / attribute | `striped` (reflected, boolean) | `boolean \| undefined` | `undefined` | Present (any value): even body rows get the `--ocelle-color-inset` ground through `@ocelle/styles` (FR-060). |
| slot | (default) | the first direct `<table>` child | | Other children are not shown after upgrade. |
| CSS parts | none | | | |
| CSS custom properties | none | | | |
| events | none | | | |

`aria-label` is observed (not a property). The class carries `@tagname ocelle-data-table`.

**Base-style hook (analysis I7 (a)).** The element writes two custom properties that `@ocelle/styles`' caption cap
reads: `--data-table-box-size` (the box's measured inline size, in px) and `--data-table-end-fade` (the end fade's
depth, the measured px inline size of `.region-edge.end`, while the end fade shows; recheck Q2 (c)). They are a
documented base-style hook between `@ocelle/elements` and `@ocelle/styles`, so public surface under constitution VII:
a rename or removal is a MAJOR change from 1.0.0, and both packages' CHANGELOGs and READMEs name them. They are not
in the manifest's CSS custom property list, which lists what an element's styles read: the element writes them and
never reads them, and a consumer does not set them (the READMEs say so). They keep their names without the `--ocelle-`
prefix, which the `token-only` gate reserves for tokens.

## Shadow structure

`overflowRegionStyles` is added after the element's own styles. The element's own styles are:

- `:host { display: block; min-inline-size: 0; }`, so the element shrinks as a default flex item or a grid item and
  its region overflows instead of the page (R-02, FR-009);
- `:host([hidden]) { display: none; }`;
- `:host .region-track { inline-size: fit-content; }` (R-03, decision 1 (a), decided at the plan gate);
- `:host .box-size { block-size: 0; }`, the measuring element below (R-07, PLAN-FRESH-3-001 (a)).

No shadow rule selects on `data-fade`: the end fade's share of the caption's cap is written by script one animation
frame after the fade changes (below; R-07, PLAN-FRESH-3-002 (b), verify 1).

No box sets `container-type` (PLAN-FRESH-2-001): inline size containment would make the element 0 px wide in a
shrink-to-fit host (R-02). The element adopts one per-instance constructed sheet of its own, after
`overflowRegionStyles` and beside the module's per-instance sheet, holding `.region-track { --data-table-box-size:
<n>px; --data-table-end-fade: <m>px }`: px figures measured from layout only, as the README's Styles convention
requires, amended in phase 1 for the count of per-instance sheets (research R-07, recheck Q2 (c)). Its own
`ResizeObserver` observes the measuring element `.box-size`, an empty `block-size: 0` node after `.region-frame`, and
writes its unrounded inline size there (the entry's `contentBoxSize[0].inlineSize`, equal to `.region-box`'s exact
width, never the rounded `clientWidth`; R-07). It does not observe `.region-box`: the written cap rewraps the caption,
which changes the box's block size and would raise a `ResizeObserver` loop error (PLAN-FRESH-3-001). When the
rendered `data-fade` moves into or out of `end` or `both`, `updated()` requests one animation frame (at most one
pending, cancelled on disconnect), whose callback reads the box's current `data-fade` and, while the end fade shows,
sets `--data-table-end-fade` to the measured px inline size of `.region-edge.end` (its unrounded
`getBoundingClientRect().width`, the fade depth), or removes it otherwise. It never writes a token's text such as
`var(--ocelle-scroller-fade-size)` (recheck Q2 (c)). It is
never written in the task in which the fade changes, because that task is inside 009's `ResizeObserver` delivery and
the rewrap would raise the loop error (PLAN-FRESH-3-002 verify 1). The measuring element is one
internal node outside 009's structure and changes nothing of the module (FR-008; the module's one change is
FR-018's block-axis option, § Sticky header row). Both properties are the base-style
hook of § Public surface (no `--ocelle-` prefix, not in the manifest, documented in both READMEs; analysis I7 (a)).

The README's Sizing line has two parts. A wrapper that is itself the flex or grid item, around the element, needs
`min-inline-size: 0` too. In a shrink-to-fit host (a dialog, an inline-block, a start-aligned flex) the data table
takes its table's width and overflows only when its own inline size is bounded, as 015's README says of the scroller.

```html
<div class="region-frame">
  <div class="region-box" data-fade="…">          <!-- tabindex, role="group", aria-label: the module's -->
    <div class="region-track"><slot></slot></div> <!-- manual assignment: the table -->
  </div>
  <div class="region-ring" aria-hidden="true"></div>
  <div class="region-edge start" aria-hidden="true"></div>
  <div class="region-edge end" aria-hidden="true"></div>
  <div class="region-edge block-end" aria-hidden="true"></div> <!-- the block-axis option's edge (Q-I4) -->
</div>
<div class="box-size" aria-hidden="true"></div>   <!-- the caption cap's measuring element, block size 0 -->
```

## Behaviour

- **Hidden host.** `:host([hidden])` gives no box and no node; a host `aria-hidden="true"` keeps the table shown and
  removes the region and the table from the accessibility tree (the Host ARIA rule, FR-015). Browser bodies assert
  both (analysis G3).

- **Assignment.** `slotAssignment: "manual"`. In `updated()`, and on a child-list change seen by its
  `MutationObserver`, the slot is assigned the first direct `table` child or nothing.
- **Name.** `setLabel(label?.trim() || captionText || undefined)` after each render, with `captionText` from R-04:
  the caption's text nodes in tree order, skipping any element with `hidden` or `aria-hidden="true"` and its subtree,
  an `<img>` giving its `alt`, white space collapsed and trimmed; empty counts as absent. The `MutationObserver`
  watches the subtree (`childList`, `characterData`, and the attributes `hidden`, `aria-hidden` and `alt`) and
  requests an update when the caption text changes.
- **Host ARIA.** The region takes the module's rule: a non-blank host `aria-label` names it alone, a blank one counts
  as absent. The README's Host ARIA list names the data table with 009's elements (PLAN-CORRECTNESS-1-010). Chromium
  also shows the host as a `generic` node of the host's name beside the `group`; axe-core 4.14.0 reports nothing on
  it, blank or not (spike § 2), so both states have stories (spike Q1 (b), contracts/checks.md § Stories).
- **Overflow, keys, fades, clearance, handover.** All of this is the module's, the block-end fade of the block-axis
  option included. The element adds no listener for it.
- **Not touched.** The element writes nothing on the table or its descendants and emits no event.

## Accessibility tree (Chromium)

- **Fits.** The consumer's table exactly: a `table` named by its caption, with `row`, `columnheader`, `rowheader` and
  `cell`, and no ancestor node from the element but `generic` wrappers. Each `columnheader` and its static text are
  named by the drawn, upper-case text of block 1's eyebrow ("ID" for "Id"; spike § 1), as for any table given that
  style: the element adds nothing to the names. US1-1 compares with an outside table given the same upper case by a
  test-only rule and asserts the upper-case names; both READMEs state it (spike Q2 (a)).
- **Overflows, named.** A `group` named by the name in force, holding that same table.
- **Overflows, unnamed.** The box is focusable with no role and no name, as 009's contract states. The README asks
  for a caption or a `label`.

## Caption and the start fade (R-07, R-17)

The caption is capped by the box's measured width (`--data-table-box-size`, falling back to
`--ocelle-measure-container` before the first measurement and before upgrade), less the track's ring room on both
sides and less the end fade only while it shows, so it wraps inside the box's unmasked width at rest and a fitting
table's cap is the table's own width. The caption has no inline size containment: its longest word widens the table,
as CSS tables do, so a fitting table never overflows because of its caption (PLAN-FRESH-3-002 (b)). The observer
watches the measuring element, whose size the cap cannot change, and writes its exact width, and the end fade's share
is written one frame after the fade changes, outside any `ResizeObserver` delivery, so neither write can feed back
(R-07). For that one frame the caption may run under a newly shown end fade. 009's start fade masks the box's start edge, so
a caption pinned at `inset-inline-start: 0` would fade there. The data table asks 009's owner for a module option
that keeps a pinned start box out of the start fade (R-17) and does not make that change itself (FR-008 allows
only the block-axis option of FR-018). Until that option is on
`main`, the caption is not sticky (Q-F, decided (b) by PLAN-FRESH-2-002's option (c)). It scrolls with the table, starts
at the table's start edge at every scroll position, and is reached by scrolling back. Once the option lands, the
caption becomes sticky at inset 0, a later MINOR.

## Sticky header row (FR-017, FR-018; research R-18; inventory decision IQ-2)

While `sticky-header` is present (the property `stickyHeader` reflects it; any value, the empty string included):

- **Module.** The element constructs its `OverflowRegion` with `blockAxis: () => this.stickyHeader === true` and
  `blockStartBox: () => <the assigned table's first direct <thead> child> ?? null`
  ([overflow-region-block-axis.md](overflow-region-block-axis.md)). The module then puts `data-axis="both"` on the
  box, scrolls it in both axes, takes the tab stop while either axis overflows, handles ArrowUp and ArrowDown (and
  leaves PageUp, PageDown, Home, End, Space and Shift+Space to the browser, which scrolls the focused box; the
  operator's decision G1 (a), 2026-11-18) and keeps a focused body element clear of the pinned `<thead>` and of the
  block-end fade, measured from the pinned-box measure the operator chooses after T082 (A1 (c);
  [overflow-region-block-axis.md](overflow-region-block-axis.md) § The pinned-box measure). The element adds no listener
  and no scroll write.
- **The block-end fade (operator decision Q-I4, 2026-11-18).** While rows are below the box's block end the module
  writes `data-block-fade="end"` on the box and fades its block end over the fade depth; never at the block start,
  never under the pinned `<thead>` (the module's room rule: no fade when less than twice the fade depth shows below
  the header row), together with the inline fades when the table also overflows sideways (a corner faded by both),
  and in forced colours as a `CanvasText` line drawn by `.region-edge.block-end`. The element renders that edge after
  009's two (§ Shadow structure, always; it paints nothing and is read by nothing while `sticky-header` is absent)
  and binds nothing for the fade: no `data-block-fade` binding, no rule of its own on it. The caption's cap is
  unaffected (the block-end fade is not in the inline axis), and no shadow rule of the element selects on
  `data-block-fade`.
- **The bound.** Its own styles add `:host([sticky-header]) { display: flex; flex-direction: column; }`,
  `:host([sticky-header]) .region-frame { display: flex; flex-direction: column; min-block-size: 0; }` and
  `:host([sticky-header]) .region-box { min-block-size: 0; }`, so a block size the page sets on the host
  (`block-size` or `max-block-size`, in the page's own stylesheet) bounds the box, and with no bound the box is as tall
  as the table. The element sets no block size itself and reads no attribute for it.
- **The pin and its ground.** `@ocelle/styles` (block 1) makes the `<thead>` `position: sticky` at
  `inset-block-start: 0`, paints its cells `--ocelle-color-sheet` (the operator's decision Q-I1, 2026-11-18) and
  switches the table to `border-collapse: separate` with `border-spacing: 0`, so the header rule travels with the row
  ([styles-data-table.md](styles-data-table.md)). The `<thead>` scrolls with the region in the inline axis, so each
  column header stays above its column.
- **The caption cap.** `scrollbar-gutter: stable` reserves the block-axis scrollbar's room, so `.box-size`'s inline
  size exceeds the box's client inline size by a constant gutter. While `sticky-header` is set, the `.box-size`
  observer's callback writes `--data-table-box-size` as the measured inline size less the box's `offsetWidth −
  clientWidth` (the gutter, read in the same callback), px only, so the caption still wraps inside the box's unmasked
  width (R-07, R-18). Without `sticky-header` the write is as before.
- **Toggling.** Setting or removing `sticky-header` re-renders; the module re-reads `blockAxis` in `hostUpdated` and
  takes or drops the block axis, `data-axis` and `data-block-fade`, and the tab stop follows the new overflow state.

**Accessibility tree.** Unchanged: the same `group` (while either axis overflows) holding the consumer's table. The
pinned `<thead>` is the same `row` and `columnheader` nodes.

## Striped rows, row hover and numeric cells

- `striped` (reflected, boolean) only reflects: `@ocelle/styles` (block 1) paints the even body rows' cells
  `--ocelle-color-inset` on `ocelle-data-table[striped]` (FR-060). The element reads the property nowhere else.
- The row hover is `@ocelle/styles`' (block 1) rule on a hovered `<tbody>` row, `--ocelle-color-hover-bg`, after the
  stripe rule, inside `@media (hover: hover)`, so a device with no hover shows nothing (FR-061; A2 (a)). The element adds nothing for it: no listener, no event, no cursor.
- An end-aligned numeric column is the consumer's `data-ocelle-align="end"` on its cells, `@ocelle/styles`' hook
  (block 4, FR-019). The element knows nothing of it.
- In forced colours the stripe and the hover are drawn by the row band of block 1 (FR-013).

## Look

The cells, headers, caption, rules, stripes, hover ground, pinned header ground and the forced-colours row band come
from `@ocelle/styles` ([styles-data-table.md](styles-data-table.md)). The element itself paints no ground or border.
