---
phase: 1
round: 1
verdict: changes_requested
base: 53d47ade4619725a7e96763ef129ccc317e2b7cc
head: 267b95b40768dcf3cf0b1c197678cfa7a25e5a5d
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/custom-elements.json:5851`, `gates/plants/manifest/*/tree/packages/elements/custom-elements.json` | The new declaration is absent from all eight valid full-manifest overlays. Hosted Plants shards 1–4 report seven unexpected stale-manifest outcomes. The eighth, `fail-lost-attribute`, passes the shard verdict, but a direct `manifestFindings` comparison emits both the intended missing icon attribute and an unintended stale finding for the step indicator. The ordinary finding comparison in `gates/lib/plant-judge.ts:265,356` treats the two same-location, same-rule findings as one key. | Add the generated step indicator declaration to all eight overlays, preserving the reordered fixture and each deliberately planted difference. Verify both the affected Plant results and the exact raw findings before accepting the corrected candidate. |
| R1-02 | blocking | `specs/033-pane-step-indicator/tasks.md:15`, `specs/033-pane-step-indicator/reviews/phase-1/` | T005 remains open. This candidate lacks a `plants.md` record and final changed-source mutation evidence. Required hosted Unit and Plants evidence has yet to clear on a corrected candidate. | Complete T005 with the mutation result, the affected Plants selection at the recorded phase base, and successful hosted Unit and Plants checks tied to the corrected head and tested merge. |

Shards 1–4 are attached to run 45737601757, attempt 1. Artifacts 15079956801, 15080190833, 15079429125 and 15079213316 identify `manifest/pass-reordered` and each of `fail-undescribed-attribute`, `fail-undescribed-css-part`, `fail-undescribed-css-property`, `fail-undescribed-event`, `fail-undescribed-property` and `fail-undescribed-slot`. Their additional `packages/elements/custom-elements.json stale` findings are attributable to the new declaration in this phase. The workflow canvas refreshed the same eight overlays. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45737601757) · [Manifest overlay precedent](https://github.com/Ocelle-HQ/ocelle-components/commit/6a6d74c2)

## Test quality

The scaffold `47bc5ceb` added only registration and the inert property/type signature. Tests-only commit `3accd174` fails on 16 named assertions for missing behavior. The final test replay reproduces all 16 on the base and scaffold and passes all seven selected files on the implementation revision `e1b0b539`. The diff from that revision to the hosted candidate adds only the replay logs and JSON receipt. The forced-colours test replaced element casts with guarded computed-style lookups while preserving the same stroke and outline assertions. The post-red manifest inventory changes preserve the exact counts and expected module list.

The browser proofs exercise ordered labels and ordinals, the check and completion text, the current-step attribute and non-colour outline, host updates and empty or no-current data. Chromium retains the labels and completion text in the accessibility tree when they compact. The keyboard proof crosses the indicator in both directions, and the pointer test confirms delivery to the marker before asserting no host action or state change. Both built entry points render under the strict-CSP fixture. The source has no focusable marker, event dispatcher, cross-root ID reference or network operation. The changed-source mutation result is pending.

## Checks run

- Inspected the signed scaffold, red commit, source and test diffs and the committed focused replay. The hosted head is `267b95b40768dcf3cf0b1c197678cfa7a25e5a5d`. The hosted merge is `1f984a86227308ddce66e785743b23c543bc6730`, with parents `25c53a915717fe464a67b53a7dd58ceaf4abc0c7` and that head. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45737601757) · [Tested merge](https://github.com/Ocelle-HQ/ocelle-components/commit/1f984a86227308ddce66e785743b23c543bc6730)
- Read the four failed Plant artifacts and checked the eight valid manifest overlays against the newly generated declaration. Ran a read-only `manifestFindings` comparison for `fail-lost-attribute`, `pass-reordered` and `fail-undescribed-attribute`; it reproduced the additional missing-step-indicator finding in all three.
- Checked the review branch with `git diff --check`. Held the final verdict on hosted and mutation evidence as recorded in R1-02.

## Earlier findings

First review round.
