# Phase 2 review round 1: fixes

Review: round-1.md (changes_requested, head `fdc0eff`). Fixes made on `e5aa088`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed in process; **fixture part stopped for the operator (stop-2.md)**, open | none: the finding is about weakened tests, so the restored cells and the new plant rows are in the fix commit (skill step 3). Run against the HEAD source, the restored cells pass, as the review found. The new plant rows fail against HEAD's scenario bodies (the plant does not bite, 3/3 rows red) and pass with the restored bodies | packages/elements/test/scenarios/notice.ts (`pastFirstLoad`, the US1-13 hold cell); packages/elements/test/plants.test.ts; packages/elements/test/fixtures/notice-plants.ts; reviews/phase-2/stop-2.md |
| R1-02 | fixed | none: not behavioural (an equivalent mutant; behaviour unchanged) | packages/elements/src/ocelle-notice.ts:29; reviews/phase-2/mutation.md (shard 9 corrected, § Review round 1) |
| R1-03 | handed to the planner: design-artifact scope (data-model.md rows 52 and 55, *Alert path*; research.md R-02's clip pattern), not resolved here | none | none |
| R1-04 | deferred: a note, outside this step's scope (the reason of the `:343` record could name the child part) | none | none |
| R1-05 | deferred: a note. This round shows it again: shard 9's kill of `:29` was a timing kill (mutation.md) | none | none |
| R1-06 | deferred: a note on the tdd-check script | none | none |
| R1-07 | deferred: a note, no change asked | none | none |
| R1-08 | deferred: a note. It did not recur in this round's `gate:unit-tests` run | none | none |

## R1-01

**In process: fixed.** `pastFirstLoad` now waits nothing where the capture's pre-load `D` is at most the after-load
`W`, as it is in process, where both load states share the test `D`. That is the red form of `62378c5` for these
bodies: `loaded()`, the US1-13 hold cell and the SC-002 matrix all trigger in the first task after the first load. The
hold cell's `atLeast` is `2 W + H` again in process, which is the value `pastFirstLoad` returns (0) plus `2 W + H`.
The other stricter parts of `0bdb997` are kept: the `px()` reading and US1-15 status text change's
`settleAnnouncement`. In process, every cell the review named triggers right after the load and is announced once:
US1-11 text and heading, US1-13 one task, 100 ms apart, 10 ms after a write and hold, the two-notices Edge case, and
the 15 SC-002 cells.

**The review's plant** is `ocelle-plant-deaf-after-first-load`. Its `onContent()` ignores light-DOM changes for 100 ms
after a first load (the time is taken when `isFirstLoad()` answers true at the connection). Three rows hold it: US1-11
text, US1-13 one task and SC-002 none info. With the restored bodies it bites in each, and the row passes. With
HEAD's bodies (the pre-load `W` waited first), each of the three rows fails, because the plant does not bite. This was
checked in a working copy that was not committed.

**On the fixture pages: stopped.** The red-form cells were run on the fixture pages against the HEAD element (a
working copy that was not committed): 7 of 10 selected cells failed. Over three runs with a probe, the region's first
empty state was kept 339.9 to 379.2 ms before the write, against the 350 ms that "settled" needs for a state begun
before the load. So no such cell passes reliably, the SC-002 none rows included. To make the element meet the cells,
it would have to write later than `W` after the trigger. That changes research.md R-02's timing and data-model.md
*Announce*, a design change. Following the instruction, it is recorded in stop-2.md with the measurement and four
options, and it was not worked around. The fixture pages keep `0bdb997`'s wait until the operator decides, so the
"one cell per harness" part of R1-01 is still open for the fixture harness.

## R1-02

`liveRoleOf()` now reads `role?.trim().split(/\s/)[0]?.toLowerCase()`. The result is the same, and there is no string
literal, so there is no equivalent record. The shard 9 re-run gave exit 0: "25 mutants on the changed lines of 2 files,
none survived; 0 timeouts, 11 compile errors" (298.0 s). The record is in mutation.md § Review round 1. The shard 9 row of the final
sweep is corrected there: its "none survived" included a timing kill of the equivalent `:29` mutant.

## Checks run (after the fixes, this container, Chromium 153 build 1243, one heavy job at a time)

| Check | Result |
|---|---|
| `vitest run --project elements notice.test.ts plants.test.ts` | 130 passed (the 3 new plant rows among them) |
| `gate:unit-tests` | exit 0, "3524 tests passed in 153 files" (3521 and the 3 new rows), 8:30 wall-clock |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "302 files checked, no finding" |
| `gate:test-lint` | exit 0, "210 files checked, no finding" |
| `gate:mutation -- --base 6c9400c --files packages/elements/src/live.ts:241-251,packages/elements/src/ocelle-notice.ts:1-30` (shard 9, the only changed source line) | exit 0, 25 mutants, none survived, 11 compile errors, 298.0 s |

`gate:plants` was not run: no plant tree under `gates/plants/` changed. The new plant is a test fixture of the
elements project (`test/fixtures/notice-plants.ts`), and it runs in `gate:unit-tests`.
