---
analyzed_at: 2026-11-13T10:04:28Z
head: 5bb0e0475cfde844078aedd866d7e066d5fd02dc
critical: 0
high: 2
medium: 3
low: 8
coverage: 95.3
---

## Specification Analysis Report

Feature `specs/011-layout-headers`, analysed after `/speckit-tasks` (spec.md, plan.md and tasks.md; research.md, data-model.md, contracts/ and quickstart.md read for cross-checks; the existing package tests read where a task changes the surface they pin). Constitution 1.3.1. `.specify/extensions.yml` has no hooks registered.

Finding IDs use the letter of the detection pass: C underspecification, D constitution alignment, E coverage gaps, F inconsistency. No duplication (A) or ambiguity (B) finding met the bar.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| D1 | Constitution alignment | HIGH | tasks.md:83 (phase 1 checkpoint); plan.md:245; constitution VIII "Mutation testing", Workflow gates | Phase 1 adds changed source (`src/slot-state.ts`, T005), but its checkpoint names only `tdd-check.sh 1`. There is no gate set, so `mutation` (phase base), `test-lint`, `typecheck` and `lint` do not run before the phase-1 review. Plan line 245 mutation-tests only "element source of each phase", which leaves out `slot-state.ts`. Phase 2's mutation run uses phase 2's base. A surviving mutant in `slot-state.ts` would therefore first show up at the pull request gate, after phase 1 was approved. This is not CRITICAL only because the PR's mutation gate still covers it before merge. | Give phase 1 a checkpoint gate set like the other phases (`typecheck`, `lint`, `test-lint`, `test`, and `mutation` with the phase base over `src/slot-state.ts`). |
| E1 | Coverage gap | HIGH | tasks.md:106 (T016), :115 (T022), and the export tasks T030, T038, T045; `packages/elements/test/exports.test.ts:9`; `packages/elements/test/node/readme.test.ts:170-174` | Existing tests pin the surface the green tasks change, and no red task updates them. `exports.test.ts` asserts that the root exports exactly `["OcelleBrandMark", "OcelleIcon"]`. `readme.test.ts` asserts that the README's "Entry points" table rows and the `package.json` `exports` keys equal the current five. T022, T030, T038 and T045 add exports and root classes, so these tests fail at green. Fixing them in a green commit changes tests outside the red step (constitution VIII, `tdd-check.sh`). FR-036 and T024 also do not name the README's Entry points table rows. | Add to each phase's red tasks (T014/T015/T016, T027, T034, T042): update `exports.test.ts` and the Entry points / exports assertions of `readme.test.ts`. Add the Entry points rows to T024, T031, T039 and T046. Re-list every pinned element list at the phase base (also `manifest.test.ts:250`), as R-12 does for the contrast counts. |
| E2 | Coverage gap | MEDIUM | spec.md:571-578 (FR-006); tasks.md T011, T012, T026, T041 | FR-006 says an absent, empty or invalid value behaves as "not set" and is not rewritten. Only section-header `size` (US1-17) and rail `orientation` (US4-8) test this. These cases have no scenario: card `density=""` or `"bogus"` drawing regular (only T010's unit test of `inCompactCardHeader` touches it, not the card's padding and gap); section-header `variant="bogus"` drawing default; page-header `size=""` or `"bogus"` drawing regular. "Writes no attribute on upgrade" is asserted only for the section header (US1-1). | Add these cases to T011, T012 and T026, each paired with a positive for a valid value. |
| E3 | Coverage gap | MEDIUM | spec.md:761-762 (FR-036), :817-819 (SC-006), :137; tasks.md:161 (T035), :187 (T043) | SC-006 rests on the readme test's per-element statement of the "Consumer-need workaround it replaces". T016 and T028 name it. T035 (sidebar) and T043 (rail) list only their element-specific statements and leave it out, along with FR-036's common statements (usage, slots, properties with their "not set" look, tokens read, empty-slot rule, and the edge-margin trim for the sidebar). The four workarounds also do not map one-to-one to the four elements: "part-level padding and gap overrides" serves both the section header and the sidebar. | Name the common FR-036 statements and each element's workaround in T035 and T043 (sidebar: part-level padding and gap overrides, token-painted dividers; rail: `::part` overrides). State the mapping in FR-036 or the contracts. |
| F1 | Inconsistency | MEDIUM | tasks.md:165 (T036), :191 (T044), :202-206 (Dependencies); plan.md:246 | T036 (phase 4) adds `internalsKey` to `src/naming.ts`, and T044 (phase 5) uses it. The Dependencies section says "phases 4 and 5 need phase 1 only" and "Phase 5 can be split off without touching phases 1–4". Neither holds if phase 4 is deferred or reordered. | State that phase 5 needs T036, or move T036 and its manifest no-member assertion to phase 1. |
| C1 | Underspecification | LOW | tasks.md:185 (T041, US4-10), :193 (T046) | US4-10 reads the orientation example from the README, which is written in green (T046). At red, the test fails because the example is missing. Constitution VIII requires the red failure to be the missing behaviour, not a setup error, and the task does not say how the test reports a missing example. | Make the test's first assertion that the README holds the example (an assertion failure, not a throw). |
| E4 | Coverage gap | LOW | spec.md:788-789 (FR-039); research.md R-15 | FR-039 (engine floor not raised) has no task. R-15 only records the analysis, and nothing checks that the README's Engines list stays unchanged. | Accept it as a constraint met by R-15, or add a readme-test assertion. |
| F2 | Inconsistency | LOW | spec.md:31 | The operator decision on card `inset` cites FR-004 (reflow). The inset requirement is FR-016. | Change the reference to FR-016. |
| F3 | Inconsistency | LOW | tasks.md:5 | tasks.md cites "FR-001 to FR-039", but FR-009 and FR-029 do not exist (there are 37 functional requirements). | Note the gaps. |
| F4 | Inconsistency | LOW | plan.md:53 | The plan says "about 70 acceptance scenarios". The spec has 51 (US1 19, US2 8, US3 13, US4 11). | Correct the count, or say that it counts variants. |
| F5 | Inconsistency | LOW | spec.md:7 | The status is still "Draft", although the spec was approved at the spec gate (plan.md:6-7). | Update the status. |
| F6 | Inconsistency | LOW | plan.md:233; spec.md:405-413 (US3-12), :481-487 (US4-11) | The plan asks for "one landmark per story, distinct label". The US3-12 cases with a blank `aria-label` or with neither name, and the third US4-11 case, are unnamed by design. | Say "distinct label where the case names the landmark". |
| F7 | Inconsistency | LOW | plan.md:158-181 | The plan's source tree leaves out files the tasks change: `src/naming.ts` (T036), `test/in-process.ts` and `test/browser/driver.ts` (T007), `vitest.config.ts` (T006), `test/browser/fixtures/rail-items.css` (T042), and `test/exports.test.ts` (E1). | Add them to the plan's structure. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T011–T016, T020–T024, T026–T031, T033–T039, T041–T046 | |
| FR-002 | Yes | T011, T012, T026, T033, T041 | |
| FR-003 | Yes | T011, T012, T026, T033, T041 | |
| FR-004 | Yes | T011, T017, T026, T028, T033, T035, T041, T043 | |
| FR-005 | Yes | T003, T005, T011, T012, T026, T033, T041 | |
| FR-006 | Partial | T011, T012, T015, T020, T021, T041 | E2 |
| FR-007 | Yes | T015, T027, T034, T042 | |
| FR-008 | Yes | T011, T012, T020, T021, T026, T029, T033, T037 | |
| FR-010 to FR-013 | Yes | T002, T011, T020 | |
| FR-014 to FR-018 | Yes | T010, T012–T014, T019, T021 | |
| FR-019 | Yes | T026, T029 | |
| FR-020 to FR-023 | Yes | T002, T033, T037 | |
| FR-024 to FR-027 | Yes | T002, T041, T043, T044, T047 | |
| FR-028 | Yes | T002, T033, T036, T037, T039–T041, T044, T046, T047 | |
| FR-030, FR-032 | Yes | T009, T018 | |
| FR-031 | Yes | T011, T020, T026, T029 | |
| FR-033 | Yes | T023, T031, T039, T046 | |
| FR-034 | Yes | T015, T022, T027, T030, T034, T038, T042, T045 | |
| FR-035 | Yes | T007, T013, T027, T034, T042 | plus the `csp` gate at checkpoints |
| FR-036 | Yes | T016, T018, T024, T028, T031, T035, T039, T043, T046 | E1, E3 |
| FR-037 | Yes | T023, T031, T039, T046 | |
| FR-038 | Yes | T001, T002, T023, T039, T046 | depends on #10's axe gate (T001 stops and asks if it is missing) |
| FR-039 | No | — | E4 |
| SC-001 | Yes | T011–T013, T026–T027, T033–T034, T041–T042 | |
| SC-002 | Yes | T017, T028, T035, T043 | |
| SC-003 | Yes | T004, T011, T012, T026, T033, T041 | |
| SC-004 | Yes | T023, T025, T031, T032, T039, T040, T046, T047 | |
| SC-005 | No | — | checked only at the phase 2–5 checkpoints; phase 1 has none (D1) |
| SC-006 | Yes | T016, T028, T035, T043 | E3 |

