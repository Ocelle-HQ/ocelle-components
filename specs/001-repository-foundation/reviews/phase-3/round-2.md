---
phase: 3
round: 2
verdict: approved
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: e47a643a764765331e862d0203cfcaec0f182899
tdd_check: pass
---

# Phase 3 review, round 2

Change under review: `git diff 4ac76fd..e47a643`. Since round 1 (1087921) it adds red commit 53ad803 (test files
only: gates/test/integration/mutation.test.ts, mutation-fakes.ts, mutation-{ranges,records,shards}.test.ts), fix
commit cfca5fb (gates/bin/mutation.ts, plus red-commits, red-fix-1.log and round-1-fixes.md) and tdd-check evidence
e47a643. The working tree was clean before this review.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | gates/bin/mutation.ts:130-153 | R-08 (research.md:254-256) keeps the integration-only adapter lines to the `import.meta.main` guard and the call that spawns the tool. The nine remaining records also cover the `realTools` declaration (131), the Stryker path (133), the `return {` (135), the `read` and `remove` file-system calls (139, 141) and `run()` (148). Read literally, those six lines are outside R-08. I judged each line's mutants. A mutant on any of them either breaks every integration run (an empty body or object, an empty path or argument string, `{ force: true }` becoming `{}`, which makes `rm` throw on the fresh fixture repository) or is killed by a named integration case. `"utf8"` becoming `""` hands a Buffer to `scanRecords`. Dropping the real `rm` is killed by the new stale-report case (checked, below). `mutate.join(",")` becoming `join("")` is killed by the NoCoverage case, which has two `mutate` entries. "Covered by gates-integration" now holds line by line, unlike mutation.ts:138 in round 1. This is the same class of record round 1 accepted as R1-02, now narrowed to one call per line. | None for this phase. Optional, for the operator: reword R-08 to "the adapter wiring: one call per line into git, the file system or the tool, each covered by gates-integration" so that the text matches the practice. |
| R2-02 | note | eslint.test.config.ts:12 | The test lint does not ignore `.stryker-tmp/`. While a mutation run was in progress, `pnpm run gate:test-lint` exited 2: "could not run: .stryker-tmp/sandbox-oGYrep/gates/test/fixtures/test-lint/does-not-parse/gates/test/case.test.ts:5 does not parse". After the run finished, it passed ("22 files checked, no finding"). CI runs these gates in separate jobs, so only a local run is affected, or a sandbox that a crashed Stryker run leaves behind. The gate fails closed. | Optional: add `.stryker-tmp/**` to the ignores, or list files through `git ls-files` (FR-028's test-code set). |

## Test quality

**Red evidence, fix 1.** red-fix-1.log and check-red-fix-1.log (53ad803, against the pre-fix gate) fail 8 of 176
tests, each with `TypeError: Cannot read properties of undefined (reading 'split')`. There is no assertion failure.
Asked to judge, I accept this as red evidence under constitution VIII, for these reasons:
- It is not a syntax, import or setup error. Every file loads, and the doubles and the gate are wired and run. The
  error comes from inside the unit under test (`classifyMutants` reading `output` on the run's return value). The
  pre-fix gate expects the Stryker tool to hand back the report. The tests require the gate to delete the earlier
  report and read the new one from the repository itself. That is exactly the behaviour R1-01 found missing.
- No assertion-level red was possible without changing the seam. Under the old seam the delete happened inside the
  real tool, which no in-process double can observe. That was the substance of R1-01.
- I checked that the new tests can fail by assertion, independently of the fix note. In a scratch clone of HEAD I
  replaced `await tools.remove(reportFile);` (mutation.ts:112) with a comment. The gates project then fails 1 of
  149 tests: "exits 2 when Stryker writes no report, even though an earlier run left one that passes",
  `AssertionError: expected { code: +0, ... } to deeply equal { code: 2, ... }`. The mutation gate kills every mutant
  on lines 112-115 in-process, because those lines carry no record. This includes the output join (old line 142), so
  the error-text gap of round 1 is closed: "names the last error of Stryker's stdout and then its stderr" pins both
  the order and the content.
- Five of the eight failures are existing tests (mutation-records.test.ts:139, 154, mutation-shards.test.ts:107, 119,
  220). They failed only because their doubles now speak the new seam. Their assertions are unchanged (below), and
  all of them pass at HEAD.

The integration case "deletes an earlier run's report" passes at red, because the real gate already deleted the
report in `realTools`. That makes it a strengthening test, not red evidence. I checked that it can fail. In the
scratch clone I made `remove` a no-op (`Promise.resolve(void [rm, path])`). gates/test/integration/mutation.test.ts
then fails 1 of 4 tests, with `"code": 0` instead of `2`. This reproduces the round 1 false pass, now caught.

**Tests weakened after red.** `git diff 53ad803..HEAD -- gates/` touches only gates/bin/mutation.ts, so the fix
commit changed no test. Against round 1's head (`git diff 1087921..53ad803 -- gates/test`), I compared each changed
call site in mutation-ranges.test.ts:189, mutation-records.test.ts:141, 157 and 173, and mutation-shards.test.ts:92
to 213 and 221-226. Only the tools wiring changed (`read: ..., stryker: ...` became `...fakeRepo(files, stryker)`).
Every `toEqual`/`toMatchObject` expectation is byte-identical. The doubles keep their meaning:
- `fakeRepo(files)` defaults to `noStryker`, which still makes the run reject if Stryker is called.
- `fakeStryker` still emits one mutant per `mutate` entry with `statusOf(path)`. It now writes that report at
  `reportPath` and returns exit 0 with empty output. The old double returned `exitCode: 0, output: ""` with the
  report in hand.
- The report-unusable case at mutation-shards.test.ts:220 keeps its stdout "ERROR Stryker Something broke." and its
  expected message. It now also has no report in the repository.
- Each test builds its own `fakeRepo` map, so no state leaks between tests. Before, a `sources` reader was shared,
  but it was read-only.
- The read path matches exactly (`tree.get(path)`), so a mutant of the gate's `reportFile` constant reads nothing and
  is killed.
- The doubles are not asserted on; the tests assert the gate's exit code and output.

`git diff 4e9e27a..HEAD -- gates/test/integration/` removes only one import line, which was replaced by a wider
import. Every phase-red integration assertion is unchanged.

**Vacuous patterns.** The three new in-process tests and the new integration test each assert the exit code and the
exact error (or output) lines. There are no conditionals, skips or snapshots. The test lint reports nothing on the
22 test-code files.

**Mutation** (`pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8`, run by this review):
exit 0, "749 mutants on the changed lines of 15 files, none survived; 58 equivalent records", 4 min 12 s. Records
compared with round 1:
- mutation.ts went from 12 records to 9 (lines 130-153). The records on the stale-report delete and on the
  report/output join are gone, and that logic is now mutated and killed in `mutation()`.
- The 5 `BlockStatement` empty-catch records are unchanged and still true equivalents (round 1).
- The other "process boundary" records, in test.ts, setup-offline.ts, test-lint.ts, config-copies.ts, cli.ts and
  spawn.ts, are unchanged from round 1. They stay accepted as round 1's R1-02 note (diagnostic-only mutants at
  test.ts:114, test.ts:118 and setup-offline.ts:96).
- The mutation.ts records are judged in R2-01.

**TDD check.** tdd-check.json (head cfca5fb; e47a643 adds only evidence) is `pass` with `problems: []`. Red
`phase` exits 1 and red `fix-1` exits 1. The final tests exit 2 on the base and 1 on the scaffold, and the head
exits 0.

## Checks run

All checks ran with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set to the preinstalled headless shell
(R-03).

| Check | Result |
|-------|--------|
| `pnpm run setup:offline` | exit 0 |
| `pnpm test` | exit 0, "176 tests passed in 20 files" |
| `pnpm run gate:test-lint` | exit 0, "22 files checked, no finding" (exit 2 only while a mutation run was in progress, R2-02) |
| `pnpm run gate:config-copies` | exit 0, both story-config copies identical |
| `pnpm exec tsc -p tsconfig.json --noEmit` | exit 0 |
| `pnpm run gate:mutation -- --base 4ac76fd...` | exit 0, as above |
| Probe: mutation.ts:112 removed (scratch clone) | gates project: 1 failed (AssertionError, exit 0 instead of 2), 148 passed |
| Probe: real `rm` in `realTools.remove` made a no-op (scratch clone) | integration/mutation.test.ts: 1 failed (`code` 0 instead of 2), 3 passed |

**Tasks.** T032 to T050 are still ticked, and none is open under `## Phase 3:`. Round 2 changes only the files that
R1-01 named, plus review evidence.

**Constitution.** VIII: the fix is test-first (red commit with test files only, then the fix). No test was weakened.
The new tests can fail. Mutation is clean, with the records judged. I: no `sk-` names. II to V do not apply.

**Plan.** R-08's report lifecycle ("no report ... is exit 2", decision from the report, not the exit code) is now in
the tested decision function. The record scope is R2-01 (note).

## Earlier findings

- **R1-01 (blocking): resolved.** The delete, the run, the read and the output join moved into `mutation()`
  (gates/bin/mutation.ts:112-115), behind the `MutationTools` seam (`remove`, `stryker` returning a `ToolRun`,
  `read`). These lines carry no record, and the mutation gate kills all their mutants in-process. The stale-report
  false pass of round 1 is now caught twice:
  - in-process: mutation-shards.test.ts:242, a stale passing report and a run that writes none, exit 2;
  - end to end: integration/mutation.test.ts:83, a stale report with `testRunner: "nonexistent"`, exit 2.
  Both failed for me with the delete removed. The line-142 error-text gap is closed by mutation-shards.test.ts:258,
  "the last error of stdout and then stderr", with the exact message. The behavioural fix came with a red test
  (`red-commits`: `fix-1 53ad803`).
- R1-02 (note): partly addressed in mutation.ts (see R2-01). The other files are unchanged and still accepted as
  recorded in round 1.
- R1-03 (note): pending operator decision. Not blocking.
- R1-04, R1-05 (notes): no change required.
