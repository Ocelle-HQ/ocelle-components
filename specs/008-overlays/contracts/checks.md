# Contract: checks for the overlays

No new gate. The existing gates cover this feature as follows.

| Gate | What it proves here |
|---|---|
| `typecheck`, `lint`, `test-lint` | As for every element. |
| `style-lint` (`token-only`) | The three elements' `css` templates use only tokens, `var()`/`calc()`, `%`, keywords and system colours (forced colours). No new allowance is planned. |
| `unit-tests` | `elements` (in process, mutated) and `elements-browser` (strict-CSP fixture, built browser build) run the shared scenarios; `elements-touch` (in process with `hasTouch`, mutated) runs only the touch rows, and the fixture runs them in a separate touch context (R-14). `elements-node` runs the manifest and README tests, `elements-build` the build and pack tests. `tokens` and `tokens-browser` cover the three new tokens. |
| `mutation` | Changed lines in `packages/elements/src/**` (elements-only config, which runs the `elements` and `elements-touch` projects) and `packages/tokens/src/source.ts` (default config). Timeout and CompileError mutants are report lines (007). R-15 aims for zero Timeouts. |
| `csp` | Built output: no inline style, `style` attribute or string timers. FR-047's run-time "no `style` attribute" is proven by the scenarios (`styleAttributes()`), since the `csp` gate cannot see CSSOM writes. |
| `prefix` | No `sk-` names, no monospace. |
| `contrast` | No new colour pairs: the bubble uses `color-chrome-ink` on `color-chrome`, already checked. |
| `brand-rules` | Rule (f) is unchanged: `tooltip-delay` is not zeroed under reduced motion (R-09). |
| `manifest` | The three new entries are generated and committed. `no-description` covers every new member. A manifest test asserts each entry's events (two per overlay with detail types, none for the tooltip), slots, parts and CSS property (R-01, SC-003). |
| `storybook-build`, `visual`, `axe` (from #10) | The stories of data-model § Stories, with baselines in light and dark and axe clean. **Recheck when #10 lands** (research R-16). Baselines are not the evidence for motion, forced colours or geometry; the matrix below is. |

## Test matrix (FR-043, SC-001, SC-002, SPEC-1-09, SPEC-1-11, SPEC-2-04)

Each row runs in process and on the strict-CSP fixture, both at a 1280 × 800 viewport unless the row sets another
(R-14). After each row, FR-047's counts are asserted as a delta from mount, with transient writes counted: 0 `style`
attributes and 0 added `<style>` elements. No row uses `driver.style()` (R-14). Event rows read the state recorded at
dispatch by `record()`: at `…-close-request`, `open` is true and the inner dialog is `:modal`; at `…-close`, `open` is
false, the inner dialog is neither open nor `:modal`, and focus is already on its FR-009 target. Motion rows run with
`--ocelle-motion-base` at its real value and again under reduced motion.

### Harness self-tests (Phase 1, before any element)

Each new driver method and browser command, in both harnesses, with stand-in elements; each is red against the driver
as it is (R-14): style-attribute count (nested shadow root, CSSOM write, written then removed); `<style>` count in a
shadow root; `topLayer()` order; `focusPath()` into a shadow root; `focusVisible()` after Tab and after a click;
`record()` state at dispatch; `animations()` timing and keyframes; `pointer()` stopping at a point; `touchTap()`
pointer type (touch context); `viewport()` at 1280 × 800; `emulateReducedMotion` set and reset; `axTree` description,
modal, level. Device: the default context (`elements`, `visit()`) matches `(hover: hover)` and `(pointer: fine)` with
`maxTouchPoints` 0; the touch context (`elements-touch`, `visit(…, { touch: true })`) has `maxTouchPoints` above 0
(R-14).

### Dialog

- **Open and initial focus**: autofocus; first focusable; close control (no focusable content); first body element
  CSS-hidden (`display: none`, `visibility: hidden`), so focus goes to the next; a radio group as the first stop
  (the checked radio, else the first).
- **Tab cycle** (SC-002): for n stops, n + 2 Tab presses give `focusPath()` equal to the expected wrap-around list,
  with no `body` entry; the same for Shift+Tab; started from the first stop, the last stop and the close control. A
  radio group is one stop; a CSS-hidden element is skipped.
  - **From a non-stop** (R-04): started, in both directions, from the focused `<dialog>` (after a pointer click on
    body prose, `focusPath()` reads the dialog) and from a slotted `tabindex="-1"` element focused by script: the
    first press goes to the next (previous) stop in flat-tree order, then the exact wrap-around list, no `body`.
  - **From the body** (R-02, R-04): a focused slotted button that the host removes (focus on the body): Tab gives the
    first stop, Shift+Tab the last, then the exact list.
  - **Slotted scroller** (R-04): a body ending in a wide prose table (`data-ocelle-prose`, no links, overflowing on
    the inline axis) with no footer, and the same table before a footer with one button, both directions: the exact
    `focusPath()` lists include the table once, in its place, and no `body`; ArrowRight on the focused table scrolls
    it.
- **Long body** (FR-018): a prose-only body taller than `dialog-max-block`: panel height ≤ `dialog-max-block`, heading
  and footer boxes inside the panel, body `scrollHeight > clientHeight`, Tab from the close control reaches the body,
  ArrowDown and PageDown then scroll it; the body has no `tabindex` once it no longer overflows. Short viewport
  320 × 256: the body keeps its minimum block size and its last content is reachable by scrolling (R-18).
- **One-line body** (operator decision, R-18): a body of one short sentence at 1280 × 800: the body part's block size
  (border box) equals the computed `calc(3 * var(--ocelle-target-min))`, 132 px, the text at its block start; the
  body has no `tabindex`.
- **Escape** × {no veto, veto, veto then Escape twice}: one request with reason `escape`, then close (no veto), or
  open with focus inside on every press (veto). The same three after a pointer click on body prose (focus on the
  `<dialog>`), after that click and a Shift+Tab, and after the host removed a focused slotted button (focus on the
  body): one request per press, never a `cancel:false` close, open with focus inside under veto (R-02, R-04).
- **Escape with slotted content**: a focused slotted control that stops Escape's propagation × {no veto, veto, veto
  then Escape twice}: no veto closes with `escape`; veto keeps it open on the first press; the second press closes
  with reason `host` (the stated limit, R-02). A slotted control that calls `preventDefault()` on Escape: no request,
  the dialog stays open. A slotted `<input type=search>` with a value: Escape clears the value, no request, open. An
  Escape with `isComposing`: no request.
