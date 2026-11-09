# Spec check 1: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md "Issues" (version of #5: last edited 2026-11-02T13:11:46Z, read 2026-11-03 through the GitHub API); Appendix A (A.1 to A.9: every token, group, light and dark value, derived source, use, excluded tokens, every #5 contrast figure with its theme, intended grounds); FR-001 to FR-003, FR-016, FR-017, SC-001 now refer to Appendix A. Values #5 only describes (light shadows of `elevation-raised`, `elevation-row`, `elevation-seg`; the dialog sizes) are marked "described" and listed in Assumptions as values the plan obtains from the operator. Where #5 gives only a scale step (line heights, weights), the full name is marked as the spec's. |
| SPEC-1-02 | fixed | FR-001 (canonical list: colour, type, space, shape, size, shell, elevation, motion; `measure-*`, `dialog-*`, `footer-h`, `bar-block-narrow` in shell; colour and elevation theme-dependent), FR-008, FR-023, US1 scenario 6, Key Entities, Appendix A group column |
| SPEC-1-03 | fixed | FR-019 (e) per token: `color-chrome` and `color-chrome-hover` relative luminance at most 0.05 in both themes; `color-chrome-ink` and `color-chrome-muted` same value in both themes, covered by required pairs on both chrome grounds (A.8); US1 scenario 8 rewritten |
| SPEC-1-04 | fixed | US3 scenario 5 (empty or unparsable: exit 2; unknown token: exit 1 `unknown token`; missing required pair: exit 1 `missing required pair`); FR-008 and FR-016 (intended grounds recorded per foreground token in the token source; the gate derives the required pairs, A.8, 130 per theme); FR-020 fail plant for a missing required pair |
| SPEC-1-05 | answered | FR-023 (operator, 2026-11-03, "Hold to strict CSP": Storybook output held to constitution IV, inline scripts stripped or externalised, `csp` and `prefix` gate scopes widened, new `csp` plants; if Storybook cannot be built without inline script the phase stops and asks the operator); FR-022; US1 scenario 12; SC-008 |
| SPEC-1-06 | fixed | FR-020 (gates `contrast` and `brand-rules`, the FRs each covers, fail plants per rule (a) to (g)); FR-018 is rule (g) of `brand-rules`; FR-022 |
| SPEC-1-07 | fixed | FR-010 (fail and pass plants under `gates/plants/style-lint/`) |
| SPEC-1-08 | fixed | FR-019 (b) (`color-link` meets 4.5:1 on canvas and sheet in both themes; `color-accent` on `color-canvas` in light listed excluded) |
| SPEC-1-09 | fixed | Edge case "Recorded figure wrong in #5" (correction needs operator approval in review; new-pair figures from first computation); FR-017 (range figures of the state colours); Assumptions |
| SPEC-1-10 | fixed | FR-006 (six conditions, incl. no preference with `data-theme="dark"`; the plan states how no preference is produced); US1 scenario 4, Independent Test, scenario 6, SC-001, Key Entities |
| SPEC-1-11 | fixed | FR-011 (the implementer records the full 40-character commit id and the upstream paths; #5 gives only `d485f61f`, so the spec cannot; stop and ask if it does not resolve to exactly one commit) |
| SPEC-1-12 | fixed | US2 scenario 6 (CSP without `font-src`: fallback font, only the font load blocked) |
| SPEC-1-13 | fixed | FR-007 (motion tokens named; `easing-standard` unchanged under reduced motion); A.5 |
| SPEC-1-14 | fixed | FR-008 (#5 asks for the export "for tools"; consumers here are the two gates and the stories; no external consumer named yet) |
| SPEC-1-15 | fixed | FR-024 (mapping table is documentation, not source, under constitution I; a role count other than 55 stops the phase); Assumptions; US4 Independent Test |
| SPEC-1-16 | fixed | US1 scenario 6 (`--ocelle-target-min` = `2.75rem` example); A.3 |

New open items found while fixing (for the next check and the operator; recorded in Assumptions and A.9): with #5's
values, three required pairs are below 3:1 and #5 gives no reason for them: `color-control-border` on `color-inset`
(light 2.80, dark 2.96) and on `color-hover-bg` (light 2.80), and `color-focus` on `color-chrome-hover` (light 2.71).
The operator decides for each whether it is an excluded pair or a value change. The light shadow values #5 only
describes are also needed from the operator before User Story 1.
