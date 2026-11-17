---
phase: 2
round: 4
verdict: approved
base: 247991d7f2fdd7163d768f771279d17014d9c0b3
head: 7d1a0e5f361b448b58402d67dfc61a1c8e6b89b7
tdd_check: pass
---

# Phase 2 review, round 4

Scope: the fixes for the operator round 3 findings O3-01 to O3-05 (tasks T067 to T077). Red commit `fc3a136` (`fix-3`
in `red-commits`), green commit `f5236a3`, TDD check `7d1a0e5`. Fix range `454528a..7d1a0e5`. I checked each finding
against the code, the tests and runs of my own. I did not rely on the fix note. I did not repeat the full search of the
phase outside this round's scope.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | packages/elements/test/build/build-output.test.ts:34, :36 | Only the module-build part of T071's case can fail. I restored `list-detail-measure.ts` from `454528a` and ran the case: `measure.passCount` and `measure.counter` went `true`, but `browser.passCount` and `root.*` stayed `false`. The browser build is minified and tree-shaken, and `dist/index.js` never exported the counter, so those two sub-assertions were already false before the fix. Both builds come from the same source, so the module-build assertion is enough to show the counter is gone. The browser part adds no guard. | None for this round. If the case is touched again, do not treat the browser sub-assertion as a guard. |
| R4-02 | note | packages/elements/src/list-detail-measure.ts:11-14; build-output.test.ts:33 | `tsc` keeps comments (no `removeComments`), so `/\bpasses\b/` scans the prose that ships in `dist/list-detail-measure.js`. The header comment was reworded so that it no longer says "passes". The new wording is true, and the test was not loosened: the rewording made the code fit a stricter-than-needed regex. The cost is that the test now depends on how the comment is worded. | None required. A regex shaped like a binding (`let\|var passes`) would separate the two. |
| R4-03 | note | specs/009-workflow-layouts/tasks.md:406; vitest.config.ts:103-111 | T071's test is in `test/build/` (project `elements-build`), not in `test/node/`. That is the right place: `elements-build` is the project for tests that run `tsc` and `vite build`, and it sets `fileParallelism: false`, so two builds never write `dist/` at once. The fix note records the move. The task text still says `test/node/`. | None. |
| R4-04 | note | specs/009-workflow-layouts/tasks.md:414-420; constitution § V ("Baselines change only in a pull request whose description says why") | T072 is ticked, but two parts of its acceptance are still open, and the fix note says so: a CI run of the branch where job Unit tests passes for both stories in both themes, and a PR #46 description that explains the four changed scroller baselines. This step cannot push, so I cannot check either. | The orchestrator does both before landing. |
| R4-05 | note | storybook/stories/scroller.stories.ts:42-50 | The story's `hold` observer is never disconnected. If a reader scrolls the story by hand and the range then changes, the observer moves it back to its share. This code exists only in the story and only affects how the capture is set up. It is not a defect in the element. | None. |

## Test quality

**Red evidence.** `red-fix-3.log` and `check-red-fix-3.log` show 9 of 3782 tests failing in `fc3a136`, each on an
`AssertionError`: the four T067 story cases, the T070 README fragment, the three T069 swap cases and the T071 build
case. `tdd-check.json` gives `pass` with an empty `problems` list. Its head is `f5236a3`, and the only later commit,
`7d1a0e5`, adds that file. I reproduced the red runs myself:

- **T067 (O3-01).** I put the `scroller.stories.ts` of `454528a` back and ran the "hold their share" describe. All 4
  cases failed with `"held": false`, and `first: true` and `grewBy200: true` still held. So the case fails for the
  missing behaviour, not because of its setup. With the fix, all 4 pass.
- **T071 (O3-05).** With the `list-detail-measure.ts` of `454528a`, the case fails on `measure.passCount` and
  `measure.counter`. With HEAD it passes (see R4-01).
- **T068 (O3-02).** This case is a plant, not a red test: the code was already right. I applied the mutant
  `this.#observer.observe(box)` to `overflow-region.ts` and ran `elements-browser`
  `test/browser/scrollbar.test.ts`. Result: 1 of 5 failed. `grown` had `tabindex: null, role: null, name: null` with
  `range: 443, bar: true`, where `"0"`, `"region"` and `"Board"` were expected. This matches `plant-fix-3-T068.log`.
  The test kills the mutant. I restored the file and checked it with `cmp`.
- **T069 (O3-03).** I deleted each statement of `#release` one at a time and ran
  `elements test/overflow-host.test.ts`:
  - `unobserve(box)`: the "growing, scrolling or slotting" case fails;
  - `unobserve(this.#track)`: the same case fails;
  - the `scroll` removal: the same case fails;
  - the `slotchange` removal: the same case fails.

  `plants.md` F3-3 records that the guard fails when the frame's `focusout` removal is planted. The red run shows that
  the attribute cases fail when the attributes are not removed. The design of the second case is strong. Box `b` holds
  a contained block whose inner block overflows without changing the size of box `b` or its track. So any event still
  heard from the old box makes the module measure box `b`, which turns its hidden overflow into output, and the case
  sees that.

