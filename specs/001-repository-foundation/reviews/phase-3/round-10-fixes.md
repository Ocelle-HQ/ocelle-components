# Phase 3 review round 10 (operator round, O10-01 and O10-02): fixes

tasks.md T098 is done. Planner commit cc78173 is the authoritative text: spec FR-013 and SC-005, research.md R-08
("CI, sharded" step 1 and "Cuts, an accepted limit"), contracts/gate-cli.md and contracts/ci-checks.md as amended
there. Test commit 9f712c8 holds only tests. `red.sh 3 fix-10` reports `"tests_only": true, "red": true,
"recorded": true` (red-fix-10.log): 23 of 1236 tests fail, and every failure is an `AssertionError` against the
old code. None is a load error. The cut count is tested through the `--plan` gate cases in red, not through a new
export, which would have failed as a load error at the red commit. The green commit adds direct `countCuts` cases.

Following T098 step 2, the red commit changed the existing cases whose expected plan put two entries of one file
in one shard. They now expect separate shards. These are the split cases (121, 240 and 241 lines, a cut inside a
range, a cut at a range end, 216 lines across ranges, the recorded plant-judge.ts diff), the bound cases, the
10-entry case, `formatPlan` with range entries, and the `--plan` gate case with line-range entries. Their bounds
are kept:

- Exactly 250 fits: `a.ts:121-150, b.ts, c.ts` (30 + 100 + 120), and `d.ts` starts a new shard at 251.
- 251 splits: 120 + 120 + 11 over three whole files.
- 10 entries: `a.ts:121-130` and nine files, and the tenth file starts a new shard.

The case "puts entries of one file in one shard when they fit" became "starts a new shard for the next entry of a
file, though both would fit". "Fits two files of exactly 250 changed lines together in one shard, as four entries"
became "fits a file's last entry and the next file's first entry in one shard, never two entries of one file". No
plan of 125 + 125 lines reaches 250 in one shard under the new rule. Its 250-line bound is covered by the first
bound case above. The 216-line synthetic case kept only its `b.ts` of 34 lines. With one file's entries apart, the
35-line variant no longer marks a bound.

Three existing `--plan` cases asserted an empty stderr, not two. The third is "plans the files of tab-suffixed and
quoted headers" in gates/test/mutation-ranges.test.ts. All three now assert the stderr line.

One new case passed at the red commit because the behaviour already existed. It was not forced red: "splits
entries of 251 changed lines together into two shards" (three whole files, 120 + 120 + 11). The real
`.github/workflows/ci.yml` passing each shard's `files` value unchanged (gates/test/ci-workflow.test.ts) is
unchanged and still passes. ci.yml is unchanged.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O10-01 | fixed. In `planShards`, the next entry starts a new shard when it would exceed 10 entries or 250 changed lines, or when the current shard already holds an entry of its file. Entries come in path-then-line order, so the current shard holds an entry of that file exactly when its last entry is one. The 120-line entry size and the 10-entry and 250-line bounds are unchanged (constants and header comment). An entry still shares a shard with other files' entries. | gates/test/mutation-shards.test.ts. In "planShards: the split within files" and "planShards", the changed cases listed above. In the new "planShards: one file's entries in separate shards": no shard holds two entries of one file across a mixed plan (361, 120, 121, 248 and 249 lines, twelve small files), within the bounds, with no line lost. An entry shares a shard after a smaller file and before the next file. The recorded plant-judge.ts entries go in separate shards, each beside other files. Red: the old fill put a file's entries together. | gates/lib/mutation/shards.ts |
| O10-02 | fixed. `--plan` writes one line to stderr after the JSON: `mutation: plan: <s> shards, <c> cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)`, with `1 shard` and `1 cut` in the singular (`plural` of findings.ts). It also writes the line for 0 shards and 0 cuts. stdout is the same one JSON array, so ci.yml needs no change. `countCuts(shards)` is a pure function of the plan: the entries less the distinct files, where an entry's file is the text before its last `:start-end` (a whole entry, which ends in `.ts`, is its own file). gates/README.md, in the CI paragraph on `mutation-plan`, now states three things. Two entries of one file never share a shard. A mutant whose node spans a cut is mutated in no shard, while the smaller mutants inside it still are; this is an accepted limit (operator decision, phase 3 round 10). `--plan` reports the number of cuts on stderr. | gates/test/mutation-shards.test.ts, "mutation gate: --plan, --files and --base". The two existing `--plan` cases (`1 shard, 0 cuts`; `0 shards, 0 cuts`) and the new cases `2 shards, 1 cut` (a file of 130 lines) and `7 shards, 6 cuts` (files of 250, 130, 5 and 361 lines: 2 + 1 + 0 + 3 cuts). Also "--plan splits a file of more than 120 changed lines" (`2 shards, 1 cut`) and gates/test/mutation-ranges.test.ts "plans the files of tab-suffixed and quoted headers" (`1 shard, 0 cuts`). Red: stderr was empty. Green adds "countCuts": no cut, n - 1 per file summed (2 + 0 + 5), a path holding `:1-2` before `.ts` (split and whole). | gates/lib/mutation/shards.ts, gates/bin/mutation.ts (`--plan`, header comment), gates/README.md |

