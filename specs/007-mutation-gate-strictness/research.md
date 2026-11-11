# Research: Mutation gate strictness (007)

Read on 2026-11-10 from the repository at `9954fbb`, with `node_modules` installed (`pnpm install --frozen-lockfile`):
Stryker 10.1.1 (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`), Vitest 5.0.5. Each item gives the decision,
the reason and what else was weighed. Amended on 2026-11-10 by plan squad round 1 (`reviews/plan/round-1/refute.md`,
`fixes-1.md`), rechecked against the same installed sources. Amended again by plan squad rounds 2 and 3 (`reviews/plan/round-2/`,
`reviews/plan/round-3/`, `fixes-1.md` of each).

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
`gates/test/mutation-shards.test.ts:574,583,665,717`, and every other exact `mutation:` summary the US1 task finds
with `grep -rn '"mutation: ' gates/test`. The summary at `mutation-shards.test.ts:589` (the second half of "entries of
one file joined") is not extended: R-03 replaces that half with the repeated-file exit-2 case, which prints the
`mutation: could not run:` cause, not a summary with counts. The "nothing to mutate" line (no changed in-scope file) is unchanged: it has
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

**One token test kills by how Stryker activates mutants, not by the value** (plan squad round 3, PLAN-FRESH-3-001).
A static mutant is switched on only inside the Vitest worker: `@stryker-mutator/vitest-runner` 10.1.1
`dist/src/stryker-setup.js:17-21` sets `ns.activeMutant = inject('activeMutant')`. The instrumenter's header
(`@stryker-mutator/instrumenter` `dist/src/util/syntax-helpers.js:17-18`) falls back to the environment variable
`__STRYKER_ACTIVE_MUTANT__`, but in the installed packages only core's `command-test-runner.js:62` sets it; the Vitest
runner sets only `NODE_ENV` and `VITEST` (`vitest-test-runner.js:260-264`), and `gates/lib/mutation/coverage.ts`
`strykerEnv` adds only the coverage preload. `packages/tokens/test/build.test.ts:78-87` ("node scripts/build.ts
<out>" / "writes exactly css() to tokens.css and JSON.stringify(json()) to tokens.json") spawns `node
scripts/build.ts` as a child process, which imports the sandbox's instrumented `../src/source.ts` with no active
mutant, and then asserts `tokens.css` `toBe(css(source))` with `css(source)` computed in the worker, where the mutant
is active. So every static `source.ts` mutant that changes the stylesheet fails that test by an `expect` mismatch,
equivalent or not: the child's output is the unmutated one. Op 004 never saw it kill because the tokens project ran
last, and its by-hand runs edited the file on disk, so the child was mutated too. The same holds, for the same reason,
for any token test whose expectation is not computed from `expected.ts`: a kill by `build.test.ts`, or by a test that
runs before `source-table.test.ts` only by chance, says nothing about the record's value or group (spec FR-011). And
within one project and one `groupOrder` the default sequencer orders by recorded failure and duration, or, with no
result yet, larger files first (`BaseSequencer.sort`, :7796-7803): `validate.test.ts` (15 117 bytes),
`generate.test.ts` (7 447) and `build.test.ts` (5 709) all come before `source-table.test.ts` (5 457), and a file that
failed once goes first again. So moving the whole `tokens` project first does not decide which token test names the
kill.

**The checker's share** (spec FR-009 runs the checker on). 001 measured the TypeScript checker as the dominant shard
cost: on 206 mutants of one file (`gates/bin/pins.ts`), 197 s with it against 15 s without at concurrency 4, and
197 s → 140 s going from concurrency 4 to 8 (001 `reviews/phase-4/mutation-shards.md:59-63`, `round-1-fixes.md` R1-02).
`@stryker-mutator/typescript-checker` 10.1.1 never groups mutants of one file, so each is checked alone: about 0.9 s
per mutant at concurrency 4 and 0.6 s at 8. One `source.ts` entry holds up to 224 mutants (op 004, `121-180`), so the
checker alone is expected at about 135 s at concurrency 8 and about 200 s at 4, close to or above the 176 s bound
whatever the test order. Core 10.1.1 pipelines checking and test runs (`executeCheck` feeds `executeRunInTestRunner`),
so log timestamps do not separate the two. The checker split of R-06 is recorded beside each entry as a diagnostic
only: it does not measure the checker's share (PLAN-FRESH-2-002), and no lever is chosen or skipped on it.

**Decision: lever 1, run `source-table.test.ts` first, then the other token tests, in Stryker's runs** (operator
decision, human:jeroennouwsdev, 2026-11-10, plan squad round 3, PLAN-FRESH-3-001 (a) "source-table first"). In
`vitest.mutation.config.ts` only, the `tokens` project of `vitest.config.ts` is split in two:

- `tokens-source-table`: the `tokens` project's settings with `name: "tokens-source-table"`, `include:
  ["packages/tokens/test/source-table.test.ts"]` and `sequence: { groupOrder: 1 }`;
- `tokens`: the `tokens` project's settings with `packages/tokens/test/source-table.test.ts` added to its `exclude`
  and `sequence: { groupOrder: 2 }`;
- every other mutation project: `sequence: { groupOrder: 3 }`.

No project is left at `0`, which under Stryker's `maxWorkers: 1` would join the trailing sequential group; every
project has `maxWorkers: 1` under Stryker, so `groupSpecs` accepts several projects at one order (:6281-6286). Only
Stryker's configuration changes; `pnpm test` keeps its projects and order. `tokens-source-table` is alone at order 1
and holds one file, so `source-table.test.ts` runs first in every Stryker run whatever the result cache, the file
sizes or an earlier failure say; within `tokens` and within order 3 the default sequencer still applies. Every op 004
Timeout's killer (`packages/tokens/test/source-table.test.ts`, op 004 `mutation/README.md` § Timeouts) is now the
first file, so with bail each such mutant stops after that one file, and its kill is by a test that compares every
record's value or group with `expected.ts` (R-06 criterion 3), never by `build.test.ts`'s unmutated child process.
The rest of `tokens` still runs before the other projects, as the round 2 design had it, so a static `source.ts` mutant
that only another token test kills does not wait behind them either. The split adds no file and no module:
`gates/lib/plant-repo.ts:39` copies `vitest.mutation.config.ts` into each mutation plant's temporary repository, where
`tokens-source-table` matches no file and runs nothing, as every project without a test file there already does.

Cost for other files: a static mutant of another file now runs the token tests first (seconds); a non-static mutant
runs only the tests that cover it (`testFilter`), whose order the group setting changes only between projects. FR-013's
before/after runs measure it.

Cost for `source.ts` itself (plan squad round 3, PLAN-FRESH-3-004): op 004's kept reports
(`ops/004-token-source-mutation/mutation/entry-1_60.json`, `entry-61_120.json`) show 135 and 202 `source.ts` mutants,
all Killed and every one by `gates/test/contrast.test.ts`; 55 + 96 of them sit on a line holding `contrast` or
`grounds`, and 19 on the ground arrays (`source.ts:13-27`). No token test is expected to kill those: the JSON export
has no contrast field (`json.test.ts` "has no use or contrast field"), `source-table.test.ts` asserts values, groups
and references only, contrast fields do not reach the stylesheet (so `build.test.ts` does not kill them either), and
only `validate.test.ts` "accepts the real source" may kill some. Under lever 1 they die only after every token file,
`build.test.ts`'s two child Node processes included, instead of at the fourth file the run reaches today, within the
same ≈32 s limit. Entries `1-60` and `61-120` had no Timeout in op 004 (58 s and 65 s); a Timeout that lever 1 causes
there is caught by FR-009's zero-Timeout rule and named as lever 1's by R-06's per-mutant comparison of the `source.ts`
entries, before lever 2 is tried.

**Lever 2, only if lever 1 misses FR-010 on the sandbox: concurrency, a measured choice in either direction.**
`stryker.config.json` sets `concurrency: 8` (four checkers and four test runners with the checker on) on a 4-core
sandbox. A lower value gives the test runs more of the cores, which the limit was set under; a higher one helps the
checker, which 001 measured (197 s at 4 → 140 s at 8). So the candidates are measured, not assumed: today's 8, one lower
(4) and one higher (12), each on the slowest `source.ts` entry with the checker split of R-06, and the value kept is the
one that brings the slowest entry within 176 s without making FR-013's reference entries slower. Lever 2 is decided on
the measured entry time alone (FR-010) and is always tried before lever 3; the checker split (R-06) is a diagnostic and
never skips it (operator decision PLAN-FRESH-2-002 (a)).

**The CI runner's core count is not settled.** The constitution (§ Technology) keeps the repository internal until
1.0.0. 001's records conflict: `reviews/spec/check-1-fixes.md` SPEC-1-11 records the CI runner as "`ubuntu-latest`,
2 vCPU while internal", while 001 `reviews/phase-4/round-2.md:27` calls it 4-vCPU; GitHub documents 2 vCPUs for the
standard Linux runner of private and internal repositories and 4 for public ones. So the CI measurement (R-07) records
the core count of the runner that ran each `source.ts` shard (from the job log's "Set up job" runner section; if that
section does not state it, from the repository's visibility at the time and GitHub's documented size for it, said as
such). Lever 2's candidate is chosen for both cases: on a 4-vCPU runner the sandbox measurement stands for CI; on a
2-vCPU runner the candidates are also measured on the sandbox with the gate pinned to two cores (`taskset -c 0,1`, which
`os.availableParallelism()` follows), and that ranking chooses the value. Either way the CI figures of FR-010 decide.

**Lever 3, only if levers 1 and 2 both miss FR-010 on the measured entry time: FR-014.** The operator
decides an amendment of 001 FR-013 (for example a bound on mutants per entry), recorded with its date; the plan gains
its design then.

**Not levers** (spec FR-012): a lower `timeoutFactor` or `timeoutMS`; `ignoreStatic`; excluding mutators or the file;
disable comments; dropping projects from `vitest.mutation.config.ts`; changing `Group` or `TokenRecord`.

**Alternatives.**

- The `tokens` project at `groupOrder: 1`, unsplit (the round 2 design): the order within `tokens` is the default
  sequencer's, which puts `validate.test.ts`, `generate.test.ts` and `build.test.ts` before `source-table.test.ts`
  (above), so `killedBy` would often name `build.test.ts` and fail R-06 criterion 3 for a reason no time lever can
  change (PLAN-FRESH-3-001). Rejected.
- A custom sequencer that puts `source-table.test.ts` first (the other form operator decision PLAN-FRESH-3-001 (a)
  allowed): it is a new module, so it needs its own red test and mutation testing, and since `vitest.mutation.config.ts`
  would import it, it would join the configuration set every mutation plant copies (`gates/lib/plant-repo.ts:39`, and
  the lists of `gates/test/integration/mutation.test.ts:21`, `plant-repo.test.ts:21`, `plants-robustness.test.ts:38`,
  `plants.test.ts:29`). Vitest resolves `sequence.sequencer` from the root configuration for every project (vitest
  `index.1TqnEahn.js:4092-4094`), so it would also order every other project's files. The split is configuration
  only and uses the documented `groupOrder`. Kept as the fallback inside lever 1 if `groupOrder` does not reorder
  within Stryker's runner (the red-to-green run shows it); then it is written test first, gate-tested, and added to the
  configuration set and those lists.
- A higher `timeoutFactor`: turns the late kills into kills but keeps the whole-suite wait per mutant, so the entry
  time stays far above 176 s. Rejected as a lever for FR-010 (it may still be measured, not chosen).
- `vitest.related: true`: Stryker would pick related test files, but `source.ts`'s killers import the generator, not
  always `source.ts` directly, and a wrong relation turns kills into survivors. Rejected.

**Red-first.** Lever 1 is configuration. Its proof is twofold.

- A behavioural red test in `gates/test/integration/vitest-mutation-config.test.ts` (the `gates-integration` project,
  which Stryker does not run): it creates Vitest through `createVitest` of `vitest/node` with Stryker's options
  (`vitest.mutation.config.ts`, `maxWorkers: 1`, `maxConcurrency: 1`, `bail: 1`, as `vitest-test-runner.js:105-140`
  passes them), records each test module's start with a reporter, stops the run once a module of a project other
  than `tokens-source-table` and `tokens` starts, and asserts two things: `packages/tokens/test/source-table.test.ts`
  started before every other module, `build.test.ts`, `validate.test.ts` and `generate.test.ts` included; and every
  module under `packages/tokens/test/` (outside `browser/`) started before any module of another project. It is red
  today (tokens runs last by name), red for the `0`/`1` design (tokens in the trailing sequential group) and red for
  the unsplit `tokens`-at-`1` design (larger token files first, above), and green only for an order that runs
  `source-table.test.ts` first and the other token tests next.
- The existing assertion `expect(mutation).toEqual(all.filter(...))` (:40) deep-compares the mutation projects with
  `vitest.config.ts`'s and breaks as soon as the mutation config adds `sequence` or splits `tokens`. It is replaced by
  a stricter one. The mutation project names are exactly `["tokens-source-table", "tokens", "styles", "elements",
  "storybook", "gates"]`. Each mutation project, with its whole `test.sequence` key removed, deep-equals its
  `vitest.config.ts` counterpart (so no other setting may differ; no project of `vitest.config.ts` has a `sequence`
  key, and removing only `groupOrder` would leave `sequence: {}`, which `toEqual` does not ignore), with two stated
  exceptions: `tokens-source-table`'s counterpart is `tokens` with `name: "tokens-source-table"` and `include:
  ["packages/tokens/test/source-table.test.ts"]`, and the mutation `tokens` is its counterpart with that one path
  appended to `exclude`. Each mutation project's `test.sequence` deep-equals exactly `{ groupOrder: 1 }` for
  `tokens-source-table`, `{ groupOrder: 2 }` for `tokens` and `{ groupOrder: 3 }` for every other project, so no other
  `sequence` setting can hide behind the removal. And the test modules the mutation configuration collects (through
  `createVitest`, as above) are exactly those `vitest.config.ts` collects for its projects outside the excluded four,
  each once, so the split neither drops nor doubles a file (FR-012: no project's tests are dropped). The replacement
  and its reason are stated in the phase review (Principle VIII).

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
stdout, its stderr, its time and a copy of `reports/mutation/mutation.json`. *Amendment, 2026-11-11 (lever 3, spec
FR-014, "30-line entries, all files"):* after the bound change the measurement runs are those of the 30-line entries
`--plan` prints for `B` (`evidence/README.md` § Lever 3); the red runs above stay the 60-line runs, and the per-mutant
comparison matches each red entry against the 30-line entries that cover it.

**The checker split, a diagnostic** (001's method, PLAN-CORRECTNESS-1-002): for each `source.ts` entry in the red pass,
and for any green entry over 176 s, the same entry is run once more with `"checkers": []` in `stryker.config.json` (a
scratch edit in the working tree for that run only, restored with `git checkout -- stryker.config.json`, never
`git stash`). Both wall times and their difference are recorded beside each entry, with the expected figure from 001
(R-05), under the label "checker split (diagnostic, not the checker's share)". The difference is not the checker's
share: the two runs differ in test-runner count (`ceil(c/2)` checkers and `floor(c/2)` runners with the checker, `c`
runners without, `concurrency-token-provider.js:19-30`), in the mutants that reach the tests (with the checker off,
group A's CompileErrors run the suite), and in how much checking overlaps the tests
(`4-mutation-test-executor.js:55-61`). No lever is chosen or skipped on it (operator decision PLAN-FRESH-2-002 (a)):
levers 2 and 3 are decided on the measured entry time alone (FR-010), lever 2 always before lever 3.

**FR-013 reference entries:** `packages/tokens/src/generate.ts`'s first `--plan` entry and `gates/lib/wcag.ts`, same
command, before and after. They are compared **per mutant**, not only by counts. Each mutant is keyed by its start
(line, column), its end (line, column), its mutator and its replacement, read from `mutation.json`; one start can
carry several mutants (the `Regex` mutants of `gates/lib/wcag.ts:4`, the ConditionalExpression `true`/`false` pairs at
`:10` and `:16`), so start and mutator alone do not identify one. The comparison fails loudly, and decides nothing, if
a key repeats within one run's file or a key of the before run is missing after (or the reverse); it is then stated in
the README and the cause found before the entry is judged. Compared by that key: no mutant Killed before may be
Timeout, Survived or NoCoverage after, and no count may move the wrong way.
Timeout counts vary with load (op 004: `121-180` gave 105 and 97 Timeouts on two runs), so a Killed → Timeout move
triggers one re-run of both the before and the after run of that entry, one at a time, before it is called a
regression; both pairs of runs are recorded, and the move counts as a regression only if the re-run shows it again.

**The `source.ts` entries, per mutant too** (plan squad round 3, PLAN-FRESH-3-004). Each of the four `source.ts`
entries' red and green runs is compared by the same key (start and end line and column, mutator, replacement), with the
same loud failure on a repeated or unmatched key. Besides FR-011's Timeout → Killed record below, every mutant Killed in
the red run and Timeout in the green run is listed in the evidence README with its key, its red `killedBy` and, where the
report gives it, its green `testsCompleted`, and gets the same one re-run of both the red and the green run of that entry, one at a time; it is
called a Timeout that lever 1 caused only if the re-run shows it again, and both pairs are recorded. Op 004's
contrast-killed mutants of entries `1-60` and `61-120` (R-05, cost for `source.ts` itself) are where such a move is
expected if any. Lever 2 is tried only after this comparison is in the README, so a new Timeout is named as lever 1's
and not read as "lever 1 missed".

**Where it is kept:** `specs/007-mutation-gate-strictness/evidence/` (`red/`, `green/`, one folder per entry, and a
`README.md` table like op 004's: mutants, Killed, Timeout, Survived, NoCoverage, CompileError, time, checker split
(diagnostic), within 176 s).

**FR-011's per-mutant record.** A script in the evidence folder is not needed: the README lists every former Timeout
mutant by record name, field, theme and mutator, with its red and green status and, for Killed, the report's `killedBy`
and `statusReason`, and the report's `testsCompleted` for each former Timeout in the green run (how far the run got
before the kill, which shows the token tests ran first) (spec check 3, SPEC-3-03). Stryker's runner uses `bail: 1`
(`vitest-test-runner.js:138`), so `killedBy` names only the first failing test, and the report carries `statusReason:
result.failureMessage` for every Killed mutant (`mutation-test-report-helper.js:78-86`). A former Timeout that ends
Killed meets FR-011 only when all three hold, each checked and noted in the README row:

1. every test named in `killedBy` is a token test (`packages/tokens/test/`, the `tokens-source-table` or `tokens`
   project of the mutation configuration);
2. `statusReason` is an assertion failure (an `expect` mismatch), not an error thrown at module load or in setup;
3. `killedBy` is one of the named value/group tests of `packages/tokens/test/source-table.test.ts`, each of which
   compares every record's value or group with `expected.ts` per token:
   - "declares each token's light value (or its one value) in the unconditioned :root block" (light values, `:39`);
   - "declares each theme-dependent token's dark value under both dark selectors, where it differs from light" (dark
     values, `:45`);
   - "gives each token its group, its resolved value per theme (or its one value) and its references" (the JSON
     export's groups and values, `:76`).

   The list is fixed here, before any green run is read; a kill by any other test does not meet criterion 3.
   Under lever 1 `source-table.test.ts` is the first file of every run (R-05), so a kill by another test means that
   every one of these tests passed on that mutant; `build.test.ts` in particular kills through its unmutated child
   process (R-05) and is never by itself a kill on the record's value or group.

`statusReason` is recorded as given and is not judged for what it names; criterion 2 reads only its kind (an `expect`
mismatch or a thrown error). Stryker passes on only the first error's `message` (`vitest-helpers.js:37`), and for
these tests, which compare one object keyed by every token, Vitest truncates it to the first key
(`expected { 'space-0': '0.25rem', …(119) } to deeply equal …`), so it names no mutated record (PLAN-FRESH-2-001).
The tie of a kill to its record is shown by the by-hand application below, whose Vitest diff names the mutated key
(operator decision PLAN-FRESH-2-001 (a)); no test is changed for it.

A mutant that fails criterion 1, 2 or 3 does not meet FR-011 and is handled like a remaining Timeout (the next lever).
Message text alone (which record, field or value `statusReason` or a test name names) is never a criterion failure
and never triggers lever 2 or 3. One Killed mutant per group (B, C, and A if any) is applied by hand to a scratch copy
and the token tests run, as op 004 did; the Vitest diff of that run, which names the mutated key, is kept with the
evidence. The working tree is restored from git afterwards, never with `git stash`.

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
reports it, the runner's core count (R-05) and the run link. A `git revert` commit follows before merge.
*Amendment, 2026-11-11 (lever 3, spec FR-014):* `splitFile` now cuts after every 30 changed lines, so the local
`--plan` check expects the 30-line `source.ts` entries of `evidence/README.md` § Lever 3 (eight entries, `1-30` to
`211-230`), not the four 60-line entries named above; CI's `mutation-plan` then makes those eight entries, one shard
each or beside other files' entries. A job other
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

001's plant contract gains the same dated 007 amendment (plan squad round 3, PLAN-FRESH-3-003), since R-02 changes
what it fixes. `specs/001-repository-foundation/contracts/plants.md`: the `plant.json` shape (:4) gains the optional
`reports` key (mutation `pass` and `fail` plants only; on a plant of another gate an invalid `plant.json`); the
mutation row (:49) gains the pass plant `pass-zero-mutant`, the `reports` of `pass-compile-error` and
`pass-fully-checked`, and the breaking plant `error-zero-mutant-failing-test`; the plant-job failure rule (:61-65)
gains that a `pass` or `fail` plant with `reports` fails the job when the run's `timeout`, `compile-error` and
`zero-mutants` lines do not equal `reports` as a multiset, that `records` compares only `record` lines, and that
`reports` on a non-mutation plant is an invalid `plant.json`. `specs/001-repository-foundation/data-model.md` § Plant
(:20-35): a `reports` row (`plant.json`, mutation `pass` and `fail` only: `location`, `rule` one of the three report
rules, optional `message` substring; compared as a multiset), the `records` row's comparison limited to `record`
lines, and the **caught** and **accepted** state rules extended with "and, where given, exactly the expected
`reports`", the report lines never counted as findings.

Besides the plant judge, two texts read the gate's lines (contracts/mutation-output.md § Readers).
The story review command is one text in three tracked copies: its source
`tooling/speckit/extensions/story/commands/speckit.story.review.md`, the installed
`.specify/extensions/story/commands/speckit.story.review.md:41-45`, and the generated skill
`.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md:46-50`, which the
tracked symlink `.claude/skills/speckit-story-review/SKILL.md` points to and which the phase reviewer loads
(`.claude/agents/reviewer-renata.md:11`). In each, the phase reviewer runs `pnpm run gate:mutation -- --base <sha>`
and treats a surviving mutant as blocking. All three gain one sentence: the `timeout`, `compile-error` and
`zero-mutants` lines are reports to read, not blocking findings (spec FR-005; the edge case leaves a `source.ts`
Timeout to the reviewer). The source is edited and the extension reinstalled as `tooling/speckit/README.md:9-14`
says (`specify extension remove story && specify extension add --dev tooling/speckit/extensions/story`), which
regenerates both installed copies; where `specify` is not on the `PATH` (the sandbox has none), the same sentence is
written by hand into both installed copies, with the SKILL.md front matter unchanged. Either way, `diff` of each
installed copy against the source then shows only what it shows today (the SKILL.md front matter and final newline).
The landing skill `.claude/skills/ocelle-land/SKILL.md:117-120` runs `gate:mutation -- --base <merge-base> --files
<changed source>` and reads its output; it gains one sentence too: the report lines are not findings, and `--files`
names each changed file once (a file named twice ends exit 2, R-03). `gates/test/gates-readme.test.ts` checks the README against the plants, so the
README row and the plant list change together. `knowledge/speckit-flows/log.md` (zero-mutant candidate) and
`findings/frontend-missions.md` § Mutation shard time are closed with how they were resolved. FR-013 and SC-005 of 001
change only under lever 3.
