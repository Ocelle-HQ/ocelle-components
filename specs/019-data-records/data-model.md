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
| caption text | derived | `string \| undefined` | The assigned table's `caption`'s `textContent`, white space collapsed and trimmed; empty counts as absent. Re-read on any change in the subtree. |
| name | derived | `string \| undefined` | `label` (non-blank), else caption text, passed to `setLabel`; the module puts a non-blank host `aria-label` first. |
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
| name | derived | `string \| undefined` | Set on the shadow `<ol>` as `aria-label`; absent when undefined. |

**States**: no visible event (no `<ol>` rendered) ↔ one or more (an `<ol>` with one `<li>` per event; the last `<li>`
has no connector).

## Timeline event (`ocelle-timeline-event`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `time` | property / attribute | `string \| undefined` | Shown as given in `part="time"` above the content (Q-C); empty or absent renders no time box. |
| `wrap` | property / attribute, reflected | `"anywhere" \| undefined` | `overflow-wrap: anywhere` on `part="content"` only. |
| content | light DOM | inline markup | Shown in `part="content"` through the default slot; never copied. |

Item text (FR-016): `time`, a space, the content's text; the content's text alone with no `time`.

## Evidence chain (`ocelle-evidence-chain`)

| Field | Source | Type | Rule |
|---|---|---|---|
| `label` | property / attribute | `string \| undefined` | As the timeline's. |
| host `aria-label` | observed attribute | `string \| null` | As the timeline's. |
| steps | derived | `OcelleEvidenceStep[]` | Direct children with the item tag, neither `hidden` nor `aria-hidden="true"`, in source order. |
| ordinal | derived per step | `number` | 1-based position among the visible steps, chip steps counted; shown only on default steps. |
| line end | derived per step, from layout | `boolean` | True when the next visible step starts a new line, or for the last step; hides that step's connector (R-12). |

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
- The data table uses 009's internal module; it is not an item container and imports no element.
