---
check: 2
verdict: clean
---

# Spec check 2

Inputs read: `specs/008-overlays/spec.md` (as of `cb531f3`), `checklists/requirements.md`,
`.specify/memory/constitution.md`, `reviews/spec/check-1.md` and `reviews/spec/check-1-fixes.md`. No
`[NEEDS CLARIFICATION]` marker is left.

## Earlier checks

| Check 1 finding | Fix note says | State in spec |
|-----------------|---------------|---------------|
| SPEC-1-01 (blocking) | fixed: `describes` boolean, no name comparison | Resolved. FR-030 and FR-036 add `describes` (default false), and the element compares no names. US3 scenarios 7 and 11 can fail on both values, and FR-044 covers them. |
| SPEC-1-02 (blocking) | fixed: one `:focus-visible` condition | Resolved. FR-031 defines keyboard focus once, and FR-032 and FR-033 use that definition. US3 scenario 10 (tap) and scenario 12 (clicked trigger the pointer leaves) state one outcome each. |
| SPEC-1-03 (blocking) | fixed: FR-047, US3 scenario 13, SC-007 | Resolved. No `style` attribute or `<style>` element may be written, and values pass only through adopted stylesheets. US3 scenario 13 asserts this after every placement, and SC-007 counts it. |
| SPEC-1-04 (operator) | answered: `heading-hidden` on the drawer | Resolved. The decision is recorded. FR-005 and FR-048 now apply, US2 scenario 6 is added, and FR-042 and FR-044 include it. |
| SPEC-1-10 (note) | — | Resolved by the fixes. US3 scenario 10 now reads "no bubble shows". |

## Findings

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | note | spec.md FR-036, US3 scenario 7 | "The bubble has role `tooltip`" is stated without condition. Without `describes`, however, the text is "not exposed to assistive technology beyond the trigger's own name". A shown `role="tooltip"` node with the text in it is itself an accessibility-tree node carrying that text, so the two clauses can only both hold if the bubble is kept out of the tree in that mode. Scenario 7 ("exposed once") would catch a wrong build, but the rule as written misleads the plan. | Say what the tree holds in each mode. For example: without `describes` the bubble is not in the accessibility tree; with `describes` it is a `tooltip` node and the trigger's description. |
| SPEC-2-02 | note | spec.md FR-032 vs FR-033 | FR-032 says the bubble MUST stay while the trigger has keyboard focus. FR-033 says Escape hides it while focus stays. FR-033 is meant as the exception, but FR-032 does not say so. | Add "unless dismissed by Escape (FR-033)" to FR-032. |
| SPEC-2-03 | note | spec.md FR-031, US3 scenario 12 | A trigger focused by a click can start matching `:focus-visible` later without focus moving, because engines switch on a later keypress (for example Space to activate it again). The spec does not say whether that change of match shows the bubble. FR-031 says "receives keyboard focus", which a test could read either way. | State it. For example: only focus arriving while it matches `:focus-visible` shows the bubble; a later change of match does not. Or the reverse. |
| SPEC-2-04 | note | spec.md FR-047 placement, US1, US2 | FR-047 is labelled "all three elements" but sits under "Shared overlay rules (dialog and drawer)". It also says "the overlay scenarios assert it after open and close", yet no US1 or US2 scenario states that assertion. Only SC-007 does. | Move FR-047 to its own heading, or to the tokens and engines group. Add the open and close assertion to a US1 scenario, and make US2 scenario 5 include it. |
| SPEC-2-05 | note | spec.md FR-036, FR-029; check 1 SPEC-1-15 | Now that `describes` is public, a host can set it on a custom-element trigger such as #12's nav item. The description then has to reach that trigger's inner control (constitution III), and the spec still states no contract for this. | Either limit `describes` to native triggers for now, or state what a custom-element trigger must provide. |
| SPEC-2-06 | note | check 1 SPEC-1-05, -06, -07, -08, -09, -11, -12, -13, -14, -16, -17 | These check 1 notes are still open, and the spec text they cite is unchanged. Each one is listed below. FR-048 adds a second place where the heading level shows in the tree (SPEC-1-17). | The plan or its research should settle each one, or the spec should take the fixes check 1 proposed. |

SPEC-2-06 covers these check 1 notes:

- SPEC-1-05: the timing of the close relative to the exit animation.
- SPEC-1-06: the Popover API stated as the newest feature against WebKit's support for exit animations.
- SPEC-1-07: the light-dismiss wording in FR-034.
- SPEC-1-08: the cross-axis clamp.
- SPEC-1-09: the path count in SC-001.
- SPEC-1-11: drawer coverage for the forced-colours reset and body scroll.
- SPEC-1-12: where focus goes when the opener is gone.
- SPEC-1-13: a missing label and a long label.
- SPEC-1-14: token values and the bubble's ground and ink.
- SPEC-1-16: the default for `--ocelle-dialog-inline-size`.
- SPEC-1-17: the heading level.

## Counts

- blocking: 0
- operator: 0
- note: 6

## Operator questions

None.
