# Tasks — Grouped copyable identifiers

**Input**: [Specification](spec.md) and [plan](plan.md)

The integration owner verifies the exact Op 034 readiness receipt before applying the pilot. Required control checks apply to both phases.

## Phase 1: Extend the copy field

**Independent check**: Existing and opted-in fields can render, reveal and request the exact original value under native input and the built strict-CSP fixture.

- [X] T001 Record the phase base and exact focused scope for source, built and manifest proof. Prerequisites: none. Paths: `reviews/phase-1/base.sha`, `reviews/phase-1/test-scope.txt`.
- [X] T002 Write source-importing Chromium red proof for grouping, directional layout, compact disclosure, accessibility reading, stable focus and host replacement, native selection, exact raw Copy requests and existing status timing (FR-001 through FR-005). Include the numeric RTL and separate text-enlargement examples in the plan. Prerequisites: T001. Paths: `packages/elements/test/scenarios/copy-field.ts`, `packages/elements/test/copy-field.test.ts`.
- [X] T003 Prove missing grouped and compact built behavior red on assertions under the existing strict CSP (FR-004 through FR-006). Assert assets and package definitions before the behavioral checks. Prerequisites: T001. Paths: `packages/elements/test/browser/copy-field.test.ts` and its existing fixture if required.
- [X] T004 Prove the exact generated declaration red (FR-006). Cover both opt-in Boolean properties/attributes and the original Copy event and parts. Prerequisites: T001. Path: `packages/elements/test/node/manifest.test.ts`.
- [X] T005 Record the canonical tests-only red with the intended failures. Prerequisites: T002, T003, T004. Paths: `reviews/phase-1/red-commits`, `reviews/phase-1/red-phase.log`.
- [X] T006 Implement grouping and compact presentation in the existing copy field (FR-001 through FR-005). Prerequisites: T005. Path: `packages/elements/src/ocelle-copy-field.ts`.
- [X] T007 Generate the canonical manifest, run the Op 034 manifest preflight, and update the full overlay snapshots named by the preflight. Preserve exact seeded findings and the reordered pass case. Document the minor addition and selection options (FR-006). Prerequisites: T006. Paths: `packages/elements/custom-elements.json`, affected paths from the eight manifest Plant descriptors in the plan, `packages/elements/README.md`, `packages/elements/CHANGELOG.md`.
- [ ] T008 Record focused green, changed-source mutation, affected Plants, the preflight outcome and exact hosted controls. Verify the approved 40-minute elements initial-run budget in `gates/test/vitest-config.test.ts` and `stryker.elements.config.json`. Rerun `packages/elements/src/ocelle-copy-field.ts:379-384` under standard mutation and record its actual baseline duration, report and verdict. Preserve historical red assertions and built entry point and CSP checks. Prerequisites: T006, T007. Paths: `gates/test/vitest-config.test.ts`, `stryker.elements.config.json`, `reviews/phase-1/`, `reviews/pilot-034.md`.

## Phase 2: Ship the Storybook examples

**Independent check**: The real built stories exercise grouped, compact and revealed views in both themes, with complete browser and pinned visual evidence.

- [ ] T009 Declare exact stories and test consumers for replay and prove red on the missing built story IDs after successful build. Prerequisites: T008. Paths: `reviews/phase-2/base.sha`, `reviews/phase-2/test-scope.txt`, `storybook/test/integration/copy-field-stories.test.ts`.
- [ ] T010 Record canonical tests-only red. Prerequisites: T009. Paths: `reviews/phase-2/red-commits`, `reviews/phase-2/red-phase.log`.
- [ ] T011 Add the grouped record ID, compact digest and revealed digest stories and verify real native actions in the built examples (FR-005 and FR-006). If a shared executable host is needed, prove default mutation discovery and scoped Stryker coverage before visual capture. Prerequisites: T010. Path: `storybook/stories/copy-field.stories.ts`.
- [ ] T012 Capture the six exact pinned light and dark baselines and verify actual story, Visual and Axe counts. Update the existing empty-index and token-change Plants where applicable. Prerequisites: T011. Paths: the six baselines and exact test and Plant files listed in the plan.
- [ ] T013 Verify the built browser, strict CSP, full normal CI, source and story scoped replay, Visual, accessibility and affected Plants on the matched candidate. Prerequisites: T011, T012. Paths: `reviews/phase-2/` and `reviews/pilot-034.md`.

After delivery, record the candidate pair, observed reuse verdict, workflow timings and parity, preflight findings and rework in the pilot receipt and retrospective. Reverify actual adjustments before the next issue.
