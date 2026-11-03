---
phase: 3
round: 11
verdict: approved
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: b060c95defc36d3e7500b100457463e15fd89161
tdd_check: pass
---

# Phase 3 review, round 11

This round covers the open findings R8-01 (round 8), O9-01 (round 9, operator round) and O10-01 and O10-02
(round 10, operator round). It also covers their two fix rounds:

- fix-9: red f67d2cb, green 1eaa0f9, round-9-fixes.md, T097.
- fix-10: red 9f712c8, green a1c7667, round-10-fixes.md, T098.

HEAD b060c95 adds only evidence files on top of a1c7667. `git diff a1c7667..HEAD -- gates packages .github` is
empty, so tdd-check.json, which passed at a1c7667, applies to this head. I judged the code and the tests directly.
The fix notes served only as pointers.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R11-01 | note | gates/lib/mutation/shards.ts:69-85 (`planShards`); spec.md SC-005; reviews/phase-3/mutation-shards.md, "Round 10 fix" | SC-005 is met on both CI runs of the round 10 code, with a margin of 1:30 at worst. Run 41671185705 (head a1c7667): all 21 shards succeeded. The longest was 8:30, for `gates/lib/vitest-report.ts:121-123,…,packages/tokens/src/index.ts` (6 entries, 308 mutants locally). Next came 7:47 for `gates/lib/plant-judge.ts:121-216,gates/lib/plant-repo.ts:1-120` (381 mutants) and 7:31 for `gates/lib/mutation/shards.ts:121-166,gates/lib/pins-rules.ts:1-120` (357 mutants). Run 41672562167 (head b060c95, same code): all 21 succeeded. The longest was 7:35 (the plant-judge/plant-repo shard), then 7:18 (shards/pins-rules). The 6-entry shard took only 5:50 there. The fill bounds entries, lines and lines of one file, but not mutants. The largest shard by mutants (381) is now bigger than the 353-mutant plant-judge.ts shard of round 9. That shard took 7:09 on run 41656075109, 9:49 on run 41635769914, and was cancelled after 10:04 on run 41656706363. Between runs, one shard's time varies by about 40 to 45 % (7:09 to more than 10:04 there; 5:50 to 8:30 here). A swing like that on the 381-mutant shard (7:35 to 7:47) would pass the 10-minute limit. The bound holds today. It is not robust. | None required for this phase: FR-013 and SC-005 as amended are met, and no local shard comes near 10 minutes (the longest took 4:16). For the operator: if a shard is cancelled again, the next lever is a bound on mutants per shard rather than on lines. For example, the plan could split by Stryker's dry-run mutant count, or cap the mutants of one shard. This would need a spec amendment. |

No blocking finding.

## Test quality

- **Red evidence, fix-9.** I read red-fix-9.log: 70 of 1229 tests fail, every failure is an `AssertionError`, and
  no line shows a load or setup error. The commit holds only tests and fixtures (`git show --stat f67d2cb`). One
  test double changed. The fake Stryker's range regex in gates/test/mutation-fakes.ts got the `s` flag, so it now
  accepts paths that the real Stryker cannot take. This does not weaken anything:
  - every line-terminator case asserts `mutated: []`, so the fake must never be reached;
  - without the flag, those cases would fail by a throw in the double, not by an assertion.
- **Red evidence, fix-10.** I read red-fix-10.log: 23 of 1236 tests fail, all `AssertionError`s. They are the
  separate-shard cases and the stderr cases, each at the line the fix note names. The commit holds only tests
  (`git show --stat 9f712c8`).
- **Changed tests, fix-9 red (f67d2cb).** The existing `planShards` cases changed from "a file over 250 lines is a
  shard on its own" to the split. The rule they encoded was removed by the FR-013 amendment, so the change was
  needed. All three bounds are still exact:
  - 250 fits;
  - 251 splits;
  - 11 entries start a new shard.

  The usage-line change in two argument cases follows the new `--files` syntax.
- **Changed tests, fix-10 red (9f712c8).** I checked each changed case against its old version (`git show
  9f712c8 -- gates/test`).
  - **250-line bound.** "Fills shards of up to 250" now reaches exactly 250 with `a.ts:121-150` + `b.ts` +
    `c.ts` (30 + 100 + 120), and `d.ts` at 251 starts a new shard. The `<=` boundary is still exact.
  - **251-line split.** "Splits entries of 251" now uses three whole files, 120 + 120 + 11. The split is still
    exact.
  - **10-entry bound.** The case now has `a.ts:121-130` plus nine files, 10 entries in total. The tenth file
    (`f09`) starts a new shard, so the bound is still exact.
  - **`125 + 125` case.** It was renamed. Under the new rule, no plan of two such files reaches 250 lines in one
    shard, and the first bound case still covers 250.
  - **35-line variant.** The fix dropped the 35-line variant of the 216-line synthetic case. With one file's
    entries in separate shards, 96 + 35 = 131 marks no bound, so no bound was lost.
  - **Stderr assertions.** Three `--plan` cases changed from `err: []` to the exact stderr line. That is stricter,
    and the cut count in the spec needs it. T098 step 2 names "the two existing" cases. The third,
    gates/test/mutation-ranges.test.ts:330, had to change for the same reason, and the fix note says so.
