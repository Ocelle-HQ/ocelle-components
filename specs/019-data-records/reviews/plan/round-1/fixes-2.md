# Squad round 1: fixes 2

The two rows verify-1.md marks unresolved are resolved by one change: each phase's red commit changes 003's
`source.test.ts` for the `base.css` rules its own green adds, so no green fails the changed test. No new operator
decisions.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-005 | fixed | research.md R-06 "003's existing test" (phase 1's red transcribes blocks 1 and 2, phase 2's red the timeline's pre-upgrade rule, phase 3's red the chain's; last-rule assertion per phase, final order wrap, block 1, block 2, block 3 with the timeline rule before the chain rule); plan.md Testing, Constitution Check VIII, phase 1, 2 and 3 Red lists; contracts/styles-data-table.md intro |
| PLAN-FRESH-1-004 | fixed | Same change as PLAN-CORRECTNESS-1-005: the pre-upgrade rules enter `source.test.ts` in phase 2's and phase 3's red commits, matching the greens that add them (research.md R-06; plan.md phases 2 and 3 Red; contracts/styles-data-table.md) |
