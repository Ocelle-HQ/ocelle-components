# Contract: the overflow-region module's block-axis option (amends 009's contract)

**Amends** `specs/009-workflow-layouts/contracts/overflow-region.md` (mission 009, the module's own contract), for
hosts that set the option below; for every other host 009's contract stands word for word. Spec FR-008 (as amended)
and FR-018, inventory decision IQ-2 (operator, 2026-11-18, `reviews/phase-1/inventory-decisions.md`), with the
block-end fade of follow-up decision Q-I4 (operator, 2026-11-18: a fade at the block end while content is below);
research R-18. The re-analysis decisions of 2026-11-18 (`reviews/analysis/operator-decisions.md`) add A1 (c), the
pinned-box measure chosen after phase 1's second spike (§ The pinned-box measure), and G1 (a), the block-axis keys
the browser keeps (§ Effects, Keys). The operator's decisions on phase 1's second spike (2026-11-18,
`reviews/phase-1/operator-spike-2-decisions.md` on `reviews/phase-1/spike-2.md`; changes in
`reviews/phase-1/spike-2-fixes.md`) settle four points: Q-1 (a), the pinned-box measure is the current edge; Q-2 (a),
the host pins its box with a negative block-start inset (contracts/styles-data-table.md, block 1); Q-3 (c),
`data-axis="both"` only while the box overflows in the block axis (§ Effects, Scrolling); Q-4 (a),
`.region-edge.block-end` zero-wide outside forced colours (§ Stylesheet). The amendment lives in this feature's contracts because this mission makes the change. 009's contract
file carries one line pointing here (follow-up decision Q-I5, in a documentation commit of its own) and is otherwise
not edited; the README's § Element conventions entry for the module, which both features document against, names the
option (T081).

**Status.** The module stays internal: not an entry point, not in the manifest, not public surface (constitution VII;
009's contract § Status). `ocelle-data-table` with `sticky-header` is the only user that sets the option.
`ocelle-scroller`, `ocelle-workflow-board` and the test-only `test/fixtures/overflow-host.ts` do not, and do not
change: without the option no block-end fade, `data-block-fade` or `.region-edge.block-end` reading exists for them.

## The option

| Input | Form | Notes |
|---|---|---|
| block axis | `blockAxis?: () => boolean`, a constructor option, read after each render | absent, or returning `false`: 009's contract exactly. Returning `true`: the effects below. A host may switch it at run time (the data table's `sticky-header` attribute); the module re-reads it in `hostUpdated` and applies the new state to the box it follows |
| pinned block-start box | `blockStartBox?: () => Element \| null`, a constructor option, read at the time of focus and whenever the edge state is written (the room rule, § Outputs) | the box the host pins at the scroll box's block start (the data table: its table's `<thead>`), or `null`. The module reads it from layout at those times, as the **pinned-box measure** below, never from a custom property's text (009's contract, § Inputs) |

The existing inputs (`box`, `role`, `step`, `setLabel`, the host `aria-label`) are unchanged.

