# Data Model: Overlays

**Feature**: [spec.md](spec.md) | **Research**: [research.md](research.md)

## Overlay (internal base `OcelleOverlay`, `src/overlay.ts`)

| Member | Kind | Type / values | Default | Notes |
|---|---|---|---|---|
| `open` | property, reflected attribute | boolean | `false` | Single source of truth (FR-004). |
| `label` | property, attribute | string | `undefined` | Heading text and accessible name (FR-005, R-08). |
| `closeLabel` / `close-label` | property, attribute | string | `"Close"` | The close control's name (FR-006). |
| `aria-label` | observed host attribute | string | — | Decides the name alone when present (README § Host ARIA). Not a declared property. |
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
shown ──(platform close: form method=dialog, inner close())──▶ closing("host")       (R-03)
closing(reason) ──(exit animation ends or 0 ms)──▶ <dialog>.close(); focus returned; …-close {reason} ──▶ closed
closing ──(host: open = true)──▶ shown   (animation cancelled, no close event)       (R-06)
any ──(disconnected)──▶ closed           (no event; no top-layer entry or inert content left; FR-022)
```

- `opener`: the deepest active element recorded on entering `opening`. The focus target in `closing` (R-05).
- `open` is false from the first moment of `closing` (FR-004).

### Events

| Event | When | `detail` | bubbles | composed | cancelable |
|---|---|---|---|---|---|
| `ocelle-dialog-close-request` / `ocelle-drawer-close-request` | user intent to close | `{ reason: "escape" \| "close-button" \| "backdrop" }` (`backdrop`: drawer only) | yes | yes | **yes** |
| `ocelle-dialog-close` / `ocelle-drawer-close` | after the overlay left the top layer and focus returned | `{ reason: "escape" \| "close-button" \| "backdrop" \| "host" }` | yes | yes | no |

No event is dispatched on open (FR-015).

## `ocelle-dialog` (`src/ocelle-dialog.ts`)

The members of Overlay, plus:

| Member | Kind | Default | Notes |
|---|---|---|---|
| `--ocelle-dialog-inline-size` | element CSS custom property | `var(--ocelle-measure-reading)` | Preferred inline size, capped by `--ocelle-dialog-max-inline` (FR-024, R-09). |

Tokens read: `color-sheet`, `color-ink`, `color-overlay`, `elevation-raised`, `radius-2`, `gutter`, `space-*`,
`dialog-max-inline`, `dialog-max-block`, `measure-reading`, `font-*`, `focus-*`, `color-focus`, `target-min`,
`motion-base`, `easing-standard`, `size-visually-hidden` (for the drawer's `heading-hidden`).

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
| `bubble` | part | — | — | The painted bubble (`popover="manual"`, `aria-hidden`). |
| events | — | none | — | The manifest states an empty list (FR-045). |

### State

```text
hidden ──(pointerenter on trigger, not touch)──▶ pending ──(delay elapses)──▶ shown
hidden ──(focus arrives matching :focus-visible)──▶ shown
pending ──(pointerleave)──▶ hidden
shown ──(pointer leaves trigger and bubble, no keyboard focus)──▶ hidden
shown ──(focusout, not hovered)──▶ hidden
shown ──(Escape)──▶ dismissed ──(pointer re-enters | keyboard focus re-enters)──▶ shown
shown ──(another tooltip shows | trigger removed or disabled | text empty | disabled)──▶ hidden
```

- `shown` places the bubble (R-11) and re-places it on scroll and resize.
- With `describes`, one light-DOM `span[slot="ocelle-description"][role="tooltip"][hidden]` and its id in the trigger's
  `aria-describedby` exist while `describes` is set and `text` is not empty, whatever the state.

## New tokens (`packages/tokens/src/source.ts`)

| Name | Group | Value | ref |
|---|---|---|---|
| `drawer-inline` | shell | `var(--ocelle-shell-sidebar-width)` | `["shell-sidebar-width"]` |
| `tooltip-delay` | motion | `500ms` | — |
| `tooltip-max-inline` | size | `18rem` | — |

## Stories (`storybook/stories/`, against #10 — recheck when it lands)

| File | Stories (each in light and dark) |
|---|---|
| `dialog.stories.ts` | default open; with footer actions; long scrolling body; prose with a table; Open project shape (stand-in list); long label |
| `drawer.stories.ts` | start; end; `rtl` start; chrome ground; chrome ground with `heading-hidden`; long scrolling body |
| `tooltip.stories.ts` | hover top; hover bottom; hover start; hover end; flipped at the top edge; inside an open dialog; long text |
