# Data Model: Overlays

**Feature**: [spec.md](spec.md) | **Research**: [research.md](research.md)

## Overlay (internal base `OcelleOverlay`, `src/overlay.ts`)

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
  the `<dialog>` closes or the host disconnects. Only the top acts on Escape and Tab (R-02, R-04); the top also
  handles Escape and Tab whose deep active element is the document body, from a `document` listener (R-02). Opening
  an overlay first hides the shown tooltip bubble, if any (R-10).
- **Tab**: the top overlay handles every Tab and Shift+Tab: next (previous) stop after the deep active element's
  flat-tree position, wrapping; from the body the first (last) stop (R-04).
- **Stops**: the walk's tabbable elements, the body part while it overflows, and slotted overflowing scroll
  containers with no tabbable descendant where the engine focuses them (R-04).
- **Body stop**: the `body` part has `tabindex="0"` exactly while it overflows (R-04, R-18). Its `min-block-size` is
  `3 × target-min` (132 px) at every size, so a one-line body is 132 px tall (operator decision, R-18).

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

Tokens read: `color-sheet`, `color-ink`, `color-overlay`, `elevation-raised`, `radius-2`, `gutter`, `space-*`,
`dialog-max-inline`, `dialog-max-block`, `measure-reading`, `border-width`, `font-*`, `focus-*`, `color-focus`,
`target-min`, `motion-base`, `easing-standard`, `size-visually-hidden` (for the drawer's `heading-hidden`).

## `ocelle-drawer` (`src/ocelle-drawer.ts`)

The members of Overlay, plus:

| Member | Kind | Type / values | Default | Notes |
|---|---|---|---|---|
| `side` | property, reflected attribute | `"start" \| "end"` | `"start"` | Logical edge (FR-025). |
| `ground` | property, reflected attribute | `"sheet" \| "chrome"` | `"sheet"` | Chrome ground and ink in both themes (FR-027). |
| `headingHidden` / `heading-hidden` | property, reflected attribute | boolean | `false` | Visually hidden heading, kept in the tree (FR-048). |

An unknown `side` or `ground` value renders as the default.

Tokens read, in addition to the dialog's: `drawer-inline` (new), `color-chrome`, `color-chrome-ink`,
`color-chrome-hover`.

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

## Stories (`storybook/stories/`, against #10 — recheck when it lands)

| File | Stories (each in light and dark) |
|---|---|
| `dialog.stories.ts` | default open; one-line confirmation body (132 px minimum, R-18); with footer actions; long scrolling body; prose with a table; Open project shape (stand-in list); long label; named by a host `aria-label` (R-08); short viewport 320 × 256 if #10 takes a per-story viewport (R-16, R-18) |
| `drawer.stories.ts` | start; end; `rtl` start; chrome ground; chrome ground with `heading-hidden`; long scrolling body |
| `tooltip.stories.ts` | hover top; hover bottom; hover start; hover end; flipped at the top edge; `rtl` hover start; `rtl` hover end; inside an open dialog; long text |
