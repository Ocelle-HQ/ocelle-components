---
analyzed_at: 2026-11-13T23:58:08Z
head: cff3a0c518d9cce4b6d8feb1dbc7b921ef5aa1e1
critical: 1
high: 1
medium: 5
low: 5
coverage: 100
---

## Specification Analysis Report

Feature `specs/012-button-action-row`, analysed after `/speckit-tasks` (tasks.md at cff3a0c). Read: spec.md, plan.md, tasks.md, data-model.md, research.md (R-09, R-13), contracts/checks.md, contracts/elements-package.md (headings), quickstart.md, the triage record, the spec-check and plan-squad records (for what was already raised), and constitution 1.3.1. `.specify/extensions.yml` has no `before_analyze` or `after_analyze` hooks.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | CRITICAL | constitution I ("user intents go out as `ocelle-*` CustomEvents with `bubbles: true` and `composed: true`"); spec.md:697-707 (FR-009: "the native `click` event ... It emits no `ocelle-*` event"), spec.md:196-200 (US1-2), spec.md:873-875 (FR-051); plan.md:83 (Constitution Check row I), plan.md:329-338 (Complexity Tracking: "No exception") | The button reports activation only as the native `click`, and the spec says it emits no `ocelle-*` event. Principle I says user intents go out as `ocelle-*` CustomEvents. Plan row I mentions "the button emits only the native `click`" without a justification, and Complexity Tracking records no exception. No spec check or plan-squad round raised this. The triage record names "click", but a triage record does not override the constitution (Governance). | Operator question Q1. Add an `ocelle-button-*` event (FR-009, FR-051, US1-2/3, US3-1, T016, T020, T025), or add an approved Complexity Tracking row, or amend the constitution through `/speckit-constitution`. Resolve before `/speckit-implement`. |
| I1 | Inconsistency | HIGH | spec.md:805-811 (FR-033: Ctrl, Meta or Shift, or a middle click, dispatches no event), spec.md:484-486 (US5-2: Ctrl, Meta, Shift); plan.md:139 (decision 13: Alt-click on an available link row counts as a modifier click, no event); data-model.md § Event (Ctrl, Meta, Shift, Alt); tasks.md:246 (T061: Ctrl, Meta, Shift, Alt: no event) | The spec and the plan disagree about an Alt-click on an available link row. Spec check 3 note SPEC-3-02 asked the spec to say what an Alt-click does. Plan decision 13 settled it, but FR-033 and US5-2 were not updated. Read with "Activation (click ...) dispatches one event", the spec says an Alt-click dispatches; T061 tests the opposite. | Add Alt to FR-033 and US5-2, or drop Alt from decision 13, data-model and T061. |
| G1 | Coverage | MEDIUM | spec.md:866-872 (FR-050: a story for every value of every enumerated property); tasks.md:215 (T054), tasks.md:248 (T063); research.md R-13 | The row stories cover `ground="chrome"` only. There are no stories for `accent-low`, `inset`, `hover-bg` or `state`, which select a different border (FR-042). `current` has a story for `page` only, not `true`. The button's T021 does list its `ground` values. | Add the row `ground` stories and a `current="true"` story to T054/T063, or name the exempt values and the reason in FR-050. |
| G2 | Coverage | MEDIUM | tasks.md:110 (T014), tasks.md:120 (T021 "focus if T014 allows"); research.md:675; constitution V | The button's focus story depends on a spike and has no fallback. If the spike is negative, focus has no story or baseline, which constitution V does not allow. T054 has no focus story for a non-current row. T014 is a stop-and-ask point, so a negative result stops the phase. | Name a fallback now, either a mechanism 006 allows or an operator-approved exception. Add a row focus story to T054. |
| G3 | Coverage | MEDIUM | spec.md:227-230 (US1-11: link mode in `LinkText`), spec.md:629-634 (FR-002: the same look in both modes); tasks.md:99-102 (phase 2 is button mode only), tasks.md:153 (T031 lists US2 only) | No phase owns the link-mode half of US1-11 or FR-002's "same look for the same variant". | Add both to T031: forced colours in link mode, and each variant's link look equal to its button look by computed colours, border and padding. |
| G4 | Coverage | MEDIUM | spec.md:773-777 (FR-022); tasks.md:119 (T020: README form note only); contracts/checks.md (no form row) | FR-022 is behaviour: inside a `<form>` the button neither submits nor resets, and it has no `type`, `name`, `value` or `form` attribute. Its only task is a README sentence. No test checks the form or the manifest for this (constitution VIII). | Add to T016 a scenario in a `<form>` with `submit` and `reset` listeners, activated by pointer, Enter and Space, paired with a positive `click`. Add to T020 a manifest assertion that the four attributes are absent. |
| U1 | Underspecification | MEDIUM | spec.md:912-914 (SC-006); contracts/elements-package.md § Hand-off to #12 and #14 | SC-006 ("a host can build #12's and #14's controls from the documented interface alone, with no style of its own") has no measurable check and no task that verifies it. | Add composition stories for the three consumer controls with a plant (a host style), or reword SC-006 as a documentation outcome checked by `readme.test.ts`. |
| I2 | Inconsistency | LOW | contracts/checks.md:111 (Gates touched: `gates/lib/plant-runner.ts` mutated) vs contracts/checks.md:127-131 (Mutation scope leaves it out) | The contract gives two different mutation scopes. Phase 1's T013 mutates on a base where `plant-runner.ts` is the only changed source. | Make the two sections match. |
| U2 | Underspecification | LOW | spec.md:711-715 (FR-011: compact is at least 24 CSS px); tasks.md:115 (T016: compact ≥ `space-6`) | The test expresses the compact minimum through the token name, so a change to `space-6` would hide a WCAG 2.5.8 regression. | Write 24 px by hand in T016. |
| D1 | Duplication | LOW | spec.md:600-605 vs FR-012; spec.md:604-605 vs FR-017; spec.md:591-595 vs FR-001 | Several edge cases restate their FR almost word for word, so the two copies can drift apart. | Keep the rule in the FR and make each edge case a pointer to it. |
| G5 | Coverage | LOW | spec.md:906-907 (SC-004 "in every story"); story tests T021/T034/T044/T054/T063 | SC-004 is worded per story, but no story-level test asserts one AX node or one tab stop. Only the scenario tests prove it. | Reword SC-004 to "every scenario page", or add the assertion to the story tests. |
| A1 | Ambiguity | LOW | spec.md:801-804 (FR-032 row-layout wrap); tasks.md:201, 211 (T050) | T050 tests the row-layout wrap, but the spec still has no acceptance scenario for it (SPEC-3-04), and SC-001 counts only scenarios. | Add a US4 scenario for the wrap. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 | Yes | T017, T024, T016, T041, T061 | |
| FR-002 | Yes | T032, T035, T031 | same look uncovered (G3) |
| FR-003 | Yes | T016, T017, T031, T041, T047, T061 | |
| FR-004 | Yes | T031, T032, T035, T050 | |
| FR-005 | Yes | T030, T031, T032, T035 | |
| FR-006 | Yes | T017, T032, T050 | |
| FR-007 | Yes | T015, T018, T022, T025 | |
| FR-008 | Yes | T020, T027, T033, T038, T043, T053, T062 | |
| FR-009 | Yes | T020, T025, T033, T036, T037 | C1 |
| FR-010 | Yes | T016, T025 | |
| FR-011 | Yes | T016, T025 | U2 |
| FR-012 | Yes | T016, T020, T025 | |
| FR-013 | Yes | T017, T025 | |
| FR-014 | Yes | T016, T024 | |
| FR-015 | Yes | T041, T047 | |
| FR-016 | Yes | T041, T046, T047 | |
| FR-017 | Yes | T041, T042, T045, T046 | |
| FR-018 | Yes | T016, T019, T023, T025 | |
| FR-019 | Yes | T016, T019, T025 | |
| FR-020 | Yes | T016, T024 | |
| FR-021 | Yes | T031, T032, T036 | |
| FR-022 | Yes | T020, T027 | README only (G4) |
| FR-030 | Yes | T053, T056, T057 | |
| FR-031 | Yes | T050, T056 | |
| FR-032 | Yes | T050, T061, T064 | A1 |
| FR-033 | Yes | T050, T061, T064 | I1 |
| FR-034 | Yes | T050, T056 | |
| FR-035 | Yes | T050, T056 | |
| FR-036 | Yes | T050, T052, T056, T061 | |
| FR-037 | Yes | T061, T064 | |
| FR-038 | Yes | T050, T061, T064 | |
| FR-039 | Yes | T061, T064 | |
| FR-040 | Yes | T050, T056 | |
| FR-041 | Yes | T050, T056, T061, T064 | |
| FR-042 | Yes | T050, T052, T055 | |
| FR-050 | Yes | T010, T011, T021, T028, T034, T039, T044, T048, T054, T058, T063, T065, T067 | G1, G2 |
| FR-051 | Yes | T016, T050, T061 | |
| FR-052 | Yes | T001, T004, T016, T031, T050 | |
| FR-053 | Yes | T020, T033, T037, T053 | |
| FR-054 | Yes | T018, T029, T051 | |
| FR-055 | Yes | T020, T027, T038, T057, T065 | |
| FR-056 | Yes | T013, T029, T040, T049, T059, T066 | |
| SC-001 | Yes | T016, T031, T041, T050, T061 | |
| SC-002 | Yes | T005, T018, T029 and per phase | |
| SC-003 | Yes | T019, T023, T052, T055 | |
| SC-004 | Yes | T016, T050 | G5 |
| SC-005 | Yes | T016, T041, T050, T061 | |
| SC-006 | Yes | T020, T027, T033 | U1 |
| SC-007 | Yes | T029, T040, T049, T059, T066 | |

