# Landing operator decisions — PR #54

## Decision 1 — merge plan (2026-11-17)

- Operator: human:jeroennouwsdev
- Context: origin/main (b594b7e) gained missions 008, 009, 011, 013 and ops 015, 016 since the branch's base 3828d2f; `git merge-tree` shows 44 conflicting files (43 content, 1 add/add), mostly shared test infrastructure. The deferred composed ocelle-dialog + ocelle-listbox story (phase 7 decision 1) needs ocelle-dialog from main. The fold script refuses merge commits in its range.
- Answer: **"Merge now, no final fold (Recommended)"**. implementer-ivan merges origin/main with `--signoff` (no rebase) and resolves the conflicts, every gate run on the result; then the dialog story fold, test first; then the landing review. The final history fold (land step 2.8) is skipped; phase folds and their archive refs are untouched.

## Decision 2 — announce comment (2026-11-17)

- Answer: **"Post it (Recommended)"**. Posted as https://github.com/Ocelle-HQ/ocelle-components/pull/54#issuecomment-6957148133.

## Decision 3 — shared scenario Driver contract conflict (2026-11-17)

- Operator: human:jeroennouwsdev
- Context: merging origin/main, the shared `Driver` (packages/elements/test/scenarios/driver.ts) has five methods both sides added with different signatures and meanings — `press`, `click`, `hover`, `activeElement`, `viewportSize` — and a different `Target` type. Main's earlier merge of #43 kept both sides by giving the later additions distinct names.
- Options: rename 014's methods; rename main's methods; unify into overloads; defer the merge.
- Answer: **"Rename 014's methods (Recommended)"**. 014's five colliding methods get distinct names, `Target` widens to cover both shapes with one shared resolver, and main's landed code is untouched. The planner updates 014's task, research and contract wording to the new names afterwards.

## Decision 4 — landing order and the second merge of main

- Date: 2026-11-18
- Operator: human:jeroennouwsdev
- Context: the orchestrator session relayed an operator decision: landings go one at a time, #50 (012), then #49 (010), then #54. #54 merges main again only after #49 has merged. #54 had already merged main once (ac2f991) and T114 (the composed story) was in progress.
- Options: finish T114 and wait for the second merge; pause T114 until after the second merge; treat the relayed decision as not applying.
- Answer: **"Finish T114, wait (Recommended)"**. T114 finishes on this branch, with only the feature branch pushed. The landing review and records proceed. No further merge of main until the orchestrator reports #49 merged; then main is merged once, and counts, baselines and CI are redone on top.

## Decision 5 — CI carries the heavy gates after the second merge of main

- Date: 2026-11-20
- Operator: human:jeroennouwsdev
- Context: the orchestrator session relayed a proposal from the operator. The repository is now public, so CI minutes are free. After the second merge of main (7f61959), only the fast gates and the `gate:plants --affected <base> --list` selection run locally. The 4–5 h full local plants run is skipped, and CI's required Plants, Visual regression, Unit tests and Mutation checks on the final head decide. This changes phase 6 decision 5 and phase 7 decision 3, which owed one full local plants run after the second merge. The orchestrator later reported this as the operator's standing decision for every session.
- Options: CI carries the heavy gates; keep the full local run.
- Answer: **"CI carries heavy gates (Recommended)"**. Run locally: the fast gates, contrast, the plants selection list, the conflicting baselines regenerated in the pinned container, and targeted tests for the files the resolution touched. Then ask the operator before the push. CI's full Plants shards, Visual regression, Unit tests and Mutation on the final head stand in for the full local plants run in the phase 6 and phase 7 records. The CI run id is recorded there after the push.

## Decision 6 — the PR body

- Date: 2026-11-20
- Operator: human:jeroennouwsdev
- Context: the landing rewrite of PR #54's body. It leads with consumers, sets the floor at Chromium 135, describes the two merges and the landing folds, cites CI run 44797053961, and lists three suggested follow-ups without filing them.
- Options: post as drafted; post with edits; keep the old body.
- Answer: **"Post as drafted (Recommended)"**. The body was replaced on 2026-11-20.

## Decision 7 — retrospective and follow-up issues

- Date: 2026-11-20
- Operator: human:jeroennouwsdev
- Context: the landing retrospective drafted 14 diary entries, two frontend findings and three repository follow-up issues.
- Answer: **"Write all (Recommended)"** for the diary and findings (503dff7). All three issues are filed:
  - #61: flaky motion test, dialog and drawer "Rapid toggle during the entry, motion on";
  - #62: prefix or register test-Driver additions per mission;
  - #63: pixel tests should match CI's text rendering locally.
