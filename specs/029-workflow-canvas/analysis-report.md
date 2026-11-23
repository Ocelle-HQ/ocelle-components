---
analyzed_at: 2026-11-23T23:40:37Z
head: 4a8fd0ac75f7ecf75a9cb97b7b16fe6f7404158f
critical: 0
high: 0
medium: 2
low: 0
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Locations | Summary | Recommendation |
|---|---|---|---|---|---|
| E1 | Coverage gap | MEDIUM | `tasks.md` T013, T015 and T019, `plan.md` phase 2 and `quickstart.md` step 4, `spec.md` US3 scenario 5 and SC-003 | T013 can pass its read-only and capture assertions without checking where focus goes when the mode switch removes a focused named move control. T019 covers removing a target but does not explicitly exercise removal of the source while its edit has focus, which requires a different fallback. | In T013, assert the prescribed visible fallback and zero requests when a focused layout control disappears on mode change, and assign that recovery to T015. In T019, explicitly remove the focused edit's source and assert the documented visible survivor or canvas fallback and zero requests. |
| E2 | Coverage gap | MEDIUM | `tasks.md` T002, T006, T025 and T027, `data-model.md` connection and layout entries, `contracts/workflow-canvas.md` Keyboard, touch and host inspector | The approved model distinguishes a valid relationship from a drawable edge. A positioned but clipped destination can be followed, while a destination with no layout entry stays named and the reveal action is unavailable. The tasks exercise clipped destinations and suppress undrawable edges, but they do not require a test that keeps the named relationship when position is absent. Dropping it during projection could pass the stated cases. | In T002 and T006, explicitly preserve valid relation identity without a layout entry while excluding its SVG path. In T025 and T027, assert that an unpositioned destination remains named and cannot emit a reveal request until positioned. |

### Coverage summary

| Requirement key | Has task | Task IDs | Evidence planned |
|---|---|---|---|
| FR-001 | Yes | T001, T002, T004, T009 | Readonly input shapes, keyed node reuse and distinct identities |
| FR-002 | Yes | T002, T006, T009 | Ordered stable relations, missing endpoint exclusion and private route geometry |
| FR-003 | Yes | T004, T009, T012 | Real node action and exact selection stream in both Chromium projects |
| FR-004 | Yes | T003, T004, T007, T009 | Bounded keys, Tab exits, named reveal, clipping, reorder and visible recovery |
| FR-005 | Yes | T013, T015, T016, T018 | Pointer, keyboard and tap pan and zoom, Fit bounds and exact viewport events |
| FR-006 | Yes | T013, T015, T018 | Scaled movement, aligned edges, non-drag operation and cancellation |
| FR-007 | Yes | T019, T021, T024 | Nine operation and input combinations, named choices, exact IDs and inspector contract |
| FR-008 | Yes | T019, T021, T024 | Duplicate names, no-op edits, stale or canceled edit suppression and focus recovery |
| FR-009 | Yes | T002, T004, T013, T019, T021, T025, T027 | Host-controlled snapshots and accepted or rejected state |
| FR-010 | Yes | T013, T015, T019, T021, T025, T027 | Read-only navigation, viewport and selection with edit suppression |
| FR-011 | Yes | T004, T009, T025, T027, T028 | Accessible names and visible focus, empty state, combined selected and invalid cues, forced colors and reduced motion |
| FR-012 | Yes | T004, T012, T018, T024, T030, T031 | Approved renderer comparison, strict CSP, shipped measurement and affected checks |
| FR-013 | Yes | T009–T012, T015–T018, T021–T024, T027–T031 | Public exports, generated manifest, consumer docs, controlled fixtures and pinned baseline pairs |
| SC-001 | Yes | T002–T005, T009, T012 | Actual button requests, visible focus, both Tab directions and late viewport updates |
| SC-002 | Yes | T013–T018 | Scaled drag and alternative input, captured preview before cancellation, and viewport controls |
| SC-003 | Yes | T019–T024 | Nine input and operation combinations, exact requests and controlled cancellation, with the source-removal test detail in E1 |
| SC-004 | Yes | T019, T025–T028, T031 | Read-only follow, no edit leakage, and observable display and accessibility states |
| SC-005 | Yes | T004, T012, T030 | Approved two-size comparison, shipped panel and built-CSP evidence |
| SC-006 | Yes | T009–T012, T016–T018, T022–T024, T027–T031 | Per-element export, manifest, documentation and phased visual and interaction evidence |

### Worktree eligibility and constitution alignment

T002 and T003 both depend on T001 and each writes one distinct test file. T006 and T007 both depend on T005 and each writes one distinct production helper. Neither helper requires the other helper or an unfinished viewport implementation. T004 stays with the owner on staging. T005 combines both drafts with the serial test draft at the common scaffold pin and records the test-only canonical red before the production pair starts. The owner commits proof and completed draft checkboxes separately. T008 uses the exact two-helper Unit check before promotion from the red pin and reserves the shared checklist, proof and integration for the owner. The combined phase check and repeat replay remain in T012. Serial fallback, scoped signed returns, timing and readiness at dispatch remain explicit.

The four phases preserve test-first order, exact assertion failures, final proof against prior behavior, the in-process changed-source mutation path, built strict CSP, independent review, affected Plants, pinned light and dark baselines, and the full required hosted checks. The plan keeps eligible inventory collateral local unless its exact candidate has the required evidence before phase review. Shared generated output has one serial owner.

### Unmapped tasks

None. Setup, proof, ownership checks and generated inventory tasks support the relevant stories and their acceptance evidence.

### Metrics

- Buildable requirements and success criteria with task coverage — 19 of 19 (100%)
- Tasks — 31 across 4 phases
- Phase 1 parallel candidates — 4 tasks in 2 separate stages
- Ambiguity findings — 0
- Duplicate requirements — 0
- Findings by severity — 0 critical, 0 high, 2 medium and 0 low

### Next actions

Carry E1 and E2 into the task text or resolve them before drafting the affected phase tests. After task-set approval, start Phase 1 at T001 and run the two test-draft workers from its committed scaffold.
