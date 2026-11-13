# Contract: the overflow-region module (internal)

The internal module that gives any element a scroll box that is a tab stop and a named region only while it
overflows, with edge state, arrow keys, focus clearance and focus handover (spec FR-001 to FR-011, FR-014; research.md
R-02 to R-07). This feature's `ocelle-scroller` and `ocelle-workflow-board` use it. #13's `ocelle-code-block` is its
next user.

**Status.** It is internal. It is not an entry point and not in the manifest, so it is not public surface
(constitution VII). It is documented in the README's element conventions, and changing this interface is a change to
every element that uses it. A test-only element (`test/fixtures/overflow-host.ts`) uses it exactly as written here
(US1-16, SC-008).

## Module

`packages/elements/src/overflow-region.ts`. It exports:

- the controller class `OverflowRegion`;
- the shared stylesheet `overflowRegionStyles`;
- the pure helpers of § Pure functions.

## Use

```ts
import { OverflowRegion, overflowRegionStyles } from "./overflow-region.ts";

class OcelleCodeBlock extends LitElement {
  static override styles = [css`…the element's own rules…`, overflowRegionStyles];
  readonly #region = new OverflowRegion(this, { box: () => this.renderRoot.querySelector(".region-box") });

  protected override render(): unknown {
    return html`<div class="region-frame">
      <div class="region-box" data-fade=${this.#region.fadeAttribute}>
        <div class="region-track"><slot></slot></div>
      </div>
      <div class="region-ring" aria-hidden="true"></div>
      <div class="region-edge start" aria-hidden="true"></div>
      <div class="region-edge end" aria-hidden="true"></div>
    </div>`;
  }

  override updated(): void {
    this.#region.setLabel(this.label);
  }
}
```

The class names `region-frame`, `region-box`, `region-track`, `region-ring` and `region-edge` are the contract between
the module's stylesheet and the host's template. A host renders that structure once. The host may put its own content
model inside `region-track` (the board puts its lanes row there; the code block its `<pre>`).

## Inputs

| Input | Form | Notes |
|---|---|---|
| host | the `ReactiveControllerHost & HTMLElement` passed to the constructor | the module calls `host.addController(this)` |
| box | `box: () => HTMLElement \| null`, an option of the constructor | the scroll box, an element in the host's shadow root, read after each render |
| label | `setLabel(label: string \| undefined)` | the host's `label`, raw. The module trims it; empty or whitespace-only counts as none |
| host `aria-label` | read by the module from the host attribute; the host lists `aria-label` in its `observedAttributes` and calls `requestUpdate()` on change | non-blank decides naming alone; blank counts as absent (R-01) |
| step | `step?: number`, constructor option, default `40` | px per arrow key (R-02) |

The ring room and the fade depth are not inputs. The stylesheet reads them from the tokens `--ocelle-focus-offset`,
`--ocelle-focus-width` and `--ocelle-scroller-fade-size`, and the clearance arithmetic reads their computed px values
from the box at the time of focus.

## Outputs (read by the host's render; a change calls `host.requestUpdate()`)

| Output | Type | Meaning |
|---|---|---|
| `overflowing` | `boolean` | `scrollWidth − clientWidth > 1` (spec User Scenarios, "Overflow") |
| `offStart`, `offEnd` | `boolean` | content off-screen more than 1 px at the inline start or end, in the box's direction |
| `fadeStart`, `fadeEnd` | `boolean` | `offStart` or `offEnd` and not suppressed by the focus fallback (R-06); the fades and the forced-colours lines both follow these |
| `fadeAttribute` | `"" \| "start" \| "end" \| "both"` | the same state for the `data-fade` attribute the stylesheet selects on |
| `name` | `string \| undefined` | the name in force: the host's non-blank `aria-label`, trimmed, else the trimmed non-blank label, else `undefined` |

## Effects (on the scroll box only, except the one host effect named)

- **Overflowing:** the box has `tabindex="0"`. With a `name`, it also has `role="region"` and `aria-label` set to the
  name. Without one it has no role and no `aria-label` (FR-010).
- **Not overflowing:** the box has no `tabindex`, no `role` and no `aria-label` (FR-002).
- **Arrow keys:** `ArrowLeft` and `ArrowRight` with the box as composed target are handled as R-02 says. Any other key,
  or any key from a descendant, is not touched.
- **Focus clearance:** on `focusin` of a descendant matching `:focus-visible`, the box scrolls by the smallest amount
  that keeps the ring box clear of every edge that will still fade. The fallback suppresses a fade (R-06).
- **Focus handover:** when overflow ends while the box has focus, focus moves to the first tabbable slotted element,
  else to the host with a temporary `tabindex="-1"`. This is the only host effect; it is removed on the host's
  `focusout`, and skipped when the page set a `tabindex` on the host (R-07).
- **Scroll writes:** every write is an instant `scrollLeft` assignment, never smooth (FR-009).

The module emits no event and writes nothing else to the host.

## Lifecycle

| Hook | What the module does |
|---|---|
| `hostConnected` | adds its listeners (`keydown`, `focusin`, `focusout`, passive `scroll`) and starts its `ResizeObserver` |
| `hostUpdated` | re-reads `box()`. On a new box it moves the observer and the attributes to it. It observes `box` and `box.querySelector(".region-track")`, and listens to `slotchange` on every slot inside the track |
| `hostDisconnected` | disconnects the observer and removes its listeners. The box's attributes stay as last set |

**When the state updates (SPEC-1-07).**

| Trigger | Source |
|---|---|
| size of the box or the track | the `ResizeObserver` callback, which runs before paint |
| slot content | `slotchange` |
| edges | `scroll` |

Every trigger recomputes the outputs and calls `requestUpdate()` only when an output changed. Tests wait for
`host.updateComplete` after two animation frames.

## Stylesheet `overflowRegionStyles`

| Element | Rules |
|---|---|
| `.region-frame` | `position: relative` |
| `.region-box` | `overflow-x: auto; overflow-y: hidden`; block padding of the ring room; no outline (the ring is the overlay) |
| `.region-track` | `inline-size: max-content; min-inline-size: 100%; box-sizing: border-box`; inline padding of the ring room |
| `.region-box[data-fade]` | the `mask-image` gradients per value, mirrored under `:host(:dir(rtl))`, inside `@media not (forced-colors: active)` |
| `.region-ring` | absolutely positioned over the box, inset by the ring width, with no pointer events. Shown by `.region-box:focus-visible ~ .region-ring` with the token focus ring; `Highlight` in forced colours |
| `.region-edge` | shown only in forced colours, as a 1 px `CanvasText` line on the side whose `fadeStart` or `fadeEnd` is set |

A host that needs a different track layout (the board's flex row) adds rules to `.region-track` in its own styles; it
does not change the module's.

## Pure functions (unit-tested without layout)

| Function | What it returns |
|---|---|
| `edgeState(scrollLeft, scrollWidth, clientWidth)` | `{ overflowing, offStart, offEnd }`, with the 1 px tolerance and the sign of `scrollLeft` handled |
| `clearanceScroll({ ring, box, fade, fadeStart, fadeEnd, direction })` | the new `scrollLeft` and the sides to suppress (R-06), for LTR and RTL |
| `resolveName(hostAriaLabel, label)` | the `name` output |

## What a later element must not do

- set `tabindex`, `role` or `aria-label` on the box itself;
- handle the arrow keys on the box;
- add a second fade or edge cue;
- write the scroll position with smooth behaviour.

Each of these is owned here.
