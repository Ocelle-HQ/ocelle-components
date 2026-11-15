# Data Model: Overlays

**Feature**: [spec.md](spec.md) | **Research**: [research.md](research.md)

## Overlay (internal base `OcelleOverlay`, `src/overlay.ts`)

The members below are listed in the manifest on `ocelle-dialog` and `ocelle-drawer` with `inheritedFrom` naming
`OcelleOverlay` (`src/overlay.ts`); the base itself is not a module or declaration of the published manifest
(operator decision "analyse, then drop it", 2026-11-14, R-01).

| Member | Kind | Type / values | Default | Notes |
|---|---|---|---|---|
| `open` | property, reflected attribute | boolean | `false` | Single source of truth (FR-004). |
| `label` | property, attribute | string | `undefined` | Heading text and accessible name (FR-005, R-08). |
| `closeLabel` / `close-label` | property, attribute | string | `"Close"` | The close control's name (FR-006). |
| `aria-label` | observed host attribute | string | — | Decides the name alone when present (README § Host ARIA). Not a declared property. Kept by operator decision; asserted open and closed in the tree, limit in the README (R-08). |
| default slot | slot | — | — | Body (FR-017). |
| `footer` | slot | — | — | Actions. The footer is not rendered while the slot is empty. |
| `panel`, `heading`, `body`, `footer`, `close-button` | parts | — | — | FR-017. |

### State

```text
closed ──(host: open = true)──▶ opening ──(entry animation ends or 0 ms)──▶ shown
shown ──(Escape | close control | backdrop [drawer])──▶ request event
      request cancelled ──▶ shown
      request not cancelled ──▶ closing(reason)
shown ──(host: open = false)──▶ closing("host")
shown ──(platform close: inner close(), non-cancelable cancel)──▶ closing("host")    (R-02, R-03)
closing(reason) ──(exit animation ends or 0 ms)──▶ <dialog>.close(); focus returned if still ours; …-close {reason} ──▶ closed
closing(reason) ──(platform closes the <dialog> during the exit)──▶ exit cancelled; focus returned if still ours;
                                               …-close {reason} ──▶ closed                                 (R-03)
closing ──(Escape | cancel | close control | backdrop)──▶ closing   (Escape and a cancelable cancel prevented;
                                               nothing requested, nothing dispatched; R-02, R-06, R-07)
closing ──(host: open = true)──▶ shown   (animation cancelled, no close event)       (R-06)
any ──(disconnected)──▶ closed, open = false   (no event, no focus move; no top-layer entry or inert content left;
                                               a close in progress ends without its …-close; FR-022, R-05a)
closed ──(reconnected)──▶ closed         (the host sets open = true to show it again)
```

- `opener`: the deepest active element recorded on entering `opening`; if it is inside an overlay that is closing,
  that overlay's opener (R-05). The focus target in `closing`, used only if focus is still inside the closing overlay
  or on the body (R-05).
- `open` is false from the first moment of `closing` (FR-004).
- A slotted `<form method="dialog">` causes no transition (R-03).
- **Native `close` events** (R-03): `ownCloses` counts the overlay's own `close()` calls on the inner `<dialog>` (end
  of the exit, disconnection). Each native `close` event consumes one if any and is then ignored, so a queued event
  that arrives after a reopen changes nothing. An event that consumes none is a platform close only in `shown` (or
  `opening`) with the inner `<dialog>` not open at the time of the event; in `closing` it ends the exit early; in any
  other case it is ignored.
