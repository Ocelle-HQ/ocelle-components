---
check: 2
verdict: issues
---

# Spec check 2

Inputs read: `specs/002-design-tokens/spec.md`, `checklists/requirements.md`, `.specify/memory/constitution.md` v1.3.1,
`reviews/spec/check-1.md`, `reviews/spec/check-1-fixes.md`, `gates/gates.json`, `gates/bin/prefix.ts`.

Earlier check: the four blocking findings of check 1 (SPEC-1-01 to SPEC-1-04) are resolved as the fix note says
(Appendix A in the spec with the version of #5; one canonical group list in FR-001, FR-008, FR-023, US1 scenario 6
and Key Entities; FR-019 (e) per token with US1 scenario 8 rewritten; US3 scenario 5 with one outcome per input and
the required pair set derived from the token source). The operator answer to SPEC-1-05 is recorded in FR-023. The
notes SPEC-1-06 to SPEC-1-16 are addressed where the fix note says.

Appendix A recomputed for this check with the WCAG 2.x formula: the 130 required pairs of A.8 per theme enumerate
as stated; the pairs below threshold are exactly those of A.9; every #5 figure of A.7 matches its computed light (or
marked) value at the figure's precision; FR-019 (b), (d) and (e) hold on Appendix A's values (chrome luminance
0.004 to 0.020; `color-rule`/`color-rule-strong` 1.29 to 2.04 on canvas and sheet; `color-control-border` 3.28 to
3.90 on them; `color-link` 5.47 to 8.30 on them).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | operator | Assumptions "Pairs below threshold"; A.9 rows 3-5; FR-016 | Three required pairs are below 3:1 with Appendix A's values and #5 gives no reason: `color-control-border` on `color-inset` (light 2.80, dark 2.95) and on `color-hover-bg` (light 2.80), `color-focus` on `color-chrome-hover` (light 2.71). The spec defers the choice (excluded pair or value change) to the operator "before the pair list is written". Until answered, the `contrast` gate cannot pass on the repository (US3 scenario 1, SC-004) and A.8's "intended grounds" for these tokens may be wrong. | Operator answers the question below; record the answer in A.8/A.9 (and Appendix A values if changed). |
| SPEC-2-02 | operator | Assumptions "Values #5 describes but does not give"; A.4, A.5 note | The light shadows of `elevation-raised`, `elevation-row`, `elevation-seg` and the ring width of `elevation-row`/`elevation-seg` are not in the repository; FR-002 and SC-001 ("100% of the tokens ... with their Appendix A value") cannot be tested for them until they are. The spec routes this to the operator through the plan; it remains open. | Operator gives the values; add them to A.5. |
| SPEC-2-03 | operator | Constitution II ("One radius (`--ocelle-radius-2`, 4 px); rows and cards use `--ocelle-radius-row`; the pill radius is for state pills only"); A.3 `radius-1` 2px, `radius-shell` 10px; FR-019 (c) | Appendix A has five radius tokens. Constitution II names one radius plus the row and pill radii; `radius-1` and `radius-shell` are not mentioned. FR-019 (c) only checks that exactly one radius token is 4 px, so it would pass any number of further radii and does not enforce "one radius" in the constitution's sense. Whether `radius-1` and `radius-shell` are allowed under II is a design decision. | Operator answers the question below; then either restate FR-019 (c) as the closed set of radius tokens with their values (failing on any other radius token) or drop the two tokens from Appendix A (A.6). |
| SPEC-2-04 | note | A.9 row 3 | `color-control-border` on `color-inset` in dark computes to 2.9545, which rounds to 2.95, not 2.96. A figure of 2.96 recorded from this table would fail FR-017's precision match ([2.955, 2.965)). | Correct to 2.95, or rely on "the gate's own computation decides" and record dark figures from first computation as FR-017 says. |
| SPEC-2-05 | note | FR-016; FR-021; SC-004; US3 scenarios 1 and 5 | Whether excluded pairs count among the "pairs checked" the gate reports, and whether a required pair (A.8) that the operator decides to exclude (SPEC-2-01) satisfies the `missing required pair` rule when listed as excluded, is not stated. The per-theme counts differ (with the two #5 exclusions the list has 132 light and 131 dark entries). | State that excluded pairs are counted as checked, and that a required pair present as excluded with a reason is not missing. |
| SPEC-2-06 | note | FR-023; FR-022; US1 scenario 12; SC-008 | FR-023 widens the `prefix` gate to the Storybook build output. That output contains Storybook's own manager and preview code and CSS; the prefix gate (`gates/bin/prefix.ts`) flags any monospace family in a CSS `font`/`font-family` declaration in `.js`, `.css`, `.html` files. If Storybook's built UI carries such a declaration, the gate fails on third-party code. FR-023 gives a stop-and-ask for inline script but none for this case. | Add the same stop rule for the `prefix` gate on Storybook output (or state that Storybook's theme is set so its UI uses the token fonts). |
| SPEC-2-07 | note | US3 scenario 3 | "a non-text pair below 3:1 (for example `color-control-border` on `color-rail` in light)" reads as if that pair is below 3:1 today; it is 3.02 (A.7). The scenario means a planted change. | Say "changed so that it is below 3:1", as scenario 2 does. |
| SPEC-2-08 | note | US3 scenarios 7 and 8; SC-007 | Scenario 7 says "the new gate" (singular) and scenario 8 checks only the contrast gate in "The gates" and "Required checks"; FR-020 and FR-022 add two gates (`contrast`, `brand-rules`), and the widened `csp`/`prefix` scopes of FR-022 have no scenario. | Name both gates in scenarios 7 and 8 and add the scope records to scenario 8. |
| SPEC-2-09 | note | Edge case "Ratio exactly on a threshold" | The example "3.02 rounding to 3.0" is a ratio above the threshold that passes; it does not illustrate the rule, which the 2.995 example does. | Drop the 3.02 example or replace it with one below the threshold. |
| SPEC-2-10 | note | A.4 `dialog-max-inline`, `dialog-max-block`; Assumptions | "The viewport's inline size minus two `gutter`" leaves the unit open (`100vw`, `100dvw`, `100svw`, or the containing block), which gives different values at a known viewport with scrollbars or dynamic toolbars; the tests "check ... the dialog sizes at a known viewport". | Let the plan fix the unit, or state it here. |
| SPEC-2-11 | note | FR-026 | "No value, name or asset is copied from the Spec Kitty design library" has no failing test; it is a review check (the prefix gate covers names only). Principle VIII allows this for a non-behaviour, but the spec does not say how it is shown. | State that FR-026 is shown by review (values traced to Appendix A, font to its upstream checksum). |
| SPEC-2-12 | note | US1 scenario 2 | "every colour, elevation and other theme-dependent token": FR-001 says colour and elevation are the only theme-dependent groups, so "other" suggests a third kind. | Write "every colour and elevation token". |

## Operator questions

SPEC-2-01: "With Appendix A's values, three required pairs are below 3:1 and #5 gives no reason for them:
`color-control-border` on `color-inset` (light 2.80, dark 2.95), `color-control-border` on `color-hover-bg` (light
2.80), and `color-focus` on `color-chrome-hover` (light 2.71). For each: is it an excluded pair (and with what
reason: the design never draws a control border on that ground, or a focus ring on hovered chrome), or should a
token value change (which one, to what)?"

SPEC-2-02: "#5 describes but does not give the light shadow of `elevation-raised` ("two soft shadows") and the light
shadows of `elevation-row` and `elevation-seg`, nor the ring width of `elevation-row` and `elevation-seg`. What are
the exact values (offsets, blur, spread, colour; ring width)?"

SPEC-2-03: "Constitution II says 'One radius (`--ocelle-radius-2`, 4 px); rows and cards use `--ocelle-radius-row`;
the pill radius is for state pills only'. #5 also defines `radius-1` (2 px) and `radius-shell` (10 px). Are these
two tokens allowed under II (and if so, for what use, so the brand-rule check can test a closed set of radii), or
should they be dropped like `radius-3`?"
