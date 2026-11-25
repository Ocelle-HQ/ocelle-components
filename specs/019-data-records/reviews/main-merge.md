# Operator decision: merge main before implementation

- **Date:** 2026-11-17
- **Decided by:** human:jeroennouwsdev
- **Question:** the branch started from ce1d9c72, which has neither 009's overflow-region module nor 013's code; how
  should the branch get main's code before implementation?
- **Decision:** "Merge main at T001": merge origin/main (b594b7e9, mission 009 landed; with 013, 011, 008 and op 016)
  into claude/013-data-display-2 before any phase base or red commit, then T001 rechecks the plan and tasks against
  the merged code. Later folds start from phase bases after this merge; T001 checks how fold-history.sh treats a phase
  base after the merge (op 021, #51, is not on main yet).
- **Also decided:** resume implementation now (`/ocelle-run resume`).
