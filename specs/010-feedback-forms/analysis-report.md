---
analyzed_at: 2026-11-13T16:56:54Z
head: f7979c66851e664005a2fa137407e5fcaf302df9
critical: 0
high: 0
medium: 0
low: 2
coverage: 100
---

## Specification Analysis Report

Feature: `specs/010-feedback-forms` (spec.md, plan.md, tasks.md; research.md, data-model.md, contracts/ and quickstart.md read where a task points at them), after `reviews/analysis/fixes-5.md` and its follow-up commit (f7979c6). Constitution 1.3.1. No `before_analyze` or `after_analyze` hooks are registered (`.specify/extensions.yml` has `hooks: {}`).

All 3 findings of the previous report (head b3adf35) are resolved as `fixes-5.md` records:
- U11: a host `aria-hidden="true"` is now not supported on either new kind of element, with `hidden` named instead.
  - Notice: a new FR-009 table row (spec :713). The "Not supported" paragraph (:742-747) now places FR-008's rules on the supported rows only.
  - Form controls: FR-022 (:797-801).
  - Elsewhere: FR-001 and FR-035 carry the rule, as do contracts/elements.md :17 and :60-61 and plan row III. T016b scopes `readme.test.ts:77` and `:78` and adds the notice fragment. T034a adds the form-control fragment.
- I16: T030 asserts the input's `value` property with default `""`, no `attribute` and no `reflects`. T050a names the same for the select.
- A5: FR-022 item 1 now collapses and trims a host `aria-label` for the control's name (:781-782). FR-022 (:814-817) states that the host's node keeps the attribute as written.
  - US2 scenario 13 (:380-383) and T031 pin both names for `aria-label=" Title "`.
  - T034a adds the README fragment. research R-05, data-model.md:123 and contracts/elements.md:53-57 carry the rule.
  - The select inherits the case through US3 scenario 7, which refers to US2 scenario 13, and through T050's reuse of the US2 bodies.
- I14 follow-up: the scoping of `:74`, `:75` and `:76` moved from T034a to T016b (phase 2's red commit). T034a now restates no pinned fragment and adds only the form controls' fragments beside them. T024, T041, plan phases 2 and 3 and research R-05 agree.

Repository claims re-checked against the files:
- the pinned fragments `packages/elements/test/node/readme.test.ts:74-79` match `packages/elements/README.md:189-196` word for word;
- `:33` matches `README.md:234-238`.

Both fix commits changed only files under `specs/010-feedback-forms/`, so the earlier reports' repository checks still hold. One thing still cannot be checked here: how analyzer 0.11.0 merges the `@attribute` tag with the bare `observedAttributes` entry. T036 records that check, with a stop-and-ask.

The findings below are new; IDs continue the previous reports' numbering.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I17 | Inconsistency | LOW | spec FR-001 (:595-600); FR-022 item 1 (:780-782) and :814-817; tasks T016b (:145), T034a (:183); `readme.test.ts:76` | FR-001 lists README convention text that the new elements contradict and says it is restated "in the phase that adds the element". The list misses the `:76` sentence ("Chromium uses a host `aria-label` as written ... the element never rewrites it"). Since A5, that sentence no longer fits a form control, whose control name is collapsed and trimmed. T016b restates `:74` to `:76` in phase 2, before the form controls arrive in phase 3. The tasks are stricter than the spec, so nothing is lost, but the spec's list and phase rule no longer describe what the tasks do. | Add the surrounding-spaces sentence (`:76`, against FR-022 item 1) to FR-001's list. Reword the phase rule to "in the phase that adds the element, or earlier". |
| I18 | Inconsistency | LOW | spec FR-034 (:913-916); contracts/elements.md:17; tasks T016a (:144), T022a (:157), T030 (:178), T050a (:213); plan phase 2 (:299) | FR-034 lists the standard attributes the elements observe without declaring them: `role` on the notice, the host ARIA attributes and `form` on the form elements. It leaves out `hidden`, which every element observes (FR-008, FR-027). The contract lists `hidden` as documented, not declared, and T016a, T022a, T030 and T050a assert that it is not declared. | Add `hidden` to FR-034's list for all three elements. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element-conventions | Yes | T011, T016b, T021, T022, T024, T025, T031, T034a, T038, T039, T041, T050, T055, T056, T062-T065 | I17 |
| FR-002 open-shadow-font-inherit | Yes | T021, T031, T037, T050, T061 | |
| FR-003 no-io-no-other-events | Yes | T031, T038, T050 | |
| FR-004 notice-tone | Yes | T011, T021 | |
| FR-005 tone-contrast | Yes | T010, T018 | |
| FR-006 heading-slot-absence | Yes | T011, T016b, T021, T024 | |
| FR-007 notice-size | Yes | T011, T021 | |
| FR-008 announce-rules | Yes | T011, T012, T013, T019, T020, T021 | |
| FR-009 politeness-role-rows | Yes | T011, T012, T016b, T020, T021, T024 | Host `aria-hidden="true"` row added (U11 resolved) |
| FR-010 notice-forced-colours | Yes | T011, T021 | |
| FR-011 notice-focus-semantics | Yes | T011 | |
| FR-020 form-association | Yes | T032, T037, T050 | |
| FR-021 shared-attributes | Yes | T030, T031, T036, T037, T038, T050, T050a | |
| FR-022 naming | Yes | T031, T034a, T037, T041, T050 | |
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
| FR-034 manifest | Yes | T016a, T022a, T025, T030, T036, T039, T050a, T056 | I18 |
| FR-035 readme | Yes | T016b, T024, T034a, T041, T052a, T057, T066 | |
| FR-036 changelog-engine-floor | Yes | T016b, T024, T025, T034a, T041, T052a, T057 | |
| SC-001 scenarios-both-harnesses | Yes | T011, T013, T031, T033, T050, T051 | |
| SC-002 announcement-matrix | Yes | T012, T013 | |
| SC-003 native-twins | Yes | T032, T050 | |
| SC-004 absent-heading-zero-gap | Yes | T011 | |
| SC-005 baselines-axe-gates | Yes | T061, T065 | |
| SC-006 form-control-readme | Yes | T034a, T041, T066 | |
| SC-007 mutation | Yes | T002, T014, T016, T025, T041, T057, T066 (phase-end gates incl. `gate:mutation`) | |

**Constitution Alignment Issues:** none. No requirement, plan element or task, as written, conflicts with a MUST of the constitution.
- The U11 fix removes the earlier Principle III risk. No artifact now tells a host to hide focusable content from assistive technology. The README names `hidden` instead (plan Constitution Check, row III).

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
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

- No CRITICAL, HIGH or MEDIUM issues. Implementation may proceed once #10 is merged, as the operator's wave planning requires.
- Both LOW findings are wording in the spec. The tasks and contracts are already stricter, so neither blocks a phase. Ideally fix them before the phase that touches them:
  - I17: before phase 2's red commit (T016b), add the `:76` sentence to FR-001's list and reword its phase rule.
  - I18: at any time, add `hidden` to FR-034's list of observed standard attributes that are not declared.
- Suggested commands:
  - Edit `spec.md` by hand (FR-001, FR-034), or re-run `/speckit-specify` with refinement.
  - No change to `plan.md` or `tasks.md` is needed for either finding.
