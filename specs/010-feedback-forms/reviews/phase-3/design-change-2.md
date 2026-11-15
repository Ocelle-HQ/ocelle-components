# Phase 3 design change 2: probably-static mutants weighted

## Finding

**Stop 2** (`stop-2.md`). T041a (5) timed the shards of design change 1's plan (`0d99aa5`). Three shards were over
7:00 (420 s): shard 9 (`src/form-control.ts:43-46`) at 439.5 s and again at 448.4 s, and shard 10 (`:47-56`) at
435.6 s. Each holds 9 valid mutants, and every one of them is static in run 4's report: class-field code that runs
when the module loads. Stryker runs a static mutant against the whole in-process suite, not only against the tests
that cover it.

Cost model (`stop-2.md` and `mutation.md` § T041a, this container):

- about **217 s fixed** per element shard, as in `stop-1.md`;
- about **25 s per static mutant**: (439.5 s − 217 s) / 9 = 24.7 s, (435.6 s − 217 s) / 9 = 24.3 s and
  (448.4 s − 217 s) / 9 = 25.7 s;
- about **2 to 6 s per other mutant**: shards 11, 19, 24 and 32 took 240.5 s to 277.5 s for 10 valid mutants each.

The instrumenter does not mark static mutants. Stryker only decides which mutants are static from the dry run's
coverage, after the plan is made.

## Decision

Operator, 2026-11-15 (human:jeroennouwsdev), `decision-stop-2.md`: **option (a), weight probably-static mutants.**

- The planner decides from the syntax which mutants probably run at module load: those in static class members,
  class field initialisers or top-level module code.
- It counts each of them as several mutants, about 5, so that a shard holds only 2 or 3 of them.
- The exact weight and syntax rule are a design choice for the planner, recorded here.
- The implementer makes the change test-first. They then time every element shard of the new plan, or each shard
  this design names, giving a reason for any shard not run. A shard over 7:00 is a new stop.
- These stay unchanged: the 10-mutant cap for other mutants, T041's 7:00 and CI's 10-minute limit.

Options not taken: (b) a cap of 7 for every mutant; (c) raising the 7:00 limit.

## The rule chosen, and why

**What the planner can see.** The `place` tool (`gates/bin/mutation.ts`, `placeMutants`) already gets each changed
element file's content. The instrumenter already gives each mutant's start and end line and column; today the tool
keeps only the lines (`PlacedMutant`, `gates/lib/mutation/shards.ts:59-63`). The planner can therefore parse the file
once more, cheaply, with the repository's pinned `typescript` 6.0.3. That parser is already a root development
dependency, and `gates/bin/csp.ts` and `packages/elements/scripts/manifest.ts` already call `ts.createSourceFile`.
The planner then looks up which syntax nodes enclose each mutant. No new dependency is needed, and no test or checker
runs.

**The syntax rule.** A mutant's *enclosing nodes* are the nodes whose span contains the mutant's whole span, from its
start to its end. A counted mutant is **probably static** when at least one of these holds:

1. **Static class member.** One of its enclosing nodes is a class member marked `static`: a property, a method, a
   get or set accessor, or a `static { }` block. This includes the body of a static method or accessor, such as Lit's
   `static get observedAttributes()`, which the browser reads when the element is defined.
2. **Class field initialiser.** One of its enclosing nodes is the initialiser of a class property, static or not.
3. **Top-level module code.** None of its enclosing nodes is a function. A function here means a function declaration
   or expression, an arrow function, a method, a get or set accessor, or a constructor. Examples are top-level
   `const` initialisers, top-level calls such as `define(...)`, and class heritage, decorators and computed keys
   outside any function.

Every other counted mutant is an ordinary mutant. A compile error, which the planner cannot detect, is weighted by the
same rule. Ignored mutants are still not counted.

