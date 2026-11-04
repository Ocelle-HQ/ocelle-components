---
phase: 4
round: 1
verdict: approved
base: 4d6415a4216da475891b9ce3e46b34c3718459e4
head: b585c0f2285685be6fa05cc00bbaf18202cc15df
tdd_check: pass
---

# Phase 4 review, round 1

Commits reviewed: add99ec (red, test files only), 8b44e1f (vendored font, T047), b585c0f (green). There is no scaffold
commit and no `scaffold.sha`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/test/governance.test.ts:72 | The 001 test of `THIRD_PARTY_NOTICES` was changed in the green commit, not the red one. It used to assert that "No third-party asset ships" and "#5" are present. FR-014 removes that sentence, so the old assertion conflicted with the spec. The replacement asserts that the sentence is absent and that the font, "SIL Open Font License 1.1" and both package paths are present. That is stricter. The dropped `#5` check guarded obsolete text. The commit message and a comment give the reason. The behaviour itself was red-tested by packages/tokens/test/font.test.ts:88, which failed in red-phase.log. This complies with Principle VIII ("replaced by a stricter one with the reason recorded"). For neatness, a test whose expectation a phase changes would sit better in the red commit. | None. |
| R1-02 | note | packages/tokens/test/build.test.ts:40, packages/tokens/scripts/build.ts:26 | The in-process `buildPlan` test, which checks that `SOURCE.json` is not copied, was added in the green commit. The behaviour was already required by the red test packages/tokens/test/build.test.ts:89: its exact listing of `dist/fonts/` is `["OFL.txt", "SchibstedGrotesk-wght.woff2"]`, and that test failed in red. So the filter was test-driven. The extra test makes the mutants visible to the mutation gate, and it fails on base (24 failures on base against 22 in red). Leaving `SOURCE.json` out agrees with contracts/token-package.md:37-40, which lists `fonts/SOURCE.json` as not public; the `fonts/*` export would otherwise expose it. | None. |
| R1-03 | note | packages/tokens/fonts/SOURCE.json | Provenance was checked independently. The raw files fetched from `schibsted/schibsted-grotesk` at `d485f61f105e1b3935f4d21dfb4d371359798603` (`fonts/variable/SchibstedGrotesk[wght].woff2`, `OFL.txt`) hash to `8b77a34c…9ac1` and `3b4f3063…39ce`. These equal SOURCE.json, the test constants in font.test.ts and the committed files. I could not query whether the short id `d485f61f` resolves to exactly one commit, because the GitHub API is not available in this session. I rely on the implementer's statement in 8b44e1f for that. | None. |

No blocking finding.

## Test quality

- **Red evidence** (red-phase.log, check-red-phase.log): 22 of 1558 tests fail, all with `AssertionError` on the
  missing behaviour. Examples: SOURCE.json and the font files absent, `css()` without the `@font-face`, the README
  without the `font-src` sentences, the notices still holding the old sentence, `dist/fonts/` empty, and in the browser
  the platform font `Inter` instead of Schibsted Grotesk, no font request and no `font-src` violation. No syntax, import
  or setup error. In the platform-font test (font.test.ts:116) the removed-file control assertions passed in red and
  the main assertion failed, so the control works.
- **Proven against the old code**: check-final-tests-on-base.log shows 24 of 1559 fail on base. These are the 22 red
  tests plus the two tests added in green (R1-01, R1-02).
- **Weakened tests**: `git diff add99ec..HEAD` on the test pathspecs touches only governance.test.ts (R1-01, stricter)
  and build.test.ts (R1-02, an added test). No red test was changed, skipped or deleted after add99ec.
- **Exact-text tests** (generate.test.ts, source-table.test.ts): changed in the red commit to expect the `@font-face`
  first. They are still exact: `toBe(expectedCss)`, the empty-source `toBe`, and the outline `toEqual`. Nothing was
  loosened, and `fourBlocks` is still asserted after `fontFaceOutline`. stylesheet.ts now reads at-rule declarations
  too, and `fontFace` is checked entry by entry (generate.test.ts:70).
- **Browser design** (test/browser/font.test.ts): the controls sit inside the tests they guard.
  - The removed-file server must report a fallback that equals the pure-fallback line.
  - The control page must report its one inline-style violation before "no violation" counts.
  - Proportional digits must have more than one width.
  - The digit-width test also asserts `familyName` "Schibsted Grotesk" for `#figures`. This is necessary: the
    fallback Inter is proportional, as the implementer notes, and without the check the test could pass on a
    fallback with tabular figures.
  - Scenario 6 checks the single `font-src` violation with the exact URL, a fallback family equal to the reference
    fallback line, no empty token, and token values equal to those of the allowed page.
  - Every request is checked as same-origin (FR-015), and the font is requested exactly once from the origin.
  - The only conditional is `if (nodeId === 0) continue;` in a data helper, not around an assertion. The guards
    `if (... === undefined) throw` report a failure rather than swallowing it.
- **Acceptance scenarios** of US2:
  - Scenario 1: build.test.ts:89 checks the files are byte-identical, and font.test.ts checks the upstream checksums.
  - Scenario 2: font.test.ts:88 and :93.
  - Scenario 3: font.test.ts (browser) :116 and :128.
  - Scenario 4: :146.
  - Scenario 5: generate.test.ts:82.
  - Scenario 6: font.test.ts (browser) :158 and readme.test.ts.
  - FR-012 README, FR-013 values (source table, unchanged) and FR-015 are covered.
  - No element events or keyboard paths are in scope.
- **Mutation**: `pnpm run gate:mutation -- --base 4d6415a`: 17 mutants on the changed lines of 2 files, none
  survived, 0 equivalent records.

## Checks run

All with Node v22.23.4 and `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad browsers. Every check passed.

| Check | Result |
|-------|--------|
| `pnpm test` | 1559 tests passed in 78 files (includes tokens-browser) |
| `gate:typecheck` | no type error |
| `gate:lint` | 141 files, no finding |
| `gate:style-lint` | no finding |
| `gate:test-lint` | 87 files, no finding |
| `gate:config-copies` | identical |
| `gate:pins` | no finding |
| `gate:signoff -- --range 4d6415a..HEAD` | 3 commits, no finding |
| `pnpm -r build` | succeeded, including the Storybook build; `packages/tokens/dist/fonts/` holds exactly `OFL.txt` and `SchibstedGrotesk-wght.woff2` |
| `gate:csp` | 19 files, no finding |
| `gate:prefix` | 75 files, no finding |
| `gate:plants` | 149 plants of 11 gates judged as expected |
| `gate:mutation -- --base 4d6415a` | 17 mutants, none survived |
| `tdd-check.sh 4` (tdd-check.json) | `pass`, no problems |

- **Tasks**: T043 to T049 are ticked, and each one's work is present. Outside the phase only
  gates/test/governance.test.ts changed, with a reason (R1-01).
- **Constitution**:
  - IV: the font is vendored, the `@font-face` URL is relative (generate.ts:274), and the browser test proves there is
    no outside request and the fallback under the strict CSP.
  - II: no monospace.
  - Licence and supply chain: the OFL sits beside the file, and the THIRD_PARTY_NOTICES entry names the licence,
    repository, full commit and paths.
  - VIII: see above.
- **Plan**: the R-06 `@font-face` is copied exactly, as the exact-text test shows. The build copies `fonts/` to
  `dist/fonts/` as R-01/R-11 describe, and `SOURCE.json` stays repository data (contract).

## Earlier findings

None. This is the first round.
