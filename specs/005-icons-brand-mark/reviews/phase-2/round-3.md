---
phase: 2
round: 3
verdict: approved
base: 12fd44387bd64b75313074973d12195802557d54
head: ce3b27d34f34126f88416966ed25e76834365034
tdd_check: pass
---

# Phase 2 review, round 3

Scope, under the landing stop rule: this round checks whether operator round 2 (`round-2.md`, OP2-01 and OP2-02 from
landing round 1 of PR #26) is resolved, and whether the fix regressed anything. It does not search the phase afresh.
The fix is red `aa82d51` (test only) and fix `ed8687a`, with the fold tasks from `38b81d3` (T064 to T066). HEAD
`ce3b27d` adds only the red/green check outputs for phases 2 and 4 on top of `afbe322`, which is the phase 4 round 3
fix and out of scope here. Nothing is uncommitted.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | `reviews/phase-2/check-final-tests-on-scaffold.log`; `tdd-check.json` `final_tests_on_scaffold_exit: 2` | The check now runs the final tests on the scaffold `aef5ed7`, but that run never reaches a test. `tdd-check.sh` overlays every test-path file changed in `base..HEAD`. Phase 2's base comes before phases 3 to 5, so that is now 76 files where it was 53. They include phase 3 to 5 tests and helpers, and the scaffold cannot load them, so Vitest reports zero test results ("no test file found", exit 2). The non-zero exit still meets the script's rule, but the committed log no longer shows that the final tests fail on assertions against the scaffold: the evidence has been lost. The run before the landing (`ce3b27d^`) exited 1 with "197 of 2223 tests failed" on assertions and `not implemented`, and it remains in the history. I re-ran the check by hand: I overlaid HEAD's versions of the 53 phase 2 test files, plus the later helpers they now import, onto `aef5ed7`. The first try without the helpers failed to load: `build.test.ts` imports `../node/brand-pairs-check.ts`, which arrived after the scaffold. With the helpers, the run exits 1 with "277 of 2300 tests failed", and 274 of the failure lines are `AssertionError`, `not implemented` or "is not a function". These include the two new OP2-02 cases, which fail because the README and CHANGELOG are empty at the scaffold. The other three are the same missing behaviour (`delta.json: unknown key manifest` twice, and a `filter` of undefined in `manifest.test.ts`). So the property still holds and nothing is hidden. It does not block, because the round 2 fix adds no behaviour that a scaffold run would have to show. | None for this phase. Future landing rounds for an earlier phase would keep their evidence better if the scaffold overlay were limited to that phase's own test files and the helpers they import, rather than every test file since base. |

No blocking finding.

## Test quality

- **Red evidence, fix-2.** `aa82d51` changes only `packages/elements/test/node/readme.test.ts`, which is inside
  `test_pathspec`. Both `red-fix-2.log` and the independent `check-red-fix-2.log` show 3 of 2520 tests failing, all on
  assertions:
  - the `define` statement and the `:host([hidden])` statement are expected without "(FR-006)" and "(FR-034)";
  - the new case "README.md holds no FR-, SC-, US<n>-<n>, PLAN-, R-<nn> or T<nnn> reference" fails with
    `[ 'FR-006', 'FR-034' ]`.

  That is the missing change, not a setup error. The first attempt, which failed in setup (no Chromium at the
  default path), is stated in `round-2-fixes.md` and was not kept as evidence. That is correct.
- **Not weakened.** `git diff aa82d51..HEAD -- packages/elements/test` is empty, so the tests at HEAD are the red
  ones.
- **Not vacuous.** The new `it.each` case over `README.md` and `CHANGELOG.md` asserts `not.toBe("")` before the
  regex match, so a missing or empty file cannot pass it. The scaffold re-run shows this firing ("expected '' not to
  be ''"). Each of the two changed fragments is a full sentence that ends at its full stop, so the ID cannot come
  back after the sentence without failing the fragment check. There is no conditional assertion, `skip` or `only`.
- **T066 exemption** (`tdd-exempt.md`). It is justified: I checked that no test or gate reads
  `specs/001-repository-foundation/contracts/ci-checks.md`. The registry check compares `gates/gates.json`,
  `gates/lib/registry.ts` and `ci.yml`, which already held `manifest`. A test of a spec document is not asked for by
  any task.
- **Mutation.** The round 2 fix changes no source in the scope of mutation testing: it touches a README, a spec
  contract, a test and review files. `pnpm run gate:mutation -- --base 38b81d3 --plan` covers the whole landing fold
  up to HEAD and plans one shard, `gates/stylelint/token-only.ts` (21 lines). That is the phase 4 OP4-01 change,
  which the phase 4 review judges, so I did not run it here. Phase 2's own source has not changed since round 1's
  mutation run.

## Checks run

On Node 22 (CI pins 26.13.0), one at a time, at HEAD `ce3b27d`:

- `gate:typecheck`: no type error.
- `gate:lint`: 223 files checked, no finding.
- `gate:test-lint`: 152 files checked, no finding.
- `gate:plants`, with `PLAYWRIGHT_BROWSERS_PATH` set: 218 plants of 14 gates and the registry judged, every plant
  as expected. That is one more than in `round-2-fixes.md`; the extra one is phase 4's `fail-lh-paren-factor`.
- Unit tests at HEAD, from `tdd-check.sh 2` (`check-head.log`, at `afbe322`; `ce3b27d` adds only logs): 2532 tests
  passed in 119 files, exit 0.
- `tdd-check.sh 2` (`tdd-check.json`): `status: pass`, red `phase` exit 1, red `fix-2` exit 1, final tests on base
  exit 2, final tests on scaffold exit 2 (see R3-01), HEAD exit 0, no problems.
- A manual scaffold re-run with only the phase 2 test files (see R3-01): exit 1, 277 of 2300 tests failed.
- `grep` of `packages/elements/README.md` and `CHANGELOG.md` for `US<n>`, `OP<n>`, `L1-` and "scenario <n>"
  references, beyond what the test covers: none.

## Earlier findings

- **OP2-01: resolved.** `specs/001-repository-foundation/contracts/ci-checks.md`:
  - The first table has the row `Custom-elements manifest` / `pnpm run gate:manifest` (job id `manifest`; since 005),
    before `Plants`. The table now has fifteen rows.
  - The gate-id paragraph names `manifest` of 005 FR-009, "fourteen in all". This matches the 14 ids of
    `gates/gates.json`.
  - The required-checks paragraph says fifteen check names, and that `gates/README.md` lists the same fifteen. It
    does: § Required checks on `main`, items 1 to 15, with item 14 `Custom-elements manifest`. The CI job names in
    `ci.yml` also match, apart from the two mutation helper jobs.
  - A 2026-11-12 paragraph for mission 005 follows 002's and says the ruleset on `main` must add the check name
    `Custom-elements manifest`. 002's historical "fourteen rows" sentence is left unchanged, which is right for a
    record of that time.

  T066 is ticked.
- **OP2-02: resolved, with a red test.** `packages/elements/README.md` lines 231 and 243 no longer carry "(FR-006)"
  and "(FR-034)", and the sentences are otherwise unchanged (`git show ed8687a`). The red test is `fix-2` `aa82d51`,
  and the test now passes at HEAD. T064 and T065 are ticked.
- **Regression.** `ed8687a` touches only the README, the contract, `tasks.md` (ticks) and phase 2 review files, and
  every check above passes.
