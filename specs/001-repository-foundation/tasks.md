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

- [ ] T001 Write `specs/001-repository-foundation/reviews/phase-1/tdd-exempt.md` stating why no test can fail for the bootstrap (no runner exists before it) and listing exactly what the phase adds (the files of T002 to T013)
- [ ] T002 Create root `package.json`: `"private": true`, `packageManager` `pnpm@12.16.1`, `engines` node `26.13.0` and pnpm `12.16.1`, every dev dependency of plan.md § Technical Context at its exact version (Vitest and `@vitest/browser-playwright` 5.0.5, ESLint 10.13.0, typescript-eslint 8.72.0, `@types/node` 26.6.5, Vite 8.3.5, jiti 2.7.0, postcss 8.5.31, postcss-value-parser 4.2.0, parse5 8.0.1 and the rest as research.md lists), and scripts `test` = `vitest run`, `setup:online` = `pnpm install --frozen-lockfile && pnpm exec playwright install chromium`, `setup:offline` = `pnpm install --frozen-lockfile --offline` (plain wiring; phase 2 replaces `test` and `setup:offline`)
- [ ] T003 [P] Create `pnpm-workspace.yaml` with `packages: ["packages/*"]`, `minimumReleaseAge: 10080`, the strict release-age setting and an empty `allowBuilds` (research.md R-04, operator decisions A11Y-SECURITY-1-005 (a) and FRESH-3-006 (b))
- [ ] T004 [P] Create `.node-version` containing `26.13.0`
- [ ] T005 [P] Create `.gitignore` with `node_modules/`, `packages/*/dist/`, `.stryker-tmp/`, `reports/`, `__screenshots__/`, `*.tsbuildinfo` (root paths only, so plants may track `dist/`; contracts/plants.md)
- [ ] T006 [P] Create `tsconfig.base.json` with the compiler options of plan.md § Technical Context and research.md R-02 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, the options that let Node 26 run `.ts` gate scripts directly)
- [ ] T007 Create root `tsconfig.json` extending `tsconfig.base.json`, `noEmit`, including all repository TypeScript and excluding `gates/plants/**`, `gates/test/fixtures/**`, `node_modules` and `packages/*/dist` (FR-028)
- [ ] T008 [P] Create `packages/tokens/` skeleton: `package.json` (`@ocelle/tokens`, version `0.0.0`, private, no runtime dependency, `build` with `tsc`), `tsconfig.json` (extends the base, explicit `rootDir` `src`, `outDir` `dist`), `src/index.ts` exporting nothing
- [ ] T009 [P] Create `packages/styles/` skeleton the same way (`@ocelle/styles`)
- [ ] T010 [P] Create `packages/elements/` skeleton the same way (`@ocelle/elements`)
- [ ] T011 Create `vitest.config.ts` with the five projects of research.md R-03: `tokens`, `styles`, `gates` (Node), `elements` (browser mode, `@vitest/browser-playwright`, Chromium only, headless), `gates-integration` (Node, `gates/test/integration/`), each excluding `gates/plants/**` and `gates/test/fixtures/**`
- [ ] T012 [P] Add one passing sample test per package, `packages/tokens/test/sample.test.ts`, `packages/styles/test/sample.test.ts`, `packages/elements/test/sample.test.ts`, each asserting something true about its package (FR-009: passing samples may live in a package)
- [ ] T013 Run `pnpm run setup:online`, commit `pnpm-lock.yaml`, and run `pnpm test` (exit 0)
- [ ] T014 Set `test_command: "pnpm test"` and `setup_command: "pnpm run setup:offline"` in both `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`, byte-identical (contracts/story-config.md)

**Checkpoint**: `pnpm test` exits 0 in all projects; `.specify/extensions/story/scripts/tdd-check.sh 1` reports `exempt`.

---

## Phase 2: User Story 1 - One command runs every test, and the story workflow can use it (Priority: P1) 🎯 MVP

**Goal**: the behaviour of the test command, the offline setup and the configuration-copies check (spec US1,
FR-004 to FR-009; plan.md § Phases item 2; research.md R-03, R-04, R-09, R-15). The demo phase of SC-003.

**Independent Test**: `pnpm test` reports failed tests as findings, exits 2 naming `pnpm run setup:online` when
Chromium is missing and on "no test file found"; `pnpm run setup:offline` fails offline with the missing item named;
`pnpm run gate:config-copies` passes on the two copies; `tdd-check.sh 2` reports `pass`.

### Scaffold

