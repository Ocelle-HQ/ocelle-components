# Operator decisions, phase 2

Decided by: human:jeroennouwsdev, 2026-11-04.

## Round 3 O3-01 (T069): red evidence for the EISDIR test fix

Decision: **the CI runs are the red evidence.** The sandbox runs Node 22, where the current test passes; the failure
shows only on the pinned Node 26.13.0. There is no local red commit and no `red.sh 2 fix-3`. The fix note cites the
failing "Unit tests" jobs of runs 41845918777 and 41854105381 (1 of 1794 tests, `gates/test/token-only.test.ts:295`)
as red, and the next CI run on Node 26 must show the test passing. The phase 2 reviewer judges it.