**The pinned-box measure (`pinnedEnd`; re-analysis A1 (c), 2026-11-18).** The room rule (§ Outputs) and the block
clearance (§ Effects) both measure from one point, `pinnedEnd`: the block position, in the box's client coordinates,
below which content is not covered by the pinned box. With `blockStartBox()` `null` it is the box's client block-start
edge. With a pinned box it is **the current edge** (the operator's decision Q-1 (a) on phase 1's second spike,
2026-11-18): the pinned box's laid-out block-end edge as it is at the time of reading
(`blockStartBox().getBoundingClientRect()`'s block end, less the box's client block-start edge), whatever the scroll
position. At the block start, content above the pinned box (the data table's caption) pushes it down by that
content's block size, so under a tall caption in a small bound the room rule fails at rest and the block-end fade is
absent until the caption scrolls away (the scrollbar is then the only cue; spike-2 § 11: at 320 px with a two-line
caption, no fade at rest in bounds up to 140 px). In exchange the fade never reaches the pinned box and the block
clearance always clears the box where it really is. For a focused element that precedes the pinned box in tree order
(a link in the data table's caption) the block clearance does not measure from `pinnedEnd`: its upper bound is the
box's client block-start edge (§ Effects, Focus clearance; the operator's answer to Q-S2-1 (a), 2026-11-18). The other
candidate measured, the client block start plus the
pinned box's block size "as if pinned", is not used: in a 100 px bound it faded the header's lower 12.6 px at rest
(spike-2 § 11).

The host pins its box at a negative block-start inset equal to the box's block padding (the ring room,
`--ocelle-focus-offset` + `--ocelle-focus-width`; spike-2 Q-2 (a)), because sticky positioning measures from the
scroll container's padding edge: once scrolled by the ring room or more the pinned box's block-start edge is at the
box's client block-start edge, and at the block start it keeps the ring room above it. The module does not depend on
that inset: it reads the current edge either way.

**Template (a host that sets the option).** After 009's `.region-edge start` and `.region-edge end`, the host renders
one more edge, `<div class="region-edge block-end" aria-hidden="true"></div>`, inside `.region-frame`. It is the
block-end fade's depth measure and its forced-colours line (§ Stylesheet). A host that never sets the option need not
render it; with the option off nothing reads it and it paints nothing. 009's hosts do not render it and do not change.
Outside forced colours it is laid out zero-wide (its block size alone is the measure), so it covers no content: a
full-width edge made axe-core 4.14.0 report a serious `color-contrast` incomplete result (`bgOverlap`) on the rows
under it in every data table, with or without the option (spike-2 § 9, Q-4 (a)).

## Outputs (in addition to 009's; read by the host's render where it binds them)

| Output | Type | Meaning |
|---|---|---|
| `offBlockEnd` | `boolean` | while the option is on: content below the box's client block end by more than 1 px (`scrollHeight − clientHeight − scrollTop > 1`); `false` while it is off |
| `fadeBlockEnd` | `boolean` | `offBlockEnd`, the **room rule** met (the space between `pinnedEnd`, § The pinned-box measure, and the box's client block-end edge is at least twice the fade depth; the factor two is the operator's decision Q-I6 (a)), and not suppressed by the block focus fallback (§ Effects, Focus clearance); the block-end fade and its forced-colours line follow it |

The module itself writes `data-block-fade="end"` on the box while `fadeBlockEnd` is true and removes the attribute
otherwise (as it writes `data-axis`); the host binds nothing for it. `offStart`, `offEnd`, `fadeStart`, `fadeEnd` and
`fadeAttribute` keep 009's inline meaning.

## Effects while the option is on (in addition to 009's)

