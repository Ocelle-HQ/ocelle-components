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
days before it was pinned, R-04; pnpm itself is a toolchain pin like Node, R-01): pnpm 12.16.1, Vitest 5.0.5, @vitest/browser-playwright 5.0.5, Vite 8.3.5 (Vitest's required peer), Playwright 1.64.1,
ESLint 10.13.0, jiti 2.7.0 (loads the `.ts` ESLint configs), @eslint/js 10.0.1, typescript-eslint 8.72.0,
@vitest/eslint-plugin 1.6.28, Stylelint 17.16.0, postcss-lit 1.4.1, postcss 8.5.31 (peer of postcss-lit),
postcss-value-parser 4.2.0 (imported by the token-only plugin), parse5 8.0.1 (HTML tokenizer of the CSP check),
@stryker-mutator/core, vitest-runner and typescript-checker 10.1.1, @types/node 26.6.5. Every package a root file
imports is declared in the root manifest; hoisting stays off (no `shamefullyHoist`, empty `publicHoistPattern`,
isolated `nodeLinker`). No runtime dependency in any package (Lit arrives with the first element feature).

**Storage**: N/A

**Testing**: `pnpm test` = Vitest projects `tokens`, `styles`, `gates` (Node) and `elements` (Chromium) (R-03); the
gate scripts are tested in `gates/test/`, calling each gate's exported functions in-process so Stryker can kill
mutants in gate source (child-process tests only for the thin CLI entry); their inputs live in `gates/test/fixtures/`
(R-10)

**Target Platform**: contributor machines (Linux, macOS) and GitHub Actions `ubuntu-latest`

**Project Type**: library monorepo (three packages) with repository tooling

**Performance Goals**: cold install plus test run under 5 minutes (SC-001); mutation of a bounded pull request under
10 minutes (SC-005, FR-013)

**Constraints**: offline setup never touches the network (FR-008); no gate reads `gates/plants/` except the plant job,
and nothing but the gate tests reads `gates/test/fixtures/` (FR-028); plant mode runs the repository's own gate
configuration and swaps only the inputs (R-10); no runtime dependency; actions pinned by SHA; CI token read-only
and not persisted (R-16)

**Scale/Scope**: 11 gates + plant job; about 90 plants (fail, pass and breaking); 3 empty packages; 5 governance files

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
| VIII. Test-first, non-vacuous | Pass with one exemption | Every gate and script behaviour is written red first; mutation testing (of package source and gate source, FR-011) and the test lint are delivered here; every gate has fail, pass and breaking plants judged by their expected findings, run through the gate's normal input collection where it has one (R-10). Phase 1 bootstrap exemption below. |
| Technology, licence, supply chain | Pass | Exact pins (workspace packages as `workspace:<exact version>`), committed lockfile, 7-day minimum release age and an empty install-script allow-list enforced by the pins gate (R-04, R-14), Apache-2.0, no third-party asset ships, no secrets (CI token read-only, R-16), DCO via the sign-off gate. |
| Workflow and quality gates | Pass, partial | Eleven gates + plant job; the remaining constitution gates are deferred with sunsets. |

**Post-design re-check (after Phase 1)**: unchanged. The design adds no package dependency at runtime, keeps every
gate behind the exit 0/1/2 contract, and keeps plants and gate-test fixtures out of the normal gates by configuration
(R-10).

**Re-check after plan squad round 1**: VIII now covers gate source in mutation testing (operator decision) and judges
plants by expected findings; the bootstrap exemption covers exactly phase 1; the supply-chain row gains the release
age and install-script policy. No new exception.

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
stryker.config.json          # mutation testing (mutate filled in by gates/bin/mutation.ts)
vitest.config.ts             # projects: tokens, styles, elements (Chromium), gates
packages/
├── tokens/   package.json  tsconfig.json  src/index.ts  test/
├── styles/   package.json  tsconfig.json  src/index.ts  test/
└── elements/ package.json  tsconfig.json  src/index.ts  test/
gates/
├── README.md                # every gate, its check name, its plants; deferred gates (FR-026)
├── gates.json               # gate registry (data-model.md)
├── bin/                     # test, setup-offline, csp, prefix, signoff, pins, config-copies, mutation, plants
├── lib/                     # shared: findings output, plant mode, registry loading
├── eslint/                  # local rule ocelle/no-snapshot-only
├── stylelint/               # local plugin ocelle/token-only
├── test/                    # tests of the gates (and governance.test.ts for SC-006)
│   └── fixtures/            # inputs of the gate tests only; excluded from every normal gate (FR-028)
└── plants/<gate-id>/<case>/ # fail, pass and breaking plants, plant.json each
.github/
├── workflows/ci.yml         # one job per gate + plant job
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

**Structure Decision**: a pnpm workspace with the three packages under `packages/` and all repository tooling under
`gates/` at the root (FR-001: no fourth workspace package). Gate scripts are plain TypeScript run by Node.

## Phases (for /speckit-tasks)

A bootstrap phase, then one phase per user story in priority order; each is implemented and reviewed through the
story workflow. The bootstrap has its own phase because the red/green check (`tdd-check.sh`) treats a phase as
exempt only when it has no red commit, and a red commit needs a working setup and test command to fail for the
missing behaviour rather than for a missing runner. (Since story extension 1.2.2 the check takes `test_command` and
`setup_command` from the current configuration, not from the commit it checks out; the split does not depend on
that.)

1. **Bootstrap (exempt)**: `tdd-exempt.md` and no red commit. Install (`package.json`, `pnpm-workspace.yaml`,
   lockfile, `.node-version`, `.gitignore`), the three package skeletons, `tsconfig.base.json`/`tsconfig.json`,
   `vitest.config.ts` with its four projects, `pnpm test` wired plainly to `vitest run`, `setup:online` and
   `setup:offline` wired plainly to the pnpm and Playwright commands, and `test_command` and `setup_command` set in
   both story configuration copies (contracts/story-config.md). No behaviour of its own.
2. **US1, workspace and test command (P1)**, red first; the demo phase of SC-003: the test command's exit codes
   (zero tests, failing test, missing browser, empty package) in `gates/bin/test.ts`, offline setup's failure cases
   in `gates/bin/setup-offline.ts` (R-04 test seam), the Chromium-only sample test (R-03), the configuration-copies
   check. Its base has the runner and both commands, so its red commits fail for the missing behaviour.
3. **US2, test quality (P2)**: test lint (including `ocelle/no-snapshot-only`), mutation wrapper (base argument,
   changed ranges over package and gate source, survivors including no-coverage, equivalent records and rejected
   disable forms), `mutation_command` in both copies, story review command change and reinstall.
4. **US3, merge gates (P3)**: code lint, typecheck, style lint plugin, CSP, prefix, sign-off, pins checks; the gate
   registry and its check against `ci.yml` and FR-020; the plant job and every plant; `ci.yml`; `gates/README.md`
   with deferred gates.
5. **US4, governance (P4)**: LICENSE, CONTRIBUTING, SECURITY, THIRD_PARTY_NOTICES, CODEOWNERS, the SC-006 test, and
   the CODEOWNERS verification of R-17.

## Complexity Tracking

| Exception | Why needed | Scope and sunset |
|---|---|---|
| Phase 1 bootstrap without a red step (`tdd-exempt.md`, no red commit) | No test runner exists before it, so no test can fail first | Exactly phase 1: install, the three package skeletons, the plain wiring of the test and setup commands, and the two story configuration values. All behaviour is in phase 2 and later, red first. Ends with phase 1. |
| Storybook build, visual regression and axe gates absent | Owned by #10 (triage 001) | `gates/README.md` lists them; sunset when #10 merges |
| Contrast gate absent | Needs tokens; owned by #5 | Sunset when #5 merges |
| Custom-elements manifest gate absent | No element exists | Sunset with the first element feature (#7) or #10 |
| CSP gate does not check remote loads | Constitution IV's no-network rule needs an element bundle to check | Sunset with the first element feature |
| Mutation testing of browser-mode element source unverified | No element source exists | Verified by the first element feature |
