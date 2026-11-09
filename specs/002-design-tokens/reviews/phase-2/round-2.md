---
phase: 2
round: 2
verdict: approved
base: 98c1dcdaa0731fa7e9b668001eb78dbb7831d1d7
head: ed96afa8097f10fb71ab1bf927306a80b3f25de7
tdd_check: pass
---

# Phase 2 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/002-design-tokens/reviews/phase-2/red-commits | There is no `fix-1` red commit. The fix note gives the reason: R1-01 to R1-03 were weak-test findings, not behaviour defects. I checked this. I copied the four changed test files from HEAD onto the source tree of `1ac5bef` (before the fix) in the scratchpad and ran them: 174 of 174 pass. So the fix changes no behaviour that the tests can see, and a red commit was not possible. Each new test is shown able to fail by the mutant it kills (the mutation run below). | None. |
| R2-02 | note | packages/tokens/src/generate.ts:113-114, 171 | The fix makes two source edits, and I checked that each is a refactor. (1) `refProblems` drops `ref.length === new Set(ref).size`. `references()` (line 77-78) deduplicates through a `Set`, so `found` holds each name once. A `ref` with the same length that contains every name of `found` therefore has no duplicate (pigeonhole). The doc comment states this. The new test "a ref that names a reference twice" still gets the exact message. (2) The cycle edges now use `themes.flatMap(... references(...))` instead of `references(joined)`. This can repeat a name that both themes reference. The repeat is harmless: in `walk` a repeated `next` either equals `start`, which already returned at its first occurrence, or is already in `visited`. The order of first occurrences does not change, so the cycle reported is the same. | None. |
| R2-03 | note | gates/stylelint/token-only.ts:118, 131; packages/tokens/src/generate.ts:177 | I read the three new equivalent-mutant records and each reason holds. Line 118: without `loaded.set`, each file reloads the same lists from the same `process.cwd()`, so the warnings are the same and the cache only saves reads. Line 131: `checkLists` checks the two lists only against each other for a clash, and a `"Stryker was here"` entry can neither match a `--ocelle-*` `var()` name nor clash. Line 177: `walk` is called only with a key of `edges`, either `start` or a `next` that passed `edges.has(next)`, so the `?? []` never applies. | None. |

## Test quality

- **Red evidence.** It is unchanged from round 1. `check-red-phase.log` shows the red commit `3bf7ffc` failing against the scaffold on assertions (exit 1). `check-final-tests-on-scaffold.log` exits 1 and `check-final-tests-on-base.log` exits 2, on the expected load error of `../scripts/build.ts` at the base. `tdd-check.json` is `pass` with no problems, for head `ed96afa`.
- **Tests changed since red** (`git diff 3bf7ffc..HEAD` on test paths). There are only additions: gates/test/integration/plants.test.ts (+5, accepted in round 1), gates/test/token-only.test.ts (+112, of which 2 lines are import changes), packages/tokens/test/validate.test.ts (+67), resolve.test.ts (+8) and overrides.test.ts (+8). No test was weakened, skipped, deleted or loosened.
- **New tests.** Every one asserts exact observable output:
  - the exact `manifestProperties()` reasons (15 cases) and the order of the names it returns;
  - exact `loadLists()` messages together with `cause.code`, `cause.name` and `cause.message`;
  - exact `referencedTokens()` results;
  - the rule's exact warnings with only `tokens`, with only `elementProperties`, and with `[true, null]`;
  - exact `validateSource` problem lists for refs, per-theme refs, cycles, a duplicate that would loop, color-scheme wrong in dark, and opacity in one theme only;
  - the exact cycle error of `resolve()`;
  - an override that keeps `ref` and `contrast`.

  None is conditional, uses `skip` or `only`, relies on snapshots or swallows an error.
- **Mutation.** `pnpm run gate:mutation -- --base 98c1dcdaa0731fa7e9b668001eb78dbb7831d1d7` exits 0. It ran 657 mutants on the changed lines of 8 files and none survived. It found 14 equivalent records: the 11 build.ts I/O-boundary records accepted in round 1 (R1-04) and the 3 new ones accepted in R2-03.

## Checks run

Browser tests ran with `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad `pw` alias (phase 1 R1-02).

| Check | Result |
|-------|--------|
| `pnpm test` | pass: 1440 tests in 67 files |
| `gate:typecheck` | pass |
| `gate:lint` | pass: 121 files |
| `gate:test-lint` | pass: 73 files |
| `gate:style-lint` | pass |
| `gate:config-copies` | pass |
| `gate:pins` | pass: 5 manifests |
| `pnpm -r build` | pass |
| `gate:csp` (after build) | pass: 7 files |
| `gate:prefix` (after build) | pass: 47 files |
| `gate:plants` | pass: 141 plants of 11 gates |
| `gate:mutation -- --base 98c1dcd` | pass: 657 mutants, none survived, 14 equivalent records |
| tdd-check.json | `pass`, no problems |

Tasks: T008 to T029 are all ticked, as in round 1. The fix commit `ed96afa` touches only the files that the round-1 findings name, plus the fix note and the mutation log. The constitution and the plan are unaffected by the fix: generate.ts stays pure and no element code changed. `git stash@{0}` is an operator copy and not part of the phase, so I did not review it.

## Earlier findings

- **R1-01 (token-lists.ts mutants): resolved.**
  - The new `describe("manifestProperties()")` asserts every reason exactly, including the cases that had no coverage: a module that is not an object, declarations that is not a list, a declaration that is not an object, and cssProperties that is not a list.
  - `loadLists()` tests now assert the read error (`EISDIR`, `cause.code`), the JSON `cause`, an exact schema message, both load failures with `cause.message`, and the validation error as `cause`.
  - token-lists.ts did not change, and the mutation run shows no survivor in it.
- **R1-02 (generate.ts mutants): resolved.**
  - New validate, resolve and overrides tests cover `every` versus `some` (opaque in one theme only), color-scheme wrong in dark, a duplicate in a ref, a lacking ref with the full message, per-theme unknown refs, cycles not through the start, a cycle after a terminating reference, the duplicate-first-record edge, the cycle error of `resolve()` (line 100 formerly NoCoverage, and line 106), and an override that keeps `ref`.
  - Line 111 was removed as a true equivalent and line 168 was rewritten; both are verified in R2-02. Line 174 (now 177) carries a valid record (R2-03).
  - Mutation run: no survivor.
- **R1-03 (token-only.ts mutants): resolved.**
  - A bare `var` word, only `tokens` or only `elementProperties` as options, and `[true, null]` kill lines 99, 128 and 130.
  - Lines 118 and 131 carry valid equivalent records (R2-03).
  - Mutation run: no survivor.
- **Red tests for the fix:** none is required. R2-01 confirms that no behaviour changed.
