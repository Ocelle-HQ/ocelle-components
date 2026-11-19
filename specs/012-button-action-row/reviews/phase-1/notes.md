# Phase 1 notes: Setup, test harness and shard size

## Operator questions for this phase's review (T012)

Recorded here for the review; the implementer decides neither.

1. **Approval of the split count at size 1: 76 stories.** `shardSize` is now 1 (research.md R-13, plan decision 15).
   By 006's measured model (387 + size × 1.377 × (2s + 2) s per `visual` shard at s stories, CI run 43242674392), a
   size-1 shard takes about 550 s at this feature's about 58 stories and 599 s at 76 (602 s at 77), so the split
   count at size 1 is **76 stories** (72 at the record's slowest 1.457 s per story-theme). 006 decision 30 put 25 at
   size 3 to the operator the same way. Recorded in `gates/README.md` and in 006 plan.md's Complexity Tracking row
   "Plant roots hold every repository story" as its sunset, "awaiting the operator's approval".
2. **Opening a triage record for a plant design whose shard time does not grow with the story count**, before the next
   element mission (PLAN-FRESH-3-003 (a)). Size 1 is the last lever: `plantShards` keeps each plant whole, and a
   `visual` plant captures every repository story, so a shard's time still grows with each story. After this feature
   about 18 stories of headroom remain, fewer than the about 37 this feature adds; the next element mission (the
   status mission, or #12's breadcrumbs and top bar) would pass 76 with no setting left. Cost accepted meanwhile: at 58
   stories the 73 `visual` and `axe` shards take about 11.2 Plants runner-hours per CI run, against about 4 at 21
   stories and size 3. An example design named in research.md R-13: `visual` plants that capture only the
   story-themes their changed inputs can affect.

## Where the harness differs from the plan's wording (for the review)

- **`axState(id, inner?)` beside `ax(id)`, not a new `ax(id)`.** contracts/checks.md and R-11 say `ax(id)` returns
  `{ role, name, description, disabled, expanded, pressed, hasPopup, busy, focusable, controls }`. The existing
  `ax(id)` returns the node list `AxNode[]` (`{ role, name }` per node) that mission 005's scenarios assert with
  `toEqual` in about 40 places; adding the state fields to it would change those expectations (a native button
  reports `focusable` on every node). So the states are a new method, `axState(id, inner?)`, returning the one
  `AxState` object of the element (or of its shadow element `inner`, the inner control of a later host), read over
  CDP with `Accessibility.getPartialAXTree`; `ax(id)` is unchanged. It needs a browser command of its own
  (`axState`), beside T009's five.
- **`axe(scope?)` reports every impact, not only serious and critical.** T005 asks for "no `region` result on a
  landmark-less page"; `region` is moderate, as are the other harness-document rules that fire on such a page
  (`landmark-one-main`, `page-has-heading-one`; measured: without 006's selection, axe-core 4.14.0's wcag2a, wcag2aa
  and best-practice rules give exactly these three beside `button-name` on the test page, Chromium 153). A
  serious-and-critical filter would hide them whether or not 006's selection applies, so the test could not fail.
  Each `AxeResult` carries its `impact`; 006's gate fails on serious and critical.
- **Clicks go through the `pointer` command** (`pointer("click", id, options)`, Playwright's `locator.click` with
  `force: true`), the same function the fixture driver calls, rather than Vitest's `userEvent.click`.
- **`navigations()` on the fixture driver rejects**: the fixture has no sink; a link navigates for real, and the
  fixture body asserts `Visit.tabs` (from `context.on("page")`), the page's URL and `Served.visits()` (the server's
  record of requests for `link-target.html`).
- **`forcedColors("none")` also resets reduced motion** (`commands.ts` `emulate`), so the one `afterEach` reset of
  each in-process test file ends both (mission 005 phase 4 R1-01); a harness test pins it.
- **`gates/test/plants.test.ts`** (not named by T006): its shard-plan tests run `gates/bin/plants.ts` with the
  repository's `shardSize` on 9 visual and 3 axe plants in memory, so they pinned size 3's 5 shards. They take size
  1's 13 shards in the red commit, with the same checks (the not-run case now names two shards of one plant each).
  Likewise `gates/test/integration/plants.test.ts`'s `--verdict` run on an empty report directory, whose five visual
  plants made 3 shards at size 3 and make 6 at size 1.
- **Not updated, outside T011's list**: `specs/006-storybook-workbench/contracts/plants.md:202` still says `size` is 3.

## Note for the TDD check

The driver implementation (`scenarios/driver.ts`, `in-process.ts`, `page-side.ts`, `commands.ts`,
`browser/driver.ts`, `browser/serve.ts`, the fixture pages) lies under `packages/elements/test/`, which the story
configuration counts as test files, so `tdd-check.sh`'s "final tests against the base" overlays it on the base too.
There the in-process harness tests still fail (the base `vitest.config.ts` has no `press`, `hover`, `pointer`,
`emulateReducedMotion`, `axe` or `axState` command) and the shard tests fail (`shardSize` 3); the fixture harness
tests, whose code is all test-side, may pass on the base with the overlay.

## Checks run (T013), 2026-11-14, Node 22.23.4, Chromium 153 (`OCELLE_CHROMIUM_PATH`), one at a time

- `pnpm run gate:test-lint`: `test-lint: 181 files checked, no finding`.
- `pnpm run gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`.
- `pnpm run gate:lint`: `lint: 271 files checked, no finding`; `gate:config-copies`, `gate:csp`, `gate:prefix` pass.
- `pnpm test` at the green commit: `unit-tests: 3153 tests passed in 144 files`.
- `pnpm run gate:mutation -- --base 0efc2f72bfd57b33dabe5496070eb1fb0d6e61fb` (scratchpad `PLAYWRIGHT_BROWSERS_PATH`
  alias): exit 0, `gates/lib/plant-runner.ts: mutation: zero-mutants: no mutant on the changed lines` (the changed
  line is the numeric literal `shardSize = 1`, which Stryker does not mutate; only its doc comment changed beside it);
  `0 mutants on the changed lines of 1 file`. No element source changed in this phase.
- `pnpm run gate:plants -- --plan`: 76 shards (3 of the other plants, 48 `visual`, 25 `axe`).
- `pnpm run gate:plants` (single run, `OCELLE_VISUAL_ENGINE=docker`, about 75 minutes): 300 of 301 plants as expected;
  `unit-tests/fail-elements-chromium` exited 2 (`Vitest reported errors outside tests: Failed to run the test
  .../packages/elements/test/x.test.ts`, 83.6 s, while the single run judged the other gates' plants at once) instead
  of 1 with its finding. Re-run: the plant's tree alone gives exit 1 with exactly its finding (`AssertionError:
  browser brands: Chromium, Not_A Brand ...`), and `gate:plants -- --shard 3` (the shard that holds it at size 1)
  prints `plants: shard 3 of 76: 76 plants judged, every plant as expected` (that plant 15.0 s). Read as load in the
  single run, not this phase's change; the reviewer may want CI's shard 3.
