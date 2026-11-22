# Phase 3, review round 1: operator decisions

The round-1.md verdict is changes_requested (6a6042f; `verdict.sh 3`). Asked on 2026-11-22 as multiple choice.

## R1-01 (blocking): changes made while the chain is detached are lost

The fix is test-first, with no choice offered: a red body first, then `connectedCallback` requests an update, as phase 1's Q-M2 (a).

## R1-02 (blocking): a mutant recorded as equivalent is not

After the R1-01 fix, both equivalence reasons are re-derived and the mutation gate is rerun.

## R1-03 (blocking): the moved-chain observer fix has no red commit

**Decision: Redo it test-first** in this fix round, together with R1-01. The red history is to be real, not reconstructed: the fix is withdrawn, the body is committed red, and then the fix is applied again.

## R1-11 (outside phase 3): the same reattach defect in phase 2's timeline

**Decision: Fix it in this round,** test-first by the same pattern (a red body, then `connectedCallback` requests an update), and re-derive the timeline's matching equivalence record.

## Notes R1-04 to R1-06

**Decision: Fix the notes too.**
- R1-04: correct the comment and mutation.md. Re-observing does not deliver again; the behaviour holds for the reason the review gives.
- R1-05: the step contract names `display: block` on `part="content"`, with its reason.
- R1-06: R-12 makes clear that the 0.5 px tolerance belongs to the tests, not the element.