**Check against run 4's whole-diff report.** This is the report of `b76d4ee` that `mutation.md` § T041a counts from.
The working-tree `reports/mutation/mutation-elements.json` has since been overwritten by T041a's `--files` runs. The
check used a byte-for-byte copy of run 4's report kept outside the repository: 257 and 170 counted mutants, and 2 and 4
ignored ones, as design change 1 counted. A throwaway script, not committed, applied the rule to the report's own
source text. It parsed with `typescript` 6.0.3 and located each mutant by its report location.

| File | Counted mutants | Static in the report (valid) | Caught by the rule (valid) | Wrongly flagged (valid) |
|---|---|---|---|---|
| `src/form-control.ts` | 257 | 31 (27) | 31 (27) | 8 (8) |
| `src/ocelle-form-input.ts` | 170 | 39 (31) | 39 (31) | 0 |
| Both | 427 | 70 (58) | **70 (58), none missed** | **8 (8)** |

- **Every static mutant is caught.** Of the 58 valid ones, 47 lie in static property initialisers (they match parts
  1 to 3), 7 lie in top-level code only (`form-control.ts:20` `hostAria`, `ocelle-form-input.ts:19` `types`, and
  `ocelle-form-input.ts:269` `define(...)`), and 4 lie only in a static accessor's body (the two
  `observedAttributes` getters). Part 1 is needed for these 4.
- **Stop 2's counts.** In the element shards of T041a's plan, the 56 valid static mutants of `mutation.md` (the 58,
  less the two static `ObjectLiteral` mutants `form-control.ts:43-50` and `ocelle-form-input.ts:54-73`, which span a
  cut) are all caught. This includes all 9 in each of shards 9, 10, 48 and 50, the 8 in shard 49 and the 5 in
  shard 6.
- **The 8 flagged in error** are all in `form-control.ts:215-229`. They are the instance property initialisers
  `current`, `lastCommitted`, `dirty`, `formDisabled` and `moving`, and the arrow function in `#labels`'
  initialiser. These run when an element is constructed, inside a test, so the report attributes them to tests.
  Leaving part 2 out for instance properties would flag none of them in error and still catch all 70. Part 2 is kept,
  as the decision names it: an element constructed while a module loads would run these initialisers at load. Each
  wrongly flagged mutant only makes its shard smaller.
- **Limit, outside this diff.** A function body that the module calls at load from another module is static but is
  not caught. The only example is `src/define.ts`'s `define`, which every element module calls at its top level.
  An earlier whole-diff report of feature 009's element source, also kept outside the repository, marks all 9 of
  `src/define.ts`'s mutants static, and the rule catches 1 of them. `src/define.ts` is not changed in this feature. If a later change
  to it plans a shard of 9 such mutants, that shard would cost about 217 s + 9 × 25 s = 442 s. The shard timing of
  any phase that changes it is the check, and a shard over 7:00 is a stop, as always. On that report, `src/live.ts`
  and `src/ocelle-notice.ts` have no valid static mutant the rule misses.

**The weight: 5.** A probably-static mutant counts as **5** mutants. Every other counted mutant counts as 1. Design
change 1's rule then applies to these weights in place of the counts:

- an element file whose changed lines weigh at most 10 is one entry;
- otherwise entries grow until the next line would take them over **10**;
- shards are filled up to a weight of 10, with at most 10 entries;
- a single line weighing more than 10 is an entry on its own.

The boundary at which an entry closes is still the one the fewest *mutants* span, counted and not weighted, since a
mutant spanning a cut is lost whatever its weight. The cap stays 10, as the decision requires. So an entry
or shard holds either up to 10 other mutants, or 2 probably-static mutants, or 1 probably-static mutant and up to 5
others.

**Worst case under the cap** (217 s fixed, 25 s a static mutant, 6 s another, the top of the measured range):

| Shard of weight 10 | Estimate | Margin under 420 s |
|---|---|---|
| 2 probably static | 217 s + 2 × 25 s = 267 s | 153 s |
| 1 probably static + 5 other | 217 s + 25 s + 5 × 6 s = 272 s | 148 s |
| 10 other | 217 s + 10 × 6 s = **277 s** | **143 s (34 %)** |

