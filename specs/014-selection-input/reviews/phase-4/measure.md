# Phase 4 measurement: when the joined rounding is settled (T060, research R-06)

Measured 2026-11-15 in Chromium 153.0.8010.12 (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`),
driven by Playwright 1.64.1 from a script outside the repository. Plan decision 1 is decided yes
(`decision-1.md`), so the model uses custom states.

The page is a plain model of the joined `ocelle-segmented-choice` as R-06 designs it (no Lit, no package code), with
`tokens.css` linked. `#box`, a block container, holds `x-group`, whose open shadow root is a wrapping flex row
(`flex-wrap: wrap`, its block-start and inline-start padded by one border width) with one slot. The four `x-seg`
children (`All`, `Mine`, `Blocked`, `Done`) each draw a full 1 px `control-border` border with negative block-start and
inline-start margins of 1 px, a minimum block size of 44 px, and round their corners only through
`:host(:state(row-start))` and `:host(:state(row-end))`. `x-group` has one `ResizeObserver` on itself and on every
segment, and a `MutationObserver` on its subtree (child list and text). Each callback regroups: the segments are put in
rows by `offsetTop`, and each segment's `ElementInternals.states` get `row-start`, `row-end`, `first-row` and
`last-row`. Nothing writes a `style` attribute on the group or a segment; the container is resized through the CSSOM,
as the driver's `resize` does.

The test's wait is the driver's `afterResizeDelivery` (a `ResizeObserver` registered on `#box` after the element
rendered, resolved by its first callback). Radii are read as the four computed corner radii of each segment, written
`1` for rounded and `0` for square, in the order start-start, start-end, end-end, end-start.

## (1) A resize, relative to `afterResizeDelivery`

`#box` is set from 298 px (one row) to 215 px (All, Mine, Blocked on row 1, Done on row 2) in one task, then back.

| Read | 298 → 215 px | 215 → 298 px |
|---|---|---|
| Synchronously after the set | old: `1001 0000 0000 0110` | old: `1001 0000 0110 1111` |
| After one `requestAnimationFrame` | old (the frame's callbacks run before the observations are delivered) | old |
| In the test observer's callback (`afterResizeDelivery`) | **new**: `1001 0000 0110 1111` (Done rounded on both ends, Blocked's end rounded) | **new**: `1001 0000 0000 0110` |
| Two animation frames later | the same as at delivery | the same as at delivery |
| Two `requestAnimationFrame` callbacks instead of the observer | new | new |

The order of the callbacks in that delivery is the element's observer, then the test's, in every run. The rounding is
settled when `afterResizeDelivery` resolves, and two animation frames also see it. One animation frame alone sees the
previous rounding, as R-06 states. No `style` attribute appears on the group or a segment.

## (2) Re-wrap without a group size change

- **Text change (US3-18).** At 215 px with Done on row 2, `Mine`'s text becomes `Mine and more`. The group stays
  215 × 87 px (two rows), and the break moves to All and Mine on row 1, then Blocked and Done on row 2.
  - Radii read at delivery: `1001 0110 1001 0110`, so Mine's end, Blocked's start and Done's end are rounded.
  - With the `MutationObserver`, the radii are already right one animation frame after the change: the regroup runs
    in the microtask after the text set.
  - With the `MutationObserver` disconnected, the segments' `ResizeObserver` alone gives the same radii at delivery,
    because Mine's box resized. Observing the group only would not see this case: the group's size does not change.
- **Font load.** The segments use `Schibsted Grotesk, monospace`. The font response is held, and the box is set to
  260 px, where the monospace fallback wraps Done to row 2 (`1001 0000 0110 1111`). Then the font is released.
  - Once `document.fonts` is `loaded`, the segments shrink and the group becomes one row (260 × 44 px).
  - The rounding at the next `afterResizeDelivery` is `1001 0000 0000 0110`.
  - This font load changed the group's block size. A font load that moves the break at the same group size is the
    text case above, seen through the segments' own observations.

## (3) Resize-loop warning

- **Ten resizes.** The box alternates between 298 px and 215 px, ten times, each set in its own task and read at its
  delivery. Each read gives the rounding of its width.
- **A drag.** Thirty sizes are set from 298 px down to 175 px, with a frame awaited only after every third set. The
  final rounding is that of the last width.
- In both runs there was no console message, no `error` event and no `ResizeObserver loop completed with undelivered
  notifications`.
- The states change only border radii, which do not affect layout. So a regroup cannot move the break, and the
  delivery takes one round.

## Result

The stop condition of T060 does not hold:
- the joined rounding is settled when `afterResizeDelivery` resolves (and after two animation frames);
- a re-wrap without a group size change is seen through the segments' observations and the child-list batch;
- no resize-loop warning appears.

The phase continues with the scaffold (T061).
