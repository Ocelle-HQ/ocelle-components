---
analyzed_at: 2026-11-13T16:48:08Z
head: b3adf3511a0c414f57b08174e4581ee5c127f9e5
critical: 0
high: 0
medium: 1
low: 2
coverage: 100
---

## Specification Analysis Report

Feature: `specs/010-feedback-forms` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md read where a task points at them), after `reviews/analysis/fixes-4.md`. Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

All 4 findings of the previous report (head 5cb5420) are resolved as `fixes-4.md` records:
- C5: the shipped-timing row makes an unplanted call that must not throw (contracts/testing.md:188, :214; research.md R-09; T009a, T016).
- U10: FR-009's table has the `aria-hidden="false"` row. FR-022 and FR-035 state the form controls' rule. contracts/elements.md:17 and :58, T016b and T034a carry it.
- I14: T034a scopes `:75` and `:76`, and data-model.md:123 has the blank-skip rule.
- I15: T016b's restated `:33` covers only settable properties, and T030 and T050a assert the read-only properties with no default.

Its repository claims were re-checked against the files:
- the pinned fragments are at `packages/elements/test/node/readme.test.ts:33` and `:74-79`, word for word against `packages/elements/README.md:189-196` and `:234-238`;
- 005's rule for its own elements is in `specs/005-icons-brand-mark/spec.md:746-750`.

The fix commit changed no file outside `specs/010-feedback-forms/`, so the earlier reports' repository checks still hold. One thing still cannot be checked here: how analyzer 0.11.0 merges the `@attribute` tag with the bare `observedAttributes` entry. T036 records that check, with a stop-and-ask.