- **Only `open = true` leaves `closing`**: Escape, `cancel`, the close control and the backdrop request nothing there.
- **Overlay stack** (module-level, internal): the open overlays in opening order. Pushed on `showModal()`, removed when
  the `<dialog>` closes or the host disconnects. Only the top acts on Escape and Tab (R-02, R-04), and only while no
  other close watcher above it (an open `popover="auto"`/`"hint"` element, another `<dialog>` that is `:modal`, or a
  non-modal `<dialog>` opened after the overlay's `showModal()`, by `show()` or by the `open` attribute, whose
  `closedBy` is `closerequest` or `any`) is in its flat tree (a non-modal `<dialog>` already open at the overlay's
  `showModal()`, whatever its `closedBy`, or opened after it with `closedBy` `auto`/`none`, is ordinary content);
  while one is, the overlay stands aside on Escape and the platform handles the key, and R-04 handles no Tab while a
  popover or modal dialog is open but keeps handling Tab for a non-modal dialog (R-02). **Below record**: at
  `showModal()` the overlay records the open non-modal dialogs in its flat tree as below it; a dialog leaves the
  record on its next `close` event or a `toggle` whose `oldState` is `open` (capture phase), and an unrecorded open
  dialog counts as opened after the overlay; removing and setting the `open` attribute fires neither, so a recorded
  dialog reopened that way stays below (a stated limit). Fallback: if the overlay stood aside and the press fires a cancelable
  `cancel` on its own `<dialog>`, it prevents it, requests once with `escape` and adds that dialog to the below
  record; a non-cancelable `cancel` there is a platform close with `host`, a stated limit (R-02). The top also handles Escape and Tab
  whose deep active element is the document body, from a `document` listener (R-02). Opening an overlay first hides
  the shown tooltip bubble, if any (R-10).
- **Tab** (hybrid, operator decision PLAN-FRESH-3-001 (a)): the top overlay handles a Tab or Shift+Tab explicitly only
  at the cycle's ends (the wrap), from a non-stop of its own open tree (next or previous stop or opaque container
  after the deep active element's flat-tree position) and from the body (first or last stop). From a middle stop or
  an opaque focus container (closed shadow host holding focus, `<iframe>`, media element with `controls`) the native
  move runs; a native move that lands on the body is repaired to the first stop, or, where the engine gives no
  signal, the next press does it (R-04). When the cycle's last candidate in navigation order is an opaque container,
  the Shift+Tab wrap from the first stop focuses the end sentinel and lets the native move run, so the content is
  entered from its end (sentinel wrap, operator decision, 2026-11-14, R-04).
- **End sentinel** (internal, not public surface): an empty element, last child of the `<dialog part="panel">` after
  the footer, `tabindex="-1"`, `aria-hidden="true"`, no content, no accessible name, no role, no part, no visible
  box (zero block size). Never a sequential stop and never in the stop list; absent from the accessibility tree; focused only within a
  sentinel-wrap keydown, whose native move takes focus off it (R-04).
- **Stops**, in the engine's sequential navigation order (positive `tabindex` first within each focus navigation
  scope, R-04), whose first and last are the cycle's ends: the walk's tabbable elements, the body part while it overflows, slotted overflowing scroll containers
  with no tabbable descendant where the engine focuses them, `<iframe>`s and media elements with `controls`; custom
  elements whose `shadowRoot` reads null are recorded as opaque containers, tried as candidates by explicit moves
  (R-04).
- **Body stop**: the `body` part has `tabindex="0"` exactly while it overflows (R-04, R-18). Its `min-block-size` is
  `3 × target-min` (132 px) at every size, so a one-line dialog body is 132 px tall (operator decision, R-18). The
  drawer's body grows to fill its column (see `ocelle-drawer`).

### Events

| Event | When | `detail` | bubbles | composed | cancelable |
|---|---|---|---|---|---|
| `ocelle-dialog-close-request` / `ocelle-drawer-close-request` | user intent to close | `{ reason: "escape" \| "close-button" \| "backdrop" }` (`backdrop`: drawer only) | yes | yes | **yes** |
| `ocelle-dialog-close` / `ocelle-drawer-close` | after the overlay left the top layer and focus returned | `{ reason: "escape" \| "close-button" \| "backdrop" \| "host" }` | yes | yes | no |

