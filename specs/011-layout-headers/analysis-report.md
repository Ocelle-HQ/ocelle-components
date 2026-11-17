---
analyzed_at: 2026-11-13T15:56:41Z
head: 064caa05aedf6c7147b68c38200ccbd0ce441bd3
critical: 0
high: 0
medium: 0
low: 6
coverage: 100
---

## Specification Analysis Report

This is the second analysis of feature `specs/011-layout-headers`, run after `/speckit-tasks` and after the first analysis's findings were resolved (`reviews/analysis/fixes-1.md`, commit 064caa0). I read spec.md, plan.md and tasks.md in full. For cross-checks I also read contracts/, data-model.md and quickstart.md, the existing package tests that the pinned-list tasks name, and the story workflow's red-commit rule (`story_non_test_changes`, `test_pathspec`). The constitution is 1.3.1. `.specify/extensions.yml` has no hooks registered (`hooks: {}`).

**First analysis resolved.** All thirteen findings of the first report (head 5bb0e04) are fixed in the artifacts, as fixes-1.md records:
- D1: phase 1 now has a checkpoint gate set that includes `mutation` over `src/slot-state.ts`. Plan, tasks and contracts/checks.md say the same.
- E1: the pinned element lists are re-listed and changed in each red commit (T016a, T028a, T035a, T043a). The green tasks state the `exports` order. The README tasks add the Entry points rows. I checked the named lines against the repository: `exports.test.ts:9`, `readme.test.ts:125/170-173`, `manifest.test.ts:250` and `build.test.ts:44-49`. The manifest generator lists only `ocelle-*.ts` modules, so the internal modules do not change the pinned module paths.
- E2: FR-006 cases are now in T011, T012, T026 and T041.
- E3: FR-036 states the workaround mapping, and T016, T028, T035 and T043 name it.
- F1: the T036 dependency is stated in Dependencies, T036 and the plan.
- C1: US4-10's first assertion is now an `expect` on the README example.
- E4: T016 keeps the engine fragments, so the readme test holds FR-039.
- F2 to F7: fixed as worded.

Finding IDs use the letter of the detection pass: B ambiguity, E coverage gaps, F inconsistency. They continue the first report's sequence where the letter was used. No duplication (A), underspecification (C) or constitution (D) finding met the bar.

