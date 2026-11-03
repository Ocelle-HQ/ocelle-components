# Tasks: Repository Foundation

**Input**: Design documents from `specs/001-repository-foundation/` (plan.md, spec.md, research.md, data-model.md,
contracts/, quickstart.md), as approved at the plan gate on 2026-11-02.

**Tests**: required. Constitution Principle VIII (test-first, proven non-vacuous) applies to every phase except the
exempt bootstrap. Each phase runs through the story workflow: `base.sh`, an optional scaffold (`scaffold.sh`), one
red commit (`red.sh`), green, then the automatic red/green check and an independent review.

**Organization**: one phase per unit of review. Phase 1 is the exempt bootstrap; phases 2 to 5 are user stories 1 to 4
in priority order (plan.md § Phases). There is no separate polish phase: cross-cutting work (registry, CI, README)
belongs to US3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US4)
- Paths are relative to the repository root.

---

## Phase 1: Setup (Bootstrap, exempt)

**Purpose**: install, the three package skeletons, plain test and setup wiring, and the story configuration. No
behaviour of its own and no red commit: write `specs/001-repository-foundation/reviews/phase-1/tdd-exempt.md`
(plan.md § Complexity Tracking, first row). Exact versions: plan.md § Technical Context and research.md R-01 to R-08.

- [X] T001 Write `specs/001-repository-foundation/reviews/phase-1/tdd-exempt.md` stating why no test can fail for the bootstrap (no runner exists before it) and listing exactly what the phase adds (the files of T002 to T013)
- [X] T002 Create root `package.json`: `"private": true`, `packageManager` `pnpm@12.16.1`, `engines` node `26.13.0` and pnpm `12.16.1`, every dev dependency of plan.md § Technical Context at its exact version (Vitest and `@vitest/browser-playwright` 5.0.5, ESLint 10.13.0, typescript-eslint 8.72.0, `@types/node` 26.6.5, Vite 8.3.5, jiti 2.7.0, postcss 8.5.31, postcss-value-parser 4.2.0, parse5 8.0.1 and the rest as research.md lists), and scripts `test` = `vitest run`, `setup:online` = `pnpm install --frozen-lockfile && pnpm exec playwright install chromium`, `setup:offline` = `pnpm install --frozen-lockfile --offline` (plain wiring; phase 2 replaces `test` and `setup:offline`)
- [X] T003 [P] Create `pnpm-workspace.yaml` with `packages: ["packages/*"]`, `minimumReleaseAge: 10080`, the strict release-age setting and an empty `allowBuilds` (research.md R-04, operator decisions A11Y-SECURITY-1-005 (a) and FRESH-3-006 (b))
- [X] T004 [P] Create `.node-version` containing `26.13.0`
- [X] T005 [P] Create `.gitignore` with `node_modules/`, `packages/*/dist/`, `.stryker-tmp/`, `reports/`, `__screenshots__/`, `*.tsbuildinfo` (root paths only, so plants may track `dist/`; contracts/plants.md)
- [X] T006 [P] Create `tsconfig.base.json` with the compiler options of plan.md § Technical Context and research.md R-02 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, the options that let Node 26 run `.ts` gate scripts directly)
- [X] T007 Create root `tsconfig.json` extending `tsconfig.base.json`, `noEmit`, including all repository TypeScript and excluding `gates/plants/**`, `gates/test/fixtures/**`, `node_modules` and `packages/*/dist` (FR-028)
- [X] T008 [P] Create `packages/tokens/` skeleton: `package.json` (`@ocelle/tokens`, version `0.0.0`, private, no runtime dependency, `build` with `tsc`), `tsconfig.json` (extends the base, explicit `rootDir` `src`, `outDir` `dist`), `src/index.ts` exporting nothing
- [X] T009 [P] Create `packages/styles/` skeleton the same way (`@ocelle/styles`)
- [X] T010 [P] Create `packages/elements/` skeleton the same way (`@ocelle/elements`)
- [X] T011 Create `vitest.config.ts` with the five projects of research.md R-03: `tokens`, `styles`, `gates` (Node), `elements` (browser mode, `@vitest/browser-playwright`, Chromium only, headless), `gates-integration` (Node, `gates/test/integration/`), each excluding `gates/plants/**` and `gates/test/fixtures/**`
- [X] T012 [P] Add one passing sample test per package, `packages/tokens/test/sample.test.ts`, `packages/styles/test/sample.test.ts`, `packages/elements/test/sample.test.ts`, each asserting something true about its package (FR-009: passing samples may live in a package)
- [X] T013 Create the lockfile with a non-frozen `pnpm install` (no lockfile exists yet, so the frozen install of `setup:online` would fail) and commit `pnpm-lock.yaml`; then run `pnpm run setup:online` (frozen install and Chromium) and confirm `git status --porcelain` is empty (no tracked file changed), and run `pnpm test` (exit 0)
  - Note (operator decision, human:jeroennouwsdev, 2026-11-02): `pnpm exec playwright install chromium` cannot run in this environment (its network policy denies `cdn.playwright.dev`), so `setup:online` was not completed here; `pnpm test` was run with the optional `OCELLE_CHROMIUM_PATH` override (research.md R-03) pointing at the preinstalled headless Chromium under `/opt/pw-browsers` (build 1243) and exited 0, elements in Chromium.
- [X] T014 Set `test_command: "pnpm test"` and `setup_command: "pnpm run setup:offline"` in both `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`, byte-identical (contracts/story-config.md)

**Checkpoint**: `pnpm test` exits 0 in all projects; `.specify/extensions/story/scripts/tdd-check.sh 1` reports `exempt`.

---

## Phase 2: User Story 1 - One command runs every test, and the story workflow can use it (Priority: P1) 🎯 MVP

**Goal**: the behaviour of the test command, the offline setup and the configuration-copies check (spec US1,
FR-004 to FR-009; plan.md § Phases item 2; research.md R-03, R-04, R-09, R-15). The demo phase of SC-003.

**Independent Test**: `pnpm test` reports failed tests as findings, exits 2 naming `pnpm run setup:online` when
Chromium is missing and on "no test file found"; `pnpm run setup:offline` fails offline with the missing item named;
`pnpm run gate:config-copies` passes on the two copies; `tdd-check.sh 2` reports `pass`, and on a phase whose final
tests pass at its base it reports `fail`.

