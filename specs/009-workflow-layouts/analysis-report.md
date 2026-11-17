---
analyzed_at: 2026-11-13T12:58:45Z
head: 321ea0f81209715e85cac8b3d74173526941c40a
critical: 0
high: 0
medium: 1
low: 4
coverage: 100
---

## Specification Analysis Report

Artifacts: `spec.md` (FR-001 to FR-035, SC-001 to SC-009), `plan.md`, `tasks.md` (T001 to T066), with `research.md`, `contracts/` and `data-model.md` read where a task points to them. Constitution v1.3.1. This run follows `reviews/analysis/fixes-1.md` (head 321ea0f), which applied the operator's decisions in `reviews/analysis/operator-decisions.md` to the previous report (head eefba9f).

**Previous findings.** All thirteen are resolved in the artifacts:

- B1: US1-5, FR-006, R-02, both contracts and T013/T023 drop the composition clause and the `isComposing` check, and R-02 records why.
- C1: T047 has the forced-colours border case and its plant; T056 places the rule.
- C2: T032 US2-2 and US2-10 have the board's arrow keys and fades.
- C3: the edge-case cases are in T032 and T047, the spec's pairing table has four new rows, and the timing goal is gone from the plan.
- C4: T047 US3-6 has the Tab after the switch.
- F1: T038, T039, R-08 and contracts/elements.md put the containment in the board's `::slotted(*)`.
- F2: FR-032 lists the 23 stories, matching T027, T041 and T058.
- A1, F3, F4, C5, C6 and C7 are fixed as recommended.

The rows below are new, and some are left over from those fixes.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| U1 | Underspecification (plant) | MEDIUM | spec.md:L212 (pairing row "Content changes while scrolled"); tasks.md:L435-438 (T032 edge case); plan.md:L333-335; contracts/overflow-region.md:L127-131 ("edges: `scroll`"; "Every trigger recomputes the outputs"); reviews/analysis/fixes-1.md (C3 note) | The named plant ("the state not recomputed on `slotchange` or on the track's resize") is likely to fail to bite. The contract recomputes every output on `scroll` too, and both removals in the case move `scrollLeft` (the first clamps it at the new end, the second takes it to 0), so the clamp's `scroll` event restores the state with no help from the planted-out triggers. The fixes record admits this. As written, the guard's proof of failure (constitution VIII) is expected to end at T044's stop-and-ask, not to pass. The case also overlaps US1-3 (content shrinks), whose plant covers the same triggers. | Before phase 3's red commit, name a plant that only this case catches: for example, the fades and the tab stop computed from a cached `scrollLeft` rather than the clamped one, or the recompute removed from all three triggers (`slotchange`, track resize, `scroll`). Alternatively, record in the plan that the case is a positive check whose guard is US1-3's plant. |
| F5 | Inconsistency | LOW | tasks.md:L412-413 (T032 US2-14 plant "a lane without inline-size containment"); plan.md:L326; research.md:L409-410; contracts/overflow-region.md:L151 ("its lanes' `contain: inline-size`") | After F1 the lane has no containment of its own (T038), so T032's US2-14 plant, as worded, describes the shipped code and cannot fail anything. The plan and R-08 now name it correctly ("the board's `::slotted(*)` without inline-size containment"). The overflow-region contract still says "its lanes' `contain: inline-size`". | Reword T032 US2-14's second plant to match the plan and R-08. In contracts/overflow-region.md:L151, say "its slotted children's". |
| F6 | Inconsistency | LOW | tasks.md:L439-440 (T033 [P]), L700 (Parallel Opportunities, phase 3) | F3's fix removed [P] from T014 and T050, which run shared bodies written in the same phase, but missed T033. T033 is still [P] and is listed as parallel, yet it runs T032's bodies. | Drop [P] from T033. Note that it follows T032, as T014 and T050 now do. |
| F7 | Inconsistency | LOW | spec.md:L568 (Edge Case "One lane takes the board's full inline size"); tasks.md:L423-424 (T032 "866 px"); plan.md:L330 ("full inline size less the ring room") | The spec's edge case says the single lane takes the board's full inline size (876 px in Frame W). The plan and T032 assert 866 px, which is the board less its 5 px ring room on each side (FR-014; US2-3 words it that way). The test is right, but a reader of the spec alone would expect 876. | At the next spec change, word the edge case as US2-3 does: "the board's inline size less its ring room on each inline side". |
| C8 | Coverage gap | LOW | spec.md:L572-573 (Edge Case "Non-lane children of a board": "The README says that a board holds lanes"); tasks.md:L447-450 (T036), L476 (T043) | T036's list of board README statements does not include "a board holds lanes", so `readme.test.ts` does not check it, and T043 writes only what T036 lists. | Add the statement to T036's § `ocelle-workflow-board` items. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T012, T013, T016, T023 | US1-13 now includes the `focusout` restoration |
| FR-002 | Yes | T013, T015, T023, T032 | content-change edge case, U1 |
| FR-003 | Yes | T013 | US1-2 |
| FR-004 | Yes | T013, T015, T023 | |
| FR-005 | Yes | T013, T024 | |
| FR-006 | Yes | T010, T013, T023, T032 | composition clause removed (B1 (b)) |
| FR-007 | Yes | T011, T013, T016, T022, T023, T032 | |
| FR-008 | Yes | T013 | |
| FR-009 | Yes | T013, T019 | |
| FR-010 | Yes | T012, T013, T019 | |
| FR-011 | Yes | T015, T019, T023 | |
| FR-012 | Yes | T032, T038, T039 | |
| FR-013 | Yes | T032, T038, T039 | non-lane children case; README item missing, C8 |
| FR-014 | Yes | T032, T039 | board arrow keys and fades in US2-2/US2-10 |
| FR-015 | Yes | T003, T006, T032 | absorbs FR-016's statement |
| FR-016 | Yes | T032 | folded into FR-015; ID kept |
| FR-017 | Yes | T032, T035, T038 | |
| FR-018 | Yes | T031, T032, T038 | count-update edge case |
| FR-019 | Yes | T031, T032, T038 | |
| FR-020 | Yes | T032 | US2-8 |
| FR-021 | Yes | T003, T032, T038 | |
| FR-022 | Yes | T047, T056 | |
| FR-023 | Yes | T047, T056 | forced-colours borders now tested |
| FR-024 | Yes | T047, T056 | |
| FR-025 | Yes | T045, T046, T047, T048, T054, T055 | |
| FR-026 | Yes | T047 | empty list slot edge case |
| FR-027 | Yes | T047 | |
| FR-028 | Yes | T047, T049, T056 | Tab after the switch now tested |
| FR-029 | Yes | T047, T051 | |
| FR-030 | Yes | T013, T018, T024, T032, T035, T047, T051 | |
| FR-031 | Yes | T014, T030, T033, T050 | |
| FR-032 | Yes | T020, T027, T028, T037, T041, T042, T053, T058, T059 | 23 stories in spec, contract and tasks |
| FR-033 | Yes | T003, T006 | |
| FR-034 | Yes | T019, T036, T052, T062 | |
| FR-035 | Yes | T029, T043, T060, T063 | |
| SC-001 | Yes | T013 | |
| SC-002 | Yes | T013, T032 | board half now explicit |
| SC-003 | Yes | T032 | |
| SC-004 | Yes | T031, T032 | |
| SC-005 | Yes | T047 | |
| SC-006 | Yes | T032, T047 | |
| SC-007 | Yes | T028, T042, T059 | |
| SC-008 | Yes | T015, T019 | |
| SC-009 | Yes | T052, T062 | |

