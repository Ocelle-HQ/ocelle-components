# Contract: the overflow-region module's block-axis option (amends 009's contract)

**Amends** `specs/009-workflow-layouts/contracts/overflow-region.md` (mission 009, the module's own contract), for
hosts that set the option below; for every other host 009's contract stands word for word. Spec FR-008 (as amended)
and FR-018, inventory decision IQ-2 (operator, 2026-11-18, `reviews/phase-1/inventory-decisions.md`), with the
block-end fade of follow-up decision Q-I4 (operator, 2026-11-18: a fade at the block end while content is below);
research R-18. The amendment lives in this feature's contracts because this mission makes the change. 009's contract
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
| pinned block-start box | `blockStartBox?: () => Element \| null`, a constructor option, read at the time of focus and whenever the edge state is written (the room rule, § Outputs) | the box the host pins at the scroll box's block start (the data table: its table's `<thead>`), or `null`. The module reads its laid-out block size at those times, never a custom property's text (009's contract, § Inputs) |

The existing inputs (`box`, `role`, `step`, `setLabel`, the host `aria-label`) are unchanged.

**Template (a host that sets the option).** After 009's `.region-edge start` and `.region-edge end`, the host renders
one more edge, `<div class="region-edge block-end" aria-hidden="true"></div>`, inside `.region-frame`. It is the
block-end fade's depth measure and its forced-colours line (§ Stylesheet). A host that never sets the option need not
render it; with the option off nothing reads it and it paints nothing. 009's hosts do not render it and do not change.

## Outputs (in addition to 009's; read by the host's render where it binds them)

| Output | Type | Meaning |
|---|---|---|
| `offBlockEnd` | `boolean` | while the option is on: content below the box's client block end by more than 1 px (`scrollHeight − clientHeight − scrollTop > 1`); `false` while it is off |
| `fadeBlockEnd` | `boolean` | `offBlockEnd`, the **room rule** met (the space between the pinned box's block-end edge, or the box's client block-start edge when `blockStartBox()` is `null`, and the box's client block-end edge is at least twice the fade depth), and not suppressed by the block focus fallback (§ Effects, Focus clearance); the block-end fade and its forced-colours line follow it |

The module itself writes `data-block-fade="end"` on the box while `fadeBlockEnd` is true and removes the attribute
otherwise (as it writes `data-axis`); the host binds nothing for it. `offStart`, `offEnd`, `fadeStart`, `fadeEnd` and
`fadeAttribute` keep 009's inline meaning.

## Effects while the option is on (in addition to 009's)

- **Scrolling.** The module sets `data-axis="both"` on the box it follows (and removes it when the option turns off or
  it lets go of the box); its stylesheet then gives the box `overflow-y: auto` and `scrollbar-gutter: stable` in place
  of `overflow-y: hidden`, so the block-axis scrollbar's room is reserved whether or not the box overflows (R-18: the
  caption cap and the mask figures then never feed back on a scrollbar that comes and goes).
- **Overflowing.** `overflowing` is true when the content overflows in either axis: `scrollWidth − clientWidth > 1`
  or `scrollHeight − clientHeight > 1`. While overflowing the box takes the tab stop, role and name exactly as 009's
  contract states (§ Effects, Overflowing); otherwise none of them.
