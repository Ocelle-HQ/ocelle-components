# Research: Overlays — Dialog, Drawer and Tooltip

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-12
(squad rounds 1 and 2 fixes 2026-11-13)

Measurements were taken in this container with Playwright 1.64.1's Chromium (153.0.8010.12), using the probes noted
under each decision. WebKit is not measured here (elements README § Engines). Facts about the repository come from
`main` at `476602e` and the #10 branch `origin/claude/010-storybook-workbench` (`specs/006-storybook-workbench`,
unmerged). Results marked "squad probe" were measured by the plan squad's round 1 (review files under
`reviews/plan/round-1/`), with scripts kept outside the repository.

## R-01 Overlay base: one internal base class, two elements

- **Decision**: `ocelle-dialog` and `ocelle-drawer` share an internal base class `OcelleOverlay` in
  `packages/elements/src/overlay.ts` (not an entry point, no tag). It owns `open`, `label`, `close-label`, the
  rendered `<dialog>`, focus, Escape, the close control, events and motion. The subclasses add layout (dialog: centred,
  `--ocelle-dialog-inline-size`; drawer: `side`, `ground`, `heading-hidden`, backdrop click) and their event prefix.
- **Rationale**: FR-001 to FR-023 are shared word for word; one implementation means one set of mutants and one place
  for the Escape and focus rules that #12 will lean on.
- **Manifest**: the gate's generator is `packages/elements/scripts/manifest.ts`. It reads only modules matching
  `/^ocelle-[\w-]+\.ts$/` (manifest.ts:36, :120), and `test/node/manifest.test.ts:205` pins "reads every
  `src/ocelle-*.ts` … and nothing else of `src/`". `custom-elements-manifest.config.mjs` is for the CLI only. No source
  today uses `@fires`, `@slot`, `@csspart` or `@cssprop`, and 005's entries have empty lists.
  - **Decision**: each concrete class (`ocelle-dialog.ts`, `ocelle-drawer.ts`) carries the JSDoc tags for its whole
    surface: `@slot` (default, `footer`), `@csspart` (`panel`, `heading`, `body`, `footer`, `close-button`),
    `@cssprop --ocelle-dialog-inline-size` (dialog only), and the two `@fires` tags in the analyzer's documented
    form, type first, then name, then description (round 1 verify 2, PLAN-CORRECTNESS-1-006; squad round 2):
    `@fires {CustomEvent<{ reason: "escape" | "close-button" }>} ocelle-dialog-close-request - …` and
    `@fires {CustomEvent<{ reason: "escape" | "close-button" | "host" }>} ocelle-dialog-close - …`. The drawer's
    pair is written the same way, with `ocelle-drawer-` names and `"backdrop"` in both unions. The base builds event
    names from a subclass prefix, which the analyzer cannot read, so the tags are the events' only source.
    `ocelle-tooltip.ts` carries `@slot` (default) and `@csspart bubble`, and states no `@fires`, so its events list
    is empty (FR-045).
  - Phase 2's first task measures whether the analyzer lists the base's inherited properties on each subclass with
    their descriptions while the base is outside the filter. If it does, nothing else changes. If it does not, the
    filter must change: `scripts/manifest.ts` and `test/node/manifest.test.ts` are then changed files, the pinned test
    is replaced by a stricter one ("reads every `src/ocelle-*.ts` and `src/overlay.ts`, and nothing else"), red first,
    with the reason recorded (constitution VIII).
  - A manifest test asserts, per overlay, exactly two events with their detail types, the two slots, the five parts
    and (dialog) the one CSS property, and for the tooltip one slot, one part and an empty events list (SC-003).
