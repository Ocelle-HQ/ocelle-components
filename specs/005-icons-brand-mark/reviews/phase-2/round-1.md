---
phase: 2
round: 1
verdict: approved
base: af90e30fb7c78b8fe3783490edac2b5a739e7586
head: 58101a7ae7253107da6ecc2b2db324c4519c2196
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff af90e30..58101a7` (143 files) and no uncommitted change. HEAD `58101a7` only adds the red/green check
outputs on top of `70afedd`, the head that `tdd-check.json` checked. I read the phase's notes, spike and plant record
(`notes.md`, `spike.md`, `plants.md`) and judged them against the code and the logs.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `reviews/phase-2/red-phase.log` (in-process `packages/elements/test/icon.test.ts` lines) | At red, most in-process scenario runs fail with `TypeError: commands.axTree is not a function` (or `emulateForcedColors`), not an assertion. The commands are this phase's own work (T012 tests them, T022 registers them), and the same shared bodies fail with assertion errors on the fixture harness in the same log (`browser/icon.test.ts`, US1-1 to US1-19). So every scenario was seen failing because behaviour was missing. The in-process half on its own would not count as red evidence. | None. Later phases that add scenario bodies should check that at least one harness fails each body with an assertion. |
| R1-02 | note | `gates/plants/manifest/fail-stale-property/plant.json` | US1-12 says a public property added without regenerating gives "one finding naming the element and the member". The plant expects two `stale` findings, `ocelle-icon.property.tone` and `ocelle-icon.attribute.tone`. This follows R-06 and contracts/checks.md: one finding per differing member, and FR-009 counts properties and attributes as separate members. It is consistent, but `notes.md` does not mention the difference from the spec's wording. | Optional: say in the spec, or in phase 6's notes, that a property with an attribute counts as two members. |
| R1-03 | note | `packages/elements/test/scenarios/driver.ts`; `packages/elements/src/icons.ts:12-24`; `test/scenarios/icon.ts` (US1-6) | Work that T013 and T024 list is deferred to phase 3 and recorded in `notes.md`: the driver's `pixels` and `dir` methods, the path, polyline, rect and circle `Shape` kinds, and US1-6 on `search` (it runs on `close` for now). The tasks are still ticked. Each reason holds (no phase 2 drawing or scenario uses them, and adding them now would leave untested code or mutants with no coverage). | Phase 3 (T032, T037 and the icon set) adds them and switches US1-6 to `search`. |
| R1-04 | note | commit `3d76bd9`; `reviews/phase-2/red-commits` | The `manifest: "absent"` plant-delta part was written test-first in a separate test-only commit (`3d76bd9`, then `326f6ca`). That red run's output is not kept, and `red-commits` lists only the phase red commit. The final-tests-on-base and on-scaffold runs cover these tests (both exit non-zero). Read against `3d76bd9`, `parseDelta` rejects the key `manifest` as unknown, which is the missing behaviour. | None. A later mid-phase red commit should be added to `red-commits` with its log. |
| R1-05 | note | `gates/plants/mutation/fail-element-source-no-coverage/plant.json` | R-12 says this plant reports `NoCoverage`, but the plant expects `Survived`. Under the elements config, browser-mode Stryker gives a never-loaded module no coverage data, so its mutant is reported `Survived`. The plant's `why` and `notes.md` record this. Either result is a finding, and the case the plant guards ("never nothing to mutate") holds. | None. Optionally align R-12's wording. |
| R1-06 | note | `packages/elements/scripts/manifest.ts:86` | `normalise` orders modules with `String.prototype.localeCompare`, which uses the process's default ICU locale. Today there is one module, and `ocelle-*.ts` paths sort the same way in common locales. A plain code-point comparison would keep the committed manifest's module order independent of the environment once there are several elements. | Optional, before phase 5 adds a second element module. |

## Test quality

- **Red evidence.** The red commit `9805cfd` changes only test files (within `test_pathspec`) plus `scaffold.sha` under
  the feature's specs directory. `red-phase.log`: 177 of 2203 tests fail, and the failures come from missing behaviour:
  `not implemented` from the scaffold's signatures, empty README, CHANGELOG and notices, a missing browser build, a
  missing manifest, an unregistered gate, and assertion diffs on the fixture harness (see R1-01 for the in-process
  `TypeError`). Two failures are flagged in `notes.md`: `fail-lost-attribute`'s helper `TypeError` (no committed
  manifest at red), and the registry and plant-job tests whose fixture registry gained `manifest`. Both are as
  explained. `check-red-phase.log` is identical to `red-phase.log`.
- **Scaffold.** `5fb7f7d` adds signatures only: functions that throw `not implemented`, an icon table with no shapes,
  an empty Vite config, an empty browser entry. It has no test file and registers or exports nothing.
  `final_tests_on_scaffold_exit: 1`, and `final_tests_on_base_exit: 2` (no test file matched at base), so the final
  tests fail against both.
- **Tests changed after red** (`git diff 9805cfd..HEAD` on test files). None was weakened or skipped:
  - `commands.test.ts`: one more expected node (`StaticText "Inside"`); stricter.
  - Both drivers' `drawing()`: from `:scope > svg`, which matches nothing in a shadow root, to the shadow root's `svg`
    child. This fixes a selector that could never see a drawing; it is stricter.
  - `vite-config.test.ts`: from `not.arrayContaining(["development"])` to the exact conditions
    `["module", "browser", "production"]`, plus `minify: true`; stricter.
  - `node/manifest.test.ts` and `gates/test/manifest.test.ts`: only additions (module order, non-object entries,
    protected members, `iconNames`, `generate` on other sources, `writeManifest`, an element only in the committed
    manifest, an element without a tag name).
  - `gates/test/plants.test.ts`, `plants-job.test.ts`, `integration/plants-robustness.test.ts`: plant and gate counts
    only (41 to 44, 13 to 14, 11 to 12 other gates), following the registry fixture the red commit extended.
  - `global-setup.ts` states the production conditions for the module-build bundles, a fixture setting.
- **Assertions.** Each scenario body returns one observation, and both harnesses assert
  `toEqual(expected)` against values written by hand: token colours from `tokens/test/expected.ts`, drawings from
  `test/icons-expected.ts`, system colours as measured. The fixture harness also asserts
  `recorded: clean` (no violation, no request outside the allowed list, no failed request, no console message, no
  page error) in the same `expect`. The control page shows the collector records an inline-style violation. There are
  no conditional assertions, no `skip`/`only`, no snapshots and no swallowed errors; `gate:test-lint` passes.
- **Pairings.** Every "does not" row for US1 is observed in the same body as its positive twin: US1-1, 5, 8 (with the
  `aria-unknown`/`aria-known` pair), 16, 18 and 19. `plants.md` records each named plant biting on the "does not" half.
- **Coverage of the story.** In-process and fixture: US1-1 to 9, 14, 16, 18 and 19 (US1-7 in both palettes and four
  contexts). Fixture only: US1-10 (two bundles, then the browser build) and US1-15. US1-11 is covered by
  `node/manifest.test.ts`. US1-12 is covered by `gates/test/manifest.test.ts` and the plants. US1-13 is covered by
  `storybook/test/integration/elements-stories.test.ts`; the full grid comes in phase 3. US1-17 is covered by
  `entry-icon.test.ts`, `entry-root.test.ts` and `build/build.test.ts`; the brand-mark half comes in phase 5. There are
  no events and no keyboard model (the icon is not focusable), so there are no event or keyboard tests to require.
- **Mutation.** `pnpm run gate:mutation -- --base af90e30`, run by me: exit 0, "433 mutants on the changed lines of
  12 files, none survived; 7 equivalent records". I read each record and accept them all:
  - The four `all: process boundary` records (`gates/bin/manifest.ts:147`, `gates/bin/mutation.ts:207`,
    `gates/lib/plant-repo.ts:411`, `packages/elements/scripts/manifest.ts:123`) each name the integration test or
    unit test that covers the line.
  - `icons.ts:33` and `:41`, `mirror: false` (BooleanLiteral): equivalent, since nothing reads `mirror` until phase 3's
    mirroring rule. Phase 3 must remove both records when T037 reads the flag.
  - `ocelle-icon.ts:27`, `label: { type: String }` to `{}` (ObjectLiteral): equivalent. Lit's default property
    options are attribute `label`, the default converter (which treats an absent type as `String`) and no reflection.

## Checks run

All run by me at HEAD `58101a7`, one at a time, Node 22, `OCELLE_CHROMIUM_PATH` set (and `PLAYWRIGHT_BROWSERS_PATH`
for mutation and plants):

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 205 files, no finding |
| `gate:style-lint` | exit 0, 9 files, no finding |
| `gate:test-lint` | exit 0, 137 files, no finding |
| `gate:config-copies` | exit 0 |
| `gate:manifest` | exit 0, 1 element checked, no finding |
| `gate:prefix` | exit 0, 178 files, no finding |
| `gate:pins` | exit 0, 5 manifests |
| `gate:contrast` | exit 0, 158 light / 157 dark pairs |
| `gate:brand-rules` | exit 0, 7 rules |
| `pnpm -r build` then `gate:csp` | build ok (Storybook included); exit 0, 30 files, no finding |
| `pnpm test` (unit, interaction, fixture, build, Storybook integration) | exit 0, 2222 tests passed in 111 files |
| `gate:mutation -- --base af90e30` | exit 0, see above |
| `gate:plants` | exit 0, 204 plants of 14 gates and the registry judged, every plant as expected |

Visual regression and axe do not exist yet. The plan's Complexity Tracking row ("No visual baselines and no axe run
for the new stories", sunset at the merge of #10) applies.

Other checks:

- **Tasks.** T011 to T030 (with T016a, T020a and T024a) are ticked and present. The departures are in `notes.md`, and
  each reason holds: `menu` is drawn (US1-9 and US1-16 need it); see R1-03 for the rest. Files changed outside
  `packages/elements`, gates, plants and specs are `vitest.config.ts`, `package.json`, `pnpm-lock.yaml`, `ci.yml`,
  `THIRD_PARTY_NOTICES`, `storybook/package.json` and the story with its test, all named by T022 to T028.
- **Constitution.**
  - I: `ocelle-icon` registers through the guarded `define`. It does no I/O. The manifest declares `name` and `label`,
    with the four lists stated empty.
  - II: the styles use only `--ocelle-icon-size` and `currentColor` (`gate:style-lint` passes).
  - III: the host is hidden through `ElementInternals` unless named; named, it is one `img`. No ID reference crosses a
    shadow root. `:host([hidden])` is set. The forced-colours behaviour is measured.
  - IV: adopted stylesheets, with no `style` attribute or element. The browser build has no import, no development
    build and no console call. The fixture runs under the strict header with zero violations.
  - V: stories exist for close, labelled and unknown name, in light and dark, as noted above.
  - VII: the CHANGELOG names the element and the entry points.
  - VIII: as in Test quality.
  - Lit's BSD-3-Clause text ships unchanged, with a notices entry and a banner.
- **Plan.** It follows R-02 (entry points; the package root defines and exports `OcelleIcon` only), R-05 (Vite library
  build, banner, production conditions), R-06 (analyzer API in process, as the spike chose; the normaliser; the gate;
  the plants; registration, CI job and README going from fourteen to fifteen) and R-11 (shared bodies, two harnesses,
  `axTree` over CDP), as well as R-12 (Stryker split by configuration, with its plants) and R-13 (naming rules).

## Earlier findings

None: this is round 1.
