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
| host `aria-label` | observed attribute | `string \| null` | Read by the module: non-blank names the region alone; blank counts as absent. |
| table | derived | `HTMLTableElement \| undefined` | The first direct child with `localName === "table"`; re-derived on every child-list change. |
| caption text | derived | `string \| undefined` | The assigned table's `caption`'s text nodes in tree order, skipping any element with `hidden` or `aria-hidden="true"` and its subtree, an `<img>` giving its `alt`; white space collapsed and trimmed; empty counts as absent (R-04). Re-read on any change in the subtree (`childList`, `characterData`, `hidden`, `aria-hidden`, `alt`). |
| name | derived | `string \| undefined` | `label` (non-blank), else caption text, passed to `setLabel`; the module puts a non-blank host `aria-label` first. |
| box size | derived, from layout | `number` (px) | `.region-box`'s client inline size, read when the element's own `ResizeObserver` reports its `block-size: 0` measuring element `.box-size` (never `.region-box` itself, PLAN-FRESH-3-001) and written as the internal `--data-table-box-size` on `.region-track` in its per-instance sheet; caps the caption (R-07). Not surface. |
| end fade | derived, from the module's `data-fade` | CSS length | The internal `--data-table-end-fade`, set to `--ocelle-scroller-fade-size` by the element's shadow styles on `.region-box[data-fade="end"]` and `[data-fade="both"]` only; the caption's cap subtracts it, zero otherwise (R-07, PLAN-FRESH-3-002 (b)). Not surface. |
| overflow state | module (009) | `overflowing`, `offStart`, `offEnd`, `fadeAttribute`, `name` | As 009's contract states. Overflowing: the box is a tab stop, with `role="group"` and `aria-label` when named. |

**States**: fits (no tab stop, no role, no fade) ↔ overflows (tab stop; named `group` or unnamed; fades on the sides
with content off-screen). A transition happens on any module trigger (R-05). Focus on the box when overflow ends moves
to the first focusable cell content or to the frame (009's handover).

## Event timeline (`ocelle-event-timeline`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `label` | property / attribute | `string \| undefined` | List name when the host `aria-label` is absent or blank (R-09). |
| host `aria-label` | observed attribute | `string \| null` | Non-blank names the list; blank counts as absent. |
| events | derived | `OcelleTimelineEvent[]` | Direct children with the item tag, neither `hidden` nor `aria-hidden="true"`, in source order. |
| name | derived | `string \| undefined` | `resolveName(host aria-label, label)` from 009's module (R-09); set on the shadow `<ol>` as `aria-label`; absent when undefined. |

| next has time | derived per `<li>` | `boolean` | `hasTime` of the next visible event's `time`; sets `next-has-time` on the `<li>`, so its connector ends `space-1` before the next dot (R-10). False on the last `<li>`. |

**States**: no visible event (no `<ol>` rendered) ↔ one or more (an `<ol>` with one `<li>` per event; the last `<li>`
renders no connector span). Before upgrade: one visible event per line, no time, an `aria-hidden="true"` event not
shown (R-08).

## Timeline event (`ocelle-timeline-event`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `time` | property / attribute, reflected | `string \| undefined` | Shown as given in `part="time"` above the content (Q-C). "Has a time" is `hasTime(time)` from the internal `timeline-time.ts`: a string whose trimmed value is not empty. Absent, empty or white space renders no time box and sets no `has-time` on the timeline's `<li>` (R-10). |
| `wrap` | property / attribute, reflected | `"anywhere" \| undefined` | `overflow-wrap: anywhere` on `part="content"` only. |
| content | light DOM | inline markup | Shown in `part="content"` through the default slot; never copied. |

Item text (FR-016): `time`, a space, the content's text; the content's text alone when the event has no time.

## Evidence chain (`ocelle-evidence-chain`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `label` | property / attribute | `string \| undefined` | As the timeline's. |
| host `aria-label` | observed attribute | `string \| null` | As the timeline's. |
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
