# Data Model: Data Records

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

The elements hold no data of their own beyond their properties. The consumer's markup is the content; each entity
below is what an element reads and what it derives. Every property defaults to `undefined` and writes no attribute
while unset.

## Data table (`ocelle-data-table`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `label` | property / attribute `label` | `string \| undefined` | Names the region (R-04). Trimmed; empty or whitespace-only counts as absent. Not shown. |
| `wrap` | property / attribute `wrap`, reflected | `"anywhere" \| undefined` | `anywhere` sets `overflow-wrap: anywhere` on body cells through `base.css` (R-06); any other value acts as unset. |
| host `aria-label` | observed attribute | `string \| null` | Read by the module: non-blank names the region alone; blank counts as absent. Both states have stories (spike Q1 (b)). |
| `stickyHeader` | property, reflected as the boolean attribute `sticky-header` | `boolean \| undefined` | Present (any value): the module's block-axis option is on, the `<thead>` is pinned by `@ocelle/styles`, the host and frame are a column flex so the page's block bound on the host bounds the box (FR-017, FR-018, R-18). Absent: none of this. Toggles at run time. |
| `striped` | property, reflected as the boolean attribute `striped` | `boolean \| undefined` | Present (any value): `@ocelle/styles` paints each `<tbody>`'s even rows `--ocelle-color-inset` (FR-060, R-20). Read by nothing else. |
| pinned box | derived | `HTMLTableSectionElement \| null` | The assigned table's first direct `<thead>` child, passed to the module as `blockStartBox` while `sticky-header` is set; `null` otherwise or with no `<thead>`. |
| block bound | the page's rule on the host | `block-size` or `max-block-size` | Not an attribute or property: the consumer's own stylesheet (FR-017). With none the box is as tall as the table. |
| table | derived | `HTMLTableElement \| undefined` | The first direct child with `localName === "table"`; re-derived on every child-list change. |
| caption text | derived | `string \| undefined` | The assigned table's `caption`'s text nodes in tree order, skipping any element with `hidden` or `aria-hidden="true"` and its subtree, an `<img>` giving its `alt`; white space collapsed and trimmed; empty counts as absent (R-04). Re-read on any change in the subtree (`childList`, `characterData`, `hidden`, `aria-hidden`, `alt`). |
| name | derived | `string \| undefined` | `label` (non-blank), else caption text, passed to `setLabel`; the module puts a non-blank host `aria-label` first. |
| box size | derived, from layout | `number` (px) | `.region-box`'s exact (unrounded) inline size (less the box's block-axis scrollbar room, `offsetWidth − clientWidth`, while `sticky-header` is set: 15 px with classic scrollbars while the box overflows in the block axis and carries `data-axis="both"`, 0 with hidden scrollbars or without `data-axis`; no `scrollbar-gutter` is reserved, spike-2 Q-A1 (a); rewritten one animation frame after `data-axis` changes, spike-2 Q-3 (c), R-18), the `contentBoxSize[0].inlineSize` of the element's own `ResizeObserver` entry for its `block-size: 0` measuring element `.box-size` (never `.region-box` itself, PLAN-FRESH-3-001; never the rounded `clientWidth`, PLAN-FRESH-3-002 verify 1) and written as `--data-table-box-size` on `.region-track` in its per-instance sheet; caps the caption (R-07). Not a manifest member; with the end fade, the documented base-style hook between `@ocelle/elements` and `@ocelle/styles` (constitution VII surface, analysis I7 (a)). |
| end fade | derived, from the module's `data-fade` and from layout | `number` (px) | `--data-table-end-fade` on `.region-track` in the per-instance sheet, set to the measured px inline size of the module's `.region-edge.end` (its unrounded `getBoundingClientRect().width`, the fade depth; never a token's text, recheck Q2 (c)) while `.region-box` has `data-fade="end"` or `"both"` and removed otherwise, written in an animation frame requested from `updated()` when that state changes, never in the task of the change (outside 009's `ResizeObserver` delivery); the caption's cap subtracts it, zero otherwise (R-07, PLAN-FRESH-3-002 (b), verify 1). Part of the base-style hook with the box size (analysis I7 (a)). |
| overflow state | module (009) | `overflowing`, `offStart`, `offEnd`, `fadeAttribute`, `name` | As 009's contract states. Overflowing: the box is a tab stop, with `role="group"` and `aria-label` when named. With `sticky-header` (the block-axis option, contracts/overflow-region-block-axis.md) `overflowing` is true when either axis overflows, and the module writes `data-axis="both"` (block scrolling, `overflow-y: auto` with no reserved gutter, spike-2 Q-A1 (a)) only while the block axis overflows (spike-2 Q-3 (c)); the inline edges and fades are 009's, and the module adds `offBlockEnd` and `fadeBlockEnd` (rows below the box's block end, the room rule met, not suppressed), written by the module itself as `data-block-fade="end"` on the box (operator decision Q-I4). |
| numeric cell | the consumer's `data-ocelle-align="end"` on a cell | attribute (light DOM) | `@ocelle/styles`' hook (block 4, FR-019): `text-align: end` and tabular figures. Not a member of the element. |

**States**: fits (no tab stop, no role, no fade) ↔ overflows (tab stop; named `group` or unnamed; fades on the sides
with content off-screen). With `sticky-header`, "overflows" includes block overflow in a bounded host (ArrowUp and
ArrowDown scroll by the module's step, and PageUp, PageDown, Home, End, Space and Shift+Space by the browser,
re-analysis G1 (a); a block-end fade while rows are below, never under the header (measured from the `<thead>`'s current block-end edge, A1 (c) decided (a) after T082; under a tall caption in a small bound none at rest until the caption scrolls away), a `CanvasText` line in forced
colours), and the `<thead>` stays at the box's client block-start edge once scrolled (at rest it keeps the ring room above it, spike-2 Q-2 (a)). Look states from `@ocelle/styles`:
striped (even body rows on `inset`) and a hovered body row (on `hover-bg`, only on a device that can hover,
re-analysis A2 (a)), each shown in forced colours by the
first-cell row band. A transition happens on any module trigger (R-05; the phase 1 spike found no change that
escapes them). Column headers are named in the AX tree by their drawn upper-case text (spike Q2 (a)). Focus on the box when overflow ends moves
to the first focusable cell content or to the frame (009's handover).

## Event timeline (`ocelle-event-timeline`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `label` | property / attribute | `string \| undefined` | List name when the host `aria-label` is absent or blank (R-09). |
| host `aria-label` | observed attribute | `string \| null` | Non-blank names the list; blank counts as absent. Both states have stories (phase 2 spike Q1 (b)). |
| events | derived | `OcelleTimelineEvent[]` | Direct children with the item tag, neither `hidden` nor `aria-hidden="true"`, in source order. |
| name | derived | `string \| undefined` | `resolveName(host aria-label, label)` from 009's module (R-09); set on the shadow `<ol>` as `aria-label`; absent when undefined. |
| has time | derived per `<li>` | `boolean` | `hasTime(event)`: a slotted time, or a non-blank `time` (R-10); sets `has-time` on the `<li>`, which puts the marker on the time's line. |
| next has time | derived per `<li>` | `boolean` | `hasTime` of the next visible event; sets `next-has-time` on the `<li>`, so its connector ends `space-1` before the next dot (R-10). False on the last `<li>`. |

**States**: no visible event (no `<ol>` rendered) ↔ one or more (an `<ol>` with one `<li>` per event; the last `<li>`
renders no connector span). Before upgrade: one visible event per line, no attribute time (a slotted time shows inline
where written), an `aria-hidden="true"` event not shown (R-08).

## Timeline event (`ocelle-timeline-event`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `time` | property / attribute, reflected | `string \| undefined` | Shown as given in `part="time"` above the content (Q-C (a)) when the event has no slotted time; ignored (not shown, not exposed) while it has one. Absent, empty or white space counts as no attribute time (R-10). |
| slotted time | light DOM, direct children with `slot="time"` | elements (for example `<time datetime>`) | The visible ones (neither `hidden` nor `aria-hidden="true"`) are shown through the `time` slot in `part="time"`, styled to the time's type through `::slotted()`, never copied or written to. `hasSlottedTime(event)` (internal `timeline-time.ts`): at least one visible one has non-blank trimmed `textContent`. Empty, white-space-only or hidden counts as none, and the slot is then not rendered, so a non-blank `time` applies (plan gate Q-E; Q-G decided (a)). While the event has a slotted time, every visible one is shown in source order, a blank one included, which adds no item text (analysis A1). Setting or removing a child's `slot` attribute re-derives it (analysis G1). |
| has a time | derived | `boolean` | `hasTime(event)` from `timeline-time.ts`: `hasSlottedTime(event)`, or a non-blank `time`. False renders no time box and sets no `has-time` on the timeline's `<li>` (R-10). Re-derived from the event's own `MutationObserver` and the timeline's. |
| `wrap` | property / attribute, reflected | `"anywhere" \| undefined` | `overflow-wrap: anywhere` on `part="content"` only. |
| content | light DOM | inline markup | Shown in `part="content"` through the default slot; never copied. |

Item text (FR-016): the time (the slotted time's text when the event has one, else `time`), a space, the content's
text; the content's text alone when the event has no time. Time first wherever the slotted time sits in source.

## Evidence chain (`ocelle-evidence-chain`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `label` | property / attribute | `string \| undefined` | As the timeline's. |
| host `aria-label` | observed attribute | `string \| null` | Non-blank names the list; blank counts as absent. Two stories set it, non-blank and blank, each beside `label="Evidence"` (phase 3 spike Q1 (b); contracts/checks.md § Stories). |
| steps | derived | `OcelleEvidenceStep[]` | Direct children with the item tag, neither `hidden` nor `aria-hidden="true"`, in source order. |
| ordinal | derived per step | `number` | 1-based position among the visible steps, chip steps counted; shown only on default steps. |
| name | derived | `string \| undefined` | As the timeline's (`resolveName`). |
| line end | derived per step, from layout | `boolean` | True when the next visible step starts a new line, or for the last step; hides that step's connector span (R-12). |

## Evidence step (`ocelle-evidence-step`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `variant` | property / attribute, reflected | `"chip" \| undefined` | `chip`: no marker or ordinal, the container's chip box (R-12); any other value acts as unset. |
| `wrap` | property / attribute, reflected | `"anywhere" \| undefined` | `overflow-wrap: anywhere` on `part="content"`. |
| content | light DOM | inline markup | Shown in `part="content"` through the default slot. |

Item text: the content's text only (no ordinal).

## Relationships

- A container imports its item module (013's convention); an item outside its container shows its own shadow content
  as plain text with no list role, marker, ordinal, connector or chip box.
- The data table uses 009's internal module; it is not an item container and imports no element. The timeline and
  the chain import only `resolveName` from that module (R-09).
