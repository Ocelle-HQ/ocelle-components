---
analyzed_at: 2026-11-23T12:21:38Z
head: 92e9312c7838cbe883f4c9376a90d9dc2cd580b4
critical: 1
high: 1
medium: 3
low: 0
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|---|---|---|---|---|---|
| C1 | Constitution alignment and ordering | CRITICAL | `tasks.md` T006–T008, `plan.md` lines 20 and 34–35, Constitution VIII | T006 records red for tab participation and combined states. T007 implements host accessibility updates and reference refresh. T008 adds the corresponding computed accessibility and in-process mutation assertions after that implementation. The first-phase assertion for initial supplied context leaves replacement, removal, in-place text edits and same-ID target refresh unproven. | Write and record named red assertions for the new host update and refresh paths in `elements` and the matching built `elements-browser` scenarios before T007. Keep T008 for rerunning those assertions and checking the layout and visual affordances. |
| I1 | Scaffold ordering | HIGH | `tasks.md` T001–T002, `plan.md` line 25, `.specify/extensions/story/scripts/scaffold.sh` lines 17–19, `packages/elements/test/exports.test.ts`, `gates/test/manifest.test.ts` lines 84–91 | T001 calls for a test-free scaffold and puts existing exact export and manifest inventories in its wiring list. The existing test files pin the export namespace and manifest element count. Putting those test edits in the scaffold causes the scaffold script to reject it. | Assign module, package and generated manifest wiring to the test-free scaffold. Put any affected exact test expectations in the test-only phase commit. Prove those expectations match the inert scaffold and keep the missing native action as the behavior failure. |
| T1 | Built red evidence | MEDIUM | `tasks.md` T010–T011 and lines 41–43, `plan.md` lines 20 and 27, `gates/lib/story-selection.ts` lines 70–76 | The in-process status assertion has a clear red step. T011 introduces the built status assertion after the slot is present. The focused base replay selects captured assertion identities, so the built assertion needs its own recorded failure to enter that proof. | Add the built fixture and a named failing assertion for the newly readable status to T010. Keep selection and unchanged host data as green regression assertions in both projects. |
| T2 | Boundary evidence | MEDIUM | `contracts/workflow-node.md` lines 7 and 16, `tasks.md` T002–T003 and T006–T008 | The public contract specifies zero selection requests for an empty identifier and safe focus before the button renders. The tasks cover a configured identifier and rendered focus and leave the two boundary cases unassigned. | Name assertions for an empty identifier and early focus in the phase that introduces each behavior. Record a failing assertion when the behavior is new and cover the relevant branch in the mutation project. |
| T3 | First-phase accessibility evidence | MEDIUM | `plan.md` lines 15, 25 and 34, `tasks.md` T002–T005 and T008 | The first public action has a two-axis target floor in T003. T004 verifies contrast and forced-colors focus and the first assigned dimension measurement is T008 in phase 2. The first phase can reach review without evidence of its target floor. | Assign both dimensions of the actual native action against `--ocelle-target-min` to first-phase verification. Retain the phase-two measurement for narrow wrapping and combined states. |

### Coverage summary

| Requirement | Has task | Task IDs | Evidence planned |
|---|---|---|---|
| FR-001 | Yes | T002, T003, T004 | Both step kinds, exact labels and outcome order |
| FR-002 | Yes | T002, T003, T006, T011 | One native action, stable event identity and activation parity |
| FR-003 | Yes | T002, T006, T007 | Standalone stop, host exclusion and restoration, direct focus and no focus-triggered request |
| FR-004 | Yes | T002, T003, T010, T011 | Host state and data ownership, keyed replacement and read-only regression |
| FR-005 | Yes | T003, T004, T006, T007, T008, T009 | Combined visible and accessible states, contrast, focus and target size |
| FR-006 | Yes | T002, T006, T007, T008, T010, T011 | Full accessible text, host-supplied state and context, readable optional status |
| FR-007 | Yes | T010, T011, T012 | Read-only selection, descriptive outcomes and unchanged data |
| FR-008 | Yes | T003, T004, T007, T009, T011, T012 | Public documentation and examples in both themes |
| SC-001 | Yes | T002, T004 | Exact labels and order in the review and planning examples |
| SC-002 | Yes | T002, T006 | Counts and identifiers, keyed replacement, tab order and direct focus |
| SC-003 | Yes | T004, T006, T007, T008, T009 | Forced-colors text, computed accessible context, long labels, dimensions and contrast |
| SC-004 | Yes | T010, T011, T012 | Same selection request and preserved values in read-only inspection |

C1 and T1 identify evidence gaps within mapped tasks. The `elements` project is in the changed-source mutation configuration. `elements-browser` runs built strict-CSP fixtures as a separate project, so its assertions complement those exercised by mutation. T005, T009 and T013 provide the phase evidence and normal gates. T013 records local proof time, unchanged-repeat reuse and hosted timing separately for comparison with #74.

### Constitution alignment

C1 conflicts with the test-first order in Principle VIII. The spec and plan keep a token-styled native action, shadow-safe accessible references, strict CSP, no new dependencies, exact exports and manifest, pinned visual evidence and all required hosted gates. The node owns presentation and selection requests. Graph editing and navigation stay with #73.

### Unmapped tasks

None. T001 provides loading prerequisites for the two phase-one red suites. T005 and T013 close phase and feature verification.

### Metrics

- Functional requirements and buildable success criteria covered by a task: 12 of 12 (100%)
- Tasks: 13 across 3 phases
- Ambiguity and ordering findings: 1 scaffold ambiguity and 2 proof-order findings
- Duplicate requirements: 0
- Findings by severity: 1 critical, 1 high, 3 medium and 0 low

### Next actions

Update `tasks.md` to put the host-accessibility proof before its implementation and separate test-only inventories from the inert scaffold. Assign the built status red, the contract edge assertions and first-phase button measurements. Re-run `/speckit-squad-analyze` before the tasks approval and test-first implementation.
