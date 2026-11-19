---
phase: landing
round: 3
verdict: changes_requested
base: b594b7e98bb5480aad9cc8dcf0bd3f7f378f920f
head: ddb134c9da50822f7a7de42029c4d2745f4f2f80
tdd_check: pass
---

# Landing review, round 3

This is a check-only round under the landing stop rule (`.claude/skills/ocelle-land/SKILL.md`, step 2, "Stop rule").
It checks three things:

- round 2's blocking finding R2-01 is resolved;
- round 2's notes R2-02 and R2-03 are handled or carried;
- the fold since round 2 regressed nothing.

It does not search afresh.

The change under review is `git diff origin/main...HEAD`. The merge base is b594b7e (main, mission 009) and HEAD is
ddb134c. Round 2 was written at aeda253 and committed at 926055d. The fold is the operator round
`reviews/phase-6/round-4.md` (b5e7b3f, "Fold R2-01 + notes"), which has four commits:

- b6f0010 adds tasks T073 to T077;
- cb1ae7b is the planner's edit to the 006 plan.md;
- 265e819 holds the fixes and `round-4-fixes.md`;
- ddb134c records the tdd-check.

The phase 6 round 5 review is being written at the same time, and this round does not rely on it.

The CI evidence is run 44298568583 on ac2d73a. I take its figures from the caller and did not open the run, because
GitHub is outside my role. `git diff ac2d73a..HEAD --name-only` lists 15 files, and none is a test, a story or
package source. The only file that is not a review record or Markdown is `gates/lib/plant-runner.ts`, and its diff
touches only the two doc comments above `shardSize` and `otherShardSize`, not the code. The run therefore still
stands for HEAD.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | specs/012-button-action-row/tasks.md:365-369 | **The fold left its own tasks open.** T073, T074, T075, T076 and T077 are all still `- [ ]`. They are the only five open boxes in tasks.md (`grep -c "^- \[ \]"` gives 5). Their work is present: T073 to T076 in 265e819, and T077's checks and records in `reviews/phase-6/notes.md` § "Fix round 3" and `round-4-fixes.md`. The fix commit did not tick them. The earlier folds did tick theirs in the fix commit: 7a3385e ticked T069 to T072, and bd9aaca ticked phase 4's fix-2 tasks. Before b6f0010, tasks.md had no open task. The fold has therefore turned a complete task record into an incomplete one, and the phase 6 checkpoint at tasks.md:371-373 cannot be read as met. This is a regression in the fold's own record, not a new search. | Tick T073 to T077 (`[X]`) in a docs commit, signed off, as 7a3385e did for T069 to T072. No other change is needed. |

There is one blocking finding and there are no new notes.

## Earlier findings

| ID | Status | Evidence |
|----|--------|----------|
| R2-01 (blocking) | **resolved** | See "R2-01 in detail" below. |
| R2-02 (note) | **handled** (folded as O4-04) | gates/lib/plant-runner.ts:282-284: 80 "deals the repository's 244 into 4 shards (232 into 3 before main b594b7e, 009, was merged)". The figures match the pins at gates/test/plant-runner.test.ts (`others: 244`, `4 + 48 + 25`), and that test passes. Only the comment changed; `otherShardSize = 80` (:286) is untouched. |
| R2-03 (note) | **carried** | Round 2 asked for no change in this pull request: the R1-06 follow-up issue is to state 194 stories. The operator round folds R2-01, R2-02 (O4-04) and phase notes R3-01, R3-02 and R4-01. It does not include R2-03, and no file here needed to change for it. The 006 plan row (specs/006-storybook-workbench/plan.md:640) still cites "the repository visual integration test's 519 s against its 600 s limit" as the reason for the triage. That figure is R1-06's measurement at 171 stories, and the row now says 194 stories elsewhere. This is not a regression: the fold did not touch that clause, and R2-03 already routes it to the follow-up. When the follow-up issue is opened, its text should state 194 stories and the 519 s as a 171-story figure. |

### R2-01 in detail

R2-01 is resolved in all three places it named.

**What each place now states**

- **gates/README.md:61-71.** The paragraph states:
  - **194 stories** after b594b7e (009) was merged, in **77 shards (4 + 48 + 25)**;
  - run 44298568583 on ac2d73a (attempt 1, all 148 jobs green);
  - the gate step: peak **524 s** (shard 39), none at or over 570 s, 24972 s in all, **6.94** runner-hours;
  - the shard job wall time: peak **692 s** (shard 21), 29 shards over 570 s, 34745 s in all, **9.65** runner-hours
    over the 77 shard jobs.

  Run 44098238937 (171 stories, 76 shards, 3 + 48 + 25) stays, labelled "Before 009's merge", with its earlier
  figures. "Is exceeded" and "pending" (the triage record) are kept.
- **gates/lib/plant-runner.ts:265-278**, the `shardSize` comment, gives the same figures and the same before-merge
  label.