## Checks

These ran with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set, on the fix tree:

- `pnpm test`: exit 0, "unit-tests: 1240 tests passed in 55 files".
- `pnpm -r build`, then every gate exits 0:
  - config-copies: identical.
  - test-lint: 57 files, no finding.
  - typecheck: no type error.
  - lint: 100 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - signoff `--range bdb9b70..HEAD`: 157 commits, no finding (before the fix commit).
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files gates/lib/mutation/shards.ts,gates/bin/mutation.ts`:
  exit 0, "395 mutants on the changed lines of 2 files, none survived; 9 equivalent records"
  (mutation-fix-10-phase-base.log).
  - The first run had one survivor at shards.ts:94. The file was then computed by `entry.replace(/:\d+-\d+$/, "")`,
    and the mutant was the StringLiteral `""` replaced by "Stryker was here!". That mutant is equivalent on every
    plan, since any replacement keeps the files distinct.
  - The fix reads the file with `/(.*):\d+-\d+$/.exec(entry)?.[1] ?? entry`, with no literal and no `^` anchor,
    which would be equivalent under a greedy `.*`.
  - The case "reads a whole entry whose path holds :start- before .ts as its own file" kills the removal of `$`.
  - The 9 records are the existing process-boundary records of gates/bin/mutation.ts. This fix adds no record.
  - The first run also started once without `OCELLE_CHROMIUM_PATH` and could not run (exit 2, "Something went wrong
    in the initial test run"). That was an environment slip, rerun with it set.
- The same run with `--base bdb9b70`, the PR base: exit 0, the same result (mutation-fix-10-pr-base.log).
- `pnpm run gate:mutation -- --base bdb9b70 --plan`: exit 0, 21 shards, 14 cuts. The stderr line is
  `mutation: plan: 21 shards, 14 cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)`.
  - No entry exceeds 120 changed lines of one file. No shard exceeds 10 entries or 250 changed lines. No shard
    holds two entries of one file.
  - The largest shards are shard 9 by lines (4 entries, 241 lines) and shard 21 by entries (6 entries, 199 lines).
  - Every shard ran with its `files` value passed to `--files`, one at a time, after no tdd-check run was going.
    All exit 0 with no survivor.
  - The longest is shard 16 (`gates/lib/plant-judge.ts:121-216,gates/lib/plant-repo.ts:1-120`, 381 mutants) at
    4 min 16 s. The shards take 51 min 44 s together.
  - Timings are in mutation-shards.md, "Round 10 fix (T098)".

## Observations for round 11 and the operator

- **Shards are bounded in lines, not mutants.** The operator's aim of at most about 120 lines of any one file per
  shard is met, with 21 shards against the "about 25" foreseen. But shard 16 holds 381 mutants. That is more than
  the 353 of the round 9 plant-judge.ts shard, which took 9:49 on GitHub, because plant-judge.ts's second entry
  now shares a shard with plant-repo.ts's first. Shard 14 (shards.ts:121-166 and pins-rules.ts:1-120, 357 mutants)
  is similar. Here shard 16 took 256 s against the round 9 shard's 301 s, in line with R-08's note that time
  follows the mutants per file. Only the pull request's CI run can show whether this also holds on GitHub's runner.
- **Every cut is now a CI boundary.** Since one file's entries never share a shard, each of the 14 cuts can lose
  a mutant that spans it, as recorded in R-08 and gates/README.md. The count `--plan` prints is of cuts, not of
  lost mutants. I did not measure the lost mutants per cut in this plan.
