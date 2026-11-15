# Spec check 1, fixes

Operator answers: human:jeroennouwsdev, 2026-11-15, recorded in `spec.md` under "Operator decisions after spec
check 1".

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | answered: (a) `ocelle-pill-tag-activate` on the terms of 012's `ocelle-button-activate` (beside the native `click`, bubbles, composed, cancelable, `detail` `{}`, none on modifier link clicks), in both modes; supersedes "native click only"; `aria-pressed` passthrough stays | Operator decisions; US4-3, US4-5; FR-005, FR-031; Key Entities; SC-005 |
| SPEC-1-02 | answered: (a) the pulse runs a fixed iteration count from motion tokens, ends within 5 s, the dot stays solid; restarts only when `pulse` goes from absent to present | Operator decisions; US1-4; FR-012, FR-041; SC-004 |
| SPEC-1-03 | answered: (a) the interactive compact pill has a 24 px minimum block size from a token, block padding at least 4 px; US3-4's exact 4 px is for the static pill only | Operator decisions; US3-4, US4-7; FR-029, FR-032, FR-043 (new) |
| SPEC-1-04 | answered: (a) every `ocelle-pill-tag` variant and mode counts as a state pill for constitution II; FR-003 kept | Operator decisions; Terms ("State pill"); FR-003 |
| SPEC-1-05 | answered: (b) SC-001 reworded to the attributes and slots listed under Consumers, checked by a test; the full inventory is left to kitty-mission-ui's migration | Operator decisions; SC-001; Assumptions (last item) |
| SPEC-1-06 | fixed: what is shared with #9 is the five values and the `--ocelle-color-<value>` / `-bg` pairs; the default and fallback are per element (`neutral` here, `info` on the notice), and each element's use of the pair is its own; an unknown value stays in the attribute as written while the property reads `"neutral"` | Terms ("Status vocabulary"); FR-002; Key Entities; Assumptions (first item) |
| SPEC-1-07 | fixed: `label` added to the pill's interface (string, trimmed, not reflected, as 012 FR-013), naming the inner control in FR-006's precedence; it does not change the visible or tooltip text; no effect on a static pill | FR-025; Edge Cases (items 1, 2, 3) |
| SPEC-1-08 | fixed: FR-005 and SC-006 list events (with `detail` type), methods, custom states and the moved attributes with their `data-ocelle-moved-*` mirrors; the pill's custom states are `pressed` (button mode) and `current` (link mode) and no other; the indicator and metric declare none | FR-005, FR-031; SC-006 |
| SPEC-1-09 | fixed: a disabled interactive pill never truncates; it wraps like a static pill and its tooltip stays disabled, so its full text is visible without a trigger; SC-005 narrowed to enabled pills for keyboard reach, with the disabled case stated | US5-6 (new), US5 Independent Test; FR-033; Edge Cases; SC-005 |
| SPEC-1-12 | fixed: the badge border is `--ocelle-border-width` | US3-3; FR-028 |
| SPEC-1-14 | fixed: edge case reworded as the finding proposes | Edge Cases |
