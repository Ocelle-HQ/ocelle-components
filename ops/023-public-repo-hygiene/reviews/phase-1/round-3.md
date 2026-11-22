---
phase: 1
round: 3
verdict: approved
base: ac12998241af8a86f9a88c043654457e41b14b53
head: efb265082acb639378aeaa45d8d265e49c74a37a
tdd_check: pass
---

# Phase 1 review, round 3

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | ops/023-public-repo-hygiene/reviews/phase-1/tdd-check.json | `tdd-check.json` names head `0b41dab`. HEAD is `efb2650`, the commit that adds only this check's output (`git show --stat efb2650`: only `reviews/phase-1/` logs and the JSON). The check is current for the code. | None. |
| R3-02 | note | ops/023-public-repo-hygiene/reviews/phase-1/plants.md:5 | The recorded plant run keeps `exit: 1` by operator decision (`triage/decisions/023-review-round-1.md`). CI's Plants check is the evidence for `visual/fail-pointer-target-below-fold`. This reviewer does not read GitHub, so that result is still to be read before landing. | None in this phase; read CI's Plants result at landing. |
| R3-03 | note | (local mutation run) | While my scoped mutation run was going, the kernel killed at least one process for lack of memory. The run still ended with exit 0 and its summary line. It reports 21 timeouts, against 16 in round 2. The five new ones are the expected loops: the three line-42 mutants and the line-44 `false` mutant, which loop on the `"12\u00003\u0000t\nbad"` case, plus one more. Timeouts are reports and do not block. CI's Mutation testing check is the clean run. | None. |

No blocking finding.

## Test quality

- **Red evidence.** `tdd-check.json` is `pass`, with `problems: []`. Each red commit has exit 1: `phase` `25ecc2d`, `fix-0` `28afb19`, `fix-1` `6943053` and `fix-2` `c3bc341`. The final tests fail on the base (exit 2) and on the scaffold (exit 1). They pass at the head: `check-head.log` shows 8729 tests passed in 258 files.
- **The fix-2 red reason.** `c3bc341` changes only `gates/test/sandbox-paths.test.ts`. `red-fix-2.log` has exactly one failure, the `toEqual` at `gates/test/sandbox-paths.test.ts:64`, which is an assertion and not a load or setup error. To see which entry failed, I loaded `gates/lib/sandbox-paths.ts` from before the fix (`bee6b0a`) in a scratch copy and fed it every input of the test. All the malformed inputs throw except the empty path `"\u00002\u0000t\n"`, which returns a finding at `:2`. This is the missing behaviour the fix note names. The one-character-path case passes at red, as the note says (it is a mutant-killing case, not a behaviour change). At HEAD, every malformed input throws.
- **No weakening after red.** `git diff c3bc341..HEAD -- gates/test` is empty. In the red commit, the five earlier malformed inputs are all kept, and the expected value grew from five `problem` entries to one per input (`malformed.map(() => problem)`). That is stricter, not looser.
- **Vacuity.** Both tests make one unconditional `toEqual`. The `try`/`catch` in the throw test turns each outcome into a value, and `"no error"` is one of those values, so a parse that does not throw fails the assertion. Nothing is swallowed. There is no `skip` or `only`. `gate:test-lint` passes.
- **Mutation.** I ran `pnpm run gate:mutation -- --base ac12998241af8a86f9a88c043654457e41b14b53` locally and it exited 0: `236 mutants on the changed lines of 5 files, none survived; 21 timeouts, 18 compile errors, 0 zero-mutant entries; 30 equivalent records`. I read the one new equivalent record, `gates/lib/sandbox-paths.ts:46` (ArithmeticOperator on the newline search, line 47). Its reason holds. Line 47 runs only after line 44 has passed, so `stdout[lineEnd - 1]` is the last digit of a non-empty all-digit line number and `stdout[lineEnd]` is its NUL. A search from `lineEnd - 1` therefore finds the same newline as one from `lineEnd + 1`. The other 29 records are the `process boundary` records read in round 2, and `git diff bee6b0a..HEAD` adds no other record. The timeout and compile-error lines are reports (see R3-03).

## Checks run

All at HEAD `efb2650`, locally:

- `pnpm run gate:typecheck`: exit 0.
- `pnpm run gate:lint`: exit 0, 512 files, no finding.
- `pnpm run gate:test-lint`: exit 0, 385 files, no finding.
- `pnpm run gate:config-copies`: exit 0.
- `pnpm run gate:sandbox-paths`: exit 0, with 4541 tracked files and 4 allowed files.
- `pnpm run gate:signoff -- --range ac12998..HEAD`: 25 commits, no finding.
- `vitest run gates/test/sandbox-paths.test.ts gates/test/integration/sandbox-paths.test.ts`: 20 tests passed.
- `pnpm test` (whole suite): not run, under the operator's no-long-runs rule. I relied on `check-head.log` (tdd-check at `0b41dab`, 8729 passed). `efb2650` adds only evidence files.
- `pnpm run gate:mutation -- --base ac12998…`: exit 0, no survivor (see above).
- `pnpm run gate:plants -- --affected ac12998… --list`: `note: affected: every plant, by gates/bin/plants.ts (shared gate source)`, 324 of 324. This matches `plants.md`, and its base (`plants.md:3`) equals `base.sha`. The recorded `exit: 1` stands by operator decision (R3-02).

Constitution and plan: since round 2, the code changes are one condition (`pathEnd === at`) and one equivalent-mutant record in `gates/lib/sandbox-paths.ts:44-46`, and the test cases in `gates/test/sandbox-paths.test.ts`. The parse still never echoes a matched line (plan.md *The gate*). No element, token, story, CSS or package changed. No history was rewritten. The fix was test-first (Principle VIII): `fix-2` is recorded in `red-commits`.

Tasks: every task of `## Phase 1:` is ticked, T001 to T030. T024 is ticked with a reference to its operator decision (tasks.md:73).

## Earlier findings

- **R2-01 (blocking): resolved.** The red commit `c3bc341` (`fix-2`) adds `"5abc\n"`, `"12\u00003\u0000t\nbad"` and a one-character-path case, as required. In the scoped mutation run, the three line-42 mutants are no longer survivors: they are timeouts (detected, they loop on the `12…bad` case). There is no survivor anywhere in the changed code. The red test also exposed a real gap, the empty path, which line 44 now rejects.
- **R2-02 (note): resolved.** The optional equivalent record is at `gates/lib/sandbox-paths.ts:46`, and the mutation run lists it with the reason from round 2.
- **R2-03 (note): no change needed.** Superseded by R3-01.
