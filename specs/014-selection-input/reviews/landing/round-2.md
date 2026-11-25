---
phase: landing
round: 2
verdict: approved
base: b594b7e98bb5480aad9cc8dcf0bd3f7f378f920f
head: a5e31b92882792a92dd6222ec55f1a5b5d12c036
tdd_check: pass
owed_before_handoff:
  - "second merge of origin/main, after #49 lands (landing decision 4)"
  - "one full gate:plants run against the phase base on the head after that merge, recorded in phase-6 and phase-7 plants.md and the landing records (phase 6 decision 5, phase 7 decision 3; L1-06)"
  - "green CI on the final head after that merge: Unit tests, every Mutation shard and the Mutation testing aggregate included"
---

# Landing review, round 2

Scope, under the landing stop rule: (1) are round 1's blocking findings L1-01 and L1-02 resolved, and (2) did the folds
made since round 1 (`fec463e`) regress anything. I did not search the code afresh. The head is `a5e31b9` (pushed, equal
to `origin/claude/014-selection-input`), and the merge base with origin/main is still `b594b7e`.

`git diff fec463e..a5e31b9` touches 19 files. The only files outside `specs/` are three test files:
`packages/elements/test/browser/link-subpixel.test.ts` (new), `packages/elements/test/browser/subpixel/fonts.conf` (new)
and `packages/elements/test/scenarios/link.ts` (US5-7 only). Over package source, `gates`, `.github`, `storybook` and
`vitest*.ts` the diff is empty. `8fd8c47..a5e31b9` touches only phase 6 records and `tasks.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note (follow-up issue) | packages/elements/test/browser/dialog.test.ts and drawer.test.ts, mission 008 row "Rapid toggle during the entry, motion on"; phase-6 notes.md:279, round-4.md R4-03 | Under local load this mission 008 motion row has failed with `entry: []`, once in each harness file, and it passes when run alone. It is outside 014's change, and nothing since round 1 touches dialog, drawer or motion. It is timing-sensitive and can turn CI red, and no record outside phase 6's notes tracks it. I agree with R4-03. | Not a blocker. Suggested follow-up issue for mission 008: "Flaky: dialog/drawer 'Rapid toggle during the entry, motion on' fails with `entry: []` under load". Wait for an observable state, not timing. Link this so that a red run on this row is not read as a 014 regression. |
| L2-02 | note (follow-up issue) | specs/014-selection-input/reviews/phase-6/tdd-check.json (`final_tests_on_base_exit: 2`, `final_tests_on_scaffold_exit: 2`); phase-6 round-4.md R4-02 | Since the merge of main, the base and scaffold legs of `tdd-check.sh` exit 2 ("no test file found"), and the check still reports `pass`. This leg is now vacuous for this phase. The red commits are each proven on their own (exit 1 on assertions), so 014's evidence holds. | Not a blocker. Suggested follow-up issue for the owner of `tdd-check.sh`: an exit 2 collection error on the base or scaffold leg should report `unavailable`, not count as "fails". |
| L2-03 | note (follow-up issue) | packages/elements/test/scenarios/driver.ts (L1-05) | This carries round 1's design note forward: the Driver has five pairs of near-synonym methods after landing decision 3. | Not a blocker. Suggested follow-up issue: consolidate the pairs (decision 3's "unify into overloads" option) once both sides' scenarios can migrate together. |

There is no blocking finding.

## Earlier findings

- **L1-01 (blocking): resolved.**
  - Cause and fix: subpixel text antialiasing in CI put the coloured fringe of the neighbouring "e" under the left ring
    sample. Red `ca18374` adds a permanent subpixel-text fixture suite (`link-subpixel.test.ts` with its own
    `fonts.conf`). It fails on US5-7's `ring` entry (left side `false`). `red-commits` records it as `fix-3 ca18374…`,
    and `red-fix-3.log` shows 1 of 8009 tests failing. Phase 6 round 4 re-ran it independently.
  - Green `96dd714` changes only US5-7's `mount`, adding `#link { margin-inline: 0.75em; }` and a comment saying why. I
    read that diff. `expected`, the ring samples (3.5 px out), `over(Highlight, Canvas)` and the exact comparison are
    unchanged, so the test was not loosened (Principle VIII).
  - The plant comment changed so that it no longer claims the colour-only ring swap bites. Phase 6 round 4 verified
    that this swap is equivalent in Chromium, and that removing the ring is still caught (`ring` `[false, false]`).
  - CI: run 44539529359 on `8fd8c47` is recorded green in `reviews/phase-6/notes.md:293-298`, with Unit tests passing.
    `8fd8c47` and `a5e31b9` have the same code (records only between them).
