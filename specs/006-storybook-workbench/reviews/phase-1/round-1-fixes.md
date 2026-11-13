# Phase 1 review, round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none at HEAD: the stubs already behave as T003 specifies (exit 2, one line), so a test of them cannot be red at the fix's parent; the new tests fail on the reviewer's mutants (below) and on the phase base de022bb, where the stubs do not exist, which the automatic final-tests-on-base check runs | gates/test/entry-stubs.test.ts; gates/test/integration/entry-stubs.test.ts; gates/bin/axe.ts:10, baselines.ts:10, storybook-build.ts:10, visual.ts:10; reviews/phase-1/tdd-exempt.md |

R1-02 to R1-04 are notes and need no change.

## R1-01

The finding names missing tests for code that is already right, so this follows step 3's rule for a weak or missing
test: the tests come in the fix commit. `red.sh 1 fix-1` was not run: on a tests-only commit over 7874183 every new
case passes, so it would report `"red": false` and record nothing; amending the stubs to make them fail would be a
change the finding does not ask for.

- `gates/test/entry-stubs.test.ts` (gates project, in Stryker's scope): each stub's `run()` throws exactly its message,
  asserted with `toThrow(new Error("<message>"))`. This kills the four `StringLiteral` mutants in process.
- `gates/test/integration/entry-stubs.test.ts` (gates-integration): `node gates/bin/<name>.ts` for each of the four,
  asserting `{ code: 2, stdout: [], stderr: ["could not run: not implemented (<gate>, phase <n>)"] }` with `toEqual`.
  This fails on the `false` guard mutant (exit 0, no line) and on the message mutants.
- Each `if (import.meta.main) await main(run);` now carries
  `// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/entry-stubs.test.ts "<case>"`,
  naming its own case, in the form of gates/bin/prefix.ts:128.
- tdd-exempt.md no longer says no test could fail for the stubs: the T003 exemption excludes them, a new section
  says they have behaviour and names both tests, and the mutation note says which test kills the message mutants and
  which record covers the guard.

Non-vacuity, by hand at the fix (files restored with `git checkout` afterwards): with the axe message replaced by `""`,
the storybook-build message cut to `"not implemented"` and the visual guard replaced by `false`, 5 of the 8 new cases
fail, each on its assertion (`expected a thrown error to be Error: not implemented (axe, phase 4)`,
`expected [ 'could not run:' ] to deeply equal ...`, the visual case receiving code 0); the other 3 are the cases of
the stubs left unmutated.

## Checks run

Node v22, `OCELLE_CHROMIUM_PATH` set, `PLAYWRIGHT_BROWSERS_PATH` aliased (chromium-1248 to the installed 1243), one at a
time:

- `pnpm run gate:mutation -- --base de022bb`: exit 0, `16 mutants on the changed lines of 4 files, none survived; 4 equivalent records`.
- `pnpm test`: exit 0, `unit-tests: 2048 tests passed in 100 files`.
- `gate:typecheck` 0; `gate:lint` 0 (178 files); `gate:test-lint` 0 (115 files); `gate:prefix` 0 (132 files);
  `gate:config-copies` 0; `gate:signoff -- --range de022bb..HEAD` 0.
