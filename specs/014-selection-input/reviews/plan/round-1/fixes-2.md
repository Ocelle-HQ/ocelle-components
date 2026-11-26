# Squad round 1: fixes 2

Applied from `verify-1.md` (1 unresolved). The operator's Decision (a) for PLAN-TESTABILITY-1-011 stands: the request
is still dispatched after the next rendering update. This pass replaces the observation that could not fail on its
plant (a tree read awaited from the listener) with ones that do.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-TESTABILITY-1-011 | decided: (a) | research R-07 (§ What US4-6 observes: synchronous listener; frame-order record with plants synchronous dispatch and microtask dispatch; `Accessibility.nodesUpdated` tree history with plants synchronous dispatch and dispatch inside the element's rAF; phase-5 spike and operator fallback), R-11 (`activationRecord`, `axUpdates`); spec US4-6; contract § Pairings (two rows); plan phase 1, phase 5 |
