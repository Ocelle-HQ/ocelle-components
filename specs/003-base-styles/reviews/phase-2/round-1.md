---
phase: 2
round: 1
verdict: approved
base: d8dba6010eda61df1d65c618df6b713fb3c29640
head: 19e058b385d859e124a6d54ad8daaf135a36022e
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff d8dba60..19e058b` (spike 67650ca, scaffold a90b851, red af6f391, green cd49acf, mutation-survivor
tests c10ca28, evidence 19e058b), plus the uncommitted re-run outputs of `tdd-check.sh 2` (logs and
`tdd-check.json`, timing lines and `head` only), committed with this review.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/003-base-styles/reviews/phase-2/red-phase.log (as committed in af6f391) | The red log committed with the red commit is the run of the pre-amend commit `379cac5`: in it the FR-009 source test failed with `TypeError: undefined is not iterable`, which is not an assertion. The amended red commit `af6f391` changed that test to `?.declarations ?? []`, and green `cd49acf` replaced the log and `red-commits`. The authoritative re-run of `af6f391` by `tdd-check.sh` (`check-red-phase.log`) shows all 87 failures as assertion failures on missing behaviour, the FR-009 one included (`expected [] to deep equally contain [ 'outline-style', 'solid' ]`). So red is proven, but the log in the red commit did not belong to that commit. | None for this phase. In later phases, re-run `red.sh` after amending a red commit, so the committed log belongs to the commit it records. |
| R1-02 | note | packages/styles/test/browser/serve.ts:150-161 | `variant()` leaves a page unchanged without any error when the exact `<link …href="base.css">\n` / `tokens.css` text is not found. Today every query-string use is covered by an assertion that would fail: each `after=plants/*` test asserts its plant bites, `after=host-code` asserts `normal`, `tokens=last` asserts the link order (base.test.ts:324), and `tokens=none` is paired with the shorthand plant, which reads `none` only if `tokens.css` is really absent (base.test.ts:311). So nothing passes vacuously. A future fixture whose links are written differently would only fail through those paired assertions. | Optional: make `variant()` throw when a requested change finds no link to change. |
| R1-03 | note | specs/003-base-styles/reviews/phase-2/checks.md:3 | Checks ran on Node 22.23.4, not the pinned 26.13.0 (container limit). This review re-ran them on the same Node. | None. CI runs on the pinned Node. |

No blocking finding.

### The implementer's flagged points

1. **Red-step test files changed in green.** `git diff af6f391..HEAD -- packages/styles/test storybook/test gates/test packages/tokens/test`:
   - `base.test.ts:45`: `dataTheme?: string` became `string | undefined`. This is a type change only, for `themeConditions` entries that have no `data-theme`. No assertion changed.
   - `source-checks.ts:26-37`: the `for` loop that stopped at the root became a `while` loop over `parent`, which records at-rules only. The root is never an at-rule, so the result is the same. No assertion changed.
   - The other changes after red are additions only: five `token-only.test.ts` cases and one `swatches.test.ts` case, from the mutation run (c10ca28). Nothing was weakened, skipped or deleted.
2. **Fixture server query strings (R-09, R-10).** The policy header is fixed per path: `policy` everywhere, and `imagePolicy` only for `page.html` (serve.ts:184), which US1-5 asserts on the response header (base.test.ts:276-277).
   - The query changes only which external same-origin `<link>`s the static HTML carries. It adds no inline style, no script and no other origin, so the strict CSP of R-09 holds for every variant.
   - A plant is a stylesheet in `fixtures/plants/` linked directly after `base.css`, as R-10 states ("a second fixture stylesheet … linked after `base.css`"). This is a server-side way to get that link order without one fixture page per plant.
   - `tokens=none` drops only the tokens link, as R-10's US1-6 plant requires.
   - Conforms to R-09 and R-10 (see R1-02 for the optional hardening).
3. **Spike record.** spike.md is consistent with T007:
   - It records the scratch stylesheet's contents and order, which scratch page each measurement and plant used, and the Chromium build (153.0.8010.12).
   - It covers R-06 steps 1 to 5, the R-05 region ring and every R-10 browser plant with its with/without readings.
   - No stop-and-ask outcome occurred.
   - List semantics (six CSS forms measured) and table semantics (`display: grid` measured) have no plant. R-10 allows this explicitly, and the measurements are the recorded reasons.
   - The source-level plants are not browser plants. They run, as the tasks-gate note says, as T009's tests (source.test.ts:231-289): every R-10 plant string is reported once and every boundary string passes. This is verified at HEAD.
4. **Link half of the pointer-focus test** (base.test.ts:149-165):
   - `preventDefault()` on `click` cancels only the fragment navigation. Focus and the `:focus-visible` heuristic are decided on mousedown, before the click. So the observation still covers what US1-2 asks: a pointer-focused link shows no ring.
   - Without it, the helper would report `link: not focused by the click`. The test would fail loudly; it would not pass vacuously. The spike recorded why.
   - With the `:focus { outline-style: solid }` plant, the link reports a ring (asserted, base.test.ts:179), so the link half is shown able to fail.
   - The listener is test instrumentation through `page.evaluate`, not page script.
   - Accepted.

## Test quality

- **TDD check:** `tdd-check.json` is `pass`. The red commit `af6f391` exits 1. The final tests exit 2 on the base and 1 on the scaffold. HEAD exits 0. There are no problems.
- **Red evidence** (`check-red-phase.log`): 87 failures, every one an `AssertionError` or a rejected-promise expectation (`build() fails when the package has no src/base.css: promise resolved "undefined" instead of rejecting`), each on missing behaviour:
  - the root `color-scheme` is `normal`;
  - the outline style is `auto`;
  - 136 `content-box` boxes;
  - code families;
  - media ratios;
  - an empty `buildPlan`;
  - absent README and CHANGELOG text;
  - the `lineHeight` option values;
  - the Storybook base story and `base.css` copy.

  None is a load or setup error.
- **Scaffold** (a90b851) adds signatures only: `build(packageDir, outDir)` still resolves without writing, and `renderFamily` returns `""` with its content types. It adds no test file. The final tests fail against it (`final_tests_on_scaffold_exit: 1`, 91 failures).
- **Weakened tests:** none (see flagged point 1).
- **Vacuity:**
  - Every guard shares its test with its positive and runs with its plant:
    - US1-2: pointer ring, keyboard ring;
    - US1-4: control borders and Highlight region ring, with the solid system-colour ring;
    - US1-6: shorthand ring, with border-box and margin 0;
    - US1-10: `revert-layer` and canvas `aspect-ratio`, with the size and ratio positives;
    - FR-007 list role, beside border-box on the list (no plant, as recorded).
  - The source guards each sit beside a positive over the same parse, and the whole rule table is asserted in order (source.test.ts:222-224).
  - There are no conditional assertions, `skip`, `only` or snapshots (`gate:test-lint` clean). The helpers return problem lists that are asserted unconditionally.
- **Scenario coverage:** in Chromium, under the strict CSP:
  - US1-1 covers the six theme conditions of 002.
  - US1-2, 4, 5, 6 (computed half), 7, 9 and 10 and the FR-007 list guard each run in light and dark.
  - US1-3, 5 (source half) and 8 are source checks.
  - US1-6's documentation half is covered for phase 2 by readme.test.ts. Per R-14 it is complete only after phase 5.
  - The keyboard paths are Tab to the link, button, input, `tabindex="0"` and the region button. The pointer path is covered too.
  - The Storybook "Base page" story has unit, story and CSP-integration tests in both themes.
- **Mutation** (`pnpm run gate:mutation -- --base d8dba60…`, run alone): 146 mutants on the changed lines of 5 files, none survived. There are 8 equivalent records:
  - 7 I/O-boundary records in `packages/styles/scripts/build.ts:22-38`, which R-01 prescribes. Each names the `build.test.ts` test that covers it, and those tests exercise a fake package, the missing-source failure and the real CLI.
  - 1 process-boundary record in `storybook/scripts/swatches.ts:40` (the `import.meta.main` call), covered by storybook-integration's setup and `csp.test.ts`.

  Each reason holds.

## Checks run

All on this container (Node 22.23.4, Chromium 153.0.8010.12 from `PLAYWRIGHT_BROWSERS_PATH`), one heavy job at a time:

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0; `packages/styles/dist/base.css` byte-identical to `src/base.css` (`cmp`) |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | exit 0 |
| `gate:style-lint`, `gate:prefix`, `gate:csp` | exit 0 (prefix and csp cover `packages/*/dist/**`, so the built `base.css`) |
| `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | exit 0 |
| `pnpm test` | 1887 tests passed in 92 files (`styles`, `styles-browser`, `gates`, `storybook`, `storybook-integration` included) |
| `gate:plants` (alone) | 182 plants of 13 gates and the registry, every plant as expected, the four `fail-styles-*-line-height`, `pass-styles-line-height-token` and the moved `pass-line-height` included |
| `gate:mutation -- --base d8dba60` (alone) | 146 mutants, none survived, 8 equivalent records (above) |
| `tdd-check.sh 2` | `pass` (run by the orchestrator before this review; its refreshed outputs are committed here) |

### Tasks, plan and constitution

- **Tasks:** T007 to T022 are ticked, and the work is present:
  - spike.md;
  - build.ts (R-01);
  - base.css, which matches data-model § Rule table base layer exactly and in order (asserted by source.test.ts);
  - the `lineHeight: "token"` option and the `packages/styles/**/*.css` override;
  - the five style-lint plants and the moved `pass-line-height`, with its new `why`;
  - the README, the CHANGELOG and the tokens README sentence;
  - in Storybook: base.css copied and linked after tokens.css, `preview.css` narrowed to the error display, `stories-layout.css` (only `data-story` selectors, token padding), `base-content.json`, `renderFamily` and the Base page story;
  - checks.md with the `styles-browser` time (5.9 s against the 60 s goal).

  Nothing outside phase 2 was changed.
- **Plan:** the following are followed:
  - the R-01 build model;
  - R-03 `:where()` selectors;
  - R-05 longhands and the forced-colours `Highlight` rule;
  - R-07 option model (`validateOptions`, `optionLists` returning undefined without lists);
  - R-09 harness (strict CSP, `img-src 'self'` only for `page.html`, `.svg` type, `control.html` from 002);
  - R-10 plants;
  - R-11 checks with `postcss-selector-parser`;
  - R-12 Storybook;
  - R-14 phase 2 statements.
- **Constitution:**
  - II: every value is a token or an allowed keyword (`0`, `100%`, `auto`, `inherit`, `Highlight`, `border-box`, `solid`). There is no monospace, and the line heights are tokens.
  - III: there is no motion. The ring and the forced-colours behaviour are tested, and list semantics are kept.
  - IV: base.css is external, with no `@import` or `url()`, and every fixture is served under the strict CSP with zero violations.
  - VII: README and CHANGELOG entries exist.
  - VIII: red first, nothing weakened, mutation clean.
  - No element code is involved (I and III shadow-root rules do not apply here).

## Earlier findings

None: this is the first review round of phase 2.
