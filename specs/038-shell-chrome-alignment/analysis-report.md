---
analyzed_at: 2026-11-28T00:23:24Z
head: 2fceb5dd95b699b31ba826b44ae2caf8df87a417
critical: 0
high: 0
medium: 3
low: 0
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| E1 | Execution | MEDIUM | tasks.md:9–29,34 · tooling/speckit/README.md:169–181 · gates/lib/story-selection.ts:60–67 | The phase tasks use shared browser fixtures and scenario files but do not name who records their runnable consumers before red. Without a scope list, a changed helper expands that check to every discovered test. The three new product-facing Storybook examples also lack explicit implementation-story scope records, so replay would treat their source as ordinary test overlays. | Have the integration owner declare and review `reviews/phase-{1,2,3}/test-scope.txt` before each red. Name the exact runnable consumers of changed support, and mark `storybook/stories/personal-rail.stories.ts` as an implementation story in Phase 2 and `storybook/stories/top-bar.stories.ts` and `storybook/stories/app-shell.stories.ts` in Phase 3. Keep separate runnable assertions and the required CI gates. |
| U1 | Underspecification | MEDIUM | plan.md:49 · tasks.md:18,27,94–106 · gates/plants/manifest/ | The ownership list names all eight overlay snapshots, but omits the exact `plant.json` descriptors and expected diagnostics required by the plan. The tracked descriptors contain seven intentional failures and a clean reordered control. | Under Manifest records, pair each already assigned overlay with its sibling `plant.json` path and current expected outcome. Preserve the lost `ocelle-icon.attribute.label` finding, one `no-description` finding on the named `ocelle-plant` attribute, CSS part, CSS property, event, property or slot in each matching negative Plant, and zero findings for `pass-reordered`. Keep descriptors as read-only expectations unless an approved scope change requires editing them. |
| G1 | Acceptance detail | MEDIUM | spec.md:55–74 · plan.md:32–42 · tasks.md:16,24–25 | The task list makes the narrow badge specimen and fixed-height rail comparison explicit. It leaves the specified wide direct and projected badge controls and the rail's response to a change in available height implicit. An implementation keyed to the one rail fixture height or supported only at 320 px could pass those task instructions. | In T005, change the height of the same populated opted-in rail and check that the extra space still precedes the divider and the one-item gap stays below it. In T010, compare supplied and absent badges directly and through the shell at a wide viewport as well as at 320 px, using the existing named test files. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T001–T004 | Separate rendered edge and pane observations in light, dark and forced colours. |
| FR-002 | Yes | T001–T004, T010–T012 | Pane separator, brand, menu and action regressions, trusted keyboard, accessible names and painted focus. |
| FR-003 | Yes | T005–T006, T008–T009 | Reflected opt-in, measured bottom gap and spare height, unchanged destination positions, forced-colour specimen. |
| FR-004 | Yes | T005–T006, T009 | Default and fallback orientations, horizontal layout, both empty groups, preserved order and focus. |
| FR-005 | Yes | T010–T014 | Native direct and forwarded optional slot, empty and dynamic cases, one exposed badge, stories and public records. |
| FR-006 | Yes | T010–T012, T015 | Actual narrow viewport, accessible full name, named controls, trusted Tab and activation, both target axes, no overflow and visible focus. |
| FR-007 | Yes | T001–T004, T005, T007–T009, T010–T011, T013–T015 | Existing tokens, public manifest and snapshots, pinned light and dark captures, independent forced-colour and built strict-CSP checks. |
| SC-001 | Yes | T001–T004 | Assertion-level proof of zero top-bar divider pixels and a separately visible consumer divider. |
| SC-002 | Yes | T005–T006, T009 | Fixed-height comparison, token gap and spare-space placement, empty groups, horizontal geometry and focus. |
| SC-003 | Yes | T010–T012, T015 | Direct and projected badge consistency plus reflow, accessibility, keyboard and focus evidence. |
| SC-004 | Yes | T001–T004, T005–T009, T010–T015 | Red and green browser evidence, package documentation, pinned captures, forced colours and strict CSP. |

## Constitution Alignment Issues

None identified. The plan keeps the element interfaces framework-free and additive, uses existing tokens and native control semantics, and separates the forced-colour and built strict-CSP checks from the ordinary visual baselines. The tasks retain tests-only red, focused green, Phase 1 deletion-only Mutation reporting and full required CI on the landing candidate. Baseline changes require their explanation in the landing PR description under Principle V.

## Unmapped Tasks

None. T001–T015 map to at least one functional requirement or success criterion. The three pairs of parallel-ready tasks have disjoint product and fixture write sets once the integration owner assigns shared evidence. Each new phase depends on the previous approved fold.

## Metrics

- Total requirements: 11
- Total tasks: 15
- Coverage: 100%
- Ambiguity findings: 0
- Duplication findings: 0
- Critical findings: 0
- High findings: 0
- Medium findings: 3
- Low findings: 0

## Next Actions

The mission may proceed through the tasks gate. Carry E1 into phase preparation and clarify U1 and G1 in the task ownership and acceptance notes before their phases execute. No spec change or operator design choice is needed.

The local prerequisite command could not run because the execution workspace was unavailable. The spec, plan, contracts, tasks, configuration and cited source were verified at the pinned GitHub commit. The pinned extension configuration declares no analysis hooks.
