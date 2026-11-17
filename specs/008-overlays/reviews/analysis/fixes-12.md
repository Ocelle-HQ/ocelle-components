# Analysis fixes 12

Input: operator decision 3 of 2026-11-16 on T055 (`reviews/phase-5/notes.md` § Operator decisions after the Phase 5
implementation), asked as a multiple-choice question; the operator chose "Fix docs, defer to land". Only design
artifacts were changed. No source code, test, README or configuration file was written, and no task was renumbered.
Decisions 1 and 2 (the `red-commits` deletion, the R-12 re-entry row) are not part of this change.

| ID | Resolution | Where |
|----|------------|-------|
| Quickstart step 6 (`pnpm run gate:mutation` cannot run as written: `could not run: --base <sha> is required`, exit 2; notes § T055) | decided (operator, 2026-11-16): fixed. Step 6 now reads `pnpm run gate:mutation -- --base 3828d2f`, names the exit-2 message without `--base`, and says the mission-wide run (`--base 3828d2f`, the merge base with `main`) plans 60 shards and is run shard by shard with `--files`, as CI does on the pull request. | quickstart.md step 6 |
| R-16 citation (`storybook/.storybook/main.ts:49` for `viewport: false`; notes § T054) | decided (operator, 2026-11-16): corrected to `:23`, verified at HEAD (`8910878`: line 23 is `viewport: false`; the file has 31 lines). The fact stated was already right. | research.md R-16 § Short viewport |
| T055 (left open: step 6 ran only phase-scoped, the hand checks had no result) | decided (operator, 2026-11-16): T055 is ticked with its outcome stated: steps 1 to 5 and 7 pass, step 6 is fixed. Deferred to `/ocelle-land` and the pull request as known gaps: the mission-wide mutation run (60 shards); the two hand checks; WebKit (no harness here). | tasks.md T055 |
