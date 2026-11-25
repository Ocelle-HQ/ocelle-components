# Phase 1, review round 2: fixes

Red commit `fix-2`: `c3bc341` (`red-fix-2.log`: exactly one failure, the empty-path case below, 1 of 8729 tests; the
first `red.sh` run also hit two timing failures under memory pressure from a concurrent mutation run, so it was rerun
alone, and `red-fix-2.log` is the rerun).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: `parseGrep` has new cases that kill the three line-42 survivors. These are a record with no NUL that starts with a digit (`"5abc\n"`, kills `? +1`), a malformed record after a record whose path is a number (`"12\u00003\u0000t\nbad"`, kills all three: each one loops), and a valid one-character path (`"a\u00002\u0000t\n"`, kills `pathEnd === +1`). Each case was checked against a copy of `records()` with each mutant. These cases pass on the old code. One more case in the same red commit, an empty path (`"\u00002\u0000t\n"`), was red: the parse accepted a record without a path and gave a finding at `:2`, against its own contract ("throws on a record without a path"). The fix adds `pathEnd === at` to the throw condition on line 44, and line 42 is unchanged. `pnpm run gate:mutation -- --base ac12998…` with the fix: exit 0, 236 mutants on the changed lines of 5 files, none survived. The three line-42 mutants and the new `false` mutant of line 44 are timeouts (they loop on the `12…bad` case). | `gates/test/sandbox-paths.test.ts` "throws on a record that is not path, line and text, or whose line is not a line number" (the empty-path case is the red one) and "reads a record whose path is one character" | `gates/test/sandbox-paths.test.ts`, `gates/lib/sandbox-paths.ts:44` |
| R2-02 | fixed (note, optional): a `Stryker disable next-line ArithmeticOperator` record on line 46, for line 47, gives the equivalence reason from the review. No red test (an equivalent-mutant record, not behaviour). | none | `gates/lib/sandbox-paths.ts:47` |
| R2-03 | no change (note, none required). | none | none |

Plants: not rerun. `plants.md` stands as recorded under the operator decision of round 1
(`triage/decisions/023-review-round-1.md`: CI's Plants check covers the run, no local rerun). The selection is still every
plant (shared gate source), and this fix changes `gates/lib/sandbox-paths.ts` only, which the `sandbox-paths` plants cover
in that same CI run.
