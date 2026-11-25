# Operator decision: op 023 phase 1, review round 1 (2026-11-21)

About `ops/023-public-repo-hygiene/reviews/phase-1/round-1.md` (verdict `changes_requested`):

- **R1-01 / R1-02 (T024):** CI's Plants check covers the one plant that failed locally on a network image pull
  (`visual/fail-pointer-target-below-fold`, exit 2; 323 of 324 as expected). No local rerun. The fix round ticks
  T024 with a reference to this decision, and `plants.md` keeps its recorded `exit: 1` with this note.
- **R1-03 and R1-04 (notes):** fix both in the fix round, test-first, with their red tests in the `fix-1` red
  commit.

Source: the operator (jeroennouwsdev), answered at a gate of the /ocelle-run session for #60.
