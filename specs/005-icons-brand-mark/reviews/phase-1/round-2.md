---
phase: 1
round: 2
verdict: approved
base: ee8e4a10fad073518dfe8e01ee4a3b88ad6996af
head: dfa590ee46bc25ce3d3d8186436ce289b909c9d6
tdd_check: pass
---

# Phase 1 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/005-icons-brand-mark/reviews/phase-1/install-scripts.md ("Not verified") | This carries over R1-04. R-16 was verified on Node 22.23.4 only. Node 26.13.0 and macOS are still unverified, and this is recorded honestly. | None now. The phase 2 spike should record the Node 26 result. |

There is no blocking finding.

## Test quality

- **Red evidence.**
  - The phase red commit `79a26a5` is unchanged. Its 26 assertion failures were accepted in round 1.
  - The round 1 fix (`ffd76f0`) has no `fix-1` red entry. That is correct for these findings. R1-01 and R1-02 said a test was weak while the code was already right, and speckit-story-fix step 3 says to strengthen such a test in the fix commit. The new tests can therefore pass at once.
  - `fix-1-mutant-R1-01.log` and `fix-1-mutant-R1-02.log` show that the strengthened tests fail against the two hand mutants, on assertions.
- **No weakening.**
  - `git diff 79a26a5..HEAD -- gates/test` touches only `gates/test/integration/plant-repo.test.ts`. The fix adds to it.
  - The one removed line is the `node:fs` import, which was widened to add `cpSync`, `mkdirSync`, `rmSync` and `symlinkSync`.
  - No existing test or assertion changed.
- **New tests** (plant-repo.test.ts:86-112 and :282-309).
  - `sourceRoot` builds a repository root in a temporary directory. The root has its root `node_modules` linked, only `packages/styles` has a `node_modules` of its own, and the named entries are left out. So the results no longer depend on how this repository is installed.
  - **"links the node_modules of a package that has its own, and none for a package without"**
    - It asserts the exact link map with `toEqual` for both `buildRepoTree` and `buildMutationRepo`: `false` for tokens and elements, and the link target for styles.
    - `packageLinks` uses `lstatSync`, so a dangling link would still be seen.
  - **"rejects building from a repository root without %s, naming it"**
    - It runs over four required entries, both builders, and `rejects.toThrow(<missing path>)`.
  - **"builds from a repository root without the element files that may be absent"**
    - It asserts that the three files are absent and that a required neighbour is present.
  - None of these tests has a conditional assertion, `skip`, `only`, a snapshot or a swallowed error.
- **Hand mutants, reproduced by me.** I unpacked HEAD into a scratch directory with `git archive` and ran `vitest run --project gates-integration gates/test/integration/plant-repo.test.ts`.
  - `plant-repo.ts:367` mutated to `if (false) continue;` is killed: 1 failure, the node_modules link test.
  - `plant-repo.ts:362` mutated to `await copied.catch(ignoreMissing);` is killed: 4 failures, the four required-entry rejections.
  - `plant-repo.ts:362` mutated to `await copied;` is also killed: 15 failures, including "builds from a repository root without the element files that may be absent". This is the opposite direction to R1-02.
- **Mutation gate.** `pnpm run gate:mutation -- --base ee8e4a1` exits 0: "71 mutants on the changed lines of 2 files, none survived; 6 equivalent records".
  - The records at :361 and :366 now name the tests that kill their hand mutants, and I accept them.
  - The other four records (:357, :359, :364, :368) were accepted in round 1 and have not changed.
- **TDD check.** `tdd-check.json` is `pass` with no problems.
  - `head` is `ffd76f0`. HEAD `dfa590e` changes only the check's own evidence files.
  - `final_tests_on_scaffold_exit` is 1 and `final_tests_on_base_exit` is 2.

## Checks run

All runs used Node 22.23.4 with `OCELLE_CHROMIUM_PATH` set, at HEAD `dfa590e`, one at a time.

| Check | Result |
|---|---|
| `pnpm run gate:typecheck` | pass |
| `pnpm run gate:lint` | pass (171 files) |
| `pnpm run gate:test-lint` | pass (111 files) |
| `pnpm run gate:style-lint` | pass (2 files) |
| `pnpm run gate:prefix` | pass (132 files) |
| `pnpm run gate:pins` | pass (5 manifests) |
| `pnpm run gate:config-copies` | pass |
| `pnpm run gate:contrast` | pass |
| `pnpm run gate:brand-rules` | pass |
| `pnpm run gate:signoff -- --range ee8e4a1..HEAD` | pass (7 commits) |
| `pnpm test` | pass (2063 tests in 96 files) |
| `pnpm -r build && pnpm run gate:csp` | pass (23 files) |
| `pnpm run gate:plants` | pass (188 plants of 13 gates and the registry) |
| `pnpm run gate:mutation -- --base ee8e4a1` | exit 0, 71 mutants, none survived, 6 records, all accepted |
| Three hand mutants of plant-repo.ts:362 and :367 in a scratch copy | all killed |

**Tasks.** T001 to T010 are still ticked (tasks.md:77-89). The fix commit changed only `gates/lib/plant-repo.ts` (two record comments), the integration test, and the phase's review files. Nothing outside phase 1 changed.

**Plan and constitution.** Nothing changed since round 1 apart from the test strengthening. The phase follows R-11, R-12 and R-16. Principle VIII is now met for the changed code.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - The test "links the node_modules of a package that has its own, and none for a package without" asserts that tokens and elements get no link, in both builders. It builds from a fixture root that does not depend on this repository's install state, which is what round 1 suggested.
  - My hand mutant `if (false) continue;` fails it.
  - The record at plant-repo.ts:366 now names this test.
- **R1-02 (blocking): resolved.**
  - The test "rejects building from a repository root without %s, naming it" covers four required entries in both builders, and the rejection names the missing path.
  - My hand mutant `await copied.catch(ignoreMissing);` fails all four cases.
  - The lenient half is pinned by the "may be absent" test, and the strict mutant fails it.
  - The record at plant-repo.ts:361 now names these tests.
- **R1-03 (note): resolved.** tdd-exempt.md:15 now says 26 tests.
- **R1-04 (note): deferred as allowed.** It is carried as R2-01.
