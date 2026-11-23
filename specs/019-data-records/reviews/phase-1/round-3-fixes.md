# Phase 1 round 3 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R3-01 | fixed | The hidden-caption and aria-hidden-caption cases failed in both Chromium harnesses on test-only `c23bbbc1`. | `captionText` in `packages/elements/src/ocelle-data-table.ts` excludes the hidden caption root. |

Both cases check that an overflowing table remains a Tab stop, explicit host naming still takes precedence, and showing the caption restores fallback naming. The scoped browser rerun passed all four assertions.

The local Plants selector against phase base `8d104af23ce177ec4acbbfaba59bf433f9520d6d` completed and selected every plant because the integrated branch changes shared gate source. That selection judged no plants. The original phase record remains intact, and complete Plants and mutation verdicts are pending hosted CI.
