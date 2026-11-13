---
analyzed_at: 2026-11-13T10:08:24Z
head: 3f46dc5524c0ab07babc5de60085e58fbd37037d
critical: 0
high: 5
medium: 8
low: 5
coverage: 100
---

## Specification Analysis Report

Feature: `specs/010-feedback-forms` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ read where a task points at them). Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | tasks.md:94 (T010), tasks.md:105 (T018); constitution VIII; story-config `test_pathspec` | T010, a task of the red commit (T017), says "Add the ten ink-on-state-ground rows to `packages/tokens/contrast/pairs.json` expectations". `pairs.json` is not a test path, so read literally the red commit changes a non-test file, which Principle VIII and `tdd-check.sh` reject. T018 (green) also adds the same ten rows, so the two tasks overlap. | Reword T010 so it only changes the gate tests (`gates/test/**`) and leave the `pairs.json` rows to T018 alone. |
| I6 | Inconsistency | HIGH | tasks.md:66 (T001), tasks.md:74 (T002); contracts/testing.md:50-51 | T001's unit tests run on "recorded `getFullAXTree` node lists placed in `test/fixtures/ax/`". The contract says these lists come "from the T002 spike", and T002 itself lists "the recorded node lists T001 uses". But T002 runs after the red commit (T001d). T002 also runs "the capture prototype", and no task before T004 produces one. | Say how T001 gets its fixtures before T002: hand-written lists that T002 confirms, or a recording step before the red commit. Say what the "prototype" is, and that replacing fixtures after the red step must not weaken T001 (Principle VIII). |
| U1 | Underspecification | HIGH | tasks.md:94 (T010); research.md:272-283 | T010 asks for "totals 338 and 166 where R-04 names them". R-04 names 149→154 and 160/168/149→165/173/154 but no 338 or 166, and neither figure appears anywhere else in the design documents. Tasks.md:14 requires hand-written expected values to come from the spec and contracts. | Give the source of 338 and 166 (file:line and how they are derived) in R-04, or remove them from T010. |
| U2 | Underspecification | HIGH | tasks.md:190 (T066); constitution VIII ("every test must be shown able to fail") | T066 "completes" the README documentation test in the green section. It has no red step and does not change the README in phase 5. Assertions for README items written in phases 2 to 4 already pass when added, so they can never be seen failing, and `tdd-check.sh` checks the phase's test files only as a whole. | Either put T066's assertions in the phase 5 red commit (T061) with the README text they need added in green, or move each assertion into the phase that writes its README item. If T066 has no behaviour, record the Principle VIII documentation exemption. |
| G1 | Coverage Gap | HIGH | contracts/testing.md:163-164 (plants "later task", "text baseline"); tasks.md:95 (T011), tasks.md:100 (T016), tasks.md:48 | Two notice plants must turn red the scenarios "Edge case 'removed and inserted again in a later task'" and "Edge case whitespace". T011 writes only US1 scenarios 1 to 19 and the SC-002 matrix (T012), so no task writes those bodies. T016 nevertheless adds every US1 plant row. A plant with no body to turn red is a stop-and-ask condition, so phase 2 would stop. | Add those two edge cases (spec.md:514-517) to T011's scenario list, or point the plants at existing scenarios. |
| I2 | Inconsistency | MEDIUM | tasks.md:108 (T021), tasks.md:112 (T025), tasks.md:126 (T030); spec FR-034 (spec.md:885-888); packages/elements/scripts/manifest.ts:7 | The notice observes host `role` and `hidden` (T021), and its manifest is regenerated in phase 2 (T025). The generator's drop list, which today drops only `aria-label`, gains `role` and `hidden` only in phase 3 (T030/T036). Phase 2 can therefore commit a manifest that declares `role`/`hidden`, against FR-034. No phase 2 task tests the notice's manifest entry (empty CSS custom property list, two slots, no events). | Move the `role`/`hidden` drop and a notice manifest test into phase 2's red commit, or make T025 check that neither attribute is declared. |
| I3 | Inconsistency | MEDIUM | tasks.md:12, tasks.md:111 (T024), tasks.md:140 (T041), tasks.md:164 (T057) | The phase flow says "one red commit of test files only", but T024, T041 and T057 extend `test/node/readme.test.ts` "red first" inside the green section, after the phase's red commit (T017, T035, T053). That needs a second red commit that the flow does not mention. | List the README test changes in each phase's red-commit task, or state that a second red commit (recorded by `red.sh`) is expected for the README. |
| G2 | Coverage Gap | MEDIUM | spec FR-020 (spec.md:750), Edge Cases (spec.md:526-527); contracts/testing.md:111-125; tasks T031/T032 | FR-020 says the host "joins the form named by a `form` attribute", but no acceptance scenario, twin row or task tests it. T037 implements `form` only as a read-only property. | Add a twin row or scenario for `form="other-form"` (and "outside any form", spec.md:525) to T031/T032 and to the select's rows in T050. |
| G3 | Coverage Gap | MEDIUM | spec FR-002 (spec.md:594-595); tasks T038, T055 | "Styles of form controls inside the shadow root set `font: inherit`" has no task or assertion. US4 scenario 2's font check depends on #10's `font` rule (T060) and only arrives in phase 5. | Add a computed-style assertion (inner control's font family and size equal the host's) to T031 and T050. |
| G4 | Coverage Gap | MEDIUM | spec Edge Cases (spec.md:513, 524, 525, 529-532, 562-565, 576, 578-579); tasks T011, T031, T050 | Scenario tasks cover only the numbered acceptance scenarios. These edge cases have no task: an empty notice; two notices changing in one task; a form element outside any form; `type="number"` with non-numeric input (`badInput`); a select with no options (`value ""`, `valueMissing`); long unbroken text wrapping; RTL for the input's label, field, description and error; two package copies. | Add the testable edge cases to the scenario tasks, or record in the plan which ones are left untested and why. |
| G5 | Coverage Gap | MEDIUM | spec FR-029 (spec.md:850-853), FR-021 (spec.md:758-759), FR-001 (spec.md:590-593); tasks T031, T050 | No test task asserts the pass-through attributes' reflected properties and types (`readOnly` boolean, `minLength`/`maxLength` numbers with absent meaning no limit, string properties). Also untested: the absence of `defaultValue`, the select ignoring a host `value` attribute, and an unknown `tone`/`size`/`type` staying in the attribute as written. | Add these property and attribute assertions to T031 (input), T050 (select) and T011 (notice). |
| G6 | Coverage Gap | MEDIUM | plan.md:211-214; contracts/testing.md:75-78; tasks.md:68 (T001b), tasks.md:80 (T005) | The plan says every driver addition, `drive.after(ms)` included, has "a test that fails without it". T001b does not list `drive.after`, and T005 does not say it implements it, even though US1-13's 100 ms and 10 ms cases depend on it. | Add `drive.after(ms)` (and the `W`-fraction scaling of contracts/testing.md:77-78) to T001b and T005. |
| G7 | Coverage Gap | MEDIUM | contracts/testing.md:79-84; plan.md:125-130; tasks.md:80 (T005), tasks.md:98 (T014), tasks.md:107 (T020) | No task makes `test/in-process.ts` call `setAnnouncerTimingForTests` before each scenario with the one constant that also sets the capture's `D`. T005 (phase 1) edits `in-process.ts` before the setter exists (T020, phase 2). T014 only checks that `in-process.ts` is the setter's only caller. | Add the wiring to a phase 2 task (with T020 or T013), and test that the capture's `D` and the element's timing come from the same constant. |
| I4 | Inconsistency | LOW | plan.md:32, plan.md:157, research.md:401 vs plan.md:161, plan.md:257, tasks.md:161-162 (T054, T055) | Some documents say the select draws `chevron-down` from `src/icons.ts`; others say it uses the new `src/icon-svg.ts` drawing module. | State both in one sentence everywhere: the icon data comes from `icons.ts`, the drawing from `icon-svg.ts`. |
| I5 | Inconsistency | LOW | spec.md:7 | The spec header says **Status**: Draft, while spec.md:65-69 records approval at the spec gate. | Update the status line. |
| U3 | Underspecification | LOW | plan.md:163-175 vs tasks T001-T001c, T012, T014, T016, T032, T034, T052 | Tasks name files that the plan's structure does not list: `test/scenarios/notice-matrix.ts`, `test/scenarios/form-twins.ts`, `test/node/timing-setter.test.ts`, `test/live-capture.test.ts`, `test/browser/live-capture.test.ts`, `test/driver.test.ts`, `test/browser/driver.test.ts`, `test/fixtures/ax/`, `test/fixtures/*-plants.ts`. | Add them to the plan's structure tree. |
| G8 | Coverage Gap | LOW | plan.md:42-44 ("each phase checks the features it adds against the README's floor list"); spec FR-036; tasks.md:111 (T024) vs T041, T057 | Only phase 2 (T024) checks the engine floor. Phases 3 and 4 add `ElementInternals`, `delegatesFocus` and form-associated callbacks without a floor check task. | Add "engine floor checked unchanged" to T041 and T057. |
| A1 | Ambiguity | LOW | spec FR-008 (spec.md:648, "300 ms after load, 700 ms before"); data-model.md:29; contracts/testing.md:32 | The spec says "after load"; the plan and contracts mean `document.readyState === "complete"`. A notice inserted while `readyState` is `"interactive"` (for example from a `DOMContentLoaded` handler) is an insertion with `W` = 700 ms. No scenario covers that state, and the spec's wording does not say so. | State in FR-008 that "after load" means `readyState` `"complete"`, and add an `"interactive"` cell (via `drive.readyState`) to T011 or T012. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element-conventions | Yes | T021, T022, T025, T038, T039, T055, T056, T062-T065 | Unknown attribute kept as written: not asserted (G5) |
| FR-002 open-shadow-font-inherit | Partial | T021, T037, T061 | `font: inherit` not tested (G3) |
| FR-003 no-io-no-other-events | Yes | T031, T038, T050 | |
| FR-004 notice-tone | Yes | T011, T021 | |
| FR-005 tone-contrast | Yes | T010, T018 | Count figures unsourced (U1); red-commit file (I1) |
| FR-006 heading-slot-absence | Yes | T011, T021, T024 | |
| FR-007 notice-size | Yes | T011, T021 | |
| FR-008 announce-rules | Yes | T011, T012, T019, T020, T021 | Edge-case bodies missing for two plants (G1); `"interactive"` state (A1) |
| FR-009 politeness-role-rows | Yes | T011, T012, T020, T021 | |
| FR-010 notice-forced-colours | Yes | T011, T021 | |
| FR-011 notice-focus-semantics | Yes | T011 | |
| FR-020 form-association | Partial | T032, T037 | `form` attribute untested (G2) |
| FR-021 shared-attributes | Yes | T031, T037 | No `defaultValue`, select `value` attribute: untested (G5) |
| FR-022 naming | Yes | T031, T037 | |
| FR-023 validity | Yes | T031, T032, T037 | |
| FR-024 events | Yes | T031, T038, T050, T055 | |
| FR-025 size-look | Yes | T031, T038 | |
| FR-026 parts-slots | Yes | T030, T037, T039 | |
| FR-027 error-announcement | Yes | T031, T037 | |
| FR-028 error-mark | Yes | T031, T038 | |
| FR-029 input-type-passthrough | Yes | T031, T038 | Property types untested (G5) |
| FR-030 implicit-submission | Yes | T031, T032, T038 | |
| FR-031 select-options | Yes | T050, T055 | |
| FR-032 select-indicator | Yes | T050, T054, T055 | |
| FR-033 stories-baselines | Yes | T060-T065 | |
| FR-034 manifest | Yes | T025, T030, T036, T039, T056 | Phase 2 `role`/`hidden` (I2) |
| FR-035 readme | Yes | T024, T041, T057, T066 | T066 red step (U2) |
| FR-036 changelog-engine-floor | Yes | T025, T041, T057 | Floor check phase 2 only (G8) |
| SC-001 scenarios-both-harnesses | Yes | T011, T013, T031, T033, T050, T051 | |
| SC-002 announcement-matrix | Yes | T012, T013 | |
| SC-003 native-twins | Yes | T032, T050 | |
| SC-004 absent-heading-zero-gap | Yes | T011 | |
| SC-005 baselines-axe-gates | Yes | T061, T065 | |
| SC-006 form-control-readme | Yes | T041, T066 | |
| SC-007 mutation | Yes | T025, T041, T057, T066 (phase-end gates incl. `gate:mutation`) | |

