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
