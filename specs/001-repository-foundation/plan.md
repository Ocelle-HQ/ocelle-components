# Implementation Plan: Repository Foundation

**Branch**: `001-repository-foundation` (work on `claude/kitty-ui-speckit-decouple-x3prkx`) | **Date**: 2026-11-02 |
**Spec**: [spec.md](spec.md) | **Triage**: `triage/001-repository-foundation.md` (approved)

**Input**: Feature specification from `specs/001-repository-foundation/spec.md` (spec checks 1-3, approved at the spec
gate on 2026-11-02 after a final fix)

## Summary

Turn the empty repository into a pinned pnpm workspace of three empty packages with one test command (Vitest 5,
Chromium for elements) that the story workflow's red/green check uses; add the two vacuous-test guards (a test lint
and line-range mutation testing with StrykerJS); run eleven merge gates plus a plant job on every pull request, each
gate proven to fail on planted defects with the exact findings each plant lists; and add the licence and governance
files. Gates share one command contract (exit 0 pass, 1 defects found, 2 could not run, decided from each tool's
structured output, never from its exit code alone) and one registry, so the plant job can tell a gate that caught its
plant from a gate that broke. See [research.md](research.md) for every decision.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`erasableSyntaxOnly`, `verbatimModuleSyntax`, `module: nodenext`, relative imports written with `.ts` under
`allowImportingTsExtensions` and `rewriteRelativeImportExtensions`) on Node.js 26.13.0; gate scripts are TypeScript
run directly by Node's type stripping (R-01, R-02)