- **Why the worst case is the all-other shard.** At weight 5, each unit of weight costs at most 25 s / 5 = 5 s for a
  static mutant and 6 s for another. So no shard under the cap is estimated over 217 s + 10 × 6 s = 277 s.
- **The margin holds if the costs grow.** It still holds at 25.7 s, the highest static figure measured. It holds up
  to 30 s a static mutant before a static unit costs more than 6 s.
- **What the margin covers.** It covers timeouts, a fixed cost that grows as phases 4 and 5 add suites, and noise.
  It also covers a static mutant flagged in error, which costs less than it is counted.

**Why 5.** At weight 4, a unit costs 6.25 s and a shard could hold 2 static and 2 other mutants (279 s). At weight 6,
the plan has 8 more shards and loses one more valid mutant to a cut (below). At weight 5, a static unit is never
dearer than another mutant. That makes the cap's worst case the shard of 10 other mutants, the kind stop 2 measured
at 240.5 s to 277.5 s. It is also the weight the decision names.

**The line exception.** A line is not cut. So a single line weighing more than 10 is an entry over the cap. Its cost
is bounded by its own mutants, not by the cap. A line of k valid probably-static mutants is estimated at
217 s + k × 25 s. That is over 420 s from k = 9. On run 4's report the heaviest such lines are:

| Line | Mutants (valid) | Estimate |
|---|---|---|
| `src/form-control.ts:20`, `hostAria` | 6 (5 static valid, 1 compile error) | 342 s |
| `src/form-control.ts:44` to `:47`, `src/ocelle-form-input.ts:65` and `:70` to `:72` | 3 static valid each | 292 s |
| `src/ocelle-form-input.ts:19`, `types` | 8 (7 compile errors, 1 static valid) | 242 s, since compile errors are rejected by the checker before any test runs (shard 10, with one, took less than shard 9) |
| `src/ocelle-form-input.ts:36` and `:173` | 13 and 12, none static | 289 s |

None is over 420 s. The timing below measures each of these lines.

**Strength.** On run 4's report, the rule at weight 5 leaves 17 mutants spanning a cut, 9 of them valid. These are
the same 9 valid mutants that design change 1's plan leaves. The 2 additional mutants that span a cut are compile
errors. So the mutation's strength in CI stays where it was. At weight 6, 10 valid mutants span a cut.

**The plan it gives** on run 4's report, by the same throwaway script. The implementer's re-plan is the record.

| | Design change 1 (`0d99aa5`) | This rule, weight 5 |
|---|---|---|
| `src/form-control.ts` entries | 35 | 48 |
| `src/ocelle-form-input.ts` entries | 23 | 34 |
| Element shards | 58 (shards 6 to 63) | 81 |
| Element shards holding a probably-static mutant | (none weighted) | 30 |
| Entries over the cap (one line) | 3 | 13 |
| Highest estimate under the cap | 442 s (shards 9, 10, 48 and 50, 9 static each; 9 and 10 measured at 435.6 s to 448.4 s) | 277 s |
| Highest estimate overall | the same 442 s | 342 s (`src/form-control.ts:20-20`, a line over the cap) |
| Valid mutants spanning a cut | 9 | 9 (the same) |

These estimates use 217 s, plus 25 s a valid mutant the report marks static, plus 6 s another valid mutant, with
compile errors at 0 s. The non-element shards grow by the lines T041b adds to the gate source.

**What it costs.** About 23 more element shard jobs than design change 1's plan. CI runs them in parallel, and the
total runner time grows by about 23 × 217 s of fixed cost. On the same report, option (b), a cap of 7 for every
mutant, would give a similar number of element shards, 77. But its highest estimate would be 392 s, against 277 s
under the cap here, and 10 valid mutants would span a cut, against 9. `--files`, the entry syntax, the `--plan` JSON, `.github/workflows/ci.yml` and the Stryker
configurations do not change. The weight is a named constant beside the cap.

