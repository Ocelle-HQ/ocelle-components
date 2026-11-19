# Phase 3, review round 1: fixes

Red commit ff917fb (`test(012-button-action-row): phase 3 review round 1 red`), tests only, recorded as `fix-1` by
`red.sh 3 fix-1` (`"red": true`, `"recorded": true`, exit 1). `red-fix-1.log`: 2 of 3501 tests failed, both
`readme.test.ts` "README states" fragments for the modifier clicks, failing because the README still had the old
sentence; every other test passed.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the test was weakened, so it was strengthened (the code was right). Both US2-13 bodies use content `Close` with `aria-label="Close dialog"` (the morph's server markup too), which keeps label-in-name and axe's `label-content-name-mismatch` clean (`axe: []` passes) while the expected name `Close dialog` can only come from the moved label. Every name and label-mirror value in both bodies expects `Close dialog`. Under the reviewer's plant (the `aria-label` read-back skipped) both bodies now fail, in process and on the fixture build (plants.md § Review round 1 fixes). | ff917fb (strengthened; passes on the code, fails under the plant) | packages/elements/test/scenarios/link.ts US2-13 copies and morph; reviews/phase-3/plants.md |
| R1-02 | fixed: the two `readme.test.ts` fragments were changed first to the amended FR-002 and FR-023 wording (red in ff917fb), then both README passages reworded: the element prevents nothing, the browser's own modifier handling applies, on Chromium on Linux Ctrl, Shift and Alt give a new tab, a new window or a download and Meta navigates the current tab. Docs only, no code change. | ff917fb (2 `readme.test.ts` failures) | packages/elements/test/node/readme.test.ts:166, :189; packages/elements/README.md § Activation, convention 2 |
| R1-03 | deferred: a research.md R-12 table row is a planning artifact, left to the planner (note). | none (docs) | — |
| R1-04 | fixed: the environment note names `chromium-1248` (Chromium 156, the build Playwright 1.64.1 expects). | none (docs) | specs/012-button-action-row/tasks.md:44 |
| R1-05 | no change: the review asks for none this phase; this round's test change has its own red commit. | — | — |
| R1-06 | fixed: US2-12 gains a link-mode host `lp` (`href="#here"`, `aria-pressed="true"`) whose `:state(pressed)` follows the moved value (set, off with `"false"`, set again, cleared with `""`) while its inner control stays an `<a>` without `aria-pressed`. The code was right, so the test passes on it; it fails under a plant that limits `pressed` to button mode (plants.md). | ff917fb (passes on the code, fails under the plant) | packages/elements/test/scenarios/link.ts US2-12 |
| R1-07 | no change: accepted by the review. | — | — |