- **Scrolling (spike-2 Q-3 (c)).** The module sets `data-axis="both"` on the box it follows while the option is on
  **and** the box overflows in the block axis (`scrollHeight − clientHeight > 1`, read with or without the attribute:
  a box with 009's `overflow-y: hidden` still reports its content's scroll height), and removes it when the block
  overflow ends, the option turns off or it lets go of the box. Its stylesheet then gives the box `overflow-y: auto`
  and `scrollbar-gutter: stable` in place of `overflow-y: hidden`, so the block-axis scrollbar's room is reserved
  while the box scrolls in the block axis, and not otherwise. Why not always: under `dir="rtl"`, Chromium starts a box
  with `scrollbar-gutter: stable` that overflows inline but not in the block axis at `scrollLeft` −15 and never
  scrolls it to 0, so the first 15 px of the content cannot be reached (spike-2 § 2; FR-008, WCAG 1.4.10); with block
  overflow too the start is reachable. Writing or removing `data-axis` is an output change (`requestUpdate()`), so a
  host that sizes something by the gutter (the data table's caption cap) re-reads it. The gutter is 15 px in
  Chromium both with classic scrollbars and with `--hide-scrollbars`, where nothing is drawn in it (spike-2 § 2).
  When it appears, the client width shrinks: the module reads the mask figures (below) again after writing the
  attribute. The change is monotone (the gutter only narrows the client area, which cannot end a block overflow), so
  the attribute cannot oscillate; this is measured before the red commit (a stop-and-ask point, tasks.md T082).
- **Overflowing.** `overflowing` is true when the content overflows in either axis: `scrollWidth − clientWidth > 1`
  or `scrollHeight − clientHeight > 1`. While overflowing the box takes the tab stop, role and name exactly as 009's
  contract states (§ Effects, Overflowing); otherwise none of them.
- **Edges and fades.** The inline edges and fades (`offStart`, `offEnd`, `fadeStart`, `fadeEnd`, `fadeAttribute`)
  stay as 009's contract defines them. The module adds one block-axis fade, at the **block end only**, while
  `fadeBlockEnd` holds (§ Outputs): the content fades out over the fade depth (`--ocelle-scroller-fade-size`, the
  same depth as the inline fades) towards the box's client block-end edge. There is never a block-start fade: the
  block start is where the host pins its box (the data table's header row), which a fade would cover. The room rule
  keeps the fade off the pinned box: when the space below `pinnedEnd` is less than twice the fade depth, no
  block-end fade is drawn although content is below (the scrollbar still shows it).
- **Mask figures.** No fade covers either scrollbar or the pinned box. While `data-axis="both"`, whenever it writes
  the edge state, the module also reads the block-axis scrollbar's thickness (`offsetWidth − clientWidth`, the box
  having no inline border) and, when a figure changed, writes `mask-size` for four layers, listed top first as
  `mask-image` lists them (measured, spike-2 § 3):
  1. the opaque layer over the block-axis scrollbar, `<thickness>px 100%`, at the scrollbar's side (the inline end in
     LTR, the left under `dir="rtl"`, where Chromium puts the scrollbar and the gutter);
  2. the opaque layer over the inline-axis scrollbar, `100% <inline scrollbar thickness>px`, at the block end (009's
     existing layer);
  3. the block-end fade layer, `<clientWidth>px <clientHeight>px`, at the client area's side;
  4. the inline fade layer, `<clientWidth>px <clientHeight>px`, at the client area's side.

  The stylesheet's `[data-axis="both"]` mask rules carry the matching layers and positions with
  `mask-composite: add, add, intersect, add`: the block-end fade layer **intersects** the inline fade layer below it
  (a corner under both fades is faded by both, its alpha the product: 0.24 measured against 0.49 × 0.49), and the two
  opaque scrollbar layers are **added** over that result (both scrollbars stay unmasked); the bottom layer's operator
  is unused. With `add` between the two fades, the opaque layer of the fade that is off undoes the other fade (alpha
  1, spike-2 § 3), and with the order reversed the scrollbars are masked. A fade layer whose fade is off is opaque,
  so an inline fade alone, a block-end fade alone and both together use the same four layers. While the option is on
  but `data-axis` is absent (no block overflow), and for hosts without the option, the module writes the two-layer
  figures of 009's contract, byte for byte.
- **Arrow keys.** `ArrowUp` and `ArrowDown`, with the box as composed target and with `altKey`, `ctrlKey`, `metaKey`
  and `shiftKey` all false, scroll the box in the block axis by `step` px (an instant `scrollTop` write), and call
  `preventDefault`. `ArrowLeft` and `ArrowRight` keep 009's behaviour unchanged. Any other key, a modified arrow, or a key from a descendant is not touched. Without the
  option, `ArrowUp` and `ArrowDown` are not touched, as in 009's contract.
