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

## Shadow structure

`overflowRegionStyles` is added after the element's own styles. The element's own styles are:

- `:host { display: block; min-inline-size: 0; }`, so the element shrinks as a default flex item or a grid item and
  its region overflows instead of the page (R-02, FR-009);
- `:host([hidden]) { display: none; }`;
- `:host .region-track { inline-size: fit-content; }` (R-03, decision 1);
- `:host .region-box { container-type: inline-size; }`, the query container the caption's cap resolves against
  through the flat tree (R-07). It adds inline size containment to the box.

The README's Sizing line: a wrapper that is itself the flex or grid item, around the element, needs
`min-inline-size: 0` too.

```html
<div class="region-frame">
  <div class="region-box" data-fade="…">          <!-- tabindex, role="group", aria-label: the module's -->
    <div class="region-track"><slot></slot></div> <!-- manual assignment: the table -->
  </div>
  <div class="region-ring" aria-hidden="true"></div>
  <div class="region-edge start" aria-hidden="true"></div>
  <div class="region-edge end" aria-hidden="true"></div>
</div>
```

## Behaviour

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

The caption is sticky at the box's start edge and capped by `--ocelle-measure-container` (the box's width), less the
end fade and the track's ring room, so it wraps inside the box's unmasked width. 009's start fade masks the box's
start edge, so a caption pinned at `inset-inline-start: 0` would fade there. The data table asks 009's owner for a
module option that keeps a pinned start box out of the start fade (R-17) and does not change the module. Until that
option is on `main`, the caption's inset and cap follow the operator's answer to Q-F (plan default (a): inset and cap
by the fade depth).

## Look

The cells, headers, caption and rules come from `@ocelle/styles` ([styles-data-table.md](styles-data-table.md)).
The element itself paints no ground or border.
