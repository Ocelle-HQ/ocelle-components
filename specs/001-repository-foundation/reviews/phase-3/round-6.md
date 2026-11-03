---
phase: 3
round: 6
verdict: approved
base: 4ac76fd7fb68ba7c8f15b4bc4177e64b518d56c8
head: c3daf7076d6cf4dfe60f954db5d7155fe99938bb
tdd_check: pass
---

# Phase 3 review, round 6

Scope: the operator addendum T094 (round 5, O5-01 and O5-02): c931d17 (tests), 0db6a0e (fix), 9140fac (tdd-check
evidence). HEAD moved to c3daf70 while this review ran. That commit adds only
specs/001-repository-foundation/verification.md, a draft verification record. It touches no code, test or phase-3
file, so the code reviewed here is the same as at 9140fac.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R6-01 | note | reviews/phase-3/red-commits | There is no `fix-5` entry. `red.sh 3 fix-5` reported `red:false` (red-fix-5.log, exit 0) because O5-01 and O5-02 are findings about coverage and records, not behaviour. The tests pin behaviour that already existed. The one source change in 0db6a0e (gates/bin/config-copies.ts:65, `readFile(...).catch(() => undefined)` replacing try/catch) keeps the behaviour: any read failure still gives `undefined`. The other changes are comments and the removal of a Stryker record. So the "Fixes are test-first too" clause (Principle VIII) does not apply: it covers findings about behaviour. The "every test must be shown able to fail" clause does apply, and the hand-applied mutants satisfy it. I reproduced them (see Test quality). T094 step 2 sets out this route before the work began. | None. |
| R6-02 | note | gates/test/spawn.test.ts:27-41 | Under the `child.on("", reject)` mutant, both cases fail by the 5 s test timeout, with Vitest also reporting the unhandled ENOENT. They do not fail by an assertion. This is still the right reason: the promise never settles because the error is not handled. It costs about 5 s per mutant run. | None. |

No blocking finding.

## Test quality

- **New tests.** gates/test/spawn.test.ts has two cases. The first expects `runTool` to reject with
  `spawn ocelle-missing-tool ENOENT` when PATH holds only an empty temporary directory. The second runs
  `entry(signoff)` the same way and expects exactly `{ code: 2, out: [], err: ["could not run: spawn git ENOENT"] }`.
  This is the gate contract outcome that O5-01 requires. gates/test/integration/config-copies.test.ts runs the entry
  as a script from another working directory and checks the exact code, stdout and stderr in two cases (equal copies:
  exit 0 with the summary; missing tooling copy: exit 2 with the cause). None of these tests has a conditional
  assertion, a skip or only, a snapshot or a mock. Every assertion checks the exact observable outcome.
- **No test was weakened.** `git diff c931d17..HEAD -- '*.test.ts'` is empty.
- **Hand-mutant evidence, reproduced.**
  - In the working tree I changed `child.on("error", reject)` to `child.on("", reject)` in gates/lib/spawn.ts and ran
    `vitest run --project gates gates/test/spawn.test.ts`. Both cases failed (timed out, with the unhandled
    `spawn ocelle-missing-tool ENOENT` / `spawn git ENOENT`), as mutants-fix-5.log shows. After restoring the file,
    both cases pass.
  - In gates/bin/config-copies.ts I changed `if (import.meta.main)` to `if (false)` and ran
    `vitest run --project gates-integration gates/test/integration/config-copies.test.ts`. Both cases failed with an
    AssertionError on `{ code: 0, stdout: [], stderr: [] }`, as the log shows. After restoring the file, both cases
    pass. The working tree was clean afterwards.
- **Records.**
  - spawn.ts: the record on `child.on("error", reject)` is removed (gates/lib/spawn.ts:30), and the mutation run
    kills that mutant in process. Every remaining record names setup-offline.test.ts "exits 2 naming the missing
    package ...", which exists (gates/test/integration/setup-offline.test.ts:48). That case runs `pnpm` through
    `runTool` (gates/bin/setup-offline.ts:94).
  - config-copies.ts:83: the record names the new integration case, which exists.
  - test-lint.ts lines 11, 14, 16, 18 and 23: each record names "exits 0 on a test with one real assertion", which
    exists (gates/test/integration/test-lint.test.ts:79).
- **Mutation.** `pnpm run gate:mutation -- --base 4ac76fd --files gates/lib/spawn.ts,gates/bin/config-copies.ts,gates/bin/test-lint.ts`
  ran 52 mutants on the changed lines of the 3 files: none survived, 14 equivalent records, each reasoned and naming
  its case. CI run 41619235381 (head 9140fac), as reported by the orchestrator: success, 18 mutation shards, all
  green.
- **tdd-check.json** (head 0db6a0e): pass, no problems. Final tests fail on base (exit 2) and on scaffold (exit 2).

## Checks run

Run with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set to the installed headless shell (R-03):

- `pnpm test`: "unit-tests: 1115 tests passed in 54 files".
- `pnpm -r build`: exit 0.
- Each gate exits 0:
  - config-copies: identical.
  - test-lint: 56 files, no finding.
  - typecheck: no type error.
  - lint: 99 files, no finding.
  - style-lint: 1 file, no finding.
  - csp: 3 files, no finding.
  - prefix: 19 files, no finding.
  - pins: 4 manifests, no finding.
  - signoff `--range bdb9b70..HEAD`: 134 commits, no finding.
- `pnpm run gate:plants`: "136 plants of 11 gates and the registry judged, every plant as expected".
- `pnpm run gate:mutation` (above): no survivor.
- The two hand mutants (above): both killed.

## Earlier findings

- **O5-01: resolved.** A missing command now reaches `child.on("error", reject)` in process. Its Stryker record is
  removed (gates/lib/spawn.ts:30), and the mutant is killed by gates/test/spawn.test.ts (Stryker run and my
  reproduction). The gate outcome is pinned exactly: exit 2, `could not run: spawn git ENOENT`. The old record, which
  named a case that never starts a missing command, is gone.
- **O5-02: resolved.** config-copies.ts:
  - The `import.meta.main` record names a new integration case that kills its mutant (reproduced).
  - The equivalent catch record is gone together with its mutant, through a refactor that keeps the behaviour
    (config-copies.ts:65).

  test-lint.ts: all five records name an existing integration case that runs those lines.
- T094 is ticked (tasks.md:152), and its work is present.