- **Keys the browser keeps (re-analysis G1 (a), 2026-11-18).** While `data-axis="both"` the box has
  `overflow-y: auto`, so while it has focus Chromium scrolls it in the block axis with `PageDown` and `Space` (towards
  the block end), `PageUp` and `Shift+Space` (back), `End` (to the block end) and `Home` (to the block start). The
  module leaves these keys to the browser: it neither handles nor prevents them (they are among "any other key"
  above). The browser's scroll fires `scroll`, so the module recomputes `offBlockEnd` and `fadeBlockEnd`
  (§ Triggers) and the block-end fade follows; the host's pinned box stays pinned, as for any scroll. Measured with
  real key events (Playwright's keyboard; spike-2 § 10): none prevented, focus stays on the box, `PageDown` and
  `Space` move by less than the client height (262 px in a 300 px box), `End` to the range's end, and `Home` at the
  block start does not move. Without the option, or with it on and no block overflow, the box keeps 009's
  `overflow-y: hidden` and these keys do not scroll it in the block axis, as before.
- **Focus clearance.** On `focusin` of a descendant matching `:focus-visible`, after 009's inline clearance, the box
  scrolls in the block axis by the smallest amount that puts the ring box (the focused element's border box grown by
  the focus offset and width on each side) wholly between `pinnedEnd` (§ The pinned-box measure) and the block-end
  fade's block-start edge if the block-end fade
  will still show at the new position (an end within 1 px of the scroll range's end does not fade, and the room rule
  applies), else the box's client block-end edge (WCAG 2.4.11). The fade depth is the laid-out block size of
  `.region-edge.block-end` at the time of focus, never a custom property's text (as 009's inline depth). When the ring
  box is taller than that space, its block-start edge is aligned below `pinnedEnd` and the block-end fade is
  **suppressed** (the fallback, as 009's inline one): the module records the `scrollTop` it wrote (read back after the
  write, so clamping is included), and the suppression ends on `focusout` from the focused element or on a `scroll`
  whose `scrollTop` differs from the recorded value by more than 1 px. A scroll by one of the keys the browser keeps
  is such a scroll. No block-axis scroll is made when the focused
  element is inside the pinned box. **An element before the pinned box** (the operator's answer to Q-S2-1 (a),
  2026-11-18): when the focused element precedes `blockStartBox()` in tree order (`compareDocumentPosition` reports
  it `DOCUMENT_POSITION_PRECEDING` and not `DOCUMENT_POSITION_CONTAINS`; the data table's caption and anything in
  it), the upper bound of the space is the box's client block-start edge instead of `pinnedEnd`: the pinned box
  follows the element in flow, so it is below the element at every scroll position and cannot cover it, and no
  scroll position puts the element below `pinnedEnd`. The box scrolls back by the smallest amount that puts the ring
  box's block-start edge at or below the client block-start edge (after Chromium's focus scroll, the ring room the
  scroll left above it); a ring box already inside the space, as a caption link at rest is, writes nothing and
  suppresses nothing. The block-end bound, the room rule (still from `pinnedEnd`) and the fallback are as above, the
  fallback aligning the ring box's block-start edge at the client block-start edge. Without it the clearance would
  scroll such an element towards or under the pinned box, or clamp and suppress the fade at rest. The write is an instant `scrollTop` assignment. Chromium's own focus scroll runs
  before `focusin`, so the clearance reads the position it left and writes once; no frame shows a jump back
  (spike-2 § 6).
- **Focus handover.** As 009's contract, when overflow ends in both axes while the box has focus.
- **Block overflow ending, turning the option off, or letting go of the box.** The module removes `data-block-fade`
  with `data-axis`, and ends any block suppression.
- **Triggers.** As 009's contract (the box and track `ResizeObserver`, `slotchange`, `scroll`); a `scroll` in the
  block axis (an arrow, a key the browser keeps, the wheel or a script) recomputes `overflowing`, `offBlockEnd` and
  `fadeBlockEnd`, and `pinnedEnd` is read with them (the room rule). Each trigger also re-decides `data-axis` from the
  block overflow (§ Scrolling). Every output change, `data-axis` included, calls `requestUpdate()`, as in 009's contract.

