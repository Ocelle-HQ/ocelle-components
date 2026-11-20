# Squad round 1: fixes 3

Applies the row that verify 2 left unresolved.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-007 | fixed | data-model Announcement transitions note: "exactly one row" replaced by "at most one row; an event that matches no row changes nothing (no announcement, no cancellation, baseline unchanged)", with the no-row cases verify 2 named as examples (a `tone` change with equal politeness, a light-DOM mutation on a notice that is not live or is `hidden`, a role change that keeps a `hidden` notice live) and a reminder that a `hidden` notice is announced with the current text and politeness when `hidden` is removed; the table rows are unchanged |
