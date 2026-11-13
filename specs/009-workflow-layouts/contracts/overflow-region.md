# Contract: the overflow-region module (internal)

The internal module that gives any element a scroll box that is a tab stop and a named group (or region) only while it
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
import { ifDefined } from "lit/directives/if-defined.js";
import { OverflowRegion, overflowRegionStyles } from "./overflow-region.ts";

class OcelleCodeBlock extends LitElement {
  static override styles = [css`…the element's own rules…`, overflowRegionStyles];
  readonly #region = new OverflowRegion(this, { box: () => this.renderRoot.querySelector<HTMLElement>(".region-box") });

  protected override render(): unknown {
    return html`<div class="region-frame">
      <div class="region-box" data-fade=${ifDefined(this.#region.fadeAttribute)}>
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
model inside `region-track` (the board puts its lanes row there; the code block its `<pre>`). The `data-fade`
binding uses `ifDefined`, so the attribute is absent when nothing fades; a plain binding of an empty string would
leave `data-fade=""` on the box (PLAN-FRESH-2-006).

## Inputs

| Input | Form | Notes |
|---|---|---|
| host | the `ReactiveControllerHost & HTMLElement` passed to the constructor | the module calls `host.addController(this)` |
| box | `box: () => HTMLElement \| null`, an option of the constructor | the scroll box, an element in the host's shadow root, read after each render |
| label | `setLabel(label: string \| undefined)` | the host's `label`, raw. The module trims it; empty or whitespace-only counts as none |
| host `aria-label` | read by the module from the host attribute; the host lists `aria-label` in its `observedAttributes` and calls `requestUpdate()` on change | non-blank decides naming alone; blank counts as absent (R-01) |
| role | `role?: "group" \| "region"`, constructor option, default `"group"` | the role the box takes while overflowing and named. The scroller and #13 use the default; the board passes `"region"` (R-01, operator decision PLAN-A11Y-SECURITY-1-006 (b)) |
| step | `step?: number`, constructor option, default `40` | px per arrow key (R-02) |

The ring room and the fade depth are not inputs. The stylesheet reads them from the tokens `--ocelle-focus-offset`,
`--ocelle-focus-width` and `--ocelle-scroller-fade-size`. The clearance arithmetic never parses custom-property text
(an unregistered custom property computes to its token text, `2rem`, not px). It measures laid-out boxes at the time
of focus: the fade depth is the inline size of a `.region-edge` element (`inline-size:
var(--ocelle-scroller-fade-size)`), and the ring room is the track's computed `padding-inline-start`, a used px value
(R-06, PLAN-CORRECTNESS-1-009).

## Outputs (read by the host's render; a change calls `host.requestUpdate()`)

| Output | Type | Meaning |
|---|---|---|
| `overflowing` | `boolean` | `scrollWidth − clientWidth > 1` (spec User Scenarios, "Overflow") |
| `offStart`, `offEnd` | `boolean` | content off-screen more than 1 px at the inline start or end, in the box's direction |
| `fadeStart`, `fadeEnd` | `boolean` | `offStart` or `offEnd` and not suppressed by the focus fallback (R-06); the fades and the forced-colours lines both follow these (FR-011 lists them since the plan gate) |
| `fadeAttribute` | `"start" \| "end" \| "both" \| undefined` | the same state for the `data-fade` attribute the stylesheet selects on; `undefined` when neither side fades, so the bound attribute is removed |
| `name` | `string \| undefined` | the name in force: the host's non-blank `aria-label`, trimmed, else the trimmed non-blank label, else `undefined` |

## Effects (on the scroll box and the module's own shadow nodes only; nothing on the host)

- **Overflowing:** the box has `tabindex="0"`. With a `name`, it also has `role` set to the `role` option (`group` by
  default, `region` for the board) and `aria-label` set to the name. Without one it has no role and no `aria-label`
  (FR-010).
- **Not overflowing:** the box has no `tabindex`, no `role` and no `aria-label` (FR-002).
- **Arrow keys:** `ArrowLeft` and `ArrowRight` with the box as composed target, and with `altKey`, `ctrlKey`, `metaKey`
  and `shiftKey` all false, are handled as R-02 says. No `isComposing` is read: the box is not editable, so no
  composition reaches it (R-02, analysis B1 (b)). A modified arrow, any other key, or any key from a descendant, is
  not touched: no `preventDefault`, no scroll (PLAN-A11Y-SECURITY-1-004).
- **Focus clearance:** on `focusin` of a descendant matching `:focus-visible` (keyboard focus, script focus after
  keyboard use, and any focus of a text-entry control), the box scrolls by the smallest amount that keeps the ring box
  clear of every edge that will still fade. Focus on the module's own nodes is not cleared. The fallback suppresses a
  fade; the module records the `scrollLeft` it wrote (read back after the write, so clamping is included), and the
  suppression ends on `focusout` from the focused element or on a `scroll` whose `scrollLeft` differs from the recorded
  value by more than 1 px. No flag is set around the write: its `scroll` event arrives in a later frame (R-06).
- **Focus handover:** when overflow ends while the box has focus, focus moves to the first focusable slotted element,
  found by a walk over the flattened assigned elements that descends into open shadow roots and counts
  `delegatesFocus` hosts, skipping disabled, `inert`-ancestored and boxless candidates (R-07). When there is none,
  `.region-frame` gets `tabindex="-1"`, is focused, and loses the attribute on its `focusout`; `document.activeElement`
  is then the host (FR-004, operator decision PLAN-A11Y-SECURITY-1-007 (a)).
- **Scroll writes:** every write is an instant `scrollLeft` assignment, never smooth (FR-009). The browser's own
  scrolling of the box on a key from a focused slotted control is not the module's and may animate (FR-009, R-02).
- **Mask figures (R-05, PLAN-FRESH-2-001 (a)):** the module adopts one per-instance constructed stylesheet on the
  host's shadow root, after the host's shared sheets, holding one rule `.region-box {}`. Whenever it writes the edge
  state it reads the box's `clientHeight` and its scrollbar thickness (`offsetHeight − clientHeight` less the block
  borders) and, when either changed, sets that rule's `mask-size` to `100% <clientHeight>px, 100% <thickness>px`
  through `CSSStyleRule.style.setProperty`. It never writes `element.style` and never builds CSS text from input.

The module emits no event and writes nothing to the host. Its per-instance sheet is the one exception to "every
instance adopts one shared stylesheet" that FR-030 and the README name (PLAN-FRESH-2-005 (a)); a host that uses the
module adopts no other per-instance sheet.

## Lifecycle

| Hook | What the module does |
|---|---|
| `hostConnected` | adds its listeners (`keydown`, `focusin`, `focusout`, passive `scroll`), starts its `ResizeObserver`, and adopts its per-instance sheet once (appended to `shadowRoot.adoptedStyleSheets`) |
| `hostUpdated` | re-reads `box()`. On a new box it moves the observer and the attributes to it. It observes `box` (with `{ box: "border-box" }`, so a scrollbar that appears or goes is seen) and `box.querySelector(".region-track")`, and listens to `slotchange` on every slot inside the track |
| `hostDisconnected` | disconnects the observer and removes its listeners. The box's attributes stay as last set |

**When the state updates (SPEC-1-07).**

| Trigger | Source |
|---|---|
| size of the box (border box, scrollbar included) or the track | the `ResizeObserver` callback, which runs before paint |
| slot content | `slotchange` |
| edges | `scroll` |

Every trigger recomputes the outputs and calls `requestUpdate()` only when an output changed. The state is written in
the `ResizeObserver` callback itself, never deferred to a later frame; US1-3's test asserts it in a later-registered
observer's callback in the same delivery (R-03). Every other test waits for `host.updateComplete` after two animation
frames (the driver's `settle()`).

For a host whose track's inline size does not follow its content (the board, whose lanes are contained), a change
that changes only a descendant's inline size inside a slotted child changes neither the box nor the track. It is
picked up at the next size, slot or scroll event (FR-014, operator decision PLAN-FRESH-1-006 (b)).

## Stylesheet `overflowRegionStyles`

| Element | Rules |
|---|---|
| `.region-frame` | `position: relative`. No outline of its own: while it holds the handover focus, its ring is drawn by `.region-ring` (below), because the masked box, a stacking context, paints over an outline of the frame (R-07, PLAN-FRESH-2-004) |
| `.region-box` | `overflow-x: auto; overflow-y: hidden`; block padding of the ring room, for every host (the board adds none of its own); no outline (the ring is the overlay); the platform's scrollbar is kept |
| `.region-track` | `inline-size: max-content; min-inline-size: 100%; box-sizing: border-box`; inline padding of the ring room |
| `.region-box[data-fade="start"]`, `[data-fade="end"]`, `[data-fade="both"]` | inside `@media not (forced-colors: active)`, selected on the three values only, never on attribute presence: `mask-image` with two layers, the fade `linear-gradient` per value (mirrored under `:host(:dir(rtl))`) and an opaque `linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink))`; `mask-position` block start for the fade layer and block end for the opaque one; `mask-origin: border-box`; `mask-clip: border-box`; `mask-repeat: no-repeat`; `mask-composite: add`. `mask-size` comes from the module's per-instance sheet (§ Effects, Mask figures): the fade layer is the client height, so it stops at the scrollbar, and the opaque layer is the scrollbar's thickness, so the scrollbar stays unmasked (R-05, operator decisions PLAN-FRESH-1-003 (a) and PLAN-FRESH-2-001 (a)). A `mask-clip` does not keep Chromium's mask off the scrollbar; only this geometry does. Gradients pass `ocelle/token-only` after the gate change of contracts/gates.md |
| `.region-ring` | absolutely positioned over the box, inset by the ring width, with no pointer events. Shown by `.region-box:focus-visible ~ .region-ring` (the box's ring) and by `.region-frame:focus-visible > .region-ring` (the handover ring, R-07) with the token focus ring; `Highlight` in forced colours. It comes after the box, so it paints over the masked box |
| `.region-edge` | always laid out: absolutely positioned at the box's inline start (`.start`) or end (`.end`), `inline-size: var(--ocelle-scroller-fade-size)`, `box-sizing: border-box`, no pointer events, nothing painted outside forced colours; the module's fade-depth measure. In forced colours, on the side whose `fadeStart` or `fadeEnd` is set, `var(--ocelle-border-width) solid CanvasText` on its outer inline side |

A host that needs a different track layout (the board's flex row and its lanes' `contain: inline-size`, research.md
R-08) adds rules to `.region-track` and its slotted children in its own styles; it does not change the module's, and it
adds no block ring room of its own.

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
- write the scroll position with smooth behaviour;
- bind `data-fade` without `ifDefined`, or set the mask's size or a ring on `.region-frame` itself.

Each of these is owned here.