## Pure functions (unit-tested without layout)

| Function | What it returns |
|---|---|
| `blockClearanceScroll({ ring, box, pinnedEnd, fade, before })` (new) | `{ scrollTop, suppressEnd }`: the new `scrollTop` for a ring box, given the box's client block span and `scrollTop`, `scrollHeight`, `clientHeight`, `pinnedEnd` (§ The pinned-box measure; the function takes the figure, which the module reads as the pinned box's current edge), the fade depth and `before` (true when the focused element precedes the pinned box in tree order, Q-S2-1 (a): the upper bound is then the client block-start edge, not `pinnedEnd`, which still decides the room rule); clamped to the scroll range; unchanged when the ring box is already clear. Whether the block-end fade still shows is worked out from the new position (and the room rule), not passed in; `suppressEnd` is true when the ring box cannot be cleared of a fade that still shows (taller than the space) |
| `blockEdgeState(scrollTop, scrollHeight, clientHeight, pinnedEnd, fade)` (new) | `{ overflowingBlock, offBlockEnd, room }`, with the 1 px tolerance; `overflowingBlock` decides `data-axis` (§ Scrolling); `room` is the room rule, met when `clientHeight − pinnedEnd ≥ 2 × fade` (at exactly twice the depth the fade shows) |

`edgeState`, `clearanceScroll` and `resolveName` are unchanged.

## Stylesheet `overflowRegionStyles` (additions only)

| Element | Rules |
|---|---|
| `.region-box[data-axis="both"]` | `overflow-y: auto`; `scrollbar-gutter: stable` |
| `.region-box[data-axis="both"]` with `[data-fade="start"]`, `[data-fade="end"]`, `[data-fade="both"]` or `[data-block-fade="end"]` (selected on these values only, never on presence) | inside `@media not (forced-colors: active)`: four `mask-image` layers, top first (§ Effects, Mask figures; spike-2 § 3): the opaque block-scrollbar layer on its side (`right` in LTR, `left` under `:host(:dir(rtl))`); the opaque inline-scrollbar layer at the block end; the block-end fade, a `linear-gradient` towards the block end, opaque to `calc(100% - var(--ocelle-scroller-fade-size))` and transparent at 100%, while `data-block-fade="end"`, or an opaque `linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink))` otherwise; the inline fade `linear-gradient` per `data-fade` value (mirrored under `:host(:dir(rtl))`), or the opaque gradient when `data-fade` is absent; the two fade layers at the client area's side (`left` in LTR, `right` under `:host(:dir(rtl))`, the gutter being on the left). `mask-composite: add, add, intersect, add`; `mask-origin` and `mask-clip` `border-box`, `mask-repeat: no-repeat`; sizes from the per-instance sheet |
| `.region-edge.block-end` | always laid out: absolutely positioned at the frame's block end (`inset-block-end: 0`, `inset-inline-start: 0`), `inline-size: 0` (spike-2 Q-4 (a): zero-wide, so it covers no row and axe reports no `color-contrast` incomplete result), `block-size: var(--ocelle-scroller-fade-size)`, `box-sizing: border-box`, no pointer events, nothing painted outside forced colours; the module's block fade-depth measure (its block size; 32 px measured, spike-2 § 4). It overrides 009's inline placement and `inline-size` for `.region-edge` (its class is `block-end`, so 009's `.start` and `.end` rules do not select it) |
| `.region-edge.block-end`, inside `@media (forced-colors: active)` | `inset-inline: 0`; `inline-size: auto`: the frame's full width, for the line below (measured: depth unchanged, no axe finding outside forced colours) |
| `.region-box[data-block-fade="end"] ~ .region-edge.block-end` | in forced colours only: `border-block-end: var(--ocelle-border-width) solid CanvasText`, the block-end fade's forced-colours line, as 009's inline lines (no mask is drawn in forced colours) |

