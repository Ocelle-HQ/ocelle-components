---
phase: 4
round: 2
verdict: approved
base: 4df12b0823f1a777cf37c501271201fdf4daca64
head: 2dc6d9a665f6f7a896456ee12e312b09ef906c44
tdd_check: pass
---

# Phase 4 review, round 2

Change under review: `git diff 4df12b0..2dc6d9a`. Since round 1 (`3f37297`) it adds the red commit `0b8658b`
(fix-1), the fix commits `9d84b2e`..`2ec00e1`, and the orchestrator's tdd-check evidence `2dc6d9a`. The working tree
was clean before and after my runs. I checked each round 1 finding against the code, the tests and my own runs, not
only against `round-1-fixes.md`.

## Findings

No blocking finding. Notes:

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/001-repository-foundation/reviews/phase-4/mutation-shards.md:92-95 | The record says the local timings "leave a margin of more than half the 10-minute limit". CI run 4 (41583193450, head 2dc6d9a) shows otherwise. Gate steps take 4:45 to 8:18, so CI is 1.5 to 3.4 times slower than the sandbox. The longest shard, `plants/prefix/setup-offline` (8:18, about 8:48 for the whole job), is 3.4 times its local 147 s. FR-013 and SC-005 ask for each shard to finish under 10 minutes on the CI runner, with a timeout that ends as a failure. All 9 shards did, and `timeout-minutes: 10` (ci.yml:89) still fails closed. So R1-02's required change is met. The margin on the longest shard is about 12 to 17 %, not 50 %. | Record the CI run 4 shard durations in `mutation-shards.md` and correct the margin sentence when that file is next edited. If a later push cancels a shard at the limit, look first at why `plants/prefix/setup-offline` is so much slower on CI than locally. |
| R2-02 | note | specs/001-repository-foundation/data-model.md:22-28; contracts/plants.md:3-4; gates/lib/plant-judge.ts:30, :93-95 | The new optional `plant.json` field `base` (R1-11) is checked strictly by `parsePlant` and documented in gates/README.md. It is missing from the field lists of data-model.md § Plant and contracts/plants.md. The behaviour now matches the contract's mutation row ("a `--base` that does not resolve"). The contract's no-configuration rule names configuration *files*, which `base` is not, so I accept that the rule allows the field. Only the field lists are out of date, and the implementer may not edit those plan artefacts. | Operator: add `base` (optional; the value given to the gate as `{base}` in place of the base commit) to data-model.md § Plant and to the field list in contracts/plants.md:3. |
| R2-03 | note | gates/test/integration/pins-plants.test.ts | The R1-01 case reads `gates/plants/pins/fail-{caret,tilde}-range` itself instead of a fixture under `gates/test/fixtures/`. research.md R-08 (lines 297-300) puts tests that run "the plant job on plants" in `gates-integration`, and round 1 asked for this case. It copies each plant to a temporary directory and asserts the exact exit code, line count, summary and finding shape, with `pnpm_config_cache_dir` on a new empty directory. | None. |
| R2-04 | note | gates/lib/mutation/coverage.ts:10-13 | The R1-10 preload depends on two internals of StrykerJS 10.1.1: the `__stryker__` global and the record shape `{ static: {}, perTest: {} }`. Stryker is pinned exactly (FR-027). If those internals change, the uncovered mutants come back as `Survived`, which still fails the gate (exit 1). The integration case `mutation.test.ts` "reports a change only to source no test imports …" asserts the exact `NoCoverage` line, so an upgrade breaks a test and is caught. | When Stryker is upgraded, re-run that case (already in `pnpm test`). |
| R2-05 | note | stryker.config.json:8 | `concurrency: 8` is fixed. On the 4-vCPU CI runner it gives two checker processes per core, which is the intended setting. On a 2-vCPU contributor machine it oversubscribes the cores. That affects speed, not results. | Optional: derive it from the core count later. |

## Test quality

- **Red evidence (fix-1).** `0b8658b` adds or changes only tests and test fixtures. `red-fix-1.log`: exit 1, 6 of 594
  tests fail, every one an `AssertionError` on missing behaviour. R1-10: exit 2 "No tests were executed" instead of
  the NoCoverage finding. R1-01: exit 2 on the cold cache, for both plants. R1-09/R1-11: the plant job gives 32
  lines, not 30. R1-11: `parsePlant` says "unknown key base", and the job exits 1 because the base is not passed on.
  None of these is a setup error. `tdd-check.json`: `pass`; phase red exit 1, fix-1 red exit 1, head exit 0.
  `final_tests_on_scaffold_exit` is now 2 (round 1: 1). The final tests import modules this round created (for
  example `gates/lib/entries.ts`, `check-final-tests-on-scaffold.log`), so they fail to load against the scaffold.
  That is still a failure, and it is expected after a fix round that adds modules.
