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

## Round 1 notes R1-02, R1-03, R1-04

Question (review round 1): R1-02, this phase's `gate:plants --affected` selects 116 of 317 plants (not every plant), so
operator-plants.md's `--list` route does not apply, yet only `--list` was run; R1-03, the `Stryker disable` at
`ocelle-pill-tag.ts:498` also suppresses the killed `false` mutant; R1-04, the items deferred to phase 6 are only in
notes.md.

Decisions:

- **R1-02: run the 116 in fix-1.** `gate:plants -- --affected <phase-5 base>` is run (docker, in the background with a
  long timeout) and its result recorded in plants.md. operator-plants.md stands as written: `--list` only when every
  plant is selected through unmapped paths; a narrower selection is run.
- **R1-03: narrow the disable** so only the equivalent `true` mutant is suppressed.
- **R1-04: carry the deferred items in tasks.md** (T056, T059): the tooltip half of § US4-10 and its plant "the
  refocus in `updated()` (not queued)", the `min-inline-size: 0` chain and the disabled text's `overflow-wrap:
  anywhere`.

## R1-03 revisited (fix-1)

Question (fix-1 implementer): Stryker 10.1.1 disables by mutator name and line only, so the equivalent `true` and the
killed `false` `ConditionalExpression` mutants of the one `if` at `ocelle-pill-tag.ts:498` cannot be told apart by a
disable comment. Options: (a) keep the disable and extend its comment; (b) drop the condition, `adoptMirrors()` at
upgrade in every mode; (c) restructure the branch for the tool.

Decision: **(a).** The disable stays; its comment is extended to say it also covers the killed `false`, which stays
covered by US4-12 and by the line's `EqualityOperator` mutant (not disabled). No source change beyond the comment.
