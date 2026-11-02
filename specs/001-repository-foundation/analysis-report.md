---
analyzed_at: 2026-11-02T20:08:27Z
head: ed3a4bdf14101d652cd24e23c585980cd9401e7c
critical: 0
high: 1
medium: 0
low: 2
coverage: 100
---

<!-- Written by analyst-anouk (speckit-squad-analyze, analysis 3). The harness refused the subagent's own file write
("Subagents should return findings as text, not write report files"), so the orchestrator recorded the report
verbatim from the subagent's hand-back. -->

## Specification Analysis Report

Feature: `specs/001-repository-foundation` (spec.md, plan.md, tasks.md T001-T090 after `reviews/analysis-fixes-2.md`;
research.md, data-model.md, quickstart.md and contracts/ read where tasks defer to them). Constitution: v1.3.1. This is
analysis 3. Every finding of analysis 2 (head 84763aa) was checked against the fixed artifacts and is resolved: C1
(T062 builds its own temporary repositories), G1 (T035 covers the FR-010 patterns), U1 (T040 guard, T042 and T063
review records), I1 (T019 temporary workspace), I2 (T031 feature directory and setup), I3 (T058 in-process, the real
pnpm run in T062), G2 (T083 early SC-001 timing), G3 (pins plants row) and I4 (gate-cli command column). The findings
below are new, two of them introduced by those fixes.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| U1 | Underspecification | HIGH | tasks.md:L160 (T062), L161 (T063), L168-169 (T065, T066); research.md R-10 (L324-328) | T062 copies each `typecheck`, `lint`, `style-lint`, `csp` and `prefix` fixture tree "over the repository's configuration set (research.md R-10)". R-10 defines that set to include `eslint.config.ts` and `stylelint.config.ts`, which only phase 4's green commit creates (T065, T066). T062's guard asserts only "the configuration files the gate reads". The `typecheck`, `csp` and `prefix` gates do not read either file, so their guards pass. Then a literal copy of the whole set fails with a missing-file error. Those three cases would fail at the red commit, and again in `tdd-check.sh`'s run against the scaffold, on their own setup and not on the gate's missing exit code. That contradicts the task's own statement ("not on setup") and constitution VIII's red-first rule. T063 records only the `lint` and `style-lint` cases. | In T062, say exactly which files each case copies. Either copy only the configuration files that case's gate reads (`tsconfig.base.json`, `tsconfig.json` and the package manifests and tsconfigs for `typecheck`; none beyond the fixture for `csp` and `prefix`), or assert that every file of the R-10 set exists before any copy and add those cases to T063's record. Then the red output of every case shows an assertion failure. |
| A1 | Ambiguity | LOW | tasks.md:L107 (T035); spec.md:L234-236 (FR-010); research.md R-06 (L140-141) | T035 asks for "one fixture per FR-010 pattern (seven), each exiting 1 with exactly its rule's one finding". The sixth pattern (an assertion not awaited or completed) names two rules: `valid-expect` with `alwaysAwait`, and `valid-expect-in-promise`. One fixture with exactly one finding can fire only one of them. That leaves the other rule setting of `eslint.test.config.ts` without a phase 3 test, which G1 of analysis 2 was meant to remove. | Split the sixth pattern into two fixtures, one per rule (eight fixtures, each with exactly one finding). Or let that one fixture expect exactly the two findings and name them. |
| U2 | Underspecification | LOW | tasks.md:L186 (T083); research.md R-04 (L98); spec.md:L436-439 (SC-001) | T083 empties the package store for the early SC-001 timing "through `npm_config_store_dir`". No artifact confirms that pnpm 12.16.1 reads that variable. research.md R-04 only says the store directory comes "from the environment". If pnpm ignores the variable, the run silently uses the warm store, and the recorded cold timing is too optimistic. | Record the store path the run actually used in `sc-001-timing.md` (for example the output of `pnpm store path` under the same environment) and confirm that it is the new temporary directory. Or pass the store directory in a way R-04 names. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T002, T008-T010 | |
| FR-002 | Yes | T002-T007, T013, T058, T070 | |
| FR-003 | Yes | T002, T013, T058, T062, T070 | Lockfile rule held by FR-027 |
| FR-004 | Yes | T018, T019, T025, T028, T074 | |
| FR-005 | Yes | T011, T029, T074 | |
| FR-006 | Yes | T014, T022, T027, T046, T077 | |
| FR-007 | Yes | T046, T047 | |
| FR-008 | Yes | T002, T020, T021, T026, T028 | |
| FR-009 | Yes | T011, T012, T073-T078 | |
| FR-010 | Yes | T033-T035, T043, T074 | A1 |
| FR-011 | Yes | T036, T037, T041, T044, T075 | |
| FR-012 | Yes | T038, T044, T075 | |
| FR-013 | Yes | T039, T050, T079, T083 | |
| FR-020 | Yes | T059, T071, T079, T081 | |
| FR-021 | Yes | T055, T062, T067, T077 | |
| FR-022 | Yes | T056, T062, T068, T076 | |
| FR-023 | Yes | T057, T062, T069, T077 | |
| FR-024 | Yes | T053, T054, T062, T066, T076 | |
| FR-025 | Yes | T060, T061, T072-T078, T082 | |
| FR-026 | Yes | T081 | |
| FR-027 | Yes | T003, T058, T062, T070, T077 | |
| FR-028 | Yes | T007, T011, T036, T043, T065, T066 | |
| FR-030 | Yes | T085 | |
| FR-031 | Yes | T084, T086 | |
| FR-032 | Yes | T084, T087 | |
| FR-033 | Yes | T088 | |
| FR-034 | Yes | T077 | Checked by the story review, as the spec intends |
| FR-035 | Yes | T084, T089 | |
| SC-001 | Yes | T013, T083 | Measured on CI during the operator's verification; U2 |
| SC-002 | Yes | T072, T082 | |
| SC-003 | Yes | T030, T031 | |
| SC-004 | Yes | T034, T035, T074, T082 | A1 |
| SC-005 | Yes | T039, T050, T079, T083 | Also measured during the operator's verification |
| SC-006 | Yes | T084 | |

