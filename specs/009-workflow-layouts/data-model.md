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
| `maskFigures` | { client, bar } px | the box's `clientHeight` and its scrollbar thickness (`offsetHeight − clientHeight`, since the module sets the box's `border: 0`; 0 with overlay scrollbars), read whenever the state is written; set as the `mask-size` of the module's per-instance constructed stylesheet when either changed, never to a `style` attribute (R-05, PLAN-FRESH-2-001 (a)) |

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
| `countText` | string or none | when `count` is set: `count-label` trimmed and non-blank, else `String(count)`; otherwise none |
| `groupName` | string or none | the trimmed non-blank host `aria-label`; else `title, countText`, `title`, or `countText`; none when neither title nor count |
| `variant` | `default` or `flat` | `"flat"` gives flat; any other value gives default |

The lane has the group role exactly when `groupName` is set.

## list-detail

| Field | Type | Rule |
|---|---|---|
| `measured` | px | the host's border-box inline size: the content-box inline size a `ResizeObserver` reports for a zero-height `aria-hidden` probe at the top of the shadow root (the host's content box), plus the host's computed inline padding and borders. The same observer watches the border box of a second zero-height `aria-hidden` block, the edge box: absolutely positioned, `inline-size: 0`, inheriting the host's inline padding and border widths and styles, so its border box is those padding and borders and changes when they change alone, and the tier is chosen again (reviews/phase-4/round-1-fixes.md R1-03). Out of flow, it adds nothing to the host's intrinsic sizes, and it is not clamped by a host whose content box is narrower than its padding and borders (round-2-fixes.md R2-02). Only the probe's size enters the sum. A block-size change of the host notifies neither (reviews/phase-4/spike.md item 2). After each pass a scheduled frame runs (`slotchange`, a light-DOM change, `remeasure()`, the first render), `measured` is taken afresh in the same callback, from the probe's content box read then plus the host's inline padding and borders (round-2-fixes.md R2-01). A percentage inline padding that changes with the host's container while its content box keeps its size is a known limitation: the edge box resolves the percentage against its own containing block (the nearest positioned ancestor, or else the initial containing block), so the change may go unseen: it is seen only when that box changes size with the host's container, for example when the container is positioned and the host is not, and otherwise `measured` stays stale until that fresh measurement or the next delivery (FR-025; phase 4 review round 3, R3-04) |
| `collapseAt` | px | `collapse-below` parsed (R-12), else the token parsed, else 40rem; resolved at each measurement |
| `inspectorAt` | px | as above with `inspector-below`, the inspector token and 60rem |
| `hasInspector` | boolean | the `inspector` slot has an assigned element, read as an element child of the host with `slot="inspector"`, so it is known at the first update, before any slot is rendered (reviews/phase-4/round-1-fixes.md R1-01); the slot is always rendered, so `slotchange` sees an inspector added after first render (R-11) |
| `tier` | `three`, `two` or `one` | `one` if `narrow` or `measured < collapseAt`; else `two` if `measured < inspectorAt`, or if `hasInspector` is false (two columns without an inspector); else `three` |
| `shown` | set of panes | `three` or `two`: list, detail, and the inspector if present. `one`: the detail and the inspector if `detail-open`, else the list |
| `intrinsic` | { min, max } px | from the measurement pass (R-13): the one-column stack's min-content and the three-column grid's max-content; written to the instance's adopted constructed stylesheet (the one per-instance sheet FR-030 allows), never to a `style` attribute, as the inline size of the sizer (an empty `aria-hidden` `<svg>`, which adds nothing to min-content) and the grid's minimum; the panes are contained in inline size outside the pass, so these figures alone give the element's intrinsic sizes (reviews/phase-4/spike.md) |
| `pending` | boolean | a pass is requested for the next animation frame; set by the triggers below, cleared when the frame callback runs the pass |

**Re-measure triggers (R-13, PLAN-FRESH-2-002 (a), PLAN-FRESH-3-001 (a), PLAN-FRESH-3-002, PLAN-FRESH-3-003 (b)).**
`slotchange` of any of the three slots, a `MutationObserver` delivery (`childList`, `characterData`, `subtree`; no
`attributes`) from the assigned elements of any pane, shown or hidden, and a call of the public `remeasure()` each set
`pending` and request one animation frame if none is requested, as does the first render; that frame callback clears
`pending`, runs the pass and then takes `measured` afresh, choosing the tier again if it changed, so it runs at most
once per frame and never inside a `ResizeObserver` delivery. Before applying a `tier` or
`detail-open` change that comes from a property or attribute, the pass runs synchronously. It writes a figure only when
it changed. The element's `ResizeObserver` (on the probe and the edge box) updates `measured` and the tier only and
never runs the pass. Not seen, and picked up at the next of these triggers: a size change in a pane with no light-DOM
node or text change (an image or a font loading), content rendered inside a slotted element's shadow root, and an
attribute-only change; the host calls `remeasure()` after one (FR-025). The same remedy covers the known limitation of
`measured` above, a percentage inline padding that changes with the host's container.

**Not rendered (FR-025; landing pass, O5-01).** While the element has no box (a closed `<dialog>`, a `display: none`
ancestor, `hidden`), a pass writes no figure and `pending` stays set, and a fresh measurement does not replace
`measured` from the probe, whose computed inline size is then `auto`; the tier stays as it was. When the probe's
`ResizeObserver` sees the element become rendered, the element requests a pass for the next animation frame (set
`pending`, request a frame if none is), never running it inside that delivery, and takes `measured` afresh after it.

**Focus rule (R-14).** If a change of `tier` or `detail-open` hides the pane that holds focus (the active element of
the element's own root, the document or a host component's shadow root; reviews/phase-4/round-1-fixes.md R1-02),
the shown pane's wrapper gets `tabindex="-1"` and focus after the update, and loses the attribute on its `focusout`.
At rest no wrapper has a `tabindex`. At first render the same rule applies, and nothing else moves focus.

## Tokens added

`lane-min-width`, `list-track-width`, `list-detail-collapse`, `list-detail-inspector-collapse` and
`scroller-fade-size`, as listed in contracts/elements.md; the flat lane's letter spacing is #8's `tracking-eyebrow`
(research.md R-16). They are plain records in `packages/tokens/src/source.ts`.
