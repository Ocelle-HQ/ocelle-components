---
analyzed_at: 2026-11-10T12:37:10Z
head: 0a0907783f09ce2fede8a93fc065513f7b0f7605
critical: 0
high: 0
medium: 3
low: 5
coverage: 100
---

## Specification Analysis Report

Feature: `specs/007-mutation-gate-strictness` (#23). Artifacts read: spec.md, plan.md, tasks.md, research.md (R-05 to R-07), data-model.md, contracts/mutation-output.md, quickstart.md, `.specify/memory/constitution.md` 1.3.1. Cited repository facts checked: `ec0f533` exists; `gates/test/mutation-shards.test.ts:583` and `:586-591` are the "entries of one file joined" test; `packages/tokens/test/source-table.test.ts:39`, `:45`, `:76` are the three named value/group tests; `gates/test/integration/vitest-mutation-config.test.ts:40` is the deep-equal to replace; the plants `pass-compile-error`, `pass-fully-checked`, `error-dry-run-fails` exist; `findings/frontend-missions.md` § Mutation shard time ("the next lever is a bound on mutants per shard") and the `log.md` zero-mutant candidate exist.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| F1 | Inconsistency | MEDIUM | tasks.md:39, tasks.md:41-42 | The stop-and-ask list names task IDs that do not match the task list: "after lever 2 (T037)" (no T037 exists; lever 2 is T028), and "the T027 test stays red after T030" (the order test is T019 and lever 1 is T021; T027 is the lever decision and T030 the knowledge record). An implementer could stop at the wrong point or miss the stop. | Edit tasks.md: T037 → T028; "T027 test stays red after T030" → "T019 test stays red after T021" (T021 already says it). |
| E1 | Coverage Gap | MEDIUM | spec.md FR-010 (CI half), US2 AS3, SC-004 (CI half); tasks.md:124, :158-161; `.claude/skills/ocelle-land/SKILL.md` | The CI half of FR-010 (every `source.ts` `mutation-shard` job's `gate:mutation` step at most 480 s, no cancellation, times and run link recorded) has no task: tasks.md places it at landing, "not a task of this run". The landing skill has no step for the measurement commit, its `--plan` check, the core count or the revert, and T016's only landing-skill sentence is about report lines and `--files`. Nothing in the tasks leaves a record that the landing pass will read, so the MUST can be lost between the phase review and landing. | Add to phase 3 (for example in T027 or T031) a step that writes the open CI half into `evidence/README.md` with the R-07 procedure and its decision rules, or extend T016's landing-skill sentence to name the 007 measurement commit (R-07). |
| B1 | Ambiguity | MEDIUM | tasks.md T024 (:136); research.md R-06 | The per-mutant comparisons must "fail loudly on a repeated or unmatched key" for up to about 224 mutants per entry and six entries, but no task or research item says how the comparison is made (R-06's "a script in the evidence folder is not needed" covers only the FR-011 record). A hand comparison cannot fail loudly and cannot be re-run by the reviewer. | State the means in T024 (for example a `jq` or `node -e` command kept verbatim in `evidence/README.md`, with its output), so the comparison is reproducible and its failure mode is real. |
| E2 | Coverage Gap | LOW | spec.md FR-012; tasks.md T031 | FR-012's forbidden levers (no change to `Group`, `TokenRecord` or the `tokenRecords` signature, no mutator exclusion, no ignore or disable comment, no shorter time limit) have no explicit check. T019 covers dropped test modules and T029 covers `dist`, but the other constraints are left to the reviewer's reading of the diff. | Add to T031 a recorded `git diff --stat <phase base> -- packages/tokens/src stryker.config.json` and a grep for `Stryker disable` in `packages/tokens/src`, with the expected empty result (or only the lever 2 `concurrency` line). |
| E3 | Coverage Gap | LOW | spec.md Edge Cases (test-only or out-of-scope changed file: "not reported as a zero-mutant entry"); tasks.md T007, T009 | No task asserts the edge case where an out-of-scope changed file (a test file, for example) sits beside an in-scope one, so it gets no `zero-mutants` line. The pure test-only case is covered indirectly by the unchanged "nothing to mutate" line, but the mixed case is not named. | Add one case to T009 (a test-file change plus a source change: only the source entry can be zero-mutant), or give `pass-test-only-change` an explicit `"reports": []`. |
| F2 | Inconsistency | LOW | spec.md FR-001, US1 AS1-AS2; contracts/mutation-output.md:12-16 | The spec says each report line names the mutant's "status `Timeout`" or "`CompileError`". The contract prints the rule (`timeout`, `compile-error`) and "no separate status word". The contract reconciles the two explicitly, but the wording differs across files. | No change needed. The FR-015 amendment of 001 FR-011 (T015) may quote the contract's form so the record matches the output. |
| F3 | Underspecification | LOW | tasks.md:17-21, :55-69, :154 | The general phase flow (base, red commit, `red.sh`, green, `tdd-check.sh`, review) does not fit Phase 1, which is evidence only. Phase 1's Purpose says "its review states that no test could fail for it", but no task runs `base.sh` or a review for Phase 1, and it is not said whether `tdd-check.sh 1` applies. | Say in Phase 1 which story steps run (or that the phase-1 exemption is recorded in phase 2's review), so the orchestrator's scripts do not stall on a phase with no red commit. |
| F4 | Inconsistency | LOW | tasks.md:80 | Phase 2's Independent Test reads "the red tests of T005 to T011 green". T010 is the red commit and T011 the judge implementation; the red tests are T005 to T009. | Change to "T005 to T009". |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 timeout report line | Yes | T007, T009, T013, T014 | Start-line rule in T007 |
| FR-002 compile-error report line | Yes | T007, T009, T012, T013, T014 | `pass-compile-error` with `reports` |
| FR-003 zero-mutant entry line | Yes | T004, T007, T008, T009, T012, T013, T014 | Entry naming via `selectFiles` (T008) |
| FR-004 summary counts | Yes | T006, T009, T014 | Exact summaries extended |
| FR-005 report lines are not findings | Yes | T005, T011, T016 | Judge and readers |
| FR-006 whole-diff and shard alike | Yes | T008, T009 | AS6 in T009 |
| FR-007 verdicts unchanged | Yes | T007, T009, T018 | Every status in T007 |
| FR-008 proof by plant or test | Yes | T005, T009, T012, T018 | Real Stryker zero-mutant: `pass-zero-mutant` |
| FR-009 measurement run, zero Timeout/Survived/NoCoverage | Yes | T001, T002, T023, T027 | |
| FR-010 176 s sandbox, 480 s CI | Partial | T002, T023, T027, T028 | CI half deferred to landing with no task (E1) |
| FR-011 former Timeouts Killed or CompileError | Yes | T003, T025, T026 | |
| FR-011a red evidence first | Yes | T001, T002, T003 | |
| FR-012 forbidden levers | Yes | T019, T029 | No explicit check of types and disable comments (E2) |
| FR-013 other files not worse | Yes | T002, T022, T023, T024 | |
| FR-014 amend 001 FR-013 if needed | Yes | T028, T030 | Conditional, stop-and-ask |
| FR-015 dated amendments | Yes | T015, T030 | |
| FR-016 knowledge closures | Yes | T017, T030 | |
| SC-001 each kind findable from output | Yes | T009, T012, T018 | |
| SC-002 no verdict change | Yes | T007, T018, T022 | |
| SC-003 0 Timeouts, former Timeouts resolved | Yes | T023, T025 | |
| SC-004 176 s / 480 s | Partial | T023, T027 | CI half at landing (E1) |
| SC-005 dist byte-identical | Yes | T029 | |

**Constitution Alignment Issues:** none. Principle VIII is met by design: every US1 behaviour has a red gate test (T005 to T009, one test-only commit, `red.sh 2`); lever 1 has a behavioural red test (T019, `red.sh 3`); the configuration-only steps (Phase 1, lever 2) claim the exemption and state that their review records it; the replacement of two existing assertions is stated with a reason (T008, T019). The plants are committed in green because `gates/plants/**` is outside the test pathspec of `story-config.yml`. Their red run against the old gate is evidence (T012) and is not machine-checked by `tdd-check.sh`, but the same behaviours are covered by red gate tests, so this is not a conflict. Complexity Tracking is empty and no exception is claimed. Principles I to VII are not touched.

**Unmapped Tasks:** none. T001 to T003 map to FR-011a, FR-009 and FR-013; T010 and T020 are red commits; T018 and T031 are the phase runs (FR-007, SC-002, Principle VIII mutation testing of the gate's own code).

**Metrics:**

- Total Requirements: 22 (FR-001 to FR-016 with FR-011a: 17; SC-001 to SC-005: 5)
- Total Tasks: 31 (T001 to T031)
- Coverage %: 100 (22 of 22 with at least one task; FR-010 and SC-004 only for their sandbox half)
- Ambiguity Count: 1 (B1)
- Duplication Count: 0
- Critical Issues Count: 0

**Dropped (operator rule for this mission, no follow-up issue):** this analysis proposes no follow-up issue. The spec's *Dropped* list (hard failure for Timeout, CompileError or zero-mutant entries; mutating whole files; mutant density in files other than `source.ts`; reporting RuntimeError; a bound for mixed `source.ts` shards) stays as the operator decided it. No finding above asks for any of it.

## Next Actions

- No CRITICAL or HIGH issue: `/speckit-implement` (the `ocelle-implement` flow) may proceed.
- Before Phase 1 starts, or at the latest before Phase 3, fix the tasks.md wording (manual edit of tasks.md, operator's call):
  - F1: correct the stop-and-ask task IDs (T037 → T028; T027/T030 → T019/T021).
  - E1: give FR-010's CI half a recorded hand-off to landing (an `evidence/README.md` item or the landing-skill sentence of T016).
  - B1: name the per-mutant comparison's command in T024.
- The LOW items (E2, E3, F2, F3, F4) can be applied in the same edit or left to the phase reviews.
- No change to spec.md or plan.md is needed; no `/speckit-specify` or `/speckit-plan` rerun.
