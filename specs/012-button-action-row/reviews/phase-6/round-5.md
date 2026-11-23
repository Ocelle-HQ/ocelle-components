---
phase: 6
round: 5
verdict: changes_requested
base: 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809
head: ddb134c9
tdd_check: pass
---

# Phase 6 review, round 5

Check-only landing-era round on fix-3 (tasks T073 to T077), which answers the operator round `round-4.md`
(O4-01 to O4-05). Commits reviewed: b6f0010c (planner, tasks.md), cb1ae7ba (planner,
specs/006-storybook-workbench/plan.md), 265e819c (implementer: fixes, round-4-fixes.md, notes.md) and ddb134c9
(tdd-check after fix-3). This round only checks that each O4 finding is resolved and that nothing regressed. It does
not look for new findings.

Reference figures (CI run 44298568583 on ac2d73a, attempt 1, supplied by the orchestrator): 194 stories, 77 shards
(4 + 48 + 25), 148/148 jobs green. Plant gate step: peak 524 s (shard 39), none at or over 570 s, 24972 s in all,
6.94 h. Job wall time over the 77 shard jobs: peak 692 s (shard 21), 29 over 570 s, 34745 s in all, 9.65 h.
round-4.md's 9.71 h also counted the plan and verdict jobs.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R5-01 | blocking | specs/012-button-action-row/tasks.md:365-369 | T073 to T077 are still `- [ ]`. Their work is present (see Earlier findings) and the checks pass, but the procedure requires every task of the phase to be ticked. Earlier fix rounds ticked their tasks in the fix commit (T069 to T072 in 7a3385e3; T049b to T049f in bd9aaca5). 265e819c did not. | Tick T073 to T077 (`[X]`). No other change is needed. |
| R5-02 | note | specs/012-button-action-row/reviews/phase-6/red-phase.log:8 | The log still contains a host pnpm store path ("Content-addressable store is at: ..."). It dates from 081f46c6 (phase 6 red), not from this fix. ddb134c9 redacted the same kind of line in the three `check-*.log` files but not here. | Optional: redact it to `<pnpm store>` as ddb134c9 did, in whichever commit the orchestrator chooses. |

## Test quality

- No red commit for fix-3. Every change in 265e819c is documentation, a record, or a comment. The
  `gates/lib/plant-runner.ts` diff touches only the JSDoc of `shardSize` and `otherShardSize`; `shardSize = 1` and
  `otherShardSize = 80` are unchanged. Constitution VIII needs no red test where there is no behaviour, as tasks.md
  states for fix round 3.
- No test was added, changed, weakened or skipped since round 4: 265e819c and ddb134c9 touch no test file.
- `red-commits` still lists only `phase 126871cf…`, which is right for a docs-only fix.
- Mutation: not rerun. This round changes no executable source (comments only), so no new or changed mutant
  exists. Earlier rounds covered the phase's source.

## Checks run

- `tdd-check.json` (ddb134c9, head 265e819c, which differs from HEAD only by evidence files): `status: pass`,
  `problems: []`, phase red exit 1, head exit 0. `final_tests_on_base_exit: 2` ("unit-tests: could not run: no test
  file found", check-final-tests-on-base.log). This is the base sub-check after the landing merges that phase 6
  round 3 R3-03 recorded, a known follow-up, and it is not counted here.
- `pnpm exec vitest run gates/test/gates-readme.test.ts gates/test/plant-runner.test.ts`: 2 files, 105 tests passed.
- `pnpm run gate:typecheck`: no type error.
- `pnpm run gate:lint`: 446 files checked, no finding.
- `pnpm run gate:plants -- --plan`: shards 1 to 77.
- `pnpm run gate:plants -- --affected 55ec410 --list`: "317 of 317 plants selected" (O4-05's figure).
- `pnpm run gate:plants -- --affected 89a1369c… --list`: 317 of 317 plants selected. plants.md was not judged again
  (it is unchanged by this fix, and earlier rounds checked it).
- The full `pnpm test` was not rerun. notes.md § Fix round 3 records 7753 tests passed in 232 files, after one rerun
  for a worker start failure. This fix changes only comments and docs.
- A search of the fixed places (`gates/`, specs/006-storybook-workbench/plan.md, reviews/phase-4/plants.md) for "171
  stories", "76 shards", "232 into", "312 plants" and "approved by the operator at 012". Every remaining hit is
  labelled as before 009's merge, or is the operator's verbatim quote with the bracketed note after it.

## Earlier findings

Round 4 (operator round), each blocking:

- **O4-01: resolved.**
  - gates/README.md:61-73 states 194 stories after main b594b7e (009) was merged, in 77 shards (4 + 48 + 25), and
    cites run 44298568583 on ac2d73a (attempt 1, all 148 jobs green). Gate step: 524 s (shard 39), none at or over
    570 s, 24972 s, 6.94 runner-hours. Shard job wall time: 692 s (shard 21), 29 shards over 570 s, 34745 s,
    9.65 runner-hours "over the 77 shard jobs". Run 44098238937 stays, labelled "Before 009's merge (171 stories,
    76 shards: 3 + 48 + 25)".
  - The `shardSize` comment (gates/lib/plant-runner.ts:266-279) gives the same figures.
  - The planner's cb1ae7ba gives the same figures in specs/006-storybook-workbench/plan.md: the Complexity Tracking
    intro (:634-636) and the "Plant roots hold every repository story" row (:640), including 4 shards at 244
    non-visual plants and "exceeded at 194 stories (171 before 009's merge)".
  - All three places match the reference figures. T073 asked for "9.71 runner-hours of Plants job wall time"; the
    text instead states 9.65 h for the 77 shard jobs. That is the correct shard figure: round-4.md's 9.71 h included
    the plan and verdict jobs, as round-4-fixes.md § "Figures used" explains.
  - No gates-readme test pins the changed text, and the two pinned test files pass.
- **O4-02: resolved.** In gates/README.md:61-63, "approved by the operator at 012 phase 1's review" is replaced by
  8dc8147's wording: "put to the operator at 012 phase 1's review and accepted at phase 2", with the same citations
  (012 tasks.md T067; reviews/phase-2/notes.md "Story count"). The `shardSize` comment uses the same wording, and the
  006 plan already did.
- **O4-03: resolved.** round-2-fixes.md (O2-02 row) and notes.md § Fix round 2 (T070 bullet) keep their sentences.
  Each adds that the routed 006 plan.md edits landed in 904e5cf (the row) and 226e29e (the intro), and that the
  approval wording landed in 8dc8147.
- **O4-04: resolved.** The `otherShardSize` comment (gates/lib/plant-runner.ts:282-284) now reads "244 into 4
  shards (232 into 3 before main b594b7e, 009, was merged)". This matches the `--plan` output (77 = 4 + 48 + 25).
- **O4-05: resolved.**
  - reviews/phase-4/plants.md:60-64: the operator's verbatim "all 312 plants" is kept, followed by a bracketed note
    (312 before 009's merge, 317 after).
  - The `--affected 55ec410` bullet (:68-69) now says 317 (244 + 48 + 25), with 312 before the merge. This review
    reproduced "317 of 317 plants selected".

Nothing regressed: the fix changes no code or test, and the targeted tests, typecheck and lint pass. The only
blocking item left is the bookkeeping in R5-01.
