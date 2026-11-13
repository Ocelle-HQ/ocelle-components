---
analyzed_at: 2026-11-13T10:05:09Z
head: eefba9f4d513cf02c90e123689280a35a8c7ef86
critical: 0
high: 1
medium: 6
low: 6
coverage: 100
---

## Specification Analysis Report

Artifacts: `spec.md` (FR-001 to FR-035, SC-001 to SC-009), `plan.md`, `tasks.md` (T001 to T066), with `research.md`, `data-model.md` and `contracts/` read where a task points to them. Constitution v1.3.1.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| B1 | Ambiguity (untestable) | HIGH | spec.md:L256-258 (US1-5), L612-616 (FR-006); research.md:L59-61 (R-02); contracts/overflow-region.md:L89; tasks.md:L220-224 (T013 US1-5), L176-190 (T010) | US1-5 says arrow keys pressed during text composition are not taken, and the module checks `isComposing`, but no task tests it. The driver (T010) has no composition input. Focus on the scroll box, which is not editable, cannot start an input-method (IME) composition with real input, so the clause looks untestable as written. The `isComposing` guard will survive mutation, which blocks review under constitution VIII unless recorded as equivalent. It also leaves a keyboard path untested (constitution V). | Decide one before phase 2: (a) add a driver composition method (for example CDP `Input.imeSetComposition`) and a US1-5 case in T013, with its plant (the `isComposing` check removed); or (b) record in R-02 why composition cannot reach the box and that the `isComposing` mutant is equivalent, and reword US1-5/FR-006 to match (a spec change through the operator). |
| C1 | Coverage gap | MEDIUM | spec.md:L722-727 (FR-023 "In forced colours the borders stay visible in `CanvasText`"), L894-895 (Assumptions "Forced colours and axe"); tasks.md:L488-520 (T047), L571-582 (T056) | No test or implementation task covers the list-detail pane borders in forced colours. The spec says this feature's own browser tests prove forced-colours outcomes, FR-023 among them, because #10 captures none. Phase 3 has the matching case for lanes (T032 US2-11). | Add a forced-colours case to T047: the US3-1/US3-2 borders in `CanvasText`, side by side and stacked. Its plant is the border rule placed inside `@media not (forced-colors: active)`. Name the rule in T056. |
| C2 | Coverage gap | MEDIUM | spec.md:L344-347 (US2-2), L864-865 (SC-002); tasks.md:L375-376, L389 (T032 US2-1, US2-10) | SC-002 requires a keyboard user to reach the hidden end of an overflowing board with the arrow keys in both writing directions, and US2-2 says the board shows the edge fades. T032 names the board's tab stop and region, and "right to left", but has no arrow-key or fade assertion on the board. The board's keyboard path rests only on the module's scroller tests (constitution V: every keyboard path). | Name in T032 US2-2/US2-10: ArrowRight/ArrowLeft to the hidden end in `ltr` and `rtl`, in 40 px steps, with modified arrows not prevented; and the fades on the board's sides. |
| C3 | Coverage gap | MEDIUM | spec.md:L545-561 (Edge Cases); plan.md:L68-69 (Performance Goals); tasks.md:L373-400 (T032), L488-520 (T047) | These edge-case outcomes have no task: "Many lanes" (twelve lanes in Frame W keep the minimum and the board scrolls); "One lane" (full inline size); "no lanes" (empty box, no overflow, no node; only a story covers it, and a story proves nothing about the tree); "Non-lane children" (same minimum and equal share); "Lane count updates" (changing `count`/`count-label` updates the visible count and the name, with no live region); "Content changes while scrolled" (fades and tab stop follow the clamped position); "list-detail with an empty list slot" (the track keeps its width). The plan's performance goal, twelve lanes of forty cards updating within one frame of a resize, has no task either. | Add each as a case in T032 or T047, with one assertion each and a pairing wherever a "does not" outcome is involved. Otherwise state in the plan which are left to stories or review. Test the performance goal or drop it. |
| C4 | Coverage gap | MEDIUM | spec.md:L456-460 (US3-6 "The next Tab reaches the detail's first focusable element"); tasks.md:L494-499 (T047 US3-6) | The acceptance scenario's Tab path after a pane switch is a keyboard path, and T047 does not name it. Because the wrapper's temporary `tabindex="-1"` is removed on `focusout`, the next Tab is the behaviour most likely to break. | Add to T047 US3-6: after the switch, `press("Tab")` lands on the detail's first focusable element, and the wrapper has no `tabindex` afterwards. |
| F1 | Inconsistency | MEDIUM | research.md:L380-381 (R-08 "`::slotted(*)` gets ... `contain: inline-size`"); contracts/elements.md:L57-58 ("every slotted child has `contain: inline-size`"); tasks.md:L420-424 (T038: `contain: inline-size` on the lane host), L425-428 (T039: board `::slotted(*)` without it); spec.md:L555-556 (Edge Case "Non-lane children") | R-08 and the contract apply the inline-size containment to every child through the board, which is what stops a non-lane child's content from widening the track. T038 puts it on the lane host instead, and T039 leaves it out of the board's `::slotted(*)`. A non-lane child would then have no containment and could make a fitting board overflow. | Align T038/T039 with R-08 and the contract: containment in the board's `::slotted(*)`, optionally on the lane host as well. Add a non-lane child to the US2-14 case or to the C3 cases. |
| F2 | Inconsistency | MEDIUM | spec.md:L790-801 (FR-032), L873-875 (SC-007); plan.md:L81 ("twenty-three stories"); contracts/elements.md:L150-157; tasks.md:L431-434 (T041), L585-586 (T058) | FR-032 lists 20 stories, while the contract, the plan and the tasks have 23. Three are missing from FR-032: board "Right to left", lane "Flat without count" and list-detail "Right to left". SC-007 is stated against "every story of FR-032". The extra stories do no harm, but the spec and the tasks no longer name the same set. | Update FR-032 to the contract's list at the next spec change, or state in the plan that the contract's list replaces it, so SC-007 and T020/T037/T053 check one set. |
| A1 | Duplication | LOW | spec.md:L688-692 (FR-015, FR-016), L866-867 (SC-003); L665-666 (FR-013 first bullet), L712-713 (FR-020) | FR-016 restates FR-015 and SC-003 (Frame W fits, Frame N overflows). FR-020's wrapping rule is FR-013's first bullet applied to the title. | Leave as is, or fold FR-016 into FR-015. No effect on tasks. |
| F3 | Inconsistency | LOW | tasks.md:L528-533 (T049, T050), L257 (T014), L532 (T050) | T049 and T050 are both marked [P] and both write `packages/elements/test/browser/list-detail.test.ts`. T014 and T050 are also marked [P], but they run the bodies written in T013 and T047. | Drop [P] from T049's browser part (or from T050), and note that T014 and T050 follow T013 and T047. |
| F4 | Inconsistency | LOW | tasks.md:L555 (T052 "median 9.9 ms with 1000 rows"); contracts/elements.md:L131 ("about 10 ms (7 to 19 ms)") | The task and the contract word the pass cost the README must state differently. A README test pinned to one wording will not match the other. | Use the contract's wording in T052. |
| C5 | Coverage gap | LOW | spec.md:L351-356 (US2-4); tasks.md:L378-379 (T032 US2-4), L125-127 (T004) | T032's US2-4 asserts the lane ground but not the title and count typography (`font-size-sm`, `font-weight-strong`, `color-ink`, and the count in `color-ink-muted` with tabular figures). It also leaves out `color-pane`, which only the token test T004 covers. | Add the title/count computed styles and the `color-pane` comparison to T032 US2-4. |
| C6 | Coverage gap | LOW | spec.md:L304-306 (US1-13 "the fade returns when focus leaves it or when the user scrolls"); tasks.md:L243-244 (T013) | T013 restores the hidden fade after a wheel scroll and an arrow key, but not after focus leaves the control. | Add the `focusout` restoration to T013's wide-button case. |
| C7 | Coverage gap | LOW | spec.md:L538-541 (Edge Case: "the README says so for both elements"); tasks.md:L276-288 (T019), L410-412 (T036) | T036 checks the shrink-to-fit guidance (give a definite or maximum inline size) in the board's README section, but T019 does not check it in the scroller's. | Add the item to T019. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T012, T013, T016, T023 | US1-13 cases; see C6 |
| FR-002 | Yes | T013, T015, T023 | |
| FR-003 | Yes | T013 | US1-2 |
| FR-004 | Yes | T013, T015, T023 | |
| FR-005 | Yes | T013, T024 | |
| FR-006 | Yes | T010, T013, T023 | composition clause untested, B1 |
| FR-007 | Yes | T011, T013, T016, T022, T023 | |
| FR-008 | Yes | T013 | |
| FR-009 | Yes | T013, T019 | |
| FR-010 | Yes | T012, T013, T019 | |
| FR-011 | Yes | T015, T019, T023 | |
| FR-012 | Yes | T032, T038, T039 | |
| FR-013 | Yes | T032, T038, T039 | see F1 |
| FR-014 | Yes | T032, T039 | arrow keys on the board, C2 |
| FR-015 | Yes | T003, T006, T032 | |
| FR-016 | Yes | T032 | |
| FR-017 | Yes | T032, T035, T038 | |
| FR-018 | Yes | T031, T032, T038 | |
| FR-019 | Yes | T031, T032, T038 | |
| FR-020 | Yes | T032 | US2-8 |
| FR-021 | Yes | T003, T032, T038 | |
| FR-022 | Yes | T047, T056 | |
| FR-023 | Yes | T047, T056 | forced-colours borders untested, C1 |
| FR-024 | Yes | T047, T056 | |
| FR-025 | Yes | T045, T046, T047, T048, T054, T055 | |
| FR-026 | Yes | T047 | |
| FR-027 | Yes | T047, T056 | |
| FR-028 | Yes | T047, T049, T056 | see C4 |
| FR-029 | Yes | T047, T051 | |
| FR-030 | Yes | T013, T018, T024, T032, T035, T047, T051 | |
| FR-031 | Yes | T014, T030, T033, T050 | |
| FR-032 | Yes | T020, T027, T028, T037, T041, T042, T053, T058, T059 | list differs from spec, F2 |
| FR-033 | Yes | T003, T006 | |
| FR-034 | Yes | T019, T036, T052, T062 | see C7, F4 |
| FR-035 | Yes | T029, T043, T060, T063 | |
| SC-001 | Yes | T013 | |
| SC-002 | Yes | T013, T032 | board half not explicit, C2 |
| SC-003 | Yes | T032 | |
| SC-004 | Yes | T031, T032 | |
| SC-005 | Yes | T047 | |
| SC-006 | Yes | T032, T047 | |
| SC-007 | Yes | T028, T042, T059 | |
| SC-008 | Yes | T015, T019 | |
| SC-009 | Yes | T052, T062 | |

