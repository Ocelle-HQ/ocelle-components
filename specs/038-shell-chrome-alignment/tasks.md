# Tasks: Shell Chrome Alignment

**Input**. [Specification](spec.md), [reviewed implementation plan](plan.md), [contracts](contracts/shell-chrome.md) and [validation](quickstart.md).

Run these phases in order. Each starts from a clean, recorded full phase base. Commit runnable tests and fixture support before changing component or Storybook source. Verify the named target is rendered, then retain the assertion-level red, the same assertions green, and the independently replayed result. A story-scoped change to generated evidence may use only its assigned paths. The integration owner updates `tasks.md` as tasks finish, maintains the phase's canonical evidence, and folds the approved phase with the recorded operator authorization. Before the tests-only red, declare and verify changed runnable consumers in that phase's `reviews/phase-N/test-scope.txt`. List the files reached by shared helpers, declare implementation stories, and run any explicitly deferred gate on the same exact candidate before approval.

## Phase 1: User Story 1 — Present one continuous chrome frame

- [X] T001 [US1] Add behavioral red assertions in `packages/elements/test/top-bar.test.ts` and `packages/elements/test/browser/app-shell.test.ts`, with fixture support in `packages/elements/test/browser/fixtures/app-shell.html`, `packages/elements/test/browser/fixtures/app-shell.css` and `packages/elements/test/browser/fixtures/app-shell.js` where needed. Prerequisites: none. Prove a settled visible top bar, zero lower-divider pixels and the separately visible fixture-owned pane separator at its intended boundary in light, dark and forced colours. The zero-divider assertion fails on the pinned old source.
- [X] T002 [US1] Remove the lower chrome rule and its corresponding forced-colour override in `packages/elements/src/ocelle-top-bar.ts`. Prerequisites: T001. Preserve the actual menu's appearance and operation, host actions and the pane separator. Run the same settled assertions green.
- [X] T003 [US1] Reconcile the existing direct and shell Storybook chrome PNGs listed under Phase 1 captures and document the visible change in `packages/elements/README.md` and `packages/elements/CHANGELOG.md`. Prerequisites: T002. Use the exact pinned output in both themes and require a difference attributable to the lower border or its layout contribution before replacing each PNG. Keep all story IDs and compare the rest of the story inventory.
- [ ] T004 [US1] Save replay and capture receipts in `specs/038-shell-chrome-alignment/reviews/phase-1/` and verify the normal diff-based Mutation scope, strict CSP, Visual and the inherited browser menu and actions checks. Prerequisites: T002, T003. If source changes select zero new lines because they are deletions, retain the actual result and verify behavioral sensitivity from T001 and T002.

## Phase 2: User Story 2 — Place the rail divider beside Settings

- [ ] T005 [US2] Add the public flag and comparative geometry red cases in `packages/elements/test/personal-rail.test.ts`, `packages/elements/test/browser/personal-rail.test.ts`, and `packages/elements/test/scenarios/personal-rail.ts`. Prerequisites: T004 and its approved fold. Compare identical tall rails, valid reflection, omitted, empty and other orientations, horizontal with opt-in, both empty-group regressions and focus/order on both vertical-to-horizontal and horizontal-to-vertical transitions with the opt-in enabled. Change the same populated rail’s height and check that the displaced spare space remains before the divider and a one-token gap remains below it. In forced colours sample the system-colour divider, token gap and unchanged destination positions and order on both populated fixed-height rails.
- [ ] T006 [US2] Implement the optional reflected flag and vertical-only spare-space redistribution in `packages/elements/src/ocelle-personal-rail.ts`. Prerequisites: T005. Keep the same visible divider and presentation. Demonstrate the same red assertions green in both test projects.
- [ ] T007 [P] [US2] Regenerate and verify the public manifest and eight Plant paths listed under Manifest records. Replace the equal-gap paragraph in `packages/elements/README.md` with the tested default and opt-in positions and update `packages/elements/CHANGELOG.md`. Prerequisites: T006. Retain the actual manifest preflight against the pinned phase base, unchanged horizontal and empty-group behavior, and each Plant defect.
- [ ] T008 [P] [US2] Add the populated opt-in tall example in `storybook/stories/personal-rail.stories.ts` and its two PNGs under Phase 2 captures. Prerequisites: T006. This task owns the Storybook inventory paths listed below. Derive the story index, capture and Axe expectations from the actual pinned runs and verify the affected Plants. The existing empty-index override for this story file owns all exports, so its blank file stays effective when adding an export.
- [ ] T009 [US2] Record the two-project replay, required phase checks, diff-based Mutation scope and actual results, manifest and capture receipts in `specs/038-shell-chrome-alignment/reviews/phase-2/`. Prerequisites: T007, T008. Recheck the empty-group, order, horizontal and forced-colour cases. Run the manifest and touched Plants and compare expected and observed story inventories.

