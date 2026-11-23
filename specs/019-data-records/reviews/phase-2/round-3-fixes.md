# Phase 2 round 3 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R3-01 | fixed | Adding and removing a slotted time while detached failed in both Chromium harnesses on test-only `82d2a873`. | `ocelle-timeline-event` reconciles the slotted time when it connects, using the same logic as its mutation observer. |

Both cases check that the rendered time, list item text and marker align after reconnection. The scoped browser rerun passed all four assertions.

The local Plants selector against phase base `5e7f6df60c22a732e4f5a383f4b0c97774261794` completed and selected every plant because the integrated branch changes shared gate source. That selection judged no plants. The original phase record remains intact, and complete Plants and mutation verdicts are pending hosted CI.