- **Synthetic `cancel`**: a dispatched non-cancelable `cancel` followed by the inner `close()`: `…-close` with `host`;
  a cancelable `cancel` runs the request path once.
- **Close control** by click, Enter and Space × {veto, no veto}, reason `close-button`; its box ≥ `target-min` in both
  axes; the focus ring from the focus tokens when focused by keyboard.
- **Backdrop click**: nothing dispatched, still open.
- **Host close** (`open = false`): reason `host`, no request.
- **Platform close**: inner `close()` through the shadow root: reason `host`, `open` false, focus returned. A slotted
  `<form method="dialog">` submitted: nothing happens (open, `open` true, no event, R-03).
- **Focus return**: opener inside a shadow root (the inner button); opener removed (body, nothing thrown); opener
  disabled before close (body, nothing thrown, no console message); opener made inert (body); opened with focus on
  the body (returns to body); opener a custom element's inner button removed while its host stays (body).
- **Focus return is conditional** (motion on): (a) close A and open B in one task: focus stays in B when A's exit
  ends; closing B returns focus to the page control that opened A; (b) set `open = false` and focus another page
  control in the `…-close` listener: focus stays on that control (`focusPath()` read after the event and after the
  next frame); (c) set `open = false` then call `focus()` on another page control during the exit: focus does not
  move there (the page is inert) and lands on the opener when the exit ends.
- **Nested** (dialog slotted inside an open drawer): one Escape gives exactly one request event, on the dialog; the
  drawer stays open and `:modal`; focus returns into the drawer. Tab in the dialog never runs the drawer's wrap. A
  dialog opened from the drawer whose opener is removed before close: focus on the drawer's initial target.
