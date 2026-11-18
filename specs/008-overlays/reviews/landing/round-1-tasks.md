# Landing review round 1: tasks and artifact changes

The operator decided on 2026-11-16 to fix L1-01 (blocking) and L1-03 (note) of `round-1.md` now, test first, in
Phase 2, which owns `packages/elements/src/overlay.ts`. The decision is recorded in `reviews/phase-2/round-2.md`
("Fix both now (Recommended)"), as R2-01 and R2-02. Each fix is a task in `tasks.md`, Phase 2 § Fixes from the landing
review. Both start with red rows in one red commit, run under `red.sh 2 fix-2` (the label is the review round, as
Phase 1's `fix-1` for its round 1). No source or test code is changed here.

| Finding | Operator round | Task | Spec, research and design changes |
|---|---|---|---|
| L1-01 the no-motion end of a close cannot be cancelled: a removal or reopen while `closing` under reduced motion still dispatches `…-close`, and the second `#leave` pops the overlay beneath | phase 2 round 2, R2-01 | T058 (phase 2, US1). Red rows under reduced motion, each with its motion-on half, for the dialog and the drawer in both harnesses: close then remove; close then reopen; stacked, where the outer stays on the stack and Escape with focus on the body closes only the top one. Fix: a cancellable no-motion end (a token per close, cleared by `#reopen`, `disconnectedCallback` and the platform close), and `#leave` does nothing off the stack. Mutation of `overlay.ts` re-run from `--base 6788697` | spec: FR-022 gains "with and without motion … never another" overlay off the stack; a new Edge Case, "Removed or reopened while closing, with no motion" (FR-014, FR-022, FR-023). research.md: R-05a § Leaving the stack; R-06, a bullet on the cancellable no-motion end. contracts/checks.md § Dialog: the row "Closing under reduced motion, then removed or reopened", and the drawer's inherited list names it |
| L1-03 `open = true`, then a move before the update: `open` stays true and nothing is shown | phase 2 round 2, R2-02 | T059 (phase 2, US1; in T058's red commit). Red row for both elements: `open = true` then `remove()`, re-inserted in a later task, must be shown and `:modal` with initial focus and no event. Variants: `open` set while out of the document; the same-task move as the positive half. Fix: a connection with `open` true and state `closed` makes the show (`requestUpdate()` in `connectedCallback`). `open` is not reset, because the overlay was never shown | spec: FR-004 gains the sentence on a show made once the element is in the document again; a new Edge Case, "Opened, then moved before it is shown", set apart from "Moved while open". research.md: R-05a § A show the update could not make. contracts/checks.md § Dialog: the row "Opened, then moved before it is shown" |

The operator's answer settles the choice that L1-03 left open ("sets `open` to false, or the show runs again on
connection"): the overlay is shown. This keeps FR-004 (`open` is the one source of truth) and keeps the existing
"Moved while open" rule for overlays that were shown.

Not in this round:
- L1-02 (the merge resolution of `gates/test/vitest-config.test.ts`) is settled by the standing decision of 2026-11-16,
  "Take the branch's version" (`reviews/operator-standing-decisions.md`). It is applied by `/ocelle-land` at the merge
  and needs no task.
- L1-04 (the PR text names all six Tokens baselines, captured in docker only) and L1-05 (CI on the merge commit) are
  PR body and CI work with no design change.

T058 and T059 run together, then phase 2 round 3 reviews them, then the landing review runs again (tasks.md,
Dependencies & Execution Order).