- **Alternatives**: a mixin (the analyzer's mixin support is weaker and the type surface noisier); two copies
  (rejected: duplicated mutants and drift).

## R-02 Escape, the platform's close watcher and the veto

- **Measured** (probe `probes/probe2.cjs`, Chromium 153): with only a `cancel` listener that calls `preventDefault()`, the
  first Escape fires `cancel` with `cancelable: true` (vetoed). The second Escape without user activation in between fires
  `cancel` with `cancelable: false`, and the dialog **closes**. With a `keydown` listener on the `<dialog>` that calls
  `preventDefault()` for Escape, three Escapes fire no `cancel` and the dialog **stays open**.
- **Measured** (squad probes): a nested overlay host slotted inside an outer one passes one Escape keydown through both
  `<dialog>`s (`inner:false`, `outer:true`). A slotted `<input type=search value=abc>` keeps its value when the
  dialog's handler prevents the default (native: the value clears and the dialog stays open). A slotted control that
  stops Escape's propagation lets the `cancel` path run: `cancel:true`, then `cancel:false` and the dialog closes.
- **Topmost** (FR-010, FR-023): a module-level stack of open overlays, internal to the package. An overlay is pushed
  when it calls `showModal()` and removed when its `<dialog>` closes or the host disconnects. An overlay acts on a
  keydown (Escape here, Tab in R-04) only when it is the top of the stack. No `stopPropagation()` is called, so hosts
  still see the key.
- **Decision**: the overlay handles Escape on `keydown` (bubble phase, on its `<dialog>`). It ignores the event, neither
  preventing it nor requesting, when any of these holds:
  - the overlay is not the top of the stack;
  - the event is already `defaultPrevented` (a slotted widget, an inner overlay or a tooltip handled it);
  - `isComposing` is true (an IME composition is cancelled by the key);
  - the target, followed to the deep active element, is a text field whose Escape has a native action: an `<input>`
    of type `search` with a non-empty value.
  Otherwise it calls `preventDefault()` and runs the request path (FR-010, FR-013).
- **Focus on the body inside an open overlay** (squad round 2, PLAN-FRESH-2-001): two ways remain for focus to reach
  the document body while an overlay is open, after R-04 handles every Tab: a focused slotted element that the host
  removes (or hides, or disables), and a host `blur()`. From the body, Escape's `keydown` targets the body and never
  passes the `<dialog>`, so the keydown path above would be skipped and the platform's repeated-Escape rule would
  close a vetoed overlay. So, while an overlay is the top of the stack, it also listens to `keydown` on `document`
  (bubble phase) and handles an event whose deep active element is the document body as if it had reached its
  `<dialog>`: Escape goes through the same rules and request path, and Tab goes through R-04 (to the first stop,
  Shift+Tab to the last). The listener is added when the overlay becomes the top and removed when it stops being it.
  An event from inside the overlay is never handled twice: the `document` path acts only when the deep active element
  is the body. No case is left to the stated limit below except slotted content that stops Escape's propagation.
- **While `closing`** (squad round 2, PLAN-FRESH-2-003): `open` is already false but the overlay is still modal and the
  top of the stack until its `<dialog>` closes (R-06). In that state an Escape `keydown` that the overlay acts on (it is
  the top of the stack) is prevented (`preventDefault()`, so the platform fires no `cancel`) and requests nothing,
  whatever the rules above say; a cancelable `cancel` is prevented and requests nothing; a non-cancelable `cancel` and
  the native close it causes end the exit early (R-03). Close-control and backdrop clicks are ignored (R-07, R-06). Only a host `open = true` leaves
  `closing` (R-06). So a held Escape, Enter held on the close control or a double click on the backdrop gives exactly
  one request and one `…-close` (FR-014).
- **`cancel`**: the overlay listens to `cancel` on its `<dialog>`.
  - A **cancelable** `cancel` (a press the keydown path did not handle, for example because a slotted control stopped
    its propagation) is prevented and, in `shown` only, runs the request path once, with reason `escape`.
  - A **non-cancelable** `cancel` cannot be vetoed (`preventDefault()` has no effect). It is a platform close: the
    overlay lets it happen and handles the resulting `close` as R-03 does, with reason `host`.
  - So the veto holds on every repetition of an Escape that reaches the overlay's keydown (US1-4). When slotted
    content stops Escape's propagation, the platform's repeated-Escape rule can close a vetoed overlay on the second
    press, with reason `host`. The README states this limit and tells widgets inside an overlay to call
    `preventDefault()` rather than `stopPropagation()` for an Escape they handle.
- **Not used**: `closedby` and `requestClose()` (Chromium 134 / WebKit 26 and Chromium 134 / WebKit 18.4: above the
  floor); the plan keeps the floor at what the tooltip needs (R-10). A capture-phase handler is not used either: it
  would run before slotted widgets and take their Escape.

## R-03 Platform-initiated closes (FR-016)

- **Measured** (squad probe): a `<form method="dialog">` slotted into a shadow-root `<dialog>` shown modally does
  nothing when submitted: no `close` event, the dialog stays open, no navigation. The form-submission algorithm takes
  the form's nearest ancestor `<dialog>` in the DOM tree, and the inner dialog is in the shadow tree.
- **Decision**: the platform closes that remain are `close()` called on the inner `<dialog>` through the open shadow
  root, and a non-cancelable `cancel` (R-02). A platform close sets `open` to false, returns focus (R-05) and
  dispatches `…-close` with `detail.reason === "host"`. Nothing is prevented.
- **Measured** (squad round 2 probe, Chromium 153): `close()` queues the `close` event as a task. After `close()`, one
  microtask (a Lit update) and `showModal()`, or after removing a modal host, `close()`, re-inserting it and
  `showModal()` in one task, the `close` event arrives later with the `<dialog>` open and `:modal`.
- **Which `close` event is a platform close** (squad round 2, PLAN-FRESH-2-004): the overlay counts its own
  `close()` calls on the inner `<dialog>` (R-06 at the end of the exit, R-05a on disconnection). Each native `close`
  event first consumes one pending own call, if any, and is then ignored. An event that consumes none is a platform
  close only when the overlay is in `shown` (or `opening`, whose entry animation is then cancelled) and the inner
  `<dialog>` is not open at the time of the event; otherwise it is ignored. In `closing`, such an event (the
  platform closed the `<dialog>` during the exit) ends the exit early: the animation is cancelled, focus returns
  (R-05) and the pending `…-close` is dispatched once, with the closing reason. So a stale event that arrives after a
  host reopened the overlay in its `…-close` listener, or after a re-insert and `open = true` (R-05a), never closes
  the reopened overlay and dispatches nothing.
- **Forms**: a slotted `method="dialog"` form does nothing to the overlay: `open` stays true, no event, focus stays.
  The README tells hosts to close the overlay with `open = false` from their own submit handler. The test matrix
  asserts both the inner `close()` path and the inert form.

## R-04 Initial focus and the Tab cycle (FR-007, FR-008, FR-018)

- **Decision**: after `showModal()`, the overlay focuses explicitly rather than relying on the dialog focusing steps
  (their treatment of slotted and shadow content differs between engines and is not specified for slots). Order:
  the first element marked `autofocus` among the default slot's assigned elements and their descendants (shadow roots
  included); else the first focusable element of the default slot's flattened content in tree order; else the close
  control. Footer content is not an initial focus target (FR-007 names the body only).
- **Tab cycle**: the tab order is the close control (in the header), then the body's content (or the body itself, see
  below), then the footer's. While the overlay is the top of the stack (R-02), it handles **every** Tab and Shift+Tab
  `keydown` that reaches its `<dialog>` and is not already `defaultPrevented`: it builds the stop list (the walk
  below), moves focus to the next stop (Shift+Tab: the previous one), wrapping at the ends, and calls
  `preventDefault()`. The next stop is decided from the deep active element's position in flat-tree order, not from
  equality with a stop (squad round 2, PLAN-FRESH-2-001):
  - focus on a stop: the stop after it (before it);
  - focus inside the overlay on no stop (the `<dialog>` itself after a click on prose, padding or the heading; the
    panel; a slotted `tabindex="-1"` element focused by script; a focused element inside a scroller): the first stop
    after it in flat-tree order (the last stop before it), wrapping;
  - focus on the document body (a removed focused element, R-02): the first stop (the last).
  The rest of the document is inert through `showModal()`; the explicit handling keeps focus out of the browser chrome
  and off the document body, so the sequence is the same in every engine, whatever the engine's own sequential
  navigation would do from a non-stop. The squad probes showed Chromium without the wrap passes through `body` once
  per cycle, and that Shift+Tab from a focused `<dialog>` goes to `body`, so the tests assert the exact sequence
  (SC-002) and start it from non-stops too.
- **Body as a stop** (FR-018): while the `body` part overflows (`scrollHeight > clientHeight`, checked on a
  `ResizeObserver` of the body and its slot content and on `slotchange`), it carries `tabindex="0"`; otherwise the
  attribute is absent. The walk lists it as a stop in its place before the body's own content. So a prose-only long
  body is reachable by Tab and scrolls with the arrow and Page keys in every engine, and axe's
  `scrollable-region-focusable` is met. The body is not named; it is a plain scroller inside the named dialog.