- **After red.** No test was weakened after its red commit. `git diff f67d2cb..1eaa0f9 -- gates/test` and `git diff
  9f712c8..a1c7667 -- gates/test` only add cases:
  - in fix-9: "exactly 240 lines, no empty third" and "a changed path holding .ts: whole";
  - in fix-10: four `countCuts` cases.

  Each added case kills a mutant that the fix note names (shards.ts:60 `count > 0`, the `$` anchor of the
  `countCuts` regex). No case was removed or loosened.
- **Assertions.** The new cases assert the full plan, the full selection, or the full `{code, out, err, mutated}`
  with `toEqual`. There are no conditionals, skips or snapshots. The loop in "holds no two entries of one file"
  (mutation-shards.test.ts:182) runs over a plan that is not empty, and the line-sum assertion after it fails if the
  plan is empty. The end-to-end case in gates/test/integration/mutation.test.ts runs the real Stryker on
  gates/test/fixtures/mutation-split/ with `--files gates/lib/split.ts:10-12`. It asserts exit 0, more than one
  mutant, and that every mutant in the report lies in lines 10 to 12. The untested function at lines 6 to 8 would
  be a NoCoverage finding if it were mutated. gates/test/ci-workflow.test.ts asserts against the real ci.yml that:
  - the matrix passes `matrix.shard.files` to `--files` unchanged;
  - the value goes through `env`, not into the script text.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files
  gates/lib/mutation/ranges.ts,gates/lib/mutation/shards.ts,gates/bin/mutation.ts` once, in 436 s. It exited 0 with
  "543 mutants on the changed lines of 3 files, none survived; 9 equivalent records". The 9 records are the
  existing process-boundary records of gates/bin/mutation.ts:171 to 194. Each one names its covering
  `gates-integration` case, as R-08 allows. The fixes added no record. No other mutation run was going in this
  checkout.

## Checks run

Local, on b060c95 (`PATH=/opt/node26/bin:$PATH`, `OCELLE_CHROMIUM_PATH` set as given):

- `pnpm test`: exit 0, "unit-tests: 1240 tests passed in 55 files".
- Each gate exits 0:
  - config-copies: identical.
  - test-lint: 57 files, no finding.
  - typecheck: no type error.
  - lint: 100 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - signoff `--range bdb9b70..HEAD`: 159 commits, no finding.
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base bdb9b70 --plan`: exit 0. stdout is identical byte for byte to the plan recorded
  in mutation-shards.md "Round 10 fix": 21 shards. stderr is `mutation: plan: 21 shards, 14 cuts within files (a
  mutant spanning a cut is mutated in no shard, see gates/README.md)`. The plan meets every bound:
  - no entry is over 120 changed lines;
  - no shard has more than 10 entries or 250 lines;
  - no shard holds two entries of one file.

  The 14 cuts add up per file as recorded.
- Mutation on the changed files against the phase base: see Test quality.
- CI. Run 41656706363 (head cc78173, round 9 code): the shard `gates/lib/plant-judge.ts:1-120,gates/lib/plant-judge.ts:121-216`
  was cancelled at 10:04 and the check failed, as the brief says. This is the case O10-01 fixed. Runs
  41671185705 (head a1c7667) and 41672562167 (head b060c95) both finished, and Mutation testing succeeded on both.
  The `mutation-plan` job log of 41671185705 shows the stderr line, with 21 shards and 14 cuts.

  The six longest shards of each run:

  | Shard (entries) | 41671185705 | 41672562167 | local (mutants) |
  |---|---|---|---|
  | vitest-report.ts:121-123, workspace-yaml.ts, token-only.ts, 3 package index.ts | 8:30 | 5:50 | 3:44 (308) |
  | plant-judge.ts:121-216, plant-repo.ts:1-120 | 7:47 | 7:35 | 4:16 (381) |
  | mutation/shards.ts:121-166, pins-rules.ts:1-120 | 7:31 | 7:18 | 3:55 (357) |
  | registry.ts:1-120 | 6:42 | 4:09 | 3:42 (167) |
  | findings.ts, mutation/coverage.ts, mutation/ranges.ts:1-120 | 6:36 | 6:36 | 3:10 (189) |
  | plants.ts:121-233, prefix.ts | 5:46 | 6:02 | 2:29 (241) |

  The other 15 shards took between 1:48 and 5:39. SC-005 is met on both runs (R11-01).
- tdd-check.json: `pass` at a1c7667. All six red commits (phase, fix-1, fix-3, fix-7, fix-9, fix-10) exit 1. The
  final tests exit 2 on the base and on the scaffold, and `problems` is empty.

## Spec, contracts, README and constitution