- [ ] T015 [US1] Scaffold commit (implement step 4): add `gates/bin/test.ts`, `gates/bin/setup-offline.ts`, `gates/bin/config-copies.ts`, `gates/lib/cli.ts` (argument parsing, `--root`), `gates/lib/findings.ts` (data-model.md § Finding) and `gates/lib/vitest-report.ts` with exported signatures only (`run()` returns 0, other functions return empty values), wired to nothing; commit `chore(001-repository-foundation): phase 2 scaffold`; run `.specify/extensions/story/scripts/scaffold.sh 2`

### Tests (red, one commit)

- [ ] T016 [P] [US1] `gates/test/findings.test.ts`: the finding line format `<location>: <gate-id>: <rule>: <message>` for `path:line`, `path` and commit locations (data-model.md § Finding)
- [ ] T017 [P] [US1] `gates/test/test-command.test.ts`: decision logic of `gates/bin/test.ts` on recorded Vitest JSON in `gates/test/fixtures/vitest/` (failed tests as one finding each, rule = full test name, exit 1; no test file found, load failure, errors outside tests, exit 2; contracts/gate-cli.md table)
- [ ] T018 [P] [US1] `gates/test/integration/test-command.test.ts`: `gates/bin/test.ts --root <fixture workspace>` with Chromium missing (`PLAYWRIGHT_BROWSERS_PATH` empty dir) exits 2 naming `pnpm run setup:online` and skips no test (US1 scenario 9); with a failing test exits 1 naming it (scenario 5); with no test file exits 2 (FR-004)
- [ ] T019 [P] [US1] `gates/test/setup-offline.test.ts`: through the R-04 seam, a missing package in the store and a missing Chromium each exit non-zero naming what is missing and `pnpm run setup:online`, and no network call is attempted (US1 scenarios 2 and 3, FR-008)
- [ ] T020 [P] [US1] `gates/test/config-copies.test.ts`: on fixture trees under `gates/test/fixtures/config-copies/` with `--root`, two equal copies with FR-028's `test_pathspec` pass; one differing setting fails; equal copies with a different `test_pathspec` fail; a missing copy exits 2 (FR-006, research.md R-15)
- [ ] T021 [US1] Commit T016 to T020 alone (`test(001-repository-foundation): phase 2 red — US1`), run `.specify/extensions/story/scripts/red.sh 2 phase`, and confirm every new test fails on an assertion (not a load error) against the scaffold

### Implementation (green)

- [ ] T022 [P] [US1] Implement `gates/lib/findings.ts` and `gates/lib/cli.ts` (top-level catch maps any uncaught error to exit 2; `--root` sets the repository root and tool working directory only)
- [ ] T023 [US1] Implement `gates/lib/vitest-report.ts` and `gates/bin/test.ts` (Chromium executable check first, then `vitest run --reporter json`, classification per contracts/gate-cli.md)
- [ ] T024 [P] [US1] Implement `gates/bin/setup-offline.ts` (`pnpm install --frozen-lockfile --offline`, translate the missing-tarball error, Chromium check; research.md R-04)
- [ ] T025 [P] [US1] Implement `gates/bin/config-copies.ts` (byte comparison of the two copies and the `test_pathspec` check; research.md R-15)
- [ ] T026 [US1] Rewire root `package.json`: `test` = `node gates/bin/test.ts`, `setup:offline` = `node gates/bin/setup-offline.ts`, add `gate:unit-tests` and `gate:config-copies`
- [ ] T027 [P] [US1] Add the Chromium-only sample test `packages/elements/test/chromium.test.ts` reading `navigator.userAgentData.brands` through a locally declared `NavigatorUAData` type (no `any`; research.md R-03). It passes at the phase base (the bootstrap already runs `elements` in Chromium), so it goes in the green commit, not the red one
- [ ] T028 [US1] Run `pnpm test`, `pnpm run gate:config-copies`, then `.specify/extensions/story/scripts/tdd-check.sh 2` (must report `pass`, never `unavailable`: SC-003) and commit green

**Checkpoint**: US1 independent test passes; the red/green check works on this repository.

---

## Phase 3: User Story 2 - Tests that cannot fail are rejected (Priority: P2)

**Goal**: the test lint and line-range mutation testing over package and gate source, wired into the story
workflow (spec US2, FR-007, FR-010 to FR-013; plan.md § Phases item 3; research.md R-06, R-08).

**Independent Test**: the test lint reports each of the seven FR-010 patterns; `pnpm run gate:mutation -- --base
<sha>` fails on a survivor or an uncovered changed line, passes on a fully checked change, passes with "nothing to
mutate" on a change to no source, and lists reasoned equivalent records.