## Phase 3: User Story 3 — Place a badge beside the product name

- [ ] T010 [P] [US3] Add tests-only direct, projected, no-accessory and dynamic accessory cases in `packages/elements/test/top-bar.test.ts`, `packages/elements/test/app-shell-actions.test.ts` and `packages/elements/test/app-shell-reflow.test.ts`. Prerequisites: T009 and its approved fold. At a true 320 CSS px use the long product name, a short badge, actual shell navigation, menu and Settings action. Observe one badge and the full accessible name, no overflow, two-axis target size, trusted Tab and activation, and rendered pixels for both complete focus indicators in normal and forced-colour runs. Compare the direct and shell-projected badge with the corresponding empty state at a wide viewport and at 320 CSS px.
- [ ] T011 [P] [US3] Extend `packages/elements/test/browser/app-shell.test.ts` and its external `packages/elements/test/browser/fixtures/app-shell.html`, `packages/elements/test/browser/fixtures/app-shell.css` and `packages/elements/test/browser/fixtures/app-shell.js` fixture with a built strict-CSP accessory specimen. Prerequisites: T009 and its approved fold. Prove rendered and accessible badge projection, the real menu and one trusted Settings activation before the clean runtime observation. Keep the existing built resize, drawer/Escape focus and skip-link case.
- [ ] T012 [US3] Add and forward the native optional slot in `packages/elements/src/ocelle-top-bar.ts` and `packages/elements/src/ocelle-app-shell.ts`. Prerequisites: T010, T011 and their canonical tests-only red on the integrated phase branch. Make no extra box or gap for empty content and leave text available to accessibility when visually ellipsized. Run the same tests green.
- [ ] T013 [P] [US3] Regenerate and verify the public manifest and eight Plant paths listed under Manifest records. Document the two optional slot surfaces in `packages/elements/README.md` and `packages/elements/CHANGELOG.md`. Prerequisites: T012. Verify against the exact phase base and keep the existing refs and Plant findings.
- [ ] T014 [P] [US3] Add the standalone and shell badge story variants in `storybook/stories/top-bar.stories.ts` and `storybook/stories/app-shell.stories.ts` and their four PNGs under Phase 3 captures. Prerequisites: T012. This task owns the Storybook inventory paths listed below for this phase. Compare rendered results with and without the accessory and verify actual builds, counts, captures, Axe and affected Plants.
- [ ] T015 [US3] Save the scoped replay, built CSP, Mutation and preflight/capture receipts in `specs/038-shell-chrome-alignment/reviews/phase-3/`. Prerequisites: T013, T014. Confirm behavior, both widths, actual generated evidence and full phase review. The landing integration owner reruns the manifest preflight against integrated current main, reconciles the recorded inventories, and retains the CI and review receipts in `specs/038-shell-chrome-alignment/reviews/landing/`.

## Generated paths and worktree ownership

