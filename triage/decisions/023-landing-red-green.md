# Operator decision: op 023, red/green check after the landing merge (2026-11-25)

Raised at landing of PR #80. After the landing merge of `main` (183b20f, which brought op 025's checker),
`tdd-check.sh 1` on 73c8ba1 (`reviews/phase-1/tdd-check.json`, committed in 98f5bbf) reports `fail` for three
reasons, none from op 023's code:

1. **Final tests on base and scaffold.** The script takes every test file changed between `base.sha` (ac12998) and
   HEAD as the phase's final tests. That range includes the landing merge, which brought 128 of the 142 test files,
   among them `gates/test/story-entry.test.ts`; it imports `../bin/story-evidence.ts`, which does not exist on the
   base, so the run is a file error instead of red evidence.
2. **Phase red commit 06a2bca.** Op 025's evidence rule accepts only failing assertions on lines the red commit
   changed. The phase red commit predates op 025; its failure at `gates/test/plants.test.ts:92` is on an unchanged
   line, so the new rule calls it invalid. Under the checker in force when it was made, the phase passed
   (`tdd-check.json` at 8a20ec3, before the merge).
3. **Final tests on HEAD.** A non-assertion error in `gates/test/integration/axe.test.ts` in the local run; CI ran
   the same file on 73c8ba1 and on 98f5bbf (Unit test shards) and it passed.

The red commits fix-0, fix-1, fix-2 and fix-4 are proven red with recorded assertions under op 025's rule.

Choice: **accept, and record why.** Phase 1's red/green evidence stands on the pre-merge pass plus the fix-4 red
commit proven now. The failures above are artifacts of running op 025's checker over pre-merge history. A follow-up
issue asks for `tdd-check.sh` to leave changes brought in by merges out of a phase's final tests.

Not chosen: fixing the checker in this PR (widens op 023 into op 025's tooling); stopping the landing.

Also recorded: Unit test shard 4 failed on 73c8ba1 ("inventory differs from the plan") and passed on 98f5bbf, whose
only changes are logs; the same shard run locally matched its plan exactly. Treated as a flake.

Source: the operator (jeroennouwsdev), answered at a gate of the /ocelle-land session for PR #80.
