---
phase: 2
round: 2
verdict: changes_requested
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
base: 6788697d7c2bc365b17d5747796f34f5934b964a
head: b1698e225c2cc3d2c5b54f60da20cc5ade8565bf
---

# Phase 2, round 2: operator round at landing (PR #47)

The landing review `reviews/landing/round-1.md` (verdict changes_requested) reported the findings below. They belong to this phase, which owns `packages/elements/src/overlay.ts`. The operator decided on 2026-11-16. The answers are quoted verbatim:

- "L1-01 (blocking) is a real overlay bug, reproduced in Chromium. … Fix them test-first now (an operator round on phase 2, which owns src/overlay.ts, with red rows, the fix, mutation, and a review round)?" = "Fix both now (Recommended)"

Each finding is fixed test-first under the story fix procedure (`red.sh 2 fix-K`), then reviewed in round 3.

## Findings

- **R2-01** (blocking; landing L1-01). Location: `packages/elements/src/overlay.ts:541-548`, with `:483-491`, `:506-511` and `:307-319`.
  - **The bug:** without motion (`prefers-reduced-motion: reduce`, or a zero or missing `--ocelle-motion-base`), the end of a close is scheduled with `this.updateComplete.then(done)`, and nothing can cancel it.
  - **How it shows:** after `el.open = false; await el.updateComplete; el.remove();`, `#finish` runs a second time.
    - It dispatches the close event on the removed element (FR-022, R-05a).
    - Its `stack.splice(-1, 1)` pops the overlay beneath, so a later Escape closes the wrong overlay (FR-023).
    - The same callback also completes a close that a host `open = true` should cancel (R-06).
  - **Required:** red rows under reduced motion first. Then make the no-motion completion cancellable, and make `#leave` do nothing when the overlay is not on the stack. Then re-run the `overlay.ts` mutation shards.
- **R2-02** (landing L1-03). Location: `overlay.ts:386-388` and `:366-370`.
  - **The bug:** if the host sets `open = true` and the element is moved before Lit's update, `open` stays true but the overlay is not shown, and a second `open = true` does nothing.
  - This conflicts with FR-004 and the "Moved while open" edge case.
  - **Required:** a red row first, then the fix.
