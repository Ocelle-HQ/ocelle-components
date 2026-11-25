# Phase 1 round 3 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R3-01 | fixed | The hidden-caption and aria-hidden-caption cases failed in both Chromium harnesses on test-only `c23bbbc1`. | `captionText` in `packages/elements/src/ocelle-data-table.ts` excludes the hidden caption root. |

Both cases check that an overflowing table remains a Tab stop, explicit host naming still takes precedence, and showing the caption restores fallback naming. The [focused replay](landing-fix-3-tdd-check.json) reproduced all four assertion failures at the signed red and against its parent `7a93f83e`. The complete selected data-table suites passed at `1a152af7`. The replay used a disposable worktree with only `fix-3` in the phase registry and its parent as the base. The original phase replay remains in `tdd-check.json`.

The local Plants selector against phase base `8d104af23ce177ec4acbbfaba59bf433f9520d6d` completed and selected every plant because the integrated branch changes shared gate source. That selection judged no plants. The original phase record remains intact, and complete Plants and mutation verdicts are pending hosted CI.
