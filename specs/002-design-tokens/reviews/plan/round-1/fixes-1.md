# Squad round 1: fixes 1

Applied from `refute.md` (23 confirmed: 16 fixes, 7 forks with the operator's decisions). No verify file existed yet.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | decided: (a) | spec FR-023, US1 scenario 11, SC-008; plan Summary, Constitution Check IV, Decisions 4 and 6, Complexity Tracking; research R-10 (header, spike records violations by directive); quickstart 2, 5 |
| PLAN-A11Y-SECURITY-1-003 | fixed | spec FR-018, Edge Cases (forced colours); contracts/token-package.md host contract; research R-08, R-15; plan Constitution Check III |
| PLAN-A11Y-SECURITY-1-004 | decided: (b) | spec A.1 (`color-scheme` token), Assumptions ("`color-scheme` hand-off"), US1 scenarios 1-2; research R-02; data-model validation; contracts/token-package.md host contract; plan Summary, Decisions 6 |
| PLAN-A11Y-SECURITY-1-008 | fixed | research R-10 ("No network at build", telemetry test); spec FR-023; plan Constraints, Constitution Check IV, structure; quickstart 1 |
| PLAN-A11Y-SECURITY-1-009 | fixed | research R-03 (CSP violations: `addInitScript` collector, console cross-check, control fixture per suite); plan Constitution Check VIII |
| PLAN-A11Y-SECURITY-1-011 | decided: (a) | spec FR-018; research R-08; contracts/gates.md (rule (g), pass plant `g-system-colour-mapping`); plan Decisions 6 |
| PLAN-A11Y-SECURITY-1-012 | decided: (a) | spec A.8 (rows for `color-current`, `color-link` and `color-focus` on state `-bg`; total 144), US3 scenario 1, FR-016, SC-004; research R-07 (figures); data-model; contracts/gates.md; plan; quickstart 3. Open operator question, not decided: `color-control-border` on the state `-bg` grounds is not added as required; it is 2.91 on `color-neutral-bg` in light. Whether those pairs become required, and if so whether that pair is excluded under #5 rule 1 extended or a value changes, is recorded as open in plan Decisions 7 and spec A.8 |
| PLAN-CORRECTNESS-1-001 | fixed | contracts/gates.md (configuration set, style-lint, `--ocelle-x` plants and tests moved, `repository-values` plants); research R-09; plan structure, Constitution Check VIII, Phases |
| PLAN-CORRECTNESS-1-002 | fixed | research R-03 (global setup writes generator output to a temp dir; build test), R-10 (storybook setup); plan Testing, structure (`.gitignore`); quickstart 1-2 |
| PLAN-CORRECTNESS-1-004 | fixed | research R-08; contracts/gates.md (brand-rules inputs, plant `b-ochre-pair-not-excluded`); data-model Gate findings; spec FR-020, US3 scenario 6 |
| PLAN-CORRECTNESS-1-005 | fixed | contracts/gates.md (`c-extra-radius` uses `radius-4`; validation-first, exit 2 cases, breaking plant `source-invalid`); research R-08 |
| PLAN-CORRECTNESS-1-006 | fixed | spec A.1 (`#211D18`), A.4 (dialog values), A.5 (shadows, ring width), Assumptions ("Values #5 describes", "Light shadows", "Dialog size unit"), FR-016, FR-020, US3 scenario 5, SC-001; plan Decisions 3, 5; research R-05 |
| PLAN-CORRECTNESS-1-007 | fixed | research R-15, R-11 (`files`); plan structure, Phases; contracts/token-package.md; spec Assumptions; quickstart 6 |
| PLAN-CORRECTNESS-1-009 | fixed | data-model (one rule-id form, `ref` as list per theme, JSON export); contracts/gates.md (`<r>` success line); contracts/token-package.md (`ref` full-name form); research R-06 (font-display rationale), R-07, R-12; spec US3 scenario 5, FR-020 |
| PLAN-FRESH-1-001 | decided: (a) | spec FR-023, US1 scenario 12, SC-008; research R-10 (static scope, byte-identity test); contracts/gates.md (csp, prefix); plan Constitution Check IV, Decisions 6, Complexity Tracking |
| PLAN-FRESH-1-004 | fixed | contracts/gates.md (mutation, typecheck, test scope; prefix source scope); research R-10; plan structure, Testing, Phases |
| PLAN-FRESH-1-007 | decided: (a) | spec FR-010, Assumptions ("Element custom properties"); research R-09; data-model (Element name list); contracts/gates.md (style-lint, plant `pass-element-property`); plan Constitution Check II |
| PLAN-FRESH-1-008 | fixed | data-model (Token: `ref`/`grounds` typed `string`, checked by `validateSource`; `TokenName` from names only); research R-01 |
| PLAN-TESTABILITY-1-001 | fixed | research R-03 (transcribed table, name-set equality, A.6 undefined, fixture-source generator tests); data-model (Expected tables); spec SC-001 |
| PLAN-TESTABILITY-1-002 | fixed | research R-07 (`gates/test/contrast-required.test.ts`); data-model (Expected tables); spec SC-004; plan structure; quickstart 2 |
| PLAN-TESTABILITY-1-003 | decided: (a) | data-model (Token, no `use`); research R-01 (use as comments; thin `build.ts` with `buildPlan` and Stryker disables), R-11; spec Key Entities; contracts/token-package.md (no `use`) |
| PLAN-TESTABILITY-1-008 | fixed | research R-03 (font observables: CDP platform fonts, same-origin request, `document.fonts`, computed `font-variant-numeric`, blocked-URI violation); spec US2 scenarios 3-4 |
| PLAN-TESTABILITY-1-009 | fixed | research R-03 (probe elements, no test-side `var()` resolution, reference-form generator test), R-12; spec A.4 note |

Open for the operator (not decided here): the `color-control-border` on state `-bg` question above (plan.md,
Decisions 7).
