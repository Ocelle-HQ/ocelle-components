---
phase: 7
round: 2
verdict: approved
base: bd40cf3078bbfd8bd5fee54f9ad82be9f41e96fc
head: c5fc864b
tdd_check: pass
---

# Phase 7 review, round 2

Under review: `bd40cf30..c5fc864b`. Since round 1 (`3bc2589b`), the only commit is the fix `c5fc864b`. It changes
contracts/checks.md:80 (one line) and adds reviews/phase-7/round-1-fixes.md. There was no uncommitted change.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings.

## Test quality

- **tdd-check.** `tdd-check.json` reports `pass` at `dc1e825b` (red `50b72071` exit 1, final tests on base exit 1,
  head exit 0, no problems). `git diff --stat dc1e825b HEAD` lists only records, review and check-log files:
  contracts/checks.md (1 line), the three `check-*.log` files, round-1.md, round-1-fixes.md and tdd-check.json. No
  source, test, story or package file changed after the check, so its result stands for this head. The tdd-check after
  the fold covers the final head.
- **Weakening.** `git diff 50b72071..HEAD -- packages/elements/test` is empty. Since the red commit, the only package
  change is `packages/elements/README.md` (the green commit).
- **Fix red.** R1-01 was records-only, so no red test was needed. `red-commits` holds only the `phase` entry, and that
  is correct.
- **Mutation.** `gate:mutation -- --base bd40cf30`: nothing to mutate, exit 0.
- The test-quality findings of round 1 (red evidence, vacuity, coverage) are unchanged, because no test changed.

## Checks run

Node 26 first on PATH, at HEAD `c5fc864b`:

- `gate:lint`: 481 files, no finding, exit 0.
- `gate:signoff -- --range bd40cf30..HEAD`: 6 commits, no finding, exit 0.
- `gate:mutation -- --base bd40cf30`: nothing to mutate, exit 0.
- `gate:plants -- --affected 4fc2ed5b --list`: "note: affected: every plant, by packages/elements/package.json (not
  mapped)", 317 of 317 selected, none judged, exit 0. This matches plants.md (base per plan.md and T065, round-1 R1-02).
- `vitest --project elements-node`: 846 of 846 passed.

The other gates of round 1 were not rerun: the fix changes only a Markdown records file that none of them reads as
source. The full tdd-check, unit, browser, visual, axe and storybook-build runs were not run, as instructed and per
reviews/operator-ci-first.md. CI judges them on the pull request (round-1 R1-04).

## Earlier findings

- **R1-01 (blocking): resolved.** contracts/checks.md:80 now names the plant as
  `.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }` in the pill's own styles after
  `iconSlotStyles`. It says the block-starts stay equal because the plant's own `.icon-slot { align-self: flex-start }`
  holds the icon wrapper at the row's start, and it keeps the icon-only pill hanging below the line (top −4.00 px, as
  with `bare` never set). Checked against the sources:
  - plan.md:174-175: the earlier override is both declarations together.
  - reviews/phase-1/spikes.md:63 (plants table): the dropped override gives a labelled offset of 0.00, an icon-only
    pill at −4.00 / +17.09 (as `bare` never set), and equal wrapper block-starts. At :216-217, the reason for the
    equal block-starts is `.icon-slot { align-self: flex-start }` beside the `align-items: baseline`.
  - reviews/phase-4/notes.md:126: the plant as run is both declarations after `iconSlotStyles`, 4 failed, top −4.00
    px.
  - Code: `packages/elements/src/icon-slot.ts` has only `align-items: flex-start` (:38), `align-self: baseline` (:43)
    and `align-items: center` (:48). `packages/elements/src/ocelle-pill-tag.ts` has only `align-items: center` (:232).
    Neither has `align-self: flex-start`, so the row now attributes that rule to the plant, which is correct.
  The diff of `c5fc864b` to checks.md is this one row's plant cell. The other cells of the row and the other rows are
  unchanged, and no other file except the fix note changed.
- R1-02 to R1-04 (notes): acknowledged in round-1-fixes.md, with no change needed. The plants `--list` rerun above
  still matches plants.md.
