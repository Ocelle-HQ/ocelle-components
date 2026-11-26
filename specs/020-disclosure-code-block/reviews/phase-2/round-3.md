---
phase: 2
round: 3
verdict: approved
base: cca63571794b57f2e4f1443e6d65c29d0d098d18
head: 3dfb80fe6221901fa46ea8b34850ffba86141ba7
tdd_check: pass
---

# Phase 2 review, round 3

This closes the bounded code-block source review for T034 and T035 after integration. The source and tests at this record head are the same as the hosted candidate code at `a4db93fc`. The operator's CI-first decision leaves the full hosted checks to landing.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | [Focused replay](../landing/focused-replay.md) and [original phase proof](tdd-check.json) | The original proof applies to the folded phase. The legacy replay of merged files on the old base and scaffold stops at unrelated imports and returns exit 2. Those outcomes supply no red evidence for this round. | Keep the historical proof and the landing regression replays as separate records. |

## Test quality

- The original test-only red and its scaffold assertion evidence stay in the phase record. On exact test-only red `2fd51b29`, I reproduced both reconnect assertion failures. Both browser harnesses showed the old text, name, role and tab stop on reconnect. The current tests with the pre-fix source also reproduce the named failures. The current implementation and tests pass on the integrated head.
- In the earlier built strict-CSP fixture, I independently reproduced the original RTL geometry failure before the vendored font was loaded. Without changing the scenario assertions, loading the font before mounting made all three line starts visible at the expected offset and produced the expected fade. The current fixture verifies a face was loaded before it mounts. The product's one-write behavior and the operator's font caveat stay intact.
- The mutation evidence measures reconnect and observer teardown, real host attribute reflection, scroll and focus retention and RTL box or text changes. I checked the narrowly annotated equivalences against Lit's default String converter, the clamped RTL endpoint and the wrap node's focusout lifecycle. The final hosted mutation verdict remains open.
- `tdd_check: pass` records my judgment on the original folded proof plus the focused assertion replays and current green checks under CI-first. It does not label the legacy overlay's exit 2 as red or report a new full-suite TDD JSON result.

## Checks run

Focused code-block rows passed in both browser harnesses, including the strict-CSP fixture. The integrated focused sweep across both phases passed 18 cases, and the broader local run recorded 206 cases. I reran the affected Plants selection against this phase's base. It still selects all 317 plants, and `--list` judges none. Full Plants, full changed-line mutation, Unit tests, visual and axe remain required for landing. [CI-first decision](../operator-ci-first.md) · [Candidate CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45059422687)

## Earlier findings

- **T034, round 2: resolved.** The fixture now supplies the font precondition and still checks the exact line starts, offset, fade and strict-CSP record.
- **T035, round 2: resolved.** Reconnect refreshes text and its derived scroll state without observing detached edits. Behavior-sensitive mutation probes and their assertions are recorded in [round 2 fixes](round-2-fixes.md). The required hosted mutation verdict decides before landing.