- **No weakening.** `git diff 3f37297..HEAD --diff-filter=MD -- gates/test` touches two files. Both changes only add
  to them: `integration/mutation.test.ts` gets a fixture-name parameter on `mutationRepo` plus one case, and
  `plants.test.ts` records the spec passed to `runPlant` plus two cases. `git diff 0b8658b..HEAD -- gates/test` only
  adds files. No assertion was removed or loosened. The two plant directories changed in place are R1-01's required
  change (`fail-caret-range`, `fail-tilde-range`: a linked `vendor/x`, the expected finding unchanged) and R1-10's
  (`fail-no-test-runs`: `x.ts` and its test are now identical in `base/` and `head/`, and `y.ts` alone is new).
- **Assertions.** I read the new tests: plant-runner, pins-plants, integration/plants, and parts of pins-gate,
  pins-rules, workspace-yaml, registry-parts and plant-repo-parts. I also grepped every added test line for
  conditionals, `try`, `skip`/`only`, snapshots and weak matchers. The tests assert exact `toEqual` values on unit
  output, recorded tool calls (the plant runner's doubles record temp dir, builder, command and cleanup order), and
  exit, stdout and stderr of real gate runs. The `try` blocks are helpers that produce an expected value
  (`jsonError`) or a thrown error that is then asserted; none swallows a failure. `gate:test-lint` passes on all 53
  test files.
- **Mutation (my run).** I ran `pnpm run gate:mutation -- --base 4df12b0 --plan`, which gives 5 shards, then each
  shard with `--files`, one after another, on this 4-vCPU sandbox. Every shard exited 0 with none survived:

  | Shard | Mutants on changed lines | Records | Time |
  |---|---|---|---|
  | csp, lint, mutation, pins (bin) | 465 | 22 | 271 s |
  | plants, prefix, signoff | 452 | 32 | 224 s |
  | style-lint, test, typecheck, entries, mutation/coverage, pins-rules, plant-judge | 656 | 17 | 369 s |
  | plant-repo, plant-runner, registry | 531 | 40 | 339 s |
  | stylelint-report, tsc-report, workspace-yaml, token-only | 497 | 1 | 254 s |

  That is 2601 mutants, 0 survivors and 0 NoCoverage. I read every record in the changed code. Seven records are
  equivalent-mutant reasons, and I accept each:
  - csp.ts:93: the last-chunk flag.
  - csp.ts:185: the diagnostic-chain separator.
  - csp.ts:194 and :198: the `includes("<")` pre-checks, which only skip work.
  - plants.ts:55: the stdout of a broken registry run, which the verdict does not read for exit 2.
  - pins-rules.ts:114: an empty catch, where the level check skips `undefined` anyway.
  - stylelint-report.ts:43: from phase 3.

  The rest are `all: process boundary` records. Each sits on a line that only calls a tool: fs, git, pnpm, a child
  process or Stryker, or the `import.meta.main` guard. Each names a `gates-integration` file and test that exists and
  runs that line. The logic round 1 found under records has moved into tested seams:
  - output lines, plant values, the limiter and the builder dispatch: `plant-runner.ts`;
  - directory names and file paths: `entries.ts`;
  - `identityEnv`, `parentRecords`, `recordsOf` and `packagePaths`: `plant-repo.ts`;
  - the file selection of csp and prefix: `selectOutput` and `selectCovered`.

  Records are within R-08 kind 3 (R1-09).
- **CI mutation (run 4, orchestrator's report).** All 9 shards against the PR base `bdb9b70` and the `Mutation testing`
  verdict job succeeded (see R2-01 for the timings).
- **Acceptance scenarios.** US3 scenarios 1-9 remain covered as in round 1. In addition, the case FR-011 names, a
  changed line no test runs, is now proven alone by `fail-no-test-runs` and by the integration case on fixture
  `mutation-uncovered`. The breaking mutation plant now presents an unresolvable `--base`, as the contract asks.

## Checks run

Local, `PATH=/opt/node26/bin`, with `OCELLE_CHROMIUM_PATH` set (research.md R-03 override), at 2dc6d9a:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 96 files, no finding |
| `gate:style-lint` | exit 0, 1 file, no finding |
| `gate:test-lint` | exit 0, 53 files, no finding |
| `gate:unit-tests` (`pnpm test`) | exit 0, 1100 tests in 51 files (includes the R1-01, R1-09/R1-11 and R1-10 integration cases) |
| `gate:config-copies` | exit 0 |
| `gate:pins` | exit 0, 4 manifests |
| `pnpm -r build`, then `gate:csp`, `gate:prefix` | exit 0 (3 files), exit 0 (19 files) |
| `gate:signoff -- --range bdb9b70..HEAD` | exit 0, 116 commits |
| `gate:plants` with `pnpm_config_cache_dir` on a new empty directory | **exit 0, 136 plants of 11 gates and the registry, every plant as expected** (2 min 13 s); the cache directory stayed empty |
| `gate:mutation -- --base 4df12b0`, 5 shards | every shard exit 0, no survivor (table above) |
| tdd-check.json | `pass` |

CI run 4 (41583193450, head 2dc6d9a, PR #18), from the orchestrator's report. All 22 jobs succeeded: install and
pins, typecheck, code lint, style lint, test lint, unit tests, config copies, sign-off, prefix, content security,
plants, mutation plan, 9 mutation shards (4:45 to 8:18 gate step) and Mutation testing. Run 3 was cancelled by the
later push, not by a failure.

Tasks: all 34 tasks of `## Phase 4` are still ticked. The fix commits change only files that the round 1 findings
name or that the fixes need: `gates/`, the plants, `stryker.config.json` (`concurrency`, `vitest.related`), `ci.yml`
(R1-16) and the review evidence. Each change has a reason in its commit message. No plan artefact changed (see
R2-02).

## Earlier findings

| ID | Status | Evidence |
|---|---|---|
| R1-01 | resolved | Each plant now depends on its own `vendor/x` through a `pnpm-workspace.yaml` override `link:vendor/x` (an input, not a configuration file). It keeps the `^1.0.0` / `~1.0.0` range in `package.json`, and its lockfile needs no registry metadata. Red-first case `integration/pins-plants.test.ts` runs both plants on an empty `pnpm_config_cache_dir`: red exit 2, now exit 1 with exactly the `range` finding. `gate:plants` on an empty cache: exit 0 (my run). CI Plants: success. The pins gate and R-14 are unchanged. |
| R1-02 | resolved | The pins gate is split into `gates/bin/pins.ts`, `gates/lib/pins-rules.ts` and `gates/lib/workspace-yaml.ts`, with `concurrency: 8`. The shard bound is unchanged. CI run 4: every shard passed within `timeout-minutes: 10` on the runner. The shard `mutation.ts,pins.ts` that was cancelled now takes 4:48, against 9:48+ before. FR-013/SC-005 are met. The margin is smaller than the fix note claims (R2-01). |
| R1-03 | resolved | pins survivors: none in my run (shards 1 and 3). The YAML subset is rewritten in `workspace-yaml.ts` and tested by `workspace-yaml.test.ts`. Regex edges, dependency fields, discovery, messages and `--plant` forms are tested in `pins-rules.test.ts` and `pins-gate.test.ts`. One reasoned record (pins-rules.ts:114). |
| R1-04 | resolved | csp.ts: no survivor. `csp-parts.test.ts` covers lines across template parts, `<style>` raw text, element access, the parse-error cause and the summary count. Records :93, :185, :194 and :198 have sound reasons. |
| R1-05 | resolved | token-only.ts: no survivor. `token-only-parts.test.ts` has table tests over every list entry, plus fallback and calc cases. |
| R1-06 | resolved | The judging logic moved unchanged to `gates/lib/plant-judge.ts`, with `plant-judge.test.ts` and `plants-job.test.ts`. No survivor. |
| R1-07 | resolved | plant-repo, registry, tsc-report and stylelint-report: no survivor. New `*-parts` tests. Equivalent `$`/`^` anchors were removed rather than recorded. |
| R1-08 | resolved | prefix, signoff and style-lint: no survivor. `styleGlobs` is asserted in `style-lint.test.ts`. |
| R1-09 | resolved | The plants.ts records now sit only on tool-call lines in `runnerTools`/`realTools`/`run`/the main guard. Each names `integration/plants.test.ts` "plants --root <tmp> runs each plant form through its gate and judges it". That case runs all four plant forms and two registry plants through `gates/bin/plants.ts` and asserts its exact output. The logic moved to `plant-runner.ts` and `entries.ts` (tested). The plant-repo.ts and csp/prefix records follow the same pattern (Test quality). |
| R1-10 | resolved | `strykerEnv` preloads the empty coverage record, and `vitest.related: false` is set. The red-first integration case on fixture `mutation-uncovered` now expects exit 1 with `packages/tokens/src/y.ts:2: mutation: StringLiteral: NoCoverage`. `fail-no-test-runs` holds the uncovered change alone and passes in the plant job. |
| R1-11 | resolved | The new breaking plant `mutation/error-unresolvable-base` presents `refs/heads/no-such-base` through `plant.json` `base`, which `plantValues` substitutes for `{base}`. This is tested in process and end to end. The contract's mutation row now matches. `error-dry-run-fails` remains as a second breaking plant. The plan-artefact field lists lag behind (R2-02, operator). |
| R1-16 (note) | done | ci.yml passes the base, head and shard file list through `env:`, quoted. |
| R1-12-R1-15, R1-17, R1-18 (notes) | unchanged | As in round 1. The T083 wording (R1-14) is still for the next tasks.md edit. |