**Weakened or vacuous tests.** I found none. The test files in `fc3a136..HEAD` changed only by adding the guard ("after
the swap, a focusout in the old frame leaves a tabindex…"), which is a new and stricter case.
`test/list-detail-pass.test.ts` changed only how it reads the count: it now counts `MutationObserver` records of
`data-tier` whose old value is `max`. A pass does exactly one such write (`list-detail-measure.ts:66-70`), and no tier
the element renders is `max`. Every expected count is the same as before. The L17 plant (the frame guard in
`schedule()` removed) still fails 2 cases with 3 passes where 1 is expected and 2 where 1 is expected
(`plant-fix-3-L17.log`). In the R3-02 case, `passCounter([loose, removed])` cannot see the never-connected element,
because it has no shadow root and so no grid. The old global counter could not count a pass there either, because
`measure()` returned before it counted when the grid was missing. That case is no weaker. The weak sub-assertions of
the T071 case are noted under R4-01.

**Mutation.** I ran `pnpm run gate:mutation -- --base 247991d…` and it exited 0: 850 mutants on the changed lines of
10 files, none survived. It also reported 2 timeouts (`ocelle-list-detail.ts:250-251`, as in earlier rounds), 254
compile errors, 1 zero-mutant entry (`src/index.ts`) and 33 records. I read the round's two new or changed records:

- `overflow-region.ts:374` (ObjectLiteral on `{ box: "border-box" }`) no longer claims equivalence. It names the
  elements-browser test that kills the mutant, and I confirmed that test kills it.
- `overflow-region.ts:348` (the early return in `hostUpdated`) is equivalent. Releasing and following the same box
  again removes the attributes and then writes them back in the same task: the host's `setLabel` in `updated()` calls
  `#apply` (scroller line 63, board line 80), and observing the box again also triggers a new first observer delivery.
  No style recalc runs in between.

## Checks run

On HEAD `7d1a0e5`, one at a time, with `OCELLE_VISUAL_ENGINE=docker` and Docker up:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:prefix`, `gate:csp`, `gate:manifest` | exit 0 each |
| `gate:unit-tests` | exit 0, 3783 tests passed in 164 files (this includes the Docker-backed visual integration cases) |
| `gate:mutation -- --base 247991d` | exit 0 (see above) |
| T067 against the story of `454528a` | 4 failed (`held: false`), as expected |
| T071 against the `list-detail-measure.ts` of `454528a` | 1 failed (module build), as expected; passes on HEAD |
| T068 plant (`observe(box)`) | 1 of 5 failed, as expected |
| `#release` statement deletions (4 plants) | each failed the T069 case, as expected |

I did not run `gate:visual`, `gate:axe` or `gate:plants` again. The fix note reports all three at exit 0, and
`gate:unit-tests` above includes the Docker visual integration cases that compare the four new baselines. After the
plants, the working tree is clean (`git status` is empty apart from this file).

**Baselines (O3-01).** I compared the old and new PNGs by eye:

- **Old "at the end" (light):** "Due toda" is cut off under the end fade, so the strip is short of its end. This is
  the defect.
- **New "at the end" (light and dark):** "Due today" shows in full at the end, with no end fade and only the start
  fade.
- **New "in the middle":** the strip moved 9 px compared with the old baseline. The end story moved 18 px, so the
  middle moved half as far. Both fades show.

The new baselines show the true end and middle positions.

## Earlier findings

- **O3-01: resolved.**
  - `scrolled()` (`storybook/stories/scroller.stories.ts:37-52`) keeps a `ResizeObserver` on the box and its track,
    and writes the position for the new range again whenever the range changes. It uses no timer. The header comment
    is updated.
  - The track has to be observed: the appended chips grow the track, not the box.
  - T067 is not vacuous: it was red against the old story, and it asserts the first position, growth of at least
    200 px and the held position.
  - The four baselines are correct (see above).
  - The CI confirmation is still open (R4-04).
- **O3-02: resolved.** The record at `overflow-region.ts:374` is corrected and names the killing test. The plant
  confirms that test kills the mutant.
- **O3-03: resolved.**
  - `#release` (`overflow-region.ts:392-401`) unobserves the old box and its stored track, removes the old box's
    `scroll` and `slotchange` listeners and the old frame's `focusout` listener, and removes `tabindex`, `role` and
    `aria-label`.
  - `hostUpdated` (`:346-353`) calls it for a new box or for none, and then follows the new box. This is what
    contracts/overflow-region.md § Lifecycle says.
  - Each of these steps has a test that fails without it: the deletion plants for the four observer and listener
    steps, the red run for the attributes, and F3-3 for the frame listener.
  - The guard added after green asserts real behaviour, a `tabindex` that the host set on the old frame, and is paired
    with a positive check (`focused: true`).
- **O3-04: resolved.**
  - The README Lifecycle bullet (`packages/elements/README.md:457-461`) and the JSDoc of `hostConnected`,
    `hostUpdated` and `hostDisconnected` (`overflow-region.ts:328-359`) match the contract's § Lifecycle on connect,
    update (letting go of the old box) and disconnect (the observer is disconnected, the three host listeners are
    removed, and the box keeps its attributes).
  - A search for "removes its listeners" or "moves" finds nothing in either file.
- **O3-05: resolved.**
  - `passCount` and `passes` are gone from `src/list-detail-measure.ts`. I grepped the built
    `dist/list-detail-measure.js`, `dist/browser/ocelle-elements.js` and `dist/index.js`: 0 matches.
  - `list-detail-pass.test.ts` still asserts exactly one pass for three tasks before one frame, and one more pass in
    the next frame. Its plant still fails it.
  - The three reported deviations are judged above: the location in R4-03, the browser build that was not red in
    R4-01, and the comment rewording in R4-02. None of them is blocking.