- **specs/006-storybook-workbench/plan.md:634-640** (cb1ae7b, planner):
  - the Complexity Tracking intro says "now exceeded at 194 stories after main b594b7e (009) was merged";
  - the row gives "4 + 48 + 25 = 77 shards after 009's merge (3 + 48 + 25 = 76 before it)", 194 stories, run
    44298568583 with the same figures, and run 44098238937 labelled "Before 009's merge";
  - the sunset cell gives "exceeded at 194 stories (171 before 009's merge)".

**Checks against the run and the repository**

- **The caller's figures.** All three places agree with the run figures the caller gave: 194 stories, 77 shards, gate
  step peak 524 s, 24972 s, 6.94 h, job wall peak 692 s, 29 over 570 s, 34745 s, 9.65 h. The hours are consistent
  with the seconds (24972 / 3600 = 6.937; 34745 / 3600 = 9.651).
- **The repository.** On HEAD, `grep -rhoE "^export const [A-Z]\w*" storybook/stories | wc -l` gives 194, and
  `pnpm run gate:plants -- --plan` lists shards 1 to 77.
- **The old wording.** Under gates/ and in the 006 plan, the only remaining "171 stories", "76 shards" and "232 into"
  text is labelled as before the merge.

**O4-02's wording.** The fold also applied the split-count wording that 8dc8147 used, "put to the operator at 012
phase 1's review and accepted at phase 2", in the README (:61-62) and the comment (:267-268), so all three places now
say the same.

**The 9.71 runner-hours in O4-01.** `reviews/phase-6/round-4.md` O4-01 says "9.71 runner-hours". The three places say
9.65, the caller's shard-job figure. `round-4-fixes.md` § "Figures used" and `notes.md` § "Fix round 3" explain the
difference: 9.71 also counts the Plants plan and verdict jobs. The README cites round-4.md O4-01 as its source, but
the figure it states is the shard-only one, labelled "over the 77 shard jobs". That is accurate, so it is not a
finding.

**Records left as they were.** As R2-01 required, `reviews/phase-6/ci-run.md` and T067's tick (the 171-story
decision) are unchanged: `git diff ac2d73a..HEAD` does not list ci-run.md, and T067 is not in the tasks.md diff.

### The fold regressed nothing (apart from R3-01)

- **O4-03.** `reviews/phase-6/round-2-fixes.md:9` and `notes.md` (§ Fix round 2) add 904e5cf, 226e29e and 8dc8147
  without removing anything that was there before.
- **O4-05.** `reviews/phase-4/plants.md:62-64` keeps the operator's verbatim "all 312 plants" and adds a bracketed
  note about 312 and 317. :68 says 317, and `pnpm run gate:plants -- --affected 55ec410 --list` prints "317 of 317
  plants selected, none judged". The run link at :70-73 (from aeda253) is untouched by 265e819.
- **ddb134c.** It changes only the phase 6 tdd-check evidence. `tdd-check.json` gives `status: pass` with head
  265e819, `problems: []` and a base sub-check exit of 2, as phase 6 round 3 R3-03 recorded. The log diffs redact
  store paths and change no result.
- **Tests and code.** No test, story or behaviour changed, so the fold needs no red commit. That matches
  `round-4-fixes.md` and constitution VIII (no behaviour).

## Test quality

- **No test changed since round 2.** `git diff 926055d..HEAD` lists no file under `*/test/` and no story. The pins
  that R2-01's figures describe still pass unchanged:
  - `others: 244` and `4 + 48 + 25` (gates/test/plant-runner.test.ts);
  - `built 194 stories` (gates/test/integration/storybook-build.test.ts:55).
- **No pin on the edited prose.** gates/test/gates-readme.test.ts does not pin the edited paragraph, and it passes.
- **`tdd_check: pass`.** The phase 6 record at ddb134c gives `pass`. The other phase records are unchanged since
  round 2.
- **Mutation.** I did not rerun it, because no source line changed (comments only).

## Checks run

On ddb134c, locally:

| Command | Result |
|---------|--------|
| `pnpm run gate:typecheck` | exit 0, no type error |
| `pnpm run gate:lint` | exit 0, 446 files, no finding |
| `pnpm run gate:prefix` | exit 0, 460 files, no finding |
| `pnpm run gate:config-copies` | exit 0 |
| `pnpm run gate:signoff -- --range origin/main..HEAD` | exit 0, 104 commits, no finding |
| `vitest run --project gates` | 66 files, 2362 tests passed (gates-readme and plant-runner included) |
| `pnpm run gate:plants -- --plan` | shards 1 to 77; listed only, no plant judged |
| `pnpm run gate:plants -- --affected 55ec410 --list` | 317 of 317 plants selected, none judged |
| `grep -rhoE "^export const [A-Z]\w*" storybook/stories \| wc -l` | 194 |

I did not rerun the following:

- `pnpm test` in full: T077 records 7753 tests passed.
- `storybook-build`, `visual`, `axe` and the plants: CI run 44298568583 on ac2d73a is the evidence for those, and
  since ac2d73a only docs, comments and review records have changed.

verdict: changes_requested
