# Phase 3 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the report lifecycle (delete the earlier report, run Stryker, read the report this run wrote) moved from `realTools` into `mutation()`, behind the `MutationTools` seam (`remove`, `stryker` returning a `ToolRun`, `read`). Stryker's output join (old line 142) moved with it and is now tested. The records on the old lines 121-142 are gone. `realTools` keeps one record per member: each is a one-line call into git, the file system or Stryker. The in-process test fails with `await tools.remove(reportFile)` removed (checked by hand: 1 failed, 148 passed). The new gates-integration case fails with the real `rm` removed (checked by hand on the pre-fix code: exit 0 instead of 2), so the `remove` record's "covered by gates-integration" now holds. | 53ad803 (`red fix-1`, red-fix-1.log). gates/test/mutation-shards.test.ts, describe "the report of this run, never an earlier one": stale passing report and no new one, exit 2; the last ERROR of stdout and then stderr; stale surviving report and a clean new one, exit 0. gates/test/integration/mutation.test.ts: "deletes an earlier run's report", with a stale report and `testRunner: "nonexistent"`, exit 2. The red log fails 8 tests with `TypeError: Cannot read properties of undefined (reading 'split')`: the pre-fix gate reads `report` and `output` from the run's return value, and under the new seam that value is a `ToolRun` with neither field. That is the defect under test: the gate does not read the report from the repository after the run. It is not a setup error. The integration case passes at red, because the real gate already deleted the report. It is a strengthening test, as step 3 allows. | gates/bin/mutation.ts (`MutationTools`, `reportFile`, `mutation()`, `realTools`), gates/test/mutation-fakes.ts (`fakeRepo`, `FakeStryker`, `strykerReport`, `mutant`, `reportPath`; `fakeRead` removed), call sites in gates/test/mutation-{ranges,records,shards}.test.ts (wiring only, no assertion changed) |
| R1-02 | partly fixed (note): mutation.ts:142 is resolved by R1-01. The records in mutation.ts went from 9 to 7 lines, and every remaining one sits on a single call into the tool. test.ts:105-118, setup-offline.ts:96, spawn.ts and cli.ts are unchanged. | none (note) | gates/bin/mutation.ts |
| R1-03 | deferred: operator decision, out of scope for this fix | none | - |
| R1-04 | no change: the review requires none for this phase | none | - |
| R1-05 | no change: the review requires none | none | - |

Checks, with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set (R-03):

- `pnpm test`: exit 0, "176 tests passed in 20 files".
- `pnpm run gate:test-lint`: exit 0, "22 files checked, no finding".
- `pnpm exec tsc -p tsconfig.json --noEmit`: exit 0.
- `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8`: exit 0, "749 mutants on the changed lines of 15 files, none survived; 58 equivalent records" (4 min 7 s).
