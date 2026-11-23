# Phase 3 stop 1: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-15
question: stop-1.md (the CI mutation shards that hold `src/form-control.ts` run over T041's 7:00; by estimate some run over CI's 10-minute job limit)

**Decision: option (b), smaller shards.** Change the shard planner (`gates/lib/mutation/shards.ts`, now a 30-line cut
with a cap of 10 entries per shard) so that each shard holds less work, for example by cutting by mutant count or with
a shorter line span. That is the planner's or implementer's design choice, to be recorded. Every planned shard must
then fit within T041's 7:00 on this container. The tests, the Stryker configuration's test set and the mutation's
strength stay as they are. CI's 10-minute job limit and T041's 7:00 stay unchanged.

Order of work: the planner records the change in the design (plan decision 11 and a task under phase 3). The
implementer then makes the gate change test-first (a red test in the gate's own tests, and a plant if the gates'
plant rules ask for one), re-plans, and times every shard that holds a `src/form-control.ts` entry. A shard still over
7:00 is a new stop.

Options not taken: (a)+(d) raising T041's limit and CI's `timeout-minutes`; (c) cheaper test runs.