**Primary Dependencies** (dev only, exact pins; every package installed from the registry was published at least 7
days before it was pinned, R-04; Node and pnpm are toolchain pins exempt from that window by operator decision,
R-01): pnpm 12.16.1, Vitest 5.0.5, @vitest/browser-playwright 5.0.5, Vite 8.3.5 (Vitest's required peer),
Playwright 1.64.1, ESLint 10.13.0, jiti 2.7.0 (loads the `.ts` ESLint configs), @eslint/js 10.0.1,
typescript-eslint 8.72.0, @vitest/eslint-plugin 1.6.28, Stylelint 17.16.0, postcss-lit 1.4.1, postcss 8.5.31
(peer of postcss-lit), postcss-value-parser 4.2.0 (imported by the token-only plugin), parse5 8.0.1 (HTML tokenizer
of the CSP check), @stryker-mutator/core, vitest-runner and typescript-checker 10.1.1, @types/node 26.6.5. Every package a root file
imports is declared in the root manifest; hoisting stays off (no `shamefullyHoist`, empty `publicHoistPattern`,
isolated `nodeLinker`). No runtime dependency in any package (Lit arrives with the first element feature).

**Storage**: N/A

**Testing**: `pnpm test` = Vitest projects `tokens`, `styles`, `gates`, `gates-integration` (Node) and `elements`
(Chromium) (R-03). Each gate's decision logic is a pure function tested in-process in the `gates` project on
recorded tool output, so Stryker kills mutants in gate source with fast tests; tests that start a real tool (tsc,
ESLint, Stylelint, Vitest with Chromium, Stryker, pnpm, git, a gate as a child process) live in
`gates/test/integration/`, the `gates-integration` project, which Stryker does not run (R-08, R-09; operator
decision, plan squad round 3). Test inputs live in `gates/test/fixtures/` (R-10)

**Target Platform**: contributor machines (Linux, macOS) and GitHub Actions `ubuntu-latest`

**Project Type**: library monorepo (three packages) with repository tooling

**Performance Goals**: cold install plus test run under 5 minutes (SC-001); mutation of one shard (up to 10 changed
files and 250 changed lines of package and gate source; 250 by operator decision, phase 4 round 3,
human:jeroennouwsdev, 2026-11-03: GitHub runner variance took a 435-line shard past 10 minutes) under 10 minutes,
the CI mutation check split into such shards (SC-005, FR-013, R-08)

**Constraints**: offline setup never touches the network (FR-008); no gate reads `gates/plants/` except the plant job,
and nothing but the gate tests reads `gates/test/fixtures/` (FR-028); plant mode runs the repository's own gate
configuration and swaps only the inputs: every plant but the pins plants is laid out at repository paths in a
temporary repository and checked by the gate in normal mode with `--root` (R-10); no runtime dependency; actions
pinned by SHA; CI token read-only and not persisted (R-16)

**Scale/Scope**: 11 gates + plant job; about 100 plants (fail, pass and breaking); 3 empty packages; 5 governance files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Framework-free `ocelle-` elements | Pass (n/a) | No element ships. The prefix check (FR-022) enforces `ocelle-` naming for every later feature. |
| II. Tokens only, brand rules | Pass | Style lint enforces token-only (FR-024); prefix check rejects monospace and `sk-`. Brand colour rules arrive with tokens (#5). |
| III. Accessible by construction | Pass (n/a) | Nothing rendered. Real-Chromium tests (FR-005) make accessibility-tree tests possible from #5/#7 on. Axe CI deferred to #10 (Complexity Tracking). |
| IV. Strict-CSP and offline | Pass, partial | CSP check on built output by HTML tokenizer and ES parser (FR-021, R-11). Remote-load check deferred (Complexity Tracking). Offline setup (FR-008). |
| V. Storybook and tests | Pass, partial | Tests per behaviour; Storybook and visual baselines deferred to #10 (Complexity Tracking). |
| VI. Consumer needs, own code | Pass | Scope from issue #4 and the triage record; nothing copied. |
| VII. Semver of the public surface | Pass | No public surface changes (semver none). |
| VIII. Test-first, non-vacuous | Pass with one exemption | Every gate and script behaviour is written red first, including each wrapper's classification of tool output, the CLI entry wrapper's exit 2 on an uncaught error and every gate's `--root`; one scaffold commit per phase, before its one red commit, adds the new modules with their signatures and no behaviour, so red tests load and fail on their assertions, and `tdd-check.sh` proves the final tests fail against the scaffold too, not only against the base (story extension 1.3.0, § Phases); mutation testing (of package source and gate source, FR-011) and the test lint are delivered here, and phase 3 mutation-tests phase 2's gate source, so no phase with behaviour goes without it (§ Phases); each gate's decision logic is pure and tested in-process, so a shard's mutation run stays within its time bound (R-08); every gate has fail, pass and breaking plants judged by their expected findings, and every plant but the pins mini-workspaces is laid out at repository paths and run through the gate's normal file collection with `--root` (R-10). Phase 1 bootstrap exemption below. |
| Technology, licence, supply chain | Pass | Exact pins (workspace packages as `workspace:<exact version>`), committed lockfile, 7-day minimum release age for registry packages (the Node and pnpm toolchain pins are exempt by operator decision, R-01) and an empty install-script allow-list enforced by the pins gate (R-04, R-14), Apache-2.0, no third-party asset ships, no secrets (CI token read-only, R-16), DCO via the sign-off gate. |
| Workflow and quality gates | Pass, partial | Eleven gates + plant job; the twelve check names are required on `main` by a ruleset the operator configures (§ Verification); the remaining constitution gates are deferred with sunsets. |

**Post-design re-check (after Phase 1)**: unchanged. The design adds no package dependency at runtime, keeps every
gate behind the exit 0/1/2 contract, and keeps plants and gate-test fixtures out of the normal gates by configuration
(R-10).

**Re-check after plan squad round 1**: VIII now covers gate source in mutation testing (operator decision) and judges
plants by expected findings; the bootstrap exemption covers exactly phase 1; the supply-chain row gains the release
age and install-script policy. No new exception.

**Re-check after plan squad round 2**: VIII gains the scaffold commit before each red commit (operator decision), so
every red step fails for the missing behaviour, not an import error; a scaffold carries no behaviour and is accepted
by the review only as such. Typecheck and lint plants extend the root `tsconfig.json` the gate runs with, and the
file gates' plants run through their normal file collection (R-10). The merge rule of the Development Workflow is
enforced by a ruleset on `main` that requires the twelve checks (operator decision). Mutation testing in CI runs in
shards, each within the FR-013 bound (operator decision, spec FR-013/SC-005 amended). No new exception.

**Re-check after plan squad round 3** (operator decisions): VIII's "proven against the old code" check is no longer
vacuous for phases with new modules: the scaffold step, its record (`scaffold.sh`) and `tdd-check.sh`'s run of the
final tests against the scaffold come from story extension 1.3.0, and a phase has one scaffold and one red commit.
Phase 3 mutation-tests phase 2's gate source, so no phase with behaviour is reviewed without mutation testing.
Gate decision logic is pure and tested in-process, and tool-starting tests run in a project Stryker does not run,
so shard time follows the line bound; SC-005 is measured on this feature's real shards. Every file plant now runs
through the gate's normal file collection (`repo-tree` for typecheck, lint, test lint, unit tests and
config-copies), and no plant carries a tsconfig. A cache-warming workflow on `main` makes "cache restored" in SC-005
reachable. The Node and pnpm pins are exempt from the release-age window by operator decision (R-01), which the
constitution does not govern. FR-011 states that a mutant that does not compile is invalid (operator amendment,
approved by the operator on 2026-11-02 after verify 1 of round 3). No new exception.

**Re-check after analysis 1** (operator: "fix all, then re-analyze", tasks gate 2026-11-02): three pieces of gate
behaviour had reached green tasks without a red test; each now has one in its phase's red commit and its module in
that phase's scaffold: the CLI entry wrapper (exit 2 on any uncaught error) and `--root` parsing in phase 2, the
ESLint report classification and the test-lint entry in phase 3, and `--root` on each phase 3 and phase 4 gate,
run in `gates-integration` (R-06, R-09). No new exception.

**Re-check after analysis 2** (operator: "fix all, then one last re-analysis", tasks gate 2026-11-02): phase 4's
`--root` test builds its temporary repositories itself rather than through `gates/lib/plant-repo.ts`, a module of
the same scaffold, so its red failure is each gate's missing behaviour, not its own setup (R-09); red tests that
assert a configuration file the green commit creates record that file as part of the phase's missing behaviour in
the phase review; the pins lockfile verdict is tested in-process on recorded pnpm output and the real pnpm run only
in `gates-integration` (R-14). No new exception.

**Re-check after the phase 3 gate** (operator decisions, 2026-11-02, on review notes R1-02, R1-03, R2-01 and
R2-02): VIII gains three test-lint rules for assertions that cannot fail the test (FR-010 amended, R-06), added
test-first in phase 3 as T091: a stub commit gives its red tests a module to load, as a scaffold does, and its red
commit is recorded under the next fix label of phase 3. The three patterns are proven by the gate's own fixtures in
`gates-integration`, not by new plants; the test-lint gate keeps its plants (SC-004). R-08's equivalent records may
also cover thin adapter functions that only call an outside tool, each naming the `gates-integration` case that
covers it, so the review can check the claim line by line. The test lint ignores `.stryker-tmp/` from phase 4
(T092, red first). No new exception.

**Re-check after phase 4 round 3** (operator decision, phase 4 round 3, human:jeroennouwsdev, 2026-11-03: GitHub
runner variance took a 435-line shard past 10 minutes): the FR-013 shard bound goes from 500 to 250 changed lines
(spec FR-013/SC-005, R-08); 10 files per shard and the 10-minute shard job limit stay, and a file with more than
250 changed lines is a shard on its own. More shard jobs run in parallel with the same mutation strength.
`gates/lib/mutation/shards.ts` changes test-first as T093 (red under `red.sh 4 fix-3`). No new exception.

**Re-check after the feature gate** (operator decisions, human:jeroennouwsdev, 2026-11-03): SC-005 is measured on
GitHub run 41613884529 and accepted with its 1:59 margin; a cancelled shard is investigated (phase 4 round 4 note
R4-01, § Verification, R-08). The optional `plant.json` field `base` is in data-model.md § Plant and
contracts/plants.md (phase 4 round 2 note R2-02). Phase 3 reopens for one test-first unit, T094 (red under
`red.sh 3 fix-5`), so that `gates/lib/spawn.ts`'s `child.on("error")` path is covered and the equivalent-mutant
records of `gates/bin/config-copies.ts` and `gates/bin/test-lint.ts` name their covering `gates-integration` case
as R-08 requires (phase 3 round 5, O5-01 and O5-02: "Fix in this PR"). No new exception.

**Re-check after the landing review** (operator decisions, PR #18 landing review, human:jeroennouwsdev,
2026-11-03): VIII is tightened where the gates could pass or prove nothing without saying so. The mutation gate
reads tab-suffixed and C-quoted `+++` diff headers and exits 2 on any header it cannot parse, and a changed
in-scope path that Stryker cannot take as a `mutate` input (a glob metacharacter `*?[]{}!` or a comma, or
otherwise not passable verbatim) is exit 2 before Stryker runs ("could not run", contracts/gate-cli.md), while a
changed file absent from Stryker's report counts as zero mutants, so a type-only or comment-only change passes
(spec FR-011, R-08; phase 3 round 7, O7-01 and O7-02; O7-02 as amended: "Guard the input instead
(Recommended)"): phase 3 reopens for T095 (red under
`red.sh 3 fix-7`). Every breaking plant names the cause its gate must report with exit 2, and a pass plant may not
set `base` (spec FR-025, data-model.md § Plant, contracts/plants.md, R-10; phase 4 round 5, O5-01 and O5-02):
phase 4 reopens for T096 (red under `red.sh 4 fix-5`). Mission pull requests are squash-merged and the folded
branch stays on the remote as the home of the red/green evidence SHAs (§ Verification item 5, landing note L1-08).
No new exception.

## Project Structure

### Documentation (this feature)

```text
specs/001-repository-foundation/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R-01 to R-17
├── data-model.md        # Phase 1: gates, plants, configuration, records
├── quickstart.md        # Phase 1: validation run
├── contracts/
│   ├── gate-cli.md      # command, exit codes and output of every gate
│   ├── plants.md        # plant layout and the plant form of each gate
│   ├── story-config.md  # the story configuration values and the review change
│   └── ci-checks.md     # the named CI checks
├── checklists/requirements.md
├── reviews/spec/        # spec checks 1-3 and fixes
├── verification.md      # operator's GitHub-side verification (§ Verification)
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
package.json                 # private workspace root: packageManager, engines, scripts (test, setup:*, gate:*)
pnpm-workspace.yaml          # packages/*; minimumReleaseAge 10080, allowBuilds {} (R-04)
.gitignore                   # node_modules/, packages/*/dist/, .stryker-tmp/, reports/, __screenshots__/, *.tsbuildinfo
pnpm-lock.yaml
.node-version                # 26.13.0
tsconfig.base.json           # strict compiler options (Technical Context)
tsconfig.json                # all repository TypeScript (typecheck gate)
eslint.config.ts             # code lint
eslint.test.config.ts        # test lint
stylelint.config.ts          # style lint (token-only)
stryker.config.json          # mutation testing (mutate filled in by gates/bin/mutation.ts; vitest.mutation.config.ts)
vitest.config.ts             # projects: tokens, styles, elements (Chromium), gates, gates-integration
vitest.mutation.config.ts    # the projects of vitest.config.ts minus gates-integration (Stryker's runner, R-08)
packages/
├── tokens/   package.json  tsconfig.json  src/index.ts  test/
├── styles/   package.json  tsconfig.json  src/index.ts  test/
└── elements/ package.json  tsconfig.json  src/index.ts  test/
gates/
├── README.md                # every gate, its check name, its plants; the required checks on main; deferred gates (FR-026)
├── gates.json               # gate registry (data-model.md)
├── bin/                     # test, setup-offline, config-copies, test-lint, mutation, typecheck, lint, style-lint, csp, prefix, signoff, pins, plants
├── lib/                     # shared: CLI entry and --root, findings output, tool-output reports, plant mode, registry
├── eslint/                  # local rule ocelle/no-snapshot-only
├── stylelint/               # local plugin ocelle/token-only
├── test/                    # in-process tests of the gates (and governance.test.ts for SC-006)
│   ├── integration/         # tests that start a real tool (project gates-integration; not run by Stryker)
│   └── fixtures/            # gate-test inputs only (recorded tool output, fixture trees); no normal gate reads them
└── plants/<gate-id>/<case>/ # fail, pass and breaking plants, plant.json each
.github/
├── workflows/ci.yml         # one job per gate (mutation: plan, shards, verdict) + plant job; restores caches
├── workflows/cache.yml      # on push to main: setup:online, saves the pnpm store and Playwright cache (R-16)
└── CODEOWNERS               # * @MOES-Media
LICENSE  CONTRIBUTING.md  SECURITY.md  THIRD_PARTY_NOTICES
```

Also changed: both story configuration copies (test, setup and mutation commands; contracts/story-config.md) and the
story review command (passes the phase base to mutation testing as `--base <sha>`). The source
`tooling/speckit/extensions/story/commands/speckit.story.review.md` is edited and reinstalled with
`specify extension remove story && specify extension add --dev tooling/speckit/extensions/story` (tooling/speckit/README.md),
which updates every installed copy: `.specify/extensions/story/commands/speckit.story.review.md`,
`.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md` and
`.claude/skills/speckit-story-review/SKILL.md` (the one the reviewer follows).

Not changed here: the story extension's scaffold step. Story extension 1.3.0 (commit 6b88846, outside this feature)
already gives the implement command its scaffold step (step 4: one scaffold commit per phase, before the red
commit, no test file, recorded by `.specify/extensions/story/scripts/scaffold.sh <N>`), makes `tdd-check.sh` run the
final tests against the scaffold as well as against the base and require them to fail there, and makes the review
check that the scaffold carries no behaviour. This plan uses those as they are.

**Structure Decision**: a pnpm workspace with the three packages under `packages/` and all repository tooling under
`gates/` at the root (FR-001: no fourth workspace package). Gate scripts are plain TypeScript run by Node.

## Phases (for /speckit-tasks)

A bootstrap phase, then one phase per user story in priority order; each is implemented and reviewed through the
story workflow. The bootstrap has its own phase because the red/green check (`tdd-check.sh`) treats a phase as
exempt only when it has no red commit, and a red commit needs a working setup and test command to fail for the
missing behaviour rather than for a missing runner. (Since story extension 1.2.2 the check takes `test_command` and
`setup_command` from the current configuration, not from the commit it checks out; the split does not depend on
that.)

Every phase from 2 on whose tests import a module that does not exist at its base starts, after `base.sh` and
before its red commit, with one **scaffold commit** (operator decisions, plan squad rounds 2 and 3), made through
step 4 of the story implement command (story extension 1.3.0): it adds every new module the phase's tests import
(under `gates/bin`, `gates/lib`, `gates/eslint` or `gates/stylelint`, none of which `test_pathspec` matches) with
its exported signatures and no behaviour: `run()` returns 0 and prints nothing, every other exported function
returns an empty or zero value, the ESLint rule and the Stylelint plugin report nothing. The scaffold wires
nothing: no `package.json` script, story configuration value, ESLint, Stylelint, Vitest or Stryker configuration
points at a scaffolded module (so `pnpm test` and the setup command stay as they were at the phase base until the
green commit rewires them). It is committed as `chore(<feature>): phase <N> scaffold` and recorded with
`.specify/extensions/story/scripts/scaffold.sh <N>`, which must report `"recorded": true`. A phase has exactly one
scaffold commit and one red commit: the scaffold holds every new module of the whole phase, and the red commit
holds all of the phase's tests (implement step 5; `red.sh` keeps one `phase` entry). The red tests then load and
fail on their assertions, the missing behaviour that constitution VIII requires. The mechanics: `red.sh` judges the
red commit tests-only against its parent (the scaffold); `tdd-check.sh` runs the final tests against `base.sha`
(where a missing module alone makes them fail) and against `scaffold.sha`, where they must fail too, so a test
loosened after the red commit is caught automatically; the phase review checks that the scaffold adds signatures
only, with no behaviour and no test file, and records it under constitution VIII's exemption ("scaffolding": no
test could fail for it); a scaffold with behaviour is a blocking finding.

