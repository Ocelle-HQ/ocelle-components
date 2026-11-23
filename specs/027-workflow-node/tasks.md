# Tasks for selectable workflow steps

**Input** [Approved specification](spec.md) · [Approved plan](plan.md) · [Public contract](contracts/workflow-node.md)

## Phase 1: Select and identify a step

**Goal** The author can read a Security review or planning step and select it through one accessible action.

**Independent test** Render both example steps and activate one with pointer, Enter and Space. Rename it and repeat. Verify rich labels, one request with the stable ID, and unchanged host data.

- [ ] T001 [US1] Create and record a separate test-free inert scaffold for `packages/elements/src/ocelle-workflow-node.ts`. Wire `packages/elements/package.json`, `src/index.ts`, `src/browser.ts`, `custom-elements.json` and existing export and manifest inventories so the standalone import and both browser runners load before red. Record the scaffold SHA in `specs/027-workflow-node/reviews/phase-1/scaffold.sha`.
- [ ] T002 [US1] Write the test-only red for FR-001, FR-002, FR-004, SC-001 and SC-002 in `packages/elements/test/workflow-node.test.ts` and its built counterpart `packages/elements/test/browser/workflow-node.test.ts`. Use a null-safe assertion that identifies the missing native action on the scaffold before any driver requires it. Assert exact step text and outcome order, a single Tab stop, full accessible title and initial supported host ARIA on the actual button, pointer/Enter/Space parity, one noncancelable bubbling and composed request before an uncancelled outer native click, ID after rename, and unchanged host selection and data. Replace a pressed host with another keyed instance and check zero requests on release followed by one fresh activation. List all consumers of changed helpers or fixtures in `specs/027-workflow-node/reviews/phase-1/test-scope.txt` before recording red.
- [ ] T003 [US1] Implement the native action, host-owned selection, accessible title and context, and keyed-mount contract in `packages/elements/src/ocelle-workflow-node.ts`. From this phase, the native target itself meets `--ocelle-target-min` in both dimensions and uses token focus and contrast cues. Preserve the card rule as decoration. Document the public entry, event and ownership in `packages/elements/README.md` and `packages/elements/CHANGELOG.md` and regenerate the exact manifest.
- [ ] T004 [US1] Add the Security review, planning and focus examples to `storybook/stories/workflow-node.stories.ts` and commit paired light and dark baselines in `storybook/baselines/`. Verify text and control contrast and a visible focus cue in forced colors for the first public slice. Update exact Storybook and visual inventories without renaming stable behavior cases.
- [ ] T005 [US1] Run focused base/scaffold/head and unchanged-repeat proof, strict changed-source mutation with the `elements` tests, built strict-CSP behavior, applicable gates and affected Plants. Record exact selected project/file identities and reuse in `specs/027-workflow-node/reviews/phase-1/`. Start normal hosted checks on the first reviewable green draft when authorized, and record the elapsed hosted time separately.

## Phase 2: Navigate and read combined states

**Goal** A standalone or canvas user can reach the same action, identify its combined states, and get the full accessible text at narrow widths.

**Independent test** Tab through two nodes both ways, exclude and directly activate one, then restore it. Focus a selected, waiting and invalid node and inspect its visible cues and computed accessible name and description under forced colors.

- [ ] T006 [US2] In `packages/elements/test/workflow-node.test.ts`, write and commit red assertions for the new host-controlled tab participation and coexisting accessible and visible states from FR-003, FR-005, FR-006 and SC-002–003. Retain the existing standalone Tab stop and selection behavior as regressions. Use focus sentinels, direct focus at `-1`, Enter and Space, restoration, and zero requests from focus or data changes. Record changed fixture and helper consumers in `specs/027-workflow-node/reviews/phase-2/test-scope.txt` before the red proof.
- [ ] T007 [US2] Add `selectionTabIndex`, the focus handoff, selected/waiting/invalid text descriptions, and narrow layout behavior in `packages/elements/src/ocelle-workflow-node.ts`. Apply same-root built-in references and the approved host reference resolution, precedence and clearing rules. Preserve valid native focus, full title and built-in state text through host ARIA updates. Document the contract and same-ID reference refresh sequence in `packages/elements/README.md` and refresh the manifest.
- [ ] T008 [US2] Verify actual computed accessible names and descriptions in `packages/elements/test/browser/workflow-node.test.ts`. Cover host literal and reference precedence, `aria-current`, in-place reference text edits, and same-ID target replacement followed by remove, update and reapply. Check the previous context disappears and the full title and states remain. Exercise the relevant paths in `packages/elements/test/workflow-node.test.ts` for mutation reachability, and verify long labels and the actual button dimensions, focus and contrast cues under the planned layout and themes.
- [ ] T009 [US2] Add narrow, focused and combined-state examples in `storybook/stories/workflow-node.stories.ts` and paired baselines in `storybook/baselines/`. Run the exact scope and repeated replay, applicable gate coverage and strict mutation on the changed source. Record phase proof, scope and timing under `specs/027-workflow-node/reviews/phase-2/`.

## Phase 3: Inspect a recorded run

**Goal** A reviewer selects a recorded step and reads its optional host status without changing state or graph data.

**Independent test** In a read-only inspection fixture, read host-provided status and select the same node with pointer and keyboard. Verify the same request contract, one selection action, and unchanged host values.

- [ ] T010 [US3] Write and commit assertion-red tests for newly readable optional status under FR-006, FR-007 and SC-004 in `packages/elements/test/workflow-node.test.ts`. Cover reader-accessible status, empty status, and descriptive outcome labels. In the same fixture preserve already-green selection and data ownership as regressions. Record changed test consumers in `specs/027-workflow-node/reviews/phase-3/test-scope.txt` before running red.
- [ ] T011 [US3] Add the noninteractive status slot outside the native button in `packages/elements/src/ocelle-workflow-node.ts`. Repeat the inspection and one-action assertions on built output with strict CSP in `packages/elements/test/browser/workflow-node.test.ts`. Update `packages/elements/README.md`, `packages/elements/CHANGELOG.md` and `custom-elements.json` with the final entry, event, focus and status contract.
- [ ] T012 [US3] Add the read-only inspection fixture and its light and dark baselines in `storybook/stories/workflow-node.stories.ts` and `storybook/baselines/`. Verify the complete Storybook, manifest, export, visual and accessibility inventory and keep both built and in-process programs covering their planned paths.
- [ ] T013 [US3] Complete focused red/base/scaffold/head and unchanged-repeat evidence, mutation and Plants records in `specs/027-workflow-node/reviews/phase-3/`. Verify the final full required checks including Unit tests, change-scope mutation, Plants, visual regression, accessibility, manifest, Storybook, CSP, lint and sign-off. Compare local proof and complete hosted timing separately with #74 in `specs/027-workflow-node/verification.md`.

## Dependencies and delivery

- Phase 1 provides the public native action and is independently reviewable. Phase 2 extends that action’s focus and state behavior. Phase 3 uses both earlier slices for inspection.
- After each phase’s behavior is green, the built browser fixture wiring and the Storybook fixtures can be prepared independently when their files do not overlap. Reconcile shared inventory counts before committing the combined result.
- Complete each phase’s own red proof, mutation evidence and review before the next phase. Preserve the full required CI checks throughout.
