---
phase: 6
round: 3
verdict: approved
base: 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809
head: 8dc8147e2742a076c765c06dba75e3c21edbb039
tdd_check: pass
---

# Phase 6 review, round 3

This round reviews fix round 2 (label fix-2, tasks T069 to T072). That fix round answers the operator round
`round-2.md` (O2-01 to O2-03) from the landing review. The commits under review are 7a3385e (docs fix), 4f50e7a
(tdd-check record), db5edfd (ci-run.md Attempt column), and 904e5cf, 226e29e and 8dc8147 (006 plan.md Complexity
Tracking row and intro). The fixes record is `round-2-fixes.md`.

`git diff 70f2936..HEAD` also contains phase 4's fix-2. That belongs to phase 4 and is not judged here. The round
changes no executable code. The only change in a `.ts` file is the doc comment of `shardSize` in
`gates/lib/plant-runner.ts`; every changed line there starts with ` *`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | gates/README.md:61 | The rewritten paragraph says the split count of 76 was "approved by the operator at 012 phase 1's review". The record says otherwise. Phase 1's review left the question open (reviews/phase-1/round-1.md:29, R1-10, "For the operator"). The acceptance is recorded at phase 2 (reviews/phase-2/notes.md:26, "decided by the operator: proceed"). In this same round, 8dc8147 corrected 006 plan.md's intro and Sunset cell to "put to the operator at 012 phase 1's review … accepted at phase 2". The README and 006 now disagree on where the approval came from. The wording predates this round (081f46c, T068). The figures O2-02 asked for are correct. | Optional: align the README's attribution with 006's ("put to the operator at phase 1's review, accepted at phase 2") the next time the paragraph is touched. |
| R3-02 | note | reviews/phase-6/round-2-fixes.md:9; reviews/phase-6/notes.md:253 | Both records say 006 plan.md line 637 is "not edited here / in this commit" and hand its text to the orchestrator. That was true of 7a3385e. The row and intro were then edited in 904e5cf, 226e29e and 8dc8147, and neither record names those commits. | Optional: add the three commit ids to the O2-02 row of round-2-fixes.md. |
| R3-03 | note | reviews/phase-6/tdd-check.json; check-final-tests-on-base.log | `final_tests_on_base_exit` is 2 ("unit-tests: could not run: no test file found"), not a real test failure. The reason is that base..HEAD now spans the landing merges (missions 011, 008, 013, ops 015 and 016). Their test-support files are overlaid on the phase-6 base, including `packages/elements/test/browser/global-setup.ts` from bea3130 (mission 011). I reproduced it in a scratch worktree of 89a1369 with the 172 final test-path files of HEAD overlaid: Vitest stops with a "Startup Error" and collects no test file. `tdd-check.sh` counts any non-zero exit as proof, so for phase 6 after the merges this sub-check proves nothing. My judgement is under "Test quality". | None for this phase. Tooling follow-up (outside 012): `tdd-check.sh` could refuse an exit 2 of the final-tests-on-base run as proof. |
| R3-04 | note | specs/012-button-action-row/plan.md:161-170, 482-484, 568; research.md:903-928; tasks.md:69, 328 (T067's own text) | The 72-story model figures (about 588 s, about 4 stories of headroom, about 11.9 runner-hours) remain in 012's own plan, research, and task texts. They are records of what was decided at phases 1 and 2. O2-02 named only gates/README.md, plant-runner.ts and 006 plan.md, and those three are clean. T067 keeps its original wording, followed by the appended citation of the operator's decision, as T069 prescribes. | None. |

No blocking finding.

## Test quality

- **No red commit is required, and that is correct.** O2-01 to O2-03 are a record (ci-run.md and T067's tick), prose
  (gates/README.md, 002 contracts/gates.md, 006 plan.md) and a doc comment. No behaviour changes, so Principle VIII's
  red-first rule has nothing to apply to: "Every behaviour change is test-driven" (constitution.md:115). round-2.md
  required "No code change" for O2-01. tasks.md says fix round 2 needs no red commit. `red-commits` still holds
  only the phase entry (126871c), and no `fix-2` entry is needed. The diffs of 7a3385e, 904e5cf, 226e29e and
  8dc8147 touch no test file. No test pins the rewritten sizing text, and the pinned rule-(f) phrase in the README's
  brand-rules row is kept verbatim (`gates/test/gates-readme.test.ts` passes, below).
- **Is `tdd-check`'s `pass` valid for a docs-only round?** Yes. The four sub-checks:
  1. The red commit: 126871c changes only test files and fails at its commit for the missing behaviour. The re-run
     in this record (`check-red-phase.log`) ends "unit-tests: 109 of 3824 tests failed", with `AssertionError`s such
     as US2-12, not a setup error.
  2. Final tests on base: exit 2 is a "could not run" outcome caused by the landing merges (R3-03), so it proves
     nothing. However, the claim this sub-check makes for phase 6 was proven before the merges, against the same
     base. The record in 73935994 (head ecd8b53) has `final_tests_on_base_exit: 1`, and its log (`git show
     4f50e7a^:…/check-final-tests-on-base.log`) ends "unit-tests: 98 of 3825 tests failed" with behavioural
     assertion failures in action-row.test.ts and button.test.ts. This round adds and changes no test, so no new
     test exists that needs proving against base. The exit 2 does not undo the earlier proof.
  3. Scaffold: none.
  4. HEAD: `check-head.log` ends "unit-tests: 7061 tests passed in 208 files" at 7a3385e. The commits after it
     (db5edfd, 904e5cf, 226e29e, 8dc8147) change only `.md` files (`git diff --name-only 7a3385e HEAD`: 006
     plan.md and phase-6 review records). For that reason I did not re-run the check, even though
     `tdd-check.json` is one docs-only step older than HEAD.

  `pass` holds for this round. It would not hold for a round that added or changed a test. Such a round would need
  the sub-check repaired, or a run against base with only phase 6's own test files.
- **Mutation:** not run this round. The round changes no executable source, only comment lines in plant-runner.ts.
  The phase's mutation result is round 1's.

## Checks run

| Check | Result |
|---|---|
| ci-run.md internal consistency (awk over the per-shard table) | 76 rows, shards 1 to 76, no duplicate job id. Gate step: max 516 s (shard 40), 0 over 570 s, sum 22953 s = 6.376 h ("6.38"). Job wall: max 862 s (shard 33), 17 over 570 s, exactly shards 9, 10, 11, 15, 20, 23, 26, 27, 28, 30, 32, 33, 36, 40, 42, 46, 48 as listed; sum 34810 s = 9.669 h ("9.67"). Disk cleanup max 324 s (shard 48), setup max 373 s (shard 7), both as stated. Without shard 23 (attempt 1's 75 shards): 16 job walls over 570 s and a gate-step total of 22485 s = 6.25 h, which matches round 2's "16 shards" and "6.2 runner-hours". In every row, job wall ≥ gate step + disk cleanup + setup. Shard ranges fit the plant layout: shards 1 to 3 are non-visual (312 plants − 48 − 25 = 239, ⌈239/80⌉ = 3), 4 to 51 are the 48 `visual` plants (the first five are `error-*` plants, so the gate steps of 34, 3, 0, 0, 0 s are plausible), and 52 to 76 are the 25 `axe` plants. Shard 40 is a `visual` shard, as stated. The story count of 171 matches the `export const` stories under storybook/stories (171) and 342 baselines. I could not check the run itself, because GitHub is off limits. The comparison run 44036606605 (≤ 340 s, 4.5 h) is uncited and unverifiable here. It is context, not a judged figure. |
| ci-run.md Attempt column (db5edfd) | Attempt 1 for every shard but 23, which is attempt 2. The note on the 134127… job ids of shards 47 to 76 (GitHub's re-run copies with the same times) explains the only odd-looking rows. db5edfd changes no figure, only the Attempt column and that note. |
| T067 tick (tasks.md:328) | `[X]`, with the exact suffix T069 prescribes, which cites the operator, 2026-11-17, phase 6 round 2 O2-01 and `reviews/phase-6/ci-run.md`. ci-run.md quotes the operator's answer verbatim, matching round-2.md, and records the follow-up issue (R1-09 triage, R1-06's 519/600 s). |
| Old 72-story figures in the three O2-02 places | `grep -nE "72 stor\|about 72\|588\|11\.9\|headroom\|58 (repository )?stor\|550 s"` over gates/README.md, gates/lib/plant-runner.ts and specs/006-storybook-workbench/plan.md finds nothing. Each of the three states 171 stories, 76 shards, run 44098238937, the gate step's peak and total, the job wall's peak and total, the exceeded split count and the pending triage. |
| O2-03 against phase 4 round 2 | README.md:36 keeps the pinned phrase and adds: the exception only for a name ending in `-delay` that carries `delay: true`, every motion duration a literal `<number>ms`, and a misplaced marker or non-`ms` duration as a finding. This matches gates/bin/brand-rules.ts:30-31 and 198-213 (`duration = /^\d+(?:\.\d+)?ms$/`; `delay` requires group `motion` and `name.endsWith("-delay")`). The README fail list and 002 contracts/gates.md:232 list `f-motion-spin-missing`, `f-delay-marker-misplaced` and `f-motion-not-ms`, each marked as added by 012. All three exist under gates/plants/brand-rules/. |
| `pnpm run gate:typecheck` | no type error |
| `pnpm run gate:lint` | 402 files, no finding |
| `vitest run --project gates gates/test/gates-readme.test.ts gates/test/plant-runner.test.ts` | 104 tests passed |
| `pnpm test` | Not re-run (about 1964 s, with a phase-4 tdd-check running at the same time). `check-head.log` at 7a3385e gives 7061 passed, and HEAD differs from it only in `.md` files. |
| Plants: `pnpm run gate:plants -- --affected 89a1369 --list` | "affected: every plant, by gates/bin/plants.ts (shared gate source)", 312 of 312 selected, none judged. The phase's plants.md is round 1's element-plant record, accepted then. This round changes no plant input except a comment. The full 312-plant set ran green in CI run 44098238937 (Plants verdict, attempt 2). No new plant judgement is needed. |
| Working tree | `specs/012-button-action-row/reviews/phase-4/check-red-phase.log` is modified and uncommitted. It comes from a `tdd-check.sh 4` run going on at the same time (processes 22714 and on, worktrees /tmp/tmp.KCMPadm28T and /tmp/tmp.zmXITMTIx5). It is not part of phase 6, and I left it untouched. My scratch worktree of the base is removed. |

## Earlier findings

| ID | Status | Evidence |
|---|---|---|
| O2-01 | resolved | `reviews/phase-6/ci-run.md` exists and has both measures per shard and in total, the attempts (shard 23's setup failure and the authorised re-run), the story count against the split count, and the operator's answer verbatim. The table is consistent internally and with round 2's figures (see Checks). T067 is ticked on the gate-step figure with the prescribed citation. No code change. |
| O2-02 | resolved | gates/README.md:58-67, gates/lib/plant-runner.ts:266-274 (comment only) and specs/006-storybook-workbench/plan.md (intro and the "Plant roots hold every repository story" row) state the merged state with run 44098238937's measured figures. The 588 s, 4-story headroom and 11.9 runner-hour figures are removed from all three, and the triage record is stated as pending. The 006 row moves its "near 10 minutes" stop-and-ask to the gate step at 570 s, consistent with 006 decision 28 item 7 (plan.md:383). See R3-01 for one stale attribution. |
| O2-03 | resolved | README.md:36 brand-rules row and 002 contracts/gates.md:232, as above. |

## Verdict

approved. No blocking finding. Typecheck, lint and the affected tests pass. `tdd_check: pass` holds for this
docs-only round, for the reasons under "Test quality".
