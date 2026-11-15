# Phase 3 design change 1: element source sharded by mutant count

## Finding

**Stop 1** (`stop-1.md`). T041 times each planned mutation shard that holds a `src/live.ts` or `src/form-control.ts`
entry against 7:00 (420 s). With the 30-line entries and the 10-entry, 250-line shards of
`gates/lib/mutation/shards.ts:43-45` (007 FR-014), `pnpm run gate:mutation -- --base 2004e82 --plan` gives 29
shards, and shards 2 to 20 hold `src/form-control.ts`. Shard 2 took 569.4 s and shard 3 534.6 s. Shard 4 has no
mutant on its lines and took 216.9 s, which is the fixed cost. By estimate eight of the 19 shards are over 420 s, and
three are over CI's 10-minute job limit.

Cost model (`stop-1.md`, this container): an element-source shard costs about **217 s fixed** (the gate's setup and
the `elements` project's in-process dry run under per-test coverage) plus about **14 s per valid mutant**. So 420 s
holds about 14 valid mutants. Shard 2 also ran the default configuration for `scripts/manifest.ts`, with its own dry
run, which is why it took 569.4 s with 11 valid element mutants.

## Decision

Operator, 2026-11-15 (human:jeroennouwsdev), `decision-stop-1.md`: **option (b), smaller shards.** The planner
changes so that each shard holds less work. Every planned shard must fit within T041's 7:00 on this container. The
tests, the Stryker configuration's test set, the mutation's strength, CI's 10-minute job limit and T041's 7:00 stay
as they are. How shards are made smaller is a design choice for the planner to record (below). Options (a)+(d) and
(c) were not taken.

## The rule chosen, and why

**What the planner can know at plan time.** `--plan` (`gates/bin/mutation.ts`) has the `git diff` ranges and can
read the changed files. It does not know which mutants the TypeScript checker will reject, which time out, or what
each mutant's tests cost, since all of that is decided while Stryker runs. What it can know cheaply is where Stryker
will place mutants. Stryker's own instrumenter, `@stryker-mutator/instrumenter` 10.1.1 (the version
`@stryker-mutator/core` 10.1.1 depends on, already in the lockfile), parses files and places every mutant without
running a test or the checker. A throwaway script (not committed) ran it on `src/form-control.ts` and
`src/ocelle-form-input.ts`. It found 257 and 170 mutants, plus 2 and 4 ignored ones. That is exactly the count in run
4's whole-diff report (`reports/mutation/mutation-elements.json`, `b76d4ee`), and it took about 0.2 s.

**The options weighed**, against run 4's report and the cost model:

| Option | Result on run 4's report (`src/form-control.ts`) | Verdict |
|---|---|---|
| Shorter line span: 15, 12, 10, 8 lines | largest entry 20, 18, 18, 15 valid mutants (estimates 497 s, 469 s, 469 s, 427 s); 3, 3, 2, 4 entries still estimated over 420 s | rejected: mutants are spread unevenly, and single lines hold up to 10 valid mutants (`:369`; `src/ocelle-form-input.ts:36` holds 12), so no line span bounds the count |
| Line span per file, weighted by its tests' cost | needs each file's per-mutant cost, which is only measured after a run | rejected: not known at plan time, and the span problem above remains inside each file |
| **Cut by mutant count** (instrumenter at plan time) | largest entry 10 mutants (estimate 357 s); in `src/ocelle-form-input.ts`, a one-line entry of 13 mutants, 12 valid (385 s); none estimated over 420 s | **chosen** |

**The rule** (plan decision 11; for changed files under `packages/elements/src/`, the files
`stryker.elements.config.json` mutates):

1. Every mutant the instrumenter places on the file's changed lines counts. Compile errors count too, since the
   planner cannot know them. Mutants that a `// Stryker disable` comment ignores do not. A mutant counts in an entry
   only when it lies wholly inside the entry's lines, as Stryker mutates a `mutate` range.
2. A file whose changed lines hold at most **10** mutants is one entry, its path, however many lines changed.
   Otherwise it is cut into `path:start-end` entries of at most 10 mutants. An entry grows over the changed lines in
   order until the next line would take it over 10. It then closes at the line boundary inside it that the fewest
   mutants span (on a tie, the latest such boundary), and the next entry starts on the next changed line. A single
   line holding more than 10 mutants is an entry on its own, since a line is not cut.