**Constitution Alignment Issues:** none at CRITICAL.
- D1 weakens Principle VIII's "a surviving mutant is a blocking review finding" for `slot-state.ts`.
- E1 forces a test change outside the red step unless the pinned tests are updated in the red commits.
- Principles I to VII and the rest of VIII are met: names and no I/O, token-only styles and the chrome rail, no ID reference across a shadow root and axe on every story, strict CSP, a story per variant and state, the consumer need named, MINOR additions with changelogs, red first with pairing and style plants.

**Unmapped Tasks:** none. T001, T002, T007 and T008 are setup, spike and plumbing; T025, T032, T040 and T047 are phase evidence.

**Metrics:** 43 requirements (37 FR, 6 SC); 47 tasks; coverage 95.3% (41 of 43, with FR-006 counted although only partly covered); ambiguity 0; duplication 0; critical 0.

### Next Actions
- No CRITICAL finding: `/speckit-implement` may proceed once #10 is on `main`. Resolve E1 and D1 first by editing tasks.md, since both break the red/green flow.
- MEDIUM: add FR-006's invalid-value and no-attribute-on-upgrade cases to T011, T012 and T026 (E2). Name the common FR-036 statements and each element's workaround in T035 and T043 (E3). Fix phase 5's dependency on T036 (F1).
- LOW: fix wording and references in spec.md (F2, F5), plan.md (F4, F6, F7) and tasks.md (F3, C1). Decide whether FR-039 needs a check (E4).
