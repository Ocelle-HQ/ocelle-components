---
analyzed_at: 2026-11-02T20:01:06Z
head: 84763aae8c0a5ba8c1b262ecb2d66e909d8da10c
critical: 1
high: 0
medium: 6
low: 2
coverage: 100
---

<!-- Written by analyst-anouk (speckit-squad-analyze, analysis 2). The harness refused the subagent's own file write
("Subagents should return findings as text, not write report files"), so the orchestrator recorded the report
verbatim from the subagent's hand-back. -->

## Specification Analysis Report

Feature: `specs/001-repository-foundation` (spec.md, plan.md, tasks.md T001-T090 after `reviews/analysis-fixes-1.md`;
research.md, data-model.md, quickstart.md and contracts/ read where tasks defer to them; the story extension's
`tdd-check.sh`, `base.sh` and `common.sh` read where tasks depend on how they behave). Constitution: v1.3.1. Every
finding of analysis 1 (head 3a60b7f) was checked against the fixed artifacts and is resolved. The findings below are
new, or were introduced by the fixes.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | tasks.md:L146 (T051), L159 (T061), L160 (T062); research.md R-09 (L291-295) | T062 builds each temporary repository with `gates/lib/plant-repo.ts` (T061). At the red commit that module comes from the phase 4 scaffold, so it builds nothing and "returns empty values" (T051). Every T062 case therefore fails because its own setup builds nothing: the guard assertion that the configuration files exist fails on an empty or missing directory. No gate's `--root` behaviour is ever exercised. The `tdd-check.sh` run against the scaffold fails for the same reason, so a T062 loosened after the red commit would not be caught. Principle VIII requires the red failure to be "the missing behaviour, not a syntax, import or setup error". | Have T062 build its temporary repositories in the test itself, as T019, T021, T035 and T041 do (copy the fixture tree and the configuration set, link `node_modules`, and for `signoff` run `git init` and commit the records). Do not use `plant-repo.ts`, and keep T061 as that module's own red test. Alternatively, move T062 so that it does not depend on any module of the same scaffold. |
| G1 | Coverage Gap | MEDIUM | tasks.md:L95 (phase 3 Independent Test), L105-107 (T033-T035), L118 (T043), L177 (T074); spec.md:L234-236 (FR-010), L445-447 (SC-004) | Phase 3's Independent Test says the test lint "reports each of the seven FR-010 patterns", but its red tests cover only two: `ocelle/no-snapshot-only` (T033) and `expect-expect` (T035). Five rule settings in `eslint.test.config.ts` (T043) have no phase 3 test: `no-disabled-tests`, `no-focused-tests`, `no-conditional-expect`, `no-standalone-expect`, and `valid-expect` with `alwaysAwait` together with `valid-expect-in-promise`. The plants prove them only in phase 4 (T074), so the phase 3 review cannot confirm its own Independent Test. | Extend T035 with one fixture per FR-010 pattern, each exiting 1 with exactly its rule's finding. Or reword the phase 3 Independent Test to name what phase 3 proves and point to T074 for the rest. |
| U1 | Underspecification | MEDIUM | tasks.md:L107 (T035), L112 (T040), L113 (T041), L118 (T043), L120 (T045); constitution.md L117-120 | Three red tests in phase 3 read configuration files that only the green commit creates: `eslint.test.config.ts` (T043), `stryker.config.json` and `vitest.mutation.config.ts` (T045). T040 has no existence guard, so at the red commit it fails on loading a missing file (an import or setup error) unless it loads the file inside the test after an assertion; the task does not say which. T035 and T041 guard first, so every one of their cases fails on "configuration file missing", not on the entry's exit codes. | Give T040 the same guard as T035 and T041 (assert the file exists, then load it dynamically inside the test). Record in the phase 3 review, under Principle VIII, that these configuration files are part of the phase's missing behaviour (the FR-010 rule set, R-08's runner split), with the red output kept. |
| I1 | Inconsistency | MEDIUM | tasks.md:L66 (T019); research.md R-03 (L55-61); contracts/plants.md L88 | T019 runs `gates/bin/test.ts --root <fixture workspace>`, apparently directly on the fixture directory. R-03's test seam builds a temporary workspace from the fixture tree, copies the repository's `vitest.config.ts` into it unchanged and links `node_modules`; T021, T035 and T041 do the same. Run in place, Vitest finds no config at the fixture root, so the `elements` Chromium project and the repository's `include` and `exclude` are not exercised, and Vitest may write cache files inside `gates/test/fixtures/`. | Have T019 build a temporary workspace from `gates/test/fixtures/<...>/` as R-03 describes: copy `vitest.config.ts`, link `node_modules`, and run from a different working directory. |
| I2 | Inconsistency | MEDIUM | tasks.md:L84 (T031); `.specify/.gitignore` L6; `.specify/extensions/story/scripts/common.sh` L8-13; `.specify/scripts/bash/common.sh` L185-213 | T031 runs `base.sh 99`, `red.sh 99 phase` and `tdd-check.sh 99` in a fresh `git clone`. These scripts find FEATURE_DIR through `check-prerequisites.sh`, which needs `SPECIFY_FEATURE_DIRECTORY` or `.specify/feature.json`. `feature.json` is gitignored, so a clone has none and the scripts stop with "Feature directory not found" before the demonstration can report `fail`. | In T031, set `SPECIFY_FEATURE_DIRECTORY=specs/001-repository-foundation` (or copy `.specify/feature.json`) in the clone, and run `pnpm run setup:online` there before `tdd-check.sh` if the store is not shared. Record both in `sc-003-fail-demo.md`. |
| I3 | Inconsistency | MEDIUM | tasks.md:L156 (T058); research.md R-08 (L220-230), R-09 (L287-291), R-14 (L423-424); plan.md L38-43 | T058 tests the pins gate in-process (`gates/test/`, the `gates` project that Stryker runs) on mini-workspaces, including the lockfile-mismatch case. R-14 decides that case by running `pnpm install --frozen-lockfile --lockfile-only --offline`, a real tool. The design rule (R-08, R-09, plan Technical Context) puts every test that starts a real tool in `gates-integration`, so that Stryker does not start pnpm for each mutant. This is the same split analysis 1 asked for in setup-offline (I2 there, now T020/T021). | Split T058. Keep the manifest, pin-file and workspace-setting rules in-process, as pure functions on the parsed files. Test the lockfile case either on recorded pnpm output (in-process) or end to end in a `gates-integration` test with `--root` (T062 already runs `pins` that way). |
| G2 | Coverage Gap | MEDIUM | spec.md:L436-439 (SC-001); tasks.md:L40 (T013), L113 (T041), L160 (T062), L185 (T082), L212 (T090), L218-224 (operator verification) | Analysis 1 added real-tool tests to `pnpm test` through `gates-integration`: Stryker on a fixture repository (T041), seven gates on temporary repositories (T062), ESLint (T035), pnpm offline installs (T021) and Vitest runs (T019). SC-001 bounds cold install plus the full test run at under 5 minutes on a 2 vCPU runner. Only T013 (phase 1, almost no tests) and the operator's verification after phase 5 time it, so an overrun is found only after every phase has been reviewed. | Add to T082 (or T090) a timed cold run (empty store and browser cache: `setup:online`, then `pnpm test`), recorded in `reviews/phase-4/` (or `phase-5/`), with an overrun reported to the operator as T050 does for shards. |
| G3 | Coverage Gap | LOW | contracts/plants.md L93 (pins row); tasks.md:L156 (T058), L180 (T077); spec.md:L367-372 (FR-027) | The pins fail plants omit three FR-027 cases that T058 tests: `workspace:*`, `workspace:~` and a `workspace:` version that differs from the package's. The plants are not required to cover them (FR-025 says "at least these"), but they are the only proof that the shipped gate rejects those cases. | Add the three cases to the pins row of contracts/plants.md, so that T077 builds them. |
| I4 | Inconsistency | LOW | contracts/gate-cli.md L25-29; research.md R-06 (L147-151), R-09 (L277-278); tasks.md:L118 (T043), L167-169 (T064-T066) | The "Command (normal)" column of contracts/gate-cli.md still names the bare tools for `typecheck`, `lint`, `style-lint` and `test-lint` (`tsc -p ...`, `eslint --config ...`, `stylelint ...`). The tasks now build `gates/bin/<id>.ts` entries for all four (`gate:test-lint` = `node gates/bin/test-lint.ts`), and those entries are what `--root`, exit 2 and the plant job rely on. | Change those rows to `gates/bin/<id>.ts` (running the tool named), as the `unit-tests` row already does. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T002, T008-T010 | |
| FR-002 | Yes | T002-T007, T013, T058, T070 | |
| FR-003 | Yes | T002, T013, T058, T070 | Lockfile rule held by FR-027 |
| FR-004 | Yes | T018, T019, T025, T028, T074 | Scenarios 4 and 10 are proven by unit-tests plants (R-03); I1 |
| FR-005 | Yes | T011, T029, T074 | |
| FR-006 | Yes | T014, T022, T027, T046, T077 | |
| FR-007 | Yes | T046, T047 | |
| FR-008 | Yes | T002, T020, T021, T026, T028 | |
| FR-009 | Yes | T011, T012, T073-T078 | |
| FR-010 | Yes | T033-T035, T043, T074 | Partial in phase 3: G1 |
| FR-011 | Yes | T036, T037, T041, T044, T075 | U1 |
| FR-012 | Yes | T038, T044, T075 | |
| FR-013 | Yes | T039, T050, T079, T083 | |
| FR-020 | Yes | T059, T071, T079, T081 | |
| FR-021 | Yes | T055, T067, T077 | |
| FR-022 | Yes | T056, T068, T076 | |
| FR-023 | Yes | T057, T069, T077 | |
| FR-024 | Yes | T053, T054, T066, T076 | |
| FR-025 | Yes | T060, T061, T072-T078, T082 | |
| FR-026 | Yes | T081 | |
| FR-027 | Yes | T003, T058, T070, T077 | I3, G3 |
| FR-028 | Yes | T007, T011, T036, T043, T065, T066 | |
| FR-030 | Yes | T085 | |
| FR-031 | Yes | T084, T086 | |
| FR-032 | Yes | T084, T087 | |
| FR-033 | Yes | T088 | |
| FR-034 | Yes | T077 | Checked by the story review, as the spec intends |
| FR-035 | Yes | T084, T089 | |
| SC-001 | Yes | T013 | Measured during operator verification; G2 |
| SC-002 | Yes | T072, T082 | |
| SC-003 | Yes | T030, T031 | I2 |
| SC-004 | Yes | T034, T035, T074, T082 | G1 |
| SC-005 | Yes | T039, T050, T079, T083 | Also measured during operator verification |
| SC-006 | Yes | T084 | |

**Constitution Alignment Issues:**
- C1 (Principle VIII, red first): T062's red failure comes from its own setup, through the phase 4 scaffold's empty `plant-repo.ts`, not from each gate's missing `--root` behaviour. So the red step and the check against the scaffold prove nothing about `--root` in phase 4.
- Analysis 1's C1 and C2 are resolved: `eslint-report.ts`, the test-lint entry, the cli entry wrapper and `--root` each have a red test in their phase.
- Deferred gates and the phase 1 bootstrap exemption are recorded in Complexity Tracking with sunsets.

**Unmapped Tasks:** none. T001 maps to Principle VIII (the exemption record); T015, T032 and T051 to the scaffolds of Principle VIII; T023, T042 and T063 to the red commits; T049 to FR-011 for phase 2's gate source; T080 to SC-005's cache precondition.

**Metrics:**
- Total Requirements: 34 (28 FR, 6 SC)
- Total Tasks: 90
- Coverage %: 100% (FR-010 partial within phase 3; every requirement has at least one task)
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 1

## Next Actions
- **Resolve C1 before `/speckit-implement`** by editing tasks.md by hand: T062 builds its own temporary repositories, without `gates/lib/plant-repo.ts`, so each case fails on the gate's exit code at the red commit.
- **MEDIUM items** (edit tasks.md, and research.md where a decision changes):
  - G1: extend T035 to the seven FR-010 patterns, or reword the phase 3 Independent Test.
  - U1: add a guard to T040 and record the configuration-file reasoning for the phase 3 review.
  - I1: give T019 a temporary workspace, as R-03 describes.
  - I2: set the feature directory in T031's clone.
  - I3: split T058's lockfile case out of the `gates` project.
  - G2: add a cold `setup:online` plus `pnpm test` timing for SC-001 before the operator's verification.
- **LOW items:** G3 (add the three missing pins plants to contracts/plants.md) and I4 (update the command column of contracts/gate-cli.md) can go into the same edit.
- **Re-run this analysis** after the edits.
