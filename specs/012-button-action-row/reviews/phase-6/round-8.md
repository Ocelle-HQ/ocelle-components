---
phase: 6
round: 8
verdict: approved
base: 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809
head: e676357f
tdd_check: pass
---

# Phase 6 review, round 8

This is a check-only round under the landing stop rule. It checks that round 7's O7-01 (operator round: the visual
integration test's time limit) is resolved by fix round 4 and that nothing regressed. It does not search afresh.

The commits since 9860a678 are eb342bda (red), 644c6820 (green and records) and e676357f (tdd-check evidence). All
three are signed off. eb342bda adds only gates/test/visual-timeout.test.ts. 644c6820 changes one source-of-truth line
and its comment in gates/test/integration/visual.test.ts, plus records under specs/012-button-action-row/ (tasks.md,
reviews/phase-6/{ci-run.md, notes.md, plants.md, red-commits, red-fix-4.log, round-7-fixes.md}). e676357f changes
only evidence files in reviews/phase-6/.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R8-01 | note | specs/012-button-action-row/tasks.md (T083) | T083 (the CI record on the pushed head) is open. That is expected: it waits for the operator's push. The CI run on the pushed head is O7-01's final evidence, so the landing check should confirm that the 1200 s limit holds there. | None in this round. Record T083 after the push. |
| R8-02 | note | reviews/phase-6/red-fix-4.log:42-44 | The red run also has three plant-repo.test.ts time-outs (5 s / 10 s) that have nothing to do with fix-4. notes.md § Fix round 4 explains them as machine load, and they are absent from check-red-fix-4.log and from the green full run (check-head.log: 7768 passed). The red proof does not depend on them. | None. |

There are no blocking findings.

## Test quality

- **Red evidence.** eb342bda is test-only: one new file, gates/test/visual-timeout.test.ts, with 49 lines.
  red-commits records `fix-4 eb342bda…`. In red-fix-4.log and check-red-fix-4.log the new tests fail on assertions,
  not on a load error: `expected 600000 to be greater than or equal to 1200000` (visual-timeout.test.ts:35) and
  `expected '…' to contain '44481594952'` (visual-timeout.test.ts:42). The single-declaration test passes at red, as
  expected, and the "a second declaration" mutant proves it can fail.
- **Not weakened.** `git diff eb342bda HEAD -- gates/test/visual-timeout.test.ts` is empty.
- **Not vacuous.** The test reads the real file and anchors on `^const timeout = ([0-9_]+);$`. It bounds the value
  from both sides (1_200_000 to 1_800_000). It requires seven hand-written strings in the contiguous `//` run directly
  above the constant. If there is no declaration, the value becomes NaN and the comment is empty, so both tests fail
  rather than pass. plants.md § Fix round 4 records four hand-applied mutants: 900_000, 3_600_000, the comment without
  the run id, and a second declaration. Each one fails exactly the intended assertion, and each was reverted.
- **Mutation command.** Not run: fix-4 changes no element or gate source. The only code change is a test-file
  constant, and the hand mutants above cover it.

## Checks run

- `pnpm vitest run --project gates gates/test/visual-timeout.test.ts`: 3 passed.
- `pnpm run gate:typecheck`: no type error.
- `pnpm run gate:lint`: 447 files, no finding.
- `pnpm run gate:test-lint`: 328 files, no finding.
- `pnpm run gate:signoff -- --range origin/main..HEAD`: 132 commits, no finding.
- tdd-check.json: `pass`, with head 644c6820 and red commits `phase` and `fix-4`, both exit 1, and no problems.
  `final_tests_on_base_exit` 2 is the known "could not run" recorded in round 3 R3-03. The only commit after
  644c6820 is e676357f, which changes evidence files only, so the check is current for the code.
- The 30-minute docker visual run was not repeated, as instructed. notes.md § Fix round 4 records a local figure:
  509 s for the whole-repository capture, 11 tests passed, and 580 s for the longest test. This is not a CI figure.
- Store paths: `grep -rnE '/root/|/home/[a-z]' reviews/phase-6/` finds nothing. Every check log and red log shows
  `<pnpm store>`.

## Earlier findings

- **O7-01 (round 7, operator): resolved.**
  - gates/test/integration/visual.test.ts:31 is `const timeout = 1_200_000;`, with the reason and figures in lines
    26-30 above it: 519 s at 171 stories (R1-06); a time-out at 600 s at 194 stories (388 story-themes) on run
    44481594952, a test that run 44298568583 had passed; twice the limit that failed (O7-01, operator 2026-11-19);
    growth stays with the plant-design follow-up (decision 15, R1-06, R1-09).
  - The operator chose "1200 s, visual only". axe.test.ts:14 and plants-robustness.test.ts:17 keep `600_000`, as
    asked.
  - The figures agree across sources. The ci-run.md addendum (lines 136-147) and the 006 plan's Complexity Tracking
    row (7802c723) both give 519 s against the then 600 s limit at 171 stories, the 600 s time-out at 194 stories on
    run 44481594952, and the raise to 1200 s. Both match the comment and round-7.md.
  - Tasks: T078-T082 are ticked, and their work is present (see Test quality, and plants.md / notes.md § Fix round 4).
    T083 is open by design (R8-01).
