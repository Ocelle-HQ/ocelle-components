# Phase 2 round 3 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R3-01 | fixed | Adding and removing a slotted time while detached failed in both Chromium harnesses on test-only `82d2a873`. | `ocelle-timeline-event` reconciles the slotted time when it connects, using the same logic as its mutation observer. |

Both cases check that the rendered time, list item text and marker align after reconnection. The [focused replay](landing-fix-3-tdd-check.json) reproduced all four assertion failures at the signed red and against its parent `1a152af7`. The complete selected event-timeline suites passed at `0519f312`. The replay used a disposable worktree with only `fix-3` in the phase registry and its parent as the base. The original phase replay remains in `tdd-check.json`.

The local Plants selector against phase base `5e7f6df60c22a732e4f5a383f4b0c97774261794` completed and selected every plant because the integrated branch changes shared gate source. That selection judged no plants. The original phase record remains intact, and complete Plants and mutation verdicts are pending hosted CI.