The canonical owner validates parallel returns from one clean pin. The two Phase 3 red workers return tests only. Integrate both and run the canonical assertion red before T012 starts. Phases run in order. Within each phase, keep generated files to the preceding owner and use the documented return checker. Worktree assignments use exact paths, disjoint ownership, and the recorded phase pin.

### Focused replay inputs

The integration owner writes the exact paths in `specs/038-shell-chrome-alignment/reviews/phase-N/test-scope.txt`, matching the actual tracked diff and the scope syntax in the Spec Kit README. Use the following runnable targets when their fixtures or shared helpers change.

| Phase | Runnable targets | Implementation stories |
| --- | --- | --- |
| 1 | `packages/elements/test/top-bar.test.ts`, `packages/elements/test/browser/app-shell.test.ts` | none |
| 2 | `packages/elements/test/personal-rail.test.ts`, `packages/elements/test/browser/personal-rail.test.ts` | `storybook/stories/personal-rail.stories.ts` |
| 3 | `packages/elements/test/top-bar.test.ts`, `packages/elements/test/app-shell-actions.test.ts`, `packages/elements/test/app-shell-reflow.test.ts`, `packages/elements/test/browser/app-shell.test.ts` | `storybook/stories/top-bar.stories.ts`, `storybook/stories/app-shell.stories.ts` |

Where the story and manifest inventory tests change in Phase 2 or 3, declare their exact runnable paths under the same pin. Keep the changed shared files in their assigned task. Required Storybook, Visual, Axe and Plants results belong to the same candidate before the review.

### Phase 1 captures

Candidate write paths for T003. Keep any image with no observed intended change byte for byte.

- `storybook/baselines/elements-ocelle-app-shell--flush-block-end.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--flush-block-end.light.png`
- `storybook/baselines/elements-ocelle-app-shell--flush-both-ends.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--flush-both-ends.light.png`
- `storybook/baselines/elements-ocelle-app-shell--flush-inline-end.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--flush-inline-end.light.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-collapsed.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-collapsed.light.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-drawer-open.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-drawer-open.light.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-expanded.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-expanded.light.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-narrow.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--mission-narrow.light.png`
- `storybook/baselines/elements-ocelle-app-shell--omitted-regions.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--omitted-regions.light.png`
- `storybook/baselines/elements-ocelle-app-shell--personal-drawer-open.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--personal-drawer-open.light.png`
- `storybook/baselines/elements-ocelle-app-shell--personal-narrow.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--personal-narrow.light.png`
- `storybook/baselines/elements-ocelle-app-shell--personal.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--personal.light.png`
- `storybook/baselines/elements-ocelle-app-shell--project-collapsed.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--project-collapsed.light.png`
- `storybook/baselines/elements-ocelle-app-shell--project-drawer-open.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--project-drawer-open.light.png`
- `storybook/baselines/elements-ocelle-app-shell--project-expanded.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--project-expanded.light.png`
- `storybook/baselines/elements-ocelle-app-shell--project-narrow.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--project-narrow.light.png`
- `storybook/baselines/elements-ocelle-top-bar--brand-only.dark.png`
- `storybook/baselines/elements-ocelle-top-bar--brand-only.light.png`
- `storybook/baselines/elements-ocelle-top-bar--focused.dark.png`
- `storybook/baselines/elements-ocelle-top-bar--focused.light.png`
- `storybook/baselines/elements-ocelle-top-bar--menu-closed.dark.png`
- `storybook/baselines/elements-ocelle-top-bar--menu-closed.light.png`
- `storybook/baselines/elements-ocelle-top-bar--menu-expanded.dark.png`
- `storybook/baselines/elements-ocelle-top-bar--menu-expanded.light.png`
- `storybook/baselines/elements-ocelle-top-bar--narrow.dark.png`
- `storybook/baselines/elements-ocelle-top-bar--narrow.light.png`
- `storybook/baselines/elements-ocelle-top-bar--with-actions.dark.png`
- `storybook/baselines/elements-ocelle-top-bar--with-actions.light.png`