No event is dispatched on open (FR-015).
No event is dispatched on disconnection, even for a close in progress (R-05a, FR-022). The events are declared with
`@fires` on each concrete class (R-01).

## `ocelle-dialog` (`src/ocelle-dialog.ts`)

The members of Overlay, plus:

| Member | Kind | Default | Notes |
|---|---|---|---|
| `--ocelle-dialog-inline-size` | element CSS custom property | `var(--ocelle-measure-reading)` | Preferred inline size, capped by `--ocelle-dialog-max-inline` (FR-024, R-09). |

Tokens read (as the README states them, Phase 2): `color-sheet`, `color-ink`, `color-overlay`, `elevation-raised`,
`radius-2`, `border-width`, `dialog-max-inline`, `dialog-max-block` (which reads `gutter`), `measure-reading`,
`font-sans`, `font-size-md`, `font-size-lg`, `font-weight-strong`, `line-height-normal`, `line-height-tight`,
`space-2`, `space-3`, `space-4`, `space-6`, `target-min`, `focus-width`, `focus-offset`, `color-focus`, `motion-base`,
`easing-standard`, and the close icon's `icon-size`.

## `ocelle-drawer` (`src/ocelle-drawer.ts`)

The members of Overlay, plus:

| Member | Kind | Type / values | Default | Notes |
|---|---|---|---|---|
| `side` | property, reflected attribute | `"start" \| "end"` | `"start"` | Logical edge (FR-025). |
| `ground` | property, reflected attribute | `"sheet" \| "chrome"` | `"sheet"` | Chrome ground and ink in both themes (FR-027). |
| `headingHidden` / `heading-hidden` | property, reflected attribute | boolean | `false` | Visually hidden heading, kept in the tree (FR-048). |

An unknown `side` or `ground` value renders as the default.

**Layout** (R-18, PLAN-FRESH-3-003): the panel spans the viewport's full block size; its column is header, body,
footer, and the `body` part grows to fill the space between header and footer (`flex: 1 1 auto`, with the same
`3 × target-min` minimum), so the footer is at the panel's block end whatever the body holds. A one-line drawer body
is as tall as the panel minus header and footer, not 132 px.

**Shape** (FR-003, operator decision): the two corners on the panel's inner edge (the edge facing the page) take
`radius-2`; the two corners on the edge against the viewport are 0. In logical terms: `side="start"` sets
`border-start-end-radius` and `border-end-end-radius` to `var(--ocelle-radius-2)` and `border-start-start-radius` and
`border-end-start-radius` to 0; `side="end"` the reverse. So under `rtl` the rounded corners follow the inner edge.

