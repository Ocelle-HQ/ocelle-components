# Phase 5 operator decisions

## Q-P5-1: the corner clicks of contracts/checks.md § US4-7

Question (implementer, phase 5): § US4-7 asks that clicks 1 px inside each corner of the 24 × 24 px clickable area
reach the control. Chromium hit-tests a rounded box by its rounded shape, so on the fully rounded interactive pill the
corner clicks land on the host (stopped by 012's guard) or the page; clicks 1 px inside each edge's midpoint reach it.

Options: (a) keep the pill radius, read "at least 24 × 24" as the control's box being at least `--ocelle-target-small`
in each axis, proven by the edge-midpoint clicks, and drop the corner clause from checks.md, no source change;
(b) keep the radius and forward clicks inside the border box but outside the rounded shape to the control;
(c) a smaller corner radius on the interactive pill.

Decision: **(a).** The pill radius stays; the target is the control's box, at least `--ocelle-target-small` in each
axis, proven by the edge-midpoint clicks. The corner clause is dropped from contracts/checks.md § US4-7. No source
change; T046 closes on that reading.
