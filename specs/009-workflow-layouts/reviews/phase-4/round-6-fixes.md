# Phase 4, round 6 fixes

Round 6 (`round-6.md`) has one blocking finding, R6-01, fixed red first by the route that matches T080, data-model.md
§ list-detail "Not rendered", research.md R-13 and FR-025 as written: the code is changed, no document is narrowed. The
red commit `6f66c61` (test files only) was proven by `red.sh 4 fix-5` (`"recorded": true`, `red-fix-5.log`: 3 of 3800
tests failed, exactly the changed ones: the new R6-01 case in the in-process and the browser harness, and guard 1 of
the pass test).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R6-01 | fixed | `packages/elements/test/scenarios/list-detail.ts`: "US3-12, hidden, changed unseen, then shown (R6-01)", run by `test/list-detail.test.ts` and `test/browser/list-detail.test.ts`; `packages/elements/test/list-detail-pass.test.ts`: guard O5-01, `again` 0 becomes 1 | `packages/elements/src/list-detail-measure.ts` (`suspend()` marks the pass pending), `packages/elements/src/ocelle-list-detail.ts` (the probe's `ResizeObserver` calls it on an observation with no box) |
| R6-02 | note, no change | none | `packages/elements/test/scenarios/list-detail.ts` |
| R6-03 | note, no change | none | `packages/elements/test/list-detail-pass.test.ts` |

## What the red tests saw on the code before the fix

- The R6-01 case: an element measured at 1073 px in three columns, its wrapper hidden, then (four frames later, while
  hidden) a class swap that gives the list's light-DOM element the 35rem block (`w35`). The element's
  `MutationObserver` has no `attributes`, so nothing left a pass pending. Shown again with no `remeasure()`, the
  minimum stayed `480px`, not the new content's `560px`; width, layout and tier were already right.
- Guard 1: it now hides and shows in separate frames, so the observer sees the element with no box. One pass is
  expected (`again: 1`). The old code ran none.

## The fix (T080)

`ListDetailMeasure.suspend()` sets `#pending`. The element's `ResizeObserver` calls it from its not-rendered branch,
before returning. So becoming rendered (no box before, a box now) always reaches `resume()` with a pass pending and
requests one for the next frame through `schedule()`. That pass is coalesced with any other trigger and runs once per
frame, never inside the delivery (R-13). A resize of a rendered element still runs none (guard 1's `resized: 0`). The
JSDoc of the public API is unchanged: the `remeasure()` description already says the element measures itself afresh
once it is rendered. So `custom-elements.json` and its 8 plant copies needed no change (`gate:manifest` and the
manifest plants pass).

Guard 2 holds unchanged. `disconnectedCallback` disconnects the observer synchronously, so a removed element gets no
no-box observation. The observation on reinsertion sees the element rendered with nothing pending.

## Notes

- R6-02: optional, no change. US3-12's text for the hidden case asks for no per-frame readings.
- R6-03: no change required. Guard 2 still matches the R3-02 rule.

## Evidence

`plants.md` § Plants of the round 6 fix: L32 undoes the fix (the observer's not-rendered branch without `suspend()`).
It bites: 2 failed of 72 in process (the R6-01 case, minimum `480px`; guard 1, `again` 0).

## Checks

Run one at a time on the fix's working tree, on top of `6f66c61`:

- `pnpm test`: 3800 tests passed in 164 files.
- `gate:typecheck`: no type error. `gate:lint`: 309 files, no finding. `gate:test-lint`: 211 files, no finding.
  `gate:style-lint`: 20 files, no finding. `gate:csp`: 18 files, no finding. `gate:prefix`: 267 files, no finding.
  `gate:manifest`: 6 elements, no finding. `gate:pins`: 5 manifests, no finding.
- `gate:mutation -- --base HEAD` (the red commit `6f66c61`): 7 mutants on the changed lines of 2 files, none survived;
  1 compile error.
- `gate:mutation -- --base 2caad68` (the phase 4 base): 336 mutants on the changed lines of 5 files, none survived;
  2 timeouts, 109 compile errors, 1 zero-mutant entry (`src/index.ts`), 11 equivalent records.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines. `gate:axe`: 88 story-theme runs,
  0 serious or critical.
- `OCELLE_VISUAL_ENGINE=docker gate:plants`: 306 plants of 17 gates and the registry judged, every plant as expected
  (the full plant set; `--affected` is not on this branch). The first run was stopped at the 30-minute background limit
  of the agent shell, not by the gate, and was run again to the end.
