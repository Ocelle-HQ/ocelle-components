---
phase: 4
round: 4
verdict: approved
base: d397da19bd4cb199a1a6295e1c9aa061e0148c67
head: b105a26b09bab65770a115a0df92333f049dba32
tdd_check: pass
---

# Phase 4 review, round 4

This round follows the landing fold for PR #26. Under the landing stop rule it checks two things: that OP4-01
(round 3) is resolved as `round-3-fixes.md` says, and that the fix broke nothing, including the shipped
`iconSlotStyles` row padding. It does not look for new findings.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | `reviews/phase-4/check-final-tests-on-scaffold.log`; `tdd-check.json` `final_tests_on_scaffold_exit: 2` | This is the same as phase 2 round 3 R3-01. `tdd-check.sh` overlays every test-path file changed in `base..HEAD`, and that is now 38 files. They include phase 5's tests and helpers, which the phase 4 scaffold `259bb7b` cannot load, so Vitest finds no test file and exits 2. That still meets the script's rule, but the committed log no longer shows the final tests failing on assertions. The run before the landing (`ce3b27d^`) exited 1 with "129 of 2433 tests failed". I re-ran it by hand: a worktree at `259bb7b`, with HEAD's versions of only phase 4's 16 test-path files (`git diff --name-only d397da1..38e7e16`, the phase 5 base). That run needed no later helper. It exits 1 with "179 of 2489 tests failed". All 179 failure lines are `AssertionError`, `not implemented` or "is not a function", and none is a load or setup error. 61 of them are in `gates/test/token-only.test.ts`, the new OP4-01 rows included. So the scaffold property still holds. It does not block: the OP4-01 fix is a gate change that a scaffold run need not show. | None for this phase. R3-01 already suggests limiting the overlay to the phase's own test files. |
| R4-02 | note | `tasks.md` T069; `reviews/phase-4/plants.md` (landing fold section) | T069 asks for `gate:mutation -- --base <phase base>`, but the implementer ran `--base b65dabf`, which covers only the fix's lines (24 mutants). For this fix that run is enough: its source change is confined to `gates/stylelint/token-only.ts` (`operandsOf`, `admittedLine`), and those are exactly the lines it mutates. It does not show that the rest of the phase's changed code still kills its mutants, though, and the procedure asks for the phase base. I ran it at the phase base (see Checks run): 218 mutants on the changed lines of 6 files, none survived. | None. A future fold should run the base the task names, or record why it ran a narrower one. |

No blocking finding.

## Test quality

- **Red evidence.** `red-commits` has `fix-3 b65dabf`. `red-fix-3.log` and the check's own `check-red-fix-3.log`
  agree: 7 of 2532 tests failed, each `AssertionError: expected [] to deeply equal [ '1lh' ]`. There is one per
  factor case: `(1lh) * 3`, `calc(1lh) * 3`, `3 * (1lh)`, `((1lh)) * 3`, `(1lh) / 2`, `… * (1lh)` and
  `… - calc((1lh)) / 2`. That is the missing behaviour, not a setup error. The guard row
  `calc((1lh) + (1lh) + …)` passed at red, as the fix note says, and it is not counted as a red test.
- **No weakening.** `git diff b65dabf..HEAD -- gates/test packages/*/test` is empty, so the red rows stand
  unchanged.
- **Assertions.** Both `it.each` tables assert the exact `rawValues()` result with `toEqual`: `["1lh"]`,
  `["1lh", "1lh"]` or `[]`. None is conditional, none uses skip or only, none mocks. The negative table pins the
  shipped row `calc((var(--ocelle-icon-size) - 1lh) / 2)` to `[]`, alongside three sum cases: `(1lh) + …`,
  `… - calc(1lh)` and `… + ((1lh))`. These would catch a fix that over-reports.