3. Entries are filled greedily in path order into shards of at most 10 mutants and 10 entries. Two entries of one
   file never share a shard. An element-source entry never shares a shard with an entry of another file, because
   such a shard runs both Stryker configurations and both dry runs (shard 2).
4. Every other changed file keeps 007 FR-014's rule: 30-line entries, 10-entry and 250-line shards. The stop was
   about element source, node-run mutants cost far less, and the sibling missions rely on that rule.

**Why 10 and not 14.** 217 s + 10 × 14 s = 357 s, which leaves 63 s (15 %) of margin. The margin covers four things:
compile errors (counted here as full mutants, though the checker rejects them before any test runs), timeouts (two in
run 4), a fixed cost that grows as phases 4 and 5 add suites, and noise.

**Why the fewest-spanned boundary.** A mutant whose node spans a cut is mutated in no shard. That is an accepted limit
(001 O10-02, `gates/README.md`). If entries were cut at the count alone, the two files would leave 21 valid mutants
spanning a cut. With the fewest-spanned boundary they leave 9, the same as the 30-line plan (6 + 3). So the mutation's
strength in CI stays where it was, as the decision requires.

**What it costs.** On run 4's report the two files make 35 and 23 element-source entries, against 19 and 10 before.
CI therefore runs more shard jobs in parallel. Each job stays under the limit, but the total runner time grows.
`--files`, the entry syntax, the `--plan` JSON and `.github/workflows/ci.yml` do not change. A Stryker upgrade must
move the instrumenter's pin with core's, and a gate test checks that.

**Open risk.** The estimate does not cover a shard whose mutants time out, or a fixed cost that has grown. That is
why T041a times the shards and makes a shard over 7:00 a new stop.

## Files

- `plan.md`
  - Decision 11: the rule, the evidence and the margin, the strength argument, the files the rule leaves unchanged,
    and the shared-code note naming #16/008, #15/009 and #8/011.
  - Phase 3 in § Phases: T041's shard timing runs on T041a's plan.
  - Technical Context § Primary Dependencies and the Constitution Check's licence and supply chain row: the one new
    development dependency, pinned exactly at 10.1.1, Apache-2.0, already locked as core's dependency.
- `research.md` R-09 (after "The shard T002 measures"): the measurement and why line spans do not bound the cost, the
  instrumenter check, the rule in short and its figures on run 4's report.
- `quickstart.md` step 8: `--plan` cuts element source by mutant count; other files as before.
- `tasks.md`
  - New, unticked: **T041a**. It is test-first in the gate's own tests: red, one commit, recorded in `red-commits`
    as `design-1`. The plant reading follows (none required, with the reason). Then green, which brings the
    dependency, the counting tool in `--plan`, the rule in `shards.ts` and `gates/README.md`. Then the re-plan with
    `--base 2004e82` and the timing of every shard holding `src/form-control.ts`. A shard over 7:00 is a new stop,
    `stop-2.md`. Last come the gates the change touches. The task names the shared gate files and says to merge
    `main` on conflict.
  - T041 (still unticked): its shard timing depends on T041a, and the stop-1 times stay recorded.
  - Stop-and-ask: a shard of T041a's plan over 7:00.
  - § Dependencies: T041a before T041's shard timing.
- Unchanged: `contracts/` (`elements.md` and `testing.md` state no shard rule), `spec.md`, `data-model.md`.

The plant question (decision: "a plant if the gates' plant rules ask for one"): under 006 `contracts/plants.md`, every
gate has fail, pass and error plants, judged on its findings and exit code in a whole-diff run. `--plan` gives no
verdict, the change adds no finding or rule, and no plant runs `--plan`. So the rules ask for no plant. T041a records
this and adds a plant only if the review finds a rule that asks for one.

Not changed here, since source, gate code and tests are outside this role: `gates/lib/mutation/shards.ts`,
`gates/bin/mutation.ts`, `gates/test/mutation-shards.test.ts`, `gates/README.md`, `package.json` and
`pnpm-lock.yaml`. The implementer changes them as T041a.
