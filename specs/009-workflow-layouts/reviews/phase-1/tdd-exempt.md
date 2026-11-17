# Phase 1: what is exempt from the red step (T009)

- **T001** (the recheck of #10, `recheck-10.md`, with `operator-decisions.md` and `recheck-fixes.md`) and **T002**
  (sibling 011 on `main`, `sibling-011.md`) are records: they read `main` and write documentation. No behaviour
  changes, so no test could fail for them.
- **T003 to T005** are the phase's red commit (`b47541b`, recorded in `red-commits`, log `red-phase.log`) for **T006 to
  T008**: the six token records and the changelog rows (T006), the drivers' `viewport()` (T007) and
  `test/fixtures/frames.css` with its wiring into both harnesses (T008). Those are not exempt.
- **T004** passes in the red commit: it guards token values that already hold before this feature. Its proof that it
  can fail is `plants.md` (plants 1 and 2).
- T007 and T008 change only test-support files (`packages/elements/test/**`, inside the story configuration's
  `test_pathspec`), so the tdd check's "final tests against the base" run carries them along; their own
  non-vacuity is shown by the red run (both drivers rejected `viewport()`) and by `plants.md` (plants 3 and 4).