- A small internal module `src/focusable.ts` holds the "tabbable in flat-tree order" walk (open shadow roots and slots
  followed). Excluded: `disabled`, `inert`, `hidden`, `tabindex="-1"`, elements with no layout box
  (`getClientRects().length === 0`, which covers `display: none` and closed `<details>` content) and elements whose
  computed `visibility` is not `visible`. A radio group (same `name`, same form owner or tree) is one stop: its checked
  radio, or its first when none is checked.
- **Scrollers as stops** (squad round 2, PLAN-FRESH-2-002): the walk also lists, in its tree position, every rendered
  element of the overlay's content without a `tabindex` whose computed `overflow-x` or `overflow-y` is `auto` or
  `scroll`, that overflows on that axis (`scrollWidth > clientWidth` or `scrollHeight > clientHeight`) and that has no
  tabbable descendant, as Chromium's keyboard-focusable scrollers do (Chromium 130 and later). Measured (squad round 2
  probe, Chromium 153): without the explicit handling, Tab from the close control over a slotted button and then an
  overflowing `<div>` gives `b1 scr BODY`. This covers a wide prose table (`[data-ocelle-prose] table` is
  `display: block; overflow-x: auto`, `packages/styles/src/base.css:190-193`, whose Tab stop 003 research relies on)
  and a `<pre>`. Where the engine does not focus a scroller without a `tabindex` (Chromium 120 to 129, WebKit), the
  "Focus checked" rule below skips it, so the cycle there is the remaining stops with no stop on the body; such a
  table is then reachable by keyboard only as the engine allows it outside an overlay. The README states this. The
  overlay never writes a `tabindex` on slotted content (it belongs to the host); the body part's own `tabindex`
  stays as below.
- **Focus checked**: after each `focus()` call (initial focus and every Tab move) the overlay reads the deep active
  element. If focus did not land on the candidate, it tries the next candidate in the same direction, ending with the
  close control. It is mutation-tested through the overlay scenarios, with a scenario per exclusion, the radio group, a
  CSS-hidden first element, the overflowing body, a slotted scroller and each non-stop start.

## R-05 Focus return (FR-009, SPEC-1-12)

- **Decision**: at open, record the opener: the deepest active element (`document.activeElement` followed through
  `shadowRoot.activeElement`). If that element is inside an overlay that is closing (its exit is running), the overlay
  records that overlay's own opener instead.
- **Only when focus is still ours**: on close, focus is moved only if the deep active element is inside the closing
  overlay or is the document body. If a follow-up overlay has taken focus, the overlay leaves it there.
- **Host focus moves** (verify 1): the `<dialog>` stays modal until the exit ends (R-06), so the rest of the page is
  inert during the exit and a host `focus()` on page content then does nothing; focus stays in the closing overlay
  and is returned to the opener. `…-close` is dispatched after the return (R-06), so a focus move in that listener
  is final. The README says: move focus after a close in the `…-close` listener; a move to page content between
  `open = false` and `…-close` has no effect while motion runs.
- **Where**: the opener if it is still connected, not `disabled` and not inside an inert subtree. Otherwise:
  - if an overlay beneath is still open, focus goes to that overlay's initial focus target (R-04);
  - else focus goes to the document body (`document.activeElement === document.body`), with nothing thrown.
  The README states both.
- **Squad case** (PLAN-FRESH-1-003): A closes and B opens in one task. B records A's opener (remapped), not A's button.
  When A's exit ends, focus is in B, so A moves nothing. When B closes, focus returns to the page control that opened
  A.

## R-05a Disconnection while open (FR-004, FR-022; operator decision PLAN-FRESH-1-001 (b))

- **Measured** (squad probe): a shadow `<dialog>` shown modally whose host is removed stays `open` but not `:modal`;
  re-inserted it renders in flow (`display: block`) and `showModal()` throws `InvalidStateError`.
- **Decision**: in `disconnectedCallback` an open or closing overlay cancels any running animation, calls `close()` on
  its inner `<dialog>` (counted as its own, so the queued `close` event that arrives after a re-insert and
  `open = true` is ignored, R-03), leaves the overlay stack, drops its opener and sets `open` to false, with no event
  and no focus move. A close in progress ends the same way, without its `…-close`. Re-inserted, the element is
  closed; the host sets `open = true` to show it again (initial focus and a fresh opener as for any open).
- The README states it: a host that moves an open overlay in the DOM (a morph, a keyed reorder, a portal) reopens it
  afterwards. The spec's edge case "Moved while open" and FR-022 say the same.

## R-06 Close timing and motion (FR-014, FR-020, SPEC-1-05, SPEC-1-06)

- **Decision**:
  - Order on close: `open` becomes false, then the exit animation runs, then `<dialog>.close()`, then focus returns
    (R-05), then `…-close` is dispatched.
  - The close event therefore fires when the element has left the top layer.
  - Under reduced motion the duration is 0 and all of it happens in the same task after the next update.
  - Setting `open` again during an exit cancels the animation: the dialog stays shown, and no close event is
    dispatched for the cancelled close.
  - During the exit (`closing`) user input asks for nothing (squad round 2, PLAN-FRESH-2-003): Escape and a
    cancelable `cancel` are prevented and request nothing (R-02), close-control activations (click, Enter, Space,
    and their key repeats) and backdrop clicks (R-07) are ignored. Only a host `open = true` leaves `closing`. One
    close therefore gives exactly one `…-close` (FR-014).
  - The `close()` at the end of the exit is counted as the overlay's own, so its queued `close` event, which may
    arrive after a host reopened the overlay in the `…-close` listener, is consumed and ignored (R-03).
- **Mechanism**: the Web Animations API (`element.animate`), not CSS transitions. Closing a top-layer `<dialog>` with
  an exit transition needs `transition-behavior: allow-discrete` / `@starting-style` (WebKit 17.4 / 17.5) or `overlay`
  (no WebKit). WAAPI is in WebKit since 13.1 and writes no `style` attribute (FR-047).
  - The duration is read from the computed `--ocelle-motion-base` on the host; the easing is read from
    `--ocelle-easing-standard`.
  - Keyframes: the dialog fades (`opacity` 0 → 1). The drawer slides on the inline axis (`translate` from -100 % or
    100 %, signed by its side and by `:dir(rtl)`) and fades.
  - `animate()` is skipped when `matchMedia("(prefers-reduced-motion: reduce)").matches` or the duration is 0 ms. The
    media check is needed because the tokens zero `--ocelle-motion-base` only at `:root` (`generate.ts:281`), and a
    host may set the token on an ancestor.
  - The backdrop is not animated.
  - Keyframes are JS values, not element CSS. They use only `%` and unitless opacity, so they meet constitution II's
    intent.
