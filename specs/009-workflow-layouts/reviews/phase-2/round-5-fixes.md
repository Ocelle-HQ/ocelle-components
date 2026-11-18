# Phase 2, round 5 (operator round): fixes

Red commit `54af461` (`test(009-workflow-layouts): phase 2 review round 5 red`), test files only, recorded by
`red.sh 2 fix-4` as `fix-4` in `red-commits` (`"tests_only": true, "red": true, "recorded": true`, exit code 1). The red
run (`red-fix-4.log`) has 4 of 7018 tests failing, each on an assertion and each on `first` alone: the four T083 cases
(middle and end stories, light and dark), `expected { first: false, grewBy200: true, …(1) } to deeply equal
{ first: true, grewBy200: true, …(1) }`. The red is deterministic, not a hand-applied reproduction: run locally three
times before the commit, the four cases failed on `first` every time.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O5-01 | fixed, test-only. **Race made deterministic (T083).** `changeLayoutAtNextRead(page)` replaces `page.evaluate` for one call: that call runs `changeLayoutLate` and then the read in the same browser task. `changeLayoutLate` appends T067's three sentence-length chips to the story's scroller and records how far the scroll range grew. No rendering step runs inside a task, so the story's `ResizeObserver` cannot write the position again between the change and the read. This is the CI run 44087406429 race (a layout change, such as a late font, just before the first read), placed so that it happens every time. The change lands as the read starts, after `open()` returned. A read that does not wait sees the old position against the new range (`first: false`). A read that waits for `fonts.ready` and two frames sees the position the observer wrote. The case also asserts that the range grew by at least 200 px (`grewBy200`), so the change cannot be a no-op, and that no request left the origin. A first attempt froze the page's rendering through CDP (`Page.setWebLifecycleState` frozen, and `Emulation.setVirtualTimePolicy` pause), then made the change and the read in two evaluates. That was not deterministic: about 2 or 3 of 20 reads already saw the new position, so it was dropped. **Fix (T084).** `scrollFigures`, which gives T067 both its first read and its read after the strip grows, and `observeScrollers` (T020's position check, also T067's `styled` read) now `await document.fonts.ready` and two `requestAnimationFrame`s inside their evaluate before they read, as `openHovered` does. No assertion, tolerance (1 px) or expected figure changed. T067's explicit two-frame wait before the grown read stays. The story (`storybook/stories/scroller.stories.ts`) is unchanged. | `storybook/test/integration/elements-stories.test.ts`, "the mid-scroll ocelle-scroller stories' first position is read after a late layout change settles (009 R-15, O5-01, T083)", 4 cases | `storybook/test/integration/elements-stories.test.ts` (`scrollFigures`, `observeScrollers`) |

## No mutation or plant run

The round changes no source file: only `storybook/test/integration/elements-stories.test.ts` changed, plus this
phase's records. With no production code changed, there is nothing new to mutate or plant, so `gate:mutation` and
`gate:plants` were not run. `plants.md` is unchanged, as the round's instructions say (the fix skill's step 5 would run
`plants_command` again; it was skipped for this reason).

## Stability

On the green tree, the whole `storybook/test/integration/elements-stories.test.ts` (project `storybook-integration`,
each run building the Storybook afresh) was run 6 times in a row: 412 of 412 passed each time. That covers T020's
twelve scroller cases, T067's four and T083's four.

## Checks

Run one at a time on the green working tree, `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:test-lint` | exit 0: 304 files checked, no finding |
| `gate:lint` | exit 0: 419 files checked, no finding |
| `gate:typecheck` | exit 0: no type error |
| `gate:unit-tests` | exit 0: 7018 tests passed in 218 files |
| `gate:signoff -- --range origin/main..HEAD` | exit 0: 92 commits checked, no finding (run before the fix commit; it is run again on the fix commit, see the report) |

## Not done here

- T084's acceptance needs a CI run of the branch, in which job Unit tests passes for both stories in both themes. That
  needs a push, which this step does not do.
