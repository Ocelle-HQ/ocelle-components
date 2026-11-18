# Squad round 2: fixes 2

Fix pass 2 of plan squad round 2. This pass resolves the one row that `verify-1.md` marks unresolved.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-001 | fixed | Narrowed as verify 1's first remedy says. spec.md Edge Cases: a hidden sidebar section has no box, padding or divider of its own, and only "the first section" and "consecutive sections" count visible sections; it still makes the default slot non-empty, so the head and footer dividers stay, and when every section is hidden (and there is no text) they meet with no padding between them; the README says to remove sections rather than hide them. spec.md FR-036 sidebar statement (the README says so); research.md R-09 (the all-hidden consequence, and why no rule collapses it: a `hidden` change fires no `slotchange`); data-model.md slot-empty rule; contracts/elements-package.md sidebar. FR-022, US3-3, US3-13, the plants and the plan's Constitution Check are unchanged |