**Open risk.**

- The weight assumes a static mutant costs about 25 s. A suite that grows in phases 4 and 5 raises both the fixed
  cost and the static cost, since every static mutant runs the whole in-process suite.
- A line of 9 or more probably-static mutants would be over 420 s by estimate.
- A static function body called from another module is not caught (above).

T041b times the shards for these reasons, and a shard over 7:00 is a new stop.

## What T041b times, and why not the rest

- **Every element shard of the new plan that holds a probably-static mutant.** By this design's figures there are
  30, including every one-line entry of static mutants above. Stop 2 found its cost in these shards.
- **The shards holding no probably-static mutant estimated at 275 s or more.** By this design's figures there are 8:
  the six shards of 10 valid other mutants, and the one-line entries `src/ocelle-form-input.ts:36-36` and `:173-173`.
- **Any shard holding a mutant the report marks static but the rule does not flag.** There are none on run 4's
  report.

The remaining element shards are not run. On run 4's report each one is estimated at 271 s or less and holds no static
mutant. Stop 2 measured shards of 10 such mutants at 240.5 s to 277.5 s, well under 420 s. The implementer records
the shard numbers of the real plan for each group.

## Files

- `plan.md`
  - Decision 11: the weighting paragraph after the mutant-count rule: the measured costs, the syntax rule, the weight
    and the caps, the worst case, the line exception, strength, and the limit.
  - Phase 3 in § Phases: T041b, with T041's shard timing on T041b's plan.
- `research.md` R-09, after "Element source by mutant count": the stop 2 measurement, the rule and weight in short,
  and the check against run 4's report.
- `quickstart.md` step 8: `--plan` weights probably-static element mutants as 5.
- `tasks.md`
  - New, unticked: **T041b**, test-first in the gate's own tests. Its steps:
    1. red, one commit, recorded as `design-2` by red.sh's steps run by hand, as for `design-1`;
    2. the plant reading;
    3. green, which brings the rule, the weight, the header comments and the `gates/README.md` sentence;
    4. the re-plan with `--base 2004e82`;
    5. the timing above;
    6. then T041a's step (6) gates, for both changes.
  - T041a (still unticked): its steps (5) and (6) are completed by T041b. T041a and T041b are ticked together.
  - T041 (still unticked): its shard timing runs on T041b's plan. The stop-1 and stop-2 times stay recorded.
  - Stop-and-ask: a shard of T041b's plan over 7:00.
  - § Dependencies: T041a, then T041b, then T041's shard timing.
- Unchanged:
  - `contracts/`, `spec.md` and `data-model.md`. No shard rule is stated there.
  - plan.md's Technical Context and Constitution Check. No dependency is added, since `typescript` 6.0.3 is already
    a pinned root development dependency.

**The plant question.** As in design change 1, no plant is required. Under 006 `contracts/plants.md` every gate has
fail, pass and error plants, judged on its findings and exit code in a whole-diff run. The weight changes `--plan`
only. `--plan` gives no verdict, the change adds no finding or rule, and no plant runs `--plan`. T041b records this,
and adds a plant only if the review finds a rule that asks for one.

**Not changed here**, since source, gate code and tests are outside this role: `gates/lib/mutation/shards.ts`,
`gates/bin/mutation.ts`, `gates/test/mutation-shards.test.ts`, `gates/test/mutation-fakes.ts` and `gates/README.md`.
The implementer changes them as T041b. In `gates/README.md`, the 2026-11-15 amendment paragraph gains a sentence of
this sense: "A mutant that probably runs when its module loads (in a static class member, a class property's
initialiser, or code outside any function) counts as 5, since Stryker runs such a mutant against the whole in-process
suite (about 25 s, against 2 to 6 s for another); the caps of 10 stand, and a line weighing more than 10 is an entry
alone (010 phase 3 stop 2, operator decision (a); design-change-2.md)."
