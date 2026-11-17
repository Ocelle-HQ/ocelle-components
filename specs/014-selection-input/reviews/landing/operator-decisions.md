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
