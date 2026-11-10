# Phase 1, review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: the finding is that a test was weak and the code is already right, so the strengthened test passes at once (speckit-story-fix step 3). The hand mutant `if (false) continue;` now fails it (`fix-1-mutant-R1-01.log`: the tokens and elements links show up as dangling links). | gates/test/integration/plant-repo.test.ts `sourceRoot`, `packageLinks`, "links the node_modules of a package that has its own, and none for a package without" (buildRepoTree and buildMutationRepo, from a repository root built in a temporary directory, so the result does not depend on the repository's install state); the record at gates/lib/plant-repo.ts:366 now names that test |
| R1-02 | fixed | none, for the same reason as R1-01. The hand mutant `await copied.catch(ignoreMissing);` now fails 4 cases (`fix-1-mutant-R1-02.log`: "promise resolved instead of rejecting"). | gates/test/integration/plant-repo.test.ts "rejects building from a repository root without %s, naming it" (four required entries, both builders, the rejection names the missing path) and "builds from a repository root without the element files that may be absent, leaving them out"; the record at gates/lib/plant-repo.ts:361 now names those tests |
| R1-03 | fixed | none (docs) | specs/005-icons-brand-mark/reviews/phase-1/tdd-exempt.md: 25 changed to 26 |
| R1-04 | deferred: a note with no change required now. The phase 2 spike records the Node 26 result. | none | none |

Checks run on Node 22: `gate:typecheck`, `gate:lint` and `gate:test-lint` pass; `pnpm test` passes (2063 tests in 96 files);
`gate:mutation -- --base ee8e4a1` exits 0 (71 mutants, none survived, 6 records; the records at :361 and :366 now name
tests that kill the hand mutants).