**Constitution Alignment Issues:**
- No CRITICAL conflict. U1 is rated HIGH, not CRITICAL, because T062 states the VIII-compliant intent ("not on
  setup") and only its reference to the full R-10 configuration set contradicts it. Implemented literally, the
  `typecheck`, `csp` and `prefix` cases would break Principle VIII's red-first rule, so resolve U1 before phase 4's
  red commit.
- Note on the accepted resolution of analysis 2's U1 (no finding): T035, T040, T041 and T062's `lint` and
  `style-lint` cases fail at the red commit and at the scaffold on the existence assertion for a configuration file
  that the green commit creates. The phase reviews record this (T042, T063). For these cases, `tdd-check.sh`'s run
  against the scaffold therefore shows only that the file was missing. It cannot show that the rule-level assertions
  were kept. Under VIII's "green, without touching the tests' meaning" clause, the phase 3 and 4 reviews should
  compare those test files between the red commit and the final tree.
- The deferred gates and the phase 1 bootstrap exemption are recorded in Complexity Tracking with their sunsets.

**Unmapped Tasks:** none. T001 maps to Principle VIII (the exemption record); T015, T032 and T051 to the scaffolds of
Principle VIII; T023, T042 and T063 to the red commits; T049 to FR-011 for phase 2's gate source; T080 to SC-005's
cache precondition.

**Metrics:**
- Total Requirements: 34 (28 FR, 6 SC)
- Total Tasks: 90
- Coverage %: 100% (every requirement has at least one task)
- Ambiguity Count: 1 (A1)
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions
- No CRITICAL issue: `/speckit-implement` (the story workflow) can start with phase 1. Phases 1 to 3 are not affected
  by any finding except A1.
- **Resolve U1 before phase 4's red commit** by editing tasks.md T062 by hand (and T063 if the guard approach is
  chosen). State which configuration files each `--root` case copies, so that every case fails on an assertion at the
  red commit and at the scaffold.
- **LOW items** (they can go into the same edit):
  - A1: split T035's not-awaited fixture into one fixture per rule, or name both expected findings. Do it before
    phase 3's red commit.
  - U2: have T083 record the store path actually used.
- Re-running this analysis after the edits is optional. They touch only T035, T062, T063 and T083.