### Scaffold

- [ ] T029 [US2] Scaffold commit: add `gates/eslint/no-snapshot-only.ts` (a rule that reports nothing), `gates/bin/mutation.ts`, `gates/lib/mutation/ranges.ts` (changed line ranges), `gates/lib/mutation/report.ts` (Stryker JSON classification), `gates/lib/mutation/records.ts` (equivalent records), `gates/lib/mutation/shards.ts` (`--plan`, `--files`), signatures only, wired to nothing; commit `chore(001-repository-foundation): phase 3 scaffold`; run `scaffold.sh 3`

### Tests (red, one commit)

- [ ] T030 [P] [US2] `gates/test/no-snapshot-only.test.ts`: ESLint `RuleTester` cases for a test whose only assertions are `toMatchSnapshot`, `toMatchInlineSnapshot` or `toMatchFileSnapshot` (reported) and a test with one non-snapshot assertion (not reported)
- [ ] T031 [P] [US2] `gates/test/mutation-ranges.test.ts`: changed ranges from recorded `git diff --unified=0` output over package source and gate source, excluding test code and stories; no range means "nothing to mutate" (US2 scenario 5, FR-011, FR-028)
- [ ] T032 [P] [US2] `gates/test/mutation-report.test.ts`: on recorded Stryker JSON in `gates/test/fixtures/stryker/`: `Survived` or `NoCoverage` on a changed line is a finding; on an unchanged line of a changed file it is not; `Killed`, `Timeout`, `RuntimeError` pass; `CompileError` is invalid and passes (FR-011 as amended, approved 2026-11-02); no report or failed dry run exits 2
- [ ] T033 [P] [US2] `gates/test/mutation-records.test.ts`: a reasoned `// Stryker disable next-line <mutator>: <reason>` is listed with path, line, mutator and reason (FR-012); a record without a reason, `// Stryker disable all` and other disable forms in changed code are findings
- [ ] T034 [P] [US2] `gates/test/mutation-shards.test.ts`: `--plan` splits changed files into shards of at most 10 files and 500 changed lines; `--files` limits a run to one shard; an unresolvable `--base` exits 2 (FR-013, research.md R-08)
- [ ] T035 [P] [US2] `gates/test/integration/vitest-mutation-config.test.ts`: `vitest.mutation.config.ts` holds every project of `vitest.config.ts` except `gates-integration` (research.md R-08)
- [ ] T036 [US2] Commit T030 to T035 alone, run `red.sh 3 phase`, confirm assertion failures against the scaffold

### Implementation (green)

- [ ] T037 [P] [US2] Implement `gates/eslint/no-snapshot-only.ts` and create `eslint.test.config.ts` over all test code (FR-028), excluding `gates/plants/**` and `gates/test/fixtures/**`, with the `@vitest/eslint-plugin` rules of research.md R-06 as errors and `ocelle/no-snapshot-only`; add `gate:test-lint` with the ESLint JSON classification of contracts/gate-cli.md in `gates/lib/eslint-report.ts`
- [ ] T038 [US2] Implement `gates/lib/mutation/*.ts` and `gates/bin/mutation.ts` (base argument, ranges, Stryker run with `mutate` ranges, `thresholds.break: 100`, classification, records list, `--plan`, `--files`)
- [ ] T039 [P] [US2] Create `stryker.config.json` (vitest runner with `vitest.mutation.config.ts`, typescript checker) and `vitest.mutation.config.ts`; add `gate:mutation` to `package.json`
- [ ] T040 [US2] Set `mutation_command: "pnpm run gate:mutation"` in both story configuration copies, byte-identical (contracts/story-config.md)
- [ ] T041 [US2] Change step 4 of `tooling/speckit/extensions/story/commands/speckit.story.review.md` to run the mutation command as `<mutation_command> -- --base $(cat FEATURE_DIR/reviews/phase-<N>/base.sha)`, then reinstall with `specify extension remove story && specify extension add --dev tooling/speckit/extensions/story` and confirm `.claude/skills/speckit-story-review/SKILL.md` has the change (contracts/story-config.md)
- [ ] T042 [US2] Run `pnpm test`, `pnpm run gate:test-lint`, `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-3/base.sha)`, and commit green

### Closing tasks (operator decisions, plan squad round 3)