- **Edges and fades.** The inline edges and fades (`offStart`, `offEnd`, `fadeStart`, `fadeEnd`, `fadeAttribute`)
  stay as 009's contract defines them. The module adds one block-axis fade, at the **block end only**, while
  `fadeBlockEnd` holds (§ Outputs): the content fades out over the fade depth (`--ocelle-scroller-fade-size`, the
  same depth as the inline fades) towards the box's client block-end edge. There is never a block-start fade: the
  block start is where the host pins its box (the data table's header row), which a fade would cover. The room rule
  keeps the fade off the pinned box: when the space below the pinned box is less than twice the fade depth, no
  block-end fade is drawn although content is below (the scrollbar still shows it).
- **Mask figures.** No fade covers either scrollbar or the pinned box. Whenever it writes the edge state, the module
  also reads the block-axis scrollbar's thickness (`offsetWidth − clientWidth`, the box having no inline border) and,
  when a figure changed, writes `mask-size` for four layers: the inline fade layer and the block-end fade layer, each
  sized to the client area (`<clientWidth>px <clientHeight>px`); the existing opaque layer over the inline-axis
  scrollbar (`100% <thickness>px`); and one more opaque layer of the block-axis scrollbar's thickness over its side
  (R-18 measures which side it is under `dir="rtl"`). The stylesheet's `[data-axis="both"]` mask rules carry the
  matching layers and positions: the two fade layers **intersect** (so where the inline and the block-end fades meet,
  a corner is faded by both, its alpha the product of the two), and the two opaque scrollbar layers are **added** to
  that result (so both scrollbars stay unmasked). A fade layer whose fade is off is opaque, so an inline fade alone,
  a block-end fade alone and both together use the same four layers. Hosts without the option keep the two-layer
  figures of 009's contract, byte for byte.
- **Arrow keys.** `ArrowUp` and `ArrowDown`, with the box as composed target and with `altKey`, `ctrlKey`, `metaKey`
  and `shiftKey` all false, scroll the box in the block axis by `step` px (an instant `scrollTop` write), and call
  `preventDefault`. `ArrowLeft` and `ArrowRight` keep 009's behaviour unchanged. Any other key, a modified arrow, or a key from a descendant is not touched. Without the
  option, `ArrowUp` and `ArrowDown` are not touched, as in 009's contract.
- **Focus clearance.** On `focusin` of a descendant matching `:focus-visible`, after 009's inline clearance, the box
  scrolls in the block axis by the smallest amount that puts the ring box (the focused element's border box grown by
  the focus offset and width on each side) wholly between the pinned box's block-end edge (the box's client
  block-start edge when `blockStartBox()` is `null`) and the block-end fade's block-start edge if the block-end fade
  will still show at the new position (an end within 1 px of the scroll range's end does not fade, and the room rule
  applies), else the box's client block-end edge (WCAG 2.4.11). The fade depth is the laid-out block size of
  `.region-edge.block-end` at the time of focus, never a custom property's text (as 009's inline depth). When the ring
  box is taller than that space, its block-start edge is aligned below the pinned box and the block-end fade is
  **suppressed** (the fallback, as 009's inline one): the module records the `scrollTop` it wrote (read back after the
  write, so clamping is included), and the suppression ends on `focusout` from the focused element or on a `scroll`
  whose `scrollTop` differs from the recorded value by more than 1 px. No block-axis scroll is made when the focused
  element is inside the pinned box. The write is an instant `scrollTop` assignment.
- **Focus handover.** As 009's contract, when overflow ends in both axes while the box has focus.
- **Turning the option off, or letting go of the box.** The module removes `data-block-fade` with `data-axis`, and ends
  any block suppression.
- **Triggers.** As 009's contract (the box and track `ResizeObserver`, `slotchange`, `scroll`); a `scroll` in the
  block axis recomputes `overflowing`, `offBlockEnd` and `fadeBlockEnd`, and the pinned box's block size is read with
  them (the room rule). Every output change calls `requestUpdate()`, as in 009's contract.

## Pure functions (unit-tested without layout)

| Function | What it returns |
|---|---|
| `blockClearanceScroll({ ring, box, pinnedEnd, fade })` (new) | `{ scrollTop, suppressEnd }`: the new `scrollTop` for a ring box, given the box's client block span and `scrollTop`, `scrollHeight`, `clientHeight`, the pinned box's block-end edge and the fade depth; clamped to the scroll range; unchanged when the ring box is already clear. Whether the block-end fade still shows is worked out from the new position (and the room rule), not passed in; `suppressEnd` is true when the ring box cannot be cleared of a fade that still shows (taller than the space) |
| `blockEdgeState(scrollTop, scrollHeight, clientHeight, pinnedEnd, fade)` (new) | `{ overflowingBlock, offBlockEnd, room }`, with the 1 px tolerance; `room` is the room rule |

`edgeState`, `clearanceScroll` and `resolveName` are unchanged.

## Stylesheet `overflowRegionStyles` (additions only)

