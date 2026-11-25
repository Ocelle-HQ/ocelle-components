# Tasks for the change-list discovery

## Phase 1: Compare two runnable compositions

- [X] T001 [US1] Record the phase base, exact control pin, both Storybook IDs and the worktree ownership and timing fields from the reviewed plan. Depends on none. Writes `specs/031-change-list-discovery/reviews/phase-1/base.sha` and `specs/031-change-list-discovery/reviews/phase-1/workflow-pins.md`.
- [X] T002 [P] [US1] Draft the plan story browser assertions for missing story red, Previous/New/Unchanged reading order, both host judgments on an identical diff, visible text in light, dark and forced colors at 320 CSS pixels, and the inline markup and same-origin constraints. Depends on T001. Writes `storybook/test/integration/change-list-plan.test.ts`.
- [X] T003 [P] [US2] Draft the upgrade story browser assertions for missing story red, Previous/New, Removed/Added, digest geometry and unaltered strings, actual Copy button names, visible unclipped focus, native Tab, keyboard activation and exact status for both copy requests, focus continuation, the three display modes and the inline markup and same-origin constraints. Depends on T001. Writes `storybook/test/integration/change-list-upgrade.test.ts`.
- [X] T004 [US1] Verify and stage both test-only drafts. Record the reviewed candidate pin before any candidate worktree return verification. Use the control's scope and sign-off verification when drafting proceeds before candidate approval, and label that receipt as control evidence. Run the canonical red against the built Storybook and record each exact failing story-ID assertion. Depends on T002 and T003. Writes phase 1 red evidence.
- [ ] T005 [P] [US1] Implement the runnable plan revision example on the canonical red pin. Use the fixed story ID, explicit truth labels and host-provided judgment. Depends on T004. Writes `storybook/stories/change-list-plan.stories.ts`.
- [ ] T006 [P] [US2] Implement the runnable upgrade example on the canonical red pin. Use the fixed story ID, grouped digest presentation, exact copy values, host simulation, and named changes. Depends on T004. Writes `storybook/stories/change-list-upgrade.stories.ts`.
- [ ] T007 [US1, US2] Record the reviewed candidate pin before verifying candidate worker returns. Check the signed disjoint changes before staging. After both stories are staged, add the shared bounded token-based layout and run the layout-dependent assertions on the integrated tree. Generate and verify the four pinned baselines, update exact inventory selectors and the affected token Plant by observation, and pin the replay consumers. Depends on T005 and T006. Writes `storybook/.storybook/stories-layout.css`, the four named `storybook/baselines/workflow-studio-*.png` files, the concrete inventory paths in the plan and phase 1 evidence.
- [ ] T008 [US3] Run both compositions and record the common inputs, divergent semantics and recipe or extraction decision. Run the scoped red and green replay, pinned visual and accessibility checks, and the complete hosted checks. Compare test outcomes and timings on identical fixture code under both workflow revisions. Submit for independent review. Depends on T007. Writes `specs/031-change-list-discovery/recommendation.md` and phase 1 verification records.

## Coverage

| Requirement | Proof tasks |
| --- | --- |
| FR-001 | T002, T005, T007 |
| FR-002 | T003, T006, T007 |
| FR-003 | T002, T003, T007 |
| FR-004 | T003, T006 |
| FR-005 | T002, T003, T005, T006 |
| FR-006 | T008 |
