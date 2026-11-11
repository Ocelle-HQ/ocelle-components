---
phase: 5
round: 1
verdict: approved
base: 387a92a3bed961f234a4212dd53f6ddb345d8d25
head: 1583676d33156c623f16ae5984526fac97adc9f6
tdd_check: pass
---

# Phase 5 review, round 1

Scope: `git diff 387a92a..1583676` (User Story 4, `ocelle-brand-mark`; T050 to T063), no uncommitted change. Read
against spec.md US4 and FR-024 to FR-031 and FR-034, plan.md, data-model.md § `ocelle-brand-mark` and § Contrast rows,
tasks.md § Phase 5, the constitution (1.3.1), and the implementer's `notes.md` and `plants.md`.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/test/manifest.test.ts:86,91; gates/test/integration/manifest.test.ts:19 (changed in `8630bcd`) | The pinned "1 element checked" counts and the `fail-lost-attribute` lookup (`iconOf`, by path) were changed in green, not in the red commit. Because the scaffold made the committed manifest stale, these six cases also failed at red for a reason other than a red test (`red-phase.log`; recorded in `notes.md`). The changes are not looser: "2 elements checked" is an exact pin that fails at base and at the scaffold, and `iconOf` throws if the icon declaration is missing. | None. In later phases, change pinned counts that the surface moves in the red commit. |
| R1-02 | note | gates/plants/style-lint/{pass-aspect-square,fail-aspect-ratio-other,fail-aspect-calc} (added in `49dbda5`) | T050 lists the three `aspect-ratio` plants among the red tests, but they were committed with T057's implementation. The behaviour they judge was already red in `gates/test/token-only.test.ts` at `7745032` (`token-only.test.ts:148,157,176,180,184` fail at the scaffold), and `gate:plants` judges all three as expected. | None. |
| R1-03 | note | specs/005-icons-brand-mark/reviews/phase-5/check-final-tests-on-base.log | The base run of the final tests exits 2 ("no test file found"), not on assertions, as in earlier phases. The evidence that the tests are proven against the old code is the scaffold run (`check-final-tests-on-scaffold.log`: 105 of 2518 tests fail; every failure is an `AssertionError`, and the files are the phase's own). | None. |
| R1-04 | note | tasks.md:214 (T052); research.md R-11 | Analysis L11's text was not carried into T052 or R-11 (`notes.md` § Carried into the phase). Its substance was done: the plant "`ocelle-icon.ts` imports `ocelle-brand-mark.ts`" makes `entry-icon.test.ts` fail. I re-ran it for this review: 1 failed, `mark` is `OcelleBrandMark` instead of `undefined`. | Optional: the planner adds the L11 sentences to T052 and R-11. |
| R1-05 | note | NOTICE:2 | "Copyright the ocelle-components authors" names no holder. No holder is named anywhere in the repository, and FR-030 asks only for the trademark note. | Operator decision: name the copyright holder before 1.0.0. |
| R1-06 | note | storybook/stories/brand-mark.stories.ts:15-17; storybook/test/integration/elements-stories.test.ts:162-185 | The Chrome story paints its ground through the swatch rule (`.ocelle-swatch[data-token="color-chrome"]`). The story test observes the story's `ground`/`tone`/`label`, the drawing, the theme, `base.css` and CSP, but not that the chrome story sits on `color-chrome`. T056a does not ask for that, and the plan's Complexity Tracking row covers the missing visual baselines. | None now. The visual baselines of #10 will cover it. |

## Test quality

- **Red evidence.** The red commit `7745032` changes only test files and test fixtures (plus `scaffold.sha`). `red-phase.log`: 103 of 2516 tests fail, every failure an `AssertionError`. The failures are the missing behaviour: undefined element, empty drawing and style, missing `NOTICE`, README fragments, export list, contrast counts and stories. The exception is the six manifest-gate cases that fail on the scaffold-stale manifest (R1-01). `tdd-check.json`: `pass`; the red commit exits 1 at itself; the final tests exit 1 at the scaffold and 0 at HEAD.
- **Scaffold.** `afb0ac0` adds only `src/ocelle-brand-mark.ts`: an exported `LitElement` with an empty `css` template, not defined, with no behaviour and no test file. The final tests fail against it.
- **Tests changed after red** (`git diff 7745032..HEAD` over test files):
  - `brand-pairs-check.ts` `styleTemplate()` changed from `css\`` to `css\s*\``. This fixes the helper so it reads the built output (tsc writes `css \``). The assertion is unchanged, and the source template still matches. Not looser.
  - US4-6's markup lost the leading space in the home link. The assertion `{ role: "link", name: "Ocelle" }` is unchanged; the fix is to the markup, and the reason is recorded in `10ae6ce`.
  - Two `token-only` cases added (`red`, `#000 / 1`): stricter.
  - The manifest pins and lookup: see R1-01.

  Nothing was skipped, deleted or loosened.
- **Assertions.** Every new test asserts observable behaviour, with a single `toEqual` per scenario over painted colours, box sizes, drawing placement and the accessibility tree.
  - The fixture harness asserts the scenario and the recorded violations, requests and console in the same `toEqual`.
  - No `skip`/`only`, no snapshots, no assertion inside a conditional. `gate:test-lint`: no finding.
  - The early `return false` in `spotInsideRing` and the `undefined` fallbacks in US4-9's parsing produce values that the `toEqual` then rejects; they never skip an assertion.
  - Every "does not" outcome is paired with its positive twin in the same test:
    - US4-6: unlabelled marks beside named ones.
    - US4-8: unknown values beside the chrome twin.
    - US4-13: `label` not reflected beside the reflected `ground` and `tone`.
    - US4-14 and US4-15: hidden marks beside visible twins.
    - US4-9: forbidden content beside the geometry fit.
- **Coverage of the story.** US4 scenarios 1 to 3, 5 to 9 and 13 to 15 are shared bodies in `test/scenarios/brand-mark.ts`, run both in process and on the strict-CSP fixture. The other scenarios are covered as follows:
  - US4-4: `test/node/brand-pairs.test.ts`, with its planted `pairs-missing-row.json` in the same test, and `test/build/build.test.ts:63` on the shipped `dist/ocelle-brand-mark.js`.
  - US4-10: `readme.test.ts` (README and `NOTICE`) and `pack.test.ts` (`NOTICE` packed).
  - US4-11: `elements-stories.test.ts` (four stories × two themes).
  - US4-12: `test/node/manifest.test.ts:274` and `gate:manifest`.

  US1-10 is extended to the mark's first-bundle class, and `entry-root`, `entry-brand-mark` and `exports` are updated. The element is not focusable and emits no event, so there is no keyboard path and no event to assert.
- **Plants re-run by the reviewer** (in process, `elements` project; each source file restored with `git checkout`, working tree clean afterwards):
  - `inline-size: auto` together with `:host([hidden])` changed to `display: inline-block`: US4-7 and US4-15 fail, the 13 other scenarios pass.
  - `@media not (forced-colors: active)` replaced by `@media all` (the pre-round-1 sheet): both US4-5 palettes fail.
  - L11's import plant: `entry-icon.test.ts` fails (R1-04).

  These agree with `plants.md`.
- **Mutation.** `pnpm run gate:mutation -- --base 387a92a` exits 0: 59 mutants on the changed lines of 5 files, none survived, 3 equivalent records. Each record is accepted:
  - `gates/bin/contrast.ts:116`: the existing process-boundary record, with its text updated to the new counts. It is covered by the integration test that pins "160 … 168".
  - `gates/stylelint/token-only.ts:206` (StringLiteral and BooleanLiteral on `classify([node], "aspect-ratio", false)`): equivalent. Only non-numeric, non-function nodes reach this call. Of the two arguments, `classify()` and `wordAllowed()` use `property` only for numbers (the `unitless` set) and font properties, and `inCalc` only for numbers. `""` and `"aspect-ratio"` are both non-font and neither is in the `unitless` set (`token-only.ts:60-69,128-138`).
  - `packages/elements/src/ocelle-brand-mark.ts:24` (ObjectLiteral `{ type: String }` → `{}`): equivalent. Lit's default property options are `type: String`, attribute named after the property, default converter, not reflected. This is the same record as the icon's `label`.

## Checks run

Run here with Node 22.23.4 and `OCELLE_CHROMIUM_PATH` set (`PLAYWRIGHT_BROWSERS_PATH` set for the mutation and plant runs), one at a time, at HEAD `1583676`:

| Check | Result |
|---|---|
| `gate:typecheck` | pass, no type error |
| `gate:lint` | pass, 223 files, no finding |
| `gate:test-lint` | pass, 152 files, no finding |
| `gate:style-lint` | pass, 12 files, no finding |
| `gate:manifest` | pass, "2 elements checked, no finding" |
| `gate:contrast` | pass, 160 pairs in light, 168 in dark (149 required per theme) |
| `gate:brand-rules` | pass, 7 rules |
| `gate:prefix` | pass, 206 files |
| `gate:pins` | pass, 5 manifests |
| `pnpm -r build`, then `gate:csp` | exit 0; csp: 34 files, no finding |
| `pnpm test` (unit, in-process browser, strict-CSP fixture, build, pack, Storybook integration) | exit 0, 2518 tests passed in 119 files |
| `gate:plants` | exit 0, 217 plants of 14 gates and the registry, every plant as expected |
| `gate:mutation -- --base 387a92a` | exit 0, 59 mutants, none survived, 3 equivalent records (accepted above) |

The constitution checks that apply all hold:

- **I.** The tag is `ocelle-brand-mark`. There are no events and no I/O; the drawing is an inline template with no `href`, `use` or `image`. The manifest declares `ground`, `tone` and `label` with their types and defaults, and empty slots, events, parts and CSS properties.
- **II.** Tokens only. `currentColor` is used for mono and for forced colours, and `aspect-ratio: 1` is admitted by the new lint allowance. The `color-accent` rows are `checked` non-text rows, and `gate:contrast` and `gate:brand-rules` pass.
- **III.** No ID in the shadow root, and the drawing is `aria-hidden`. Naming goes through `ElementInternals`, with `aria-label` observed. Forced colours are proven in both palettes. The element is not interactive, so it has no keyboard model.
- **IV.** The fixture records zero violations and zero outside requests for every scenario. Styles are adopted, with no inline style.
- **V.** Four stories in light and dark. Visual baselines and axe are deferred under the plan's Complexity Tracking row (plan.md:328).
- **VII.** The CHANGELOG names the mark, its properties, its entry point, the slot convention and `NOTICE`.

The implementation follows plan.md and data-model.md:

- `rosette.ts` uses `viewBox="4 4 92 92"`, four `ring` arcs with stroke widths 15/12/16/11, and a `spot` ellipse with `rotate(-18 …)`. The US4-9 fit gives scale 1 and translation 0.
- The variant rules sit inside `@media not (forced-colors: active)`.
- The `:host` box is set as specified.
- `index.ts` and `package.json` `exports` and `files` are updated, and the build copies `NOTICE`.

Every T050 to T063 task is ticked and its work is present. The changes outside the phase's own files are the manifest plants' regenerated copies, `gates/README.md`'s style-lint row and the contrast record comment. Each has a reason in the commit or in `notes.md`.

## Earlier findings

This is the first review round of phase 5; there is no earlier round. Phase 3 review findings R1-01 and R1-02, left open since phase 4, are not touched by this phase, which changes neither `scripts/manifest.ts` nor `icon.stories.ts`. They remain with the operator as recorded in `reviews/phase-4/notes.md`.
