# Data model: Workflow and Screen Layouts

These elements hold no data of their own. The entities below are the state each element keeps and the rules that
change it. Sources are spec FR-001 to FR-029 and research.md.

## Overflow-region state (`OverflowRegion`, contracts/overflow-region.md)

| Field | Type | Rule |
|---|---|---|
| `overflowing` | boolean | `scrollWidth − clientWidth > 1`; the inline ring room is part of `scrollWidth` |
| `offStart` | boolean | `abs(scrollLeft) > 1` |
| `offEnd` | boolean | `scrollWidth − clientWidth − abs(scrollLeft) > 1` |
| `suppressed` | set of `start`, `end` | set by the focus fallback (R-06); cleared on `focusout` of the focused element, or on a `scroll` whose `scrollLeft` differs from `written` by more than 1 px |
| `written` | px or none | the `scrollLeft` the module last wrote, read back after the write (so clamping is included); none when nothing is suppressed |
| `fadeStart` / `fadeEnd` | boolean | `offStart` / `offEnd` and the side not in `suppressed` |
| `name` | string or none | the trimmed non-blank host `aria-label`, else the trimmed non-blank `label`, else none |
| `role` | `group` or `region` | the constructor option: `group` by default (scroller, #13), `region` for the board |
| `fadeAttribute` | `start`, `end`, `both` or none | from `fadeStart` / `fadeEnd`; none when neither is set, so the box has no `data-fade` attribute and no mask (PLAN-FRESH-2-006) |
| `maskFigures` | { client, bar } px | the box's `clientHeight` and its scrollbar thickness (`offsetHeight − clientHeight` less block borders, 0 with overlay scrollbars), read whenever the state is written; set as the `mask-size` of the module's per-instance constructed stylesheet when either changed, never to a `style` attribute (R-05, PLAN-FRESH-2-001 (a)) |

**Transitions.**
- not overflowing → overflowing: the box gains its tab stop, plus the role (`role`) and name when it has a name.
- overflowing → not overflowing: the box loses all three. If the box had focus, focus is handed over (R-07): to the
  first focusable slotted element in the flat tree, else to `.region-frame` with a temporary `tabindex="-1"`.
- The state is written in the `ResizeObserver` callback, `slotchange` or `scroll` handler that observed the change,
  never in a later frame (R-03). For the board, a width-only change inside a lane waits for the next such event
  (FR-014).

## Lane

| Field | Type | Rule |
|---|---|---|
| `title` | string or none | `label` trimmed; blank is none |
| `count` | safe integer ≥ 0, or none | the attribute is `^[0-9]+$` after trimming, ≤ `MAX_SAFE_INTEGER`; the property is a safe integer ≥ 0 |
| `countText` | string or none | `count-label` trimmed and non-blank, else `String(count)` when `count` is set |
| `groupName` | string or none | the trimmed non-blank host `aria-label`; else `title, countText`, `title`, or `countText`; none when neither title nor count |
| `variant` | `default` or `flat` | `"flat"` gives flat; any other value gives default |

The lane has the group role exactly when `groupName` is set.

## list-detail

| Field | Type | Rule |
|---|---|---|
| `measured` | px | the host's border-box inline size from its `ResizeObserver` |
| `collapseAt` | px | `collapse-below` parsed (R-12), else the token parsed, else 40rem; resolved at each measurement |
| `inspectorAt` | px | as above with `inspector-below`, the inspector token and 60rem |
| `hasInspector` | boolean | the `inspector` slot has an assigned element; the slot is always rendered, so `slotchange` sees an inspector added after first render (R-11) |
| `tier` | `three`, `two` or `one` | `one` if `narrow` or `measured < collapseAt`; else `two` if `measured < inspectorAt`, or if `hasInspector` is false (two columns without an inspector); else `three` |
| `shown` | set of panes | `three` or `two`: list, detail, and the inspector if present. `one`: the detail and the inspector if `detail-open`, else the list |
| `intrinsic` | { min, max } px | from the measurement pass (R-13): the one-column stack's min-content and the three-column grid's max-content; written to the instance's adopted constructed stylesheet (the one per-instance sheet FR-030 allows), never to a `style` attribute |

**Re-measure triggers (R-13, PLAN-FRESH-2-002 (a)).** The measurement pass runs on `slotchange` of any of the three
slots; on a `MutationObserver` delivery (`childList`, `characterData`, `attributes`, `subtree`) from the assigned
elements of any pane, shown or hidden, one pass per delivery; and before applying a `tier` or `detail-open` change that
comes from a property or attribute. It writes a figure only when it changed. The host's `ResizeObserver` updates
`measured` and the tier only and never runs the pass, so the figures are never written inside a `ResizeObserver`
delivery. A size change in a pane with no DOM mutation (an image or a font loading) is picked up at the next of these
triggers (FR-025).

**Focus rule (R-14).** If a change of `tier` or `detail-open` hides the pane that holds `document.activeElement`,
the shown pane's wrapper gets `tabindex="-1"` and focus after the update, and loses the attribute on its `focusout`.
At rest no wrapper has a `tabindex`. At first render the same rule applies, and nothing else moves focus.

## Tokens added

`lane-min-width`, `list-track-width`, `list-detail-collapse`, `list-detail-inspector-collapse`, `scroller-fade-size`
and `tracking-caps`, as listed in contracts/elements.md. They are plain records in `packages/tokens/src/source.ts`.
