---
phase: 4
round: 3
verdict: approved
base: 835df815b08826710d13a37be17a9baa235bd5f9
head: f55341e
tdd_check: pass
---

# Phase 4 review, round 3

Scope: the fix round for the operator round `round-2.md` (O2-01, landing finding L1-01), that is
`git diff 68f4608..f55341e`. It holds the red commit `e01ecf3` (`red.sh 4 fix-2`), the green commit `bf23d26` and the
tdd-check `f55341e`. There is no uncommitted change. The stop rule applies: I checked that O2-01 is resolved and that
nothing regressed, and I did not search afresh beyond that. I read `round-2-fixes.md`, `fix-2-gates.md`, `plants.md`,
`red-fix-2.log`, `check-red-fix-2.log` and `tdd-check.json`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | `specs/010-feedback-forms/reviews/phase-4/plants.md:3-12` | The plants record uses base `68f4608` (the red commit's parent), not `base.sha` (`835df81`). Read literally, step 5 of the review procedure makes another base blocking. I judge it a note, for three reasons. (1) I confirmed that `--affected 835df81 --list` selects "309 of 309" only "by gates/bin/plants.ts (shared gate source)", because the merge of `main` brought in `c4c0af4` (op 016, PR #45), and `main`'s own Plants check already judged that change. (2) The phase's own source change was judged at its base by the T056 run: 301 plants, recorded in `plants.md` as of `436e727`. (3) The fix's only source change, `ocelle-form-select.ts`, is covered by this run. `--affected 68f4608 --list` gives exactly the 21 `note: affected:` lines of the record (diffed), and the recorded exit is 0. CI's Plants check still judges every plant before landing. One side effect: the file now replaces the T056 record instead of adding to it, so that record is only in history. | Optional: keep both runs in `plants.md` (T056 at `835df81`, fix-2 at `68f4608`). The operator may still ask for a full run at `835df81`. |
| R3-02 | note | `specs/010-feedback-forms/reviews/phase-4/red-fix-2.log:8`; `check-red-fix-2.log:5` | The implementer replaced the pnpm store path `/root/…` with `~` in the red log after the run, and disclosed it in `round-2-fixes.md`. The change touches only pnpm's install banner, not the test output. The tdd-check's own independent rerun (`check-red-fix-2.log`, unedited) shows the same three failures and "3 of 4739 tests failed", so the red evidence does not rest on the edited file. The redaction is also incomplete, because `check-red-fix-2.log:5` still has the `/root/` path. | None needed. If redaction is wanted, make it a step of `red.sh`/`tdd-check.sh` rather than a hand edit of evidence. |
| R3-03 | note (follow-up) | `packages/elements/src/ocelle-form-select.ts:158-159` (`syncFormValue()`, `this.hasUpdated && …`) | Before its first render, the select submits no form value, while a native select would already submit its default. This was raised as out of scope. It is not a blocking finding against FR-024 or FR-021. FR-024 is about events (`spec.md:826-830`) and is met: no error, no event on reset. FR-021 (`spec.md:772-776`) is about the default and reset values, and `value` gives the right default at once (the rule test reads it synchronously). The gap shows only in a `FormData` read in the same task as the insertion. It dates from the phase's green change `436e727`, not from this fix, and the existing scenarios agree with the native select from the first render on. Under the stop rule it is not a regression. | Follow-up for the operator: a task in a later round (test first) if the form value should match the native select before the first render, for example by computing it from `listedOptions()` when `!hasUpdated`. |

There are no blocking findings.

## Test quality

**Red evidence.** `red-commits` has `fix-2 e01ecf3`. The red commit changes test files only:
`test/scenarios/form-select.ts`, `test/form-select-rules.test.ts`, and the three drivers that add a `reset` batch
operation. `red-fix-2.log` and the tdd-check's own `check-red-fix-2.log` both show exactly the 3 new tests failing
("3 of 4739 tests failed"), with no setup or import error:
- the FR-024 scenario in process (`test/form-select.test.ts:23`) and on the strict-CSP fixture
  (`test/browser/form-select.test.ts:45`), each rejected by its assertion;
- the rule test (`test/form-select-rules.test.ts:179`), failing on `errors: [ …(3) ]` (the three `TypeError`s from
  `initialValue()` reading `null.options`).

That is the missing behaviour, as O2-01 describes it. `tdd-check.json` is `pass`: head `bf23d26`, `head_exit` 0, no
problems.

**Weakened tests.** None. `git diff e01ecf3..f55341e -- packages/elements/test` is empty, and the green commit touches
only `src/ocelle-form-select.ts`.

**Assertions.**
- The scenario (`test/scenarios/form-select.ts:416-436`) asserts no page messages, then the value, form data and shown
  index of the element against a native select given the same batch.
- The rule test reads the value synchronously after the reset, before `firstUpdated()` can correct it. It covers three
  cases against the native select: a marked option in a group, a disabled group plus a disabled first option, and no
  options. It also collects `error` events through a listener that is removed in `finally`.

Neither test has a conditional assertion, `skip`/`only` or a mock.

**Mutation.** I ran `pnpm run gate:mutation -- --base 68f4608 --files packages/elements/src/ocelle-form-select.ts`.
It exited 0 in 329 s: "16 mutants on the changed lines of 1 file, none survived; 0 timeouts, 3 compile errors, 0
zero-mutant entries; 0 equivalent records". The 3 compile errors are at `:144` (`firstEnabled` body) and `:176`, and
they are reports, not findings. This is the same result as run 2 in `fix-2-gates.md`.

**The first mutation run's exit 2.** It does not point at a flaky or order-dependent test from this fix:
- My mutation run's unmutated initial run passed on the first try.
- The three select test files (117 tests) passed 3 of 3 times in a row.
- Shuffled test order (seeds 1, 7 and 42) passed 3 of 3 times on those files plus `form-input.test.ts` (177 tests).
- Stryker's own Vitest config (`vitest.mutation.elements.config.ts`, all 34 in-process files, 704 tests) passed with
  file order shuffled for seeds 3 and 11. That is the setup in which the earlier order leak (005 phase 4 R1-01) showed.
- The new tests clean up after themselves: the rule test removes its `error` listener in `finally`, and the scenario
  mounts into its own containers.
- The failed run started right after a 22-minute `gate:unit-tests` run, with Stryker at concurrency 8 on 4 CPUs. This
  phase already recorded the same one-off "failed tests in the initial test run" under load, before this fix
  (`reviews/phase-2/mutation.md:138-141`).

Most likely, then, it was a timing failure under load. The gate wrote no report, so which test failed is not known.

## Checks run

All checks were run on HEAD `f55341e` in this container, with `OCELLE_CHROMIUM_PATH` set to Chromium 1243.

| Check | Result |
|---|---|
| `vitest run --project elements --project elements-browser` on `form-select-rules`, `form-select` (in process and fixture), 3 runs | 117 passed each time |
| the same files plus `form-input.test.ts`, `--sequence.shuffle`, seeds 1, 7 and 42 | 177 passed each time |
| `vitest run --config vitest.mutation.elements.config.ts --sequence.shuffle.files`, seeds 3 and 11 | 34 files, 704 tests passed each time |
| `gate:mutation -- --base 68f4608 --files packages/elements/src/ocelle-form-select.ts` | exit 0, 16 mutants, none survived |
| `gate:plants -- --affected 68f4608… --list` | exit 0, 21 of 309 selected, identical to `plants.md` |
| `gate:plants -- --affected 835df81… --list` | 309 of 309, "by gates/bin/plants.ts (shared gate source)" |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 355 files, no finding |
| `gate:test-lint` | exit 0, 255 files, no finding |
| `gate:manifest` | exit 0, 9 elements, no finding |

I did not rerun the full `gate:unit-tests` (4739 tests, about 22 minutes). For that I rely on `fix-2-gates.md` (exit 0)
and on `tdd-check.json` (`head_exit` 0, `check-head.log`). I did not judge the plants again.

## Earlier findings

- **O2-01 (blocking): resolved.**
  - `initialValue()` (`ocelle-form-select.ts:174-177`) now reads the default from `listedOptions()` (`:153-155`: the
    `<option>` children and the `<option>`s of `<optgroup>` children, the same set `mirror` gives the native select).
    A reset before the first render therefore no longer calls `control()`.
  - `firstEnabled`/`defaultIndex` take their options as a parameter, so `mirrorOptions()`/`showChoice()` behave as
    before.
  - The `control()` comment (`:164-166`) is corrected.
  - The red scenario and the rule test fail on the old code and pass now. The existing select scenarios are unchanged
    and pass.
  - `formStateRestoreCallback` before the first render does not call `control()` either (`form-control.ts:416-422`
    plus the `hasUpdated` guard of `syncFormValue()`).
  - Tasks T057a and T057b are ticked (`tasks.md:249-250`), and the work is present.
