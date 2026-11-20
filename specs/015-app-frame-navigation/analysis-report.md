---
analyzed_at: 2026-11-20T22:29:22Z
head: b693ed8d7a95217bbcd0662ebf4bc704699a14b9
critical: 1
high: 0
medium: 2
low: 0
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| D1 | Constitution alignment | CRITICAL | tasks.md T027–T030, plan.md Constitution Check VIII and delivery order, constitution Principle VIII | T030 introduces the built-shell interaction test in Phase 7, after Phase 6 completes the last behavior it exercises. The Phase 7 baseline already has tier changes, drawer entry and dismissal, and skip-focus transfer. The available runner and working behavior do not give this phase a valid red run or the required old-code failure. | Write the built-output test as part of Phase 6 before implementing skip focus. Use the existing shell and drawer as setup. The red test must fail on the missing skip behavior with the fixture operational, then pass and rerun in Phase 7. Keep Phase 7 for verification and documentation. |
| E1 | Coverage detail | MEDIUM | spec.md US3.5 and FR-010, tasks.md T003, T016, T022, quickstart.md Source browser tests item 6 | The validation guide calls for an explicit long translated compact label case with forced colors and reduced motion. T003 covers bubble interaction, T016 specifies forced colors and reduced motion only for shell reflow, and T022 names Escape ownership and touch. The explicit bubble visibility, legibility and no-overflow assertions can disappear if the assignee follows only those task descriptions. | Put the guide's compact bubble checks into T003 or T022. Verify the full label, visible focus, and no page overflow with a long translated label, and exercise the relevant forced-colors and reduced-motion behavior. |
| E2 | Coverage detail | MEDIUM | tasks.md T031, plan.md Constitution Check, constitution Development Workflow and Quality Gates | The final verification task enumerates a subset of repository gates. The story procedure and pull-request checks still cover additional gates, including typecheck, lint, prefix, test-quality lint, gate plants and signoff. The final evidence task does not say how it accounts for those results across the complete branch. | Refer expressly to the full constitution gate list in T031 and record branch-wide evidence or the controlling pull-request check for each gate. |

### Coverage Summary Table

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T008–T013, T014, T017, T019 | Layout, regions and single active navigation |
| FR-002 | Yes | T008, T010, T032 | Both thresholds, inputs, defaults, package tokens and documentation |
| FR-003 | Yes | T008, T010, T013 | Independent logical edge opt-outs and LTR/RTL |
| FR-004 | Yes | T014–T019, T022 | Modal behavior, transition focus and Escape ownership |
| FR-005 | Yes | T002, T004, T007, T016 | Native menu activation, expansion, intent, hit bounds and narrow text |
| FR-006 | Yes | T003, T005, T007, T009, T011, T022 | Link semantics, compact context, labels and bubble behavior |
| FR-007 | Yes | T020, T023, T025, T026 | Ordered inline group, current link, standalone loading and variants |
| FR-008 | Yes | T021, T024–T026 | Landmark, current page and logical wrap/alignment |
| FR-009 | Yes | T027–T030 | Both focus targets, fallback, next Tab and built output |
| FR-010 | Yes | T004, T007, T013, T016, T019, T026, T029–T031 | Token styles, theme and environment checks. See E1 for explicit bubble coverage |
| FR-011 | Yes | T006–T007, T012–T013, T018–T019, T025–T031 | Public surface, variants, keyboard, event and mutation evidence. See D1 for red ordering |
| SC-001 | Yes | T008, T010, T013, T014, T019 | Tier boundary fixtures and all layouts |
| SC-002 | Yes | T009, T014–T015, T017–T018 | Exact targets, same-tier changes and asynchronous recovery |
| SC-003 | Yes | T002, T014, T016, T019 | Three layouts at 320 px and full keyboard route |
| SC-004 | Yes | T003, T014, T020–T021, T027–T030 | Labels, current state, narrow reachability and skip focus |
| SC-005 | Yes | T006–T007, T012–T013, T018–T019, T025–T026, T029–T031 | Stories, baselines, accessibility, manifest and CSP |

### Constitution Alignment Issues

D1 requires moving the built-output behavior check ahead of the behavior it proves, in accordance with Principle VIII.

### Unmapped Tasks

None. T001 is the common setup for the pinned runtime and browser. T032 fulfills the plan's deliverable and Constitution Principle VII package changelog requirements.

### Metrics

- Total requirements 16, including 11 functional requirements and five buildable success criteria
- Total tasks 32
- Coverage 100% by requirement-to-task mapping, with coverage detail in E1 and E2
- Ambiguity count 0
- Duplication count 0
- Critical issues 1

### Next Actions

Resolve D1 in `tasks.md` before `/speckit-implement`. Tighten E1 and the evidence scope in E2, then rerun `/speckit-squad-analyze` against the revised task order.