009's rules for `.region-box`, `.region-track`, `.region-ring` and the inline `.region-edge` are unchanged. A host that sets the
option sizes its box itself (the data table makes its host and `.region-frame` a column flex so the page's block
bound reaches the box; contracts/ocelle-data-table.md).

## What a host must not do (in addition to 009's list)

- scroll the box in the block axis itself, or handle `ArrowUp` and `ArrowDown` on it, or handle or prevent the keys
  the browser keeps (§ Effects);
- set `overflow-y`, `scrollbar-gutter`, `data-axis` or `data-block-fade` on the box;
- draw a block-axis fade or edge cue of its own, or style `.region-edge.block-end`.

## Tests (phase 1's red, T079)

- 009's existing tests (`test/overflow-region.test.ts`, `test/overflow-host.test.ts`, the scroller's and the board's
  scenario and harness files) are not edited and pass unchanged; the one test statement changed is the README
  sentence on the module's inputs in `test/node/readme.test.ts`, for the new options (named in the red commit's body).
- New bodies drive a block-axis test host (`test/fixtures/overflow-host-block.ts`, a test-only element built on the
  module with the option on, a bounded block size and a pinned first child, pinned as the data table's `<thead>` is,
  at `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, spike-2 Q-2 (a)) in
  both harnesses: the overflow states of either axis, the tab stop and name, the arrows (unmodified, modified, from a
  descendant, without the option), the block clearance under the pinned box and with focus inside it, the handover
  when both axes stop overflowing, the `data-axis` attribute on and off at run time, the mask figures (both
  scrollbars unmasked, a four-layer `mask-size` in the order of § Effects, Mask figures, and the computed
  `mask-composite` equal to the list `add, add, intersect, add`, in LTR and under `dir="rtl"` with the block
  scrollbar's layer on the left), the pure `blockClearanceScroll` cases (already clear, above, below, below and
  clear of the fade, near the end where the fade goes, taller than the space with `suppressEnd`, clamped, and
  before the pinned box (Q-S2-1 (a)): with `before` a ring box between the client block start and `pinnedEnd`
  unchanged, the same ring box without `before` moved, and a ring box above the client block start scrolled back to
  it, not to `pinnedEnd`) and the
  pure `blockEdgeState` cases (no block overflow, content below, at the end within 1 px, the room rule met and not
  met, with spike-2's figures: `clientHeight` 300 and 100 with `pinnedEnd` 32 and fade 32 met (space 268, 68); 95
  with `pinnedEnd` 32 not met (63); 100 with `pinnedEnd` 80.6 not met (19.4); 140 with `pinnedEnd` 56.6 met (83.4);
  and exactly twice the depth met).
- `data-axis` follows the block overflow (spike-2 Q-3 (c)): with the option on, the host bounded so that it overflows
  inline only, no `data-axis`, `overflow-y` `hidden`, the box's `offsetWidth` equal to its `clientWidth` and the
  two-layer `mask-size`; the bound then lowered below the content's block size: `data-axis="both"`, the gutter
  (`offsetWidth − clientWidth` above 0) and the four layers; the bound lifted again: no `data-axis`. Under
  `dir="rtl"`, overflowing inline only: `scrollLeft` 0 at rest, `data-fade="end"` (not `both`) at rest, and the
  first row's inline start at the track's start (the content's start reachable), paired with the same host bounded
  in the block axis too carrying `data-axis="both"` with `scrollLeft` 0 at rest. Each change after `settle`, with no
  `ResizeObserver` loop error.
- The keys the browser keeps (G1 (a)): with the box focused at the block start, `PageDown`, `PageUp`, `End`, `Home`,
  `Space` and `Shift+Space` in that order, each from the position the previous key left, as real key events
  (spike-2 § 10), each asserting that the key's default was not prevented (`lastKeyPrevented()` false), that
  `scrollTop` moved in the key's direction by a non-zero amount (not a fixed amount: `PageDown` and `Space` move by
  less than the client height; to the range's end for `End`, to 0 for `Home`), that `data-block-fade="end"` follows
  (absent after `End`, present after `Home`), and the pinned child's position (spike-2 Q-2 (a)): after `PageDown`,
  `End` and `Space` its block-start edge at the box's client block-start edge, after `PageUp`, `Home` and
  `Shift+Space` (back at the block start) at its at-rest position read before the first key, each within 0.5 px;
  paired, in the same body, with `ArrowDown` scrolling by `step` with its default prevented.
- The captioned cases (A1 (c), decided (a): `pinnedEnd` is the pinned child's current block-end edge): the test host
  at 320 px with a block above the pinned child standing in for a caption, two lines tall (its two line boxes asserted
  first), the fade depth read from `.region-edge.block-end`'s block size. In a 100 px bound at the block start: the
  precondition that less than twice the depth lies between the pinned child's current block-end edge and the client
  block end, then no `data-block-fade` although content is below; scrolled past the caption block (the pinned child
  at the client block-start edge within 0.5 px): `data-block-fade="end"`, the fade's block-start edge at or below the
  pinned child's block-end edge. In a 300 px bound at the block start: `data-block-fade="end"`, the fade's
  block-start edge at or below the pinned child's current block-end edge. A link just below the pinned child, tabbed
  to: in the 100 px bound at the block start its ring box's block-start edge at or below the pinned child's current
  block-end edge and its block-end edge at or above the client block end (no fade there); scrolled past the caption
  block, its ring box's block-start edge at the pinned child's block-end edge within 0.5 px (spike-2 § 11 measured
  0.4 px from scroll rounding). Reference figures of the data table in the in-process harness (spike-2 § 11, with the
  negative inset): the header's block-end edge 80.6 px below the client block start at rest and 27 px once pinned,
  fade depth 32 px.
- The element before the pinned box (Q-S2-1 (a)): the captioned test host with a link on the second line of the
  block above the pinned child (in the same tree as the pinned child; the first focusable element after the box's own
  tab stop). In the 300 px bound at the block start, `focus` on the box and `pressTab` to the link: `scrollTop`
  unchanged at 0, its ring box inside the box at or below the client block-start edge, and `data-block-fade="end"`
  still (nothing suppressed); then `setScrollTop` past the block (the pinned child at the client block-start edge
  within 0.5 px), `focus` on the box and `pressTab` to the link again: `scrollTop` lower than before, its ring box's block-start edge at the client block-start edge within 0.5 px, its block-end
  edge at or above the pinned child's current block-start edge, and `elementFromPoint` at the link's centre
  returning the link. Paired, in the same body, with a link just below the pinned child cleared to the pinned
  child's block-end edge (the bound that does apply to it).
- The block-end fade's bodies on the same host: `data-block-fade="end"` at rest with content below and absent at the
  block end; absent under the room rule (a bound leaving less than twice the fade depth below `pinnedEnd`) while
  content is below; the fade's block-start edge at or below `pinnedEnd` (with no caption, the pinned child's
  block-end edge); with an inline fade too
  (both attributes, the four layers); the block clearance clear of the fade, and the fallback (a ring box taller than
  the space: the fade suppressed, and shown again after `focusout` and after a scroll of more than 1 px); outside
  forced colours, `.region-edge.block-end`'s inline size 0 and its block size the fade depth (spike-2 Q-4 (a)); in
  forced colours, the `.region-edge.block-end` line in `CanvasText` with a width above zero and the frame's inline
  size while `data-block-fade="end"`, and no line at the block end.
- One paired body per guard: with the option off, the same host behaves as 009's contract (ArrowDown not handled, no
  `data-axis`, no `data-block-fade` although its content is taller than its bound, two-layer `mask-size`).
- "Within 0.5 px" in these bodies, as everywhere in this feature, is inclusive (`|difference| ≤ 0.5`): spike-2 § 8
  measured differences of exactly 0.5 px.
