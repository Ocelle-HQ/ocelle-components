# Operator decisions on phase 1 spike 2 (reviews/phase-1/spike-2.md)

- **Date:** 2026-11-18
- **Decided by:** human:jeroennouwsdev

- **Q-1, the pinned-box measure (A1 (c)):** (a) the `<thead>`'s current laid-out block-end edge: the fade never
  covers the header; under a tall caption it may be absent at rest until the caption scrolls away.
- **Q-2, the header pins 5 px low:** (a) a negative block-start inset on `<thead>` in block 1, so no band shows once
  scrolled and the header keeps the 5 px ring room at rest.
- **Q-3, RTL clips the table's start with `scrollbar-gutter: stable`:** (c) set the block-axis state (`data-axis="both"`,
  with the gutter) only while the box overflows in the block axis. Not measured in the spike: the implementer measures
  it before the red commit and stops if it fails.
- **Q-4, axe `color-contrast` incomplete under `.region-edge.block-end`:** (a) `inline-size: 0` on the edge outside
  forced colours (measured clean).
- **Q-S2-1, a focusable element above the pinned `<thead>` (for example a link in the caption;
  `reviews/phase-1/spike-2-fixes.md`):** (a) for an element before the pinned box, the block clearance's upper bound
  is the box's client block-start edge, so the box scrolls back to show it.

## T082 addendum questions (spike-2.md § addendum), 2026-11-18, human:jeroennouwsdev

- **Q-A1, `scrollbar-gutter: stable` loses 15 px of inline scroll range:** (a) drop the gutter; the box has
  `overflow-y: auto` only while it overflows in the block axis, and the scrollbar's room is read as
  `offsetWidth − clientWidth` (measured clean in both scrollbar modes and directions).
- **Q-A2, the caption-link "past the caption" body passes at red:** (a) move US1-26's past-caption half and T079's
  element-before body to the partly scrolled position (link 2 to 12 px above the edge), and keep the fully-past
  position as a paired assertion the platform alone meets.
- **Q-A3, the scrollbar-room plant cannot bite under hidden scrollbars (spike-2-fixes.md):** (a) add a
  classic-scrollbar half for the sticky caption body, the RTL lift and the mask figure, run in a suite launched
  without `--hide-scrollbars`, like 009's `scrollbar.test.ts`.