- **FR-011.** gates/lib/mutation/ranges.ts:126, `unusable` = `/[*?[\]{}!,\\\n\r  ]|[+@]\(/`, covers all four
  characters that JavaScript's `.` does not match, which is exactly the set Stryker's `MUTATION_RANGE_REGEX`
  (no `s` flag) cuts at. The guard runs before every mode, gates/bin/mutation.ts:117 to 121. The cause text names
  "a line terminator \n \r U+2028 U+2029". `quote` escapes U+2028 and U+2029, which `JSON.stringify` leaves raw,
  so the cause stays on one line.
- **FR-013.** `splitFile`, shards.ts:46 to 67, cuts a file of more than 120 changed lines into entries of
  exactly 120 changed lines, the last holding the rest. It cuts inside a range where needed, and each entry runs
  from its first to its last changed line. `planShards`, shards.ts:69 to 85, starts a new shard when the shard is
  full or when the previous entry is from the same file. A file's entries are consecutive after `flatMap`, so that
  check is complete. `selectFiles` cuts a file's ranges to the entries' windows and merges them. So `--files` mutates
  only the changed lines inside the entries. It also gives exit 2, naming the entries, for:
  - a malformed range;
  - an unchanged path;
  - a range with no changed line.
- **Cut limit (O10-02).** The accepted limit is recorded in the three places the spec requires:
  - FR-013 says "Accepted limit (operator decision, phase 3 round 10 …)";
  - research.md R-08 has "Cuts, an accepted limit", with the csp.ts measurement;
  - gates/README.md:73 to 82 states that two entries of one file never share a shard, that a mutant spanning a
    cut is mutated in no shard while the smaller ones inside it still are, that this is an accepted limit (with
    its source), and that `--plan` reports the cuts on stderr.

  `countCuts`, shards.ts:92 to 95, counts every boundary between entries of one file, including a boundary at an
  unchanged gap, where no mutant can be lost. R-08 says the count is "of every cut, wherever it falls, not of the
  mutants lost", so that matches the spec.
- **SC-005.** Met on both CI runs; see R11-01 for the margin and the mutant-count risk.
- **contracts/gate-cli.md.** Line 30 describes the entry syntax, the bounds, the no-sharing rule and the stderr
  line. Line 49 lists the line terminators and the three `--files` exit 2 causes. Both match the code.
- **contracts/ci-checks.md.** Lines 32 and 33 say that stdout stays one array, that the cut count only reaches the
  log, and that `files` is passed unchanged. ci.yml is unchanged and matches: the plan step captures only stdout,
  so the JSON output is unaffected.
- **Tasks.** T097 and T098 are ticked, and the work of each step is present. Each has a red commit and is recorded
  in red-commits. Each check step's records are in mutation-shards.md and the mutation logs.
- **Constitution.** Principle VIII:
  - red first, with assertion failures;
  - no test weakened after its red commit;
  - mutation clean, with every record reasoned;
  - the gate's plants pass.

  The mutation gate cannot pass silently on a path it cannot hand to Stryker. Principles I to IV do not apply:
  the change touches no element, style or package code (`git diff 4ac76fd..HEAD -- packages` is empty for these
  fixes). Commits are signed off (signoff gate).

## Earlier findings

- **R8-01 (round 8): resolved.** Paths that hold `\n`, `\r`, U+2028 or U+2029 now give exit 2 before Stryker runs,
  in a normal run, in `--plan` and in `--files` (ranges.ts:126, mutation.ts:117 to 121). Red tests cover all four
  paths in all three modes, plus one cause line naming all four:
  - the cases are at gates/test/mutation-ranges.test.ts, "mutation gate: a changed path holding a line
    terminator";
  - they run on a recorded git 2.43.0 diff, gates/test/fixtures/git-diff/line-terminators.diff;
  - the red commit is fix-9.

  contracts/gate-cli.md:49 lists the terminators.
- **O9-01 (round 9): resolved, as amended by O10-01.** A file of more than 120 changed lines is split into
  `path:start-end` entries. `--files` takes them and limits Stryker to the changed lines inside them; the
  integration case proves this on the real Stryker. ci.yml passes them through unchanged. The red commit is fix-9.
- **O10-01 (round 10): resolved.** No shard holds two entries of one file (shards.ts:76). The recorded
  plant-judge.ts diff now yields `:1-120` and `:121-216` in separate shards. The 120-line, 10-entry and 250-line
  bounds are unchanged (shards.ts:31 to 33), and the tests pin them exactly. On CI, plant-judge.ts now runs in a
  shard of 5:39 or 4:23 (`:1-120`) and one of 7:47 or 7:35 (`:121-216`), against more than 10:04 before. The red
  commit is fix-10. The operator expected about 25 shards; the plan has 21.
- **O10-02 (round 10): resolved.** The limit is recorded in FR-013, R-08 and gates/README.md. `--plan` prints the
  cut count on stderr, with singular and plural forms and with 0 shards and 0 cuts, and the counts are tested
  exactly. The CI log shows the line. The red commit is fix-10. The cuts in this plan lose mutants that nobody has
  counted, as round-10-fixes.md says. The operator accepted that, and the limit is documented as the spec asks.
