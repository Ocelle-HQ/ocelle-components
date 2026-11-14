---
phase: 1
round: 1
verdict: changes_requested
base: 2427d209fe9e84215c93348db7702f0444c2c535
head: a02e49b16a784f8c1da084c7fcfb4a251dd885f9
tdd_check: fail
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `storybook/baselines/tokens--type.{light,dark}.png`, `tokens--space.{light,dark}.png`, `tokens--shell.{light,dark}.png`; `packages/tokens/src/source.ts:143,157-158,200-203`; `reviews/phase-1/check-head.log:42-45` | The six new tokens add rows to the Type, Space and Shell token stories (the story tests at HEAD expect 22, 12 and 22 rows), but their baselines were not regenerated. `pnpm run gate:visual` at HEAD reports 6 findings in 42 story-themes ("differs" for each of the six), and `pnpm test` fails 3 of 3127 tests, all in `gates/test/integration/visual.test.ts` (lines 115, 126 and 239 in the log: the repository's 42 story-themes no longer match, the planted-defect test sees 8 findings instead of 2, and `visual:update` would write files on the tree). `tdd-check.json` is therefore `fail` ("tests fail at HEAD"), and the phase checkpoint (`tdd-check.sh 1` reports `pass`) is not met. tasks.md line 59 puts baselines in the phase whose behaviour they describe, which is this one. | Regenerate the six baselines with `pnpm run visual:update` in the pinned container (R-15; as T028 describes, confirmed by a CI run of the branch), commit them with the reason (009's six tokens add rows to the token stories), and note it for the PR description (constitution V: baselines change only in a PR that says why). Re-run `tdd-check.sh 1` to `pass`. No new red test is needed: the existing `visual.test.ts` tests already fail for exactly this defect. |
| R1-02 | note | `packages/tokens/test/source-table.test.ts:131-141`; `reviews/phase-1/plants.md` | T004 passes in the red commit because it guards values that already hold (operator decision PLAN-CORRECTNESS-1-011 (b)). Its ability to fail is shown by plants 1 and 2, one per theme, which is an adequate substitute for red evidence for a guard of this kind. | None. |
| R1-03 | note | `packages/elements/test/frames.test.ts`, `packages/elements/test/browser/frames.test.ts`; `reviews/phase-1/red-phase.log` | In the red run the frame tests fail on `viewport()`'s "not implemented" stub, not on the missing `frames.css`. Plant 3 (frames.css without rules: every frame measures the viewport width) and plant 4 (viewport not resizing) cover both halves, so each assertion has been seen failing for the behaviour it names. | None. |

## Test quality

- **Red evidence.** `red-commits` names `b47541b`, which changes only test-pathspec files (tests, `expected.ts`, the drivers' `viewport()` stubs in `packages/elements/test/**`) and the feature's specs. `red-phase.log` / `check-red-phase.log`: 57 failures, each the missing behaviour: token sets of 115 instead of 121 names (source-table, index, readme/CHANGELOG, themes, values, font, token stories and the Storybook render pages), the six records `undefined`, and both drivers' `viewport()` rejecting "not implemented". The `vitest-mutation-config.test.ts:147` failure in the red and base runs follows from the source-table test failing first (the ordered run stops early) and passes at HEAD; the test was not changed. The visual-gate failures in the red run are exit code 2 (the gate could not run there) and do not count as red evidence; they were not needed as such.
- **Final tests on base.** `final_tests_on_base_exit: 1` with the same missing-behaviour failures: the final tests cannot pass vacuously against the old code.
- **No weakening.** `git diff b47541b..HEAD` touches no test file's assertions: in test paths it changes only the two drivers (stub replaced by `page.viewport` / `page.setViewportSize` plus a settle), `serve.ts` (copies and allows `frames.css`) and the new `test/fixtures/frames.css`.
- **Assertions.** Every new test asserts observable values with `toEqual` on the whole outcome (measured inline size together with `innerWidth`, the fixture's CSP/request/console record `clean`, token records and the generated `:root` and JSON values). No conditional assertion, `skip`, `only`, snapshot or mock. `gate:test-lint`: 178 files, no finding.
- **Coverage of the phase.** Each of T003's six records (name, group, value, ref, CSS, JSON, resolved `2rem`), the 121 pin, T004 in both themes, the four frames in both harnesses, and `viewport()` in both harnesses have a test. No events or keyboard paths in this phase.
- **Mutation.** `pnpm run gate:mutation -- --base 2427d20`: 26 mutants on the changed lines of `packages/tokens/src/source.ts`, none survived; 12 compile errors (the record object and name literals, read as reports), 0 timeouts, 0 zero-mutant entries, 0 equivalent records. The test-support changes in `packages/elements/test/**` are outside mutation scope; plants 3 and 4 stand in for them.
- **Scaffold.** No `scaffold.sha` for this phase.

## Checks run

At HEAD `a02e49b`, OCELLE_CHROMIUM_PATH set, one at a time:

| Check | Result |
|---|---|
| `pnpm test` (tdd check, `check-head.log`) | **fail**: 3 of 3127, all `gates/test/integration/visual.test.ts` (R1-01) |
| `gate:visual` | **fail**: 6 findings in 42 story-themes, `tokens--type`, `tokens--space`, `tokens--shell` in light and dark differ (R1-01) |
| `gate:typecheck` | pass |
| `gate:lint` | pass, 268 files |
| `gate:style-lint` | pass, 12 files |
| `gate:test-lint` | pass, 178 files |
| `gate:config-copies` | pass |
| `gate:prefix` | pass, 204 files |
| `gate:pins` | pass |
| `gate:contrast` | pass, 160 light / 168 dark pairs |
| `gate:brand-rules` | pass, 7 rules |
| `gate:manifest` | pass |
| `gate:csp` | pass, 10 files |
| `gate:storybook-build` | pass, 21 stories |
| `gate:axe` | pass, 42 runs, 0 serious or critical (10 excepted notes, pre-existing) |
| `gate:mutation --base 2427d20` | pass, 0 survivors |

Tasks: T001 to T009 are ticked and their work is present (`recheck-10.md` with `operator-decisions.md` and
`recheck-fixes.md`; `sibling-011.md` records 011 absent, so `tracking-caps` is added; the six records in `source.ts`
as plain records; CHANGELOG rows; `viewport()` in the interface and both drivers; `frames.css` as the one frame source,
adopted in process and linked same-origin, no `style` attribute; `tdd-exempt.md`). The exemption covers only T001 and
T002, which are records with no behaviour; it is justified. Constitution: no element source changed; the new tokens
use `--ocelle-` names; the fixture page loads no script and runs under the strict CSP with zero violations asserted.
Plan: R-16 and R-17 are followed. What fails is the token stories' baselines (R1-01).

## Earlier findings

None: this is round 1.