The findings below are new; IDs continue the previous reports' numbering.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| U11 | Underspecification | MEDIUM | `packages/elements/test/node/readme.test.ts:77` ("A host `aria-hidden=\"true\"` hides the element, labelled or not"); `packages/elements/README.md:194`; spec FR-008 (:646, "while the notice is shown (not `hidden`)"; :691, "Only the host's own `hidden` attribute counts"), FR-009 table (:702-709), FR-022 (:783-789); contracts/elements.md:16-17, :54-58; tasks T016b (:145), T034a (:183), T041 (:194) | No artifact says what a host `aria-hidden="true"` does on the three new elements. The fixes scoped `:74`, `:75`, `:76` and `:79` of the § Host ARIA paragraph, but `:77` stays unscoped, so the README will tell hosts that it "hides the element" on every element. On the notice, FR-008 counts only the host's own `hidden`. An announcing notice with a host `aria-hidden="true"` therefore still counts as shown and writes its copy, while its live region is in an ignored subtree. FR-009 lists it neither as a supported nor as an unsupported row, and no scenario fixes the outcome. On a form control, the same README advice hides a control that stays focusable through `delegatesFocus`. That is the pattern WCAG 4.1.2 and axe's `aria-hidden-focus` (serious) reject. research.md:224 already rules this pattern out for slotted links. 005 specified and tested this case for its own elements (005 spec :746, US1-18, US4-14). | State the rule for each new element in the spec: for example, "not supported" in FR-009's table and in FR-022, as fixes-4 did for `aria-hidden="false"`, or a defined outcome with a scenario. Scope `readme.test.ts:77` (and `:78` if needed) to `ocelle-icon` and `ocelle-brand-mark`, or add fragments for the new elements. Do this in T016b (notice) and T034a (form controls), in the red commits, and list it in contracts/elements.md's "Documented, not declared". |
| I16 | Inconsistency | LOW | tasks T030 (:178: "`value` a property of type `string` with no `attribute` and no `reflects`"), T050a (:213: shared members "with their types, defaults and attributes"); contracts/elements.md:45 (`value` default `""`); T016b (:145: restated `:33`, "every public property that can be set a `@default` tag"); spec FR-034 | The restated convention requires a `@default` tag on every settable property, and FR-034 requires a default for every public property. The form controls' `value` property is settable and has the default `""` in the contract. T030 lists every shared member's default except `value`'s. T050a covers it for the select only through its general wording. A missing `@default` on the input's `value` property would therefore pass every test, since the `manifest` gate checks only descriptions (`gates/bin/manifest.ts:96-106`). | In T030, assert the `value` property's default `""`. In T050a, name it explicitly for the select. |
| A5 | Ambiguity | LOW | spec FR-022 item 1 (:773-777: "its text, alone"), :799-801 (the host's node carries "the same name" as the control); tasks T034a (:183, `:76` scoped to the 005 elements), T031 (:179); research R-05 (Naming); fixes-4.md I14 ("No new claim is made about spaces in a form control's name") | For a non-blank host `aria-label` with surrounding spaces (for example `" Title "`), no artifact says whether the inner control's name keeps them. The name comes through the hidden name span, so the result depends on how the text alternative of `aria-labelledby` treats spaces. The host's node keeps the `aria-label` as written, spaces included (`README.md:190-191`). The two names can therefore differ, against FR-022's "the same name". No scenario fixes the outcome, and the README will say nothing, since `:76` is now scoped to the 005 elements. | State the outcome in FR-022 item 1, or in research R-05 with the README item: for example, the control's name is the `aria-label` with whitespace collapsed and trimmed, or "pass it trimmed" as for 005. Add the T031 cell (`aria-label=" Title "`: the exact control name and the host's name) to phase 3's red commit. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element-conventions | Yes | T011, T016b, T021, T022, T024, T025, T031, T034a, T038, T039, T041, T050, T055, T056, T062-T065 | The pinned `:77` stays unscoped (U11) |
| FR-002 open-shadow-font-inherit | Yes | T021, T031, T037, T050, T061 | |
| FR-003 no-io-no-other-events | Yes | T031, T038, T050 | |
| FR-004 notice-tone | Yes | T011, T021 | |
| FR-005 tone-contrast | Yes | T010, T018 | |
| FR-006 heading-slot-absence | Yes | T011, T016b, T021, T024 | |
| FR-007 notice-size | Yes | T011, T021 | |
| FR-008 announce-rules | Yes | T011, T012, T013, T019, T020, T021 | Host `aria-hidden="true"` not covered (U11) |
| FR-009 politeness-role-rows | Yes | T011, T012, T016b, T020, T021, T024 | Host `aria-hidden="true"` row missing (U11) |
| FR-010 notice-forced-colours | Yes | T011, T021 | |
| FR-011 notice-focus-semantics | Yes | T011 | |
| FR-020 form-association | Yes | T032, T037, T050 | |
| FR-021 shared-attributes | Yes | T030, T031, T036, T037, T038, T050, T050a | `value` property default not asserted for the input (I16) |
| FR-022 naming | Yes | T031, T034a, T037, T041 | Host `aria-hidden="true"` (U11); spaces around a host `aria-label` (A5) |
| FR-023 validity | Yes | T031, T032, T037 | |
| FR-024 events | Yes | T031, T038, T050, T055 | |
| FR-025 size-look | Yes | T031, T038 | |
| FR-026 parts-slots | Yes | T030, T037, T039, T050a | |
| FR-027 error-announcement | Yes | T031, T037 | |
| FR-028 error-mark | Yes | T031, T038 | |
| FR-029 input-type-passthrough | Yes | T031, T038 | |
| FR-030 implicit-submission | Yes | T031, T032, T038 | |
| FR-031 select-options | Yes | T050, T055 | |
| FR-032 select-indicator | Yes | T050, T054, T055 | |
| FR-033 stories-baselines | Yes | T060-T066 | |
| FR-034 manifest | Yes | T016a, T022a, T025, T030, T036, T039, T050a, T056 | I16 |
| FR-035 readme | Yes | T016b, T024, T034a, T041, T052a, T057, T066 | |
| FR-036 changelog-engine-floor | Yes | T016b, T024, T025, T034a, T041, T052a, T057 | |
| SC-001 scenarios-both-harnesses | Yes | T011, T013, T031, T033, T050, T051 | |
| SC-002 announcement-matrix | Yes | T012, T013 | |
| SC-003 native-twins | Yes | T032, T050 | |
| SC-004 absent-heading-zero-gap | Yes | T011 | |
| SC-005 baselines-axe-gates | Yes | T061, T065 | |
| SC-006 form-control-readme | Yes | T034a, T041, T066 | |
| SC-007 mutation | Yes | T002, T014, T016, T025, T041, T057, T066 (phase-end gates incl. `gate:mutation`) | |

**Constitution Alignment Issues:** none rated CRITICAL. No task, as written, breaks a MUST of the constitution by itself.
- U11 touches Principle III (WCAG 2.2 AA; axe "no serious or critical finding"). No story or task sets a host `aria-hidden="true"` on a form control, so no gate fails today. But the README's unscoped sentence would tell hosts to do exactly that.

**Unmapped Tasks:** none.
- Phase 1 (T001-T005a) is the test infrastructure SC-001, SC-002 and Principle VIII require; T002 is the spike of plan decisions 1, 7 and 11.
- The scaffolds T009a, T029a and T049a serve Principle VIII for phases 2 to 4.
- T054 is a refactor serving FR-032.
- T060 is the R-08 recheck FR-033 requires.
- T066 maps FR-035 and SC-006 to their red commits and records phase 5's red evidence.

**Metrics:**

- Total Requirements: 35 (FR-001 to FR-011, FR-020 to FR-036, SC-001 to SC-007)
- Total Tasks: 67
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 1 (A5)
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No CRITICAL or HIGH issues. Implementation may proceed once #10 is merged, as the operator's wave planning requires. The MEDIUM finding is best fixed before the phase it affects.
- Before phase 2's red commit:
  - U11 (notice part): state the notice's rule for a host `aria-hidden="true"` in FR-009 (and FR-008 if it is supported). Scope or restate `readme.test.ts:77` in T016b.
- Before phase 3's red commit:
  - U11 (form-control part): state the form controls' rule in FR-022, contracts/elements.md and T034a, with a README fragment.
  - I16: assert the `value` property's default `""` in T030, and name it in T050a.
  - A5: state how surrounding spaces in a host `aria-label` reach the control's name. Add the T031 cell.
- Suggested commands:
  - Edit `tasks.md` by hand (or re-run `/speckit-tasks`) for U11, I16 and A5.
  - Refine with `/speckit-plan` for contracts/elements.md (U11) and research R-05 (A5).
  - Change the spec (FR-009, FR-022) for U11, and FR-022 item 1 for A5 if the outcome is stated there.