- **Removed while open**: no inert content, no top-layer entry, no backdrop; `open` false, no event.
- **Moved while open** (operator decision, R-05a): open, remove, re-insert in the same task, and in a later task:
  `open` false, the dialog not `:modal` and not open, the page not inert, no event, FR-047 counts; then `open = true`
  shows it modally with initial focus.
- **Rapid toggle**: `open` true and false in one task; re-open during the exit with motion on: the animation is
  cancelled, the dialog stays `:modal`, no close event.
- **Input during the exit** (motion on, R-02, R-06): after a request that is not cancelled, within the exit: Escape
  twice; two close-control clicks; Enter keydown twice on the close control (the second with `repeat`): in each case
  exactly one `…-close-request` and one `…-close`, no `cancel` event, and focus on the opener after the close.
- **Stale native `close` event** (R-03): the host sets `open = true` in the `…-close` listener (motion on and under
  reduced motion): after the next task and the next frame the dialog is shown and `:modal`, `open` is true, exactly
  one `…-close` was dispatched; remove, re-insert and set `open = true` in the same task: after the next task and the
  next frame shown, `:modal`, `open` true, no `…-close`; the inner `close()` row above still gives `host`.
- **Motion** (`animations()`): entry and exit are opacity keyframes with duration equal to the computed
  `--ocelle-motion-base` and easing equal to the computed `--ocelle-easing-standard`. Under reduced motion no
  animation is created, also when an ancestor sets `--ocelle-motion-base: 200ms` (R-06).
- **Styles** (computed): border, padding, margin, background, colour and max sizes equal the token values (UA reset);
  `::backdrop` background is `color-overlay`; radius `radius-2`; shadow `elevation-raised`. Sizes: uncapped (1280 wide:
  inline size equals the computed `--ocelle-dialog-inline-size`) and capped (a viewport narrower than that: width ≤
  `dialog-max-inline`). Body inline size definite with prose and a table (FR-019). Footer slot empty: no footer box;
  filled: footer box at the panel's end.
- **Forced colours** (`emulateForcedColors`, both palettes): panel border visible in `CanvasText`, panel ground
  `Canvas`, close control focus indicator visible (outline), backdrop does not cover the border.
- **Accessibility tree**: one modal `dialog` named by `label`, heading level 2, close control a button named by
  `close-label`, icon hidden. Host `aria-label` (with and without `label`): while open exactly one named node for the
  overlay, the modal dialog, named by the host `aria-label`; while closed the host as measured (a named `generic`),
  recorded in the README § Host ARIA (R-08).

### Drawer

- The dialog's rows with `ocelle-drawer-` events (initial focus, Tab cycle with its non-stop, body and scroller
  starts, long body, one-line body, Escape and its slotted-content rows, close control, host and platform close,
  focus return, nested, removed, moved, rapid toggle, input during the exit, stale native `close` event, styles,
  forced colours, accessibility tree).
- **Backdrop during the exit** (motion on, R-07): a double click on the backdrop with no veto: exactly one
  `ocelle-drawer-close-request` and one `ocelle-drawer-close`, both with reason `backdrop`.
- **Backdrop**: a primary click on the backdrop on each side of the panel (start and end, under `ltr` and `rtl`) ×
  {veto, no veto}, reason `backdrop`; a click on the panel's padding (inside the border box, target the `<dialog>`):
  nothing; a press inside released on the backdrop: nothing; a press on the backdrop released inside: nothing; a
  secondary-button click on the backdrop: nothing.
- **Placement**: `side` × `dir`: panel against the expected physical edge, full viewport block size.
- **Size**: inline size equals the computed `--ocelle-drawer-inline` and ≤ `dialog-max-inline`.
- **Motion**: `side` × `dir`: the entry `translate` keyframe starts at the sign that moves the panel in from its own
  edge, the exit ends there; duration and easing from the tokens; none under reduced motion.