- **Fail plant.** `gates/plants/style-lint/fail-lh-paren-factor` expects `packages/elements/src/x.ts:6` with
  `ocelle/token-only` and `1lh`. `plants.md` records that it did not hold at `b65dabf` and holds after the fix, and
  `gate:plants` judges it as expected (below).
- **Mutation.** I ran `pnpm run gate:mutation -- --base d397da19…` (phase base): exit 0, 218 mutants on the
  changed lines of 6 files, none survived. I read all 3 equivalent records it listed:
  - `gates/bin/contrast.ts:116`: a process boundary covered by the gates-integration test. Accepted.
  - `gates/stylelint/token-only.ts:222`: the `classify([node], "aspect-ratio", false)` arguments, read only for
    font values, numbers and operator words, none of which reach that line. Accepted.
  - `packages/elements/src/ocelle-brand-mark.ts:24`: `{}` equals Lit's default property options. Accepted.

  Two of these records come from phase 5 code, which the phase 4 base also covers. The fix added no new record.

## Checks run

Node 22, `OCELLE_CHROMIUM_PATH` set, `PLAYWRIGHT_BROWSERS_PATH` set for the plant and Stryker runs, one at a time, at
HEAD `b105a26`:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 223 files, no finding |
| `gate:test-lint` | exit 0, 152 files, no finding |
| `gate:prefix` | exit 0, 206 files, no finding |
| `gate:style-lint` | exit 0, 12 files, no finding. This includes `packages/elements/src/icon-slot.ts:25` `padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2)` and `:33` `block-size: 1lh`, so the shipped row still passes. |
| `pnpm test` | exit 0, 2532 tests passed in 119 files |
| `gate:plants` | exit 0, 218 plants of 14 gates and the registry judged, every plant as expected |
| `pnpm -r build`, then `gate:csp` | exit 0, 34 files, no finding |
| `gate:mutation -- --base d397da1` | exit 0, 218 mutants on 6 files, none survived, 3 equivalent records (read above) |
| manual scaffold run, phase 4 test files only (R4-01) | exit 1, 179 of 2489 failed, all on assertions, `not implemented` or "is not a function" |

`tdd-check.json` has status `pass` and head `afbe322`, the fix. It is older than HEAD, but `git diff
afbe322..HEAD` touches only `reviews/phase-2/` and `reviews/phase-4/` files: the check's own evidence (`ce3b27d`)
and the phase 2 round 3 review (`b105a26`). The source and test tree it judged is therefore HEAD's, so I did not
re-run it. Its results: all three red commits exit 1, final tests on base exit 2, final tests on scaffold exit 2
(R4-01), HEAD exit 0, no problems.

## Earlier findings

- **OP4-01 (round 3, blocking): resolved.** `admittedLine()` (`gates/stylelint/token-only.ts:103-128`) now maps
  each nested function's `nodes` to that function and its enclosing group (`holders`). Starting from the one `lh`
  length, it climbs outward while the current group holds a single operand (`operandsOf`, which skips spaces and
  comments). It stops at the expression's own nodes, which have no holder. The `+`/`-` neighbour check then runs
  on the climbed subject in the enclosing group. So `(1lh)`, `calc(1lh)` and `((1lh))` read as `1lh` itself, and a
  factor or divisor on them is reported. A group with more than one operand, such as the shipped
  `(var(--ocelle-icon-size) - 1lh)`, is not climbed, so its behaviour has not changed. The fix note's claim that
  climbing any function is harmless holds: `functionRaw()` (`:134-141`) passes `line` into a nested group or
  `calc()` only, and any other function is reported as a whole. The red test (`fix-3`), the fail plant and T067 to
  T069 (ticked, `tasks.md:206-208`) are all present. The file header (`:14-16`) and the function comment record
  the rule. Nothing outside `token-only.ts`, its test, the plant, `tasks.md` and the phase 4 review directory
  changed in `b65dabf..afbe322`.

Signed-off-by: Reviewer Renata (Claude Opus 5.5)