1. **Bootstrap (exempt)**: `tdd-exempt.md` and no red commit. Install (`package.json`, `pnpm-workspace.yaml`,
   lockfile, `.node-version`, `.gitignore`), the three package skeletons, `tsconfig.base.json`/`tsconfig.json`,
   `vitest.config.ts` with its five projects, `pnpm test` wired plainly to `vitest run`, `setup:online` and
   `setup:offline` wired plainly to the pnpm and Playwright commands, and `test_command` and `setup_command` set in
   both story configuration copies (contracts/story-config.md). No behaviour of its own.
2. **US1, workspace and test command (P1)**, red first; the demo phase of SC-003: the behaviour of
   `gates/bin/test.ts` (missing browser, failed tests as findings, no test file found, through its `--root` seam on
   fixture workspaces; R-03 lists which US1 scenarios are its behaviour and which hold through Vitest at the phase 1
   base), offline setup's failure cases in `gates/bin/setup-offline.ts` (R-04 test seam), the Chromium-only sample
   test (R-03), the configuration-copies check (with `--root`, R-15), and `gates/lib/cli.ts`'s entry wrapper (exit 2
   on any uncaught error) and `--root` parsing (R-09). Its base has the runner and both commands, and
   its scaffold commit gives the red tests modules to load, so its red commit fails for the missing behaviour. It
   closes by showing, in a disposable clone, that `tdd-check.sh` reports `fail` on a throwaway phase whose final tests
   pass at its base (SC-003's second clause).
3. **US2, test quality (P2)**: test lint (including `ocelle/no-snapshot-only`, the entry `gates/bin/test-lint.ts`
   with `--root` and the ESLint report classification `gates/lib/eslint-report.ts`, R-06), mutation wrapper
   (`--root`, base argument, changed ranges over package and gate source, survivors including no-coverage, compile
   errors as invalid, equivalent records and rejected disable forms, the shard split and `--files`,
   `vitest.mutation.config.ts` leaving out `gates-integration`, R-08), `mutation_command` in both copies, story review command change and
   reinstall. Two tasks close the phase (operator decisions, plan squad round 3):
   - **Phase 2's gate source**: once the mutation wrapper is green, run
     `pnpm run gate:mutation -- --base <reviews/phase-2/base.sha>` (phase 2's review ran before mutation testing
     existed) and save its output as `reviews/phase-3/mutation-phase-2.log`. Each survivor is resolved in phase 3
     test-first: a test that kills it, shown by a re-run of the same command reporting it killed; where the survivor
     shows wrong behaviour, a failing test before the code change; or an equivalent record with its reason
     (FR-012). The phase 3 review re-runs the command and treats any unresolved survivor as blocking, as for its own
     code.
   - **Shard timing**: `pnpm run gate:mutation -- --base <reviews/phase-1/base.sha> --plan`, then each shard with
     `--files`, timed, durations recorded in `reviews/phase-3/mutation-shards.md` (R-08).
4. **US3, merge gates (P3)**: code lint, typecheck, style lint plugin, CSP, prefix, sign-off, pins checks; the gate
   registry and its check against `ci.yml` and FR-020; `--root` on every phase 4 gate, in its scaffold signature and
   red-tested in `gates-integration` (R-09); the plant job and every plant
   (repo-tree plants for typecheck, code lint, style lint, unit tests, test lint, prefix, CSP and config-copies; the
   commit-repo plants on an empty base commit; R-10); `ci.yml` (with the sharded mutation jobs, restoring caches
   only) and `cache.yml` (R-16); `gates/README.md` with deferred gates and the list of the twelve checks required on
   `main`. The phase ends with the same shard timing task as phase 3, recorded in
   `reviews/phase-4/mutation-shards.md`, and an early SC-001 timing (a cold `setup:online` plus `pnpm test` in a
   fresh clone with an empty store and browser cache, recorded in `reviews/phase-4/sc-001-timing.md`; an overrun is
   reported to the operator), since phases 2 to 4 add the real-tool `gates-integration` tests (analysis 2).
5. **US4, governance (P4)**: LICENSE, CONTRIBUTING, SECURITY, THIRD_PARTY_NOTICES, CODEOWNERS, the SC-006 test. No
   GitHub-side check is part of this phase or its review (agents cannot push, open pull requests or call `gh api`);
   those are the operator's verification below.

## Verification (operator, after the phases)

After phase 5 is reviewed, the operator pushes the branch and opens the pull request (agents never push), then
makes every GitHub-side check and records each result, with its evidence (command output, run links, durations), in
`specs/001-repository-foundation/verification.md`:

1. CODEOWNERS: GitHub reports no CODEOWNERS errors for the pull request branch
   (`gh api repos/Ocelle-HQ/ocelle-components/codeowners/errors?ref=<branch>` returns an empty `errors` list) and
   `@MOES-Media` is a user or `@org/team` with write access to the repository; if not, the operator names a
   replacement owner and amends FR-032/FR-035 (R-17).
2. Checks: the pull request shows the twelve named checks of contracts/ci-checks.md, all green (US3 scenario 1).
3. Required checks: a ruleset (or branch protection) on `main` requires the twelve check names of
   contracts/ci-checks.md, matching the list in `gates/README.md`, so a pull request that removes a gate from
   `ci.yml`, `gates.json` and `registry.ts` together cannot merge with that check missing (operator decision, plan
   squad round 2).
4. Timings: SC-001 (cold install plus tests) and SC-005 (every mutation shard of the feature's pull request,
   quickstart step 12; cold, since `cache.yml` first runs when the feature merges). SC-005 is measured on GitHub
   run https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41613884529 (head `e985ed3`): 18 shards, all
   finished, the longest 8:01 (`gates/lib/pins-rules.ts` alone, 137 changed lines). Shard time follows the
   mutants per file, not the changed lines, so the line bound does not shorten a single-file shard. A shard
   cancelled at the 10-minute limit is a failure to investigate, not to re-run blindly; if it recurs, splitting a
   file's changed line ranges across shards is the known lever (R-08; a spec change to FR-013). Operator decision,
   phase 4 round 4 note R4-01, feature gate, human:jeroennouwsdev, 2026-11-03: "Accept for now: Record this run as
   the SC-005 measurement, and investigate any cancelled shard if one happens."
5. Merge method and evidence home (operator decision, PR #18 landing review note L1-08, human:jeroennouwsdev,
   2026-11-03: "Squash, keep archive branch (Recommended)": "Squash-merge as planned; keep the folded branch (or an
   archive/ ref) on the remote as the evidence home, and record that."): mission pull requests are squash-merged,
   so `main` holds one commit per mission and none of the `base.sha`, `scaffold.sha` or `red-commits` SHAs. The
   folded branch is kept on the remote after the merge (not deleted; or pushed first to an `archive/` ref that is
   kept), so those SHAs, `tdd-check.sh` and the review files stay resolvable there; it is the home of the red/green
   evidence. The operator records in `verification.md` the merge method used and the remote branch or ref that
   holds the evidence, with its head SHA.

## Complexity Tracking

| Exception | Why needed | Scope and sunset |
|---|---|---|
| Phase 1 bootstrap without a red step (`tdd-exempt.md`, no red commit) | No test runner exists before it, so no test can fail first | Exactly phase 1: install, the three package skeletons, the plain wiring of the test and setup commands, and the two story configuration values. All behaviour is in phase 2 and later, red first. Ends with phase 1. |
| Storybook build, visual regression and axe gates absent | Owned by #10 (triage 001) | `gates/README.md` lists them; sunset when #10 merges |
| Contrast gate absent | Needs tokens; owned by #5 | Sunset when #5 merges |
| Custom-elements manifest gate absent | No element exists | Sunset with the first element feature (#7) or #10 |
| CSP gate does not check remote loads | Constitution IV's no-network rule needs an element bundle to check | Sunset with the first element feature |
| Mutation testing of browser-mode element source unverified | No element source exists | Verified by the first element feature |
