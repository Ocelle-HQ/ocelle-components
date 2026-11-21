# Phase 3 stop 2: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-15
question: stop-2.md (element shards made of static mutants, code run at module load, take 7:15-7:28 at 9 valid mutants under the 10-mutant cap; the instrumenter does not mark static mutants)

**Decision: option (a), weight probably-static mutants.** The planner recognises from the syntax which mutants probably
run at module load: those in static class members, class field initialisers or top-level module code. It counts each
of them as several mutants, about 5, so that a shard holds only 2-3 of them. The exact weight and syntax rule are a
design choice, recorded by the planner as a design change. The implementer then makes the change test-first and
times every element shard of the new plan (or each shard the design names, with a reason for any not run). A shard
over 7:00 is a new stop. The 10-mutant cap for other mutants, T041's 7:00 and CI's 10-minute limit stay unchanged.

Options not taken: (b) a cap of 7 for every mutant; (c) raising the 7:00 limit.