- **Floor**: nothing here is newer than WebKit 17, so the floor stays where the tooltip puts it (R-10).

## R-07 Backdrop click (FR-012)

- **Decision**: the `<dialog>` element is the panel, so a click on `::backdrop` targets the dialog with coordinates
  outside its border box. The drawer records `pointerdown` (primary button, `isPrimary`). A `click` whose `pointerdown`
  and `click` both lie outside the panel's border box, and whose target is the `<dialog>` itself, is a backdrop click.
  A press that starts inside and ends outside, or starts outside and ends inside, is not one. A backdrop click while
  the drawer is `closing` is ignored (R-02, R-06), so a double click requests once.
- **Squad probe**: a click 5 px inside a padded modal dialog and a click on the backdrop both have `target` = the
  dialog, so only the coordinate check separates them; the matrix clicks the panel's padding.
- The dialog has no backdrop handler.

## R-08 Name, heading and `heading-hidden` (FR-005, FR-048, SPEC-1-13, SPEC-1-17)

- **Decision**: the shadow root renders `<h2 part="heading" id="heading">` with `label`, and the `<dialog>` has
  `aria-labelledby="heading"` (both in one shadow root). When the host has an `aria-label` attribute, the `<dialog>`
  gets `aria-label` with that value instead and no `aria-labelledby`, following the elements README § Host ARIA rule;
  `naming.ts`'s `accessibleName` decides.
  - **Heading level 2**, fixed and asserted in the tree tests (SPEC-1-17).
  - `heading-hidden` hides the heading visually (the `--ocelle-size-visually-hidden` pattern used by base styles) and
    keeps it in the tree.
  - The close control keeps its place at the block start of the header.
- **Host `aria-label`** (operator decision PLAN-A11Y-SECURITY-1-007 (a): kept). **Measured** (squad probe, Chromium
  153, role-less host with `aria-label`, shadow `<dialog aria-label>`): while open the tree holds one named `dialog`
  node only; while closed the host is exposed as a named `generic` node. The tree assertions cover both states (open:
  exactly one named node, the modal dialog; closed: the measured named generic and no dialog), a story with a host
  `aria-label` runs under axe, and any limit found (the closed host's named generic, an axe
  `aria-prohibited-attr` result) is recorded in the README § Host ARIA for the overlays. If axe reports it serious or
  critical, the finding goes to the operator before the story phase ends (SC-004).
- **No label, no host `aria-label`** (SPEC-1-13): the overlay has no name (axe reports it). The element invents none
  and prints nothing, because constitution I allows no console I/O as behaviour. The README says a label is required.
- **Long label**: it wraps. The header is a row with the heading `min-inline-size: 0` and the close control not
  shrinking.

## R-09 Sizes and tokens (FR-024, FR-026, FR-038, SPEC-1-14, SPEC-1-16)

| Token / hook | Value | Source |
|---|---|---|
| `--ocelle-drawer-inline` (new, shell) | `var(--ocelle-shell-sidebar-width)` (20rem), `ref: ["shell-sidebar-width"]` | #12's personal drawer replaces the sidebar at narrow widths (spec-kitty-design#450), so it takes the sidebar's width. |
| `--ocelle-tooltip-delay` (new, motion) | `500ms` | The library's choice, within the 300 to 1000 ms range common in toolkits. Shown at the plan gate. Not zeroed under reduced motion, because a delay is not motion. Brand rule (f) sets only `motion-fast`/`motion-base`, so it stays unchanged. |
| `--ocelle-tooltip-max-inline` (new, size) | `18rem` | Library choice: about 40 characters of `font-size-sm`, so a pill tag's full text wraps on two or three lines. Shown at the plan gate. |
| `--ocelle-dialog-inline-size` (element hook) | default `var(--ocelle-measure-reading)` (68ch) | A dialog of prose or a list reads at the reading measure; it is capped by `--ocelle-dialog-max-inline`. |

- **Bubble colours**: the existing `--ocelle-color-chrome` (ground) and `--ocelle-color-chrome-ink` (text) in both
  themes. Their text contrast is already in the contrast check (`color-chrome-ink` has `grounds: chrome`). No new
  colour token.
  - No shadow: #5 reserves `elevation-raised` for the dialog. The drawer uses it as a dialog surface.
  - In forced colours the bubble gets `CanvasText` / `Canvas` and a `border-width` solid `CanvasText` border.
- **Forced colours of the overlays** (FR-021, US1-9): the panel always has a `--ocelle-border-width` solid border,
  transparent outside forced colours, and `CanvasText` with `Canvas` ground and `CanvasText` ink in forced colours, so
  its boundary does not depend on `elevation-raised` (dropped there). The `::backdrop` gets `Canvas` in forced colours;
  the panel's `CanvasText` border separates the two. The close control's focus ring is an `outline` from the focus
  tokens (not a box shadow), so forced colours keep it, with `outline-color: Highlight`. Both overlays share these
  rules through the base.
- **Validation**: the new tokens go through `validateSource()`, `test/expected.ts`, the README's token list and the
  tokens CHANGELOG "Added". `motion` and `size` groups exist, so no group is new.
- **Lint**: element CSS uses only `var()` and `calc()`. For example the drawer's
  `max-inline-size: var(--ocelle-dialog-max-inline)` and `inline-size: var(--ocelle-drawer-inline)`. `min()` is raw
  under `token-only` and is not used.

## R-10 Tooltip in the top layer and the engine floor (FR-034, FR-040, FR-041)

- **Measured** (probe `probes/probe.cjs`): a `popover="manual"` element in a custom element's open shadow root inside a modal
  `<dialog>` is `:popover-open` after `showPopover()`, and hit-testing at its box reaches it (retargeted to the host)
  above the modal.
- **Measured** (squad probe): a `popover="manual"` element stays `:popover-open` after a later `showModal()`
  elsewhere (only auto and hint popovers are hidden), and is then painted under the new modal's backdrop.
- **Decision**: the bubble is `<div part="bubble" popover="manual">` in the tooltip's shadow root. The overlay stays
  inside its host (006 FR-014: every surface inside its own host). `manual` means no light dismiss and no automatic
  Escape, so FR-033's Escape is the element's own. Showing one bubble hides the one shown before (a module-level
  "current bubble"). The user-agent `[popover]` styles (inset, margin, border, padding, background, colour, overflow)
  are reset.
