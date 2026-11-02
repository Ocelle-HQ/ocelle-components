---
analyzed_at: 2026-11-02T19:46:02Z
head: 3a60b7f6756c7194280e5ebfc36282f66f42665e
critical: 2
high: 1
medium: 6
low: 5
coverage: 100
---

<!-- Written by analyst-anouk (speckit-squad-analyze). The harness refused the subagent's own file write ("Subagents
should return findings as text, not write report files"), so the orchestrator recorded the report verbatim from the
subagent's hand-back. -->

## Specification Analysis Report

Feature: `specs/001-repository-foundation` (spec.md, plan.md, tasks.md; research.md and contracts/ read where tasks defer to them). Constitution: v1.3.1.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | tasks.md:L94 (T029), L108 (T037), L136 (T045), L155 (T058); research.md R-08; contracts/gate-cli.md L46 | `gates/lib/eslint-report.ts` sorts ESLint's JSON output into "defects found" (exit 1) or "could not run" (exit 2) for both `test-lint` and `lint`. It is created in a green task (T037) and reused in T058, but no scaffold includes it (T029, T045) and no red test covers it (T030-T035, T046-T055). The test-lint gate entry is never named as a module, and its exit 0/1/2 behaviour has no red test either. This breaks Principle VIII (red first) and contradicts the plan's Constitution Check row VIII ("every gate and script behaviour is written red first"). | Add eslint-report.ts (and the test-lint entry) to the T029 scaffold. Add a red test, `gates/test/eslint-report.test.ts`, on recorded ESLint JSON in `gates/test/fixtures/eslint/`: non-fatal messages give exit 1; ESLint exit 2, no JSON or a fatal message give exit 2. |
| C2 | Constitution | CRITICAL | tasks.md:L62-66 (T016-T020), L71 (T022), L161 (T064); contracts/gate-cli.md L9-12, L17-19; research.md R-09 | Gate command-line behaviour is built in green with no red test. (a) The top-level catch in `gates/lib/cli.ts` turns any uncaught error into exit 2 (T022); T016 tests only the finding format. (b) T064 adds `--root` to every phase 4 gate after the red commit; T046-T055 test pure functions only and never pass `--root`. The plant job relies on the catch-all to tell "could not run" (exit 2) apart from "found defects". This breaks Principle VIII (red first). | Phase 2 red commit: add a cli test showing that an error thrown inside `run()` gives exit 2 and one line naming the cause (not Node's exit 1), and that `--root` sets the root and working directory. Phase 4: put `--root` in the T045 scaffold signatures and add red tests running each gate with `--root` on a fixture tree (in gates-integration where a real tool starts). |
| G1 | Coverage Gap | HIGH | spec.md:L53-57 (US1 sc. 8), L366-373 (FR-027); tasks.md:L152 (T052), L171 (T071); contracts/plants.md L41; research.md R-14 | Several pins rules have neither a red test (T052) nor a plant: a missing or non-exact `.node-version` or `packageManager` (an FR-027 MUST); a `~` range (named in US1 scenario 8); `minimumReleaseAgeStrict` missing or false; a `minimumReleaseAgeExclude` entry; `dangerouslyAllowAllBuilds`; and R-14's hoisting rules (`shamefullyHoist`, `publicHoistPattern`, `nodeLinker`). | Extend T052 and the pins row of contracts/plants.md (built in T071) with a failing case for each of these. |
| I1 | Inconsistency | MEDIUM | tasks.md:L29 (T002), L40 (T013) | T013 runs `setup:online` to create and commit the lockfile, but T002 defines `setup:online` as `pnpm install --frozen-lockfile ...`. A frozen install fails when there is no lockfile yet. | In T013, create the lockfile first with a non-frozen `pnpm install` (or `--lockfile-only`) and commit it. Then run `setup:online` and confirm no tracked file changes. |
| G2 | Coverage Gap | MEDIUM | spec.md:L441-443 (SC-003); tasks.md:L78 (T028) | No task covers SC-003's second clause: the check must report `fail` on a phase whose final tests already pass at its base. T028 shows only the `pass` case. | Add a task (in phase 2 or the operator verification) that runs `tdd-check.sh` on a throwaway phase whose tests pass at its base, and records the `fail`. |
| G3 | Coverage Gap | MEDIUM | research.md R-08 (L220-226); tasks.md:L103 (T035) | R-08 promises a red gates-integration test proving that a mutant covered only by a gates-integration test is reported `NoCoverage`. T035 only compares the two Vitest project lists. | Add R-08's Stryker test on a fixture repository to the phase 3 red commit, in `gates/test/integration/`. |
| I2 | Inconsistency | MEDIUM | tasks.md:L65 (T019); research.md R-04 (L97-103), R-08 (L216-221) | T019 puts the offline-setup test in the in-process `gates` project, which Stryker runs, yet the test must prove no network call is made. R-04 places tests that run pnpm and count socket connections in gates-integration. As written, Stryker would start pnpm for each mutant, which breaks the SC-005 shard-time reasoning. R-04's filled-store success case (exit 0) is also missing. | Split T019: translation of recorded pnpm error text in `gates/test/`; the empty-store, empty-browser-path, zero-connection and filled-store cases in `gates/test/integration/`. |
| I3 | Inconsistency | MEDIUM | tasks.md:L156 (T059); research.md R-07 (L150-155) | T059 says "no `allowEmptyInput`"; R-07 decides `allowEmptyInput` is on. | Pick one and align the other. |
| I4 | Inconsistency | MEDIUM | tasks.md:L156 (T059); spec.md:L293-297 (FR-024), L376 (FR-028); research.md R-07 | T059 limits style-lint input to `src/`. FR-024, FR-028 and R-07 cover all package source of elements and styles, so stylesheets outside `src/` would go unchecked. | Use R-07's whole-package globs with the test-code and `dist` ignores, or narrow FR-024 explicitly. |
| I5 | Inconsistency | LOW | spec.md:L326-328, L424-425; contracts/plants.md L30; data-model.md L25; tasks.md:L54, L148 | The spec says "breaking plant"; the contracts, data model and tasks say "error plant". | Use one term, or note "breaking (`error`)" once in data-model.md. |
| I6 | Inconsistency | LOW | spec.md:L274-277 (FR-022); research.md R-12 (L388); tasks.md:L144, L167 | The plan and tasks match `sk-` names case-insensitively (the `<SK-Button>` plant). FR-022 says only the monospace match is case-insensitive. | Add "case-insensitive" to FR-022's name rule. |
| A1 | Ambiguity | LOW | spec.md:L311-312, L346; research.md R-07 | FR-025 says "five properties" for unitless numbers, but FR-024 lists flex and its longhands too, and R-07 names seven properties. | Say "outside the properties FR-024 lists". |
| D1 | Duplication | LOW | spec.md:L198-199 (FR-003), L366-367 (FR-027) | FR-003 and FR-027 state the same lockfile-mismatch rule. | Have FR-003 refer to FR-027, or merge them. |
| U1 | Underspecification | LOW | tasks.md:L76 (T027); constitution.md L124-126; research.md R-03 | T027 adds a test in the green commit that already passes at the phase base, as R-03 intends. Principle VIII says the final tests MUST fail against the old code. Nothing says whether `tdd-check.sh` judges the whole suite or each test. | Record in T027 or the phase 2 review that the suite is judged as a whole, and why this sample is acceptable. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T002, T008-T010 | |
| FR-002 | Yes | T002-T007, T013, T057, T067 | |
| FR-003 | Yes | T002, T013, T052, T063 | I1, D1 |
| FR-004 | Yes | T017, T018, T023, T026 | Scenarios 4 and 10 are proven by plants (T068) |
| FR-005 | Yes | T011, T027, T068 | |
| FR-006 | Yes | T014, T020, T025, T040, T071 | `test_pathspec` is already set in both copies |
| FR-007 | Yes | T038, T040, T041 | |
| FR-008 | Yes | T002, T019, T024, T026 | I2 |
| FR-009 | Yes | T011, T012, T067-T072 | |
| FR-010 | Yes | T030, T037, T068 | C1 |
| FR-011 | Yes | T031, T032, T038, T069 | G3 |
| FR-012 | Yes | T033, T038, T069 | |
| FR-013 | Yes | T034, T038, T044, T073, T077 | |
| FR-020 | Yes | T053, T065, T073 | |
| FR-021 | Yes | T049, T060, T071 | |
| FR-022 | Yes | T050, T061, T070 | I6 |
| FR-023 | Yes | T051, T062, T071 | |
| FR-024 | Yes | T047, T048, T059, T070 | I3, I4 |
| FR-025 | Yes | T054, T055, T066-T072, T076 | |
| FR-026 | Yes | T075 | |
| FR-027 | Yes | T003, T052, T063, T071 | Partial: G1 |
| FR-028 | Yes | T007, T011, T037, T058, T059, T064 | |
| FR-030 | Yes | T079 | |
| FR-031 | Yes | T078, T080 | |
| FR-032 | Yes | T078, T081 | |
| FR-033 | Yes | T082 | |
| FR-034 | Yes | T071 | Checked by the story review, as the spec intends |
| FR-035 | Yes | T078, T083 | |
| SC-001 | Yes | T013, T073, T074 | Measured during operator verification |
| SC-002 | Yes | T066, T076 | |
| SC-003 | Yes | T028 | Partial: G2 |
| SC-004 | Yes | T030, T037, T068 | |
| SC-005 | Yes | T044, T073, T077 | Also measured during operator verification |
| SC-006 | Yes | T078 | |

**Constitution Alignment Issues:**
- C1 and C2 (Principle VIII, red first): three pieces of gate behaviour reach green commits with no red test — the ESLint report classification, the cli catch-all that turns errors into exit 2, and phase 4's `--root`. The later mutation catch-up does not replace the red step.
- No other conflict. Deferred gates and the phase 1 bootstrap exemption are recorded in Complexity Tracking with sunsets.

**Unmapped Tasks:** none. T001 maps to Principle VIII (the exemption record), T043 to FR-011 and FR-012, and T044 and T077 to FR-013 and SC-005.

**Metrics:**
- Total Requirements: 34 (28 FR, 6 SC)
- Total Tasks: 84
- Coverage %: 100% (FR-027 and SC-003 partial)
- Ambiguity Count: 1
- Duplication Count: 1
- Critical Issues Count: 2

## Next Actions
- **Resolve C1 and C2 before `/speckit-implement`** by editing tasks.md by hand:
  - Phase 3: add eslint-report.ts and the test-lint entry to the T029 scaffold, plus a red classification test.
  - Phase 2: add a red cli test for the catch-all and `--root`.
  - Phase 4: move `--root` into the T045 scaffold, with red tests per gate.
  - Then adjust plan.md's Constitution Check row VIII if its wording changes.
- **Resolve G1:** extend T052 and the pins plants (contracts/plants.md, T071) to every FR-027 and R-14 clause.
- **MEDIUM items:** I1 (T013 ordering), G2 (SC-003 `fail` demonstration), G3 (R-08 NoCoverage test), I2 (split T019), I3 and I4 (align T059 with R-07). Edit tasks.md, or research.md where a decision changes.
- **LOW items:** I5, I6, A1, D1, U1 can go into the same edit; spec wording fixes go through `/speckit-specify` refinement.
- **Re-run this analysis** after the edits.