**Constitution Alignment Issues:** none rated CRITICAL. Two findings touch Principle VIII and should be fixed before implementation: I1 (as written, T010 puts a non-test file in a red commit) and U2 (T066's README test assertions cannot be seen failing).

**Unmapped Tasks:** none. Phase 1 tasks (T001-T005) are test infrastructure that SC-001, SC-002 and Principle VIII require; T054 is a refactor serving FR-032; T060 is the R-08 recheck FR-033 requires.

**Metrics:**

- Total Requirements: 35 (FR-001 to FR-011, FR-020 to FR-036, SC-001 to SC-007)
- Total Tasks: 52
- Coverage % (requirements with >=1 task): 100% (2 partial: FR-002, FR-020)
- Ambiguity Count: 1
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No CRITICAL issues. Resolve the five HIGH findings in tasks.md before phase 1 starts, since phases 1 and 2 hit them first:
  - I1: limit T010 to test files.
  - I6: say how T001 gets its node lists before T002.
  - U1: source or remove 338 and 166.
  - U2: give T066 a red step or an exemption.
  - G1: add the two edge-case scenario bodies to T011.
- The MEDIUM findings are task edits:
  - G2 to G7: add the missing assertions or driver/wiring steps.
  - I2: move the manifest drop list to phase 2.
  - I3: state the README test's red commit.
- Suggested commands: edit `tasks.md` by hand (or re-run `/speckit-tasks`) for I1, I3, I6, U1, U2, G1-G8. Run `/speckit-plan` refinement for I4, U3 and the R-04 figures. Run `/speckit-specify` refinement for I5 and A1 (FR-008 wording).
