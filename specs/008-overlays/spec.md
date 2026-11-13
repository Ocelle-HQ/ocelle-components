# Feature Specification: Overlays — Dialog, Drawer and Tooltip

**Feature Branch**: `008-overlays` (work happens on `claude/016-overlays`)

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Build issue #16 (triage/008-overlays.md) in @ocelle/elements, following mission 005's
element conventions (README § Element conventions, manifest gate): `ocelle-dialog` and `ocelle-drawer` on native
`<dialog>` with `showModal()`, user-agent background, colour and border reset to tokens (spec-kitty-design#503),
backdrop on `--ocelle-color-overlay`, the dialog sized by `--ocelle-dialog-max-inline` / `--ocelle-dialog-max-block`
and raised by `--ocelle-elevation-raised`, focus moved in on open and returned to the opener on close, Escape closes,
a close control using `ocelle-icon name="close"` named on its inner button, the drawer serving #12's narrow-width
personal drawer (spec-kitty-design#450) and kitty-mission-ui's flyouts, the Open project dialog (with #14's
`ocelle-listbox`) as first consumer; and `ocelle-tooltip` meeting WCAG 1.4.13 (dismissible with Escape, hoverable,
persistent while hovered or focused, never the only carrier of essential information) for #12's `ocelle-nav-item`
icon-only bubble and #7's `ocelle-pill-tag` ellipsis, with no ID reference crossing a shadow root;
`ocelle-<element>-<action>` events with payloads and cancelability, reduced motion, forced colours, a tooltip stacked
and dismissed correctly inside a dialog or drawer; decide at clarify the tooltip's platform basis against the
Chromium 120 / WebKit 16.4 floor (raised only by operator decision), whether the drawer is modal-only, and any new
token (drawer inline size, tooltip delay or offset) added to @ocelle/tokens with its validation; done when #7's
checklist holds (a story per variant and state with light and dark baselines, interaction tests for every event and
payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP
check) plus focus-management tests for open and close, with top-layer content captured per #10's FR-012; the
consumers' elements (#7, #12, #14) stay in their issues."

**Issues**: #16 (triage record `triage/008-overlays.md`, approved by the operator on 2026-11-12). The body of #16, and
the bodies of its siblings under epic #1 that consume or border on it (#7, #12, #14, #8, #9, #15, #10), are the
sources of the requirements below. `#450` and `#503` are spec-kitty/spec-kitty-design issues, cited as #16 cites them.

**Operator decisions while specifying** (2026-11-12, human:MOES-Media):

- Tooltip platform, "Popover, floor → WebKit 17 (Recommended)": `ocelle-tooltip` is shown in the top layer through the
  Popover API. The engine floor rises from Chromium 120 / WebKit 16.4 to **Chromium 120 / WebKit 17**, recorded in the
  elements README § Engines and in this feature's research, with Kitty Desktop's webview versions (FR-040, FR-041).
  No fallback path below WebKit 17 is built.
- Drawer modality, "Modal only (Recommended)": `ocelle-drawer` is modal, like `ocelle-dialog`. A non-modal flyout, if
  kitty-mission-ui needs one, is a later issue or op (Out of Scope).
- Backdrop click, "Drawer yes, dialog no (Recommended)": a primary-button click on the backdrop requests the drawer's
  close; it does nothing on the dialog (FR-012).
- Drawer heading (SPEC-1-04), "Add hidden-heading option": `ocelle-drawer` gains a boolean `heading-hidden` that keeps
  the accessible name and the close control but hides the heading visually, so #12 can use it for the personal drawer.
  `ocelle-dialog` always shows its heading (FR-005, FR-048, US2 scenario 6).

## Consumer need

- **Why the elements exist (#16, spec-kitty-design#503).** "Spec Kitty has no overlay primitives, so consumers cannot
  reset native `<dialog>` chrome under token-only lint rules." Consumers today either hand-roll overlays (which
  constitution VI forbids) or carry the user agent's dialog border, background and colour.
- **First consumer (#16).** kitty-mission-ui's **Open project dialog**: a modal dialog holding a folder picker
  (#14's `ocelle-listbox`, an inline list) and its actions.
- **Drawer consumers (#16, #12, #8).** The app shell's **narrow-width personal drawer** (#12's `ocelle-app-shell`,
  spec-kitty-design#450), which holds #8's personal rail on the dark chrome ground; and kitty-mission-ui's **flyouts**.
- **Tooltip consumers (#16, #12, #7).** #12's `ocelle-nav-item` icon-only mode "keeps the accessible name and shows
  the label in a bubble on hover and focus"; #7's `ocelle-pill-tag` shows its "full text as tooltip" when ellipsised.
- **Done when (#16 → #7's checklist).** A story per variant and state with light and dark visual baselines;
  interaction tests asserting every emitted event and its payload; keyboard and screen-reader behaviour tested; axe
  with no serious or critical finding; every public property, event, slot and part in the custom-elements manifest;
  built output passing the strict-CSP check. #16 adds: focus-management tests for open and close.

## User Scenarios & Testing *(mandatory)*

The actors are a **host developer** (who places an element in a page or in another element's shadow root and listens
to its events), an **end user** working with pointer or keyboard, and an **assistive-technology user** (screen reader,
forced colours, reduced motion).

### User Story 1 - A modal dialog (Priority: P1)

A host developer opens an `ocelle-dialog` with a heading, body content and footer actions over the page. The end user
can work only inside the dialog until it closes; keyboard focus moves into it on open and back to whatever opened it
on close. The dialog looks like the library (token ground, ink, radius and raised shadow over a token backdrop) and
never like the user agent's dialog. The user closes it with Escape or the close control; the host is asked first and
may keep it open.

**Why this priority**: #16's first consumer (the Open project dialog) and the drawer's machinery both rest on it; it is
the smallest slice that removes the hand-rolled overlays.

**Independent Test**: Place an `ocelle-dialog` with a `label`, two focusable controls in its body and a footer button
in a test page beside an opener button; set `open` from the opener's click and drive it by keyboard and pointer. It is
complete when the scenarios below pass in process and on the strict-CSP fixture with the browser build, and its
stories pass the visual and axe gates.

**Acceptance Scenarios**:

1. **Given** a closed `ocelle-dialog` and a focused opener, **When** the host sets `open`, **Then** the dialog is shown
   modally in the top layer over the token backdrop, the page behind it is inert to pointer, keyboard and the
   accessibility tree, and focus is on the element FR-007 names.
2. **Given** an open dialog, **When** the user presses Tab or Shift+Tab repeatedly, **Then** focus moves only among
   the dialog's focusable elements (its slotted content and its close control) and never reaches the page behind.
3. **Given** an open dialog, **When** the user presses Escape, **Then** one `ocelle-dialog-close-request` is
   dispatched with `detail.reason === "escape"`; if no listener cancels it, the dialog closes, one
   `ocelle-dialog-close` is dispatched with `detail.reason === "escape"`, `open` is false and focus is back on the
   opener.
4. **Given** an open dialog whose host cancels `ocelle-dialog-close-request`, **When** the user presses Escape, clicks
   the close control, or presses Escape again without any other input in between, **Then** the dialog stays open,
   `open` stays true, no `ocelle-dialog-close` is dispatched and focus stays inside the dialog.
5. **Given** an open dialog, **When** the user activates the close control by pointer, Enter or Space, **Then** the
   request and close events carry `detail.reason === "close-button"`.
6. **Given** an open dialog, **When** the user clicks the backdrop, **Then** nothing is dispatched and the dialog stays
   open (operator decision).
7. **Given** an open dialog, **When** the host sets `open` to false, **Then** the dialog closes without a request
   event, dispatches `ocelle-dialog-close` with `detail.reason === "host"` and returns focus to the opener.
8. **Given** an open dialog with `label="Open project"`, **When** the accessibility tree is read, **Then** there is one
   node with role `dialog`, modal, named "Open project", and the close control is a button named by `close-label`
   ("Close" by default) whose icon is hidden from the tree; **Given** a host `aria-label` instead of or as well as
   `label`, **Then** while open the only named node for the overlay is the modal `dialog`, named by the host
   `aria-label`, and the closed host's exposure is asserted as measured and documented (FR-005).
9. **Given** a dialog in light, dark and forced-colours mode, **When** it renders, **Then** its ground, ink, border,
   radius, shadow and backdrop come from tokens (forced colours: system colours and a visible boundary), and no
   user-agent dialog border, padding, background or colour shows.
10. **Given** a dialog whose body is taller than `--ocelle-dialog-max-block`, **When** it renders, **Then** the dialog
    is no taller than that token, the heading and footer stay visible and the body scrolls; **Given** a viewport
    narrower than the dialog's preferred inline size, **Then** it is no wider than `--ocelle-dialog-max-inline`;
    **Given** a body that overflows with nothing focusable in it, **Then** Tab reaches the body and the arrow and Page
    keys scroll it; **Given** a 320 × 256 viewport (400 % zoom), **Then** the body keeps its minimum block size and its
    whole content is reachable by scrolling (WCAG 1.4.10); **Given** a body of one short sentence, **Then** the body
    is as tall as its minimum block size (132 px by default), with the text at its start (operator decision).
11. **Given** prose with a table in the dialog body, **When** it renders, **Then** the body has a definite inline size,
    so the prose fills it rather than shrinking to fit (base styles FR-017).
12. **Given** `prefers-reduced-motion: reduce`, **When** the dialog opens or closes, **Then** it appears and disappears
    with no animation, even when an ancestor sets `--ocelle-motion-base`; without it, its entry and exit use
    `--ocelle-motion-base` and `--ocelle-easing-standard`.

---

### User Story 2 - A modal side drawer (Priority: P2)

A host developer opens an `ocelle-drawer` as a full-height panel on the inline start or end of the viewport, for #12's
narrow-width personal drawer (on the dark chrome ground) or a kitty-mission-ui flyout (on the sheet ground). It has
the dialog's focus, Escape and event model; in addition a click on the backdrop requests its close.

**Why this priority**: #12's app shell is blocked on it; it reuses US1's machinery, so it follows US1.

**Independent Test**: Place an `ocelle-drawer` with `side="start"` and `side="end"`, under `dir="ltr"` and
`dir="rtl"`, and with `ground="chrome"`; drive it by keyboard and pointer as in US1. It is complete when US1's focus
and event scenarios hold with the `ocelle-drawer-` event names and the scenarios below pass.

**Acceptance Scenarios**:

1. **Given** a closed drawer with `side="start"` under `dir="ltr"`, **When** the host sets `open`, **Then** a panel the
   full block size of the viewport is shown modally against the left edge (the right edge under `dir="rtl"`), over
   the token backdrop; `side="end"` is the mirror.
2. **Given** an open drawer, **When** the user clicks the backdrop with the primary button, **Then**
   `ocelle-drawer-close-request` is dispatched with `detail.reason === "backdrop"` and, unless cancelled, the drawer
   closes and dispatches `ocelle-drawer-close` with the same reason; a click inside the panel never does.
3. **Given** a drawer, **When** it renders, **Then** its inline size is `--ocelle-drawer-inline`, never more than
   `--ocelle-dialog-max-inline`, and its content box has a definite inline size.
4. **Given** `ground="chrome"`, **When** it renders, **Then** the panel uses the chrome ground and chrome ink tokens in
   both themes (constitution II's personal-rail rule); the default ground is the sheet.
5. **Given** US1 scenarios 1 to 5, 7, 8 and 12 with `ocelle-drawer` and its events, **Then** they hold; with
   motion allowed, the panel enters from and leaves towards its own side.
6. **Given** an open drawer with `label="Personal"`, `ground="chrome"` and `heading-hidden`, **When** it renders and
   the accessibility tree is read, **Then** no heading text is painted and the heading takes no space, the tree still
   has one modal `dialog` node named "Personal" holding a heading "Personal", and the close control is visible, named
   by `close-label`, reachable by Tab and closes the drawer with reason `"close-button"`; without `heading-hidden` the
   heading is painted (FR-048).

---

### User Story 3 - A tooltip that meets WCAG 1.4.13 (Priority: P3)

A host developer (#12's nav item, #7's pill tag, or a page) wraps a trigger in `ocelle-tooltip` with a short text.
Hovering or keyboard-focusing the trigger shows the text in a bubble beside it, above everything else including an
open dialog or drawer; the end user can move the pointer onto the bubble, it stays while hovered or focused, and
Escape hides it without closing the dialog around it. Assistive technology hears the text once, and the trigger keeps
its own accessible name.

**Why this priority**: two consumers (#7, #12) need it for one feature each; it is the only part that raises the
engine floor, so it comes last.

**Independent Test**: Wrap a named button in `ocelle-tooltip text="…"` in a page, in a scrolling container with
clipped overflow, in a transformed container, and inside an open `ocelle-dialog` and `ocelle-drawer`; drive it by
pointer and keyboard. It is complete when the scenarios below pass in process and on the strict-CSP fixture.

**Acceptance Scenarios**:

1. **Given** a trigger wrapped in `ocelle-tooltip`, **When** the pointer rests on the trigger for
   `--ocelle-tooltip-delay`, **Then** the bubble shows the text beside the trigger on its `placement` side; **When**
   the trigger receives keyboard focus (it matches `:focus-visible`), **Then** the bubble shows at once.
2. **Given** a shown bubble, **When** the pointer moves from the trigger onto the bubble, **Then** the bubble stays
   (hoverable); **When** the pointer leaves both while the trigger has no keyboard focus, or the trigger loses
   keyboard focus while neither it nor the bubble is hovered, **Then** it hides.
3. **Given** a shown bubble, **When** time passes with the pointer or focus still on the trigger or bubble, **Then** it
   stays (persistent; no timeout).
4. **Given** a shown bubble, **When** the user presses Escape, **Then** the bubble hides, focus and pointer do not
   move, and the keypress goes no further; **Given** the trigger is inside an open dialog or drawer, **Then** that
   overlay stays open, and a second Escape (bubble hidden) requests its close.
5. **Given** a trigger inside an open dialog or drawer, a container with `overflow: hidden`, or a transformed
   ancestor, **When** the bubble shows, **Then** it is painted whole, above the overlay and the backdrop, not clipped.
6. **Given** a trigger near a viewport edge, **When** the bubble would overflow the viewport on its `placement` side,
   **Then** it is shown on the opposite side, and it is never wider than its maximum inline size (long text wraps).
7. **Given** a tooltip without `describes` whose text repeats the trigger's accessible name (#12's icon-only nav item,
   #7's ellipsised pill tag), **When** the accessibility tree is read, **Then** the text is exposed once (as the
   trigger's own name) and the trigger has no accessible description from the tooltip; **Given** the same tooltip with
   `describes` around a trigger that is itself the focusable element (FR-029), **Then** the text is the trigger's
   accessible description; in both cases no ID reference crosses a shadow root, and the painted bubble is hidden from
   the tree.
8. **Given** a tooltip in light, dark and forced-colours mode, **When** it shows, **Then** its ground, ink and
   boundary come from tokens or system colours with contrast verified; the bubble never animates, and under reduced
   motion the hover delay still applies (a delay is not motion).
9. **Given** a tooltip with an empty `text`, or `disabled`, **When** the trigger is hovered or focused, **Then** no
   bubble shows.
10. **Given** a touch-only interaction (tap) on a button or link trigger, **When** the trigger is tapped (which
    focuses it without keyboard focus), **Then** the trigger's own action runs and no bubble shows, neither on the tap
    nor while the trigger keeps focus afterwards (the tooltip is never the only carrier). A text-field trigger is the
    stated exception (FR-029): it matches `:focus-visible` on any focus, so its bubble shows on a tap or click.
11. **Given** a tooltip without `describes` whose text differs from the trigger's name only in case or spacing (name
    "Open  project", text "open project"), **When** the accessibility tree is read, **Then** the trigger has no
    accessible description from the tooltip; **Given** a tooltip with `describes` whose text equals the name exactly,
    **Then** the text is still the trigger's accessible description. The element compares no names; `describes` alone
    decides (FR-036).
12. **Given** a trigger clicked with the pointer (focused, not matching `:focus-visible`) whose bubble has shown after
    the hover delay, **When** the pointer leaves the trigger and the bubble, **Then** the bubble hides although the
    trigger still has focus, and it does not show again until the pointer rests on the trigger again or the trigger
    receives keyboard focus.
13. **Given** each placement scenario above (each `placement`, a flip at an edge, inside an open dialog and drawer, in
    a clipped and a transformed container), **When** the bubble has been placed, **Then** no element that the three
    elements render, no trigger, and no element of the host page has gained a `style` attribute, and no `<style>`
    element has been added to the document or to any shadow root (FR-047).
14. **Given** a pill-shaped button that ellipsises in a narrow container, **When** it is wrapped in `ocelle-tooltip`,
    **Then** its box equals its unwrapped box and it still ellipsises (the tooltip host is layout-transparent, FR-029).
15. **Given** a shown bubble whose trigger is inside a scrolling container, including the open dialog's body, **When**
    the container scrolls or the viewport is resized, **Then** the bubble stays beside the trigger (FR-035); under
    `dir="rtl"` `start` and `end` and the flip are mirrored.

### Edge Cases

- **Opener gone.** The element that opened a dialog or drawer is removed or disabled before it closes: focus goes to
  no removed element and nothing throws; the dialog documents where focus lands.
- **Focus moved before the close ends.** A second dialog opened while the first is still leaving keeps focus: the
  closing overlay returns focus only while focus is still inside it or on the body (FR-009). A dialog opened from
  inside a closing one records that one's opener. The closing overlay stays modal until its exit ends, so the page
  behind it is inert: a host `focus()` on page content during the exit has no effect, and focus then returns to the
  opener. A host that wants focus elsewhere moves it in the `…-close` listener, which runs after focus returned and
  keeps that choice.
- **Opener in a shadow root.** The opener is a button inside another element's shadow root (#12's nav item, #7's
  button): focus returns to that inner button, not to its host only.
- **Opened by the host without an opener.** `open` is set at first render or by a script with focus on the body:
  initial focus follows FR-007; on close, focus goes back to whatever had it at open.
- **Removed while open.** An open dialog or drawer removed from the document leaves the page with no inert content,
  no top-layer entry and no backdrop; `open` becomes false and no close event is dispatched (FR-022).
- **Moved while open.** An open overlay removed and re-inserted (a morph, a keyed reorder, a portal), in the same task
  or later, is closed after the move, with `open` false and no event; the host sets `open` again to show it (operator
  decision).
- **Two overlays.** A dialog opened from inside an open drawer stacks above it; Escape and its close affect only the
  topmost; focus returns into the drawer.
- **Repeated Escape with a veto.** The platform's own protection against dialogs that refuse to close (a second
  Escape without user activation closes a dialog regardless of a cancelled `cancel` event) must not close an
  overlay whose host cancelled the request (US1 scenario 4). The stated limit: when slotted content stops Escape's
  propagation, the overlay never sees the key, and the platform may close it on the repeated press; that close has
  reason `"host"` (FR-013, FR-016).
- **Escape that slotted content uses.** An Escape that slotted content has already handled (`preventDefault()`), an
  Escape that cancels an IME composition, and an Escape that clears a non-empty search field do not request the
  overlay's close (FR-010).
- **`open` toggled quickly.** Setting `open` true and false in one task, or twice while an exit animation runs,
  leaves the element in the last state set, with at most one close event per close. A host that sets `open` again in
  its close listener, or right after moving the element, gets an open overlay that stays open.
- **Input while closing.** A held Escape, a key repeat on the close control, a second click on it or a double click on
  the drawer's backdrop during the exit request nothing more: one request, one close event (FR-013, FR-014).
- **Focus off the stops.** A click on the overlay's text focuses the dialog itself, and a host may remove a focused
  element inside it: Tab still moves among the overlay's stops and Escape still asks for the close, so a veto holds
  (FR-008, FR-013).
- **Form in a dialog.** A `<form method="dialog">` in slotted content does nothing to the element (the platform's
  form submission does not reach a `<dialog>` in a shadow root): the element stays open, `open` stays true and no
  event is dispatched. The documentation tells hosts to set `open` to false from their submit handler (FR-016).
- **No focusable content.** A dialog whose body has nothing focusable focuses its close control.
- **Tooltip trigger disabled or removed.** A shown bubble hides when its trigger is removed or disabled.
- **Tooltip with long or no-break text.** It wraps within its maximum inline size; an unbreakable string breaks
  rather than overflowing.
- **Tooltip trigger with no name.** The tooltip does not name a nameless trigger; the documentation says the trigger
  must carry its own name (FR-034).
- **Several tooltips.** At most one tooltip bubble shows at a time; showing one hides any other.
- **Tooltip trigger opens an overlay.** A bubble shown by hover on a trigger that opens a dialog or drawer hides when
  the overlay opens and does not take the overlay's first Escape (FR-010, FR-034).
- **Host re-renders the trigger's `aria-describedby`.** With `describes`, a host template that rewrites the trigger's
  `aria-describedby`, removes the tooltip's description node, or replaces the trigger, does not lose the description
  (FR-036).
- **Engine without the Popover API.** Below the floor no bubble is painted and nothing throws; this is not a tooltip
  path (Out of Scope), only the absence of a broken one.
- **Theme change while open.** Switching `data-theme` while an overlay or bubble is shown repaints it in the new theme.
- **Two copies of the package.** As in the elements README: the first definition wins.

## Requirements *(mandatory)*

### Functional Requirements

**Shared overlay rules (dialog and drawer)**

- **FR-001**: `ocelle-dialog` and `ocelle-drawer` MUST follow the elements README § Element conventions (module per
  tag with one `define` call, declared properties with descriptions, token-only static styles with the `[hidden]` and
  forced-colours rules, manifest entries, stories, the scenario driver run in process and on the strict-CSP fixture).
- **FR-002**: Each MUST render a native `<dialog>` in its open shadow root and show it with `showModal()`, so it is in
  the top layer and the rest of the document is inert.
- **FR-003**: Each MUST reset the user agent's dialog border, padding, margin, background, colour and maximum sizes,
  and style the panel and the `::backdrop` only from `--ocelle-*` tokens: backdrop `--ocelle-color-overlay`, shadow
  `--ocelle-elevation-raised`, radius `--ocelle-radius-2` (the dialog; the drawer is square on its viewport edge).
- **FR-004**: Each MUST expose a reflected boolean `open` property and attribute as the single source of truth for
  being shown: setting it shows or closes the element, and the element sets it to false whenever it closes.
- **FR-005**: Each MUST take its accessible name from a `label` property, rendered as the visible heading inside the
  same shadow root as the `<dialog>` (no ID reference crosses a shadow root), with the elements README § Host ARIA
  rule: a host `aria-label` names the element and decides alone. The host has no role, so the closed host's exposure
  with a host `aria-label` is measured, asserted and documented in the README § Host ARIA (operator decision). The
  drawer's `heading-hidden` (FR-048) hides the heading visually only; the dialog has no such option.
- **FR-006**: Each MUST render a close control: a native `<button>` holding `ocelle-icon name="close"` (decorative),
  named by a `close-label` property whose default is "Close", meeting `--ocelle-target-min` and showing the token
  focus ring.
- **FR-007**: On open, focus MUST move to the first slotted element marked `autofocus`; else to the first focusable
  element of the body content in tree order; else to the close control.
- **FR-008**: While open, Tab and Shift+Tab MUST move focus only among the overlay's focusable elements, wrapping at
  the ends, and the content outside MUST be unreachable by keyboard, pointer and the accessibility tree. Elements
  that are not rendered or not visible are not stops, and a radio group is one stop. An overflowing scroll container
  in the content with nothing focusable inside it (a wide prose table) is a stop where the engine makes it focusable.
  From focus inside the overlay on no stop (the dialog itself after a click on its text, an element focused by
  script) Tab goes to the next stop and Shift+Tab to the previous one; from the document body (a focused element the
  host removed) to the first and the last. Only the topmost overlay wraps.
- **FR-009**: On every close, focus MUST return to the element (the deepest one, inside shadow roots) that had focus
  when the overlay opened, if it is still connected and focusable, provided focus is then still inside the closing
  overlay or on the body; focus another overlay has taken MUST NOT be moved. An opener inside an overlay that is
  closing is replaced by that overlay's opener. The page behind a closing overlay stays inert until its exit ends, so
  the documentation tells hosts to move focus elsewhere in the `…-close` listener, after the return.
- **FR-010**: Escape, while the overlay is the topmost open one and no tooltip bubble inside it is shown, MUST
  dispatch the close request with reason `"escape"`, unless the key has already been handled (`defaultPrevented`),
  cancels an IME composition, or clears a non-empty search field; then the overlay does nothing. Opening an overlay
  hides any shown tooltip bubble outside it.
- **FR-011**: Activating the close control MUST dispatch the close request with reason `"close-button"`.
- **FR-012**: A primary-button click on the backdrop MUST dispatch `ocelle-drawer-close-request` with reason
  `"backdrop"` on the drawer and MUST do nothing on the dialog; a press that starts inside the panel and ends on the
  backdrop is not a backdrop click.
- **FR-013**: The close request MUST be a `CustomEvent` named `ocelle-<element>-close-request`, `bubbles`, `composed`
  and `cancelable`, with `detail: { reason: "escape" | "close-button" | "backdrop" }`; when not cancelled, the element
  closes; when cancelled, it stays open and focus stays inside, on every repetition of a request, wherever focus is
  inside the overlay or on the document body (Edge Cases, repeated Escape, including its stated limit for slotted
  content that stops Escape's propagation). While the overlay is closing, no request is dispatched: Escape, the close
  control and the backdrop do nothing until the host sets `open` again.
- **FR-014**: Every close MUST dispatch exactly one `ocelle-<element>-close` (`bubbles`, `composed`, not cancelable)
  after the element is closed and `open` is false, with `detail: { reason }` where reason is the request's reason, or
  `"host"` when the host set `open` to false or the platform closed it (FR-016). Removal from the document is the one
  close without an event (FR-022). Input during the exit and a host that reopens the overlay in its close listener or
  right after a move MUST NOT cause a second close event or close the reopened overlay.
- **FR-015**: Opening MUST NOT dispatch an event; the host opened it.
- **FR-016**: A close the platform performs other than through FR-010 to FR-012 (`close()` called on the inner dialog,
  the platform's repeated-Escape close) MUST leave `open`, focus and the close event consistent with a close of reason
  `"host"`. A slotted `<form method="dialog">` does not reach the inner dialog and MUST change nothing; the
  documentation tells hosts to close the element from their submit handler.
- **FR-017**: The overlay MUST expose slots: the default slot (body), `footer` (actions, laid out at the end of the
  panel), and parts for the panel, heading, body, footer and close control; all in the manifest.
- **FR-018**: The body MUST scroll when the content exceeds the space left by the heading and footer, which stay
  visible; while it overflows the body is itself a Tab stop, so it is reachable by keyboard scrolling with or without
  focusable content. The body keeps a token-derived minimum block size (three times `--ocelle-target-min`, 132 px by
  default) at every viewport size, so a one-line body is that tall, with space below its text (operator decision;
  the documentation says so); when the viewport is too short for the heading, footer and that minimum, the panel
  scrolls as a whole (WCAG 1.4.10).
- **FR-019**: The panel's content box MUST have a definite inline size (base styles FR-017).
- **FR-020**: Entry and exit MUST animate only with `--ocelle-motion-base` and `--ocelle-easing-standard` and MUST NOT
  animate under `prefers-reduced-motion: reduce`, whatever value a host sets on those tokens.
- **FR-021**: In forced-colours mode the panel MUST have a visible boundary and system colours, the backdrop MUST
  not hide that boundary, and the close control MUST show a visible focus indicator.
- **FR-022**: Removing an open (or closing) overlay from the document MUST leave no inert content, top-layer entry or
  backdrop, MUST set `open` to false and MUST dispatch no event (operator decision); re-inserted, the element is closed
  until the host sets `open` again.
- **FR-023**: A second overlay opened from inside an open one MUST stack above it; Escape, the close control and the
  backdrop act only on the topmost; on its close, focus returns into the overlay beneath (FR-009).
- **FR-047** (all three elements): Positioning the bubble, and any runtime styling of the dialog, drawer or bubble,
  MUST NOT write a `style` attribute (including through the element's `style` property or CSSOM writes to it) on any
  element, rendered or slotted or in the host page, and MUST NOT add a `<style>` element anywhere; runtime values
  reach the CSS only through adopted stylesheets (constitution IV, triage record). US3 scenario 13 asserts it after
  every placement, and the overlay scenarios assert it after open and close.

**Dialog**

- **FR-024**: `ocelle-dialog` MUST be at most `--ocelle-dialog-max-inline` wide and `--ocelle-dialog-max-block` tall,
  centred in the viewport, and offer its preferred inline size as its own hook `--ocelle-dialog-inline-size` (an
  element CSS custom property per the README § Element conventions, in the manifest), with a token-derived default.

**Drawer**

- **FR-025**: `ocelle-drawer` MUST take a `side` property and attribute, `"start"` (default) or `"end"`, placed on the
  logical inline edge of the viewport under the element's direction, and span the full block size of the viewport.
- **FR-026**: Its inline size MUST be the new token `--ocelle-drawer-inline` (FR-038), capped at
  `--ocelle-dialog-max-inline`.
- **FR-027**: It MUST take a `ground` property and attribute, `"sheet"` (default) or `"chrome"`; `"chrome"` uses the
  chrome ground and chrome ink tokens in both themes, so #8's personal rail can sit inside #12's drawer.
- **FR-028**: With motion allowed, it MUST enter from and leave towards its own side (mirrored under `rtl`).
- **FR-048**: It MUST take a reflected boolean `heading-hidden` property and attribute (default false; operator
  decision). When set, the heading is not painted and takes no space, but it stays in the accessibility tree as the
  same heading, the drawer's accessible name is unchanged (FR-005, including the host `aria-label` rule), and the
  close control stays visible, focusable and in its place at the panel's block start. It is in the manifest and
  documented as the option for #12's personal drawer.

**Tooltip**

- **FR-029**: `ocelle-tooltip` MUST follow the element conventions (FR-001) and wrap its trigger: the trigger is the
  first element slotted into its default slot, which may be a native control or a custom element's host whose inner
  control is focusable (without `describes`; with it see FR-036). The host is layout-transparent (`display:
  contents`, operator decision), so wrapping leaves the trigger's box unchanged. Triggers are buttons and links: a
  text field matches `:focus-visible` on any focus, so around one the bubble shows on focus however it arrives, and
  the documentation states this limit (operator decision).
- **FR-030**: It MUST take a `text` property and attribute (the bubble's plain text), a `placement` property and
  attribute, `"top"` (default), `"bottom"`, `"start"` or `"end"` (logical under the element's direction), a
  `disabled` boolean, and a reflected `describes` boolean (default false, FR-036); an empty `text` or `disabled` shows
  no bubble.
- **FR-031**: The bubble MUST show when the pointer has rested on the trigger for `--ocelle-tooltip-delay` (FR-038),
  and at once when the trigger, or a control inside it, receives keyboard focus. Keyboard focus, here and in FR-032
  and FR-033, means focus on the trigger or a control inside it that matches `:focus-visible`; focus from a pointer
  click or a tap that does not match `:focus-visible` neither shows nor keeps a bubble.
- **FR-032**: The bubble MUST stay while the pointer is on the trigger or on the bubble, or the trigger has keyboard
  focus (FR-031), with no timeout; it MUST hide when none of these holds, allowing the pointer to cross the gap
  between trigger and bubble. The same focus condition governs show, stay and hide.
- **FR-033**: Escape while a bubble is shown MUST hide it and stop the key there (no overlay close request, FR-010);
  focus and pointer do not move, and the bubble stays hidden until the pointer re-enters or keyboard focus re-enters.
- **FR-034**: The bubble MUST be shown in the top layer through the Popover API (operator decision), above any open
  dialog or drawer and their backdrops, whole, whatever the overflow, transform or stacking context of its ancestors;
  it MUST not take focus, MUST not be light-dismissed (it hides only by FR-032, FR-033, FR-010's overlay opening and
  the rules of FR-030), and at most one bubble MUST be shown on the page at a time.
- **FR-035**: The bubble MUST be placed on its `placement` side of the trigger, offset by a space token, and flip to
  the opposite side when it would overflow the viewport; it MUST stay beside the trigger while the trigger moves
  (any scroll, including scrollers inside shadow roots, and resizes); its inline size MUST not exceed a maximum from a
  token, and text wraps (including unbreakable strings).
- **FR-036**: Assistive technology MUST get the text once, as the host states it through `describes`: without
  `describes` (the default, for text that repeats the trigger's name, as #12 and #7 use it) the text is not exposed
  to assistive technology beyond the trigger's own name, and the trigger gets no accessible description from the
  tooltip; with `describes` the text is the trigger's accessible description. `describes` is supported only when the
  trigger is itself the focusable element (a native control, or a custom element focusable as its host); a custom
  element whose inner control takes focus cannot be described from outside its shadow root, and the documentation
  says so. The element never compares the text with the trigger's name. The description node (light DOM, text set as
  text, never parsed) has role `tooltip`; the painted bubble is hidden from the tree; no ID reference crosses a shadow
  root (constitution III). The description survives a host re-render of the trigger's `aria-describedby`, a host
  re-render that removes the description node, and a replaced trigger (operator decision). The documentation tells
  hosts to set `describes` when the text adds to the name.
- **FR-037**: The tooltip MUST NOT name its trigger or carry essential information: the documentation states that the
  trigger carries its own accessible name and that the bubble only repeats or supplements what is available
  otherwise; touch input shows no bubble, except on a text-field trigger, which shows it on any focus (FR-029).

**Tokens and engines**

- **FR-038**: `@ocelle/tokens` MUST gain `--ocelle-drawer-inline` (shell group) and `--ocelle-tooltip-delay` (motion
  group), and a token for the bubble's maximum inline size unless an existing measure token serves, each with its
  validation (mission 002: name, group, type, reference checks) and in the tokens documentation; the bubble's ground
  and ink are tokens whose text contrast is in the contrast check.
- **FR-039**: Every token an element reads MUST be named in the elements README section of that element; new tokens
  follow mission 002's rules and change the tokens changelog.
- **FR-040**: The elements README § Engines MUST raise the floor to Chromium 120 / WebKit 17 and list the Popover API
  (Chromium 114, WebKit 17) as the newest feature, and the floor's other consumers (package metadata, browserslist or
  build targets, if any declare it) MUST follow.
- **FR-041**: This feature's research MUST record Kitty Desktop's webview engines (WKWebView on macOS, WebKitGTK on
  Linux) against WebKit 17, and the plan MUST name any consumer platform below it as a risk for the operator.

**Evidence (done when)**

- **FR-042**: Each element MUST have a story per variant and state, in light and dark, with committed baselines and
  axe clean, written against #10's workbench (006 FR-012: top-layer content in the capture; FR-031: a declared hover
  state; FR-025: the contributor note). At least: dialog open (default, with footer, long scrolling body, prose with a
  table, the Open project shape with a stand-in list); drawer start, end, `rtl`, chrome ground, chrome ground with
  `heading-hidden`; tooltip shown by hover on each placement, flipped at an edge, inside an open dialog, and with
  long text.
- **FR-043**: Interaction tests MUST assert every event of each element with its payload and cancelability, every
  keyboard path (Tab, Shift+Tab, Escape, Enter and Space on the close control), and focus on open and on close for
  every reason (#16's focus-management tests), in process and on the strict-CSP fixture with the browser build.
- **FR-044**: Accessibility-tree assertions MUST prove the names, roles, modality and descriptions of US1 scenario 8
  (with and without a host `aria-label`, open and closed), US2 scenario 6 and US3 scenarios 7 and 11 in Chromium.
- **FR-045**: The manifest MUST declare, for each element, every property, attribute, event (with its detail type),
  slot, part and own CSS custom property, each list stated even when empty (the tooltip's events list is empty).
- **FR-046**: Changed source MUST pass mutation testing under mission 007's rules; timing code (the hover delay) is
  tested so its mutants are killed rather than left to time out.

### Key Entities

- **Overlay** (`ocelle-dialog`, `ocelle-drawer`): `open`, `label`, `close-label`; drawer also `side`, `ground`,
  `heading-hidden`; slots
  default and `footer`; events `…-close-request` (cancelable, reason) and `…-close` (reason).
- **Close reason**: `"escape"`, `"close-button"`, `"backdrop"` (drawer only), `"host"` (close event only).
- **Opener**: the deepest focused element when an overlay opened; the focus target on close.
- **Tooltip** (`ocelle-tooltip`): `text`, `placement`, `disabled`, `describes`; trigger (first slotted element); bubble (top layer).
- **New tokens**: `--ocelle-drawer-inline`, `--ocelle-tooltip-delay`, and a bubble maximum inline size if needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of the open/close paths (four close reasons for the drawer, three for the dialog, each with and
  without a cancelling host), focus after the path is where FR-007 or FR-009 says, checked by tests in process and on
  the strict-CSP fixture.
- **SC-002**: From an open overlay with n focus stops, n + 2 Tab presses give exactly the expected wrap-around
  sequence of stops, with no stop on the document body or outside the overlay, and the same for Shift+Tab, started
  from the first stop, the last stop, the close control, the dialog itself (after a click on its text) and the
  document body.
- **SC-003**: Every event the three elements emit is asserted with its full payload and cancelability: 2 events per
  overlay, 0 for the tooltip, and the manifest lists exactly those.
- **SC-004**: axe reports 0 serious or critical findings on every story of the three elements in light and dark, and
  every story has a committed baseline in both themes.
- **SC-005**: A user pressing Escape over a shown tooltip inside an open dialog needs exactly 2 presses to close the
  dialog: the first hides the bubble only.
- **SC-006**: In a container with clipped overflow, a transformed ancestor and an open dialog, 100% of the bubble's box
  is painted on screen and above the overlay.
- **SC-007**: No raw colour, size, duration or shadow literal appears in the three elements' styles (`style-lint`), and
  the built output passes the strict-CSP check with every scenario exercised, and after every placement, open and
  close scenario 0 elements carry a `style` attribute and 0 `<style>` elements were added (FR-047).
- **SC-008**: With reduced motion, open and close of each overlay create no animation, also when an ancestor sets
  `--ocelle-motion-base`. (The bubble never animates, so it has no reduced-motion clause.)

## Assumptions

- **#10 lands first for evidence.** Stories, baselines and axe follow #10's design on
  `origin/claude/010-storybook-workbench` (`specs/006-storybook-workbench`), which is not merged; the plan is written
  against it and rechecked when it lands. Implementation waits for #10 (operator).
- **Focus states in stories.** #10 declares hover and press states (006 FR-031) but no focus state; a story that shows
  the tooltip by focus or an open overlay renders its open state from its arguments. The plan confirms this against #10.
- **Page scroll behind a modal** is not locked by the element; the host may lock it. The top layer and inertness
  already keep the page behind out of reach.
- **Localisation.** The element's only built-in text is the close control's default name "Close"; hosts set
  `close-label` in their language.
- **First consumer story.** #14's `ocelle-listbox` is not built; the Open project story uses a stand-in list. The
  feature that lands second of #14 and this one adds the composed story.
- **Only Chromium is measured** (elements README § Engines); WebKit behaviour of the Popover API and `<dialog>` is an
  open limitation, as it is for every element.
- **Touch** has no hover, and a tap on a button or link does not give keyboard focus; the tooltip shows on hover and
  keyboard focus only (FR-031), with text-field triggers the stated exception (FR-029).

## Dependencies

- **#10 / 006** (unmerged): the story, baseline and axe gates (FR-042).
- **Mission 005** (merged): element conventions, `ocelle-icon` and its `close` icon, the manifest gate, the slot and
  host-ARIA conventions.
- **Mission 007** (merged): mutation verdicts, including how Timeout and CompileError mutants count.
- **Mission 002 / 003** (merged): token validation and contrast check; base styles FR-017 (definite inline size).
- **Blocks**: #12 (drawer, nav-item bubble), #7 (pill-tag ellipsis), #11 (release).

## Out of Scope

- The consumers' elements: #7's pill tag, #12's app shell, top bar and nav item, #14's listbox, #8's personal rail.
- A non-modal drawer or flyout (`show()`), a toast, a menu, a non-modal popover, a popover anchored by `popovertarget`
  for other content (operator decision; none is asked for by #16 or a sibling).
- A tooltip path below WebKit 17.
- Locking the page's scroll behind a modal.
- The Storybook harness itself (#10).
