# Phase 2 design change 1: the "alert pending tone" guard removed

## Finding

The phase 2 plant run (T023, `plants.md` in this directory) stopped at a plant that does not bite: "alert pending
tone" (contracts/testing.md § Plants) turned no cell red. The guard it planted, data-model.md's row "`tone` changes |
alert baseline pending is not none | none" (plan squad round 3 verify 1), has no observable effect. A `role="alert"`
host is `assertive` whatever its tone, and the end-of-task step sets the baseline one `MessageChannel` task after the
trigger, before any wait of `W` started in that task can end. So a wait started by the ordinary `tone` row always
ends on text and politeness equal to that baseline, and the *Announce* re-check writes nothing. No plant of the row,
through any seam, can turn a cell red.

## Decision

Operator, 2026-11-14 (human:jeroennouwsdev): "Remove guard and plant".

A `tone` change while the alert baseline is pending takes the ordinary `tone` row. That row's end-of-wait re-check
drops the write, so each event still matches at most one row. The US1-15 cell "alert, tone changed in the same task
after insertion" (count 0, host role `alert`) stays as a plain behaviour check.

## Files

- `data-model.md`: the pending `tone` row is removed, and the ordinary `tone` row no longer carries "alert baseline
  pending is none". *Alert path* now says why the `tone` change needs no pending row and why it still matches at most
  one row.
- `research.md` R-02 § The platform alert event: the pending state no longer names `tone` among the events that
  start no wait. The section now says why the ordinary row's wait is dropped.
- `contracts/testing.md` § Plants: the "alert pending tone" row is removed, along with its name in the Seams table's
  element-class families.
- Unchanged: `tasks.md` (T016 takes the rows of § Plants and names no single plant; T020 does not name the guard),
  `plan.md` decision 10 and `spec.md` (both state only the behaviour, a `tone` set in the same task is read once,
  which still holds), `quickstart.md` and `contracts/elements.md` (behaviour only).

Not changed here (source and tests are outside this role): the plant row in `packages/elements/test/plants.test.ts`
and the `AlertPendingTone` fixture in `packages/elements/test/fixtures/notice-plants.ts` are still in the tree. The
`this.pending !== "none"` early return of `onTone()` in `packages/elements/src/ocelle-notice.ts` also still exists.
The implementer removes or aligns them against this change.
