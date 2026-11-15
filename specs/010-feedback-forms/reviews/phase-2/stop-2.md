# Phase 2 stop 2: a change right after the first load on the fixture pages

Review round 1, finding R1-01 (round-1.md): restore the cells that change a first-loaded notice right after the load,
and keep at least one such cell per harness, announced once. In process this is done (round-1-fixes.md). On the
fixture pages no such cell passes reliably with the element as designed. Making it pass would change the
announcement timing of research.md R-02 and data-model.md *Announce*, so **the fixture part stops here for the
operator** (or the planner). Nothing was changed to work around it: the fixture pages keep the wait of `pastFirstLoad`
(the pre-load `W`, 700 ms) that `0bdb997` added. The window is not narrowed any further, and no decision is taken here.

## What was measured (2026-11-15, this container, Chromium 153 build 1243, the browser build on fixtures/first-load.html)

The method: the red form of the cells in a working copy that was not committed, with `pastFirstLoad` a no-op on the
fixture pages too. A probe in `expectAnnouncements` printed each region's states, with each state's start relative to
the first snapshot taken with `document.readyState === "complete"` and how long the state was kept. The working copy
was restored afterwards. Command: `vitest run --project elements-browser test/browser/notice.test.ts -t <cells>`.

Run 0 (the red-form cells that start from a first load, a wider selection, no probe): 7 of 10 failed: US1-11 text, US1-11 heading,
US1-13 one task, US1-13 10 ms after a write, US1-13 hold, Edge case two notices, SC-002 alert info. Each failure is
`settled: []` against one expected announcement, with `rendered` as expected. That is, the copy was written and
rendered, but the empty state before it was not kept for `D`.

Runs 1 to 3, with the probe. The table shows the region's first empty state: when it began relative to the load,
and how long it was kept until the copy was written (the capture's `D` for it is 350 ms, because it began before
the load).

| Cell | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| US1-11 text | from -15.0 ms, kept **345.1 ms** (fail) | from -13.9, kept 353.0 | from -17.7, kept **348.6** (fail) |
| US1-13 one task | from -18.4, kept 355.9 | from -14.1, kept **339.9** (fail) | from -11.7, kept **349.2** (fail) |
| SC-002 none info, text cell | from -21.0, kept 355.9 | from -18.0, kept 367.4 | from -14.8, kept 363.2 |
| SC-002 alert info, text cell | from -18.6, kept 359.3 | from -21.9, kept 361.7 | from -17.6, kept 359.4 |
| SC-002 status info, text cell | from -18.6, kept 370.0 | from -17.0, kept 379.2 | from -21.3, kept 365.4 |

Over 15 readings the empty state was kept **339.9 to 379.2 ms**, against the 350 ms the "settled" rule needs. The
copies were written 325.8 to 362.2 ms after the load. The region is rendered empty 11.7 to 21.9 ms before the load
ends (while `readyState` is not yet `"complete"`). `firstLoad` returns some tens of ms after the load. The trigger
then writes `W` = 300 ms later. So whether a cell passes depends on a margin of a few ms either side of 350. No
fixture cell that changes a first-loaded notice in the first task after the load passes reliably, the SC-002
none-row cells included (they passed in these runs with margins of 5.9 to 17.4 ms).

In process both load states share the test `D` (50 ms; `W` 100 ms). A write `W` after the trigger always comes after the empty state
has been kept for its `D`, so the red-form cells pass there (79/79 in the review, and in this fix's runs).

## Why this is a design question

research.md R-02 step 2 and data-model.md *Announce* define the wait as `W` = `2 × D`, with `D` taken for the
document's current load state, which is 300 ms once the load has ended. research.md R-02 also says that
"announcements reach the tree `W` after the trigger". For the cells to pass under "settled", a write right after the
load would have to come after the empty state had been kept for the pre-load `D` (350 ms from a point before the
load). That means a later write than R-02 allows. Changing it changes R-02's timing, the data-model and the testing
contract's statements about `W`. Under the review's oracle, the failure is evidence that a text change right after a
server-rendered load may not reach assistive technology.

## The question for the operator

Options the implementer sees (none taken):

(a) **The wait counts from the empty state's start, at that state's `W`** (the review's suggestion). A wait ends no
earlier than `W` (now) after the last trigger *and* no earlier than `W` of the load state in which the region's
current empty state began, counted from when it began. For a trigger right after a first load on Chromium, the copy
is written about 700 ms after the region's first render, about 650 to 690 ms after the trigger instead of 300.
Elsewhere nothing changes, because an empty state begun after the load has the after-load `W`. Amends research.md
R-02 (step 2 and the "`W` after the trigger" statement), data-model.md *Announce* and the announcer-state row, and
possibly contracts/testing.md's statements about `W`. It needs a red cell first (the restored red-form cells on the
fixture pages), a plant (for example a wait that ignores the empty state's start), and `pastFirstLoad` removed from
both harnesses. The in-process cells cannot tell (a) from the current rule, because both load states share `D`
there. A rule test on a fake clock with two `D` values would need to cover it.

(b) **A shorter floor: the empty state kept for the pre-load `D` plus a margin** (for example one frame), rather than
the pre-load `W`. This is a smaller delay, but the margin is a new figure that nothing measures. It amends the same
records as (a).

(c) **Keep the element as designed and accept the window on the fixture pages.** The capture's "settled" rule is the
conservative reading of Chromium's delay, because it takes the delay for the load state in which a state began. Under
this option the fixture pages keep `pastFirstLoad`'s wait (the state after this fix), and the README records that a
change in about the first `W` (loading) after a server-rendered load is not shown to reach assistive technology.
This narrows what the fixture harness shows, which is why it needs this decision.

(d) **Change the oracle** (research.md R-01: for a state that spans the load, take `D` of the load state at its end,
or the smaller of the two). This makes the cells pass without an element change. It weakens the project's own
measure, so the implementer does not recommend it.

## State left by this stop

- In process: the red form is restored (`pastFirstLoad` waits nothing where the capture's pre-load `D` is at most
  the after-load `W`). US1-11 text and heading, US1-13 one task, 100 ms apart, 10 ms after a write and hold, the two
  notices Edge case and the 15 SC-002 cells trigger in the first task after the first load and are announced once. The
  review's plant (`ocelle-plant-deaf-after-first-load`) bites on three of them.
- On the fixture pages: unchanged from `0bdb997`. The bodies wait the pre-load `W` after a first load, and no cell
  triggers in the first task after the load. This is the open part of R1-01.
