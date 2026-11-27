# Phase 4 operator decisions

## R1-01: a wrapped pill keeps the pill radius

Question (round 1, review note R1-01): when a pill's text wraps to more than one line it keeps `--ocelle-radius-pill`, so
in the `LongTextWraps` baselines some glyphs at the corners cross the badge's rounded border or the pill's filled
ground (nothing is clipped; the test measures the rectangular box). A smaller radius would break SPEC-1-04, more padding
US3-4.

Options: accept as is; amend the spec for a smaller radius on wrap; defer to polish.

Decision: **accept as is.** A wrapped pill keeps the pill radius and the corner overlap is accepted; no change.
