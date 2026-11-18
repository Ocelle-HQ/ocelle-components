# Contract: the overflow-region module's block-axis option (amends 009's contract)

**Amends** `specs/009-workflow-layouts/contracts/overflow-region.md` (mission 009, the module's own contract), for
hosts that set the option below; for every other host 009's contract stands word for word. Spec FR-008 (as amended)
and FR-018, inventory decision IQ-2 (operator, 2026-11-18, `reviews/phase-1/inventory-decisions.md`); research R-18.
The amendment lives in this feature's contracts because this mission makes the change; 009's contract file is not
edited, and the README's § Element conventions entry for the module, which both features document against, names the
option (T081).

**Status.** The module stays internal: not an entry point, not in the manifest, not public surface (constitution VII;
009's contract § Status). `ocelle-data-table` with `sticky-header` is the only user that sets the option.
`ocelle-scroller`, `ocelle-workflow-board` and the test-only `test/fixtures/overflow-host.ts` do not, and do not
change.

## The option

| Input | Form | Notes |
|---|---|---|
| block axis | `blockAxis?: () => boolean`, a constructor option, read after each render | absent, or returning `false`: 009's contract exactly. Returning `true`: the effects below. A host may switch it at run time (the data table's `sticky-header` attribute); the module re-reads it in `hostUpdated` and applies the new state to the box it follows |
| pinned block-start box | `blockStartBox?: () => Element \| null`, a constructor option, read at the time of focus | the box the host pins at the scroll box's block start (the data table: its table's `<thead>`), or `null`. The module reads its laid-out block size at the time of focus, never a custom property's text (009's contract, § Inputs) |

The existing inputs (`box`, `role`, `step`, `setLabel`, the host `aria-label`) are unchanged.

## Effects while the option is on (in addition to 009's)

- **Scrolling.** The module sets `data-axis="both"` on the box it follows (and removes it when the option turns off or
  it lets go of the box); its stylesheet then gives the box `overflow-y: auto` and `scrollbar-gutter: stable` in place
  of `overflow-y: hidden`, so the block-axis scrollbar's room is reserved whether or not the box overflows (R-18: the
  caption cap and the mask figures then never feed back on a scrollbar that comes and goes).
- **Overflowing.** `overflowing` is true when the content overflows in either axis: `scrollWidth − clientWidth > 1`
  or `scrollHeight − clientHeight > 1`. While overflowing the box takes the tab stop, role and name exactly as 009's
  contract states (§ Effects, Overflowing); otherwise none of them.
- **Edges and fades.** `offStart`, `offEnd`, `fadeStart`, `fadeEnd` and `fadeAttribute` stay inline-axis only, as
  009's contract defines them. No block-axis fade and no block-axis edge cue is drawn.
- **Mask figures.** The inline fades' mask never covers either scrollbar. Whenever it writes the edge state, the
  module also reads the block-axis scrollbar's thickness (`offsetWidth − clientWidth`, the box having no inline border)
  and, when a figure changed, writes `mask-size` with the fade layer sized to the client area (`<clientWidth>px
  <clientHeight>px`), the existing opaque layer for the inline-axis scrollbar, and one more opaque layer of the
  block-axis scrollbar's thickness over its side (R-18 measures which side it is under `dir="rtl"`). The stylesheet's
  `[data-axis="both"]` mask rules carry the matching third layer and positions. Hosts without the option keep the
  two-layer figures of 009's contract, byte for byte.
- **Arrow keys.** `ArrowUp` and `ArrowDown`, with the box as composed target and with `altKey`, `ctrlKey`, `metaKey`
  and `shiftKey` all false, scroll the box in the block axis by `step` px (an instant `scrollTop` write), and call
  `preventDefault`. `ArrowLeft` and `ArrowRight` keep 009's behaviour unchanged. Any other key, a modified arrow, or a key from a descendant is not touched. Without the
  option, `ArrowUp` and `ArrowDown` are not touched, as in 009's contract.
- **Focus clearance.** On `focusin` of a descendant matching `:focus-visible`, after 009's inline clearance, the box
  scrolls in the block axis by the smallest amount that puts the ring box (the focused element's border box grown by
  the focus offset and width on each side) wholly between the pinned box's block-end edge (the box's client
  block-start edge when `blockStartBox()` is `null`) and the box's client block-end edge; when the ring box is taller
  than that space, its block-start edge is aligned below the pinned box. No block-axis scroll is made when the focused
  element is inside the pinned box. The write is an instant `scrollTop` assignment.
- **Focus handover.** As 009's contract, when overflow ends in both axes while the box has focus.
- **Triggers.** As 009's contract (the box and track `ResizeObserver`, `slotchange`, `scroll`); a `scroll` in the
  block axis recomputes `overflowing` only.

## Pure functions (unit-tested without layout)

| Function | What it returns |
|---|---|
| `blockClearanceScroll({ ring, box, pinnedEnd })` (new) | the new `scrollTop` for a ring box, given the box's client block span and `scrollTop`, `scrollHeight`, `clientHeight`, and the pinned box's block-end edge; clamped to the scroll range; unchanged when the ring box is already clear |

`edgeState`, `clearanceScroll` and `resolveName` are unchanged.

## Stylesheet `overflowRegionStyles` (additions only)

| Element | Rules |
|---|---|
| `.region-box[data-axis="both"]` | `overflow-y: auto`; `scrollbar-gutter: stable` |
| `.region-box[data-axis="both"][data-fade="start"]`, `[data-fade="end"]`, `[data-fade="both"]` | inside `@media not (forced-colors: active)`: the same fade layer and opaque inline-scrollbar layer as 009's, plus one opaque layer over the block-axis scrollbar's side; sizes from the per-instance sheet |

009's rules for `.region-box`, `.region-track`, `.region-ring` and `.region-edge` are unchanged. A host that sets the
option sizes its box itself (the data table makes its host and `.region-frame` a column flex so the page's block
bound reaches the box; contracts/ocelle-data-table.md).

## What a host must not do (in addition to 009's list)

- scroll the box in the block axis itself, or handle `ArrowUp` and `ArrowDown` on it;
- set `overflow-y`, `scrollbar-gutter` or `data-axis` on the box;
- draw a block-axis fade or edge cue.

## Tests (phase 1's red, T079)

- 009's existing tests (`test/overflow-region.test.ts`, `test/overflow-host.test.ts`, the scroller's and the board's
  scenario and harness files) are not edited and pass unchanged; the one test statement changed is the README
  sentence on the module's inputs in `test/node/readme.test.ts`, for the new options (named in the red commit's body).
- New bodies drive a block-axis test host (`test/fixtures/overflow-host-block.ts`, a test-only element built on the
  module with the option on, a bounded block size and a pinned first child) in both harnesses: the overflow states of
  either axis, the tab stop and name, the arrows (unmodified, modified, from a descendant, without the option), the
  block clearance under the pinned box and with focus inside it, the handover when both axes stop overflowing, the
  `data-axis` attribute on and off at run time, the mask figures (the block-axis scrollbar unmasked, a three-layer
  `mask-size`), and the pure `blockClearanceScroll` cases (already clear, above, below, taller than the space, clamped).
- One paired body per guard: with the option off, the same host behaves as 009's contract (ArrowDown not handled, no
  `data-axis`, two-layer `mask-size`).
