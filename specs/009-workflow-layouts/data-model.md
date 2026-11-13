# Data model: Workflow and Screen Layouts

These elements hold no data of their own. The entities below are the state each element keeps and the rules that
change it. Sources are spec FR-001 to FR-029 and research.md.

## Overflow-region state (`OverflowRegion`, contracts/overflow-region.md)

| Field | Type | Rule |
|---|---|---|
| `overflowing` | boolean | `scrollWidth − clientWidth > 1`; the inline ring room is part of `scrollWidth` |
| `offStart` | boolean | `abs(scrollLeft) > 1` |
| `offEnd` | boolean | `scrollWidth − clientWidth − abs(scrollLeft) > 1` |
| `suppressed` | set of `start`, `end` | set by the focus fallback; cleared on `focusout` of the focused element or on a scroll the module did not make |
| `fadeStart` / `fadeEnd` | boolean | `offStart` / `offEnd` and the side not in `suppressed` |
| `name` | string or none | the trimmed non-blank host `aria-label`, else the trimmed non-blank `label`, else none |

**Transitions.**
- not overflowing → overflowing: the box gains its tab stop, plus the role and name when it has a name.
- overflowing → not overflowing: the box loses all three. If the box had focus, focus is handed over (R-07).

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
| `hasInspector` | boolean | the `inspector` slot has an assigned element |
| `tier` | `three`, `two` or `one` | `one` if `narrow` or `measured < collapseAt`; else `two` if `measured < inspectorAt`, or if `hasInspector` is false (two columns without an inspector); else `three` |
| `shown` | set of panes | `three` or `two`: list, detail, and the inspector if present. `one`: the detail and the inspector if `detail-open`, else the list |
| `intrinsic` | { min, max } px | from the measurement pass (R-13): the one-column stack's min-content and the three-column grid's max-content |

**Focus rule (R-14).** If a change of `tier` or `detail-open` hides the pane that holds `document.activeElement`,
focus moves to the wrapper of the first shown pane after the update. At first render the same rule applies, and
nothing else moves focus.

## Tokens added

`lane-min-width`, `list-track-width`, `list-detail-collapse`, `list-detail-inspector-collapse`, `scroller-fade-size`
and `tracking-caps`, as listed in contracts/elements.md. They are plain records in `packages/tokens/src/source.ts`.
