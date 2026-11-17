# Spec check 1 — fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | FR-030 and FR-036 (new `describes` boolean states whether the text describes the trigger; default: it repeats the name, as #12 and #7 use it; the element compares no names), US3 scenario 7, new US3 scenario 11 (near-equal text), FR-044, Key Entities |
| SPEC-1-02 | fixed | FR-031, FR-032, FR-033 (one condition, keyboard focus matching `:focus-visible`, for show, stay and hide), US3 scenarios 1, 2 and 10 (tapped trigger), new US3 scenario 12 (clicked trigger the pointer leaves), Assumptions (Touch) |
| SPEC-1-03 | fixed | new FR-047 (no `style` attribute, no `<style>` element; values only through adopted stylesheets), new US3 scenario 13 (assertion after each placement), SC-007 |
| SPEC-1-04 | answered | Operator decisions while specifying (2026-11-12, human:MOES-Media: "Add hidden-heading option"), FR-005, new FR-048 (`heading-hidden` on `ocelle-drawer` only), new US2 scenario 6, FR-042 (story), FR-044, Key Entities |
