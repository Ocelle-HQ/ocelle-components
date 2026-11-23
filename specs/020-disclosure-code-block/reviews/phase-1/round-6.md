---
phase: 1
round: 6
verdict: approved
base: c7ba57d98f410d956c5c072302c8b34ae221dc5b
head: 3dfb80fe6221901fa46ea8b34850ffba86141ba7
tdd_check: pass
---

# Phase 1 review, round 6

This closes the bounded disclosure source review for T014 and T015 after integration. The source and tests at this record head are the same as the hosted candidate code at `a4db93fc`. The operator's CI-first decision leaves the full hosted checks to landing.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R6-01 | note | [Focused replay](../landing/focused-replay.md) and [original phase proof](tdd-check.json) | The original proof applies to the folded phase. The legacy replay of merged files on the old base and scaffold stops at unrelated imports and returns exit 2. Those outcomes supply no red evidence for this round. | Keep the historical proof and the landing regression replays as separate records. |

## Test quality

- The original test-only red and its scaffold assertion evidence stay in the phase record. The focused final replay independently distinguishes current T014 and T015 behavior from the relevant pre-fix source.
- For T014, both pinned Chromium harnesses fail the current assertion when the integrated focus walk is replaced by the pre-Op 022 file. Focus reaches the page body instead of the dialog close button. Both pass with the integrated source. This test-only addition covers the actual disclosure inside a dialog. Op 022 supplied the production fix before this replay.
- For T015, `4dff9105` is test-only and records separate no-throw assertion failures for detached focus and click in `red-fix-5.log`. I reproduced the exceptions on that red code. Current tests pass with the guarded summary lookup. The existing rendered focus and single-toggle assertions remain.
- `tdd_check: pass` records my judgment on the original folded proof plus the focused assertion replays and current green checks under CI-first. It does not label the legacy overlay's exit 2 as red or report a new full-suite TDD JSON result.

## Checks run

Focused disclosure rows passed in both browser harnesses, including the strict-CSP fixture. The integrated focused sweep across both phases passed 18 cases, and the broader local run recorded 206 cases. I reran the affected Plants selection against this phase's base. It still selects all 317 plants, and `--list` judges none. Full Plants, full changed-line mutation, Unit tests, visual and axe remain required for landing. [CI-first decision](../operator-ci-first.md) · [Candidate CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45059422687)

## Earlier findings

- **T014, round 4: resolved.** The composed focus regression covers the documented limitation on the old walk. The current README removes that limitation and only its matching test fragment.
- **T015, round 5: resolved.** Detached `focus()` and `click()` return without throwing and preserve the closed state. The guard leaves the rendered summary target, accessible name and toggle semantics intact.
