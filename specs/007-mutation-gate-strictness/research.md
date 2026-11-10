# Research: Mutation gate strictness (007)

Read on 2026-11-10 from the repository at `9954fbb`, with `node_modules` installed (`pnpm install --frozen-lockfile`):
Stryker 10.1.1 (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`), Vitest 5.0.5. Each item gives the decision,
the reason and what else was weighed.

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
summary (exit 0), Timeouts first, then CompileErrors, then zero-mutant entries, each group in the order of the changed
files and then of the start line and Stryker's mutant id. `<replacement>` goes through `oneLine` as findings do.

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
(`[{ "location", "rule", "message"? }]`); when it is present the judge compares the plant's report lines with the run's
the way it compares records (missing and unexpected both fail). When it is absent, report lines are not checked, so
every existing pass plant keeps its verdict without a change (FR-008, SC-002). A fail plant also accepts `reports`, so
the exit-1 case (spec US1 AS5) can be planted.

Plants:

| Plant | Change | Proves |
|---|---|---|
| `pass-compile-error` | adds `reports` with its one `compile-error` line | FR-002, AS2 |
| `pass-zero-mutant` (new) | a type-only change to one package source file; `reports` with its `zero-mutants` line | FR-003, AS3, on a real Stryker run where no entry has a mutant (FR-008) |
| `pass-fully-checked` | adds `reports: []` | AS4: no report line when every mutant is killed |
| `pass-timeout` (new) | not added: see below | |

**Timeout is proven by gate tests, not a plant.** A real Timeout needs a mutant whose test run outlasts Stryker's limit;
a plant built on wall time is flaky on CI (spec check 1, SPEC-1-13). The spec allows a gate test (FR-008). The
in-process gate tests (`gates/test/mutation-*.test.ts`, with the Stryker doubles of `gates/test/mutation-fakes.ts`) feeds a recorded report with a `Timeout` mutant
on a changed line and asserts the line and the summary; `gates/test/mutation-report.test.ts` covers the classification;
`gates/test/plant-judge.test.ts` covers the judge's `reports` key with a Timeout line.

**Alternatives.** Let the judge ignore every report line and never check them: then no plant proves FR-001 to FR-003 on
the real gate. Rejected. Make every pass plant list its report lines: churn on eleven plants for no new proof. Rejected.

## R-03 Zero-mutant entries

**Decision.** `classifyMutants` returns, besides the findings and the mutant count, the Timeout and CompileError mutants
and the entries that had no mutant on their changed lines. It already loops over the selected `ChangedFile`s; an entry
is zero-mutant when that loop counted no mutant for it. To name a shard entry exactly as given, `selectFiles`
(`gates/lib/mutation/shards.ts`) carries the entry text on each selected file (`entry`), which it already holds in
`read`; a whole-diff run uses the path. One file never has two entries in one shard (001 FR-013), so one selected file is
one entry.

**"Stryker read".** The gate sees no positive "read" signal (spec FR-003): a file Stryker did not read already ends the
run as exit 2 (`unreadEntries`), before the classification. So every entry that reaches the classification was read.

**Real run with no mutant at all.** Whether Stryker 10.1.1 writes a JSON report when no `mutate` entry has a mutant is
not known from reading (spec check 2, SPEC-2-06). The new `pass-zero-mutant` plant runs exactly that case on the real
gate; the first task of User Story 1 runs it before any code change, and its outcome decides:

- report written (`files` empty or the file listed with no mutants): the plant passes once the report line exists;
- no report written: the gate today ends exit 2 ("Stryker wrote no report"). That would be a pre-existing defect that the
  spec's edge case ("a run in which no entry has any mutant … passes") rules out, so it is fixed in this story, test
  first: when Stryker's output states that it found no mutants (its "No files marked to be mutated" or "Found 0 of
  … file(s) to be mutated" log line, or its `0 Mutant(s) generated` line; the task records which line 10.1.1 prints),
  every entry is zero-mutant and the run passes. Any other run without a report stays exit 2.

**Alternatives.** Count zero-mutant entries per file across shards: impossible within one shard (spec check 1,
SPEC-1-01). Rejected.

## R-04 Summary lines

**Decision** (the contract fixes the wording, `contracts/mutation-output.md`). Both closing lines gain the three counts,
each also when zero:

- exit 0: `mutation: <n> mutants on the changed lines of <f> files, none survived; <t> timeouts, <c> compile errors,
  <z> zero-mutant entries; <r> equivalent records`
- exit 1: `mutation: <k> findings in <f> changed files (<n> mutants on changed lines; <t> timeouts, <c> compile errors,
  <z> zero-mutant entries)`

`plural()` gives the singular forms. The "nothing to mutate" line (no changed in-scope file) is unchanged: it has no
entries, so all three counts would be zero, and it names the base, which the reviewer needs (spec check 3, SPEC-3-01).

**Alternatives.** Counts only on the pass line: AS5 asks the Timeout to stay visible next to the findings, and the counts
belong with it. Rejected.

## R-05 Why the `source.ts` mutants time out, and the lever

**What Stryker does** (`@stryker-mutator/vitest-runner` 10.1.1, `dist/src/vitest-test-runner.js`):

- Every test-runner process runs Vitest with `maxWorkers: 1`, `maxConcurrency: 1` and `bail: 1`: the test files run one
  after the other, and the run stops at the first failing test.
- A static mutant (one executed at module load, as every `source.ts` record is) has no per-test coverage, so with
  `ignoreStatic` off it runs every test of `vitest.mutation.config.ts`.
- The limit is `timeoutFactor × netTime + timeoutMS + overhead` (`@stryker-mutator/core`
  `dist/src/mutants/mutant-test-planner.js:124`), about 32 s in op 004's runs.
- Vitest 5.0.5's `BaseSequencer.sort` orders files by `sequence.groupOrder` first, then failed-before-passed, then
  **longest recorded duration first** (file size when there is no result).

So a static mutant that only a fast test kills waits behind every slow file sorted before it. Op 004 measured exactly
that: its `""` mutants pass `contrast.test.ts` and the long files, and `source-table.test.ts` and the story list tests
come after the limit with eight runs on four cores.

**Decision: lever 1, run the token tests first in Stryker's runs.** `vitest.mutation.config.ts` gives the `tokens`
project `sequence.groupOrder: 0` and every other project `1`. Only Stryker's configuration changes; `pnpm test` keeps
its order. Within a group the default sequencer still applies. Every op 004 Timeout's killer
(`packages/tokens/test/source-table.test.ts`, op 004 `mutation/README.md` § Timeouts) is in the `tokens` project, so
with bail each such mutant stops after the token tests instead of after the slow files. The token project's tests are
unit tests on the generator's outputs (`expected.ts`), which is what FR-011 asks the kill to assert.

Cost for other files: a static mutant of another file now runs the token tests first (seconds); a non-static mutant
runs only the tests that cover it (`testFilter`), whose order the group setting changes only between projects. FR-013's
before/after runs measure it.

**Lever 2, only if lever 1 misses FR-010 on the sandbox: concurrency to match the cores.** `stryker.config.json` sets
`concurrency: 8` on a 4-core sandbox; GitHub's `ubuntu-24.04` runners for public repositories have 4 vCPUs. Eight runs
on four cores make every run about twice as slow as the dry run that set the limit. The measured candidate is
`concurrency: 4`; it is kept only if it improves the slowest `source.ts` entry without making FR-013's reference
entries slower.

**Lever 3, only if levers 1 and 2 miss FR-010: FR-014.** The operator decides an amendment of 001 FR-013 (for example a
bound on mutants per entry), recorded with its date; the plan gains its design then.

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

**Red-first.** Lever 1 is configuration. Its proof is twofold: `gates/test/integration/vitest-mutation-config.test.ts`
(which already reads `vitest.mutation.config.ts`) gains an assertion that the `tokens` project's group sorts first,
red before the change; and the FR-011a measurement runs before and after (Principle VIII exemption for the timing,
spec FR-011a). Lever 2 is configuration with no assertable behaviour beyond the measurement; its review states that.

## R-06 The measurement run (spec FR-009 to FR-011a, FR-013)

**Base.** `B = ec0f533~1`, the parent of mission 002's merge on `main`. Against it every line of
`packages/tokens/src/source.ts` (230 lines), `packages/tokens/src/generate.ts` and `gates/lib/wcag.ts` is added
(`git diff --stat ec0f533~1 HEAD`: 230, 300 and 26 lines), so one base serves FR-009 and FR-013 (spec check 3).

**Command,** from the repository root, one entry at a time, one heavy job at a time:

```sh
/usr/bin/time -f '%e s' pnpm --silent run gate:mutation -- --base "$B" --files "<entry>"
```

with `OCELLE_CHROMIUM_PATH` set and `PLAYWRIGHT_BROWSERS_PATH` pointing at the alias of
`knowledge/speckit-flows/findings/frontend-missions.md` § Browser path. The entries are those `--plan` prints for `B`
(`source.ts:1-60`, `61-120`, `121-180`, `181-230`); the cut count it writes to stderr is recorded. Each run keeps its
stdout, its stderr, its time and a copy of `reports/mutation/mutation.json`.

**FR-013 reference entries:** `packages/tokens/src/generate.ts`'s first `--plan` entry and `gates/lib/wcag.ts`, same
command, before and after.

**Where it is kept:** `specs/007-mutation-gate-strictness/evidence/` (`red/`, `green/`, one folder per entry, and a
`README.md` table like op 004's: mutants, Killed, Timeout, Survived, NoCoverage, CompileError, time, within 176 s).

**FR-011's per-mutant record.** A script in the evidence folder is not needed: the README lists every former Timeout
mutant by record name, field, theme and mutator, with its red and green status and, for Killed, the killing test from
the report's `killedBy` and the assertion it fails on (spec check 3, SPEC-3-03). One Killed mutant per group (B, C, and
A if any) is applied by hand to a scratch copy and the token tests run, as op 004 did; the working tree is restored
from git afterwards, never with `git stash`.

## R-07 The CI measurement (spec FR-010, *Assumptions* "CI measurement")

At landing (`/ocelle-land`), a commit on the mission's pull request appends a trailing space to every line of
`packages/tokens/src/source.ts` that is not blank, in a form that changes no output: the token build compares `dist/`
byte for byte before and after (a trailing space inside a template literal would change output, so the commit first
checks that `source.ts` has none; it has no template literals today). CI's `mutation-plan` then makes the four
`source.ts` entries; the evidence records which entries each shard held, each `gate:mutation` step time as GitHub
reports it and the run link. A `git revert` commit follows before merge.

If a shard that holds a `source.ts` entry together with other files' entries (the mission's own gate changes are in
the same diff) misses 480 s, its time is only an upper bound for the entry (spec *Assumptions*). CI gives no way to run
one entry alone without a workflow change, which the operator did not choose (SPEC-1-04). So the landing pass then
brings the measured times to the operator as a decision at the landing gate, with these options: accept the upper
bound as measured; apply lever 2 and measure again; or amend 001 FR-013 under FR-014. None of them is a follow-up. The
tasks keep this step for landing and do not mark FR-010's CI half done before it.

## R-08 Records

`specs/001-repository-foundation/spec.md` FR-011 gains a dated amendment paragraph (2026-11-10, mission 007, the
operator's three answers and the report of FR-001 to FR-004), after the existing text. The mutation rows of
`specs/001-repository-foundation/contracts/gate-cli.md` and of `gates/README.md` gain the report lines and the new
plant. `gates/test/gates-readme.test.ts` checks the README against the plants, so the README row and the plant list
change together. `knowledge/speckit-flows/log.md` (zero-mutant candidate) and `findings/frontend-missions.md`
§ Mutation shard time are closed with how they were resolved. FR-013 and SC-005 of 001 change only under lever 3.
