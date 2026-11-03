# Phase 3 review round 9 (operator round, with R8-01 of round 8): fixes

tasks.md T097 is done. Planner commit 621ed0a is the authoritative text: spec FR-013 and SC-005, research.md R-08,
contracts/gate-cli.md and contracts/ci-checks.md as amended there. Test commit f67d2cb holds only tests and fixtures.
`red.sh 3 fix-9` reports `"tests_only": true, "red": true, "recorded": true` (red-fix-9.log): 70 of 1229 tests fail,
and every failure is an `AssertionError` against the old code. None is a load error. Two test doubles were made
to fit the new cases in the red commit, so that every failure is an assertion:

- The fake Stryker's range regex in gates/test/mutation-fakes.ts got the `s` flag, so it takes any path the gate
  hands it, line terminators included. Without the flag, it threw on these paths.
- The split is tested through `planShards`, which research.md R-08 calls the pure split function. A new
  `splitFile` export would have failed as a `TypeError` at the red commit.

Some new cases passed at the red commit because the behaviour already existed. Following T097 step 2, they were not
forced red:

- the real `.github/workflows/ci.yml` passes each shard's `files` value unchanged to `--files`
  (gates/test/ci-workflow.test.ts, both cases). ci.yml is unchanged.
- `changedFiles` already reads all four line-terminator paths of the recorded diff into scope (round 7 put them in
  scope).
- a file of exactly 120 changed lines is one entry, its path.

The existing cases that asserted "a file over 250 lines is a shard on its own" (251 and 700 lines) now assert the
split, as T097 requires. So do the three cases whose files are now over 120 lines (150 + 100 + ..., 125 + 125,
200 + 51). Their old expectations no longer match the spec. Their bounds (exactly 250 fits, 251 splits, 10 entries)
are kept. The usage line in two `--base` and argument cases changed to the new `--files` form.