- **L1-02 (blocking): resolved.**
  - The same run, 44539529359, is recorded with 129 of 129 jobs successful, including all 80 Mutation shards and the
    Mutation testing aggregate. Before, they failed with exit 2 because the initial test run failed. The record states
    that no surviving mutant is reported in new or changed code.
  - L1-02's records clause: the "29 of the 30 jobs" count appeared only in round 1's brief. No committed landing record
    carries it, so there is nothing to correct.
  - Limitation: in this environment `gh api` was denied, so I could not read the run myself. My judgement rests on the
    recorded run id and job results, which phase 6 round 4's R4-05 asked for and `round-3-fixes.md` repeats. If the
    orchestrator can confirm the run's conclusion with `gh run view 44539529359`, that closes the gap. CI on the final
    head after the second merge is owed anyway (front matter).
- **L1-03, L1-04 (notes, documentation):** open and optional; unchanged since round 1.
- **L1-05 (note):** open; proposed as follow-up issue L2-03.
- **L1-06 (note):** still owed, and now in scope for phase 6 too (phase 6 decision 5 alongside phase 7 decision 3). It
  is listed in `owed_before_handoff`.

## Regression check on the folds since round 1

- **No source change.** The diff from `fec463e` touches no file under package `src`, gates, CI workflow, Storybook or
  Vitest config. So it cannot change element behaviour, the mutation surface or any gate's verdict.
- **Test changes stay within US5-7.**
  - The new subpixel suite runs in `elements-browser` only. Phase 6 round 4 checked that it is excluded from the
    in-process project and from Stryker, and that it uses its own launch, with no change to `serve.ts` or the shared
    launch.
  - Its precondition fails loudly on a platform without LCD text; it never passes vacuously (R4-04).
- **Records.**
  - Phase 6 R4-01 (the plant base) is closed by phase 6 decision 5, which defers to the same full run as phase 7. That
    run is owed (front matter).
  - T115 is ticked after CI.
  - Every commit in `fec463e..HEAD` is signed off.
- **No regression found.**

## Test quality

- The fix-3 red is genuine and committed before the fix. The fix is a test change, made in a way that keeps the test
  equally strict, and its reason is recorded (R-15 amendment).
- Phase 6 `tdd-check.json` is `pass`: HEAD exit 0, and both red commits exit 1. The base and scaffold legs are vacuous
  after the merge (L2-02).
- The mutation result for the integrated source rests on CI run 44539529359 (see L1-02).

## Checks run

| Command | Exit | Result |
|---|---|---|
| `git diff --stat fec463e..a5e31b9`, and the same limited to src, gates, .github, storybook and vitest*.ts | 0 | 19 files; empty over source, gate and config |
| `git diff fec463e..a5e31b9 -- packages/elements/test/scenarios/link.ts` | 0 | only US5-7's mount rule and comments |
| `git diff --stat 8fd8c47..a5e31b9` | 0 | phase 6 records and tasks.md only |
| `pnpm run gate:signoff -- --range fec463e..HEAD` | 0 | 9 commits checked, no finding |
| `gh api …/actions/runs/44539529359` (read only) | could not run | permission denied in this environment; relied on the record in phase-6 notes.md |

As the stop rule asks, I ran no heavy gate and did no fresh code search.
