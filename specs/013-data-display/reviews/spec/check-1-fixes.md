# Spec check 1: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | FR-005 states the behaviour (switch on the element's own inline size, threshold above 320 px); FR-009 states the inline size in a shrink-to-fit host (never 0, at least min(available space, widest label or value's max-content size)) and moves the container-query mechanism to the plan's research, naming the inline-size containment collapse finding it must measure; Edge Cases "Facts inside a shrink-to-fit host" |
| SPEC-1-02 | fixed | US3 scenario 7 and FR-036 both say "against the track and against the ground"; the `accent-strong` mark is required in light mode on every variant (determinate, indeterminate, reduced-motion still mark); visible text may be added but replaces the mark and waives the 3:1 rule for no variant |
| SPEC-1-03 | fixed | US3 scenario 11 (browser test only, no story); FR-050 names the exception; SC-003 notes it |
| SPEC-1-04 | answered | Operator answer "D: decide after measuring" (2026-11-13, human:jeroennouwsdev): recorded in Operator decisions; FR-004 keeps the description list (with no serious axe finding incl. `definition-list`/`dlitem`) as the target, the plan's research measures it with `ocelle-fact` children, and the operator confirms or replaces FR-004 before tasks; US1 scenario 6 references this |
| SPEC-1-05 | fixed | FR-002: "An element MUST NOT require or document a `class` attribute for its look." |
| SPEC-1-06 | fixed | Requirements heading "Common to the four elements" with a note; FR-050 (`ocelle-fact` stories live in the facts stories file), FR-054 (own manifest entry, documented in the facts README section), FR-057, SC-003 to SC-007 say four; Edge Cases for `ocelle-fact` outside `ocelle-facts` and for non-`ocelle-fact` children |
| SPEC-1-07 | fixed | FR-003 states the missing-half rule (empty label box and empty term; empty value box and empty definition); new US1 scenario 10; Edge Case reworded |
| SPEC-1-08 | fixed | FR-021 says neither empty-state variant paints a ground; US1 scenario 8 and US2 scenario 8 check contrast on the main grounds the tokens declare and, in forced colours, assert system text colours that are not transparent |
| SPEC-1-09 | fixed | US2 scenario 7 cites FR-021/FR-022; FR-021 names the visual-to-heading, heading-to-body and body-to-actions gaps, and FR-022 makes each larger in the panel variant |
| SPEC-1-10 | fixed | FR-032: empty or whitespace-only `value` is absent (indeterminate); removing the attribute or setting the property to `null`/`undefined` returns to indeterminate |
| SPEC-1-11 | fixed | FR-033 allows a new loop-period motion token under FR-040 (resolving to no motion under reduced motion) and separates the determinate bar, the indeterminate bar (loading with no known end) and the status indicator (a state); Scope bullet updated |
| SPEC-1-12 | fixed | Issues paragraph requires the plan's research to read #280, #498, #510, #523, #531, #535 read-only; FR-008's #531 clause now depends on that reading |
| SPEC-1-13 | fixed | SC-001 is a README mapping (new FR-058) checked in review, with the kitty-mission-ui replacement an outcome not gated here; SC-003 says what the fallback proves and that axe runs when #10 lands; SC-006 reworded to "no surviving mutant ... except recorded equivalents" |
| SPEC-1-14 | fixed | Edge Cases for long empty-state text and a long progress label beside a compact bar at 320 px; FR-005 states the label column sizing (widest label, capped at a plan-set share of no more than half) and Edge Case "Very long label" refers to it |
| SPEC-1-15 | fixed | FR-005 requires the threshold to be above 320 px; US1 scenario 3 runs below the threshold and asserts the single column's width |
