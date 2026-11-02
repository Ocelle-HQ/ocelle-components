# Implementation Plan: Repository Foundation

**Branch**: `001-repository-foundation` (work on `claude/kitty-ui-speckit-decouple-x3prkx`) | **Date**: 2026-11-02 |
**Spec**: [spec.md](spec.md) | **Triage**: `triage/001-repository-foundation.md` (approved)

**Input**: Feature specification from `specs/001-repository-foundation/spec.md` (spec checks 1-3, approved at the spec
gate on 2026-11-02 after a final fix)

## Summary

Turn the empty repository into a pinned pnpm workspace of three empty packages with one test command (Vitest 5,
Chromium for elements) that the story workflow's red/green check uses; add the two vacuous-test guards (a test lint
and line-range mutation testing with StrykerJS); run eleven merge gates plus a plant job on every pull request, each
gate proven to fail on planted defects; and add the licence and governance files. Gates share one command contract
(exit 0 pass, 1 defects found, 2 could not run) and one registry, so the plant job can tell a gate that caught its
plant from a gate that broke. See [research.md](research.md) for every decision.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) on
Node.js 26.13.0; gate scripts are TypeScript run directly by Node (R-01, R-02)

**Primary Dependencies** (dev only, exact pins): pnpm 12.16.1, Vitest 5.1.0, @vitest/browser-playwright 5.1.0,
Playwright 1.64.1, ESLint 10.14.0, @eslint/js 10.0.1, typescript-eslint 8.72.1, @vitest/eslint-plugin 1.6.28,
Stylelint 17.16.0, postcss-lit 1.4.1, @stryker-mutator/core, vitest-runner and typescript-checker 10.1.1, @types/node
26.6.6. No runtime dependency in any package (Lit arrives with the first element feature).

**Storage**: N/A

**Testing**: `pnpm test` = Vitest projects `tokens`, `styles`, `gates` (Node) and `elements` (Chromium) (R-03); the
gate scripts are tested in `gates/test/`

**Target Platform**: contributor machines (Linux, macOS) and GitHub Actions `ubuntu-latest`

**Project Type**: library monorepo (three packages) with repository tooling

**Performance Goals**: cold install plus test run under 5 minutes (SC-001); mutation of a bounded pull request under
10 minutes (SC-005, FR-013)

**Constraints**: offline setup never touches the network (FR-008); no gate reads `gates/plants/` except the plant job
(FR-028); no runtime dependency; actions pinned by SHA

**Scale/Scope**: 11 gates + plant job; about 40 plants; 3 empty packages; 5 governance files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|---|---|---|
| I. Framework-free `ocelle-` elements | Pass (n/a) | No element ships. The prefix check (FR-022) enforces `ocelle-` naming for every later feature. |
| II. Tokens only, brand rules | Pass | Style lint enforces token-only (FR-024); prefix check rejects monospace and `sk-`. Brand colour rules arrive with tokens (#5). |
| III. Accessible by construction | Pass (n/a) | Nothing rendered. Real-Chromium tests (FR-005) make accessibility-tree tests possible from #5/#7 on. Axe CI deferred to #10 (Complexity Tracking). |
| IV. Strict-CSP and offline | Pass, partial | CSP check on built output (FR-021). Remote-load check deferred (Complexity Tracking). Offline setup (FR-008). |
| V. Storybook and tests | Pass, partial | Tests per behaviour; Storybook and visual baselines deferred to #10 (Complexity Tracking). |
| VI. Consumer needs, own code | Pass | Scope from issue #4 and the triage record; nothing copied. |
| VII. Semver of the public surface | Pass | No public surface changes (semver none). |
| VIII. Test-first, non-vacuous | Pass with one exemption | Every gate and script behaviour is written red first; mutation testing and the test lint are delivered here; every gate has plants. Bootstrap exemption below. |
| Technology, licence, supply chain | Pass | Exact pins, committed lockfile, Apache-2.0, no third-party asset ships, no secrets, DCO via the sign-off gate. |
| Workflow and quality gates | Pass, partial | Eleven gates + plant job; the remaining constitution gates are deferred with sunsets. |

**Post-design re-check (after Phase 1)**: unchanged. The design adds no package dependency at runtime, keeps every
gate behind the exit 0/1/2 contract, and keeps plants out of the normal gates by configuration (R-10).

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
pnpm-workspace.yaml          # packages/*
pnpm-lock.yaml
.node-version                # 26.13.0
tsconfig.base.json           # strict compiler options
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
└── plants/<gate-id>/<case>/ # planted defects and pass plants, plant.json each
.github/
├── workflows/ci.yml         # one job per gate + plant job
└── CODEOWNERS               # * @MOES-Media
LICENSE  CONTRIBUTING.md  SECURITY.md  THIRD_PARTY_NOTICES
```

Also changed: both story configuration copies (test, setup and mutation commands; contracts/story-config.md) and the
story review command (passes the phase base to mutation testing; reinstalled into `.specify/`).

**Structure Decision**: a pnpm workspace with the three packages under `packages/` and all repository tooling under
`gates/` at the root (FR-001: no fourth workspace package). Gate scripts are plain TypeScript run by Node.

## Phases (for /speckit-tasks)

One phase per user story, in priority order; each is implemented and reviewed through the story workflow.

1. **US1, workspace and test command (P1)**: bootstrap (exempt, see below), then red-first: the test command's exit
   codes (zero tests, failing test, missing browser, empty package), offline setup, configuration-copies check,
   story configuration filled in.
2. **US2, test quality (P2)**: test lint (including `ocelle/no-snapshot-only`), mutation wrapper (base resolution,
   changed ranges, survivors including no-coverage, equivalent records), story review command change.
3. **US3, merge gates (P3)**: code lint, typecheck, style lint plugin, CSP, prefix, sign-off, pins checks; the gate
   registry; the plant job and every plant; `ci.yml`; `gates/README.md` with deferred gates.
4. **US4, governance (P4)**: LICENSE, CONTRIBUTING, SECURITY, THIRD_PARTY_NOTICES, CODEOWNERS, and the SC-006 test.

## Complexity Tracking

| Exception | Why needed | Scope and sunset |
|---|---|---|
| Phase 1 bootstrap without a red step (`tdd-exempt.md`) | No test runner exists before it, so no test can fail first | Only install, the three package skeletons and the test command's wiring; every behaviour in phase 1 is red first. Ends with phase 1. |
| Storybook build, visual regression and axe gates absent | Owned by #10 (triage 001) | `gates/README.md` lists them; sunset when #10 merges |
| Contrast gate absent | Needs tokens; owned by #5 | Sunset when #5 merges |
| Custom-elements manifest gate absent | No element exists | Sunset with the first element feature (#7) or #10 |
| CSP gate does not check remote loads | Constitution IV's no-network rule needs an element bundle to check | Sunset with the first element feature |
| Mutation testing of browser-mode element source unverified | No element source exists | Verified by the first element feature |
