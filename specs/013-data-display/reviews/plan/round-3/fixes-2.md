# Squad round 3: fixes 2

Fix pass 2 of batch 1: the two rows that `verify-1.md` marks unresolved.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-003 | fixed | contracts/checks.md § Oracles "No fill transition" (the empty-`animations()` assertion limited to US3-2, which is determinate; the value-removed body asserts the 40% inline size and no `CSSTransition` and nothing animating the fill's inline size, with the sweep `CSSAnimation` allowed without reduced motion; the 200 ms plant fails both bodies), § Extra scenario bodies row "a `value` set, then removed", § Driver additions `animations(id)` (reports kind, target part and animated property); research R-06 § No width transition |
| PLAN-FRESH-3-004 | fixed | spec FR-033 reworded: the bound and the shared sweep are per loading episode, not per node and not per page; episode start and end stated; a new episode on the same page gets its own sweep; round 2 decision note and US3-14 ("continued the one loading episode") aligned; plan Decision 8 notes the round 3 amendment |