**Constitution Alignment Issues:** nothing conflicts with a MUST.

- U1 touches principle VIII: a "does not" guard must be shown able to fail by its plant. It is graded MEDIUM, not CRITICAL, because the guard rules already stop the phase if a plant does not bite. Phase 3 is then expected to stop on it unless the plant changes first.
- Dropping the `isComposing` check (B1 (b)) leaves no untested keyboard path and no mutant to record as equivalent (principles V and VIII). The plan's Constitution Check note was rechecked for this.
- Complexity Tracking stays empty. The per-instance sheet of measured px figures (FR-030) remains the reading of principle II that the operator decided in plan squad round 2. This report does not reopen it.

**Unmapped Tasks:** none. The remaining tasks are setup or proof work for the requirements above:

- T001, T002 and T009 are records and the exemption.
- T021 is the driver.
- T022 is the gate change (R-05).
- T030, T044 and T061 run the plants and gates.
- T065 and T066 are the quickstart run and the merge.

**Metrics:**

- Total Requirements: 44 (35 FR, 9 SC)
- Total Tasks: 66
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

### Next Actions

- There is no CRITICAL or HIGH issue. Implementation may start; it is still blocked on #10, because T001's stop-and-ask applies while `claude/010-storybook-workbench` is not on `main`.
- **U1 (MEDIUM):** settle the "content changes while scrolled" plant before phase 3's red commit. Do it by editing T032 and the plan's phase 3 by hand, or record that the case relies on US1-3's guard. Otherwise T044 will stop on it.
- **LOW:** edit `tasks.md` by hand where convenient:
  - F5: reword T032 US2-14's plant, and contracts/overflow-region.md:L151.
  - F6: drop [P] from T033.
  - C8: add "a board holds lanes" to T036.
  - F7 waits for the next spec change through the operator.
