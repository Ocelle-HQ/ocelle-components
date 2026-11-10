---
phase: 1
round: 1
verdict: changes_requested
base: ee8e4a10fad073518dfe8e01ee4a3b88ad6996af
head: 8d39e99424153b73d28ef2ac31435aa473f8ce9a
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/lib/plant-repo.ts:366-367; gates/test/integration/plant-repo.test.ts:90-103, 229-250 | The new guard `if (path !== "node_modules" && !existsSync(join(repo, path))) continue;` (T007) carries a `Stryker disable next-line all` record whose reason is "covered by gates-integration: ... buildRepoTree copies the configuration set unchanged, ... and links node_modules". That test does not cover it. I copied HEAD into a scratch directory (`git archive`), replaced the guard with `if (false) continue;` and ran the test file, then the whole `gates-integration` project. The mutant survives: 14 of 14 in the file pass, and 73 of 74 in the project pass. The one failure was `setup-offline.test.ts`, which is unrelated: it fails because the copy is not a git checkout and it does not import plant-repo. With the guard removed, `copyConfiguration` makes a dangling `packages/tokens/node_modules` link, because `packages/tokens` has no `node_modules`. The test does not check for that, since `packageModules` (test :62) keeps only the directories that exist, and `.git/info/exclude` (`node_modules`, plant-repo.ts:480) hides the link from `git status`. So this is a surviving mutant in new code, under a record that is neither an equivalence nor true coverage (Principle VIII, *Mutation testing*). | Test first (a `fix-1` red commit): assert that a package without its own `node_modules` gets no link in the temporary repository. For example, `lstatSync(join(into, "packages/tokens/node_modules"), { throwIfNoEntry: false })` is `undefined` in the buildRepoTree and buildMutationRepo tests. Use a fixture package without `node_modules` if the test should not depend on the repository's install state. Then keep or adjust the guard so that the test passes. |
| R1-02 | blocking | gates/lib/plant-repo.ts:359-362; gates/test/integration/plant-repo.test.ts:90-103 | The new branch `await (mayBeAbsent(path) ? copied.catch(ignoreMissing) : copied);` (T007) carries the same record. It should copy only the three optional element files leniently, and a missing required entry should still reject. I replaced it with `await copied.catch(ignoreMissing);`, which ignores every missing entry. That mutant also survives the test file and the whole `gates-integration` project (same run as R1-01). No test shows that a missing required configuration-set entry (for example `packages/elements/src` or `stryker.elements.config.json`) makes `buildRepoTree` or `buildMutationRepo` reject. So the "may be absent" rule of R-12 is tested only on its pure half (`mayBeAbsent`, gates/test/plant-repo.test.ts), not where it decides anything. | Test first (`fix-1` red commit): an integration case that builds from a repository root that lacks one required configuration-set entry and expects the builder to reject with the missing path. Alternatively, record a true equivalence reason, but none is apparent. |
| R1-03 | note | specs/005-icons-brand-mark/reviews/phase-1/tdd-exempt.md:15 | It says "25 tests failed on assertions". `red-phase.log` and `check-red-phase.log` both report "26 of 2057 tests failed". | Correct the count when the file is next touched. |
| R1-04 | note | specs/005-icons-brand-mark/reviews/phase-1/install-scripts.md ("Not verified") | R-16 verification was done on Node 22.23.4 only. Node 26.13.0 (CI's pin) and macOS (`fsevents` `node-gyp rebuild`) are unverified. This is recorded honestly and deferred to CI and the phase 2 spike, as R-16 *Verification* allows. | None now. The phase 2 spike should record the Node 26 result. |

## Test quality

- **Red evidence.** There is one red commit, `79a26a5` (`red-commits`: `phase`), and it changes only test files under `gates/test/`. In `red-phase.log` and `check-red-phase.log`, 26 tests fail, all of them on `AssertionError`. The failures are the missing projects and excludes (T001), the approved builds (T002), and the configuration set and `node_modules` links (T003). None is an import or setup error, because the scaffold `c0c7cba` supplied `mayBeAbsent`, `nodeModulesLinks` and an empty `vitest.mutation.elements.config.ts`.
- **Scaffold.** `c0c7cba` adds signatures returning neutral values (`path === ""`, `packageDirs.slice(0, 0)`), an empty Vitest config and a Stryker config that nothing reads. It has no behaviour and no test file. `tdd-check.json` gives `final_tests_on_scaffold_exit: 1` with the same 26 failures, and `final_tests_on_base_exit: 2`, a load failure on base, which is acceptable alongside the scaffold run.
- **No weakening.** `git diff 79a26a5..HEAD -- gates/test` is empty. The green commit `0d8bfa3` touches no test file.
- **Assertions.**
  - Every new test asserts concrete values with `toEqual` or `toBe` on the unit's results: project lists, includes and excludes, findings with messages, the configuration set, and links read with `readlinkSync`.
  - There is no conditional assertion, `skip`, `only` or snapshot.
  - `copiedOrAbsent` (integration test :50-57) branches on the repository state, but the branch is inside the computed value and the assertion is unconditional.
  - The pins tests cover the approved pair, each package unversioned, another version, near-miss keys (`"rs-module-lexer@2.9.0 "`, `rs-module-lexer@2.9`, `fsevents@2.3.3.0`, `@xn-sakina/rml-wasm@2.9.0`) and the list form.
  - The four plants are judged by `gate:plants`.
- **Acceptance scenarios.** Phase 1 is Setup with no user story. Its Independent Test is met: `pnpm test` passes, routing of `test/{node,build,browser}/**` is asserted (gates/test/vitest-config.test.ts, the element routing tests), `gate:pins` accepts the approved entries, and `tdd-check` is `pass`.
- **Mutation.** I ran `pnpm run gate:mutation -- --base ee8e4a1`. It exits 0: "71 mutants on the changed lines of 2 files, none survived; 6 equivalent records". The six records are all on `copyConfiguration` in gates/lib/plant-repo.ts (:357, :359, :361, :364, :366, :368), each "process boundary, covered by gates-integration ...".
  - I accept :357, :364 and :368 (the loops and the `symlink`/`cp` calls). Their effects are asserted by the integration tests.
  - I do not accept :361 (the `mayBeAbsent` choice) or :366 (the existence guard of the following line). Hand mutants of both survive the named test and the whole `gates-integration` project; see R1-01 and R1-02.
  - :359 (the `cp` call) is accepted.
- **T008 exemption.** It is justified. The `lit` and analyzer pins, the lockfile and the `.gitignore` lines have no behaviour of their own. Their exactness and lockfile match are checked by the unchanged `pins` gate, which passes.

## Checks run

All runs used Node 22.23.4 with `OCELLE_CHROMIUM_PATH` set, at HEAD `8d39e99`.

| Check | Result |
|---|---|
| `pnpm run gate:typecheck` | pass (no type error) |
| `pnpm run gate:lint` | pass (171 files) |
| `pnpm run gate:test-lint` | pass (111 files) |
| `pnpm run gate:style-lint` | pass |
| `pnpm test` | pass (2057 tests in 96 files) |
| `pnpm -r build && pnpm run gate:csp` | pass (23 files) |
| `pnpm run gate:prefix` | pass (116 files) |
| `pnpm run gate:pins` | pass (5 manifests) |
| `pnpm run gate:config-copies` | pass |
| `pnpm run gate:contrast`, `gate:brand-rules` | pass |
| `pnpm run gate:signoff -- --range ee8e4a1..HEAD` | pass (4 commits) |
| `pnpm run gate:plants` | pass (188 plants of 13 gates, including the four new pins plants) |
| `pnpm run gate:mutation -- --base ee8e4a1` | exit 0, 71 mutants, none survived, 6 records (two not accepted, R1-01 and R1-02) |
| Hand mutants of plant-repo.ts:362 and :367, in a scratch copy of HEAD, `vitest run --project gates-integration` | both survive (73 of 74 pass; the one failure, `setup-offline.test.ts`, comes from the copy not being a git checkout and is unrelated) |

**Tasks.** T001 to T010 are ticked and their work is present:

- T004: `vitest.config.ts`, `vitest.mutation.config.ts`, `vitest.mutation.elements.config.ts`, and `stryker.elements.config.json`, which differs from `stryker.config.json` only in `vitest.configFile` and `jsonReporter.fileName`.
- T005: `gates/lib/pins-rules.ts` and the four plants.
- T006: `pnpm-workspace.yaml`, the README pins row, and the 001 R-04 amendment.
- T007: `gates/lib/plant-repo.ts`, including the `configurationName` pattern for both new names.
- T008: the pins, the lockfile and `.gitignore`.
- T009 and T010: the two records.

Nothing outside the phase changed.

**Plan and constitution.**

- The changes follow research.md R-11, R-12 and R-16 and plan decision 16.
- No element, event, token or CSS changed, so Principles I to V do not apply to this phase's diff.
- The supply-chain rule holds: exact pins, committed lockfile, and approvals scoped to one version each.
- Principle VIII is not met, because of R1-01 and R1-02.

## Earlier findings

None. This is round 1.
