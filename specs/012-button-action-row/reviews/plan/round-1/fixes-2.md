# Squad round 1: fixes 2

The three rows verify 1 left unresolved, all from one defect: cross-references to plan.md's "Decisions the operator
should see" still used the numbers from before fixes 1 renumbered the list. They now cite the current numbers
(9 = disabled and unavailable links have no `href`, 13 = Alt-click, 16 = unavailable current row). The plan phase 6
line, which cited decision 16 for the missing `href`, now cites 9 for that and 16 for the unavailable current row.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-007 | fixed | research R-12 (forced-colours bar `GrayText` when unavailable: decision 10 -> 16) |
| PLAN-TESTABILITY-1-001 | fixed | research R-11 (decision 7's Alt-click -> decision 13's); contracts/checks.md link scenario bodies row (decision 7 -> 13) |
| PLAN-TESTABILITY-1-004 | fixed | contracts/checks.md § Edge cases and plan decisions (`unavailable` and `current`: 10 -> 16; unavailable link has no `href`: 6 -> 9; Alt-click: 7 -> 13; disabled-ink bar: 10 -> 16); plan phase 6 (decision 9 for no `href`, 16 for the unavailable current row) |
