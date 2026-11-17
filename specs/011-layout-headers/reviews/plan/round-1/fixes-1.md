# Squad round 1: fixes 1

Fix pass 1 of plan squad round 1. Confirmed findings and the operator's fork decisions from `refute.md`
(human:jeroennouwsdev, 2026-11-13). Duplicates are resolved by their canonical row; PLAN-TESTABILITY-1-011 was
refuted and needs no change.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-001 | fixed | research.md R-04 (eyebrow wrapper above the row of [heading + description column, actions]; outer `--ocelle-space-1` gap collapsing when empty; spike item (d)), R-07; spec.md FR-010 (the eyebrow's words take no part in the side-by-side test), US1-2; plan.md decision 3, phase 1 |
| PLAN-CORRECTNESS-1-002 | fixed | research.md R-01 (box-sizing convention), R-07, R-08, R-09, R-10 (size and padding on the host, border-box; spike: 52 / 44 px and the horizontal border box with and without base.css); plan.md decision 6, phase 1 |
| PLAN-CORRECTNESS-1-003 | fixed | research.md R-04 (`:host { display: block }`), R-08, R-09 and R-10 (flex-column host with `min-block-size: 100%`, layout container `flex: 1 0 auto`, rail inline size on the host; host-box spike in block, flex-row and grid containers); spec.md "Measuring an element" (the host's border box); plan.md decisions 5 and 6, phase 1 |
| PLAN-CORRECTNESS-1-004 | decided: (b) | spec.md operator decisions in plan squad round 1, FR-022, FR-023, FR-025, US3-3, US4-2 (the free space lies between the divider and the footer or bottom group); research.md R-09, R-10; plan.md decisions 5 and 6. For one rule across US3-3 and US3-13, the US3-13 divider (empty default slot) is now the head wrapper's `border-block-end` rather than the footer's `border-block-start`, so it too stays with the content before the free space |
| PLAN-CORRECTNESS-1-005 | fixed | research.md R-10 (`margin-inline-start: auto` on the horizontal bottom wrapper; spike case); plan.md decision 6, phase 1 |
| PLAN-CORRECTNESS-1-006 | fixed | as PLAN-A11Y-SECURITY-1-001; its axe observations are in research.md R-11 |
| PLAN-CORRECTNESS-1-007 | decided: (a) | research.md R-05 (pull model: `inCompactCardHeader`, `notifyHeaders`, resolution in `willUpdate` and on connect; definition order, moves and two copies), R-06; data-model.md; contracts/elements-package.md; contracts/checks.md (order, move and mixed-copy tests and plants); plan.md summary, Constitution Check I, decision 1, phase 2 |
| PLAN-CORRECTNESS-1-008 | fixed | spec.md FR-001 (colour and ground variant rules inside the query, layout-only rules outside), FR-036 (Styles paragraph statement), US1-13 (compact card in forced colours), US4-9 (horizontal rail still a row); research.md R-01, R-08, R-10; contracts/checks.md (forced-colours layout plant); plan.md decision 11, phase 2 |
| PLAN-CORRECTNESS-1-009 | decided: (a) | spec.md SC-002 (traced to the story test), operator decisions; research.md R-14; contracts/checks.md § Story test (320 × 800 px pass, text-box rule, nowrap plant); plan.md decision 13, phases 2-5; quickstart.md step 2 |
| PLAN-CORRECTNESS-1-010 | fixed | research.md R-09 (`display: block` on `::slotted(:not([slot]))`), R-04 (`:host { display: block }`); spec.md FR-022, US3-3 (`ocelle-section-header` and `span` section variant); plan.md phases 1 and 4 |
| PLAN-CORRECTNESS-1-011 | fixed | research.md R-12 (token-only clause dropped; file-and-line table including `plants-robustness.test.ts:122` 161 -> 170 and the A.8 table in `contrast-required.test.ts`); contracts/checks.md § Token checks; plan.md decision 8 |
| PLAN-A11Y-SECURITY-1-001 | fixed | research.md R-11 (host as landmark: `internals.role = "navigation"`, `internals.ariaLabel` from `accessibleName`, no inner nav; axe 4.14.0 measured with #10's axe-core before the plan gate, adverse result to the operator there), R-09, R-10, R-15; data-model.md; contracts/elements-package.md; contracts/checks.md (landmark plants); spec.md US3-12, US4-11 (no other node carries the name); plan.md Constitution Check III, decision 7, phase 1 |
| PLAN-A11Y-SECURITY-1-002 | fixed | as PLAN-TESTABILITY-1-007: under its decision (b) axe is not loaded on the fixture pages at all, so the CSP and request records of US3-12 and US4-11 are untouched (contracts/checks.md § Package tests) |
| PLAN-FRESH-1-001 | fixed | as PLAN-CORRECTNESS-1-001 |
| PLAN-FRESH-1-002 | fixed | as PLAN-CORRECTNESS-1-002 |
| PLAN-FRESH-1-003 | fixed | as PLAN-CORRECTNESS-1-003 (FR-023 and FR-025 keep their MUST) |
| PLAN-FRESH-1-004 | fixed | as PLAN-A11Y-SECURITY-1-001 |
| PLAN-FRESH-1-005 | decided: (a) | as PLAN-CORRECTNESS-1-007 |
| PLAN-FRESH-1-006 | fixed | as PLAN-CORRECTNESS-1-008, with its forced-colours layout checks in US1-13 and US4-9 |
| PLAN-FRESH-1-007 | decided: (a) | as PLAN-CORRECTNESS-1-009 |
| PLAN-FRESH-1-008 | fixed | as PLAN-CORRECTNESS-1-011, with the exact file-and-line list in research.md R-12 |
| PLAN-TESTABILITY-1-001 | decided: (a) | research.md R-17 (declaration-level style plants per phase, blocking unless equivalent); contracts/checks.md § Package tests and § Gates run per phase; plan.md Constitution Check VIII, decision 12, phases 2-5, Complexity Tracking; quickstart.md step 8 |
| PLAN-TESTABILITY-1-002 | fixed | research.md R-13 (token-sentinel scenario per element through `driver.rules`); contracts/elements-package.md § Tokens each element reads (the single list); contracts/checks.md; plan.md Constitution Check VIII, phases 2-5 |
| PLAN-TESTABILITY-1-003 | fixed | contracts/checks.md § Pairing plants (rows for US1-5, US1-16, US2-1 `h2` case, US3-7, US4-6 divider, US4-4 container threshold, no other named node, host `aria-label` never written, plus US1-4 other boxes and US3-4 overlap) |
| PLAN-TESTABILITY-1-004 | fixed | spec.md US1-19 and FR-018 (card tree read); research.md R-08, R-13 (card tree, no-event check); contracts/checks.md (plants `role="region"` wrapper and `dispatchEvent`); plan.md Constitution Check I, phases 2-5 |
| PLAN-TESTABILITY-1-005 | fixed | contracts/checks.md § Pairing plants (005's working-tree method replaces the swapped-stylesheet sentence); research.md R-13 |
| PLAN-TESTABILITY-1-006 | fixed | plan.md phase 1 (every driver and command addition listed; AX level, scroll width, deep active element and text boxes red first; plumbing exempt with the reason recorded); research.md R-13; contracts/checks.md § Package tests |
| PLAN-TESTABILITY-1-007 | decided: (b) | spec.md FR-028, FR-038, US3-12, US4-11, operator decisions (axe clause held by the `axe` gate on one story per case, each rendered alone; scenarios read the tree only); research.md R-11, R-14; contracts/checks.md; plan.md decision 7, phases 4 and 5 |
| PLAN-TESTABILITY-1-008 | fixed | research.md R-13 (text-box assertion with clipping ancestors; `overflow: hidden` plus `nowrap` plant); contracts/checks.md § Pairing plants |
| PLAN-TESTABILITY-1-009 | fixed | research.md R-05 (Tests); contracts/checks.md (density removed, header moved, definition order, each with a plant; `entry-card-order.test.ts`); plan.md phase 2 |
| PLAN-TESTABILITY-1-010 | fixed | contracts/checks.md (US4-10 runs the README's orientation example code through a same-origin module; plant: README rewritten to `max-width: N`); plan.md phase 5 |