I checked one more thing and found no finding. Every phase's red tests import modules that green creates (for example `src/slot-state.ts`, `src/card-context.ts` and the element modules). This is handled by the implement skill's step 4, an optional scaffold commit of signatures only, as in 005. It is not a gap in tasks.md.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| B1 | Ambiguity | LOW | tasks.md:193 (T042); spec.md:572 (FR-006); contracts/elements-package.md (rail table); tasks.md:166 (T034) | T042's manifest clause reads "`label`, `orientation` reflected with type …", which can be read as both reflected. FR-006, the contract, data-model.md and T034 (for the sidebar) all say `label` is not reflected. | Write it as T034 does: "`label` not reflected; `orientation` reflected with type …". |
| E5 | Coverage gap | LOW | spec.md:575-576 (FR-006); tasks.md:192 (T041); spec.md:472 (US4-8) | FR-006 says an empty enumerated value behaves as "not set". The other enumerated attributes now have an empty-value case (T011 `variant=""`, T012 `density=""`, T026 and US1-17 `size=""`). The rail's `orientation` has only the invalid value (`"sideways"`, US4-8), not `orientation=""`. | Add `orientation=""` to T041 beside US4-8 (laid out vertically, value kept), paired with the `orientation="horizontal"` twin, under the existing empty-or-invalid plant row. |
| F8 | Inconsistency | LOW | tasks.md:111, :142, :168, :195 (T016a, T028a, T035a, T043a); tasks.md:223 (Parallel Opportunities) | The four pinned-list tasks are marked `[P]`. Yet they edit the same files as their phases' other `[P]` red tasks: `manifest.test.ts`, `build.test.ts` and `pack.test.ts` (T015, T027, T034, T042), `entry-root.test.ts` (T014 and the others), and `readme.test.ts` (T016, T028, T035, T043). "Parallel Opportunities" says `[P]` tasks touch different files. | Drop `[P]` from T016a, T028a, T035a and T043a. Or say that they share files with the named tasks and are written together with them. |
| F9 | Inconsistency | LOW | tasks.md:212 (Dependencies); tasks.md:165 (T033, US3-3); spec.md:345, :369-370 | Dependencies say "phase 4 needs phase 1 only". Phase 4's US3-3 runs with `ocelle-section-header` sections, including a hidden one, and that element is defined in phase 2 (US1). The spec says the sidebar "uses section headers for its sections" and needs nothing from Stories 2 and 4, which implies it needs Story 1. This has no effect while phases run in order (2, 3, 4), but the line is wrong if phase 4 is ever moved. | Say "phase 4 needs phase 1 and phase 2 (`ocelle-section-header` for US3-3's section variants)". |
| F10 | Inconsistency | LOW | tasks.md:110 (T016); :141, :167, :194 (T028, T035, T043); :148, :175, :201 (T031, T039, T046); spec.md:755-756 (FR-036) | T016 asserts in its red commit that both CHANGELOGs name the phase-2 elements, entry points and tokens. T028, T035 and T043 do not assert that the elements CHANGELOG names the page header, sidebar or rail. Their green tasks still write those entries, so in phases 3 to 5 FR-036's changelog clause is written without a failing test first. | Add to T028, T035 and T043: "the `@ocelle/elements` CHANGELOG names the element and its entry point as a MINOR addition", as T016 does. |
| F11 | Inconsistency | LOW | tasks.md:111, :142, :168, :195 ("E1 of the analysis") | The pinned-list tasks cite "E1 of the analysis". This report replaces the one that held that ID, and E1 is not reused here, so the reference now resolves only through git history and fixes-1.md. | Cite `reviews/analysis/fixes-1.md` (E1) instead of "the analysis". |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T011–T016a, T020–T024, T026–T031, T033–T039, T041–T046 | |
| FR-002 | Yes | T011, T012, T026, T033, T041 | |
| FR-003 | Yes | T011, T012, T026, T033, T041 | |
| FR-004 | Yes | T011, T017, T026, T028, T033, T035, T041, T043 | |
| FR-005 | Yes | T003, T005, T011, T012, T026, T033, T041 | |
| FR-006 | Yes | T011, T012, T015, T020, T021, T026, T027, T041, T042 | E5 (rail `orientation=""`) |
| FR-007 | Yes | T015, T027, T034, T042 | |
| FR-008 | Yes | T011, T012, T020, T021, T026, T029, T033, T037 | |
| FR-010 to FR-013 | Yes | T002, T011, T020 | |
| FR-014 to FR-018 | Yes | T010, T012–T014, T019, T021 | |
| FR-019 | Yes | T026, T029 | |
| FR-020 to FR-023 | Yes | T002, T033, T037 | |
| FR-024 to FR-027 | Yes | T002, T041, T043, T044, T047 | |
| FR-028 | Yes | T002, T033, T036, T037, T039–T041, T044, T046, T047 | |
| FR-030, FR-032 | Yes | T009, T018 | |
| FR-031 | Yes | T011, T020, T026, T029 | |
| FR-033 | Yes | T023, T031, T039, T046 | |
| FR-034 | Yes | T015, T016a, T022, T027, T028a, T030, T034, T035a, T038, T042, T043a, T045 | B1 |
| FR-035 | Yes | T007, T013, T027, T034, T042 | plus the `csp` gate at the phase 2–5 checkpoints |
| FR-036 | Yes | T016, T016a, T018, T024, T028, T028a, T031, T035, T035a, T039, T043, T043a, T046 | F10 |
| FR-037 | Yes | T023, T031, T039, T046 | |
| FR-038 | Yes | T001, T002, T023, T039, T046 | needs #10's axe gate (T001 stops and asks if it is missing) |
| FR-039 | Yes | T016 | the readme test's engine fragments stay unchanged; R-15 |
| SC-001 | Yes | T011–T013, T026–T027, T033–T034, T041–T042 | |
| SC-002 | Yes | T017, T028, T035, T043 | |
| SC-003 | Yes | T004, T011, T012, T026, T033, T041 | |
| SC-004 | Yes | T023, T025, T031, T032, T039, T040, T046, T047 | |
| SC-005 | Yes | phase 1–5 checkpoints | `mutation` with the phase base at every checkpoint, phase 1 over `src/slot-state.ts`; style plants T025, T032, T040, T047 (R-17) |
| SC-006 | Yes | T016, T028, T035, T043 | FR-036 states the mapping |

**Constitution Alignment Issues:** none.
- Principle VIII:
  - Every phase has a mutation gate with its own base (phase 1 included).
  - The pinned-list tests change only in red commits. `reviews/phase-N/notes.md` lies under the feature directory, which `story_non_test_changes` excludes.
  - Every "does not" outcome, the new FR-006 cases included, has a paired positive outcome and a named plant.
  - US4-10's red failure is an assertion failure.
- Principles I to VII hold as in the first report.

**Unmapped Tasks:** none.
- T001, T002, T007 and T008 are recheck, spike, plumbing and the exemption record.
- T016a, T028a, T035a and T043a keep the existing surface tests in step (FR-034, FR-036).
- T025, T032, T040 and T047 are phase evidence.

**Metrics:**
- Total requirements: 43 (37 FR, 6 SC).
- Total tasks: 51 (47, plus T016a, T028a, T035a and T043a).
- Coverage: 100% (43 of 43; SC-005 is covered by the checkpoint gate sets).
- Ambiguity count: 1.
- Duplication count: 0.
- Critical issues: 0.

### Next Actions
- No CRITICAL, HIGH or MEDIUM finding. `/speckit-implement` (the `ocelle-implement` flow) may start once #10 is on `main` and merged into the branch (T001).
- LOW, worth fixing in tasks.md before or during phase 2 (none blocks it):
  - Clarify T042's `label` clause (B1).
  - Add the rail's `orientation=""` case to T041 (E5).
  - Drop or qualify `[P]` on the pinned-list tasks (F8).
  - Correct phase 4's dependency on phase 2 (F9).
  - Add the CHANGELOG assertion to T028, T035 and T043 (F10).
  - Cite `reviews/analysis/fixes-1.md` for E1 (F11).
- B1 and F10 matter most, because they decide what a red commit asserts.