**Constitution Alignment Issues:**
- C1, Principle I: there is no `ocelle-*` event for the button's user intent and no recorded exception.
- G2 could become a Principle V conflict, and G4 a Principle VIII conflict, if they are left open. Both are MEDIUM for now.

**Unmapped Tasks:** none. Phase 1 (T001 to T013) is the harness and shard infrastructure for FR-050 to FR-052, and T067 serves FR-050 and decision 15.

**Metrics:**
- Total Requirements: 49 (42 FR, 7 SC)
- Total Tasks: 67
- Coverage %: 100. G3, G4, U1 and G5 are partial coverage inside requirements that have tasks.
- Ambiguity Count: 1
- Duplication Count: 1
- Critical Issues Count: 1

**Operator question Q1 (C1):** the button reports activation only as the native `click`, but constitution I asks for `ocelle-*` CustomEvents.
- (a) The button also dispatches `ocelle-button-activate` (bubbles, composed) on every activation that delivers a `click`. Update FR-009, FR-051, US1-2/3, US3-1, the contract, data-model, T016, T020 and T025.
- (b) Add a Complexity Tracking row to plan.md for "native `click` instead of an `ocelle-*` event", with scope, rationale (parity with `<button>`, triage 012) and a sunset condition, for the operator's approval.
- (c) Amend the constitution through `/speckit-constitution` so a control that wraps one native control may report activation with that control's native composed event.
- (d) Both (a) and (c).

## Next Actions
- C1 is critical. Resolve it before `/speckit-implement`: answer Q1, then change spec, plan and tasks (`/speckit-specify` refinement, `/speckit-plan`, `/speckit-tasks`), or approve the Complexity Tracking row, or amend the constitution.
- Fix I1 in spec.md (FR-033 and US5-2 list Alt) before phase 6.
- Before phase 2's red commit, edit tasks.md by hand: the form scenario and manifest assertion (G4), the focus-story fallback (G2), and compact 24 px written by hand (U2).
- Before phase 3's red commit, add the link-mode half of US1-11 and the same-look check to T031 (G3).
- Before phases 5 and 6, add the row `ground` stories, a `current="true"` story and a row focus story (G1).
- The LOW items (I2, D1, G5, A1) can go into the next spec or contract edit. They do not block.