- **Hidden by default, in every engine**: the static sheet holds `[part="bubble"] { display: none; }` and, as a
  separate rule, `[part="bubble"]:popover-open { display: block; }`. An engine without the Popover API drops only the
  second rule (an unknown pseudo-class), so the bubble stays unpainted. The element checks
  `"showPopover" in HTMLElement.prototype` once; when it is absent the tooltip never shows, never calls the Popover API
  and installs no Escape listener. This is a no-op guard, not the excluded fallback path (spec Out of Scope).
- **An overlay opening hides the bubble** (FR-010, FR-034): the overlay base calls the tooltip module's internal
  "hide current" before `showModal()`. That bubble enters `dismissed` (R-12), so it does not come back until the
  pointer re-enters its trigger or keyboard focus does. A tooltip inside the new overlay shows normally afterwards.
- **Floor**: Chromium 120 (unchanged) / **WebKit 17** (Popover API: Chromium 114, WebKit 17). These do not raise it:
  WAAPI (R-06), `:focus-visible` (Chromium 86, WebKit 15.4) and `inert` (Chromium 102, WebKit 15.5). Anchor
  positioning (Chromium 125, WebKit 26) and ARIA element reflection (`ariaDescribedByElements`, Chromium 135) are
  above the floor and not used.
- **Floor consumers**: none declares one today (no `engines` or `browserslist` in `@ocelle/elements`, no Vite
  `build.target`, `tsconfig` `es2024`). So FR-040 changes the README § Engines list and the README test that pins it
  (`test/node/readme.test.ts:65`), red first.