| Element | Rules |
|---|---|
| `.region-box[data-axis="both"]` | `overflow-y: auto`; `scrollbar-gutter: stable` |
| `.region-box[data-axis="both"]` with `[data-fade="start"]`, `[data-fade="end"]`, `[data-fade="both"]` or `[data-block-fade="end"]` (selected on these values only, never on presence) | inside `@media not (forced-colors: active)`: four `mask-image` layers, in an order whose `mask-composite` values make the inline fade layer and the block-end fade layer intersect and add the two opaque scrollbar layers to their result (§ Effects, Mask figures): the inline fade `linear-gradient` per `data-fade` value (mirrored under `:host(:dir(rtl))`), or an opaque `linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink))` when `data-fade` is absent; the block-end fade, a `linear-gradient` towards the block end, opaque to `calc(100% - var(--ocelle-scroller-fade-size))` and transparent at 100%, while `data-block-fade="end"`, or the opaque gradient otherwise; the opaque inline-scrollbar layer at the block end; the opaque block-scrollbar layer on its side. `mask-origin` and `mask-clip` `border-box`, `mask-repeat: no-repeat`; sizes from the per-instance sheet |
| `.region-edge.block-end` | always laid out: absolutely positioned at the frame's block end, `inset-inline: 0`, `block-size: var(--ocelle-scroller-fade-size)`, `box-sizing: border-box`, no pointer events, nothing painted outside forced colours; the module's block fade-depth measure. It overrides 009's inline placement and `inline-size` for `.region-edge` (its class is `block-end`, so 009's `.start` and `.end` rules do not select it) |
| `.region-box[data-block-fade="end"] ~ .region-edge.block-end` | in forced colours only: `border-block-end: var(--ocelle-border-width) solid CanvasText`, the block-end fade's forced-colours line, as 009's inline lines (no mask is drawn in forced colours) |

009's rules for `.region-box`, `.region-track`, `.region-ring` and the inline `.region-edge` are unchanged. A host that sets the
option sizes its box itself (the data table makes its host and `.region-frame` a column flex so the page's block
bound reaches the box; contracts/ocelle-data-table.md).

## What a host must not do (in addition to 009's list)

- scroll the box in the block axis itself, or handle `ArrowUp` and `ArrowDown` on it;
- set `overflow-y`, `scrollbar-gutter`, `data-axis` or `data-block-fade` on the box;
- draw a block-axis fade or edge cue of its own, or style `.region-edge.block-end`.

## Tests (phase 1's red, T079)

- 009's existing tests (`test/overflow-region.test.ts`, `test/overflow-host.test.ts`, the scroller's and the board's
  scenario and harness files) are not edited and pass unchanged; the one test statement changed is the README
  sentence on the module's inputs in `test/node/readme.test.ts`, for the new options (named in the red commit's body).
- New bodies drive a block-axis test host (`test/fixtures/overflow-host-block.ts`, a test-only element built on the
  module with the option on, a bounded block size and a pinned first child) in both harnesses: the overflow states of
  either axis, the tab stop and name, the arrows (unmodified, modified, from a descendant, without the option), the
  block clearance under the pinned box and with focus inside it, the handover when both axes stop overflowing, the
  `data-axis` attribute on and off at run time, the mask figures (both scrollbars unmasked, a four-layer `mask-size`,
  the two fade layers intersecting), the pure `blockClearanceScroll` cases (already clear, above, below, below and
  clear of the fade, near the end where the fade goes, taller than the space with `suppressEnd`, clamped) and the
  pure `blockEdgeState` cases (no block overflow, content below, at the end within 1 px, the room rule met and not
  met).
- The block-end fade's bodies on the same host: `data-block-fade="end"` at rest with content below and absent at the
  block end; absent under the room rule (a bound leaving less than twice the fade depth below the pinned box) while
  content is below; the fade's block-start edge at or below the pinned box's block-end edge; with an inline fade too
  (both attributes, the four layers); the block clearance clear of the fade, and the fallback (a ring box taller than
  the space: the fade suppressed, and shown again after `focusout` and after a scroll of more than 1 px); in forced
  colours, the `.region-edge.block-end` line in `CanvasText` with a width above zero while `data-block-fade="end"`,
  and no line at the block end.
- One paired body per guard: with the option off, the same host behaves as 009's contract (ArrowDown not handled, no
  `data-axis`, no `data-block-fade` although its content is taller than its bound, two-layer `mask-size`).
