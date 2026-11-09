# Squad round 1: fixes 2

The one unresolved row of `verify-1.md`. Plants re-probed in Chrome for Testing 153.0.8010.12 through the
repository's Playwright at 320 px (`img`, `svg`, `canvas`, `video` at `width="2000" height="1000"`, the `img` a 2:1
image): `revert` and `unset` leave all four at 320 x 160; `revert-layer` gives 320 x 1000 for `img`, `svg` and
`video` and 320 x 160 for `canvas`; `:where(canvas) { aspect-ratio: 1 / 1 }` gives `canvas` 320 x 320.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-009 | fixed | research R-10 (plant `:where(img, video, svg) { block-size: revert-layer }`; `canvas` plant `:where(canvas) { aspect-ratio: 1 / 1 }` with the recorded reason that its attributes set its natural size, not a presentational hint, so no undoing of `block-size: auto` bites; why `revert` does not bite); data-model § Test fixtures (`page.html` media at 2000 x 1000, `img` source a local 2:1 file); spec SC-002 (media aspect ratio listed among the guards with a plan-named plant) |