### Phase 2 captures

- `storybook/baselines/elements-ocelle-personal-rail--divider-at-end.light.png`
- `storybook/baselines/elements-ocelle-personal-rail--divider-at-end.dark.png`

### Phase 3 captures

- `storybook/baselines/elements-ocelle-top-bar--brand-accessory.light.png`
- `storybook/baselines/elements-ocelle-top-bar--brand-accessory.dark.png`
- `storybook/baselines/elements-ocelle-app-shell--brand-accessory.light.png`
- `storybook/baselines/elements-ocelle-app-shell--brand-accessory.dark.png`

### Manifest records

T007 and T013 own the following paths in their respective phases. Run `node tooling/speckit/bin/component-preflight.ts manifest --base <full-phase-base-sha>`. Preserve the declared defect for every failed fixture and the semantic equivalence of the clean reordered fixture. The landing owner repeats against integrated main.

- `packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-lost-attribute/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-undescribed-attribute/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-undescribed-css-part/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-undescribed-css-property/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-undescribed-event/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-undescribed-property/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/fail-undescribed-slot/tree/packages/elements/custom-elements.json`
- `gates/plants/manifest/pass-reordered/tree/packages/elements/custom-elements.json`

The corresponding descriptors are read-only evidence inputs. Preserve their declared findings and locations.

| Descriptor | Expected result |
| --- | --- |
| `gates/plants/manifest/fail-lost-attribute/plant.json` | `stale` at `packages/elements/custom-elements.json` · ocelle-icon.attribute.label differs from the generated manifest |
| `gates/plants/manifest/fail-undescribed-attribute/plant.json` | `no-description` at `packages/elements/src/ocelle-plant.ts` · ocelle-plant.attribute.tone has no description |
| `gates/plants/manifest/fail-undescribed-css-part/plant.json` | `no-description` at `packages/elements/src/ocelle-plant.ts` · ocelle-plant.css-part.drawing has no description |
| `gates/plants/manifest/fail-undescribed-css-property/plant.json` | `no-description` at `packages/elements/src/ocelle-plant.ts` · ocelle-plant.css-property.--ocelle-plant-gap has no description |
| `gates/plants/manifest/fail-undescribed-event/plant.json` | `no-description` at `packages/elements/src/ocelle-plant.ts` · ocelle-plant.event.ocelle-plant-change has no description |
| `gates/plants/manifest/fail-undescribed-property/plant.json` | `no-description` at `packages/elements/src/ocelle-plant.ts` · ocelle-plant.property.tone has no description |
| `gates/plants/manifest/fail-undescribed-slot/plant.json` | `no-description` at `packages/elements/src/ocelle-plant.ts` · ocelle-plant.slot.icon has no description |
| `gates/plants/manifest/pass-reordered/plant.json` | Pass, no findings |

### Storybook inventory paths

T008 and T014 own applicable changes to these shared files in their respective phases. Use the actual built story index and browser findings to determine counts. Preserve existing Axe accommodations and unrelated registered findings. Keep the existing blank overrides under `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/` for the three existing filenames.

- `gates/test/integration/axe.test.ts`
- `gates/test/integration/plant-repo.test.ts`
- `gates/test/integration/storybook-build.test.ts`
- `gates/test/integration/visual-capture.test.ts`
- `gates/test/integration/visual-findings.test.ts`
- `gates/test/integration/visual.test.ts`
- `gates/plants/visual/fail-token-changed/plant.json`

## Requirement map

FR-001/FR-002 and SC-001 use T001–T004. FR-003/FR-004 and SC-002 use T005–T009. FR-005/FR-006 and SC-003 use T010–T015. FR-007 and SC-004 use the phase-specific browser, public manifest, capture, forced-colour and strict-CSP evidence and the final integrated proof.
