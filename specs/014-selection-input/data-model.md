# Data model: Selection and Input Elements (014)

Plain data the internal pure modules (`src/selection.ts`, `src/roving.ts`; research R-04, R-05) work on. None of it is
public surface except what `contracts/elements.md` lists.

## Child entry

| Field | Type | Source | Rule |
|---|---|---|---|
| `node` | element | the parent's assigned elements of its kind (`ocelle-option`, `ocelle-tab`, `ocelle-segment`) | document order |
| `value` | string | `value` attribute, trimmed; blank → index as string | FR-009; never `""` |
| `disabled` | boolean | `disabled` attribute | FR-009 |
| `index` | number | position among the parent's children of its kind | disabled children counted |

`ocelle-tab-panel` entries are paired with tab entries by index; unpaired extras are hidden (FR-019).

## Selection state (per parent)

| Field | Type | Meaning |
|---|---|---|
| `selected` | child node or `null` | the selected option / tab, the pressed segment |
| `remembered` | string or `null` | FR-010a: last non-empty host value no enabled child had |
| `lastFocused` | child node or `null` | listbox tab stop fallback (FR-016) |
| `kind` | `"listbox"` / `"tabs"` / `"segments"` | listbox may have no selection; the others keep one while any child is enabled |

### Transitions

| Event | Listbox | Tabs, segments |
|---|---|---|
| host sets `value = v`, enabled child has `v` | select first such; forget `remembered` | same |
| host sets `value = v` equal to current `value` | no change; forget `remembered` | same |
| host sets `""` | clear selection; forget | keep selection; forget |
| host sets `v` no enabled child has | clear selection; `remembered = v` | keep selection (first enabled on first render); `remembered = v` |
| user selects child | select; emit change; forget | select; emit change; forget |
| batch: children added / enabled / value changed | if `remembered` matches an enabled child: select it, forget | Precedence: remembered match, else keep, else first enabled |
| batch: selected child removed | `value` → `""`, no event | FR-011a: next enabled after, else nearest before; remembered first |
| batch: selected child disabled | stays selected, loses tab stop | FR-011a as for removal |
| batch: focused child removed | focus FR-011 target | same (= selection target when it was selected) |
| batch: child moved (same node removed and re-added in one batch) | keeps focus and selection | same |

No transition emits an event except "user selects child" (FR-002).

## Roving input

`target(key, { index, enabled: boolean[], wrap, rtl, axis })` → next index or `null` (unhandled). `axis` `"block"`
(listbox), `"inline"` (tabs), `"both"` (segments). Home/End → first/last enabled; all disabled → `null` for moves.

## Copy field state

| Field | Type | Rule |
|---|---|---|
| `value` | string | shown and requested as is (FR-031) |
| `status` | string | host-set; region content when non-blank; cleared by a request and by a `value` change after first render (FR-041, FR-042) |
| `copyLabel` | string | trimmed, default `"Copy"` (FR-034) |

## Link state

| Field | Type | Rule |
|---|---|---|
| `href` | string or `null` | as written; event `detail.href` |
| `resolved` | URL or `null` | `new URL(href, document.baseURI)`; `null` when it throws |
| `allowed` | boolean | `resolved.protocol` ∈ {`http:`, `https:`, `location.protocol`} (FR-047) |
