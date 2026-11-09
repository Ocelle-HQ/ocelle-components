---
phase: 5
round: 4
verdict: changes_requested
base: eeb95d43d7ffa147e14193e215859c2c4a41586d
head: 73f827ff2115f62bf43f5619649970c2d6f2e40e
tdd_check: pass
---

# Phase 5 review, round 4

Scope: the fix of operator round 3 (O3-01, landing L1-01, task T070). The red commit is `2bf1e4b` (fix-3), the
green commit is `3659d22`, the evidence is `1b25f8c`, and the note is `round-3-fixes.md`. HEAD `73f827f` is
`6cbec1a` plus the phase 2 round 4 review commit. That commit changes only `reviews/phase-2/`, so the code is the
same as at `6cbec1a`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | specs/002-design-tokens/tasks.md:208 | T070 is still `- [ ]`. Its work is present and correct (see below), but the box was not ticked. The implementer ticked the earlier fix task T068 in its fix commit `c097c8c`. | Tick T070 (`- [X]`). No code change is needed. |
| R4-02 | note | specs/002-design-tokens/reviews/phase-5/red-commits:3 | The red commit `2bf1e4b` was amended once to add the plant count change in `gates/test/integration/plants-robustness.test.ts:159` (30 to 31). The amended commit is the one recorded in `red-commits`. `red-fix-3.log` and `check-red-fix-3.log` both show its failure (`expected { others: 11, plants: 30 } to deeply equal { others: 11, plants: 31 }`). The amended commit still changes only test files. | None. |
| R4-03 | note | CI run 41930740532 on `6cbec1a` | The CI shard `packages/tokens/src/generate.ts:121-240` was cancelled at its 10-minute limit, so the "Mutation testing" rollup check is not green. The green commit adds line 159 in that range. My `--files` run for this phase mutates only the lines changed since base `eeb95d4` (63-64 and 159), so it does not show the mutant count of that CI range. The operator is investigating the shard. I made no change for it. | None for this review. The check must be green before landing (operator). |

## Test quality

- **Red** (`red-fix-3.log`, confirmed by `check-red-fix-3.log` from my `tdd-check.sh 5` run): 3 of 1798 tests fail, each
  on an assertion:
  - `validate.test.ts:258` "for exempt on a colour token other than color-disabled-ink": expected throw, none;
  - `validate.test.ts:272` "over the real source, for exempt on color-ink-muted by an override": expected throw, none;
  - `plants-robustness.test.ts:158`: plant count 30 against 31.
  
  These fail because the behaviour is missing, not because of a setup or load error.
- **Against T070:**
  - `validate.test.ts` asserts the exact problem `token <name>: exempt is allowed only on color-disabled-ink`, both
    for a fixture token (`color-ink`, through `it.each(cases)` with `toThrow(new Error(...))`, an exact message) and
    for `color-ink-muted` over the real source by `applyOverrides`.
  - It asserts that `exempt` on `color-disabled-ink` stays valid, both for a fixture and for the real source (which
    must still carry `exempt: true`).
  - `gates/test/contrast.test.ts` renames `color-disabled` to `color-disabled-ink` in the records, pair entries,
    override, expected lines and `--print` lines. Each of these is a rename only, and no assertion was loosened.
- **Not weakened:** `git diff 2bf1e4b..HEAD` over the test pathspecs is empty. The green commit changes no test.
- **Can fail:** the tests have no conditional assertions, no skip or only, and no mock. The guards in the real-source
  test (`kind` is `text`, grounds not empty) are assertions, not conditions. They make the override reproduce the real
  token's `contrast`.
- **Mutation** (`round-4-mutation.log`): `pnpm run gate:mutation -- --base eeb95d4 --files packages/tokens/src/generate.ts`
  (the only source file the fix changed) gives `10 mutants on the changed lines of 1 file, none survived; 0
  equivalent records`. The plant JSON and the README are not mutated.

## Design against the contract

- `packages/tokens/src/generate.ts:64,159`: `recordProblems` adds `token <name>: exempt is allowed only on
  color-disabled-ink` when `contrast.exempt` is present on any name other than `color-disabled-ink`. The check uses
  the name only, whatever the token's values or figures. That matches data-model.md:29-32 and contracts/gates.md:86-89
  and :98. `validateSource` collects the problem with the others in source order, so the build, style-lint,
  `contrast` and `brand-rules` all stop on it.
- `gates/plants/contrast/exempt-not-disabled-ink/`:
  - `delta.json` is exactly the `text-below-threshold` delta plus a `color-ink-muted` override. I compared the two
    files key by key. The override's `kind` (`text`) and grounds (the nine `main` grounds) are those of `source.ts:40`,
    with `exempt: true` added.
  - `plant.json` expects `error` with the cause of contracts/gates.md:245-250, word for word.
  - `gate:plants` judges it as expected.
- `gates/README.md:35` lists the plant among the `contrast` breaking plants, as contracts/gates.md:229 does.

## Checks run

All checks ran on Node 22.23.4, at `6cbec1a` code, with `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad browsers.

- `tdd-check.sh 5`: `pass` (phase, fix-1 and fix-3 red, exit 1; head exit 0; no problems). The re-run evidence is
  committed with this review.
- `pnpm test`: 1798 tests passed in 88 files.
- `gate:contrast`: 158 pairs in light, 157 in dark. `gate:brand-rules`: 7 rules.
- `gate:plants`: 177 plants, every one as expected. I ran it alone, not during a mutation run.
- `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:prefix`, `gate:csp`,
  `gate:config-copies` and `gate:pins` all pass.
- `gate:mutation` as above.

## Earlier findings

- **O3-01 (blocking):** resolved. `validateSource` rejects `contrast.exempt` on any token other than
  `color-disabled-ink`, naming the token and the rule. The breaking plant `exempt-not-disabled-ink` turns the L1-01
  reproduction into exit 2. The `color-disabled` fixtures of `gates/test/contrast.test.ts` are renamed. The red test
  came first: `fix-3` is in `red-commits` and is proven red by `tdd-check.sh`. The only open item is the unticked
  T070 box (R4-01).
