---
analyzed_at: 2026-11-27T09:43:49Z
head: 0214575541dd98a4d692936cf86f4762e06fb2b3
critical: 0
high: 1
medium: 1
low: 1
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
| --- | --- | --- | --- | --- | --- |
| I1 | Inconsistency | HIGH | `tasks.md:11–16,37–40,48`; `gates/lib/story-selection.ts:61–69` | T004 and T012 change test support files. Phases 1 and 2 omit the plain scope entries that keep canonical red and head replay focused when support files change. The selector therefore chooses the full test inventory, including unrelated integration tests that require hosted Visual infrastructure. | Give T001 and T010 ownership of their phase’s `test-scope.txt` and list the exact focused test files from T003–T005 and T011–T012 as plain entries, plus any real consumers of changed shared fixture support. Verify the returned selection at red and head. Keep the full hosted checks separately. |
| U1 | Underspecification | MEDIUM | `tasks.md:12,14,16,31`; `packages/elements/test/browser/global-setup.ts:163–174`; `gates/lib/test-evidence.ts:264–270,343–359` | Phase 1 requires the strict fixture to bundle the new isolated module and to replay against the original pre-scaffold base. A missing entry during the shared Vite build can turn that replay into a fixture setup or navigation error. The replay’s missing-module allowance accepts only collection failures attributable to an exact scaffold-added module. | In T004, keep the shared build usable where the entry is absent. Make the named strict-fixture cases produce the same attributable assertion on base/scaffold, or an exact allowed collection error on base and the named assertion on scaffold. Require both replay forms in T006 and keep fixture construction errors invalid. |
| U2 | Underspecification | LOW | `tasks.md:58–67`; Constitution V | The capture task records input and PNG provenance. It leaves the required reason for those baseline changes implicit in the pull request description. | In T026, add the reason for the four new story states and eight expected baselines to the authorized pilot PR description. |

### Coverage summary

| Requirement | Has task | Primary task IDs | Evidence or outcome |
| --- | --- | --- | --- |
| FR-001 | Yes | T002, T004–T005, T007–T009 | Packaged registration and isolated import, documented native trigger/content/close contract, manifest. |
| FR-002 | Yes | T003–T004, T007 | Real native button name and expanded/collapsed state in icon and initials cases. |
| FR-003 | Yes | T003–T004, T007, T018–T020, T022 | Trusted forward and reverse Tab, disabled exclusion, visible external stop, preserved native controls. |
| FR-004 | Yes | T003–T004, T006–T007, T009 | Activation, Escape precedence and return focus, pointer boundaries, outside activation, and host close. |
| FR-005 | Yes | T004, T009, T011–T016, T019 | Exact browser floors and strict policy, measured bounds and clipping, responsive cleanup. |
| FR-006 | Yes | T005, T008, T018–T025, T027–T028 | MINOR changelog and package/manifest inventory, both shared-host Storybook variants and generated Plant inventories. |
| FR-007 | Yes | T003–T004, T007, T011–T012, T015–T016, T018–T020, T025–T028 | Native interactions, token contrast and focus, light/dark and forced colors, real browser and Storybook measurements. |
| FR-008 | Yes | T009, T026, T028 | Matched advisory mutation and ordinary Mutation, pinned two-engine capture, first Visual control and post-review exact observer trial or unavailability. |
| SC-001 | Yes | T003–T004, T006–T007, T009 | Named assertions for each native input, state, Tab path, dismissal and focus destination. |
| SC-002 | Yes | T011–T016 | Actual 320 CSS pixel viewport and transformed clipping, separately measured 2:1 text size and retained reachability. |
| SC-003 | Yes | T018–T020, T022–T028 | Both host interactions in built Storybook and a separate packaged strict fixture, full Visual and Axe plus forced-colors focus. |
| SC-004 | Yes | T009, T026, T028 | Exact candidate CI, mutation parity and timing, capture provenance and cost, and defined review-only control or recorded reason it cannot qualify. |

### Constitution alignment

No procedure authorizes dropping a required check or waiving test-first, CSP, native accessibility, or mutation proof. T017's four possible deferred collateral files match the sampler’s registered list, with local proof for all new behavior and their results recorded from full required CI. They are outside the joined red scope. U2 makes the existing baseline-description obligation explicit.

### Unmapped tasks

None. The base pins, red and green receipts, and retained mutation route support their respective stories’ required proof. The 28 task IDs are sequential, prerequisites point to earlier tasks or an approval checkpoint, and the four proposed parallel groups have disjoint declared write paths.

### Metrics

- Requirements and buildable success criteria checked: 12
- Tasks: 28, split 9 / 7 / 12
- Coverage: 12 of 12, 100%
- Ambiguity: 0
- Duplication: 0
- Critical: 0

### Next actions

Resolve I1 in the checklist before Phase 1. Add U1’s attributable fixture replay and U2’s baseline description to the existing tasks. The three phases and all protected checks stay in place.
