# Phase 1 review, round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none new: the existing `gates/test/integration/visual.test.ts` tests (lines 115, 126 and 239 of `check-head.log`) already fail for exactly this defect, as the review states; they pass now | `storybook/baselines/tokens--type.{light,dark}.png`, `tokens--space.{light,dark}.png`, `tokens--shell.{light,dark}.png` |
| R1-02 | note, no change | n/a | n/a |
| R1-03 | note, no change | n/a | n/a |

## R1-01

The six baselines were regenerated with `pnpm run visual:update` in the pinned container under docker (R-15), which
reported `baselines: wrote 6 files (0 added, 6 changed, 0 removed)`: exactly the six named in the finding, no other
baseline touched. The reason: 009's six new tokens (`packages/tokens/src/source.ts`) add rows to the Type, Space and
Shell token stories (22, 12 and 22 rows).

Checks after the change: `pnpm run gate:visual` reports `42 captures match their baselines (docker only: no
cross-engine comparison)`; `pnpm test` reports `3127 tests passed in 142 files`.

Still open outside this step: the CI run of the branch that confirms the baselines (T028, #10 FR-005) needs a push,
which the implementer does not do.

**For the PR description (constitution V):** the baselines `tokens--type`, `tokens--space` and `tokens--shell` in
light and dark change because 009 adds six tokens, which add rows to those token stories.