### Scaffold

- [X] T015 [US1] Scaffold commit (implement step 4): add `gates/bin/test.ts`, `gates/bin/setup-offline.ts`, `gates/bin/config-copies.ts`, `gates/lib/cli.ts` (argument parsing with `--root`, and the entry wrapper that calls a gate's `run(argv, io)`), `gates/lib/findings.ts` (data-model.md § Finding) and `gates/lib/vitest-report.ts` with exported signatures only (`run()` and the entry wrapper return 0, other functions return empty values), wired to nothing; commit `chore(001-repository-foundation): phase 2 scaffold`; run `.specify/extensions/story/scripts/scaffold.sh 2`

### Tests (red, one commit)

- [X] T016 [P] [US1] `gates/test/findings.test.ts`: the finding line format `<location>: <gate-id>: <rule>: <message>` for `path:line`, `path` and commit locations (data-model.md § Finding)
- [X] T017 [P] [US1] `gates/test/cli.test.ts`: the entry wrapper of `gates/lib/cli.ts`, given a `run()` that throws, returns exit 2 (not Node's exit 1 for an uncaught error) and writes exactly one line naming the thrown error's cause; given a `run()` that returns 0, 1 or 2 it returns that code; `--root <dir>` sets the repository root and the tool working directory of the parsed context to `<dir>` (default the current directory) and leaves every other argument unchanged (contracts/gate-cli.md, research.md R-09)
- [X] T018 [P] [US1] `gates/test/test-command.test.ts`: decision logic of `gates/bin/test.ts` on recorded Vitest JSON in `gates/test/fixtures/vitest/` (failed tests as one finding each, rule = full test name, exit 1; no test file found, load failure, errors outside tests, exit 2; contracts/gate-cli.md table)
- [X] T019 [P] [US1] `gates/test/integration/test-command.test.ts` (`gates-integration`, research.md R-03 test seam): `gates/bin/test.ts --root <tmp>`, on a temporary workspace the test builds from a fixture tree under `gates/test/fixtures/test-command/<case>/` with the repository's `vitest.config.ts` copied in unchanged and `node_modules` linked, run from a different working directory (never in place in `gates/test/fixtures/`): with Chromium missing (`PLAYWRIGHT_BROWSERS_PATH` empty dir) exits 2 naming `pnpm run setup:online` and skips no test (US1 scenario 9); with a failing test exits 1 naming it (scenario 5); with no test file exits 2 (FR-004)
- [X] T020 [P] [US1] `gates/test/setup-offline.test.ts` (in-process, `gates` project): the translation of recorded pnpm output in `gates/test/fixtures/pnpm/` (a missing-tarball error becomes "missing: <package>; run pnpm run setup:online", exit 2; a missing Chromium executable becomes a line naming Chromium and `pnpm run setup:online`, exit 2; a successful install with Chromium present is exit 0) (US1 scenario 3, FR-008, research.md R-04)
- [X] T021 [P] [US1] `gates/test/integration/setup-offline.test.ts` (`gates-integration`): `gates/bin/setup-offline.ts --root <tmp workspace>` built from a fixture workspace under `gates/test/fixtures/setup-offline/`, with the registry setting pointed at a local TCP socket the test opens: an empty temporary store exits 2 naming the missing package and `pnpm run setup:online`; an empty temporary browser path exits 2 naming Chromium and `pnpm run setup:online`; in both, zero connections reach the socket (FR-008 "never falls back to the network"); a store filled from a fixture lockfile with no dependencies, with the installed browser path, exits 0 and changes no file of the workspace (US1 scenarios 2 and 3, research.md R-04)
- [X] T022 [P] [US1] `gates/test/config-copies.test.ts`: on fixture trees under `gates/test/fixtures/config-copies/` with `--root`, two equal copies with FR-028's `test_pathspec` pass; one differing setting fails; equal copies with a different `test_pathspec` fail; a missing copy exits 2 (FR-006, research.md R-15)
- [X] T023 [US1] Commit T016 to T022 alone (`test(001-repository-foundation): phase 2 red — US1`), run `.specify/extensions/story/scripts/red.sh 2 phase`, and confirm every new test fails on an assertion (not a load error) against the scaffold

### Implementation (green)

- [X] T024 [P] [US1] Implement `gates/lib/findings.ts` and `gates/lib/cli.ts` (the entry wrapper maps any uncaught error to exit 2 with one line naming the cause; `--root` sets the repository root and tool working directory only)
- [X] T025 [US1] Implement `gates/lib/vitest-report.ts` and `gates/bin/test.ts` (Chromium executable check first, then `vitest run --reporter json`, classification per contracts/gate-cli.md)
- [X] T026 [P] [US1] Implement `gates/bin/setup-offline.ts` (`pnpm install --frozen-lockfile --offline` in the `--root` workspace, translate the missing-tarball error, Chromium check; research.md R-04)
- [X] T027 [P] [US1] Implement `gates/bin/config-copies.ts` (byte comparison of the two copies and the `test_pathspec` check; research.md R-15)
- [X] T028 [US1] Rewire root `package.json`: `test` = `node gates/bin/test.ts`, `setup:offline` = `node gates/bin/setup-offline.ts`, add `gate:unit-tests` and `gate:config-copies`
- [X] T029 [P] [US1] Add the Chromium-only sample test `packages/elements/test/chromium.test.ts` reading `navigator.userAgentData.brands` through a locally declared `NavigatorUAData` type (no `any`; research.md R-03). It passes at the phase base (the bootstrap already runs `elements` in Chromium), so it goes in the green commit, not the red one. Record in the phase 2 review why this is acceptable under constitution VIII: `tdd-check.sh` runs the phase's final test files together and judges their one exit code (the suite as a whole), which still fails at the base and at the scaffold through the behaviour tests of T016 to T022; and this test claims no phase 2 behaviour, it is the evidence of US1 scenario 6 (FR-005) for a property the bootstrap configured
- [X] T030 [US1] Run `pnpm test`, `pnpm run gate:config-copies`, then `.specify/extensions/story/scripts/tdd-check.sh 2` (must report `pass`, never `unavailable`: SC-003) and commit green

### Closing task (SC-003, second clause)

- [X] T031 [US1] In a disposable clone outside the repository (`git clone <repo> <tmp>`, so no throwaway phase or commit enters the repository), first give the clone its feature context and its install: `.specify/feature.json` is gitignored, so a clone has none and the story scripts would stop with "Feature directory not found"; export `SPECIFY_FEATURE_DIRECTORY=specs/001-repository-foundation` in the clone (the Spec Kit scripts read it and write the clone's own `feature.json`), and run `pnpm run setup:online` there so that `tdd-check.sh`'s offline setup finds the store and Chromium. Then start a throwaway phase 99 with `base.sh 99`, commit a red test that fails at the base and record it with `red.sh 99 phase`, then commit a rewrite of that test that passes against the base code (a loosened assertion), and run `tdd-check.sh 99`: it must report `fail` with the problem "the final tests pass against the code from before the phase". Record the commands (including the `SPECIFY_FEATURE_DIRECTORY` export and the `setup:online` run) and the JSON output in `specs/001-repository-foundation/reviews/phase-2/sc-003-fail-demo.md` (SC-003)

**Checkpoint**: US1 independent test passes; the red/green check works on this repository and rejects vacuous final tests.

---

## Phase 3: User Story 2 - Tests that cannot fail are rejected (Priority: P2)

**Goal**: the test lint and line-range mutation testing over package and gate source, wired into the story
workflow (spec US2, FR-007, FR-010 to FR-013; plan.md § Phases item 3; research.md R-06, R-08).

**Independent Test**: the test lint reports each of the seven FR-010 patterns of SC-004, and each of the three
patterns added at the phase 3 gate (T091), and exits 2 when ESLint cannot run;
`pnpm run gate:mutation -- --base <sha>` fails on a survivor or an uncovered changed line, passes on a fully checked
change, passes with "nothing to mutate" on a change to no source, and lists reasoned equivalent records.

### Scaffold

- [X] T032 [US2] Scaffold commit: add `gates/eslint/no-snapshot-only.ts` (a rule that reports nothing), `gates/lib/eslint-report.ts` (ESLint JSON classification, shared with the code lint of phase 4), `gates/bin/test-lint.ts` (the test-lint gate entry, `--root` through `gates/lib/cli.ts`), `gates/bin/mutation.ts` (`--root` through `gates/lib/cli.ts`), `gates/lib/mutation/ranges.ts` (changed line ranges), `gates/lib/mutation/report.ts` (Stryker JSON classification), `gates/lib/mutation/records.ts` (equivalent records), `gates/lib/mutation/shards.ts` (`--plan`, `--files`), signatures only, wired to nothing; commit `chore(001-repository-foundation): phase 3 scaffold`; run `scaffold.sh 3`

### Tests (red, one commit)

- [X] T033 [P] [US2] `gates/test/no-snapshot-only.test.ts`: ESLint `RuleTester` cases for a test whose only assertions are `toMatchSnapshot`, `toMatchInlineSnapshot` or `toMatchFileSnapshot` (reported) and a test with one non-snapshot assertion (not reported)
- [X] T034 [P] [US2] `gates/test/eslint-report.test.ts`: `gates/lib/eslint-report.ts` on recorded ESLint JSON and exit codes in `gates/test/fixtures/eslint/`: non-fatal messages are one finding each (`path:line`, rule id) and exit 1; no message is exit 0; ESLint exit 2, no JSON, or a fatal message (a file that does not parse) is exit 2 (contracts/gate-cli.md table, `lint` and `test-lint` row)
- [X] T035 [P] [US2] `gates/test/integration/test-lint.test.ts` (`gates-integration`): `gates/bin/test-lint.ts --root <tmp>`, on a temporary workspace built from fixture trees under `gates/test/fixtures/test-lint/` with the repository's `eslint.test.config.ts` and `gates/eslint/` copied in and `node_modules` linked, run from a different working directory: one fixture per FR-010 rule (eight: the seven FR-010 patterns, with the not-awaited pattern split into one fixture per rule), each exiting 1 with exactly its rule's one finding: an assertion-free test (`expect-expect`), a skipped test (`no-disabled-tests`), a focused test (`no-focused-tests`), an assertion inside a conditional (`no-conditional-expect`), an assertion outside a test (`no-standalone-expect`), an async `expect(...).resolves`/`.rejects` assertion not awaited or returned (`valid-expect` with `alwaysAwait`), a promise whose `.then` callback holds an assertion and that is neither returned nor awaited (`valid-expect-in-promise`), and a snapshot as the only assertion (`ocelle/no-snapshot-only`); a test with one real assertion exits 0; a test file that does not parse exits 2 (SC-004, research.md R-06). The test first asserts that `eslint.test.config.ts` exists, so at the red commit it fails on an assertion, not on setup
- [X] T036 [P] [US2] `gates/test/mutation-ranges.test.ts`: changed ranges from recorded `git diff --unified=0` output over package source and gate source, excluding test code and stories; no range means "nothing to mutate" (US2 scenario 5, FR-011, FR-028)
- [X] T037 [P] [US2] `gates/test/mutation-report.test.ts`: on recorded Stryker JSON in `gates/test/fixtures/stryker/`: `Survived` or `NoCoverage` on a changed line is a finding; on an unchanged line of a changed file it is not; `Killed`, `Timeout`, `RuntimeError` pass; `CompileError` is invalid and passes (FR-011 as amended, approved 2026-11-02); no report or failed dry run exits 2
- [X] T038 [P] [US2] `gates/test/mutation-records.test.ts`: a reasoned `// Stryker disable next-line <mutator>: <reason>` is listed with path, line, mutator and reason (FR-012); a record without a reason, `// Stryker disable all` and other disable forms in changed code are findings
- [X] T039 [P] [US2] `gates/test/mutation-shards.test.ts`: `--plan` splits changed files into shards of at most 10 files and 250 changed lines (500 until T093, operator decision, phase 4 round 3); `--files` limits a run to one shard; an unresolvable `--base` exits 2 (FR-013, research.md R-08)
- [X] T040 [P] [US2] `gates/test/integration/vitest-mutation-config.test.ts`: `vitest.mutation.config.ts` holds every project of `vitest.config.ts` except `gates-integration` (research.md R-08). The test first asserts that `vitest.mutation.config.ts` exists and only then loads it with a dynamic `import()` inside the test (no static import), so at the red commit it fails on an assertion, not on loading a missing file
- [X] T041 [P] [US2] `gates/test/integration/mutation.test.ts` (`gates-integration`, research.md R-08): on a temporary git repository built from `gates/test/fixtures/mutation-repo/` (a first commit with `base/` plus the repository's `stryker.config.json` and `vitest.mutation.config.ts`, a second with `head/`, `node_modules` linked), run from a different working directory: `gates/bin/mutation.ts --root <tmp> --base <first commit>` reports a mutant on a changed gate-source line that only a test under the fixture's `gates/test/integration/` covers as a `NoCoverage` finding (exit 1); `--files <path>` mutates only that file; a `--base` that does not resolve exits 2. The test first asserts that both configuration files exist, so at the red commit it fails on an assertion, not on setup
- [X] T042 [US2] Commit T033 to T041 alone, run `red.sh 3 phase`, confirm assertion failures against the scaffold. Record in the phase 3 review, under constitution VIII, that T035, T040 and T041 fail at the red commit on their existence assertions for `eslint.test.config.ts`, `vitest.mutation.config.ts` and `stryker.config.json`, which only the green commit creates (T043, T045): these configuration files are part of the phase's missing behaviour (FR-010's rule set, research.md R-08's runner split), not a setup error, and the red output showing those assertion failures is kept with the review

### Implementation (green)

- [X] T043 [P] [US2] Implement `gates/eslint/no-snapshot-only.ts`, `gates/lib/eslint-report.ts` and `gates/bin/test-lint.ts` (ESLint `--format json` with `eslint.test.config.ts` in the `--root` directory, classified per contracts/gate-cli.md), and create `eslint.test.config.ts` over all test code (FR-028), excluding `gates/plants/**` and `gates/test/fixtures/**`, with the `@vitest/eslint-plugin` rules of research.md R-06 as errors and `ocelle/no-snapshot-only`; add `gate:test-lint` = `node gates/bin/test-lint.ts`
- [X] T044 [US2] Implement `gates/lib/mutation/*.ts` and `gates/bin/mutation.ts` (`--root`, base argument, ranges, Stryker run with `mutate` ranges, `thresholds.break: 100`, classification, records list, `--plan`, `--files`)
- [X] T045 [P] [US2] Create `stryker.config.json` (vitest runner with `vitest.mutation.config.ts`, typescript checker) and `vitest.mutation.config.ts`; add `gate:mutation` to `package.json`
- [X] T046 [US2] Set `mutation_command: "pnpm run gate:mutation"` in both story configuration copies, byte-identical (contracts/story-config.md)
- [X] T047 [US2] Change step 4 of `tooling/speckit/extensions/story/commands/speckit.story.review.md` to run the mutation command as `<mutation_command> -- --base $(cat FEATURE_DIR/reviews/phase-<N>/base.sha)`, then reinstall with `specify extension remove story && specify extension add --dev tooling/speckit/extensions/story` and confirm `.claude/skills/speckit-story-review/SKILL.md` has the change (contracts/story-config.md)
- [X] T048 [US2] Run `pnpm test`, `pnpm run gate:test-lint`, `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-3/base.sha)`, and commit green

### Closing tasks (operator decisions, plan squad round 3)

- [X] T049 [US2] Mutation catch-up for phase 2: run `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-2/base.sha)`, save the output as `specs/001-repository-foundation/reviews/phase-3/mutation-phase-2.log`, and resolve every survivor test-first (a killing test, a failing test before a behaviour fix, or a reasoned equivalent record); re-run until no survivor remains
- [X] T050 [US2] Shard timing: `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-1/base.sha) --plan`, run each shard with `--files`, record each duration in `specs/001-repository-foundation/reviews/phase-3/mutation-shards.md` (SC-005; any shard over 10 minutes is reported to the operator)

### Operator addendum (after round 2)

Operator decision at the phase 3 gate, 2026-11-02, on review note R1-03: "Add rule now: add an ocelle rule for these
patterns as a small extra task before phase 4, test-first." Phase 3 was approved in round 2; this task reopens it
for one test-first unit, reviewed as phase 3's next round before phase 4 starts.

- [X] T091 [US2] Unchecked-assertion rules of research.md R-06 (`ocelle/no-floating-promise-expect`, `ocelle/no-timer-expect`, `ocelle/no-swallowed-expect`, FR-010 as amended), test-first in four commits plus the records step:
  1. **Stub**: add `gates/eslint/unchecked-expect.ts` with the three rules reporting nothing and its `plugin` export, wired to nothing (not in `eslint.test.config.ts`); commit `chore(001-repository-foundation): phase 3 addendum stub`. It gives the red tests a module to load, like a phase scaffold; `scaffold.sh` is not run again (phase 3's scaffold is recorded).
  2. **Red** (test files and fixtures only, one commit): `gates/test/unchecked-expect.test.ts`, ESLint `RuleTester` cases per rule, each case mixing reported code with look-alikes as `no-snapshot-only.test.ts` does: reported: `void p.then((v) => expect(v).toBe(2))`, `void p.then(f).finally(() => expect(1).toBe(1))`, `setTimeout(() => { expect(1).toBe(2); }, 0)`, `setInterval(() => expect(1).toBe(2), 0)`, `globalThis.setTimeout(...)` with an assertion, `try { expect(1).toBe(2); } catch {}`, `catch (e) { console.log(e) }`, `catch (e) { if (x) throw e }`; not reported: `await p.then(...)`, `return p.then(...)`, `() => p.then(...)`, a bare `p.then(...)` statement (left to `vitest/valid-expect-in-promise`), `await new Promise((r) => setTimeout(r, 10))` then an assertion, `catch (e) { cleanup(); throw e }`, `catch (e) { expect(e).toBeInstanceOf(SyntaxError) }`, `try ... finally` without `catch`. And, in `gates/test/integration/test-lint.test.ts` (`gates-integration`), new fixtures under `gates/test/fixtures/test-lint/`, run as T035 runs its fixtures: one per new rule (`no-floating-promise-expect` with `void p.then(...)`, `no-timer-expect` with `setTimeout`, `no-swallowed-expect` with `try { expect(...) } catch {}`), each exiting 1 with exactly its rule's one finding and the message of R-06; passing fixtures for the look-alikes that stay allowed, each exiting 0 with no finding: `pass-awaited-promise` (`await p.then(...)`), `pass-returned-promise` (`return p.then(...)`) and `pass-rethrowing-catch` (`catch (e) { ...; throw e }`); and `asserting-catch` (`catch (e) { expect(e)... }`), exiting 1 with exactly one `vitest/no-conditional-expect` finding and no `ocelle/no-swallowed-expect` finding (R-06: an asserting `catch` is not this rule's pattern, but an assertion in a `catch` is conditional). Existing T035 cases and their fixtures are not changed. Commit, run `red.sh 3 fix-3` (round 3 is the operator round that requests this addendum) and confirm every new failure is an assertion failure (RuleTester "Should have N errors but had 0", a fixture's exit 0 where 1 is expected), not a load error
  3. **Green**: implement the three rules in `gates/eslint/unchecked-expect.ts` exactly as R-06 defines them, and in `eslint.test.config.ts` register the `ocelle` plugin with the rules of both modules and set the three rules to `"error"`; update the config's header comment
  4. **Check**: `pnpm test`, `pnpm run gate:test-lint` (exit 0 on the repository's own test code), `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-3/base.sha)` (no survivor in the new module; the rules are pure and killed in-process by the `RuleTester` tests), then commit green
  5. **Records** (operator decision at the phase 3 gate, 2026-11-02: "In this round: the implementer adds the covering test's name to each existing record in the same phase 3 round as the new rule."): every existing integration-only record in `gates/bin/test.ts`, `gates/bin/setup-offline.ts`, `gates/bin/mutation.ts`, `gates/lib/spawn.ts` and `gates/lib/cli.ts` names its covering `gates-integration` case (file and test name) as research.md R-08 requires; a record that no case covers is removed and its mutants killed test-first or shown equivalent; commit with the green commit or as `refactor(001-repository-foundation): phase 3 addendum records`

**Checkpoint**: US1 and US2 both work; every later review runs mutation testing.

---

## Phase 4: User Story 3 - Every merge gate runs on pull requests and is proven able to fail (Priority: P3)

**Goal**: the remaining gates, `--root` on every gate, the registry, every plant and the plant job, CI and cache
workflows, and `gates/README.md` (spec US3, FR-020 to FR-028; plan.md § Phases item 4; research.md R-05, R-07,
R-09 to R-14, R-16; contracts/gate-cli.md, contracts/plants.md, contracts/ci-checks.md).

**Independent Test**: on the clean tree every `pnpm run gate:<id>` exits 0; `pnpm run gate:plants` exits 0 with every
gate failing each fail plant with exactly its expected findings, accepting each pass plant and exiting 2 on each
breaking (`error`) plant; breaking a gate's configuration makes the plant job fail naming it.

### Scaffold

- [X] T051 [US3] Scaffold commit: add `gates/bin/csp.ts`, `gates/bin/prefix.ts`, `gates/bin/signoff.ts`, `gates/bin/pins.ts`, `gates/bin/plants.ts`, `gates/bin/typecheck.ts`, `gates/bin/lint.ts`, `gates/bin/style-lint.ts` (every gate entry with `run(argv, io)` taking `--root` through `gates/lib/cli.ts`, research.md R-09), `gates/lib/tsc-report.ts`, `gates/lib/stylelint-report.ts`, `gates/lib/registry.ts`, `gates/lib/plant-repo.ts` (temporary repositories for `repo-tree`, `commit-repo`, `mutation-repo`), `gates/stylelint/token-only.ts` (a plugin that reports nothing), signatures only, wired to nothing; commit `chore(001-repository-foundation): phase 4 scaffold`; run `scaffold.sh 4`

### Tests (red, one commit)

- [X] T052 [P] [US3] `gates/test/tsc-report.test.ts`: recorded tsc diagnostics in `gates/test/fixtures/tsc/`: codes outside TS5xxx/TS6xxx are findings; TS5xxx/TS6xxx (including TS6053 and TS5083) exit 2
- [X] T053 [P] [US3] `gates/test/stylelint-report.test.ts`: recorded Stylelint JSON: warnings are findings, `CssSyntaxError` and Stylelint exit 1, 64, 78 exit 2
- [X] T054 [P] [US3] `gates/test/token-only.test.ts`: the FR-024 allow-list and reject classes on single declarations (every value of contracts/plants.md's style-lint row, fail and pass), including `var()` fallbacks, `calc()`, system colours, strings and author-defined identifiers (operator decision FRESH-1-009 (a))
- [X] T055 [P] [US3] `gates/test/csp.test.ts`: parse5 tokenizer and TypeScript parser findings for each FR-021 construct and the round-1 cases (newline before `style`, `/onload=`, indirect `(0, eval)(s)`), and no finding for `<script src>`, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)` (research.md R-11)
- [X] T056 [P] [US3] `gates/test/prefix.test.ts`: the case-insensitive `sk-`/`--sk-` name rule at a name boundary (including `<SK-Button>`) and FR-022's monospace list in font declarations (stylesheets and embedded templates); `task-list`, `desk-row`, `--risk-level` pass (research.md R-12)
- [X] T057 [P] [US3] `gates/test/signoff.test.ts`: commit records: missing trailer and non-matching trailer are findings; agent self sign-off passes; merge commits pass; only the full root hash `d08d4133bf0034e3d1ff29cddf2b0f13ca63290a` with no parent is exempt, and another hash starting `d08d413` is not (FR-023, research.md R-13)
- [X] T058 [P] [US3] `gates/test/pins.test.ts` (in-process, `gates` project; no real tool starts, research.md R-08 and R-14 test seam): the pins rules as pure functions on the parsed files of mini-workspaces under `gates/test/fixtures/pins/`, and the lockfile verdict on recorded `pnpm install --frozen-lockfile --lockfile-only --offline` output and exit codes under `gates/test/fixtures/pins/pnpm/` (an outdated-lockfile error is a finding naming `pnpm-lock.yaml`; a success is no finding; any other pnpm failure exits 2). Each of these is a finding naming its file: lockfile mismatch (recorded output); a `^` range; a `~` range (US1 scenario 8); `workspace:^`; `workspace:*`; `workspace:~`; a `workspace:` version that differs from the package's; `.node-version` missing or not exact (`26`); `packageManager` missing or not exact (`pnpm@12`); `minimumReleaseAge` missing or below 10080; `minimumReleaseAgeStrict` missing or `false`; a `minimumReleaseAgeExclude` entry; `allowBuilds` missing; an `allowBuilds` entry `true`; `dangerouslyAllowAllBuilds: true`; `shamefullyHoist: true`; a non-empty `publicHoistPattern`; a `nodeLinker` other than `isolated`. `workspace:0.0.0` on a sibling at 0.0.0 with the policy settings passes; invalid JSON exits 2 (FR-027, research.md R-14, operator decision FRESH-1-008 (b))
- [X] T059 [P] [US3] `gates/test/registry.test.ts`: the registry check fails on a gate without a `gates.json` entry, a gate without a `ci.yml` job, or a mismatch with the FR-020 list (research.md R-10)
- [X] T060 [P] [US3] `gates/test/plants.test.ts`: the plant job's verdicts on recorded gate results: a fail plant needs exit 1 with exactly the expected findings, a pass plant exit 0 with no finding (and the expected records), a breaking (`error`) plant exit 2; a gate without a fail, pass or breaking plant, an invalid `plant.json`, or a plant carrying configuration fails the job (contracts/plants.md, last paragraph)
- [X] T061 [P] [US3] `gates/test/integration/plant-repo.test.ts`: `gates/lib/plant-repo.ts` builds a `repo-tree` repository with the configuration set of research.md R-10 and `node_modules` linked, a `commit-repo` on an empty signed-off base commit with an RFC 2606 identity, and a `mutation-repo` from `base/` and `head/`
- [X] T062 [P] [US3] `gates/test/integration/gates-root.test.ts` (`gates-integration`, research.md R-09): for each of `typecheck`, `lint`, `style-lint`, `csp`, `prefix`, `pins` and `signoff` (`--range <base>..HEAD`), the gate entry runs with `--root <tmp>` on a temporary repository from a fixture under `gates/test/fixtures/root/<id>/` holding one defect, from a different working directory: it exits 1 with exactly that defect's finding at its repository path; the same tree without the defect exits 0. The test builds each temporary repository itself, as T019, T021, T035 and T041 do, and does not use `gates/lib/plant-repo.ts` (a module of the same scaffold, which builds nothing until green; T061 stays that module's own red test): for `typecheck`, `lint`, `style-lint`, `csp` and `prefix` it copies the fixture tree over only the configuration files that case's gate reads and links `node_modules`, not the whole configuration set of research.md R-10 (which includes `eslint.config.ts` and `stylelint.config.ts`, created only by T065 and T066): `typecheck` copies the root `package.json`, `tsconfig.base.json`, `tsconfig.json` and each `packages/*/package.json` and `packages/*/tsconfig.json`; `lint` copies those and `eslint.config.ts` (the project service resolves the fixture's files through the repository's tsconfig files, research.md R-05); `style-lint` copies the root `package.json`, `stylelint.config.ts` and `gates/stylelint/`; `csp` and `prefix` copy no configuration file, since their gates read only the files the fixture holds at repository paths (`packages/*/dist/**` for `csp`, package source, test code and built output for `prefix`; research.md R-11, R-12); for `pins` the fixture is a whole mini-workspace with no dependency whose defect is a lockfile that does not match its manifests, so this case runs the real `pnpm install --frozen-lockfile --lockfile-only --offline` of research.md R-14 end to end; for `signoff` it runs `git init`, makes an empty base commit signed off by `Plant Base <base@example.com>`, commits one commit per record of the fixture's `commits.txt`, and runs the gate with `--range <base commit>..HEAD`. Before any copy, each case asserts that every configuration file it copies exists, so at the red commit and against the scaffold every case fails on an assertion, not on setup: `lint` and `style-lint` on the existence of `eslint.config.ts` and `stylelint.config.ts`, and `typecheck`, `csp`, `prefix`, `pins` and `signoff` (whose copied files exist since phase 1, or which copy none) on the gate's missing exit code
- [X] T092 [US3] `.stryker-tmp/` is not test-linted (operator decision at the phase 3 gate, 2026-11-02, on review note R2-02: "Fix in phase 4, test-first: add .stryker-tmp/ to the test-lint ignores."; spec FR-028, research.md R-06). Red, in this commit: in `gates/test/integration/test-lint.test.ts` (`gates-integration`), a case on a new fixture `gates/test/fixtures/test-lint/stryker-sandbox/` holding a test file with one real assertion at `packages/tokens/test/case.test.ts` and, under `.stryker-tmp/sandbox-x/gates/test/case.test.ts`, a test file that does not parse (the state R2-02 observed during a mutation run): `gates/bin/test-lint.ts --root <tmp>` exits 0 with exactly `test-lint: 1 file checked, no finding`. Against the scaffold it exits 2 naming the sandbox file, an assertion failure. Green, in this phase's green commit (before T082): add `.stryker-tmp/**` to the `ignores` of `eslint.test.config.ts`
- [X] T063 [US3] Commit T052 to T062 and T092 alone, run `red.sh 4 phase`, confirm assertion failures against the scaffold. Record in the phase 4 review, under constitution VIII, that T062's `lint` and `style-lint` cases fail at the red commit on their existence assertions for `eslint.config.ts` and `stylelint.config.ts`, which only the green commit creates (T065, T066): these configuration files are part of the phase's missing behaviour (research.md R-05, R-07), not a setup error, and the red output is kept with the review; T062's `typecheck`, `csp`, `prefix`, `pins` and `signoff` cases copy no file the green commit creates and fail on the gate's missing exit code (analysis 3)

### Implementation (green)

Every gate entry below takes `--root` (research.md R-09), as T062 tests. T092's green half (the `.stryker-tmp/**`
ignore in `eslint.test.config.ts`) is part of this green work.

- [X] T064 [P] [US3] Implement `gates/lib/tsc-report.ts` and `gates/bin/typecheck.ts`; add `gate:typecheck`
- [X] T065 [P] [US3] Create `eslint.config.ts` (`@eslint/js` recommended, typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`, project service, ignores `gates/plants/**`, `gates/test/fixtures/**`; research.md R-05) and `gates/bin/lint.ts` using `gates/lib/eslint-report.ts`; add `gate:lint`
- [X] T066 [P] [US3] Implement `gates/stylelint/token-only.ts`, `gates/lib/stylelint-report.ts`, `gates/bin/style-lint.ts`, and create `stylelint.config.ts` exactly as research.md R-07 decides: the whole package as FR-024 and FR-028 cover it (postcss-lit for `packages/elements/**/*.ts`, plain CSS for `packages/elements/**/*.css` and `packages/styles/**/*.css`), `ignoreFiles` holding `gates/plants/**`, `gates/test/fixtures/**`, `packages/*/dist/**` and the test-code globs (`**/*.test.ts`, `**/*.spec.ts`, `**/test/**`, `**/*.stories.ts`), and `allowEmptyInput` on (this feature ships no stylesheet; the style-lint plants catch a wrong glob); add `gate:style-lint`
- [X] T067 [P] [US3] Implement `gates/bin/csp.ts` (research.md R-11); add `gate:csp`
- [X] T068 [P] [US3] Implement `gates/bin/prefix.ts` (research.md R-12); add `gate:prefix`
- [X] T069 [P] [US3] Implement `gates/bin/signoff.ts` (research.md R-13); add `gate:signoff`
- [X] T070 [P] [US3] Implement `gates/bin/pins.ts` with `--plant` (research.md R-14); add `gate:pins`
- [X] T071 [US3] Create `gates/gates.json` with every FR-020 gate (data-model.md § Gate) and the `mutation-plan`/`mutation-shard` helper jobs; implement `gates/lib/registry.ts`
- [X] T072 [US3] Implement `gates/lib/plant-repo.ts` and `gates/bin/plants.ts` (plant verdicts and the registry check); add `gate:plants`
- [X] T073 [P] [US3] Plants for `typecheck` and `lint` under `gates/plants/typecheck/` and `gates/plants/lint/` exactly as contracts/plants.md lists (fail, pass, breaking; the TS6053 breaking plant confirmed here, otherwise another TS5xxx/TS6xxx input)
- [X] T074 [P] [US3] Plants for `unit-tests` and `test-lint` under `gates/plants/unit-tests/` and `gates/plants/test-lint/` (contracts/plants.md, including the Chromium plant and the seven FR-010 patterns)
- [X] T075 [P] [US3] Plants for `mutation` under `gates/plants/mutation/` (contracts/plants.md, including the uncovered changed line, the `CompileError` pass plant and the reasoned record)
- [X] T076 [P] [US3] Plants for `style-lint` and `prefix` under `gates/plants/style-lint/` and `gates/plants/prefix/` (contracts/plants.md, every reject class, the stylesheet outside `src/` and the `<SK-Button>` plant)
- [X] T077 [P] [US3] Plants for `csp`, `pins`, `config-copies` and `signoff` under `gates/plants/<id>/` (contracts/plants.md, including every pins fail plant of its row; invented `example.com` identities only, FR-034)
- [X] T078 [P] [US3] Registry plants under `gates/plants/plants/` (a gate without an entry, a gate without a CI job, a matching pair)
- [X] T079 [US3] Create `.github/workflows/ci.yml` per contracts/ci-checks.md: `permissions: contents: read`, `persist-credentials: false`, actions pinned by SHA, one job per check, the `mutation-plan`/`mutation-shard`/`mutation` verdict jobs with `timeout-minutes: 10` per shard, sign-off and mutation jobs with `fetch-depth: 0`, caches restored only
- [X] T080 [P] [US3] Create `.github/workflows/cache.yml` per contracts/ci-checks.md (push to `main`, saves the pnpm store and Playwright cache under the keys `ci.yml` restores)
- [X] T081 [P] [US3] Write `gates/README.md`: every gate with its check name and plants, the twelve check names the `main` ruleset must require, and the deferred gates with their issues (FR-026: Storybook build, visual regression and accessibility #10, contrast #5, custom-elements manifest #7 or #10, remote loads with the first element feature)
- [X] T082 [US3] Run every `pnpm run gate:<id>` (exit 0) and `pnpm run gate:plants` (exit 0), and commit green
- [X] T083 [US3] Shard timing as in T050, recorded in `specs/001-repository-foundation/reviews/phase-4/mutation-shards.md`; then the SC-001 early timing, since phases 2 to 4 add the real-tool `gates-integration` tests to `pnpm test`: in a fresh clone outside the repository with an empty package store (a new temporary store directory set through `npm_config_store_dir`; before timing, run `pnpm store path` in the clone under the same environment and go on only if it prints that new directory, otherwise set the store directory another way pnpm 12 reads, research.md R-04, and check again) and an empty browser cache (a new temporary `PLAYWRIGHT_BROWSERS_PATH`), limited to 2 CPUs where the machine allows (for example `taskset -c 0,1`), time `pnpm run setup:online` followed by `pnpm test` and record the duration, the CPU count, the commands and the `pnpm store path` output (the store the run actually used) in `specs/001-repository-foundation/reviews/phase-4/sc-001-timing.md`; a total of 5 minutes or more is reported to the operator, as T050 does for shards (SC-001 itself is still measured on the CI runner in the operator's verification)

### Operator addendum (after round 2)

Operator decision after phase 5, 2026-11-03 (human:jeroennouwsdev, recorded as phase 4 round 3, finding O3-01): GitHub
CI run 7 cancelled the 435-line shard `gates/lib/plant-judge.ts,gates/lib/plant-repo.ts` at its 10-minute limit;
answer "Smaller shards (Recommended)": "Lower the shard bound (500 → 250 lines, about half the time per shard,
roughly 18 shards). Planner updates R-08/plan, implementer changes shards.ts test-first. More parallel jobs, same
mutation strength." Phase 4 was approved in round 2; this task reopens it for one test-first unit, reviewed as
phase 4's round 4.

- [X] T093 [US3] Shard bound of 250 changed lines (spec FR-013/SC-005 as amended, research.md R-08 "CI, sharded"; 10 files per shard and the 10-minute shard job limit unchanged), test-first:
  1. **Stub**: none needed; `gates/lib/mutation/shards.ts` and its test exist since phase 3.
  2. **Red** (test file only, one commit): update and add cases in `gates/test/mutation-shards.test.ts` (T039's test) on recorded diff output asserting the 250-line split: a file with 251 changed lines is a shard on its own; two files whose changed lines sum to 251 are split into two shards; two files summing to exactly 250 fit in one shard. Cases that assumed 500 are changed to the new bound. Commit alone, run `red.sh 4 fix-3` (round 3 is the operator round that requests this addendum) and confirm every new failure is an assertion failure against the current 500-line code, not a load error
  3. **Green**: set the bound to 250 in `gates/lib/mutation/shards.ts` (constant and header comment) and update the bound's wording in `gates/README.md`
  4. **Check**: `pnpm test`, every `pnpm run gate:<id>` (exit 0) and `pnpm run gate:plants` (exit 0); `pnpm run gate:mutation -- --base bdb9b70 --plan` (the pull request base, the CI plan) to show the new shard list, then each shard with `--files`, timed; record the new shard list and timings in `specs/001-repository-foundation/reviews/phase-4/mutation-shards.md`, add the CI run 4, 6 and 7 durations of round 3's evidence, and correct its margin sentence to the measured CI margin (round 2 note R2-01); a shard over 10 minutes is reported to the operator; commit green

**Checkpoint**: all twelve checks run locally and the plant job proves each gate can fail.

---

## Phase 5: User Story 4 - Licence and governance files for a future public repository (Priority: P4)

**Goal**: the licence, contribution, security, notices and code-owner files (spec US4, FR-030 to FR-035; research.md
R-17). No GitHub-side check belongs to this phase (plan.md § Verification).

**Independent Test**: `gates/test/governance.test.ts` (SC-006) passes; the files read as FR-030 to FR-035 require.

No scaffold: the phase's test reads repository files and imports no new module.

### Tests (red, one commit)

- [X] T084 [US4] `gates/test/governance.test.ts`: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES` exist at the root under exactly these names; `CONTRIBUTING.md` contains `Signed-off-by` and `git commit -s`; `.github/CODEOWNERS` names `@MOES-Media` as the only owner of every path; `SECURITY.md` names GitHub private vulnerability reporting, `@MOES-Media`, 3 working days and 10 working days (SC-006); commit it alone and run `red.sh 5 phase`

### Implementation (green)

- [X] T085 [P] [US4] `LICENSE` with the Apache License 2.0 text (FR-030)
- [X] T086 [P] [US4] `CONTRIBUTING.md`: sign-off with `git commit -s`, no contributor licence agreement, the Spec Kit flow and the constitution (FR-031)
- [X] T087 [P] [US4] `SECURITY.md`: GitHub private vulnerability reporting once public (1.0.0, #11); until then contact `@MOES-Media` privately, not through an issue; what to include; acknowledgement within 3 working days and a status update within 10 (FR-032, operator decisions 2026-11-02)
- [X] T088 [P] [US4] `THIRD_PARTY_NOTICES` stating that no third-party asset ships yet and that the Schibsted Grotesk entry arrives with #5 (FR-033)
- [X] T089 [P] [US4] `.github/CODEOWNERS` with `* @MOES-Media` and no other owner (FR-035)
- [X] T090 [US4] Run `pnpm test` and every gate, and commit green

**Checkpoint**: all four stories complete; the operator's verification can start.

---

## Operator verification (after phase 5; not a story-workflow phase)

The operator pushes the branch, opens the pull request and records each result in
`specs/001-repository-foundation/verification.md` (plan.md § Verification): CODEOWNERS accepted by GitHub and
`@MOES-Media` with write access; the twelve checks green; a ruleset on `main` requiring the twelve checks; SC-001 and
SC-005 timings (quickstart steps 11 and 12). Consider merging `cache.yml` first in a small pull request so the
feature's shards are not timed cold (quickstart step 12).

---

## Dependencies & Execution Order

- **Phase 1** blocks everything (no runner before it).
- **Phase 2 (US1)** needs phase 1. It provides `gates/lib/cli.ts` (the entry wrapper and `--root`) and `findings.ts`, used by every later gate.
- **Phase 3 (US2)** needs phase 2 (its catch-up task mutation-tests phase 2's gate source).
- **Phase 4 (US3)** needs phases 2 and 3 (its plants cover the unit-tests, config-copies, test-lint and mutation gates), including phase 3's operator addendum T091, which is reviewed before phase 4 starts.
- **Phase 5 (US4)** needs only phase 1 in principle, but runs last in the story workflow's order.
- Within a phase: scaffold → red commit → green tasks → closing tasks. Phase 4's `gates/lib/eslint-report.ts` comes from phase 3.

## Parallel Opportunities

- Phase 1: T003 to T006 and T008 to T010 and T012 touch separate files.
- Phase 2: the red tests T016 to T022 are separate files; in green, T024, T026, T027 and T029 are independent.
- Phase 3: T033 to T041 in parallel; T043 and T045 in parallel with T044.
- Phase 3 addendum: T091 is one unit (stub, red, green, check) after T050; nothing runs in parallel with it.
- Phase 4: T052 to T062 and T092 in parallel; T064 to T070 in parallel; the plant groups T073 to T078 in parallel; T080 and T081 in parallel with T079.
- Phase 4 addendum: T093 is one unit (red, green, check) after phase 5's review; nothing runs in parallel with it.
- Phase 5: T085 to T089 in parallel.

## Implementation Strategy

- **MVP**: phases 1 and 2. After them the repository has a working test command and the story workflow's red/green
  check works on it (SC-003), which every later feature needs.
- **Incremental**: phase 3 adds the vacuous-test guards and backfills mutation testing for phase 2; phase 4 makes
  every gate a proven CI check; phase 5 adds governance files; then the operator's verification.
- Each phase is implemented, checked and reviewed by the story workflow (`/ocelle-run`) before the next starts.
