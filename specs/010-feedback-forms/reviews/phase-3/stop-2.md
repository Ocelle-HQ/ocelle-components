# Phase 3 stop 2: mutant-count shards whose mutants are static run over 7:00

tasks.md T041a (5): every planned shard that holds a `packages/elements/src/form-control.ts` entry, run alone with
`--files` and timed, "**A shard still over 7:00 (420 s) is a new stop for the operator** (recorded as
`reviews/phase-3/stop-2.md`; nothing is changed to work around it)". Shard 9 of T041a's plan took 439.5 s, and 448.4 s
when run again, and shard 10 took 435.6 s. **The phase stops here for the operator.** Nothing was changed to work
around it: not the rule or its cap of 10 (`gates/lib/mutation/shards.ts`, `0d99aa5`), not the Stryker configurations,
not the tests, not CI's limit, not T041's 7:00.

## What was done before the stop

T041a's steps 1 to 4 and part of 5 are done. Each is recorded in `mutation.md` § T041a:

1. Red: `971c431`, recorded as `design-1` (16 of 3787 tests failed, each new case on its assertion).
2. Plant reading: no plant is required.
3. Green: `0d99aa5`. It adds the dependency (exact 10.1.1, lockfile), the `place` tool in `--plan`, the rule in
   `shards.ts` and `gates/README.md`.
4. Re-plan: 63 shards and 60 cuts. `src/form-control.ts` is cut into 35 entries and `src/ocelle-form-input.ts` into
   23, as the design counted. 9 valid mutants span a cut, as many as before. No element shard is estimated over 420 s.

## What was measured (2026-11-15, this container, 4 CPUs, Chromium 153 build 1243, one job at a time, at `0d99aa5`)

Each shard was run as `pnpm run gate:mutation -- --base 2004e82 --files <entries>` and timed from the command's start
to its exit. The queue ran from the highest estimate down and stopped after the first shard over 420 s.

| Shard | Entries | Valid mutants (static) | Estimate | Wall-clock |
|---|---|---|---|---|
| 46 | `src/ocelle-form-input.ts:36-36` | 12 (0) | 385 s | 252.8 s |
| 54 | `src/ocelle-form-input.ts:173-173` | 12 (0) | 385 s | 251.1 s |
| 11 | `src/form-control.ts:57-235` | 10 (1) | 357 s | 252.8 s |
| 19 | `src/form-control.ts:368-369` | 10 (0) | 357 s | 267.4 s |
| 24 | `src/form-control.ts:417-439` | 10 (0) | 357 s | 240.5 s |
| 32 | `src/form-control.ts:495-503` | 10 (0) | 357 s | 277.5 s |
| 9 | `src/form-control.ts:43-46` | 9 (9) | 343 s | **439.5 s (7:19.5)** |
| 9, again | `src/form-control.ts:43-46` | 9 (9) | 343 s | **448.4 s (7:28.4)** |
| 10 | `src/form-control.ts:47-56` | 9 (9) | 343 s | **435.6 s (7:15.6)** |

Every run exited 0, with no survivor and no timeout. Shards 6 to 8, 12 to 18, 20 to 23, 25 to 31 and 33 to 40 were
not run once the stop condition held. The measured shards show the answer would not change.

**Where the time goes.** Shards 9 and 10 hold the static `shadowRootOptions` and `properties` declarations of the form
control (`form-control.ts:41-56`). Every valid mutant in them is static in run 4's report: class-field code that runs
when the module loads. Stryker runs a static mutant against the whole in-process suite, not only the tests that cover
it. Static mutants cost about 25 s each: (439.5 s − 217 s) / 9 and (435.6 s − 217 s) / 9, with the fixed cost of
`stop-1.md`. Other mutants cost about 2 to 6 s each in this plan: shards 11, 19, 24 and 32 took 240 to 278 s for
10 valid mutants. That is below the 14 s of `stop-1.md`, which mixed the two kinds. So the stop-1 model (217 s + 14 s
a mutant) underestimates a shard of static mutants and overestimates one of covered mutants.

**The planner cannot see which mutants are static.** `@stryker-mutator/instrumenter` 10.1.1 gives no `static` field
(it returns `fileName`, `id`, `location`, `mutatorName`, `replacement`, `status`, `statusReason`). Stryker decides
which mutants are static from the dry run's coverage, after the plan.

**Other shards likely over 7:00, by that figure (not measured).** These are the element shards in which nearly every
valid mutant is static (run 4's report; table in `mutation.md`):

| Shard | Entries | Valid (static) | 217 s + 25 s a static mutant + 4 s another |
|---|---|---|---|
| 48 | `src/ocelle-form-input.ts:54-65` | 9 (9) | about 442 s |
| 50 | `src/ocelle-form-input.ts:70-75` | 9 (9) | about 442 s |
| 49 | `src/ocelle-form-input.ts:66-69` | 8 (8) | about 417 s |
| 6 | `src/form-control.ts:1-25` | 5 (5) | about 342 s |

T041a's step (5) does not require shards 48 to 50, since their stop-1 estimates are under 360 s. By this figure,
though, 48 and 50 would also be over 420 s.

## The question for the operator

The rule fits the shards of covered mutants well within 7:00 (240 to 278 s measured at 10 valid mutants). Shards of
static mutants run over 7:00, between 435.6 s and 448.4 s measured, at 9 valid mutants. Options the implementer
sees (none taken):

(a) Weight mutants the planner can tell are probably static. For example, count a mutant inside a class's `static`
member, or in module-level code outside any function, as several mutants. That needs a syntactic test in the
planner, because the instrumenter does not mark static mutants. The weight and the test are a design choice for the
planner to record.
(b) Lower the element-source cap for every mutant, for example from 10 to 7. At about 25 s a static mutant,
217 s + 7 × 25 s = 392 s. That makes many more shards, and so more CI runner time.
(c) Accept these shards for this phase. Record the times, raise T041's 7:00 for element shards to a figure under
CI's 10-minute job limit, and measure the remaining shards against it. That is option (a) of stop 1, not taken then.
(d) Another decision.

## What this stop leaves open

- T041a stays open. It still needs the rest of its step (5): the shards not run and any new plan's shards. It also
  needs its step (6), the gates the change touches: `gate:unit-tests`, `gate:typecheck`, `gate:lint`,
  `gate:test-lint`, `gate:pins`, `gate:plants` and the whole-diff `gate:mutation -- --base 2004e82`. Only typecheck,
  lint, test-lint and pins were run, before `0d99aa5`; each exited 0.
- T041 stays open. Its shard timing depends on T041a, and its whole-diff mutation run still has to include the gate
  change.