**Constitution Alignment Issues:** nothing conflicts with a MUST.

- B1 touches principles V ("every keyboard path") and VIII (a surviving mutant blocks review). It is graded HIGH as an untestable criterion, not as a conflict, because R-02 allows either resolution: a test, or an equivalent mutant recorded with its reason.
- C1 and C2 are forced-colours and keyboard outcomes (principles III and V). Other tasks cover outcomes of the same kind, so these are coverage gaps, not missing gates.
- The per-instance sheet of measured px figures (FR-030) is recorded as a reading of principle II, which the operator decided at plan squad round 2. It is not treated as an exception, so Complexity Tracking stays empty. This report does not reopen that decision.

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
- Ambiguity Count: 1
- Duplication Count: 1
- Critical Issues Count: 0

### Next Actions

- There is no CRITICAL issue. Implementation may start once the HIGH finding is settled.
- **B1 (HIGH):** settle the composition clause before phase 2's red commit. Either add a driver composition method and a US1-5 case to T010/T013, or record the `isComposing` guard as an equivalent mutant in R-02 and take a spec rewording to the operator.
- **MEDIUM:** edit `tasks.md` by hand:
  - C1: add the forced-colours border case.
  - C2: add the board's arrow-key and fade assertions.
  - C3: add the edge-case assertions, or record a decision to leave them out.
  - C4: add the Tab-after-switch case.
  - F1: align T038/T039 with R-08's containment placement.
  - F2 (FR-032's story list) waits for the next spec change through the operator.
- **LOW:** fix during the relevant phase where convenient (A1, F3, F4, C5, C6, C7).
- **Note:** #10 (`claude/010-storybook-workbench`) is not on `origin/main` at this head, so T001's stop-and-ask point applies when implementation starts.
