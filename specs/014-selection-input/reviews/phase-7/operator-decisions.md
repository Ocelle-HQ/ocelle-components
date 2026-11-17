# Phase 7 operator decisions

## Decision 1 — T112, the composed ocelle-dialog + ocelle-listbox story (FR-054)

- Date: 2026-11-17
- Operator: human:jeroennouwsdev
- Context: #16 (mission 008, ocelle-dialog) merged into main as 13af7a9, with missions 011 and 013 and two ops. T112's "if #16 has merged" branch needs main merged into claude/014-selection-input, and missions do not merge main mid-run.
- Options: defer the story to the landing; merge main now as an exception; drop the story to a follow-up op.
- Answer: **defer to landing**. Phase 7 runs without the composed story. `reviews/phase-7/notes.md` records that #16 has merged and that the composed story, with its docker baselines, is added during `/ocelle-land` after its merge of main, as a test-first landing fold. The no-mid-run-merge rule stands.
