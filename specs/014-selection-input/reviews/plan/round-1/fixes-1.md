# Squad round 1: fixes 1

Applied to spec.md, plan.md, research.md, data-model.md, contracts/elements.md and quickstart.md, from `refute.md`
(36 confirmed: 26 fixes, 10 forks with the operator's Decision) and the operator's notes of 2026-11-13 on
PLAN-CORRECTNESS-1-015 (source stays strict TypeScript; a parent's built entry imports its children's, the copy
field's imports `ocelle-icon`'s; the README rule amended accordingly) and PLAN-CORRECTNESS-1-017 (the part guarantees
only its box, accessible name and events; the swap stays a PATCH under that surface). The README and package files
themselves are changed by the implementation phases the plan names (R-16, R-07, R-08, R-17), not in this pass.
Duplicates are resolved with the finding they were kept under.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-001 | fixed | research R-04, R-05, R-13; plan Summary, Testing, Constitution Check VIII, Source Code, phase 2; quickstart step 2 |
| PLAN-CORRECTNESS-1-002 | fixed | research R-04 (origin filter, `defaultPrevented` guard, plant); data-model § Roving input; spec US2-21, FR-021a, FR-019; contract § Pairings |
| PLAN-CORRECTNESS-1-003 | fixed | research R-05 (host `childList` observer, manual assignment per batch); data-model § Child entry; contract § ocelle-tabs (default slot only); spec US2-9 |
| PLAN-CORRECTNESS-1-004 | decided: (a) | research R-03 (disabled at `tabindex="-1"`, focus record, refocus on move), R-05, R-14; data-model `focused` and transitions; spec header, US1-18, US1-21; contract § Pairings ("no refocus") |
| PLAN-CORRECTNESS-1-005 | fixed | research R-06 (timing, plant one frame late), R-11 (`resize`, `afterResizeDelivery`); spec US3-10, Edge Cases; plan Performance Goals; contract § Pairings |
| PLAN-CORRECTNESS-1-006 | fixed | research R-06 (segments observed, regroup after each batch, shared-line technique); spec FR-029, US3-18; contract § Pairings |
| PLAN-CORRECTNESS-1-007 | fixed | research R-08 (keydown Enter on the no-`href` anchor, modifiers, not prevented); contract § Pairings ("activation on the native click only") |
| PLAN-CORRECTNESS-1-008 | fixed | research R-08 (resolution at each activation), R-11 (US5-11 base inserted after load, removed before the pair); data-model § Link state; spec US5-11, FR-047; contract § Pairings |
| PLAN-CORRECTNESS-1-009 | fixed | research R-08 (`src/link-target.ts`, `navigationTarget`), R-11 (fragment hrefs in process, `javascript:` marker, `context.on("page")`), R-13; plan Source Code, phase 6 |
| PLAN-CORRECTNESS-1-010 | decided: (a) | spec header, US3-9, US4-9, FR-029, FR-037; research R-06, R-07, R-15; plan Constitution Check II, Complexity Tracking |
| PLAN-CORRECTNESS-1-011 | decided: (b) | research R-17 (tokens `source.ts` grounds, twelve pairs, counts, changelog, element pairs check), R-15, R-14 (SPEC-1-13); spec header, FR-058, Assumptions; plan Constitution Check II, III, VII, Source Code, phase 2 |
| PLAN-CORRECTNESS-1-012 | fixed | research R-07 (region text node written imperatively, not by the template); data-model § Copy field state; contract § Pairings |
| PLAN-CORRECTNESS-1-013 | fixed | research R-09 (`test/browser-file/`, `elements` exclude, mutation excluded set, config test red first, flag in `chromium.launch`); plan Source Code, phase 1 |
| PLAN-CORRECTNESS-1-014 | decided: (a) | spec header, FR-010a ("one microtask checkpoint", set decides on live children); research R-05 (`takeRecords()` in the setter); data-model § Batching |
| PLAN-CORRECTNESS-1-015 | decided: (a) | research R-16 (parent entries import children, copy field imports `ocelle-icon`, README rule amendment, feature-checked cross-element method, entry tests and plant), R-06, R-07; spec header, FR-001; contract § Entry points; plan Summary, Constitution Check VII, phase 2; quickstart step 1 |
| PLAN-CORRECTNESS-1-016 | fixed | research R-14 (an answer per open note), R-15; spec Edge Cases (no-mutation, motion, long labels, hover, no parent `disabled`), FR-002 (value before event), FR-034, FR-050 (icon stories), US1-23, US2-23, US3-19, US5-14, "Observing navigation"; contract (reflection per property) |
| PLAN-CORRECTNESS-1-017 | decided: (a) | spec header, FR-038, FR-044; research R-07; contract § ocelle-copy-field; plan Constitution Check VII |
| PLAN-CORRECTNESS-1-018 | decided: (b) | spec header, US1-7, US1-18, US1-20, FR-014a, SC-002; research R-18, R-04; data-model transitions; contract § ocelle-listbox, § Pairings; plan Constitution Check I, VI, VII, phase 2 |
| PLAN-CORRECTNESS-1-019 | fixed | research R-08 (outline ring, `box-decoration-break` dropped), R-15 |
| PLAN-CORRECTNESS-1-020 | fixed | contract (every element's lists stated, "none" when empty); data-model § Child entry (no trim) |
| PLAN-A11Y-SECURITY-1-001 | fixed | research R-01 (no role on the tabs host; `role="tablist"` and name on `part="tablist"`; host-exposure spike); contract § ocelle-tabs; spec US2-1, FR-019; contract § Pairings |
| PLAN-A11Y-SECURITY-1-005 | fixed | research R-15 (techniques per element in normal and forced colours, plant "bar as box-shadow only"); contract § Pairings |
| PLAN-A11Y-SECURITY-1-006 | fixed | research R-08 (host exposure spike, one named node, operator fallback); spec US5-8; contract § ocelle-link, § Pairings; plan Decisions 7 |
| PLAN-A11Y-SECURITY-1-007 | fixed | research R-03 (padding of focus width + offset on `part="list"`), R-15; spec US1-16; contract § Pairings |
| PLAN-A11Y-SECURITY-1-008 | decided: (a) | spec header, US3-1, FR-026; research R-01, R-04; contract § ocelle-segmented-choice; plan Constitution Check III |
| PLAN-A11Y-SECURITY-1-009 | fixed | research R-03 (sequential-focus definition incl. delegating hosts, subtree observer of the selected panel); spec US2-22, FR-023; contract § Pairings |
| PLAN-A11Y-SECURITY-1-010 | fixed | research R-08 (README statement on `detail.href`, documentation test); spec FR-047; contract § ocelle-link |
| PLAN-TESTABILITY-1-004 | fixed | contract § Pairings (one row per outcome, positive pair, plant, falsifiable setup); research R-11 (`reviews/phase-N/plants.md`) |
| PLAN-TESTABILITY-1-006 | fixed | research R-11 (`mutate`, `{ parent, kind, index }` addressing, `activeElement` identity), R-02 (no ids in tab and panel scenarios); plan phase 1 |
| PLAN-TESTABILITY-1-009 | fixed | research R-11 (clipboard observer over `write`, `writeText`, `execCommand`, `clipboardData`, at every mount and fixture page; second plant); contract § Pairings |
| PLAN-TESTABILITY-1-010 | fixed | research R-15 (what each paint, line, radius and ring test reads), R-11 (`computedPart`) |
| PLAN-TESTABILITY-1-011 | decided: (a) | spec header, FR-035, US4-6; research R-07 (dispatch after the next rendering update, spike, plant "synchronous dispatch"); data-model § Copy field state; contract § ocelle-copy-field, § Pairings; plan Decisions 7, phase 5 |
| PLAN-TESTABILITY-1-014 | fixed | research R-11 (separate `axStates` command, `controls` as `{ role, name }`, 005's `axTree` unchanged); plan phase 1 |
| PLAN-FRESH-1-001 | decided: (a) | research R-01 (internals under a module-private `Symbol("internals")`, axe story test, plant "private field"); spec header; contract preamble, § Pairings; plan Constitution Check III, phase 2 |
| PLAN-FRESH-1-012 | fixed | research R-06 (comparison rewritten on the real trade-off; consumer claim withdrawn, kitty-mission-ui's WebKitGTK/WKWebView minimums asked before decision 1); plan Decisions 1 |
| PLAN-FRESH-1-013 | fixed | research R-03 (`tabindex="-1"` on `part="list"`); spec US1-22; contract § ocelle-listbox, § Pairings |
