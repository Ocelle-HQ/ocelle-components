# Squad round 2: fixes 2

The one unresolved row of `verify-1.md` (PLAN-FRESH-2-002, option (a) in place). The README rule for further block
padding on a control had two wordings: R-10 also allowed a control to set the row's `padding-block` to a value at
least the convention's, while the contract, data-model.md and R-15 said "around the row". It now has one wording
everywhere: a control never sets block padding on the row (only `iconSlotStyles` sets it) and puts any further block
padding on an element around the row. Forbidding the override keeps a single rule that a later control cannot use to
lower the padding below what holds the icon. No measurement changes, so nothing was re-probed.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-002 | fixed | research R-10 (row padding paragraph: override removed, one rule the README states), R-15 (README slot convention wording); data-model § Slot convention; contracts/elements-package.md § Slot convention; spec FR-021 (the rule), US3-7 (README names the row-padding rule) |
