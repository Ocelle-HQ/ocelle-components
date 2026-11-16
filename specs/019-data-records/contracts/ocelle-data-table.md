# Contract: `ocelle-data-table`

Module `packages/elements/src/ocelle-data-table.ts`, class `OcelleDataTable`, one `define("ocelle-data-table", …)`.
It uses 009's internal `overflow-region.ts` exactly as `specs/009-workflow-layouts/contracts/overflow-region.md`
states (branch; rechecked by T001).

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
| slot | (default) | the first direct `<table>` child | | Other children are not shown after upgrade. |
| CSS parts | none | | | |
| CSS custom properties | none | | | |
| events | none | | | |

`aria-label` is observed (not a property). The class carries `@tagname ocelle-data-table`.

**Base-style hook (analysis I7 (a)).** The element writes two custom properties that `@ocelle/styles`' caption cap
reads: `--data-table-box-size` (the box's measured inline size, in px) and `--data-table-end-fade` (the end fade's
depth, `var(--ocelle-scroller-fade-size)`, while the end fade shows). They are a documented base-style hook between
`@ocelle/elements` and `@ocelle/styles`, so public surface under constitution VII: a rename or removal is a MAJOR
change from 1.0.0, and both packages' CHANGELOGs and READMEs name them. They are not in the manifest's CSS custom
property list, which lists what an element's styles read: the element writes them and never reads them, and a
consumer does not set them (the READMEs say so). They keep their names without the `--ocelle-` prefix, which the
`token-only` gate reserves for tokens.

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
`overflowRegionStyles`, holding `.region-track { --data-table-box-size: <n>px; --data-table-end-fade: … }`. Its own
`ResizeObserver` observes the measuring element `.box-size`, an empty `block-size: 0` node after `.region-frame`, and
writes its unrounded inline size there (the entry's `contentBoxSize[0].inlineSize`, equal to `.region-box`'s exact
width, never the rounded `clientWidth`; R-07). It does not observe `.region-box`: the written cap rewraps the caption,
which changes the box's block size and would raise a `ResizeObserver` loop error (PLAN-FRESH-3-001). When the
rendered `data-fade` moves into or out of `end` or `both`, `updated()` requests one animation frame (at most one
pending, cancelled on disconnect), whose callback reads the box's current `data-fade` and sets
`--data-table-end-fade: var(--ocelle-scroller-fade-size)` while the end fade shows or removes it otherwise. It is
never written in the task in which the fade changes, because that task is inside 009's `ResizeObserver` delivery and
the rewrap would raise the loop error (PLAN-FRESH-3-002 verify 1). The measuring element is one
internal node outside 009's structure; nothing of the module changes (FR-008). Both properties are the base-style
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
  as absent. The README's Host ARIA list names the data table with 009's elements (PLAN-CORRECTNESS-1-010).
- **Overflow, keys, fades, clearance, handover.** All of this is the module's. The element adds no listener for it.
- **Not touched.** The element writes nothing on the table or its descendants and emits no event.

## Accessibility tree (Chromium)

- **Fits.** The consumer's table exactly: a `table` named by its caption, with `row`, `columnheader`, `rowheader` and
  `cell`, and no ancestor node from the element.
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
that keeps a pinned start box out of the start fade (R-17) and does not change the module. Until that option is on
`main`, the caption is not sticky (Q-F, decided (b) by PLAN-FRESH-2-002's option (c)). It scrolls with the table, starts
at the table's start edge at every scroll position, and is reached by scrolling back. Once the option lands, the
caption becomes sticky at inset 0, a later MINOR.

## Look

The cells, headers, caption and rules come from `@ocelle/styles` ([styles-data-table.md](styles-data-table.md)).
The element itself paints no ground or border.