- [ ] T043 [US2] Mutation catch-up for phase 2: run `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-2/base.sha)`, save the output as `specs/001-repository-foundation/reviews/phase-3/mutation-phase-2.log`, and resolve every survivor test-first (a killing test, a failing test before a behaviour fix, or a reasoned equivalent record); re-run until no survivor remains
- [ ] T044 [US2] Shard timing: `pnpm run gate:mutation -- --base $(cat specs/001-repository-foundation/reviews/phase-1/base.sha) --plan`, run each shard with `--files`, record each duration in `specs/001-repository-foundation/reviews/phase-3/mutation-shards.md` (SC-005; any shard over 10 minutes is reported to the operator)

**Checkpoint**: US1 and US2 both work; every later review runs mutation testing.

---

## Phase 4: User Story 3 - Every merge gate runs on pull requests and is proven able to fail (Priority: P3)

**Goal**: the remaining gates, `--root` on every gate, the registry, every plant and the plant job, CI and cache
workflows, and `gates/README.md` (spec US3, FR-020 to FR-028; plan.md § Phases item 4; research.md R-05, R-07,
R-09 to R-14, R-16; contracts/gate-cli.md, contracts/plants.md, contracts/ci-checks.md).

**Independent Test**: on the clean tree every `pnpm run gate:<id>` exits 0; `pnpm run gate:plants` exits 0 with every
gate failing each fail plant with exactly its expected findings, accepting each pass plant and exiting 2 on each
breaking plant; breaking a gate's configuration makes the plant job fail naming it.

### Scaffold

- [ ] T045 [US3] Scaffold commit: add `gates/bin/csp.ts`, `gates/bin/prefix.ts`, `gates/bin/signoff.ts`, `gates/bin/pins.ts`, `gates/bin/plants.ts`, `gates/bin/typecheck.ts`, `gates/bin/lint.ts`, `gates/bin/style-lint.ts`, `gates/lib/tsc-report.ts`, `gates/lib/stylelint-report.ts`, `gates/lib/registry.ts`, `gates/lib/plant-repo.ts` (temporary repositories for `repo-tree`, `commit-repo`, `mutation-repo`), `gates/stylelint/token-only.ts` (a plugin that reports nothing), signatures only, wired to nothing; commit `chore(001-repository-foundation): phase 4 scaffold`; run `scaffold.sh 4`

### Tests (red, one commit)

