# Phase 2 stop 1: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-14
question: stop-1.md (in-process `drive.after` overshoot of 107-127 ms under the full suite, above `2W/3` = 66.7 ms at `W` = 100 ms)

**Decision: option (b), serial timing files.** The `elements` project's in-process timing files (the notice suites and
the plants file, and any later timing file of this mission) run one at a time: `fileParallelism: false` for them, or a
separate project for them in the root `vitest.config.ts`. T002's timing constants (`D` = 50 ms, `W` = 100 ms) and the
scenarios' gap bounds stay unchanged. After the change, re-measure the overshoot under the full `gate:unit-tests` run, as
T002 did, and record it. If it is still at `2W/3` or more, stop again.

Options not taken: (a) raising the in-process `D` to 100 ms; both (a) and (b).