The task describes plant-judge.ts at fffb7e7 as 216 changed lines "across several ranges". Recorded against
bdb9b70 (gates/test/fixtures/git-diff/plant-judge.diff), it is a new file: one range, 1-216. The fixture case
asserts the split of that real diff into `:1-120` and `:121-216`. A separate synthetic case covers 216 lines across
four ranges with a cut inside one of them.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R8-01 | fixed. `unusable` now also matches `\n`, `\r`, U+2028 and U+2029, so a changed in-scope path holding a line terminator is exit 2 before Stryker runs, in a normal run, `--plan` and `--files`. The cause text `unusableKinds` names "a line terminator \n \r U+2028 U+2029". The cause names each path as JSON, and U+2028 and U+2029 are written as ` ` and ` ` there, so the cause stays one line in logs. contracts/gate-cli.md already lists the terminators (621ed0a). | gates/test/mutation-ranges.test.ts, "changedFiles and unusableMutatePaths: line terminators in paths" and "mutation gate: a changed path holding a line terminator". These run on gates/test/fixtures/git-diff/line-terminators.diff, recorded with git 2.43.0 from a scratch repository with new files whose names hold `\n`, `\r`, U+2028 and U+2029 (quoted headers `"b/...a\nb.ts"`, `"b/...a\rb.ts"`, `"b/...a\342\200\250b.ts"`, `"b/...a\342\200\251b.ts"`), beside a plain ok.ts. There are 4 paths x 3 modes, plus one case naming all four paths in one line. Red: the gate exited 0 and ran Stryker on them. The existing glob, comma and extglob cases also failed red, on the extended cause text. | gates/lib/mutation/ranges.ts, gates/bin/mutation.ts |
| O9-01 | fixed. `planShards` now turns each changed file into entries. A file of at most 120 changed lines is one entry, `path`. A larger file is cut, in line order, into chunks of 120 changed lines (the last holds the rest). A cut falls inside a changed range where the count reaches 120. Each chunk is `path:start-end` from its first to its last changed line. The entries, sorted by path and then by line, are filled greedily into shards of at most 10 entries and 250 changed lines, and an entry never crosses a shard. The rule "a file over 250 lines is a shard on its own" is gone. `--files` takes `path` and `path:start-end` entries. The range is the text after the last `.ts:`, and a changed path is matched whole first, so a path holding `:` or `.ts:` still works. `selectFiles` cuts each file's changed ranges to the entries naming it. Entries of one file are joined, overlapping or adjacent pieces merged, so Stryker's `mutate` list holds only changed lines inside the entries. A malformed range (anything but `start-end` with 1 <= start <= end) is exit 2 naming the entries, then a path that is not a changed file, then a range holding no changed line. The `--plan` JSON shape is unchanged; `files` now carries the entries. ci.yml needed no change. | gates/test/mutation-shards.test.ts: "planShards: the split within files" (120, 121, 240, 241 lines, a cut inside a range, a cut at a range end, 216 lines across ranges, and the recorded plant-judge.ts diff), "planShards" (the bounds with split entries, entries of one file sharing a shard, the 10-entry bound counting a split file's entries), "formatPlan" (range entries), "selectFiles: path:start-end entries" (cutting, joining, colon paths, the three exit 2 kinds and their order, 9 malformed forms), and "mutation gate: --plan and --files with line-range entries" (in process). gates/test/integration/mutation.test.ts "--files with an entry path:start-end mutates only the changed lines inside it" runs on the new fixture gates/test/fixtures/mutation-split/: the run exits 0, and every mutant of split.ts in Stryker's report lies in lines 10-12. The untested function at lines 6-8 would be NoCoverage findings. gates/test/ci-workflow.test.ts reads the real ci.yml. Red: `--files` with a range entry exited 2 as an unchanged file, and the plan kept files whole. | gates/lib/mutation/shards.ts, gates/bin/mutation.ts (usage, causes, header), gates/README.md (CI paragraph) |

## Observations for round 10 and the operator

- **The split does not shorten the plant-judge.ts shard.** The plan fills entries greedily, and T097 asks that
  "entries of one file may share a shard". So a file of 121 to 250 changed lines still lands whole in one shard
  whenever the shard has room. In the bdb9b70 plan below, shard 14 is
  `gates/lib/plant-judge.ts:1-120,gates/lib/plant-judge.ts:121-216` (216 lines), the same mutants as the shard
  that took 9:49 on GitHub. The same holds for mutation.ts, pins.ts, plants.ts, pins-rules.ts and plant-repo.ts.
  This meets the spec text as amended (no entry over 120 lines, no shard over 10 entries or 250 lines). It does
  not meet the operator's stated aim, "so no shard exceeds ~120 lines of one file". Meeting that aim needs a
  spec change I did not make: for example, the next entry of the same file starts a new shard, or a shard holds
  at most 120 lines of one file.
- **Mutants that span a cut.** Stryker mutates a node only if it lies wholly inside one `mutate` range
  (`locationIncluded` in @stryker-mutator/instrumenter 10.1.1). When two entries of one file are in one shard, the
  gate joins their ranges, so nothing is lost. When they are in different shards (here csp.ts:1-120 in shard 1 and
  csp.ts:121-240 in shard 2), a mutant spanning the cut, such as the block statement of a function crossing line
  120/121, is mutated in neither shard. A changed range that does not cover a whole node already behaved this way
  before. The cut adds new such boundaries inside changed ranges. See the csp.ts comparison below.
  Measured on csp.ts (mutation-shards.md): the whole file has 281 mutants, and its entries in shards 1 and 2
  together have 279. The two missing mutants are the block statements spanning lines 113-123 and 119-121. When
  the file was run whole, the first was a CompileError and the second was Killed.

## Checks

Run with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set, on the fix tree:

- `pnpm test`: exit 0, "unit-tests: 1231 tests passed in 55 files".
- `pnpm -r build`, then every gate exits 0:
  - config-copies: identical.
  - test-lint: 57 files, no finding.
  - typecheck: no type error.
  - lint: 100 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - signoff `--range bdb9b70..HEAD`: 151 commits, no finding (before the fix commit).
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files gates/lib/mutation/ranges.ts,gates/lib/mutation/shards.ts,gates/bin/mutation.ts`:
  exit 0, "523 mutants on the changed lines of 3 files, none survived; 9 equivalent records"
  (mutation-fix-9-phase-base.log). The first run had two survivors at shards.ts:60 (`if (count > 0)`), because no
  case had a file of an exact multiple of 120 lines over 120. The case "splits a file of exactly 240 changed lines
  into two entries of 120, and no empty third" was added in the fix commit, along with "takes a changed path
  holding .ts: whole". Both are new cases; no red case was changed. The 9 records are the existing
  process-boundary records of gates/bin/mutation.ts, each naming its covering integration case (research.md R-08).
  This fix adds no record.
- The same run with `--base bdb9b70`, the PR base: exit 0, the same result (mutation-fix-9-pr-base.log).
- `pnpm run gate:mutation -- --base bdb9b70 --plan`: 19 shards. No entry exceeds 120 changed lines of one file,
  and no shard exceeds 10 entries or 250 changed lines (largest: 4 entries, 248 lines). I ran every shard with
  its `files` value passed to `--files`, one after the other. All exit 0 with no survivor. The longest is shard
  14 (plant-judge.ts) at 5 min 1 s. Timings are in mutation-shards.md.
