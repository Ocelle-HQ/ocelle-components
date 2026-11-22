---
phase: 1
round: 2
verdict: changes_requested
base: ac12998241af8a86f9a88c043654457e41b14b53
head: bee6b0ad5770f27a81be4ccba088df47f9eee33c
tdd_check: pass
---

# Phase 1 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | gates/lib/sandbox-paths.ts:42 | Three mutants survive on new code from `97cc34b`: `ConditionalExpression` (`pathEnd === -1` replaced by `false`), and two `UnaryOperator` mutants (`-1` replaced by `+1`, once in the condition and once in the result). None is equivalent. I checked each one against a copy of `records()`. (a) `? +1`: `parseGrep("5abc\n")` throws in the original, but the mutant returns a finding `5abc:5`. A record with no NUL that starts with a digit from 1 to 9 is accepted. (b) `pathEnd === +1`: the valid record `"a\u00002\u0000t\n"`, a one-character path, gives `a:2` in the original, but the mutant throws. (c) All three mutants: `"12\u00003\u0000t\nbad"` (a numeric first path, then a record with no NUL) throws in the original, but each mutant loops forever, because `at` goes back to the same offset. The five malformed inputs of the throw test (gates/test/sandbox-paths.test.ts:66) all have either no NUL and a non-digit first character, or a NUL path, so none of them tells these mutants apart. | Add `parseGrep` cases that kill all three, test-first: a red commit `fix-2` with the new cases, which pass on the current code. For example, a valid record with a one-character path, a record with no NUL that starts with a digit, and a malformed record after a record with a numeric path. Then rerun `pnpm run gate:mutation -- --base ac12998…` (or read CI's Mutation testing check) and show no survivor on line 42. |
| R2-02 | note | gates/lib/sandbox-paths.ts:46 | The fourth survivor, `ArithmeticOperator` (`lineEnd + 1` replaced by `lineEnd - 1` in `stdout.indexOf("\n", …)`), is an equivalent mutant. When line 46 runs, the line number just before `lineEnd` is non-empty and all digits, so `stdout[lineEnd - 1]` is a digit and `stdout[lineEnd]` is NUL. Neither is `\n`, so searching from `lineEnd - 1` finds the same newline as searching from `lineEnd + 1`. I record it here as equivalent, so it does not block. | Optional: add a `Stryker disable next-line ArithmeticOperator` record that gives this reason, so later runs list it as an equivalent record. |
| R2-03 | note | ops/023-public-repo-hygiene/reviews/phase-1/tdd-check.json | `tdd-check.json` names head `a82af3f`. HEAD is `bee6b0a`, the commit that adds this check's own output and nothing else (`git show --stat bee6b0a`: only `reviews/phase-1/` logs and the JSON). The check is current for the code. | None. |

## Test quality

- **Red evidence.** `tdd-check.json` shows `pass`, with `problems: []`. Each red commit failed: `phase` `25ecc2d` (exit 1), `fix-0` `28afb19` (exit 1) and `fix-1` `6943053` (exit 1). The final tests fail on the base (exit 2) and on the scaffold (exit 1). HEAD passes (`check-head.log`: 8728 tests in 258 files, two more than in round 1).
- **The fix-1 red reason.** `red-fix-1.log` has exactly one failure: the R1-04 corrupt-index case at `gates/test/integration/sandbox-paths.test.ts:125`. The cause is `no tracked file` where git's error was expected, which is missing behaviour and not a setup error. The R1-03 symlink case passed at red. `round-1-fixes.md` says so: the code was already right, so this is a test-gap fix.
- **R1-03 is not vacuous.** In a scratch worktree at HEAD, I deleted the `not a regular file` line (tooling/speckit/bin/redact-sandbox-paths.sh:74). The new case then failed: 1 failed and 17 passed in `redact-sandbox-paths.test.ts`. The worktree was then removed.
- **No weakening after red.** `git diff 6943053..HEAD -- gates/test` is empty. Earlier red commits were checked in round 1.
- **Vacuity.** Both new tests assert one exact `toEqual`: the code, stdout and stderr for R1-04, and the finding for R1-03. They have no `skip` or `only` calls, no conditionals and no swallowed errors.
- **Mutation.** I ran `pnpm run gate:mutation -- --base ac12998241af8a86f9a88c043654457e41b14b53` locally. The plan has 5 shards, the run took about 15 minutes and exited 1. It reported 232 mutants on changed lines, 16 timeouts, 18 compile errors, 0 zero-mutant entries and 4 survivors, all in `gates/lib/sandbox-paths.ts` (R2-01, R2-02). I read every equivalent record it listed, in `gates/bin/plants.ts:593` and `gates/bin/sandbox-paths.ts:16-57`. Each one is `all: process boundary`, names an existing integration test by its title, and sits on a spawn or I/O line, so the reasons hold. That includes the four new records of `lsFilesFailure` and its call (lines 29-35 and 47, before the check on line 48), which name the new corrupt-index test. The timeout and compile-error lines are reports and do not block.

## Checks run

All at HEAD `bee6b0a`, locally:

- `pnpm run gate:typecheck`: exit 0.
- `pnpm run gate:lint`: exit 0, 512 files.
- `pnpm run gate:test-lint`: exit 0, 385 files.
- `pnpm run gate:config-copies`: exit 0.
- `pnpm run gate:sandbox-paths`: exit 0, with 4537 tracked files and 4 allowed files.
- `pnpm run gate:signoff -- --range ac12998..HEAD`: 21 commits, no finding.
- `vitest run` over `gates/test/sandbox-paths.test.ts` and the two integration files the fix touched: 37 tests passed.
- `pnpm test` (whole suite): not run, under the operator's no-long-runs rule. I relied on `check-head.log` (tdd-check at `a82af3f`, 8728 passed). `bee6b0a` adds only evidence files.
- `pnpm run gate:mutation -- --base ac12998…`: exit 1, with 4 survivors (see above).
- `pnpm run gate:plants -- --affected ac12998… --list`: "every plant, by gates/bin/plants.ts (shared gate source)", 324 of 324. This matches `plants.md`, and its base equals `base.sha`. The recorded `exit: 1` stands by operator decision (see R1-01 below).

Constitution and plan: the fix changes only `gates/bin/sandbox-paths.ts`, the two integration tests and records. No element, token, story or package changed. The new exit-2 message has the same form as the `git grep` failure (plan.md *The gate*, exit 2 with a named cause). No history was rewritten.

Tasks: every task of `## Phase 1:` is ticked. T024 is ticked with a reference to `triage/decisions/023-review-round-1.md` (tasks.md:73).

## Earlier findings

- **R1-01 (blocking): resolved by operator decision.** `triage/decisions/023-review-round-1.md` says CI's Plants check covers `visual/fail-pointer-target-below-fold`, with no local rerun. `plants.md:15-17` keeps `exit: 1` and carries the decision as a note. Before landing, CI's Plants result is the evidence still to read, and this reviewer does not read GitHub.
- **R1-02 (blocking): resolved.** T024 is ticked, citing the same decision (tasks.md:73).
- **R1-03 (note): resolved.** The symlink test was added in `6943053` and is non-vacuous (see Test quality).
- **R1-04 (note): resolved.** `gates/bin/sandbox-paths.ts:48` maps a non-zero `git ls-files` to exit 2 with `git ls-files failed (exit <n>): <first error line>`. The red test failed at `6943053` and passes at HEAD.
- **R1-05 (note): no change needed.** The `--list` selection at HEAD is still every plant.