Tokens read (the README's sentence, T032): the dialog's, less `dialog-max-block` (the drawer has no block cap) and
`measure-reading` (no `--ocelle-dialog-inline-size`), plus `drawer-inline` (new), `color-chrome` and
`color-chrome-ink` (`ground="chrome"`, FR-027) and `size-visually-hidden` (`heading-hidden`, FR-048). In full:
`color-sheet`, `color-ink`, `color-overlay`, `color-chrome`, `color-chrome-ink`, `elevation-raised`, `radius-2`,
`border-width`, `drawer-inline`, `dialog-max-inline`, `font-sans`, `font-size-md`, `font-size-lg`,
`font-weight-strong`, `line-height-normal`, `line-height-tight`, `space-2`, `space-3`, `space-4`, `space-6`,
`target-min`, `size-visually-hidden`, `focus-width`, `focus-offset`, `color-focus`, `motion-base`, `easing-standard`,
and the close icon's `icon-size`. `color-chrome-hover` is not read: no requirement gives the drawer a hover state.

## `ocelle-tooltip` (`src/ocelle-tooltip.ts`)

| Member | Kind | Type / values | Default | Notes |
|---|---|---|---|---|
| `text` | property, attribute | string | `""` | Plain text. Empty means no bubble. |
| `placement` | property, reflected attribute | `"top" \| "bottom" \| "start" \| "end"` | `"top"` | Logical (FR-030). Flips when there is no room (R-11). |
| `disabled` | property, reflected attribute | boolean | `false` | No bubble. |
| `describes` | property, reflected attribute | boolean | `false` | The text becomes the trigger's description (R-13). |
| default slot | slot | — | — | The trigger is the first assigned element. |
| `bubble` | part | — | — | The painted bubble (`popover="manual"`, `aria-hidden`). Hidden by default; shown only through `:popover-open` (R-10). |
| `:host` display | layout | `contents` | — | Operator decision: layout-transparent, so the trigger's box is unchanged (R-11). |
| events | — | none | — | The manifest states an empty list (FR-045). |

### State

```text
hidden ──(pointer enters trigger or bubble from outside the tooltip, not touch)──▶ pending ──(delay elapses)──▶ shown
hidden ──(focus arrives matching :focus-visible)──▶ shown
pending ──(pointer leaves to outside the tooltip)──▶ hidden
shown ──(pointer leaves to outside the tooltip, no keyboard focus)──▶ hidden
shown ──(focusout, not hovered)──▶ hidden
shown ──(Escape, trigger not behind the topmost modal)──▶ dismissed ──(pointer re-enters | keyboard focus re-enters)──▶ shown
shown ──(an overlay opens)──▶ dismissed                                               (R-10)
shown ──(another tooltip shows | trigger removed or disabled | text empty | disabled)──▶ hidden
any ──(no Popover API in the engine)──▶ hidden, permanently                            (R-10)
```

- Hover is decided on the tooltip host from `pointerover`/`pointerout` and their `relatedTarget`: moving between
  trigger and bubble stays inside the tooltip and changes nothing (R-12). The delay timer starts at the first entry
  and is not restarted by moves between trigger and bubble.
- `shown` places the bubble (R-11) and re-places it on any frame in which the trigger's box changed.
- A text-field trigger matches `:focus-visible` on any focus, so focus by click or tap shows it (stated limit, R-12).
- With `describes`, one light-DOM `span[slot="description"][role="tooltip"][hidden]` (made with `createElement`, text
  set with `textContent`, id `ocelle-tooltip-desc-<n>` unique in the trigger's root) and its id in the trigger's
  `aria-describedby` exist while `describes` is set and `text` is not empty, whatever the state. A `MutationObserver`
  re-adds the id when a host write drops it, the span is re-created with the same id within one microtask when a host
  re-render removes it, and the id moves with the trigger on `slotchange` (R-13).

## New tokens (`packages/tokens/src/source.ts`)

| Name | Group | Value | ref |
|---|---|---|---|
| `drawer-inline` | shell | `var(--ocelle-shell-sidebar-width)` | `["shell-sidebar-width"]` |
| `tooltip-delay` | motion | `500ms` | — |
| `tooltip-max-inline` | size | `18rem` | — |

## Stories (`storybook/stories/`, against #10 — rechecked against merged `main`, T026)

| File | Stories (each in light and dark) |
|---|---|
| `dialog.stories.ts` | default open; one-line confirmation body (132 px minimum, R-18); with footer actions; long scrolling body (an empty `data-story="dialog-scroll-edge"` block across the body's scroll edge, R-16); prose with a table (these two with no text clipped at a scroll edge, R-16); Open project shape (stand-in list); long label; named by a host `aria-label` (R-08) |
| `drawer.stories.ts` | start; end; `rtl` start; chrome ground; chrome ground with `heading-hidden`; long scrolling body (an empty `data-story="drawer-scroll-edge"` block across the body's scroll edge, so no text is clipped there, R-16) |
| `tooltip.stories.ts` | hover top; hover bottom; hover start; hover end; flipped at the top edge; `rtl` hover start; `rtl` hover end; inside an open dialog; long text |
