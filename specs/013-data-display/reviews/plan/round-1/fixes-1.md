# Squad round 1: fixes 1

Fix pass 1 of batch 1. Every confirmed fix of `refute.md` is applied, and every fork follows the operator's Decision
(2026-11-13, human:jeroennouwsdev). Duplicates are covered by the finding they point to.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | decided: (a) | spec FR-033, US3-4, US3-12, operator decisions; research R-06 § Indeterminate, R-10 (iteration count); data-model § `ocelle-progress` States; contracts/checks.md § Oracles (bounded sweep), CSS-only behaviours; contracts/elements.md README sections; plan Summary, Constitution Check III |
| PLAN-A11Y-SECURITY-1-002 | decided: (a) | spec FR-036, US3-13, operator decisions; research R-06 § Track (boundary, `ground="tinted"`), § Contrast; data-model and contracts/elements.md (`ground`); contracts/checks.md (tinted body, plant, pairing test); plan Decision 4, Constitution Check III; covers PLAN-FRESH-1-008 |
| PLAN-A11Y-SECURITY-1-003 | fixed | spec FR-003, Edge Cases; research R-01 § Which children are pairs, § Consequences (observer filter); data-model § `ocelle-fact`, § `ocelle-facts`; contracts/elements.md (slot, `label` part, README); contracts/checks.md § Extra scenario bodies; covers PLAN-CORRECTNESS-1-010, PLAN-FRESH-1-003 |
| PLAN-A11Y-SECURITY-1-004 | fixed | research R-02 § Probes, § Zero block size; data-model (hook rule); contracts/elements.md (hook description); contracts/checks.md (hook bodies, probe overflow plant) |
| PLAN-A11Y-SECURITY-1-005 | fixed | research R-05 § Costs of B3, R-08 § Story test; contracts/checks.md § Story test; contracts/elements.md README sections; plan Constitution Check III |
| PLAN-A11Y-SECURITY-1-006 | fixed | research R-06 § Forced colours; contracts/checks.md § Oracles (US3-8), CSS-only behaviours |
| PLAN-CORRECTNESS-1-001 | decided: (a) | research R-10 (new), R-03 § Columns, R-06 § Indeterminate; contracts/checks.md § Gates touched; plan Constitution Check II, Workflow gates, Source Code, Phases 1 and 3, Decision 7 |
| PLAN-CORRECTNESS-1-002 | decided: (b) | spec FR-006, FR-008, US1-9, Issues, operator decisions; research R-03 § Type, § Compact, § Upstream issues, R-07; data-model and contracts/elements.md (two value hooks, `density`); contracts/checks.md (compact-region bodies, styles tests); plan Decision 5 (corrected; read-only fetch of #280, #498, #510, #523 requested); covers PLAN-FRESH-1-002 |
| PLAN-CORRECTNESS-1-003 | decided: (a) | spec FR-005, FR-009, Edge Cases, operator decisions; research R-02 § Decision, § Alternatives (flex-wrap rejection corrected); data-model § `ocelle-facts`; contracts/checks.md (short sheet in a dialog, widen after stack); plan Summary, Decision 2, phase 1 spike; covers PLAN-FRESH-1-001 |
| PLAN-CORRECTNESS-1-004 | fixed | research R-06 § Fill (Direction), § Indeterminate (RTL keyframes, no `scale`); spec Edge Cases (Right-to-left); contracts/checks.md (RTL indeterminate body, plant) |
| PLAN-CORRECTNESS-1-005 | fixed | research R-06 § Leaving the determinate state; data-model § Rendered fill; contracts/checks.md (value-removed body) |
| PLAN-CORRECTNESS-1-006 | fixed | research R-06 § Track (`overflow: clip`); spec Edge Cases; contracts/checks.md (320 px sweep body, clip-removed plant, per PLAN-FRESH-1-004) |
| PLAN-CORRECTNESS-1-007 | decided: (b) | research R-06 § Contrast, R-07; contracts/checks.md § Contrast; plan Summary, Scale/Scope, Constitution Check VII, Source Code, phase 3 (no rows, `@ocelle/tokens` unchanged); covers PLAN-FRESH-1-007 |
| PLAN-CORRECTNESS-1-008 | fixed | contracts/checks.md § Contrast: with (b) of PLAN-CORRECTNESS-1-007 no `gates/bin/contrast.ts` or `source.ts` comment changes in any commit, so nothing outside the test path is in a red commit |
| PLAN-CORRECTNESS-1-009 | fixed | spec FR-023, US2-5; research R-04 § Present parts, § Gaps between present parts (table for every adjacent pair); data-model § `ocelle-empty-state`; contracts/checks.md (present-parts bodies, plant); covers PLAN-FRESH-1-006 |
| PLAN-CORRECTNESS-1-011 | decided: (a) | contracts/elements.md (Defaults, every table); data-model (types and effective defaults); research R-01, R-05; contracts/checks.md (unset properties write no attribute); plan Constitution Check I |
| PLAN-CORRECTNESS-1-012 | decided: (a) | spec FR-056, operator decisions; research R-01 § Module dependency; contracts/elements.md § Modules and exports, README sections; plan phase 1 (readme statement, build test) |
| PLAN-CORRECTNESS-1-013 | fixed | research R-08 § Reduced motion; contracts/checks.md § Driver additions; plan Technical Context, Source Code; covers PLAN-TESTABILITY-1-007 |
| PLAN-CORRECTNESS-1-014 | decided: (b) | spec operator decisions; research header, R-01 § Recheck in phase 1's spike; plan Decision 1, Constitution Check VIII, phase 1 spike; covers PLAN-TESTABILITY-1-011 |
| PLAN-CORRECTNESS-1-015 | fixed | research R-06 § Labelled variant (figures on the label), R-05 (`ariaValueMax` effective max), R-03 § Wrap policy (on the value's slot); contracts/checks.md § Contrast (pairing test split into `test/node` and `test/build`), standalone wrap body; plan Source Code |
| PLAN-FRESH-1-005 | decided: (a) | spec FR-021, US2-7, operator decisions; research R-04 § A progress bar in `visual`; data-model and contracts/elements.md (`visual` slot); contracts/checks.md (plant); plan phase 3 |
| PLAN-FRESH-1-009 | decided: (a) | spec FR-012 (new), Scope, Edge Cases, operator decisions; research R-01 § Before upgrade, R-07; data-model § `ocelle-fact`; contracts/elements.md README sections (Builds correction); contracts/checks.md § `@ocelle/styles` tests; plan Source Code, phase 1 |
| PLAN-TESTABILITY-1-001 | fixed | contracts/checks.md § Scaffold, § Red per body; plan Phases (scaffold in phases 1 to 3), Constitution Check VIII |
| PLAN-TESTABILITY-1-002 | fixed | contracts/checks.md § Bodies that the platform alone could pass, § Red per body; plan phase 2 red |
| PLAN-TESTABILITY-1-003 | fixed | research R-02 § When the layout is read; contracts/checks.md § Oracles (layout settle), Driver additions (`layout`); plan phase 1 spike |
| PLAN-TESTABILITY-1-004 | fixed | contracts/checks.md § Oracles (flat-tree structure assertion; `<dl><slot>` plant named against it; axe not run in the harness) |
| PLAN-TESTABILITY-1-005 | fixed | contracts/checks.md § Oracles (each definition is its own value; reversed-assignment plant) |
| PLAN-TESTABILITY-1-006 | fixed | research R-05 § Reading the value properties, § Measuring `valuetext` (internals fallback dropped; US3-3 to the operator if no platform oracle); contracts/checks.md § Oracles, Driver additions; plan phase 3 spike |
| PLAN-TESTABILITY-1-008 | fixed | research R-08 § Mutation (claim corrected); contracts/checks.md § CSS-only behaviours (plant or reason for each) |
| PLAN-TESTABILITY-1-009 | fixed | research R-06 § Reduced motion; contracts/checks.md § Oracles (US3-5 against running animations; still-mark plant; `animation: none` recorded as equivalent) |
| PLAN-TESTABILITY-1-010 | fixed | research R-08 § Story test; contracts/checks.md § Story test; quickstart step 6 |
| PLAN-TESTABILITY-1-012 | fixed | contracts/checks.md § Oracles (copy oracle, paired with US1-3, U+200B plant), Driver additions (`copy`) |
| PLAN-TESTABILITY-1-013 | fixed | contracts/checks.md § Driver additions; research R-08; plan Technical Context, Scale/Scope (9 driver additions), Source Code |
| PLAN-TESTABILITY-1-014 | fixed | research R-01 § Consequences; data-model § Placement; contracts/checks.md (move body), Driver additions (`move`) |
