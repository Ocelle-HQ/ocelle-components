---
analyzed_at: 2026-11-28T02:16:51Z
head: 4ef309d00bfce2d9deb308f4d8fb2015fa6a2b42
critical: 0
high: 0
medium: 3
low: 1
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| E1 | Execution | MEDIUM | tasks.md:9,16,20,27,31,38 · tooling/speckit/README.md:183–197 | The scope tasks allow eligible `ci-only` inventory suites. The review tasks do not name the exact required Unit inventory and shard evidence for each deferred project/file or the corresponding required Visual or Axe result. A focused pass and standalone Visual or Axe result leave the deferred Unit evidence unverified. | Keep collateral tests in focused replay unless the phase review can verify the exact candidate's passing required Unit inventory and shard for each deferred `gates-integration` file, plus its applicable Visual or Axe result. Record the binding for each `deferred_ci` entry before review. Keep Storybook build and Plant inventory checks local. |
| E2 | Execution | MEDIUM | tasks.md:12,23,34 · plan.md:42–49 · quickstart.md:7–12 | The built tasks distinguish missing-ID availability from browser behavior but leave their execution order implicit. A separate ungated iframe test would navigate to a story absent from both the phase base and neutral scaffold, introducing an unrelated setup failure in canonical red. | Put the exact built index assertion before the new story's iframe navigation in each tests-only-red path and retain its real interactions on green. Continue to prove distinct post-action red assertions through the in-process and strict package-runtime harnesses. Keep the shipped CSF outside both the scaffold and tests-only red. |
| C1 | Evidence precision | MEDIUM | spec.md:55–56,89 · plan.md:47–48 · tasks.md:11–12,22–23,33–34 | The built task rows name keyboard, tap and focus. They do not explicitly allocate both-axis target measurements, focus-ring clipping checks, or the still-connected hidden opener in the narrow route with reduced motion. An active-element assertion alone cannot establish the planned evidence. | Make these checks explicit in the existing built-browser owners' tasks. Measure the applicable controls against the token minimum in both axes and check visible keyboard indicators against viewport and composed clipping ancestors in representative normal and forced-colour paths. In authoring, exercise a still-connected hidden opener under reduced motion and assert its actual focus fallback after close and settled rendering. |
| D1 | Deliverable detail | LOW | tasks.md:38,42–52 · issue #76 Verification · constitution Principle V | The landing sentence requires issue linking and inventory reconciliation. It leaves the exact command and result reporting requested by #76 and the explanation of baseline changes implicit. | In the landing PR include the exact commands and results, including typecheck and Unit tests, and explain the measured baseline changes alongside the issue link. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T001–T008, T009–T016, T017–T024 | Three independently runnable fictional compositions with ordered delivery and evidence-preserving folds. |
| FR-002 | Yes | T002–T007 | Real palette placement, named reviewer, distinct outcomes, selection and status via the existing component composition. |
| FR-003 | Yes | T003–T006, T008 | Finding focus reaches the actual reviewer. Removal updates the authoritative state and verifies successor, fallback and unaffected focus. |
| FR-004 | Yes | T003–T006, T008 | Semantic serialization, visible movement, exact accepted destination change and observed rejected request with retained state and live feedback. |
| FR-005 | Yes | T003–T006, T011–T014 | Exercise delivered selection and viewport navigation and observe zero graph edit requests in both read-only paths. |
| FR-006 | Yes | T010–T014, T016 | Real form and dialog, one-line and two-line refused drafts, retry and one accepted answer with a later identified review. |
| FR-007 | Yes | T011–T014, T016 | Distinct answer and review actors, roles and evidence in the run timeline. |
| FR-008 | Yes | T018–T022, T024 | Independent instances and reviewer bindings, offered capabilities, stable pins during comparison and one explicit accepted pin change. |
| FR-009 | Yes | T003–T006, T011–T014, T019–T022 | Keyboard, tap, responsive state and focus return or recovery. C1 makes the planned measurements explicit. |
| FR-010 | Yes | T004–T008, T012–T016, T020–T024 | Built preview origin and markup checks, separate strict package proof, scoped Mutation, pinned Visual and Axe, forced colours and affected Plants. |
| SC-001 | Yes | T003–T006, T008 | Palette add, real constrained-container drawer, Unassigned reviewer focus, both destinations and atomic removal with actual focus recovery. |
| SC-002 | Yes | T003–T006, T011–T014 | Byte-identical semantics after movement, exact edge change, live rejection notice with retained focus, and zero edit requests in inspection. |
| SC-003 | Yes | T011–T014, T016 | Exact newline and editable draft retention, visible error, one accepted answer and one later identified review. |
| SC-004 | Yes | T019–T022, T024 | Independent bindings and pins before, during and after comparison, dismissal and acceptance. |
| SC-005 | Yes | T001–T008, T009–T016, T017–T024 | Scoped behavioral replay, built browser interaction, separate strict CSP, target and focus checks, pinned captures, Axe and review evidence. |

## Constitution Alignment Issues

No direct conflicts identified. The mission composes shipped elements without changing the public surface. It keeps external fixture code and ordinary CSP checks, separates Storybook availability from behavioral red evidence, retains scoped Mutation and pinned Visual, and preserves the full required CI. D1 makes Principle V's landing description explicit.

## Phase Order and Task Ownership

- Each phase pins its base before scaffold changes. The non-test host and any new stylesheet can be recorded in the scaffold. The strict fixture HTML belongs in the tests-only red and each shipped CSF belongs in implementation.
- The three parallel test returns per phase have disjoint write paths for the in-process, built Storybook and strict-runtime layers. The strict test owns fixture HTML when it changes. Each joined red precedes the host transition, and each story and baseline owner follows that implementation.
- T007, T015 and T023 own the measured story, PNG pair, empty-index overlay and shared inventory changes in their respective phases. Later phases reuse these paths sequentially. The affected and full gates preserve deliberate Plant outcomes.
- T009 depends on the approved Phase 1 fold and T017 depends on the approved Phase 2 fold.

## Unmapped Tasks

None. Each task contributes to an executable journey or its required evidence.

## Metrics

- Requirements covered — 15 of 15, comprising 10 functional requirements and 5 buildable success criteria.
- Tasks mapped — 24 of 24 across three ordered phases.
- Coverage — 100%.
- Ambiguity findings — 1.
- Duplication findings — 0.
- Critical — 0.
- High — 0.
- Medium — 3.
- Low — 1.

## Next Actions

Proceed through the approved tasks gate. Carry E1 and E2 into the exact phase scope and red execution. Assign C1 to the existing built-browser owners and D1 to the landing description. The clarifications preserve the three phases and require no new component scope.

The local prerequisite script was unavailable. Analysis used the exact GitHub tree, including the task setup and reviewed artifacts. The pinned extension configuration has no analysis hooks.
