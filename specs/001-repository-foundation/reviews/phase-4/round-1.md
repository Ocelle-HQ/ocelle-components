---
phase: 4
round: 1
verdict: changes_requested
base: 4df12b0823f1a777cf37c501271201fdf4daca64
head: e9dd35199085807dc2e2daf25b97098c6f31927b
tdd_check: pass
---

# Phase 4 review, round 1

Change under review: `git diff 4df12b0..e9dd351` (scaffold `0dca686`, red `19c872e`, green `b7950de`..`ed786c1`,
tdd-check evidence `e9dd351`). The working tree was clean.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/plants/pins/fail-caret-range/, gates/plants/pins/fail-tilde-range/; gates/bin/pins.ts:31, :244-252 | **CI check Plants is red** (run 41565348139, job 125685423491, exit 1): both plants exit 2, `ERR_PNPM_NO_OFFLINE_META: Failed to resolve jiti in package mirror …/metadata-full/…/jiti.jsonl`, so `plants: 2 problems in 135 plants`. I reproduced it locally: `pnpm_config_cache_dir=<empty dir> pnpm run gate:plants` gives the same 2 problems. With this machine's warm cache it gives 0 problems. Cause: the two plants' manifests depend on a registry package (`jiti`). In a fresh mini-workspace, pnpm's offline `install --frozen-lockfile --lockfile-only` needs that package's registry metadata. The metadata is in the cache only by accident: `setup:online` never resolves the plant's lockfile, and `cache.yml` does not save the metadata cache. The plants are not self-contained, so the plant job passes or fails depending on machine state. The other plants pass on an empty cache because they have no registry dependency, or because the lockfile verdict does not change their result. | The fix belongs in the **plants** (and, if that is not possible, in the pins gate's lockfile check). It does not belong in the setup action: there it would tie CI setup to plant contents, add network fetches for plant-only packages, and still not hold on a cold runner. Test first: add a red `gates-integration` case that runs `gates/bin/pins.ts --plant` on both plants with `pnpm_config_cache_dir` pointing at a new empty directory, expecting exit 1 with exactly the `range` finding. Then make the plants independent of registry metadata, for example a `^`/`~` range on a dependency whose resolution needs no registry. If no such plant can show the rule, decouple the gate's lockfile check from pnpm's metadata-dependent verification. That changes research.md R-14 and needs the operator. Either way, the plant job must pass with an empty pnpm cache. |
| R1-02 | blocking | .github/workflows/ci.yml:84-102 (mutation-shard); gates/bin/pins.ts | **FR-013 / SC-005 limit exceeded in CI.** The shard `gates/bin/mutation.ts,gates/bin/pins.ts` (496 changed lines by the plan; the orchestrator's message says "496 mutants", but the plan figure is lines) was **cancelled by `timeout-minutes: 10`** after 9 min 48 s of the gate step (job 125685646672). Locally, with the phase base, `gates/bin/pins.ts` alone took **594 s** on 4 vCPU (659 mutants on changed lines). That is within 6 s of the limit on a machine twice the size of the CI runner. The 500-line bound does not hold this file under 10 minutes: per research.md R-08, shard time is mutants × covering-test time / concurrency. | Make every shard of this pull request finish under 10 minutes on the CI runner without raising the limit (FR-013). For example, cut the covering-test time of the pins tests, or cut the mutant count of pins.ts (its hand-written YAML subset parser, pins.ts:38-104, produces most of its mutants and survivors; see R1-03). If the shard split itself must change (for example by estimated mutants instead of lines), that changes plan.md / research.md R-08 and needs the operator. Record a new timing of every shard in `mutation-shards.md`, measured against the pull request base. |
| R1-03 | blocking | gates/bin/pins.ts (94 survivors, 2 NoCoverage) | **Mutation: pins.ts.** Causes. (a) The YAML subset parser `scalar`/`flow`/`readYaml` (lines 39-104, about 55 survivors): quoted scalars, numbers, `null`/`~`, flow lists and maps, comments, indentation errors and unsupported lines have no in-process case. (b) Anchors and quantifiers of the version regexes, 47 Regex survivors in total, partly overlapping (a): exact version :29, `workspace:` :124, `packageManager` :145, `.node-version` :150, workspace globs :287. No case has junk before or after the version, or a multi-digit last segment. (c) The dependency loop: a non-object dependency field (:120) and `sibling !== undefined && workspace !== sibling` (:130). (d) Workspace discovery and root-manifest selection (:213-217, :285-291: the order, the root `package.json` filter, a pattern without `/*`). (e) Message and summary texts not asserted (:178, :185, :316). (f) Plant arguments (:275 empty `--plant`, :298 `plant.dir === ""`) and the swallowed `catch` (:234). | Add red-first tests that kill each class: per-regex cases with leading and trailing junk and multi-digit parts; YAML parser cases for each scalar and collection form and each error; exact message assertions. Or record true equivalents with a reason (FR-012). Replacing the hand-written YAML parser with a smaller one, or a tested library, is also acceptable if R-14's dependency rules allow it. |
| R1-04 | blocking | gates/bin/csp.ts (20 survivors) | **Mutation: csp.ts.** Causes. (a) Line mapping of markup inside template literals with substitutions (`templateParts` :133-140, `at` :180-181, 10 survivors): no case checks the reported line of a finding in a later quasi, or in a `NoSubstitutionTemplateLiteral`. (b) The `<style>` RAWTEXT mode (:33): no case with markup-looking text inside `<style>`. (c) `globalName` element access on a non-global object (:118, `obj["eval"](s)`) and `isStringy` on a non-string `+` (:127): no negative case. (d) Unflushed tokenizer end (:92, `write(markup, false)`): no case with markup that ends inside a tag. (e) The parse-error `cause` text and line (:164, :167). (f) The `withFindings` file count in the summary (:203). (g) `includes("<")` → `includes("")` at :174 and :177 looks equivalent: it only scans strings that hold no `<`, which give no finding. | Kill (a) to (f) with red-first in-process cases on `scanScript`/`scanMarkup`/`checkOutput`. Record (g) with a reason if it is equivalent. |
| R1-05 | blocking | gates/stylelint/token-only.ts (35 survivors, 2 NoCoverage) | **Mutation: token-only.ts.** (a) The allow and deny lists (:11-33): every `StringLiteral` survivor is a list entry that no case uses. That covers most named colours, several `unitless` properties, CSS-wide keywords and calc operators, so removing any one of them goes unnoticed. (b) The `var()` fallback split (:61-64: the comma, `div` and `inCalc` conditions): no case with a fallback that holds a comma or a nested function. (c) :77-78 and :94: branches no case reaches (NoCoverage). | A table test over every entry of each list (for example every named colour is raw; every `unitless` property allows a number and another property does not), plus fallback and calc cases that reach :61-64, :77-78 and :94. |
| R1-06 | blocking | gates/bin/plants.ts (25 survivors, 6 NoCoverage) | **Mutation: plants.ts decision logic.** These are in the pure judging part, not the process boundary: `plant.json` validation (:50, :89 a non-object and an array); output-line parsing (:151 `at <= 0`, :157 a line without `": "`); finding comparison and its message (:166-176, :206-207 `some` → `every`, a missing `message`); the mutation record filter (:186, :191); registry inputs missing (:229-231, NoCoverage); the registry finding paths (:238); and the plant and gate order (:280, :316 `.sort()`). | Red-first in-process cases on `judgePlant` / `plants()` with the in-memory tools for each. |
| R1-07 | blocking | gates/lib/plant-repo.ts (29 survivors, 5 NoCoverage); gates/lib/registry.ts (15); gates/lib/tsc-report.ts (11, 2 NoCoverage); gates/lib/stylelint-report.ts (7) | **Mutation: parsers of recorded text.** plant-repo.ts: `configurationName` anchors and alternatives (:48), `parseCommits` record split (:57), header parsing and validation (:64-85: an empty chunk, the author format, `parent` digits and order, the `merge` arity, an unknown header) and :148. registry.ts: `helperJobs` validation (:44, :54 `every` → `some`), the parsed entry shape (:66), `ciJobs` line handling (:83-93: comments, blank lines, the indent, the `jobs:` anchors and quoted keys) and :110. tsc-report.ts: diagnostic regex anchors and digit quantifiers (:27), the column (:34), continuation lines (:36), the not-installed detail (:39, :58, :60) and the `TS[56]\d{3}` end anchor (:65: `TS50000` is tested, `TS5000x` is not). stylelint-report.ts: error-line extraction (:54-61) and the rule-suffix strip (:85). | Red-first cases on recorded text for each. Some regex `$` removals after a greedy `.*` are true equivalents (for example plant-repo.ts:70 `(.*)$`): record those with a reason instead of testing them. |
| R1-08 | blocking | gates/bin/prefix.ts (4), gates/bin/signoff.ts (6, 1 NoCoverage), gates/bin/style-lint.ts (4 NoCoverage) | **Mutation: the remaining gates.** prefix.ts: `\s*` before the colon of a font declaration (:25, `font-family : monospace` untested), the finding message (:66) and the summary file count (:89). signoff.ts: git log record parsing (:36: the leading-newline strip, an empty hash, parent splitting), the `$` of the sign-off regex (:45; likely equivalent after a greedy `.*`, record it) and the stderr `trim` (:93). style-lint.ts:14: `styleGlobs`, the FR-024 scope, has no in-process coverage (only `run()` reads it). | Kill with in-process cases. For style-lint.ts:14, export the scope through a tested seam (assert the globs, or a pure `isStyleCovered(path)` with its cases), since scope decides the gate's result (R-08). |
| R1-09 | blocking | gates/bin/plants.ts:349-464 (43 records); gates/lib/plant-repo.ts:99-218 (47 records); gates/bin/csp.ts:224-228; gates/bin/prefix.ts:101-106 | **Equivalent-mutant records outside research.md R-08 (item 2 of the implementer's report).** R-08 kind 3 allows a record on a *thin adapter that only calls an outside tool, with no branch and no computation the gate's decision depends on*, and the record must **name the `gates-integration` case** that covers it. (a) Every plants.ts record (added or restructured in 7fbecda) gives "covered by the plant job itself: pnpm run gate:plants (CI check Plants)". That is not a `gates-integration` case, and no `gates/test/integration/` test runs `gates/bin/plants.ts`. Several of the recorded functions are not thin adapters: `lines()` (:349-351, filters output lines the verdict reads), `build()` (:362-374, branches on the plant form and removes `plant.json`), `limiter()` (:379-398, pure concurrency logic with branches and no tool), `runPlantIn` (:404-424, the `command === "node"` branch and the `PlantRun` shape), `filesBelow` (:429-433, path relativisation that decides which plants exist) and `realTools` (:438-451, directory filtering). (b) plant-repo.ts records name real `gates-integration` cases, but they sit on computation: `as()` (:108-111, parses `Name <email>` by regex), the parent computation `record.merge ?? [record.parent ?? index]` (:173), the ENOENT branches (:135, :159) and path slicing (:209). (c) csp.ts:226-227 and prefix.ts:103-106: the records cover the scope filters (`isBuiltOutput`, `isCovered`) and the path mapping. The named case cannot kill a mutant of those filters, because its fixture holds no out-of-scope file (`gates/test/fixtures/root/csp/tree/packages/elements/dist/*`, `…/root/prefix/tree/packages/elements/src/*`). | Move each piece of logic into the tested seam (R-09) with in-process tests: output-line splitting, plant-form dispatch, the limiter, path relativisation and selection, the identity parse, parent resolution, and the file selection of csp and prefix (for example a pure `selectFiles(paths)`). Keep records only on lines that are a pure tool call or the `import.meta.main` guard, and make each name a `gates-integration` file and test name that really runs that line. For the plant runner, either add such a case (for example running `gates/bin/plants.ts --root <tmp>` on a minimal plants tree) or get the operator to extend R-08 to name the plant job as the covering case. |
| R1-10 | blocking | gates/lib/mutation/report.ts:63; gates/plants/mutation/fail-no-test-runs/ | **Mutation gate: a change only to uncovered source gives "could not run" instead of a NoCoverage finding (item 5b).** I reproduced it with `fail-no-test-runs`, with `x.ts` made identical in `base/` and `head/` so the only source change is the new `y.ts` that no test imports: `mutation: could not run: Stryker wrote no report (No tests were executed. …)`, exit 2, after 9.6 s. FR-011 says a mutant on a line no test runs *survives*, and the gate *MUST report each survivor's location*. US2 scenario 3 says it "reports at least one surviving mutant with its location and fails". Exit 2 fails the check but reports no location, and it sends the author to fix configuration instead of writing a test. The phase 4 fail plant avoids the case by adding a checked change beside the uncovered file ("so the related tests run"). So the plant job does not prove the case FR-011 names. The code is from phase 3, but this phase's plant is what is supposed to prove it. | Test first: a red case (on recorded Stryker output in the `gates` project, and/or a `gates-integration` case on the reduced plant above) expecting exit 1 with a `NoCoverage` finding at `packages/tokens/src/y.ts:2`. Then make the gate report the changed lines' mutants as `NoCoverage` when Stryker ran no test, for example by detecting that case and taking the mutants from Stryker's instrumentation, or by keeping the dry run from aborting. Add or reshape a mutation fail plant so it holds the uncovered change alone. |
| R1-11 | blocking | gates/plants/mutation/error-dry-run-fails/plant.json; specs/001-repository-foundation/contracts/plants.md:38; gates/README.md:29 | **The breaking mutation plant deviates from the contract (item 3).** contracts/plants.md requires "a `--base` that does not resolve in the temporary repository". The plant is a failed dry run instead. The reason (the plant command always passes a resolvable base, and a plant carries only inputs) is recorded only in commit 9bc1085's message, not in the contract or any decision record, and gates/README.md already documents the deviation as fact. The substitute is a real "could not run" path (contracts/gate-cli.md:49 lists it), and an unresolvable base is tested in the gate's own tests (gates/test/mutation-shards.test.ts:150, gates/test/integration/mutation.test.ts:103). So FR-025's "at least one breaking plant" is met in substance, but the plan artefact and the implementation disagree. | Make them agree. Either amend the mutation row of contracts/plants.md, with the reason and the operator's approval (a contract set by the plan squad), or make the plant job able to present an unresolvable base, for example a documented `plant.json` field the plant runner substitutes for `{base}`, which contracts/plants.md's "no configuration" rule would also need to allow. |

Notes (not blocking):

| ID | Severity | Where | Finding | Suggestion |
|----|----------|-------|---------|------------|
| R1-12 | note | gates/plants/pins/fail-workspace-version-differs/plant.json (item 4) | The plant expects two findings (`workspace` and `lockfile`). Both are true: pnpm cannot resolve `workspace:0.0.1` against a sibling at 0.0.0, so no lockfile can match, and the `why` says so. contracts/plants.md:5 lets a fail plant list exactly the findings the gate must report. It passes on an empty pnpm cache too (checked). Acceptable. | None. |
| R1-13 | note | gates/lib/eslint-report.ts:56; gates/bin/test-lint.ts (item 5a) | On a tree with no test code, test-lint exits 2: `test-lint: could not run: ESLint exited 2 (Oops! Something went wrong! :(); check the ESLint configuration` (reproduced). Failing closed is consistent with FR-004's zero-test rule, and the repository always has test code. But the message names a configuration problem instead of "no test file found". | Optionally name the real cause in the message (test first). |
| R1-14 | note | specs/001-repository-foundation/tasks.md:203 (T083); research.md:121-122 (item 7) | T083 names `npm_config_store_dir`. research.md R-04 (lines 121-122) already records that pnpm 12 reads `pnpm_config_store_dir` and ignores the npm form. T083's own fallback ("otherwise set the store directory another way pnpm 12 reads … and check again") was followed, and sc-001-timing.md records both store checks. Only T083's wording is stale. The early timing (86.5 s) leaves out the Chromium download, because the sandbox blocks cdn.playwright.dev (operator override R-03). SC-001 is still measured on the CI runner in the operator's verification. | Fix T083's wording when tasks.md is next edited. |
| R1-15 | note | .github/workflows/ci.yml:107-123 (item 8) | The `mutation` verdict job runs the full shared setup only to compare `needs` results. contracts/ci-checks.md ("Every job: checkout …, `pnpm run setup:online`") requires this, so it conforms. It costs a setup per run and makes the verdict depend on setup succeeding (which fails closed). | A leaner verdict job would need a contract change. |
| R1-16 | note | .github/workflows/ci.yml:102, :81 | `${{ matrix.shard.files }}` and `${{ github.event.pull_request.base.sha }}` are put into `run:` scripts directly. Shard files are repository paths from the pull request, so a crafted file name can inject shell into the shard job. The impact is limited (`contents: read`, no secret, `persist-credentials: false`), but passing values through `env:` is the usual hardening (research.md R-16 spirit). | Pass through `env:` and quote. |
| R1-17 | note | gates/bin/pins.ts:31 | Related to R1-01: the real `gate:pins` on this repository also exits 2 with an empty pnpm metadata cache (`Failed to resolve @eslint/js …`, reproduced). In CI it passes only because `setup:online` has just verified the same lockfile. A contributor who runs `gate:pins` after clearing pnpm's cache gets "could not run". | Consider this when deciding R1-01's fix, and document it in quickstart or the gate's message. |
| R1-18 | note | .github (item 9) | The orchestrator checked the pinned action SHAs against the upstream tags with `git ls-remote`: checkout v7.0.1 `3d3c42e`, setup-node v7.0.0 `8207627`, pnpm/action-setup v6.1.0 `ea17c68`, cache v6.1.0 `55cc834`, all matching. I have no GitHub access and did not re-check them. The SHAs in .github/actions/setup/action.yml, ci.yml and cache.yml are those four. | None. |

## Test quality

- **Red evidence.** The red commit `19c872e` changes only test files and test fixtures (72 files under `gates/test/`),
  plus three code-lint fixes in earlier test files that its message explains. `red-phase.log`: 395 of 588 tests
  failed, and all 395 failures are `AssertionError`s. There is no import, syntax or setup error; the base run's load
  error (`check-final-tests-on-base.log`, missing `gates/lib/plant-repo.ts`) is the expected exit 2 on the base,
  not the red run. T063's record is in `red-evidence.md`: T062's `lint` and `style-lint` cases fail on their
  existence assertions for `eslint.config.ts` and `stylelint.config.ts` (`red-phase.log` lines 38-41). Those
  configurations are this phase's missing behaviour (research.md R-05, R-07), not a setup error. The other five
  T062 gates fail on the missing exit code (lines 36-37, 42-49). I accept this under constitution VIII.
- **Scaffold** `0dca686`: signatures only. Each `run()` returns 0, decision functions return empty values, the
  plugin reports nothing, and no test file is touched. tdd-check: final tests on the scaffold exit 1 (assertions),
  and on the base exit 2.
- **No test weakened after red (implementer restart).** `git diff --stat 19c872e..HEAD` on the test pathspecs,
  excluding `gates/plants/`, is empty, and `--diff-filter=MD` on the test pathspecs is empty. Every test-path change
  after the red commit is a plant added under `gates/plants/` (FR-025, plants arrive with green). No test written in
  the red step changed. This confirms the second run's claim.
- **Assertions.** I read tsc-report, stylelint-report, token-only and registry tests in full and scanned all phase 4
  tests. They assert exact `toEqual` results on the units' outputs: findings with location, rule, message and summary
  text, exit codes, and real git and file-system state in the integration tests. There is no `skip`/`only`/`todo`,
  no snapshot, no assertion in a conditional and no swallowed failure, and `gate:test-lint` passes on all 35 test
  files. "Control" values next to negative cases make the pass assertions able to fail. US3 scenarios 1-9 each have
  tests or plants: the registry check (1), token-only and the style-lint plants (2), csp (3), prefix (4, 5), signoff
  (6), plants.test.ts and the plant job (7, 9), and the gate configurations ignoring `gates/plants/**` (8).
- **Mutation (my run).** `pnpm run gate:mutation -- --base 4df12b0 --plan` gives 6 shards. I ran each with
  `--files`, one after another, on this 4-vCPU sandbox:

  | Shard | Files | Exit | Findings | Mutants on changed lines | Time |
  |---|---|---|---|---|---|
  | 1 | csp.ts, lint.ts | 1 | 20 (csp) | 306 | 258 s |
  | 2 | pins.ts | 1 | 94 | 659 | 594 s |
  | 3 | plants.ts | 1 | 25 | 559 | 443 s |
  | 4 | prefix, signoff, style-lint, test.ts, typecheck | 1 | 14 (prefix 4, signoff 6, style-lint 4) | 313 | 134 s |
  | 5 | plant-repo, registry, stylelint-report | 1 | 51 (29, 15, 7) | 596 | 196 s |
  | 6 | tsc-report, token-only | 1 | 46 (11, 35) | 278 | 177 s |

  **250 findings** (43 of them `NoCoverage`). This equals the implementer's 258 (mutation-shards.log, measured
  against the phase 1 base) minus the 8 plants.ts boundary lines that 7fbecda moved under records. Each finding is
  blocking unless it is recorded as a true equivalent. R1-03 to R1-08 group them by file and cause, and R1-09 judges
  the records. The report listed 136 equivalent-mutant records in the changed files. The single-mutator records
  with specific reasons (for example stylelint-report.ts:43, an empty catch leaving `value` undefined) are sound.
  The `all: process boundary` records on tool calls and `import.meta.main` guards in typecheck, lint, style-lint,
  signoff and pins name a real `gates-integration` case and are acceptable. The exceptions are in R1-09.
- **CI mutation (run 41565348139).** The shard `mutation.ts`+`pins.ts` was cancelled at the 10-minute limit
  (R1-02). The shards for plants.ts, prefix/setup-offline/signoff/style-lint/test-lint,
  plant-repo/registry/spawn/stylelint-report, config-copies/csp/lint and tsc-report/vitest-report/token-only+packages
  failed on survivors. eslint-report/findings/mutation-lib and test/typecheck/eslint-rules/cli passed. The
  `Mutation testing` verdict job failed, as it should.

## Checks run

Local (PATH=/opt/node26/bin, `OCELLE_CHROMIUM_PATH` override per research.md R-03):

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 72 files, no finding |
| `gate:style-lint` | exit 0, 1 file, no finding |
| `gate:test-lint` | exit 0, 35 files, no finding |
| `gate:unit-tests` (= `pnpm test`) | exit 0, 588 tests in 33 files, 33 s |
| `pnpm -r build` then `gate:csp` / `gate:prefix` | exit 0 / exit 0 (3 and 19 files) |
| `gate:config-copies` | exit 0 |
| `gate:pins` | exit 0 (warm cache); exit 2 with an empty pnpm cache (R1-17) |
| `gate:signoff -- --range 4df12b0..HEAD` | exit 0, 15 commits |
| `gate:plants` | exit 0, 135 plants, 1 min 42 s (warm cache); **exit 1, 2 problems with an empty pnpm cache** (R1-01) |
| `gate:mutation -- --base 4df12b0` (6 shards) | **exit 1, 250 findings** (R1-03 to R1-08) |
| tdd-check.json | `pass` (red exit 1, final tests on base exit 2, on scaffold exit 1, head exit 0) |

CI, run 41565348139 of ci.yml on draft PR #18, head ed786c1 (orchestrator's report):

- success: Typecheck, Code lint, Style lint, Unit tests (45 s), Test lint, Story config copies, Install and pins,
  Content security, Prefix, Sign-off (range bdb9b70..ed786c1), Mutation plan (8 shards).
- **failure: Plants** (job 125685423491, 1 min 45 s): `gates/plants/pins/fail-caret-range` and `fail-tilde-range`
  not caught (exit 2, `ERR_PNPM_NO_OFFLINE_META` for jiti); `plants: 2 problems in 135 plants` (R1-01).
- **Mutation shards:** `mutation.ts`+`pins.ts` **cancelled** by `timeout-minutes: 10` after 9 min 48 s of the gate
  step (job 125685646672; R1-02). Failed on survivors: plants.ts (8 min 23 s, job 125685646678),
  prefix/setup-offline/signoff/style-lint/test-lint (3 min 22 s), plant-repo/registry/spawn/stylelint-report
  (3 min 34 s), config-copies/csp/lint (7 min 14 s), tsc-report/vitest-report/token-only+packages (3 min 22 s).
  Passed: eslint-report/findings/mutation lib (5 min 10 s), test/typecheck/no-snapshot-only/unchecked-expect/cli
  (2 min 37 s).
- **failure: Mutation testing** (verdict job), correctly, given the failed and cancelled shards.

Tasks: every task of `## Phase 4` (T051-T083, T092) is ticked, and its work is present (gate entries, registry,
plants under `gates/plants/<id>/` for all 11 gates and the registry, ci.yml, cache.yml, the shared setup action,
gates/README.md with the twelve check names and the deferred gates of FR-026, and the timing records). Changes
outside the phase are small code-lint fixes needed by the new code lint (`env.OCELLE_CHROMIUM_PATH` dot notation in
gates/bin/test.ts and vitest.config.ts, an optional chain in vitest.mutation.config.ts, three test files in the red
commit), with reasons in the commit messages. Constitution: the CI security rules of R-16 hold (`contents: read`,
`persist-credentials: false`, no secrets, SHA-pinned actions; see R1-16 for hardening). Plants use `example.com`
identities (FR-034). Principle VIII's mutation rule and its "gates are proven" rule are where this phase fails: see
R1-01 to R1-11.

## Earlier findings

None: this is round 1 of phase 4.
