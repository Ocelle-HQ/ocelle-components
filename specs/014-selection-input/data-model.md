# Data model: Selection and Input Elements (014)

Plain data the internal pure modules (`src/selection.ts`, `src/roving.ts`, `src/link-target.ts`; research R-04, R-05,
R-08) work on. None of it is public surface except what `contracts/elements.md` lists.

## Child entry

| Field | Type | Source | Rule |
|---|---|---|---|
| `node` | element | the host's direct children of its kind (`ocelle-option`, `ocelle-tab`, `ocelle-segment`), from a `MutationObserver` on the host's `childList` (R-05), not from slot assignment | document order |
| `value` | string | `value` attribute as written; missing or blank (only whitespace) → index as string | FR-009; never `""`; not trimmed |
| `disabled` | boolean | `disabled` attribute | FR-009 |
| `index` | number | position among the parent's children of its kind | disabled children counted |

`ocelle-tab-panel` entries are paired with tab entries by index. `ocelle-tabs` assigns the paired tabs to the slot in
`part="tablist"` and only the selected tab's paired panel to the slot in `part="panels"`, on each batch (manual slot
assignment); unpaired tabs and panels are assigned nowhere and are not in the roving list (FR-019, SPEC-1-25). Every
paired tab carries `aria-controls`; only the assigned panel carries `aria-labelledby`, removed when it is unassigned
(R-02, PLAN-FRESH-2-002). The tablist's name is not part of this model: `part="tablist"` takes its `aria-label`
from the tabs' `label` only; a host `aria-label` on `ocelle-tabs` is not an input (FR-006's tabs exception, R-01).

## Selection state (per parent)

| Field | Type | Meaning |
|---|---|---|
| `selected` | child node or `null` | the selected option / tab, the pressed segment |
| `remembered` | string or `null` | FR-010a: last non-empty host value no enabled child had |
| `focused` | child node or `null` | the child that has focus, set on `focusin` on a child, cleared on `focusout` (R-03; all kinds) |
| `blurred` | child node or `null` | set only by a `focusout` from a child whose `relatedTarget` is `null` (a `focusout` with a non-null `relatedTarget`, the user going to a known element, records nothing and clears it); the handler queues a microtask at once that calls the host observer's `takeRecords()` and keeps `blurred` as "had focus" only when those records list it in `removedNodes` (the removal caused the blur; Chromium runs the handler inside the `remove()` / `insertBefore()` call), processing them as the batch; otherwise cleared there. Also cleared by any `focusin` on a child. No task clears it (R-03, PLAN-FRESH-2-001, PLAN-FRESH-3-001) |
| `lastFocused` | child node or `null` | listbox tab stop fallback (FR-016) |
| `kind` | `"listbox"` / `"tabs"` / `"segments"` | listbox may have no selection; the others keep one while any child is enabled |

### Batching

Records of the host's `MutationObserver` (child list, and `value` / `disabled` attributes of the children) are
processed in one batch per microtask checkpoint (FR-010a "one operation", operator decision PLAN-CORRECTNESS-1-014
(a)). The `value` setter first takes pending records (`takeRecords()`) and processes them as a batch, so it decides on
the live child list.

### Transitions

| Event | Listbox | Tabs, segments |
|---|---|---|
| host sets `value = v`, enabled child has `v` | select first such; forget `remembered` | same |
| host sets `value = v` equal to current `value` | no change, no mutation; forget `remembered` | same |
| host sets `""` | clear selection; forget | keep selection; forget |
| host sets `v` no enabled child has | clear selection; `remembered = v` | keep selection (first enabled on first render); `remembered = v` |
| user selects child | select; emit change; forget | select; emit change; forget |
| user activates selected option (Enter; double-click on an enabled option) | emit activate (after the change of the double-click's first click, if any) | n/a |
| batch: children added / enabled / value changed | if `remembered` matches an enabled child: select it, forget | Precedence: remembered match, else keep, else first enabled |
| batch: selected child removed | `value` → `""`, no event | FR-011a: next enabled after, else nearest before; remembered first |
| batch: selected child disabled | stays selected, loses tab stop; keeps focus if focused (`tabindex="-1"`) | FR-011a as for removal; focus moves with the selection if the child had focus |
| batch: focused child removed (`blurred` is that child, the records taken by its `focusout` microtask list it in `removedNodes`, node gone, focus on the body or `null`) | focus FR-011 target | same (= selection target when it was selected) |
| batch: child moved (node present before and after, the same position included) | keeps selection; refocused only if `blurred` is that child, the records taken by its `focusout` microtask list it in `removedNodes`, and focus is on the body or `null` | same |
| batch: child moved or removed after the user's blur (a later task, a host microtask or `requestAnimationFrame` after the blur, or any blur with a non-null `relatedTarget`; `blurred` null or not in the taken records) | focus left where it is (no focus stolen back, the user can leave the parent) | same |

No transition emits an event except "user selects child" (FR-002) and the listbox's user activation (FR-014a).

## Roving input

`owns(event, children)` → `true` only when the keydown's target is one of `children` itself and
`event.defaultPrevented` is false (R-04's origin filter). Then
`target(key, { index, enabled: boolean[], wrap, rtl, axis })` → next index or `null` (unhandled). `axis` `"block"`
(listbox), `"inline"` (tabs), `"both"` (segments). Home/End → first/last enabled; all disabled → `null` for moves.
Disabled children stay in the list with `enabled` false (focusable at `tabindex="-1"`, skipped by every move).

## Copy field state

| Field | Type | Rule |
|---|---|---|
| `value` | string | shown and requested as is (FR-031); not reflected |
| `status` | string | host-set, not reflected; region text node written imperatively when the text differs; cleared by a request and by a `value` change after first render (FR-041, FR-042) |
| `copyLabel` | string | trimmed, default `"Copy"` (FR-034) |
| pending requests | text captured per activation | each dispatched after the next rendering update (R-07); dropped if disconnected |

## Link state

| Field | Type | Rule |
|---|---|---|
| `href` | string or `null` | as written, reflected; event `detail.href` |
| target | URL string or `null` | `navigationTarget(href, document.baseURI, location.protocol)`, evaluated at each activation (and to refresh the anchor's `href` presence on `href` change and at each activation's first event) |
| allowed | boolean | target not `null`: `new URL(href, baseURI)` parses and its protocol ∈ {`http:`, `https:`, `documentProtocol`} (FR-047); `""` and fragments allowed when they resolve to such a URL |
