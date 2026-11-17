# Phase 4, round 5 fixes (operator round from the landing review, O5-01)

Round 5 (`round-5.md`) is the operator round recorded from the landing review of PR #46 (`reviews/landing/round-1.md`
L1-01). Its one blocking finding is fixed, red first: the red commit `243bd28` (test files only) was proven by
`red.sh 4 fix-4` (`"recorded": true`, `red-fix-4.log`: 13 of 3796 tests failed, exactly the new ones: the five O5-01
cases in the in-process and the browser harness, and the three README fragments).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O5-01 | fixed | `packages/elements/test/scenarios/list-detail.ts`: "US3-12, not rendered at first (O5-01)" (a closed `<dialog>` opened with `showModal()`, a `display: none` inline-block wrapper shown, a `hidden` flex item shown, a `hidden` host shown, each against its twin rendered from the start on the same page) and "US3-12, hidden then remeasured (O5-01)", run by `test/list-detail.test.ts` and `test/browser/list-detail.test.ts`; `packages/elements/test/node/readme.test.ts`: three fragments (T079) | `packages/elements/src/list-detail-measure.ts` (`measure()` on a grid with no box writes nothing and stays pending; `resume()`), `packages/elements/src/ocelle-list-detail.ts` (the probe's `ResizeObserver` ignores a not-rendered element and, once it is rendered, requests the pending pass for the next frame; `#remeasured` takes no size from a not-rendered probe; `#rendered()`), `packages/elements/README.md` (§ `ocelle-list-detail` `remeasure()`, the container-tier convention), `packages/elements/custom-elements.json` and its 8 manifest plant copies (the `remeasure()` description) |

## What the red tests saw on the code before the fix

- The four first-render cases: the element at 0 px in one column (`data-tier` `one`), both figures `0px`, its twin at
  1073 px in three columns with `1073px` and `480px`, and the window's "ResizeObserver loop" message.
- The hidden case: while hidden, the figures written as `0px` (the pass read the missing box), and the two-column twin
  `y` showing `three` after `remeasure()` (its measured size `NaN` from the probe's `auto`); shown again, still 0 px in
  one column with the 35rem list block's 560 px minimum never measured.

## The fix (T080)

- `ListDetailMeasure.measure()` returns before any write when the grid has no client rects, and marks the pass
  pending; a pass that runs clears it. `resume()` requests the pending pass for the next animation frame through
  `schedule()`, so it is coalesced and never runs inside a `ResizeObserver` delivery.
- The element's `ResizeObserver` callback returns at once while the probe has no box (the observation of a hidden
  element reports 0 px, which chose one column); when it is rendered it calls `resume()` and then takes the size as
  before.
- `#remeasured` (the fresh measurement after each scheduled pass, which `remeasure()` relies on) returns while the probe
  is not rendered, so the measured size never becomes `NaN` and the tier stays.

Becoming rendered requests a pass only when one is pending (a pass was skipped while the element had no box, which
the first render of a hidden element always leaves): a plain hide and show, or a resize, runs none, so the cost and
the once-per-frame count of R-13 are unchanged. That is how this note reads data-model.md § list-detail "Not rendered"
("set `pending`, request a frame if none is"); every case of T078 is covered, since an element first rendered or
changed while it has no box always has a skipped pass.

## Documentation (T081)

The README states both T079 fragments in the container-tier convention (after the triggers bullet: becoming rendered
is a re-measure trigger, with the dialog named as a shrink-to-fit host whether it starts open or closed; a pass or
`remeasure()` while not rendered writes nothing) and the one in § `ocelle-list-detail` (the `remeasure()` item). The
CHANGELOG entry of the container-tier convention names "the re-measure triggers" without listing them, so it is
unchanged. The `remeasure()` JSDoc gained the not-rendered sentence, so `custom-elements.json` was regenerated and the
same description changed in the 8 copies under `gates/plants/manifest/*/tree/` (`gate:manifest` and the manifest
plants pass).

## Plants and guards (T082)

Recorded in `plants.md` § Plants of the landing-pass fix: L28 to L30 are T078's three named plants, L31 the
observer's guard undone; each bites. Two guards were added to `list-detail-pass.test.ts` after green, for mutants that
survived the first mutation runs (the pending pass requested at every observation or never cleared; the stop on
disconnection, which a skipped pass on a detached grid no longer showed), and one equivalent record (the initial
`#pending`).

## Checks

Run one at a time on the fix's final working tree (on top of `243bd28`):

- `pnpm test`: 3798 tests passed in 164 files (the browser harness's list-detail file alone: 58 passed).
- `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`: no finding (309 and 211 files).
- `pnpm run gate:style-lint`: 20 files, no finding; `gate:csp`: 18 files, no finding; `gate:prefix`: 267 files, no
  finding; `gate:manifest`: 6 elements, no finding; `gate:pins`: no finding.
- `pnpm run gate:mutation -- --base HEAD` (the red commit `243bd28`): 24 mutants on the changed lines of 2 files, none
  survived; 5 compile errors; 1 equivalent record.
- `pnpm run gate:mutation -- --base 2caad68` (the phase 4 base): 332 mutants on the changed lines of 5 files, none
  survived; 2 timeouts, 109 compile errors, 1 zero-mutant entry (`src/index.ts`); 11 equivalent records. The first runs
  of both left the survivors that the two guards above kill.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants`: 306 plants of 17 gates and the registry judged, every plant as
  expected (the full plant set; `--affected` is not on this branch).
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual`: 88 captures match their baselines; `pnpm run gate:axe`: 88
  story-theme runs, 0 serious or critical.
