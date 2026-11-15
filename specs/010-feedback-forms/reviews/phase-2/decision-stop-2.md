# Phase 2 stop 2: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-15
question: stop-2.md (a change right after a first load on the fixture pages: the region's empty state, begun before the load, is kept 340-379 ms against the pre-load `D` of 350 ms)

**Decision: option (a), the wait counts from the empty state's start.** A wait ends no earlier than `W` (now) after
the last trigger *and* no earlier than `W` of the load state in which the region's current empty state began, counted
from when it began. For a trigger right after a first load on Chromium, the copy is written about 650-690 ms after the
trigger; elsewhere nothing changes.

Order of work:
1. The planner amends the design records: research.md R-02 (step 2 and "announcements reach the tree `W` after the
   trigger"), data-model.md *Announce* and the announcer-state row, and contracts/testing.md's statements about `W`.
   The planner also handles R1-03 of round-1.md (data-model.md rows and *Alert path* text describing removed
   behaviour; research.md "the clip pattern").
2. The implementer then works test-first: the restored red-form cells on the fixture pages as the red test, a
   fake-clock rule test with two `D` values, a plant (a wait that ignores the empty state's start), and
   `pastFirstLoad` removed from both harnesses.

Options not taken: (b) the pre-load `D` plus a margin; (c) keep the design and record the window; (d) change the oracle.
