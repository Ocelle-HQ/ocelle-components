# Spec check 2: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-2-01 | answered | Operator, 2026-11-03. `color-control-border` on `color-inset` and `color-hover-bg` ("Rule like accent-low"): A.7 note (rule 1 extended), A.8 (`color-control-border` 6 grounds; `color-accent-strong` on `color-accent-low`, `color-inset`, `color-hover-bg`, 3; total stays 130), A.9 (excluded in both themes; `color-accent-strong` on them 4.11 light, 6.28 / 6.74 dark), FR-016 (excluded pairs listed). `color-focus` on `color-chrome-hover` ("Change chrome-hover"): A.1 (light value changed, computed by the plan), Assumptions "Pairs below threshold" (nearest value to `#2A261F` with `color-focus` at least 3:1, plan states its measure and records value and reason, FR-019 (e) and chrome-ink/muted 4.5:1 kept; #5's 5.6 for `color-chrome-muted` on `color-chrome-hover` in light superseded, recorded from first computation), A.7, A.9, SC-001 |
| SPEC-2-02 | answered | Operator, 2026-11-03 ("Prototype file"). Assumptions "Light shadows and ring width from the prototype file" (values only from the operator's `prototype/css/tokens.css`, console prototype v2, not yet in the repository; plan records values, file and checksum; stop and ask if missing), A.5 note, FR-026, SC-001 |
| SPEC-2-03 | answered | Operator, 2026-11-03 ("Keep both, named use"). FR-019 (c) restated as the closed set `radius-1` 2px, `radius-2` 4px, `radius-row` 6px, `radius-shell` 10px, `radius-pill` 999px (any other, missing or changed radius fails); A.3 named uses; Assumptions "Radius tokens" (reading of constitution II recorded in the plan's Constitution Check); US3 scenario 6 |
| SPEC-2-04 | fixed | A.9 row `color-control-border` on `color-inset`: dark 2.95 |
| SPEC-2-05 | fixed | FR-016 (excluded pairs count as checked; a required pair present as excluded with a reason is not missing), US3 scenario 1 and A.8 (134 light, 133 dark entries), SC-004 |
| SPEC-2-06 | fixed | FR-023 (Storybook UI theme uses the token fonts; a monospace declaration it cannot remove stops the phase and asks the operator) |
| SPEC-2-07 | fixed | US3 scenario 3 ("changed so that it is below 3:1"; 3.02 today) |
| SPEC-2-08 | fixed | US3 scenarios 7 and 8 (both gates; their checks; widened `csp` and `prefix` scopes) |
| SPEC-2-09 | fixed | Edge case "Ratio just below a threshold" (3.02 example dropped, 2.995 kept) |
| SPEC-2-10 | fixed | Assumptions "Dialog size unit" and A.4 note (the plan fixes the viewport unit) |
| SPEC-2-11 | fixed | FR-026 (no testable behaviour, constitution VIII exemption; shown by review: values traced to Appendix A or the recorded prototype file, font to its checksum) |
| SPEC-2-12 | fixed | US1 scenario 2 ("every colour and elevation token") |
