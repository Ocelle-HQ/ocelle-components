# Phase 2, round 2 fixes (label `fix-1`)

Review: `reviews/phase-2/round-2.md` (operator round from the landing review, landing L1-02, L1-03, L1-07).
Tasks T075 to T080. Red commit `1fa843d` (`test(006-storybook-workbench): phase 2 fix-1 red — O2-01, O2-02, O2-03`),
recorded by `red.sh 2 fix-1` (`"recorded": true`, exit 1, log `red-fix-1.log`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed | `gates/test/storybook-build.test.ts` "reads a Vite error's location whose line and column have two or more digits" (T075; passes at the red commit as the task expects, its red evidence is the mutation run below: `/╭─\[ (\S+?):\d:\d+ \]/` and `/╭─\[ (\S+?):\d+:\d \]/` Killed) | test only, no source change |
| O2-02 | fixed | `gates/test/storybook-build.test.ts` "could not run when Storybook cannot evaluate storybook/.storybook/main.ts (config-unreadable)", "(config-unreadable-unicode)", "could not run when a signal ended the build, whether or not its output names a file", "could not run, and does not read the index, when Storybook cannot evaluate storybook/.storybook/main.ts"; `gates/test/integration/storybook-build.test.ts` "exits 2 and prints no finding when Storybook cannot evaluate storybook/.storybook/main.ts" (T077; all five red at `1fa843d`, each an assertion mismatch: exit 1 with a finding at `storybook/package.json` where exit 2 is expected) | `gates/lib/storybook-build.ts` (`failedRunProblem`, called by `classifyBuild` before `buildFindings`; signal wording removed from `buildFindings`; header comment), plant `gates/plants/storybook-build/error-config-unreadable/`, `gates/README.md` `storybook-build` row, fixtures `gates/test/fixtures/storybook-build/config-unreadable{,-unicode}/` and `gates/test/fixtures/storybook-build-roots/config-unreadable/` |
| O2-03 | fixed | `gates/test/storybook-build.test.ts` "strips a line mark only at the start of a line: …", "strips a line mark only before two spaces or the line end: …", "reads an indexer error only from an Unable to index line that ends at its colon", "starts a Vite message only at a line that begins with [<code>]" (T076; pass at the red commit as the task expects, red evidence is the mutation run below: each mutant Killed, not Timeout) | test only, no source change |

## O2-02: the replaced test

The `exitCode: null` half of `buildFindings`' "places a failed build that names no file at storybook/package.json,
with its exit code or the signal" was replaced in the red commit (its body says so) by the stricter `classifyBuild` case
"could not run when a signal ended the build, whether or not its output names a file" (exit 2, cause
`storybook-build: could not run: the build was ended by a signal`, also with output that names a file). Reason: landing
L1-03, FR-001 and the operator's choice (a): a build ended by a signal could not run, so it is no finding. The
exit-code half stays as "places a failed build that names no file at storybook/package.json, with its exit code".

The unreadable configuration is recognised by a cleaned output line holding `MainFileEvaluationError`; the cause quotes
that line: `storybook-build: could not run: storybook/.storybook/main.ts cannot be evaluated (SB_CORE-SERVER_0007
(MainFileEvaluationError): Storybook couldn't)`. The check comes before any finding, so the same output with a located
Vite error before it is still exit 2. The `visual` and `axe` gates build through `storybookBuild` and keep their own
cause on any non-zero exit (`gates/lib/visual-host.ts` `buildStories`), unchanged.

## Checks (T080)

- `pnpm test`: `unit-tests: 3099 tests passed in 138 files`.
- `pnpm run gate:typecheck`: no type error. `gate:lint`: 263 files, no finding. `gate:test-lint`: 173 files, no finding.
- `pnpm run gate:storybook-build`: exit 0, `storybook-build: built 21 stories`.
- Plants, `OCELLE_VISUAL_ENGINE=docker`, one shard at a time: shard 1 (`storybook-build/error-config-unreadable`,
  `fail-empty-index`, `fail-unresolved-import`), shard 2 (`error-missing-dependencies`, `fail-not-csf`,
  `pass-repository`), shard 3 (`error-no-build-script`, `fail-syntax-error`, `pass-type-error-only`): each
  `76 plants judged, every plant as expected`. `--verdict storybook/.visual/plant-shards` over these three reports
  finds no problem in them and exits 2 only for shards 4 to 27, which this round did not run ("reported no result").
- `pnpm run gate:mutation -- --base 1fa843d` (before the green commit):
  `mutation: 21 mutants on the changed lines of 1 file, none survived; 0 timeouts, 3 compile errors, 0 zero-mutant entries; 0 equivalent records`.
- Landing shard 92 again, `pnpm run gate:mutation -- --base 476602e --files gates/lib/storybook-build.ts:71-117` (the
  `controls` regex at :71 to the end of `buildFindings` at :117):
  `mutation: 80 mutants on the changed lines of 1 file, none survived; 0 timeouts, 27 compile errors, 0 zero-mutant entries; 0 equivalent records`.
  53 Killed, 27 CompileError. The five mutants of the landing log, at their new lines (from
  `reports/mutation/mutation.json`):
  - `:83` (was `:81`) `/╭─\[ (\S+?):\d:\d+ \]/`: Killed;
  - `:77` (was `:75`) `/[|!xoT•—│┌└◇●■▲](?: {2}|$)/`: Killed;
  - `:77` (was `:75`) `/^[|!xoT•—│┌└◇●■▲](?: |$)/`: Killed;
  - `:79` (was `:77`) `/Unable to index \.\/(\S+):/`: Killed;
  - `:81` (was `:79`) `/\[[^\]]+\] /`: Killed.

  No other timeout line: the run has none.
