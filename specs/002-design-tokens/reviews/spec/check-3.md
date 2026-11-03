---
check: 3
verdict: issues
---

# Spec check 3

Inputs read: `specs/002-design-tokens/spec.md`, `checklists/requirements.md`, `.specify/memory/constitution.md` v1.3.1,
`reviews/spec/check-1.md`, `check-1-fixes.md`, `check-2.md`, `check-2-fixes.md`, `gates/README.md`.

Earlier check: check 2 had no blocking finding. Its three operator findings are answered and recorded as the fix note
says: SPEC-2-01 in A.1 (light `color-chrome-hover` to be computed by the plan), A.7 rule 1 extended, A.8
(`color-control-border` 6 grounds, `color-accent-strong` 3 grounds, total 130), A.9, FR-016 and Assumptions;
SPEC-2-02 in Assumptions "Light shadows and ring width from the prototype file", A.5 note, FR-026 and SC-001;
SPEC-2-03 in FR-019 (c) (closed set of five radii), A.3 named uses and Assumptions "Radius tokens". The notes
SPEC-2-04 to SPEC-2-12 are addressed where the fix note says.

Appendix A recomputed for this check with the WCAG 2.x formula: A.8 enumerates to 130 pairs per theme; with the
excluded pairs the list has 134 light and 133 dark entries; the only required pairs below threshold are the
threshold-exempt `color-disabled-ink` pairs and `color-focus` on the light `color-chrome-hover` (#5's `#2A261F`,
2.71), exactly as A.9 states. Every A.9 figure matches (`color-accent-strong` 4.31, 4.11, 4.11 light and 6.13, 6.28,
6.74 dark; `color-control-border` 2.94, 2.80, 2.80 light and 2.88, 2.95, 3.17 dark). The state colours on their own
backgrounds lie in 5.34 to 9.42, within FR-017's [5.25, 9.45). The light `color-chrome-hover` is feasible: with the
example measure of the Assumptions (same hue and saturation as `#2A261F`, highest lightness meeting 3:1) it computes
to about `#211D18` (`color-focus` 3.01, luminance 0.013, `color-chrome-ink` 13.8, `color-chrome-muted` 6.22), so
FR-019 (e) and the chrome text pairs hold.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | operator | FR-023 ("held to the strict CSP of constitution IV with no exception"); US1 scenario 12; SC-008; constitution IV ("Built output runs under ... with no exception") | The spec turns the operator's "Hold to strict CSP" (SPEC-1-05) into a static check only: no inline script, inline style element or style attribute in the built files, scanned by the `csp` gate. Constitution IV is about running under the CSP. Storybook's manager and preview UI inject `<style>` elements at run time (its CSS-in-JS theming), and `style-src 'self'` blocks those. So a Storybook that passes the widened static gate may still not render correctly when served with the constitution's CSP header. The spec does not say whether Storybook must also run under that header with no CSP violation. That decides what gets built: a static-scan pass, or a run-time-clean Storybook that may need a custom manager or may not be possible under the pinned versions. FR-023's stop-and-ask rule covers inline script at build time only, not style injected at run time. | The operator answers the question below. Then FR-023, US1 scenario 12 and SC-008 state either (a) a browser test that serves the built Storybook with the constitution's CSP header and asserts zero CSP violations, with a stop-and-ask rule if run-time style injection cannot be removed, or (b) that only the static `csp` gate applies here and run-time CSP compliance of Storybook moves to #10, recorded in the plan's Complexity Tracking with the operator's approval. |
| SPEC-3-02 | note | FR-016 ("a required pair present in the list as an excluded pair with a non-empty reason is not a `missing required pair`"); SC-005 | Since SPEC-2-01, A.8 no longer contains any pair that the operator excluded: `color-control-border` on `color-accent-low`, `color-inset` and `color-hover-bg` are left out of its intended grounds. So no listed pair uses this clause any more. What the clause does now is let any required pair be switched off by moving it to "excluded" with any non-empty reason. The gate then still passes on a token change that drops a required pair below threshold, as long as the same pull request also edits the pair list. That weakens SC-005 and the "the pair list cannot shrink it" rule, and only review can catch it. | Remove the clause, or limit exclusions to pairs not in the required set (A.8) and give the gate a finding (for example `required pair excluded`) and a fail plant for it. Then excluding a required pair would mean changing the intended grounds in the token source, which is a visible design change. |
| SPEC-3-03 | note | Assumptions "Pairs below threshold" (measure of "nearest"); A.1 `color-chrome-hover` | With the example measure, the light `color-chrome-hover` comes out at about `#211D18`, which is 1.11:1 against `color-chrome` (`#15130F`); #5's `#2A261F` was 1.23:1. The hover state on the chrome would be barely visible, and no requirement or brand rule covers it. This is not a WCAG failure, since hover feedback needs no contrast, but it is a design consequence of the operator's decision that the spec does not mention. | Have the plan report the hover-to-chrome ratio of the value it computes beside the value itself, so the operator sees it at the plan review. Optionally allow a measure that keeps the hover visible, such as a hue change. |
| SPEC-3-04 | note | Assumptions "Values #5 describes but does not give" (last sentence) versus "Light shadows and ring width from the prototype file", A.5 note, SC-001 | The first bullet still says the tests check only the "described structure (number of shadows, ring colour, dark values ...)" for the light shadows. Since SPEC-2-02 the exact values come from the prototype file, and SC-001 requires the exact Appendix A value. The two bullets give different test oracles for the same tokens. | Limit the "described structure" sentence to the dialog sizes, and state that the light shadows and the ring width are tested against the exact values the plan records. |

## Operator question

SPEC-3-01: "FR-023 holds the built Storybook to constitution IV's strict CSP, and the spec checks this with a static
scan of the built files (no inline script, style element or style attribute). Storybook's own UI injects `<style>`
elements at run time, which `style-src 'self'` blocks, so a Storybook that passes the scan may not render when it is
actually served with the CSP header. Must the Storybook also run under the constitution's CSP header with zero CSP
violations, checked by a browser test (and if run-time style injection cannot be removed under the pinned versions,
the phase stops and asks you)? Or is the static scan enough for this feature, with run-time CSP compliance of
Storybook left to #10 and recorded in Complexity Tracking?"