- **Ground**: `ground="chrome"` computes chrome ground and ink; the default the sheet.
- **`heading-hidden`**: heading not painted and no space (box of `size-visually-hidden`), still in the tree as a
  level-2 heading, name unchanged, close control visible, focusable and at the block start; without it the heading
  is painted.

### Tooltip

- **Hover delay** (test delay 300 ms, R-15): not shown at 150 ms, shown by 450 ms; re-entry trigger → bubble →
  trigger before the delay: shown by 450 ms from the first entry; under reduced motion the same bounds (the delay is
  not zeroed); delay 0: shown in the same task.
- **Keyboard focus**: Tab to the trigger shows at once whatever the delay. Click focus on a button: not shown.
- **Late `:focus-visible`**: click the trigger, move the pointer off both boxes (`pointer()`), press Shift, assert
  `focusVisible()` is true for the trigger, then assert no bubble within 450 ms.
- **Text-field trigger** (stated limit, R-12): a clicked `<input type=text>` trigger shows the bubble at once.
- **Hoverable gap**: `pointer()` from the trigger stops at a point inside the gap: shown; moves on to the bubble:
  shown; stops beyond the padded gap: hidden.
- **Leave**: pointer leaves both, no keyboard focus: hidden; focusout while not hovered: hidden.
- **Escape**: hides; the bubble stays dismissed until the pointer re-enters or keyboard focus re-enters; a `keydown`
  recorder on the document and on an enclosing overlay host sees nothing. Inside an open dialog: the first Escape
  hides the bubble only, the second requests the dialog's close (SC-005).
- **Trigger opens an overlay**: hover a trigger past the delay, click it to open a dialog, and the same for a drawer:
  the bubble is hidden when the overlay opens and one Escape requests the overlay's close.
- **Touch** (touch context only: `*.touch.test.ts` in `elements-touch` and on `visit(…, { touch: true })`, R-14):
  `touchTap()` on a button trigger: the trigger's action runs, no bubble on the tap or while it keeps focus.
- **Empty `text`**, **`disabled`**: no bubble on hover or focus. Trigger becomes `disabled` while shown: hidden.
  Trigger removed while shown: hidden.
- **Slot change**: the slotted trigger replaced: the new trigger shows the bubble; the old one gets no bubble, no
  listeners and no id.
- **Two tooltips**: showing one hides the other.
- **Placement**: each `placement`; flip at an edge; cross-axis clamp; each under `ltr` and `rtl` (`start` on the right
  under `rtl`, flip and clamp mirrored); clipped (`overflow: hidden`) and transformed containers; inside an open
  dialog and drawer (bubble above the backdrop, whole).
- **Following the trigger**: scroll a light-DOM container while shown; scroll the open dialog's body with a
  keyboard-focused trigger inside it; resize the viewport: the bubble's box stays beside the trigger within one frame.
- **Size**: bubble width ≤ `tooltip-max-inline`; an unbreakable string stays inside the bubble.
- **Host layout** (`display: contents`): a pill-shaped button in a narrow container, wrapped and unwrapped: its box is
  the same and it still ellipsises.
- **Accessibility tree**: without `describes`: no tooltip node, no description, text only as the trigger's name;
  name and text differing in case or spacing: no description. With `describes` on a button: the description is the
  text; text equal to the name: still the description.
- **`describes` lifecycle**: text with markup (`<b>x</b>`): the description is the literal string and the span has no
  element children; the span's id is unique in the trigger's root; a host `aria-describedby="x"` keeps `x` after
  `describes` is set, unset and the tooltip disconnected; text changed: description updated; text emptied: no span,
  no id; the host overwrites the trigger's `aria-describedby`: the tooltip's id is back after one microtask and the
  host's ids are kept; the host removes the span (a re-render of the tooltip's children): after one microtask one
  span is back with the same id and text, and the trigger's description is the text; slot change: the new trigger is
  described, the old one no longer carries the id.
- **Forced colours**: bubble ground `Canvas`, ink `CanvasText`, `CanvasText` border.
- **No Popover API**: with `showPopover` removed from `HTMLElement.prototype` before the element is defined (in
  process only): hover and focus show nothing, the bubble has no box, nothing throws.
