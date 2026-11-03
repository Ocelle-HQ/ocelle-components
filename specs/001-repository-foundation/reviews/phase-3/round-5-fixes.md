# Phase 3 review round 5 (operator addendum): fixes

tasks.md T094 is done. Test commit c931d17 holds the tests alone. `red.sh 3 fix-5` reports `"red": false` and
`"recorded": false` (red-fix-5.log). Both new test files pass at that commit because the behaviour they pin already
exists. A spawn failure already rejects, and `entry` turns the rejection into exit 2 "could not run". The
config-copies entry already prints its result. Following T094 step 2, the tests were not forced red. Instead, each
mutant that a new case kills was applied by hand and run against the case (mutants-fix-5.log). No `fix-5` line was
added to red-commits.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O5-01 | fixed. The new test file gates/test/spawn.test.ts is in the `gates` project, in process. It has two cases. "rejects with the spawn error naming the command" calls `runTool("ocelle-missing-tool", ...)` with `PATH` set to an empty temporary directory and expects the promise to reject with `spawn ocelle-missing-tool ENOENT`. "makes the gate exit 2 with one line: could not run, naming the command (signoff without git)" calls `entry(signoff run)` with `PATH` set to an empty directory and expects exactly `{ code: 2, out: [], err: ["could not run: spawn git ENOENT"] }`. A command that cannot be started starts no process, so Stryker reaches this line in process. The record on `child.on("error", reject)` is therefore removed, not renamed. That removal also corrects the old record, which named a setup-offline case that never starts a missing command (the planner's note). The mutation report shows `child.on("", reject)` as Killed (spawn.ts:30). The other spawn.ts records stay. Each one names gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network". That case really runs `pnpm install` through `runTool`, so it runs each of those lines: the function, the Promise, `spawn`, both buffers, both stream listeners and `close`. The file header now explains the exception. | Not red: the behaviour already existed (red-fix-5.log, exit 0). Mutant shown instead (mutants-fix-5.log): with `child.on("", reject)`, both cases fail. Each times out after 5 s, and Vitest reports the unhandled `Error: spawn ... ENOENT` that the dropped listener leaves behind. | gates/lib/spawn.ts, gates/test/spawn.test.ts |
| O5-02 | fixed. **config-copies.ts.** The `import.meta.main` record named no case. The only integration run of the entry was the plant job's `pass-equal-copies` plant, and it would not kill a mutant there: an entry that does nothing exits 0 with no output, and a pass plant accepts that. The new file gates/test/integration/config-copies.test.ts runs `gates/bin/config-copies.ts --root <tmp>` as a script from another working directory. It has two cases. "exits 0 with a one-line summary on two identical copies" expects the exact summary. "exits 2 naming the missing tooling copy" expects the exact cause. The record now names the first case. The `catch` record (an equivalent BlockStatement mutant) is removed, and the mutant is gone with it: `read` is now `readFile(...).catch(() => undefined)`. Stryker's ArrowFunction mutator skips an arrow function that already returns `undefined`, so this line has no mutant. Behaviour is unchanged: an unreadable file still gives undefined. The function's own BlockStatement and `"utf8"` mutants are CompileError (invalid, FR-011). **test-lint.ts.** All five records now name gates/test/integration/test-lint.test.ts "exits 0 on a test with one real assertion". That case runs every one of those lines (`run`, the ESLint arguments, `runTool`, `classifyEslint`, the main guard) and asserts the exact summary. | Not red: the entry already prints its result (red-fix-5.log). Mutants shown instead (mutants-fix-5.log): with `if (false) await main(run)` in config-copies.ts, both new cases fail with an AssertionError (`{ code: 0, stdout: [], stderr: [] }`). With the same mutant in test-lint.ts, the named case fails with an AssertionError. | gates/bin/config-copies.ts, gates/bin/test-lint.ts, gates/test/integration/config-copies.test.ts |

Checks, run with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set (R-03), on the fix tree:

- `pnpm test`: exit 0, "1115 tests passed in 54 files".
- `pnpm -r build`, then every gate exits 0:
  - config-copies: the two copies are identical.
  - test-lint: "56 files checked, no finding".
  - typecheck: "no type error in the files of tsconfig.json".
  - lint: "99 files checked, no finding".
  - style-lint: "1 file checked, no finding".
  - csp: "3 files checked, no finding".
  - prefix: "19 files checked, no finding".
  - pins: "4 manifests checked, no finding".
  - signoff `--range bdb9b70..HEAD`: "131 commits checked, no finding".
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation -- --base 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8 --files gates/lib/spawn.ts,gates/bin/config-copies.ts,gates/bin/test-lint.ts`:
  exit 0, "52 mutants on the changed lines of 3 files, none survived; 14 equivalent records". Every record names
  its case (mutation-fix-5-phase-base.log).
- The same run with `--base bdb9b70`, the PR base that CI uses: exit 0, "110 mutants on the changed lines of 3
  files, none survived; 14 equivalent records" (mutation-fix-5-pr-base.log).