- [ ] T046 [P] [US3] `gates/test/tsc-report.test.ts`: recorded tsc diagnostics in `gates/test/fixtures/tsc/`: codes outside TS5xxx/TS6xxx are findings; TS5xxx/TS6xxx (including TS6053 and TS5083) exit 2
- [ ] T047 [P] [US3] `gates/test/stylelint-report.test.ts`: recorded Stylelint JSON: warnings are findings, `CssSyntaxError` and Stylelint exit 1, 64, 78 exit 2
- [ ] T048 [P] [US3] `gates/test/token-only.test.ts`: the FR-024 allow-list and reject classes on single declarations (every value of contracts/plants.md's style-lint row, fail and pass), including `var()` fallbacks, `calc()`, system colours, strings and author-defined identifiers (operator decision FRESH-1-009 (a))
- [ ] T049 [P] [US3] `gates/test/csp.test.ts`: parse5 tokenizer and TypeScript parser findings for each FR-021 construct and the round-1 cases (newline before `style`, `/onload=`, indirect `(0, eval)(s)`), and no finding for `<script src>`, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)` (research.md R-11)
- [ ] T050 [P] [US3] `gates/test/prefix.test.ts`: the case-insensitive `sk-`/`--sk-` name rule at a name boundary and FR-022's monospace list in font declarations (stylesheets and embedded templates); `task-list`, `desk-row`, `--risk-level` pass (research.md R-12)
- [ ] T051 [P] [US3] `gates/test/signoff.test.ts`: commit records: missing trailer and non-matching trailer are findings; agent self sign-off passes; merge commits pass; only the full root hash `d08d4133bf0034e3d1ff29cddf2b0f13ca63290a` with no parent is exempt, and another hash starting `d08d413` is not (FR-023, research.md R-13)
- [ ] T052 [P] [US3] `gates/test/pins.test.ts`: on mini-workspaces under `gates/test/fixtures/pins/`: lockfile mismatch, `^` range, `workspace:^`, `workspace:*`, missing or short `minimumReleaseAge`, an `allowBuilds` entry `true` are findings; `workspace:0.0.0` passes; invalid JSON exits 2 (FR-027, operator decision FRESH-1-008 (b))
- [ ] T053 [P] [US3] `gates/test/registry.test.ts`: the registry check fails on a gate without a `gates.json` entry, a gate without a `ci.yml` job, or a mismatch with the FR-020 list (research.md R-10)
- [ ] T054 [P] [US3] `gates/test/plants.test.ts`: the plant job's verdicts on recorded gate results: a fail plant needs exit 1 with exactly the expected findings, a pass plant exit 0 with no finding (and the expected records), an error plant exit 2; a gate without fail, pass or error plant, an invalid `plant.json`, or a plant carrying configuration fails the job (contracts/plants.md, last paragraph)
- [ ] T055 [P] [US3] `gates/test/integration/plant-repo.test.ts`: `gates/lib/plant-repo.ts` builds a `repo-tree` repository with the configuration set of research.md R-10 and `node_modules` linked, a `commit-repo` on an empty signed-off base commit with an RFC 2606 identity, and a `mutation-repo` from `base/` and `head/`
- [ ] T056 [US3] Commit T046 to T055 alone, run `red.sh 4 phase`, confirm assertion failures against the scaffold

### Implementation (green)

- [ ] T057 [P] [US3] Implement `gates/lib/tsc-report.ts` and `gates/bin/typecheck.ts`; add `gate:typecheck`
- [ ] T058 [P] [US3] Create `eslint.config.ts` (`@eslint/js` recommended, typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`, project service, ignores `gates/plants/**`, `gates/test/fixtures/**`; research.md R-05) and `gates/bin/lint.ts` using `gates/lib/eslint-report.ts`; add `gate:lint`
- [ ] T059 [P] [US3] Implement `gates/stylelint/token-only.ts`, `gates/lib/stylelint-report.ts`, `gates/bin/style-lint.ts`, and create `stylelint.config.ts` (postcss-lit for `packages/elements/src/**/*.ts` except stories and test code, CSS for `packages/elements/src` and `packages/styles/src`, no `allowEmptyInput`; research.md R-07); add `gate:style-lint`
- [ ] T060 [P] [US3] Implement `gates/bin/csp.ts` (research.md R-11); add `gate:csp`
- [ ] T061 [P] [US3] Implement `gates/bin/prefix.ts` (research.md R-12); add `gate:prefix`
- [ ] T062 [P] [US3] Implement `gates/bin/signoff.ts` (research.md R-13); add `gate:signoff`
- [ ] T063 [P] [US3] Implement `gates/bin/pins.ts` with `--plant` (research.md R-14); add `gate:pins`
- [ ] T064 [US3] Add `--root` to every gate that lacks it (research.md R-09) and confirm each test above passes through it
- [ ] T065 [US3] Create `gates/gates.json` with every FR-020 gate (data-model.md § Gate) and the `mutation-plan`/`mutation-shard` helper jobs; implement `gates/lib/registry.ts`
- [ ] T066 [US3] Implement `gates/lib/plant-repo.ts` and `gates/bin/plants.ts` (plant verdicts and the registry check); add `gate:plants`
- [ ] T067 [P] [US3] Plants for `typecheck` and `lint` under `gates/plants/typecheck/` and `gates/plants/lint/` exactly as contracts/plants.md lists (fail, pass, error; the TS6053 breaking plant confirmed here, otherwise another TS5xxx/TS6xxx input)
- [ ] T068 [P] [US3] Plants for `unit-tests` and `test-lint` under `gates/plants/unit-tests/` and `gates/plants/test-lint/` (contracts/plants.md, including the Chromium plant and the seven FR-010 patterns)
- [ ] T069 [P] [US3] Plants for `mutation` under `gates/plants/mutation/` (contracts/plants.md, including the uncovered changed line, the `CompileError` pass plant and the reasoned record)
- [ ] T070 [P] [US3] Plants for `style-lint` and `prefix` under `gates/plants/style-lint/` and `gates/plants/prefix/` (contracts/plants.md, every reject class and the `<SK-Button>` plant)
- [ ] T071 [P] [US3] Plants for `csp`, `pins`, `config-copies` and `signoff` under `gates/plants/<id>/` (contracts/plants.md; invented `example.com` identities only, FR-034)
- [ ] T072 [P] [US3] Registry plants under `gates/plants/plants/` (a gate without an entry, a gate without a CI job, a matching pair)
- [ ] T073 [US3] Create `.github/workflows/ci.yml` per contracts/ci-checks.md: `permissions: contents: read`, `persist-credentials: false`, actions pinned by SHA, one job per check, the `mutation-plan`/`mutation-shard`/`mutation` verdict jobs with `timeout-minutes: 10` per shard, sign-off and mutation jobs with `fetch-depth: 0`, caches restored only
- [ ] T074 [P] [US3] Create `.github/workflows/cache.yml` per contracts/ci-checks.md (push to `main`, saves the pnpm store and Playwright cache under the keys `ci.yml` restores)
- [ ] T075 [P] [US3] Write `gates/README.md`: every gate with its check name and plants, the twelve check names the `main` ruleset must require, and the deferred gates with their issues (FR-026: Storybook build, visual regression and accessibility #10, contrast #5, custom-elements manifest #7 or #10, remote loads with the first element feature)
- [ ] T076 [US3] Run every `pnpm run gate:<id>` (exit 0) and `pnpm run gate:plants` (exit 0), and commit green
- [ ] T077 [US3] Shard timing as in T044, recorded in `specs/001-repository-foundation/reviews/phase-4/mutation-shards.md`

**Checkpoint**: all twelve checks run locally and the plant job proves each gate can fail.

---

## Phase 5: User Story 4 - Licence and governance files for a future public repository (Priority: P4)

**Goal**: the licence, contribution, security, notices and code-owner files (spec US4, FR-030 to FR-035; research.md
R-17). No GitHub-side check belongs to this phase (plan.md § Verification).

**Independent Test**: `gates/test/governance.test.ts` (SC-006) passes; the files read as FR-030 to FR-035 require.

No scaffold: the phase's test reads repository files and imports no new module.

### Tests (red, one commit)

- [ ] T078 [US4] `gates/test/governance.test.ts`: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES` exist at the root under exactly these names; `CONTRIBUTING.md` contains `Signed-off-by` and `git commit -s`; `.github/CODEOWNERS` names `@MOES-Media` as the only owner of every path; `SECURITY.md` names GitHub private vulnerability reporting, `@MOES-Media`, 3 working days and 10 working days (SC-006); commit it alone and run `red.sh 5 phase`

### Implementation (green)

- [ ] T079 [P] [US4] `LICENSE` with the Apache License 2.0 text (FR-030)
- [ ] T080 [P] [US4] `CONTRIBUTING.md`: sign-off with `git commit -s`, no contributor licence agreement, the Spec Kit flow and the constitution (FR-031)
- [ ] T081 [P] [US4] `SECURITY.md`: GitHub private vulnerability reporting once public (1.0.0, #11); until then contact `@MOES-Media` privately, not through an issue; what to include; acknowledgement within 3 working days and a status update within 10 (FR-032, operator decisions 2026-11-02)
- [ ] T082 [P] [US4] `THIRD_PARTY_NOTICES` stating that no third-party asset ships yet and that the Schibsted Grotesk entry arrives with #5 (FR-033)
- [ ] T083 [P] [US4] `.github/CODEOWNERS` with `* @MOES-Media` and no other owner (FR-035)
- [ ] T084 [US4] Run `pnpm test` and every gate, and commit green

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
- **Phase 2 (US1)** needs phase 1. It provides `gates/lib/cli.ts` and `findings.ts`, used by every later gate.
- **Phase 3 (US2)** needs phase 2 (its catch-up task mutation-tests phase 2's gate source).
- **Phase 4 (US3)** needs phases 2 and 3 (its plants cover the unit-tests, config-copies, test-lint and mutation gates).
- **Phase 5 (US4)** needs only phase 1 in principle, but runs last in the story workflow's order.
- Within a phase: scaffold → red commit → green tasks → closing tasks.

## Parallel Opportunities

- Phase 1: T003 to T006 and T008 to T010 and T012 touch separate files.
- Phase 2: the red tests T016 to T020 are separate files; in green, T022, T024, T025 and T027 are independent.
- Phase 3: T030 to T035 in parallel; T037 and T039 in parallel with T038.
- Phase 4: T046 to T055 in parallel; T057 to T063 in parallel; the plant groups T067 to T072 in parallel; T074 and T075 in parallel with T073.
- Phase 5: T079 to T083 in parallel.

## Implementation Strategy

- **MVP**: phases 1 and 2. After them the repository has a working test command and the story workflow's red/green
  check works on it (SC-003), which every later feature needs.
- **Incremental**: phase 3 adds the vacuous-test guards and backfills mutation testing for phase 2; phase 4 makes
  every gate a proven CI check; phase 5 adds governance files; then the operator's verification.
- Each phase is implemented, checked and reviewed by the story workflow (`/ocelle-run`) before the next starts.
