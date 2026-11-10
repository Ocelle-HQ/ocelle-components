# Research: Mutation gate strictness (007)

Read on 2026-11-10 from the repository at `9954fbb`, with `node_modules` installed (`pnpm install --frozen-lockfile`):
Stryker 10.1.1 (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`), Vitest 5.0.5. Each item gives the decision,
the reason and what else was weighed. Amended on 2026-11-10 by plan squad round 1 (`reviews/plan/round-1/refute.md`,
`fixes-1.md`), rechecked against the same installed sources.

## R-01 Report line format

**Decision.** Each report line has the finding shape of `specs/001-repository-foundation/contracts/gate-cli.md`
(`<location>: mutation: <rule>: <message>`), with three reserved rules that are never findings:

| Kind | Line |
|---|---|
| Timeout | `<path>:<start line>: mutation: timeout: <mutator>: replaced by <replacement>` |
| CompileError | `<path>:<start line>: mutation: compile-error: <mutator>: replaced by <replacement>` |
| Zero-mutant entry | `<entry>: mutation: zero-mutants: no mutant on the changed lines` |

`<entry>` is `path` in a whole-diff run and the `--files` entry exactly as given (`path` or `path:start-end`) in a shard
run (spec FR-003). The lines are printed after the equivalent-record lines and before the findings (exit 1) or the
summary (exit 0), Timeouts first, then CompileErrors, then zero-mutant entries. Timeouts and CompileErrors are each in
the order of the changed files, then start line, then start column, then Stryker's mutant id compared as a number (ids
are strings in the report, `report.ts` `readonly id: string`; an id that is not a decimal integer sorts after every
numeric one, by string). Zero-mutant entries are in the order of the changed files. `<replacement>` goes through
`oneLine` as findings do.

**The rule is the status** (spec FR-001, FR-002, US1 AS1/AS2): `timeout` names the status `Timeout` and
`compile-error` the status `CompileError`. The line prints no separate status word; tests and plants are written against
this one wording.

**Why.** The equivalent records (`<path>:<line>: mutation: record: <mutator>: <reason>`, `gates/lib/mutation/records.ts`
`formatRecord`) already set this pattern: a located line that is not a finding, which the plant judge tells apart by
its rule (`gates/lib/plant-judge.ts` `isRecord`). A located line is clickable in a terminal and in a CI log, and a
reviewer reads all four kinds the same way. The rule names are lowercase words, as `record` is, and no mutator name
(`StringLiteral`, `ArrayDeclaration`, …) can collide with them, since findings put the mutator in the rule slot.

**Alternatives.** A separate section (`mutation: report:` lines without a location): the judge's `reported()` ignores a
line whose `: mutation: ` marker is at index 0, so it would need no judge change, but the plants could then not assert
the lines (FR-008) without a second parser, and the location would not be the first field. Rejected. A JSON side file:
the spec asks for the output alone (SC-001). Rejected.

## R-02 The plant judge and plants

**Decision.** `judgePlant` treats the rules `record`, `timeout`, `compile-error` and `zero-mutants` of the mutation gate
as report lines, never as findings. A pass plant may list the report lines it expects in a new optional key `reports`
(`[{ "location", "rule", "message"? }]`, `rule` one of the three new rules). The judge changes in three places
(`gates/lib/plant-judge.ts` today maps every reported line of a pass run through the record formatter, :199-210, "Here
every line is a record", so it is not "without a change"):

- `records` compares only the lines with rule `record`; a `timeout`, `compile-error` or `zero-mutants` line in the run
  is not a record and does not make a pass plant with `records` fail.
- `reports`, when present, compares only the lines with the three new rules, by location and rule (and the message
  substring when given), **as a multiset**: two identical report lines need two expected entries, and missing and
  unexpected lines both fail. `differ` (:161-171) compares de-duplicated sets today, so `reports` gets a count-aware
  comparison. When `reports` is absent, report lines are not checked, so every existing pass plant keeps its verdict
  without a `plant.json` change (FR-008, SC-002).
- `parsePlant` accepts the `reports` key (it rejects unknown keys today, :79-80). `judgePlant` rejects `reports` on a
  plant of any gate but `mutation` with its own problem line, so a non-mutation plant never carries an unchecked key.

A fail plant also accepts `reports`, so the exit-1 case (spec US1 AS5) can be planted.

**Red tests of the judge** (`gates/test/plant-judge.test.ts`), each red against today's judge: a pass plant with
`records` and report lines in the run passes; a pass plant with `reports` and no `records` passes on the matching run;
a missing report line, an unexpected one, a duplicated one (multiset) and a message mismatch each fail with their
problem; a fail plant with `reports` judges both its findings and its report lines; `reports` on a non-mutation plant is
rejected; `parsePlant` accepts `reports` and still rejects other unknown keys.

**Order in User Story 1.** The judge support comes first (its red tests, then the judge). Then the `plant.json` edits
and the new plants, which run red against the old gate (it prints no report line, so `reports` misses). Then the gate
code turns them green. Editing `plant.json` before the judge knows `reports` would go red on "unknown key reports", a
setup error and not the behaviour under test.

Plants:

| Plant | Change | Proves |
|---|---|---|
| `pass-compile-error` | adds `reports` with its one `compile-error` line | FR-002, AS2 |
| `pass-zero-mutant` (new) | a type-only change to one package source file; `reports` with its `zero-mutants` line | FR-003, AS3, on a real Stryker run where no entry has a mutant (FR-008) |
| `pass-fully-checked` | adds `reports: []` | AS4: no report line when every mutant is killed |
| `error-zero-mutant-failing-test` (new) | a type-only change to one package source file plus a test that fails without any mutant; `expect: error` with Stryker's dry-run cause | a zero-mutant change still ends exit 2 when the dry run fails (R-03) |
| `pass-timeout` (new) | not added: see below | |

**Timeout is proven by gate tests, not a plant.** A real Timeout needs a mutant whose test run outlasts Stryker's limit;
a plant built on wall time is flaky on CI (spec check 1, SPEC-1-13). The spec allows a gate test (FR-008). The
in-process gate tests (`gates/test/mutation-*.test.ts`, with the Stryker doubles of `gates/test/mutation-fakes.ts`)
feeds a recorded report with a `Timeout` mutant on a changed line and asserts the line and the summary;
`gates/test/mutation-report.test.ts` covers the classification; `gates/test/plant-judge.test.ts` covers the judge's
`reports` key with a Timeout line.

The real Timeouts of User Story 2's red runs (R-06) are read from each run's `mutation.json`; the green runs, made with
the User Story 1 gate, print them as report lines, so a former Timeout that stays one would show in the gate's own
output.

**Alternatives.** Let the judge ignore every report line and never check them: then no plant proves FR-001 to FR-003 on
the real gate. Rejected. Make every pass plant list its report lines: churn on eleven plants for no new proof. Rejected.

## R-03 Zero-mutant entries

**Decision.** `classifyMutants` returns, besides the findings and the mutant count, the Timeout and CompileError mutants
and the entries that had no mutant on their changed lines. It already loops over the selected `ChangedFile`s; an entry
is zero-mutant when that loop counted no mutant for it. To name a shard entry exactly as given, `selectFiles`
(`gates/lib/mutation/shards.ts`) carries the entry text on each selected file (`entry`), which it already holds in
`read`; a whole-diff run uses the path.

**One file, one entry, in `--files` too** (operator decision, human:jeroennouwsdev, 2026-11-10, plan squad round 1,
PLAN-CORRECTNESS-1-005, option (a) "Reject as exit 2"). `--plan` never puts two entries of one file in one shard
(`planShards`, shards.ts:70-86), but `selectFiles` (:158-174) accepts `a.ts:1-60,a.ts:61-120`, `a.ts,a.ts:1-60` or a
repeated entry and merges every window of one path into one `ChangedFile`, so FR-003's per-entry name would be undefined
there. `selectFiles` therefore rejects a `--files` list in which one file has more than one entry (two entries of one
file, or one entry repeated): the run ends as could-not-run (exit 2) before Stryker runs, with a new selection cause
that names every entry of each such file, as given, in list order: `mutation: could not run: --files names one file more
than once (two entries of one file never share a shard): <entry>, <entry>; run --plan for the shards`. The check runs
after the malformed check (it needs each entry's path) and before the missing and empty checks. This matches 001
FR-013's shard rule and adds an exit-2 cause, so `contracts/mutation-output.md` and 001 gate-cli's mutation row say so
(R-08). With it, one selected file is one entry in every run. Red test in `gates/test/mutation-shards.test.ts`: two
entries of one file, a whole entry with a range of the same file, and a repeated entry each exit 2 with that cause and
no Stryker run. The existing assertion that the plan's joined value of every shard
(`a.ts,b.ts:1-60,b.ts:61-120,b.ts:121-130`) passes (mutation-shards.test.ts:580-593, "entries of one file joined")
contradicts the decision and is replaced by that exit-2 case; its first half (one entry of a split file) stays.

**"Stryker read".** The gate sees no positive "read" signal (spec FR-003): a file Stryker did not read already ends the
run as exit 2 (`unreadEntries`), before the classification. So every entry that reaches the classification was read.

**Real run with no mutant at all.** Stryker 10.1.1's source points to a report being written (spec check 2, SPEC-2-06,
settled by reading): the instrumenter logs `Instrumented %d source file(s) with %d mutant(s)`
(`@stryker-mutator/instrumenter` `instrumenter.js:53`); `4-mutation-test-executor.js:44-63` has no early exit for zero
mutants and calls `reportAll`, which hands the json reporter a report (`mutation-test-report-helper.js:117-120`). Core's
`fs/project.js:35-50` logs `Found N of M file(s) to be mutated` only when at least one file is to be mutated, and
otherwise warns `No files found for mutation with the given glob expressions`. The dry run still runs with zero mutants
and throws on failed tests (`3-dry-run-executor.js`). The `pass-zero-mutant` plant is the confirmation: the first task
of User Story 1 runs it on the real gate before any code change and records what Stryker wrote.

- Report written (`files` empty, or the file listed with no mutant), as the source shows: the plant passes once the
  report line exists. No fallback is built.
- No report written, against the source: the gate today ends exit 2 ("Stryker wrote no report"), which the spec's edge
  case rules out, so it is fixed in this story, test first. The fallback passes a no-report run only when all three
  hold: Stryker's output has the line `Instrumented <n> source file(s) with 0 mutant(s)`, matched on the whole text `source
  file(s) with 0 mutant(s)` (so `with 10 mutant(s)` never matches); Stryker exited 0; and the output has no ERROR
  line (`lastError` is undefined). Then every entry is zero-mutant. Every other run without a report stays exit 2 with
  today's cause, the `No files found for mutation with the given glob expressions` case included. Red gate tests: the
  `with 10 mutant(s)` line and no report → exit 2; the zero line with a non-zero exit, and the zero line with the dry
  run's ERROR line → exit 2 with today's cause; the zero line, exit 0, no ERROR → pass with every entry zero-mutant.

In both cases the new plant `error-zero-mutant-failing-test` (R-02) holds that a zero-mutant change whose dry run fails
(a failing test, no report) is still exit 2 with Stryker's cause, as `error-dry-run-fails` holds it for a change with
mutants.

**Alternatives.** Count zero-mutant entries per file across shards: impossible within one shard (spec check 1,
SPEC-1-01). Rejected.

## R-04 Summary lines

**Decision** (the contract fixes the wording, `contracts/mutation-output.md`). Both closing lines gain the three counts,
each also when zero:

- exit 0: `mutation: <n> mutants on the changed lines of <f> files, none survived; <t> timeouts, <c> compile errors,
  <z> zero-mutant entries; <r> equivalent records`
- exit 1: `mutation: <k> findings in <f> changed files (<n> mutants on changed lines; <t> timeouts, <c> compile errors,
  <z> zero-mutant entries)`

The nouns, singular / plural: `mutant` / `mutants`, `file` / `files`, `changed file` / `changed files`, `finding` /
`findings`, `timeout` / `timeouts`, `compile error` / `compile errors`, `zero-mutant entry` / `zero-mutant entries`,
`equivalent record` / `equivalent records`. `plural()` (`gates/lib/findings.ts:23-25`) appends `s`, which would print
"zero-mutant entrys", so it gains an optional irregular plural (`plural(count, "zero-mutant entry", "zero-mutant
entries")`) with its own red test in `gates/test/findings.test.ts` (1 → singular, 0 and 2 → the given plural, and the
two-argument form unchanged). The existing exact-summary assertions are extended with the three counts (they fail until
the gate prints them): `gates/test/mutation-ranges.test.ts:356,374,441`, `gates/test/mutation-records.test.ts:148`,
`gates/test/mutation-shards.test.ts:574,583,589,665,717`, and every other exact `mutation:` summary the US1 task finds
with `grep -rn '"mutation: ' gates/test`. The "nothing to mutate" line (no changed in-scope file) is unchanged: it has
no entries, so all three counts would be zero, and it names the base, which the reviewer needs (spec check 3,
SPEC-3-01).

**Alternatives.** Counts only on the pass line: AS5 asks the Timeout to stay visible next to the findings, and the
counts belong with it. Rejected.

## R-05 Why the `source.ts` mutants time out, and the lever

**What Stryker does** (`@stryker-mutator/vitest-runner` 10.1.1, `dist/src/vitest-test-runner.js`):

- Every test-runner process runs Vitest with `maxWorkers: 1`, `maxConcurrency: 1` and `bail: 1`: the test files run one
  after the other, and the run stops at the first failing test.
- A static mutant (one executed at module load, as every `source.ts` record is) has no per-test coverage, so with
  `ignoreStatic` off it runs every test of `vitest.mutation.config.ts`.
- The limit is `timeoutFactor × netTime + timeoutMS + overhead` (`@stryker-mutator/core`
  `dist/src/mutants/mutant-test-planner.js:124`), about 32 s in op 004's runs.
- Vitest 5.0.5 (`dist/chunks/index.1TqnEahn.js`): `BaseSequencer.sort` (:7787-7791) orders files by
  `sequence.groupOrder`, then **by project name**, then failed-before-passed, then longest recorded duration first. So
  the projects run in name order (`elements`, `gates`, `storybook`, `styles`, `tokens`), and the name order, not the
  durations, is why the token tests run last today. `groupSpecs` (:6273-6276, :6310) puts every spec with `isolate ===
  true && order === 0 && maxWorkers === 1` into a `sequential` group appended after every numbered group, and the groups
  run in array order. Stryker's runner (`vitest-test-runner.js:105-140`) forces `maxWorkers: 1` and leaves `isolate` at
  its default (true), so under Stryker a project at `groupOrder: 0` runs **last**.
- With the checker on, Stryker splits `concurrency` between checker and test-runner processes
  (`concurrent/concurrency-token-provider.js:19-23`: `ceil(c/2)` checkers, `floor(c/2)` test runners), so today's
  `concurrency: 8` is four checkers and four test runners; op 004's "eight runs on four cores" was with the checker off.

So a static mutant that only a token test kills waits behind every other project's files. Op 004 measured exactly
that: its `""` mutants pass `contrast.test.ts` and the long files, and `source-table.test.ts` and the story list tests
come after the limit.

**The checker's share** (spec FR-009 runs the checker on). 001 measured the TypeScript checker as the dominant shard
cost: on 206 mutants of one file (`gates/bin/pins.ts`), 197 s with it against 15 s without at concurrency 4, and
197 s → 140 s going from concurrency 4 to 8 (001 `reviews/phase-4/mutation-shards.md:59-63`, `round-1-fixes.md` R1-02).
`@stryker-mutator/typescript-checker` 10.1.1 never groups mutants of one file, so each is checked alone: about 0.9 s
per mutant at concurrency 4 and 0.6 s at 8. One `source.ts` entry holds up to 224 mutants (op 004, `121-180`), so the
checker alone is expected at about 135 s at concurrency 8 and about 200 s at 4, close to or above the 176 s bound
whatever the test order. Core 10.1.1 pipelines checking and test runs (`executeCheck` feeds `executeRunInTestRunner`),
so log timestamps do not separate the two; the split is measured by 001's method (R-06).

**Decision: lever 1, run the token tests first in Stryker's runs.** `vitest.mutation.config.ts` gives the `tokens`
project `sequence.groupOrder: 1` and every other project `2`; no project is left at `0`, which under Stryker's
`maxWorkers: 1` would join the trailing sequential group. Only Stryker's configuration changes; `pnpm test` keeps its
order. Within a group the default sequencer still applies. Every op 004 Timeout's killer
(`packages/tokens/test/source-table.test.ts`, op 004 `mutation/README.md` § Timeouts) is in the `tokens` project, so
with bail each such mutant stops after the token tests instead of after the slow files. The token project's tests are
unit tests on the generator's outputs (`expected.ts`), which is what FR-011 asks the kill to assert.

Cost for other files: a static mutant of another file now runs the token tests first (seconds); a non-static mutant
runs only the tests that cover it (`testFilter`), whose order the group setting changes only between projects. FR-013's
before/after runs measure it.

**Lever 2, only if lever 1 misses FR-010 on the sandbox: concurrency, a measured choice in either direction.**
`stryker.config.json` sets `concurrency: 8` (four checkers and four test runners with the checker on) on a 4-core
sandbox. A lower value gives the test runs more of the cores, which the limit was set under; a higher one helps the
checker, which 001 measured (197 s at 4 → 140 s at 8). So the candidates are measured, not assumed: today's 8, one lower
(4) and one higher (12), each on the slowest `source.ts` entry with the checker split of R-06, and the value kept is the
one that brings the slowest entry within 176 s without making FR-013's reference entries slower. If the checker's share
alone (R-06) exceeds 176 s for an entry, no concurrency on four cores can fix that entry, and the plan goes straight to
lever 3.

**The CI runner's core count is not settled.** The constitution (§ Technology) keeps the repository internal until
1.0.0. 001's records conflict: `reviews/spec/check-1-fixes.md` SPEC-1-11 records the CI runner as "`ubuntu-latest`,
2 vCPU while internal", while 001 `reviews/phase-4/round-2.md:27` calls it 4-vCPU; GitHub documents 2 vCPUs for the
standard Linux runner of private and internal repositories and 4 for public ones. So the CI measurement (R-07) records
the core count of the runner that ran each `source.ts` shard (from the job log's "Set up job" runner section; if that
section does not state it, from the repository's visibility at the time and GitHub's documented size for it, said as
such). Lever 2's candidate is chosen for both cases: on a 4-vCPU runner the sandbox measurement stands for CI; on a
2-vCPU runner the candidates are also measured on the sandbox with the gate pinned to two cores (`taskset -c 0,1`, which
`os.availableParallelism()` follows), and that ranking chooses the value. Either way the CI figures of FR-010 decide.

**Lever 3, only if levers 1 and 2 miss FR-010, or the checker's share alone exceeds 176 s: FR-014.** The operator
decides an amendment of 001 FR-013 (for example a bound on mutants per entry), recorded with its date; the plan gains
its design then.

**Not levers** (spec FR-012): a lower `timeoutFactor` or `timeoutMS`; `ignoreStatic`; excluding mutators or the file;
disable comments; dropping projects from `vitest.mutation.config.ts`; changing `Group` or `TokenRecord`.

**Alternatives.**

- A custom sequencer, shortest file first: generic, but it needs gate-tested code and its order depends on a duration
  cache the Stryker sandbox may not keep; `groupOrder` is a documented Vitest setting and deterministic. Kept as the
  fallback inside lever 1 if `groupOrder` does not reorder within Stryker's runner (the red-to-green run shows it).
- A higher `timeoutFactor`: turns the late kills into kills but keeps the whole-suite wait per mutant, so the entry
  time stays far above 176 s. Rejected as a lever for FR-010 (it may still be measured, not chosen).
- `vitest.related: true`: Stryker would pick related test files, but `source.ts`'s killers import the generator, not
  always `source.ts` directly, and a wrong relation turns kills into survivors. Rejected.

**Red-first.** Lever 1 is configuration. Its proof is twofold.

- A behavioural red test in `gates/test/integration/vitest-mutation-config.test.ts` (the `gates-integration` project,
  which Stryker does not run): it creates Vitest through `createVitest` of `vitest/node` with Stryker's options
  (`vitest.mutation.config.ts`, `maxWorkers: 1`, `maxConcurrency: 1`, `bail: 1`, as `vitest-test-runner.js:105-140`
  passes them), records each test module's start with a reporter, stops the run once a module of a second project
  starts, and asserts that every `tokens` module started before any module of another project. It is red today (tokens
  runs last by name) and red for the `0`/`1` design (tokens in the trailing sequential group), and green only for an
  order that really runs the token tests first.
- The existing assertion `expect(mutation).toEqual(all.filter(...))` (:40) deep-compares the mutation projects with
  `vitest.config.ts`'s and breaks as soon as only the mutation config adds `sequence`. It is replaced by a stricter one:
  each mutation project, with `test.sequence.groupOrder` removed, deep-equals its `vitest.config.ts` counterpart (so no
  other setting may differ), and the `groupOrder` values are asserted exactly (`tokens` 1, every other project 2). The
  replacement and its reason are stated in the phase review (Principle VIII).

The FR-011a measurement runs before and after carry the timing (Principle VIII exemption for configuration, spec
FR-011a). Lever 2 is configuration with no assertable behaviour beyond the measurement; its review states that.

## R-06 The measurement run (spec FR-009 to FR-011a, FR-013)

**Base.** `B = ec0f533~1`, the parent of mission 002's merge on `main`. Against it every line of
`packages/tokens/src/source.ts` (230 lines), `packages/tokens/src/generate.ts` and `gates/lib/wcag.ts` is added
(`git diff --stat ec0f533~1 HEAD`: 230, 300 and 26 lines), so one base serves FR-009 and FR-013 (spec check 3).

**When the red runs are taken** (spec FR-011a, "on the code before the mission's change"): first, at the mission's
phase base, before any User Story 1 code, so the gate and the configuration are those of `main`. That gate prints no
Timeout or CompileError line, so each red run's statuses are read from its kept `mutation.json`. The FR-013 reference
entries and the checker split below are taken in the same pass. User Story 1 then proceeds as planned, and the green
runs, made with the User Story 1 gate, print the report lines.

**Command,** from the repository root, one entry at a time, one heavy job at a time:

```sh
/usr/bin/time -f '%e s' pnpm --silent run gate:mutation -- --base "$B" --files "<entry>"
```

with `OCELLE_CHROMIUM_PATH` set and `PLAYWRIGHT_BROWSERS_PATH` pointing at the alias of
`knowledge/speckit-flows/findings/frontend-missions.md` § Browser path. The entries are those `--plan` prints for `B`
(`source.ts:1-60`, `61-120`, `121-180`, `181-230`); the cut count it writes to stderr is recorded. Each run keeps its
stdout, its stderr, its time and a copy of `reports/mutation/mutation.json`.

**The checker split** (001's method, PLAN-CORRECTNESS-1-002): for each `source.ts` entry in the red pass, and for any
green entry over 176 s, the same entry is run once more with `"checkers": []` in `stryker.config.json` (a scratch edit
in the working tree for that run only, restored with `git checkout -- stryker.config.json`, never `git stash`). The
difference of the two wall times is the checker's share, recorded beside each entry; the expected share from 001's
figures (R-05) is recorded with it.

**FR-013 reference entries:** `packages/tokens/src/generate.ts`'s first `--plan` entry and `gates/lib/wcag.ts`, same
command, before and after. They are compared **per mutant**, by location (start line and column) and mutator, not only
by counts: no mutant Killed before may be Timeout, Survived or NoCoverage after, and no count may move the wrong way.
Timeout counts vary with load (op 004: `121-180` gave 105 and 97 Timeouts on two runs), so a Killed → Timeout move
triggers one re-run of both the before and the after run of that entry, one at a time, before it is called a
regression; both pairs of runs are recorded, and the move counts as a regression only if the re-run shows it again.

**Where it is kept:** `specs/007-mutation-gate-strictness/evidence/` (`red/`, `green/`, one folder per entry, and a
`README.md` table like op 004's: mutants, Killed, Timeout, Survived, NoCoverage, CompileError, time, checker share,
within 176 s).

**FR-011's per-mutant record.** A script in the evidence folder is not needed: the README lists every former Timeout
mutant by record name, field, theme and mutator, with its red and green status and, for Killed, the report's `killedBy`
and `statusReason`, and the report's `testsCompleted` for each former Timeout in the green run (how far the run got
before the kill, which shows the token tests ran first) (spec check 3, SPEC-3-03). Stryker's runner uses `bail: 1`
(`vitest-test-runner.js:138`), so `killedBy` names only the first failing test, and the report carries `statusReason:
result.failureMessage` for every Killed mutant (`mutation-test-report-helper.js:78-86`). A former Timeout that ends
Killed meets FR-011 only when all three hold, each checked and noted in the README row:

1. every test named in `killedBy` is in the `tokens` project (`packages/tokens/test/`);
2. `statusReason` is an assertion failure (an `expect` mismatch), not an error thrown at module load or in setup;
3. the `statusReason` message or the killing test's name names the mutated record (its name, field or value) or its
   group.

A mutant that fails any of them does not meet FR-011 and is handled like a remaining Timeout (the next lever). One
Killed mutant per group (B, C, and A if any) is applied by hand to a scratch copy and the token tests run, as op 004
did; the working tree is restored from git afterwards, never with `git stash`.

## R-07 The CI measurement (spec FR-010, *Assumptions* "CI measurement")

**The measurement commit** (operator, SPEC-1-04, "Measure commit on the PR (Recommended)"). At landing
(`/ocelle-land`), a commit on the mission's pull request appends a trailing space to **every** line of
`packages/tokens/src/source.ts`, the 8 blank lines included (`grep -c '^\s*$'` gives 8 of 230; a space on a blank line
changes no output). With blank lines left unchanged, `splitFile` (shards.ts:47-68), which cuts after every 60 changed
lines, would cut at other lines than the sandbox entries. The commit changes no output: the token build compares `dist/`
byte for byte before and after (a trailing space inside a template literal would change output, so the commit first
checks that `source.ts` has none; it has no template literals today). Before it is pushed, `--plan` against the pull
request's base is run locally and must list exactly the four sandbox entries `source.ts:1-60`, `61-120`, `121-180`,
`181-230`; that plan output (stdout and the cut line) is recorded with the evidence. CI's `mutation-plan` then makes the
four `source.ts` entries; the evidence records which entries each shard held, each `gate:mutation` step time as GitHub
reports it, the runner's core count (R-05) and the run link. A `git revert` commit follows before merge. A job other
than the mutation jobs that fails on that commit only because of the trailing spaces (a format or lint check) does not
count for or against FR-010, and the revert restores it; the evidence says so if it happens.

**A mixed shard that misses 480 s** (spec *Assumptions*: "the `source.ts` entry is measured again on CI in a shard that
holds it alone (the plan says how that run is made), and that time decides"). The mixing comes only from the mission's
own changes sharing the diff. `ci.yml` runs on `pull_request` with no branch filter, and `mutation-plan` and
`mutation-shard` take `--base` from the pull request's base, so a pull request whose base is the mission's head (the
feature branch before the measurement commit) and whose only commit is the measurement commit has a diff of `source.ts`
alone; `planShards` never puts two entries of one file in one shard, so its plan is four `source.ts`-only shards. No
workflow change is needed. That pull request is a draft, closed unmerged once its times, core count and run link are
recorded, and it is made only for this case: the primary measurement stays the commit on the mission's pull request, as
the operator chose. The orchestrator opens no pull request and pushes only the feature branch (the operator's rule for
this run), so the landing pass prepares the measurement branch's commit and asks the operator to push it and open the
draft; its times then decide for the entries it holds.

**An alone shard that still misses 480 s** does not meet FR-010; a time over 480 s is never accepted as measured. The
landing pass then brings it to the operator as a decision at the landing gate, with two options: apply lever 2 (R-05)
and measure again, or amend 001 FR-013 under FR-014. Neither is a follow-up. The tasks keep this step for landing and do
not mark FR-010's CI half done before it.

## R-08 Records

`specs/001-repository-foundation/spec.md` FR-011 gains a dated amendment paragraph (2026-11-10, mission 007, the
operator's three answers and the report of FR-001 to FR-004), after the existing text. The mutation rows of
`specs/001-repository-foundation/contracts/gate-cli.md` and of `gates/README.md` gain the report lines and the new
plants, and gate-cli's mutation exit-2 cell gains the new `--files` cause of R-03 (a file named more than once, operator
decision 2026-11-10, PLAN-CORRECTNESS-1-005 (a)). The same dated 007 amendment covers the location rule: 001
`contracts/gate-cli.md:8` and 001 `data-model.md` § Finding (`location` row) allow only `path:line`, `path` or a commit
hash, while a zero-mutant line's location is the entry, `path:start-end` in a range shard. The amendment notes, in the
general location rule and in the mutation row, that the mutation gate's report lines (rules `timeout`,
`compile-error`, `zero-mutants`), which are not findings, may carry `path:start-end`.

The story review command reads the gate's lines (`.specify/extensions/story/commands/speckit.story.review.md:41-45` and
its copy `tooling/speckit/extensions/story/commands/speckit.story.review.md`: the phase reviewer runs `pnpm run
gate:mutation -- --base <sha>` and treats a surviving mutant as blocking). Both copies gain one sentence: the `timeout`,
`compile-error` and `zero-mutants` lines are reports to read, not blocking findings (spec FR-005; the edge case leaves a
`source.ts` Timeout to the reviewer). `gates/test/gates-readme.test.ts` checks the README against the plants, so the
README row and the plant list change together. `knowledge/speckit-flows/log.md` (zero-mutant candidate) and
`findings/frontend-missions.md` § Mutation shard time are closed with how they were resolved. FR-013 and SC-005 of 001
change only under lever 3.
