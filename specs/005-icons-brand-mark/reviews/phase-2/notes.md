# Phase 2 notes for the review

Implementer's notes on phase 2 (User Story 1, `ocelle-icon` and the element conventions): what the orchestrator
asked to carry, where the work departs from the letter of tasks.md and why, and what is left open. The plant runs of
T030 are in `plants.md`, the spike of T011 in `spike.md`.

## Carried into the phase

- **Analysis L10** (tasks.md said decisions 1 to 15): fixed in tasks.md's input list, "decisions 1 to 16", in the
  spike commit `0c6a813`.
- **Analysis L12** (phase 2's goal line): fixed in tasks.md in `0c6a813`; the goal now says US1-13's full grid comes in
  phase 3 and the `ocelle-brand-mark` halves of US1-10 and US1-17 in phase 5.
- **Analysis L14** (US1-13's base-stylesheet clause): asserted, not recorded as a preview property. The story test
  (`storybook/test/integration/elements-stories.test.ts`, red in `9805cfd`) checks on every story page, in light and
  dark, that the preview's `base.css` link has loaded (`link.sheet` not null) and that the root's computed
  `color-scheme` equals the theme, which only `base.css` applies (as 002's `csp.test.ts` checks it for the base-style
  stories).
- **Phase 1 review note R2-01** (R-16 on Node 26.13.0): verified in the spike, `spike.md` § 1. Install, binding, no
  `npm` call, no `@xn-sakina/rml-wasm`, no `fsevents`, `setup:offline` and `gate:pins` all as on Node 22. macOS stays
  unverified.

## Departures from tasks.md, with the reason

- **`menu` is drawn in phase 2 as well as `close`** (T024 says "the `close` drawing only"). US1-9 changes `close` to
  `menu` and asserts the menu glyph, and US1-16 sets `name` to `menu` and expects one image node named "Menu"; neither
  can pass with `close` alone, and the procedure makes the phase done when the story's scenarios pass. `IconName` is
  `"close" | "menu"` in phase 2, the manifest's union likewise, and `test/icons-expected.ts` holds both expected
  drawings; phase 3 draws the other eleven.
- **US1-6 reads its label on `close`, not `search`** (the spec's snippet uses `search`, drawn in phase 3). The scenario
  is about the label; with an undrawn name the icon would expose nothing, so the scenario would test FR-016 instead.
  Phase 3 may switch the body to `search` once it is drawn.
- **`Shape` is a line only in phase 2** (data-model.md § Icon lists path, line, polyline, rect and circle). Both
  phase 2 drawings are lines, and the other four kinds had no drawing to test them, so their render branches were
  `NoCoverage` mutants; phase 3 adds each kind with the drawings that use it (`f1676c5`).
- **Mutation records** (constitution VIII): besides four process-boundary records, three equivalences are recorded:
  `mirror: false` twice in `icons.ts` (nothing reads the flag before phase 3's mirroring rule), and `label`'s property
  options in `ocelle-icon.ts` (`{}` gives Lit's defaults, which are type `String`'s). `plants.md` § Gate runs has the
  final run.
- **The driver has no `pixels` or `dir` method yet** (T013 lists both). No phase 2 scenario captures pixels or sets a
  direction; phase 3 (mirroring, T032) adds them with the bodies that use them, so no untested harness code lands now.
- **A closed plant-delta part `manifest: "absent"`** (not in the tasks). R-06 names a `repo-tree` breaking plant
  `break-missing` with no committed manifest, while R-12 puts the committed manifest in the configuration set every
  plant tree copies, and a plant's `tree/` cannot remove a file (a dangling symlink fails the copy). The part, on the
  model of `pairsList`, removes it; its tests were committed first and seen failing (`3d76bd9`), then
  `gates/lib/plant-repo.ts` (in `326f6ca`). `gates/README.md` describes it.
- **The no-coverage mutation plant expects `Survived`** (R-12 says `NoCoverage`). Under
  `stryker.elements.config.json` (browser mode) Stryker has no coverage data for a module that was never loaded, runs
  every test for its mutant and reports it `Survived`; the node projects report `NoCoverage`
  (`fail-no-test-runs`). Either is a finding, which is what the plant guards (an element-only change never ends in
  "nothing to mutate"). Measured once, `plants.md`.
- **`vitest.config.ts` loads the element commands when a command runs** (T022 adds them). The plant trees copy
  `vitest.config.ts` without the element test code; a static or type-level import of `packages/elements/test/commands.ts`
  broke the typecheck and Stryker in every plant tree. The config types the command module itself and imports it by a
  URL on its own location.
- **`elements-build` runs its files one at a time** (`fileParallelism: false`), since `build.test.ts` and `pack.test.ts`
  both run the package build into `dist/`.
- **The browser build states its export conditions** (`module`, `browser`, `production`). The build test and every
  fixture test found Lit's development build in the browser build when it was built under a test runner's
  `NODE_ENV` (Vite selects `development` for any `NODE_ENV` but `production`); fixed in `7b194c2`, and the configuration
  test now asserts the exact conditions.

## Red tests changed after the red commit (none loosened)

- `commands.test.ts`, the shadow-subtree case: Chromium exposes the shadow button's own text as a `StaticText` node,
  which the command rightly returns; the expectation now lists it (one more node asserted). `d5535ac`.
- The two drivers' `drawing()` looked for the `svg` with `:scope > svg`, which matches nothing in a shadow root, so no
  drawing was ever seen; they now take the shadow root's `svg` child. `d5535ac`.
- `vite-config.test.ts`: from "no `development` condition" (which the default also meets) to the exact production
  conditions, so a mutant that drops `production` is killed in process. `7b194c2`.

Existing tests whose pinned counts follow the registry, updated with the gate (`bb37052`), counts only: the red
commit extended the registry fixture with `manifest` but left the counts these tests derive from it, so
`gates/test/plants.test.ts` and `plants-job.test.ts` (three more plants in the fake repository, fourteen gates, 42
runs) and `gates/test/integration/plants-robustness.test.ts` (twelve other gates) failed until then. The registry plants
of `gates/plants/plants/` gained the gate's entry and CI job in the same commit.

## Red evidence to read with care

- In `red-phase.log`, `gates/test/manifest.test.ts` "fail-lost-attribute" fails with a `TypeError` in the test's own
  helper, not an assertion: at red there was no committed manifest, so the helper's fallback object had no
  `attributes` list. The cause is the missing manifest (T025), the behaviour under test.
- Existing plant-job and registry tests (`gates/test/plants.test.ts`, `plants-job.test.ts`, `registry.test.ts`
  "checkRegistry finds nothing…") fail at red because their fixture registry (`gates/test/fixtures/registry/`) gained
  the `manifest` gate in the red commit while the FR-020 list in code had not: each extra finding is "gate manifest is
  not an FR-020 gate".

## Other points for the reviewer

- The generated manifest lists the module's re-export of the `IconName` type (`exports` of `src/ocelle-icon.ts`,
  declaration module `./icons.ts`), as the analyzer writes it. The normaliser leaves `exports` alone.
- The manifest gate's exit-1 summary always ends "regenerate it with pnpm --filter @ocelle/elements run manifest",
  also when the findings are `no-description` (describe the member, then regenerate).
- `pnpm run build` in `packages/elements` copies the root `LICENSE` and `THIRD_PARTY_NOTICES` into the package (`cp`,
  so no script to mutate); both copies are ignored by git (phase 1's `.gitignore`).
