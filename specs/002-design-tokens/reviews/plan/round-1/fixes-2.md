# Squad round 1: fixes 2

Applied from `verify-1.md` (2 unresolved rows), plus the operator's answer of 2026-11-03 to the open question that
fixes 1 left in plan.md Decisions 7 under PLAN-A11Y-SECURITY-1-012 (a): "Rule 1 extended". Figures recomputed with
the WCAG 2.x formula from Appendix A's values: `color-accent-strong` on `color-danger-bg`, `-warning-bg`,
`-success-bg`, `-info-bg`, `-neutral-bg` is 4.47, 4.50, 4.70, 4.71, 4.27 light and 7.56, 6.83, 7.23, 7.37, 6.74 dark;
`color-control-border` on them is 3.05, 3.07, 3.21, 3.21, 2.91 light and 3.56, 3.21, 3.40, 3.46, 3.17 dark.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-004 | fixed | research R-02 (`color-scheme` compared as a keyword), R-03 (excepted from RGBA parsing; compared as the trimmed keyword), R-10 (no swatch, value shown as text); data-model § Expected tables (comparison kind `keyword`); spec Assumptions ("`color-scheme` hand-off": keyword, colour-value rules do not apply); contracts/token-package.md (keyword in the colour group) |
| PLAN-CORRECTNESS-1-002 | fixed | research R-03 (served files generated in each browser suite's `beforeAll` inside the worker through `test/browser/serve.ts`, no `globalSetup`, with the Stryker vitest-runner reason; sentence about mutants corrected; Stryker-report check in the US1 review), R-10 (stories and `swatches.ts` import the token source by relative path, not the package `exports`; pre-build writes the preview's token stylesheet from `css()`, the swatch stylesheet and fonts into git-ignored `storybook/.generated/`; why the `storybook` project keeps a global setup and which tests kill its mutants); plan Technical Context (Testing), structure (`serve.ts`, `swatches.ts`, `.gitignore`), Phases US1; contracts/gates.md (test scope); quickstart 2 |
| PLAN-A11Y-SECURITY-1-012 | decided: (a) | Open question closed by the operator ("Rule 1 extended"): spec A.7 (rule 1 extended again), A.8 (`color-accent-strong` on the five state `-bg` grounds; total 149), A.8 notes, A.9 (`color-control-border` on the state `-bg` grounds excluded in both themes), FR-016, US3 scenario 1, SC-004, Assumptions ("Pairs below threshold"); research R-07 (figures, 158/157/149); data-model (required pair set, Expected tables); contracts/gates.md (success line), contracts/token-package.md (rendered brand rules); plan Summary, Scale/Scope, Constitution Check III, Decisions 6 and 7; quickstart 3 |
