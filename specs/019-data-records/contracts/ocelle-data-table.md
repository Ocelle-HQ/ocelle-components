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

`overflowRegionStyles` is added after the element's own styles. The element's own styles are `:host { display:
block; }`, `:host([hidden]) { display: none; }` and `:host .region-track { inline-size: fit-content; }` (R-03,
decision 1).

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
- **Name.** `setLabel(label?.trim() || captionText || undefined)` after each render, with `captionText` from R-04.
  The `MutationObserver` watches the subtree (`childList`, `characterData`) and requests an update when the caption
  text changes.
- **Overflow, keys, fades, clearance, handover.** All of this is the module's. The element adds no listener for it.
- **Not touched.** The element writes nothing on the table or its descendants and emits no event.

## Accessibility tree (Chromium)

- **Fits.** The consumer's table exactly: a `table` named by its caption, with `row`, `columnheader`, `rowheader` and
  `cell`, and no ancestor node from the element.
- **Overflows, named.** A `group` named by the name in force, holding that same table.
- **Overflows, unnamed.** The box is focusable with no role and no name, as 009's contract states. The README asks
  for a caption or a `label`.

## Look

The cells, headers, caption and rules come from `@ocelle/styles` ([styles-data-table.md](styles-data-table.md)).
The element itself paints no ground or border.
