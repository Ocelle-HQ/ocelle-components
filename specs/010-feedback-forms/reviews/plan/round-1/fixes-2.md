# Squad round 1: fixes 2

Applies the row that verify 1 left unresolved.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-007 | fixed | data-model Announcement transitions: the role-change rows are limited to adding or removing a live role on a notice with `announce`, or `alert` ↔ `status`, with the condition "the notice stays live" (spec FR-008, "Live host role at runtime"); the "stops being live" row covers `announce` removed with no live role and a live role removed or replaced on a notice without `announce`; a new row makes `announce` set or removed while a live role stays a no-op (FR-009); a note states that each event matches exactly one row |