- **Kitty Desktop** (FR-041): Tauri uses WKWebView on macOS and WebKitGTK on Linux.
  - macOS: WKWebView is the system WebKit. Safari 17 shipped for macOS 12 Monterey and later, so a Mac on macOS 12+
    with current updates is at WebKit 17 or newer.
  - Linux: WebKitGTK version numbers are not WebKit's. The Popover API is enabled in WebKitGTK from the 2.44 line by
    our reading of its release notes, which is **unverified here** (no network access to Kitty Desktop's build).
  - **Risk for the operator** (plan § Risks): a Linux host with an older WebKitGTK shows no bubble (the guard above):
    nothing is painted inline and nothing throws. Its trigger keeps its name (FR-037), so nothing essential is lost.
    Phase 4's review records the WebKitGTK version Kitty Desktop ships, from its build files, before approval.

## R-11 Placing the bubble without a `style` attribute (FR-035, FR-047, SPEC-1-03, SPEC-1-08)

- **Host layout** (operator decision PLAN-CORRECTNESS-1-013 (b)): `:host { display: contents; }` beside
  `:host([hidden]) { display: none; }`. The tooltip host is layout-transparent, so wrapping a trigger leaves its box
  unchanged: #7's pill still ellipsises inside its container and #12's rail item keeps its place in the list. The host
  has no box, so everything is measured on the trigger (and hover is tracked by events, R-12).
- **Decision**: the tooltip owns one constructable `CSSStyleSheet` per instance, adopted after the shared element
  sheet. Placing the bubble calls `replaceSync()` with one rule `[part="bubble"] { top: <y>px; left: <x>px; }`
  (physical viewport coordinates, numbers computed at run time, not literals in element CSS), with `position: fixed`
  and `inset: auto` from the static sheet. The coordinates are physical because they come from
  `getBoundingClientRect()`; a logical inset would map to `right` under `rtl`. No `style` attribute, no `<style>`
  element, no CSSOM write to an element's `style`.
- **Placement**: measure the trigger's border box and the bubble's size after it is shown.
  - Main axis: `placement` (logical; `start`/`end` follow `:dir(rtl)` on the tooltip host, so `start` is the
    trigger's right side under `rtl`), offset by `--ocelle-space-2`. If it overflows the viewport minus
    `--ocelle-gutter`, use the opposite side. If neither side fits, keep the `placement` side. Direction only chooses
    the side; the written coordinates are physical in both directions.
  - Cross axis: centre on the trigger, then clamp inside the viewport minus `--ocelle-gutter` (SPEC-1-08).
- **Following the trigger**: while shown, one `requestAnimationFrame` loop reads the trigger's
  `getBoundingClientRect()` each frame and re-places the bubble when it changed (at most one placement per frame).
  This catches every scroll, including scrollers inside shadow roots (the overlay body, #12's shell), where `scroll`
  is not composed and a window capture listener sees nothing (squad probe), as well as resizes and layout shifts. The
  loop stops on hide. The bubble is hidden if the trigger is removed or `disabled`.
- **Size**: `max-inline-size: var(--ocelle-tooltip-max-inline)`, `overflow-wrap: anywhere`, so long text wraps and an
  unbreakable string breaks inside the bubble.
- **Gap and hoverability** (FR-032): the bubble's hit box includes the offset. Its padding on the trigger's side is
  `--ocelle-space-2`, transparent, with the visible box painted by an inner element. The pointer therefore goes from
  trigger to bubble without leaving both boxes, and the hover rule (R-12) keeps it shown across the crossing.

## R-12 Tooltip show and hide logic (FR-031 to FR-033, SPEC-2-02, SPEC-2-03)

- **Trigger**: the first element assigned to the default slot (`slotchange` tracked; listeners and the description
  move to a new trigger and leave the old one).
- **Pointer** (squad finding PLAN-CORRECTNESS-1-004: on a move from trigger to bubble the trigger's `pointerleave`
  comes before the bubble's `pointerenter`): hover is tracked with `pointerover` and `pointerout` listeners on the
  tooltip host. Both bubble and compose, so they reach the host from the slotted trigger and from the bubble in its
  shadow root, and the host's `display: contents` does not matter. A `pointerout` whose `relatedTarget` is still
  inside the tooltip (the host, a node it contains, or a node in its shadow root) changes nothing, so the crossing
  never hides the bubble. A `pointerover` from outside, with `pointerType` other than `touch`, starts the delay timer,
  or shows at once when the bubble is already shown or the delay is 0 ms. A `pointerout` to outside clears the timer
  and hides unless keyboard focus holds.
- **Delay rule**: the timer starts at the first entry into the trigger or the bubble and is not restarted by moves
  between them. Leaving both clears it. So the bubble shows `--ocelle-tooltip-delay` after the first entry.
- **Keyboard focus**: on `focusin` (composed) the deepest active element inside the trigger is checked against
  `:focus-visible`. If it matches, the bubble shows at once. A trigger focused by a click that later starts matching
  `:focus-visible` (after a keypress, without focus moving) does **not** show the bubble. Only focus arriving while it
  matches does (SPEC-2-03). `focusout` hides unless hovered.
- **Text-field triggers** (operator decision PLAN-A11Y-SECURITY-1-009 (a)): engines make a text field (`<input>` of a
  text type, `<textarea>`, `contenteditable`) match `:focus-visible` on any focus, so a tooltip around one shows on
  click and tap as well. Squad probe: a clicked `<input>` matches, a clicked `<button>` does not. This is a stated
  limit: tooltip triggers are buttons and links; around a text field the bubble shows on focus however it arrives. The
  README and the spec (FR-029, US3-10) say so, and a matrix row asserts it.
- **Escape** (FR-033): while a bubble is shown, a `keydown` listener in the capture phase on `window` takes Escape,
  hides the bubble, and calls `preventDefault()` and `stopPropagation()`. An overlay's keydown (R-02) never sees it.
  The listener acts only when the trigger is not behind the topmost modal: if an overlay is open (R-02's stack), the
  trigger must be in the flat tree of the topmost overlay's host; otherwise the listener lets the key pass. With
  R-10's hide-on-open this cannot normally arise; the check keeps an Escape meant for the modal from being taken. The
  listener is removed on hide. After Escape the bubble stays hidden until the pointer re-enters the trigger or
  bubble, or keyboard focus re-enters. FR-032's "stays while" is read with this exception (SPEC-2-02).
- **Touch**: `pointerType === "touch"` never starts a show. A tap's focus on a button or link does not match
  `:focus-visible`. A tap on a text-field trigger focuses it with `:focus-visible`, so its bubble shows (the stated
  exception above; spec FR-029, FR-037).
- **Delay**: read from the computed `--ocelle-tooltip-delay` on the trigger (the host has no box but computes custom
  properties as usual) when the timer starts (`setTimeout` with a function; the `csp` gate's `pass-function-timer`
  plant allows it).

## R-13 Tooltip semantics without crossing a shadow root (FR-036, FR-037, SPEC-2-01, SPEC-2-05)

- **Without `describes`** (default): the bubble has `aria-hidden="true"`. The tree holds no tooltip node and the
  trigger has no description from the tooltip. The text is the trigger's name only, as the host gave it.
- **With `describes`**: the tooltip adds one light-DOM child to its host,
  `<span slot="description" role="tooltip" hidden id="…">text</span>`. It is assigned to a slot the shadow root does
  not render, so it is never painted. The tooltip also adds that id to the trigger's `aria-describedby`, keeping any
  ids the host put there and removing only its own on change or disconnect.
  - **Written safely**: the span is made with `document.createElement("span")` and its text is set with
    `textContent`, so markup in `text` is never parsed. Its id is `ocelle-tooltip-desc-<n>` from a module counter,
    advanced until no element with that id exists in the trigger's root (`getRootNode()`), so it is unique there.
  - Trigger, span and id are in one tree (the trigger's), so no ID reference crosses a shadow root.
  - The visible bubble stays `aria-hidden`, so the text is heard once.
  - **Measured** (probe `probes/probe2.cjs`): a button with `aria-describedby` pointing at a `hidden` `role="tooltip"` span
    has the description "Saves the draft" in Chromium's AX tree.
- **Kept against host re-renders** (operator decision PLAN-FRESH-1-007 (a)): while `describes` holds and `text` is not
  empty, a `MutationObserver` watches the trigger's `aria-describedby`. When a host write (a re-rendering template)
  drops the tooltip's id, the tooltip adds it back, keeping whatever ids the host wrote; its own re-add is recognised
  and not acted on again. On `slotchange` to a new trigger the id moves: it is removed from the old trigger and added
  to the new one, and the observer follows. The observer is disconnected when `describes` is unset, `text` becomes
  empty or the tooltip disconnects.
- **The span itself is kept too** (squad round 2, PLAN-FRESH-2-005): the span is a child of the host in the host's own
  light DOM, which a host template owns, so a morphing or keyed re-render can remove it. Measured (squad round 2
  probe): removing a light-DOM child assigned to an unrendered slot name fires no `slotchange`. So while `describes`
  holds and `text` is not empty, the tooltip also notices the span's removal (the mechanism is the implementer's
  choice: a `MutationObserver` on the host's `childList`, or a `<slot name="description">` inside a never-painted
  container of the shadow root, whose `slotchange` then fires) and re-creates it within one microtask, with the same
  id and text, written as above. The id stays in the trigger's `aria-describedby` throughout. Its own re-insert is
  recognised and not acted on again.
- **Spec wording**: FR-036 now says "the description node has role `tooltip`; the painted bubble is hidden from the
  tree" (squad round 1).
- **Custom-element triggers** (SPEC-2-05): `describes` is supported only when the trigger itself is the focusable
  element (a native control, or a custom element that is focusable as its host). A custom element whose inner control
  takes focus (#7's pill tag, #12's nav item) cannot receive a description from outside its shadow root. Neither
  consumer needs one: both use the default mode. The spec (FR-029, FR-036, US3-7) and the README state the limit, and
  a later mission that needs it adds a contract.
- **ARIA element reflection** (Chromium 135+) is not used: it is above the Chromium floor, and it cannot reach into a
  descendant shadow root either.

## R-14 Test harness additions

- **Driver** (`test/scenarios/driver.ts`) gains input and state methods, implemented in both harnesses
  (`test/in-process.ts` and `test/browser/driver.ts`):
  - `press(key, { shift? })`, `hover(id | null, inner?)`, `click(id, inner?, { button? })`;
  - `pointer(path)`: a list of `{ x, y, down?, up? }` steps in page coordinates, moved through in order with
    intermediate steps, for press-move-release and for stopping the pointer at a point (the tooltip gap);
  - `touchTap(id)`: a real touch tap on the element's centre;
  - `focusPath()`: the deep active element as id plus inner selector, or `"body"`;
  - `focusVisible(id, inner?)`: whether the element matches `:focus-visible`;
  - `reducedMotion(on)`;
  - `viewport()` (size) and `setViewport(width, height)` (for the short-viewport rows);
  - `record(id, eventNames)` and `recorded()`: events with `detail`, `cancelable`, `bubbles` and `composed`, and,
    read synchronously inside the listener, the host's `open`, whether the inner `<dialog>` is open and `:modal`, and
    `focusPath()` at that moment, recorded in the page;
  - `animations(id, inner?)`: for each animation on the element or its shadow part, its timing (duration, easing),
    keyframes and `playState` (read through `getAnimations()`, which writes nothing);
  - `topLayer()`: which overlay and popover elements are open, in stacking order (`:modal`, `:popover-open`);
  - `styleAttributes()` and `styleElements()`: FR-047's counts over the document and every open shadow root, as a
    delta from mount. A `MutationObserver` installed at mount over the document and every shadow root (including roots
    attached later) records every `style` attribute write and every added `<style>` element, so a write that is
    removed again is still counted.
- **No `driver.style()`** in the overlay and tooltip scenarios: in process it calls `element.style.setProperty`, which
  creates a `style` attribute and would fail FR-047's count falsely. Those scenarios use `rules()` (an adopted sheet).
- **In process**: `userEvent` from `vitest/browser` (the Playwright provider sends real CDP input, so `:hover`,
  `:focus-visible` and pointer events are real). New browser commands, in `test/commands.ts`:
  - `emulateReducedMotion` calls `page.emulateMedia({ reducedMotion })`. The reset helper resets it together with
    forced colours, so state never leaks between files (finding `frontend-missions.md` L161-165).
  - `pointerPath` drives `page.mouse` (move, down, up) and `touchTap` drives `page.touchscreen`, both adding the test
    iframe's offset in the runner page.
  - `axTree` returns `description`, `modal` and `level` as well as role and name.
  - `vitest.config.ts`: the `elements` project sets `browser.viewport` to 1280 × 800, as on the fixture
    (`serve.ts:127`) and in #10's capture, so the shared geometry scenarios run at one size. It does **not** enable
    touch (squad round 2, PLAN-FRESH-2-007): measured in Chromium 153 at 1280 × 800, a default context matches
    `(hover: hover)` and `(pointer: fine)` with `maxTouchPoints` 0, and a `hasTouch` context matches neither, with
    `maxTouchPoints` 1. Every element test of 005 and the siblings keeps running as a mouse device.
  - **Touch only where the touch rows run**: a new project `elements-touch`, the same browser-mode Chromium at
    1280 × 800 with `hasTouch` in its context options, includes only `packages/elements/test/**/*.touch.test.ts`
    (the in-process touch rows of checks § Tooltip), which the `elements` project excludes. It has the same excludes
    as `elements` (`test/node/**`, `test/build/**` and `test/browser/**`, `vitest.config.ts:76`; squad round 2 verify
    1, PLAN-FRESH-2-007), so the fixture's `test/browser/*.touch.test.ts` stay in `elements-browser` only (Node,
    its global setup, not mutated) and are never collected by this browser-mode, mutated project.
    `vitest.mutation.elements.config.ts` takes both projects, so the in-process touch rows still kill mutants.
    `touchTap` is used only there.
- **Strict-CSP fixture**: new pages `overlays.html` and `tooltip.html`, with real input through `page.keyboard`,
  `page.mouse` and `page.touchscreen`. `serve.ts`'s `visit()` keeps its default context (no touch) and gains an option
  `{ touch: true }` that creates a separate context with `hasTouch: true`, used only by the touch rows'
  `test/browser/*.touch.test.ts` files.
- **Self-tests** (Phase 1, both harnesses, stand-in elements, after `test/commands.test.ts`'s precedent): a CSSOM
  `style` write inside a nested open shadow root is counted, also when removed again; a `<style>` added to a shadow
  root is counted; `topLayer()` reports a `:popover-open` element and a `:modal` dialog in order; `focusPath()`
  reports an inner shadow button; `record()` captures the state at dispatch; `animations()` reads a running
  animation's timing and keyframes; `pointer()` stops at a given point (an element there reports `:hover`);
  `touchTap()` gives a `pointerType === "touch"` pointer event (in the touch context); `focusVisible()` reads true
  after Tab and false after a click on a button; the viewport is 1280 × 800; the default context matches
  `(hover: hover)` and `(pointer: fine)` and has `maxTouchPoints` 0, and the touch context (`elements-touch`,
  `visit(…, { touch: true })`) has `maxTouchPoints` above 0. Each self-test is red against the driver as it is.

## R-15 Timing tests and mutation (FR-046; mission 007)

- **Mission 007** keeps "a timeout is a kill" (001 FR-011) and reports every Timeout and CompileError mutant on a
  changed line as a report line, not a finding. Its FR-012 forbids reaching the bounds by shortening Stryker's time
  limit, excluding mutators or adding disable comments.
- **Decision**: no test waits without a bound shorter than Stryker's limit. Every wait is a bounded poll (at most
  1 000 ms, failing with a message). A mutant that stops a bubble from showing, or an overlay from closing, then
  fails an assertion (**Killed**) instead of hanging (**Timeout**). Each timing rule is tested from both sides:
  - Fixture pages and in-process mounts set `--ocelle-tooltip-delay: 300ms` through a test stylesheet (adopted
    in process, linked on the fixture). 300 ms equals no motion token (`motion-fast`, `motion-base` 200 ms), so a
    wrong-token read fails. Hover, then check that the bubble is not shown at 150 ms (delay - 150 ms) and that it is
    shown by 450 ms (delay + 150 ms), so a doubled or misparsed delay fails as well.
  - Re-entry: the pointer moves trigger → bubble → trigger before the delay elapses; the bubble shows no later than
    450 ms from the first entry (R-12's delay rule).
  - Under reduced motion with the test delay set, the bubble is still not shown at 150 ms and is shown by 450 ms
    (the delay is not zeroed, R-09).
  - With the delay at `0ms`, the bubble shows in the same task as the `pointerover`.
  - Keyboard focus shows it at once, whatever the delay.
- The exit animation is tested with `--ocelle-motion-base` at its real 200 ms: `open` is false at once, the close
  event fires only after the dialog has left the top layer, and focus is returned before the close event is
  dispatched, all read at dispatch by `record()` (R-14). Under reduced motion all of this happens within one update.
- The phase reviews read the 007 report lines. Any Timeout on this feature's changed lines is named in the review with
  its cause, and a test is added that kills it by assertion where possible.

## R-16 Stories against #10 (FR-042) — recheck when #10 lands

From `specs/006-storybook-workbench` on its branch (design final, unmerged):

- **Capture context** (`gates/lib/capture-plan.ts`): 1280 × 800, `reducedMotion: "reduce"`,
  `animations: "disabled"`, full page. Top-layer content inside `#storybook-root` is in the capture (FR-012; plant
  `pass-overflow-and-popover`). Elements must use open shadow roots and render every surface inside their own host
  (FR-014, FR-027); the overlays and the bubble do.
- **Captures are not the evidence for behaviour**: they run with animations off and without forced colours, so motion,
  forced colours, sizes and geometry are asserted by the test matrix (contracts/checks.md), not by baselines
  (constitution VIII).
- **Open overlays**: a story renders `<ocelle-dialog open …>`. The element calls `showModal()` on its first update, so
  the capture (after `STORY_RENDERED`, `fonts.ready` and two frames) holds the open dialog. No play function exists or
  is needed.
- **Shown tooltip**: 006 FR-031's pointer state `parameters: { ocelle: { pointer: { hover: "<selector>" } } }` moves
  the mouse onto the trigger. The trigger must lie wholly inside 1280 × 800 at scroll (0, 0). The capture follows
  within two frames, before a 500 ms delay would fire, so the tooltip stories override `--ocelle-tooltip-delay` to
  `0ms` with a class rule in `storybook/.storybook/stories-layout.css` (no `style` attribute in story markup). With
  0 ms the bubble shows in the same task as the `pointerover` (R-15). One hover state per story, so there is one story
  per placement.
- **Focus-shown tooltip**: 006 has no focus state, so no story shows the bubble by focus. Focus behaviour is proven by
  the interaction tests (FR-043).
- **Short viewport**: the 320 × 256 case (FR-018, WCAG 1.4.10) is a matrix row in both harnesses. A story at that
  size is added only if #10's capture plan takes a per-story viewport (part of the recheck); otherwise the row is the
  evidence.
- **axe**: runs on the same context. Overlays name themselves (R-08); one dialog story names itself by a host
  `aria-label` (R-08). The tooltip's description node is `hidden`. No `a11y-exceptions.json` entry is planned.
- **Baselines**: `storybook/baselines/<story-id>.<theme>.png`, produced by `pnpm run visual:update` in the pinned
  container. CI's captures win over local ones (006 FR-005). Each new story and theme needs its baseline.
- **Contributor note**: `storybook/README.md` (006 FR-025) is followed. Nothing in this feature changes it.
- **Recheck when #10 lands**: before the story tasks run, compare these facts with merged `main`: the parameter shape,
  the capture context (and whether a story can set its viewport), the baseline path and command, the stories-layout
  stylesheet, the axe rule set and exceptions file, and the story-index test. Then update this section and the tasks
  in one commit. Implementation waits for #10 (operator).

## R-17 Shared files with parallel missions

- `packages/elements/src/index.ts`, `test/exports.test.ts` (the sorted export keys), `package.json` `exports`,
  `custom-elements.json`, `README.md`, `test/node/readme.test.ts`, `test/build/build.test.ts`,
  `test/build/pack.test.ts`, `CHANGELOG.md`, `vitest.config.ts`, `storybook/.storybook/*` and
  `packages/tokens/src/source.ts` with `test/expected.ts` are also touched by 009 to 011 (#15, #9, #8).
- Conflicts are resolved by merging `main` into `claude/016-overlays`, never by rebasing. After a merge, the manifest
  is regenerated (`pnpm --filter @ocelle/elements run manifest`) rather than hand-merged, and the export-key list is
  re-sorted.

## R-18 Body scrolling and short viewports (FR-018, WCAG 1.4.10)

- **Measured from the tokens**: `dialog-max-block` = `calc(100dvh - 2 * var(--ocelle-gutter))` (source.ts:194),
  `gutter` 1rem, `target-min` 2.75rem. At 320 × 256 CSS px (1280 × 1024 at 400 % zoom) the panel is at most 224 px,
  and a 44 px header with a wrapped heading plus a footer of two wrapped 44 px buttons leaves the body at or near 0.
- **Decision**: the panel is a block-axis column (header, body, footer) with `max-block-size:
  var(--ocelle-dialog-max-block)`. The body has `box-sizing: border-box`, `overflow-y: auto` and `min-block-size:
  calc(3 * var(--ocelle-target-min))`. When the viewport is too short for header, footer and that minimum, the panel's
  own `overflow-y: auto` takes over and the panel scrolls as a whole, so the body's content stays reachable. The body
  is a Tab stop while it overflows (R-04).
- **The minimum is unconditional** (operator decision PLAN-FRESH-2-006 (a)): it applies at every viewport size, so
  every body is at least 8.25rem (132 px at a 16 px root) tall. A one-line confirmation ("Delete this project?") gets
  a 132 px body with empty space below its text. This is the stated look, not a defect: spec FR-018 and the README
  say so, a geometry row asserts it and a dialog story shows it in the baselines. A conditional minimum was
  considered and not taken (it needs a measured attribute, and `min()` is raw under `token-only`, R-09).
- The drawer has the same column, at the full block size of the viewport.

## Spec-check notes settled here

| Note | Settled in |
|---|---|
| SPEC-1-05 close timing | R-06 |
| SPEC-1-06 exit animation and floor | R-06, R-10 |
| SPEC-1-07 FR-034 light-dismiss wording | R-10 (`popover="manual"`); spec FR-034 reworded in squad round 1 |
| SPEC-1-08 cross-axis overflow | R-11 |
| SPEC-1-09 SC-001 path count | contracts/checks.md § Test matrix: three request reasons (two on the dialog) × {veto, no veto}, plus `host` |
| SPEC-1-11 drawer reset, forced colours and long body | contracts/checks.md § Test matrix and the drawer story list (data-model) |
| SPEC-1-12 opener gone | R-05 |
| SPEC-1-13 unnamed overlay, long label | R-08 |
| SPEC-1-14 token values | R-09 |
| SPEC-1-15 / SPEC-2-05 custom-element trigger | R-13; spec FR-029, FR-036 and US3-7 state the limit (squad round 1) |
| SPEC-1-16 dialog default inline size | R-09 |
| SPEC-1-17 heading level | R-08 (level 2) |
| SPEC-2-01 tree in each mode | R-13 |
| SPEC-2-02 Escape versus "stays" | R-12 |
| SPEC-2-03 late `:focus-visible` | R-12 |
| SPEC-2-04 FR-047 placement | contracts/checks.md § Test matrix: FR-047's counts run after every open, close and placement scenario |
