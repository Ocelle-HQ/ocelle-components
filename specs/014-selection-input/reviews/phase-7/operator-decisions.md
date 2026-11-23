# Phase 7 operator decisions

## Decision 1 — T112, the composed ocelle-dialog + ocelle-listbox story (FR-054)

- Date: 2026-11-17
- Operator: human:jeroennouwsdev
- Context: #16 (mission 008, ocelle-dialog) merged into main as 13af7a9, with missions 011 and 013 and two ops. T112's "if #16 has merged" branch needs main merged into claude/014-selection-input, and missions do not merge main mid-run.
- Options: defer the story to the landing; merge main now as an exception; drop the story to a follow-up op.
- Answer: **defer to landing**. Phase 7 runs without the composed story. `reviews/phase-7/notes.md` records that #16 has merged and that the composed story, with its docker baselines, is added during `/ocelle-land` after its merge of main, as a test-first landing fold. The no-mid-run-merge rule stands.

## Decision 2 — T114, first-open focus in the composed dialog and listbox story

- Date: 2026-11-18
- Operator: human:jeroennouwsdev
- Context: T114's red commit ea7eca6 (red.sh 7 fix-2) is proven. While building the story, the implementer found that a dialog already open at load picks its initial focus (`#focusInitial` in packages/elements/src/overlay.ts) before ocelle-listbox has written its roving tabindex. It therefore falls back to the close control, not to the selected option `gamma`. Tab order is correct, a close and reopen focuses `gamma`, and every other assertion, axe included, passes.
- Options: fix in ocelle-listbox (014); fix in ocelle-dialog (008, main); accept close-control focus and amend FR-054; drop the story to a follow-up op.
- Answer: **"Fix in listbox (Recommended)"**. A test-first fix in 014's own ocelle-listbox writes the roving tabindex as soon as it connects, not in its first deferred render, so the dialog's first open finds `gamma`. Main's dialog code stays untouched. A listbox unit test that fails first is added inside this same operator round (fix-2).

## Decision 3 — R3-01, the plant run's base for fix-2

- Date: 2026-11-19
- Operator: human:jeroennouwsdev
- Context: phase 7 review round 3 (`reviews/phase-7/round-3.md`) found R3-01 blocking. fix-2's plant run was recorded with `--affected ea7eca6^` (21 plants, exit 0), as T114 step 5 said. The review procedure requires the phase base `base.sha` (5164806), which selects all 314 plants because the landing merge ac2f991 lies in the phase range. A full run takes about 4–5 h here. Main must still be merged once more after #49 lands (landing decision 4), and that head needs a full run anyway. The detached full run on a121cad (before T114) reached 280 of 314 plants, then a session worker restart ended it with no recorded exit.
- Options: accept the round-scoped run now and do the full run once after the second merge of main; a full run on the current head now; reuse the a121cad run.
- Answer: **"Full run after merge (Recommended)"**. The round-scoped run (`--affected ea7eca6^`, 21 plants, exit 0) is accepted for fix-2, and R3-01 is closed by this decision. The full plants run against the phase base is done once, on the head after the second merge of main, before hand-off, and recorded in `reviews/phase-7/plants.md` and the landing records. The a121cad run, cut short by the restart, is not used as evidence.
