# Squad round 1: fixes 1

Applies the confirmed fixes and the operator's fork decisions of `refute.md` (decided 2026-11-13,
human:jeroennouwsdev). The four duplicates (PLAN-A11Y-SECURITY-1-001, PLAN-CORRECTNESS-1-009, PLAN-FRESH-1-002,
PLAN-FRESH-1-005) are resolved with the findings they were folded into (PLAN-FRESH-1-001, PLAN-TESTABILITY-1-002,
PLAN-CORRECTNESS-1-001, PLAN-A11Y-SECURITY-1-004).

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-002 | decided: (a) | research R-02 (separate announcer, no content hidden); data-model Notice; spec US1 scenarios 12 and 15 (focused-link variants), operator decisions; plan decision 7; contracts/testing.md plants |
| PLAN-A11Y-SECURITY-1-003 | fixed | research R-02 (`aria-atomic="true"`, every announcement writes the whole text into an empty region), R-06; data-model Notice; contracts/elements.md; spec FR-035 (README states how announcements reach the tree) |
| PLAN-A11Y-SECURITY-1-004 | fixed | research R-05 Naming and Description (`hidden` name and host-description spans); data-model Form control; spec US2 scenario 1 (label text once); contracts/testing.md plants (naming) |
| PLAN-A11Y-SECURITY-1-005 | decided: (b) | spec FR-022, US2 scenario 13 (host node pinned), FR-035, operator decisions; research R-05 Host ARIA; contracts/elements.md; plan decision 3, Constitution Check III |
| PLAN-A11Y-SECURITY-1-006 | decided: (b) | spec FR-022 item 1, US2 scenario 13 (`aria-label` holding the visible label text), FR-035, operator decisions; research R-05 Naming; contracts/elements.md; plan decision 3 |
| PLAN-A11Y-SECURITY-1-007 | fixed | research R-05 Naming (labels' subtrees observed); data-model Form control (observed labels); spec US2 scenario 13 (rename without focus); contracts/testing.md plants (naming) |
| PLAN-A11Y-SECURITY-1-008 | fixed | research R-07 (`pointer-events: none`); data-model Select; spec US3 scenario 8 (click at the indicator); contracts/testing.md (`click` step, indicator plant) |
| PLAN-A11Y-SECURITY-1-009 | fixed | research R-05 Error state styles (width rule outside the not-forced-colours block, FR-025 system colour) |
| PLAN-CORRECTNESS-1-001 | fixed | spec FR-008 "First load and insertion", Edge Cases, US1 scenarios 8 and 9, US2 scenario 20; research R-02 First load (registration flag in `src/define.ts`), R-06; data-model Notice and Form control; contracts/testing.md (`insert` per way, isConnected plant); plan decision 5, phase 2 |
| PLAN-CORRECTNESS-1-002 | fixed | research R-05 Events and Implicit submission (one commit path, `preventDefault` on Enter, last-committed guard); data-model Form control; spec US2 scenario 3 (Enter then blur); contracts/testing.md plants (change event) |
| PLAN-CORRECTNESS-1-003 | decided: (a) | research R-07 Indicator (drawn from `iconOf("chevron-down")`, drawing moved to an internal module); contracts/elements.md (`icon-size`, defines only its own tag); plan Technical Context, Source Code, phase 4, decision 8, Constitution Check I and II |
| PLAN-CORRECTNESS-1-004 | fixed | plan phase 3 (test-first manifest generator task within FR-034's no-new-path-kind rule), Source Code, Constitution Check I |
| PLAN-CORRECTNESS-1-005 | fixed | research R-04 (pairs.json, A.8 test, summary-count tests incl. `contrast-pairs.test.ts`, `contrast.ts` comment; `expected.ts` reference dropped); plan phase 2, Source Code; quickstart step 4 |
| PLAN-CORRECTNESS-1-006 | decided: (a) | spec FR-022, new US2 scenario 23, US3 scenario 7, FR-035, operator decisions; research R-05 Host ARIA ("never differs" withdrawn); data-model Form control; contracts/elements.md; plan decision 3; contracts/testing.md plants (host ARIA) |
| PLAN-CORRECTNESS-1-007 | fixed | data-model Announcement transitions (condition "not live before"; rows for live role changes with differing and equal politeness) |
| PLAN-CORRECTNESS-1-008 | fixed | research R-03 (no floor raise under FRESH-1-004 (c); a newer feature goes to the operator with README entry, CHANGELOG line and semver classification in the phase that first uses it); plan Technical Context, phases 2 and 5, decision 2, Constitution Check VII |
| PLAN-FRESH-1-001 | decided: (b) | research R-02 (persistent announcer, write after `W = 2 × D`, hold and empty; double reading accepted and bounded, re-justified), R-06, R-01 (delay source); data-model Notice and Error transitions; spec "What 'announced' means here" (Insertion and reveal), operator decisions; contracts/elements.md; plan Summary, Performance Goals, decision 7 |
| PLAN-FRESH-1-003 | fixed | spec FR-030 (narrowed to Enter in the element's own field), US2 scenario 21 (mixed form), FR-035; research R-05 Implicit submission; contracts/testing.md § Twins |
| PLAN-FRESH-1-004 | decided: (c) | research R-03 (shadow `.box` with normalised classes, SC-004 measured on the wrapper, floor 120/16.4, `type` on the inner input); data-model Notice; plan Target Platform, decision 2 |
| PLAN-TESTABILITY-1-001 | decided: (a) | spec "What 'announced' means here" (Capture), operator decisions; research R-01 (rendering-update and time tags, `"settled"` and `"rendered"` rules); contracts/testing.md (snapshot shape, `announcements(snapshots, rule)`, microtask and first-rAF plants); plan decision 1, phase 1 (T002 re-measure) |
| PLAN-TESTABILITY-1-002 | fixed | research R-01 Arming; contracts/testing.md (`start(containerId)`, `attachShadow` patch, per-host keys, insertion plant against US1-15 host-role rows and US2-20) |
| PLAN-TESTABILITY-1-003 | fixed | research R-01 Arming (document mode); contracts/testing.md (`startDocument`, first-load plant under it) |
| PLAN-TESTABILITY-1-004 | fixed | research R-09 First load in process; contracts/testing.md (`registerFirstLoad`, `drive.readyState`); plan phase 1 (T002 names unreachable mutants before phase 2) |
| PLAN-TESTABILITY-1-005 | fixed | research R-09 Submission in process; contracts/testing.md § Forms (in-process `submit` semantics), plants (implicit submission) |
| PLAN-TESTABILITY-1-006 | fixed | contracts/testing.md § Twins (absolute outcomes per combination), plants (form value, implicit submission); research R-09; quickstart step 3 |
| PLAN-TESTABILITY-1-007 | fixed | contracts/testing.md § Plants (`test/plants.test.ts` runner, `reviews/phase-<n>/plants.md` record, one plant per family or a stated reason); plan phases 1 to 4, Source Code |
| PLAN-TESTABILITY-1-008 | fixed | research R-09 The oracle (pure `test/live-reading.ts`, per-rule unit tests on recorded trees, planted readings; reason for not mutating recorded); contracts/testing.md; plan phase 1, Constitution Check VIII |
| PLAN-TESTABILITY-1-009 | fixed | research R-01 Bounds, R-09 Mutation (Timeouts in `src/live.ts`, `src/define.ts`, `src/form-control.ts` reviewed one by one); contracts/testing.md (bounds, capture-bounds plant); plan Constitution Check VIII |
| PLAN-TESTABILITY-1-010 | fixed | plan phase 2 (table-driven SC-002 matrix); quickstart step 2 |
| PLAN-TESTABILITY-1-011 | fixed | research R-02 Move in one task; contracts/testing.md (`laterTask()`); contracts/testing.md plants (later task) |
