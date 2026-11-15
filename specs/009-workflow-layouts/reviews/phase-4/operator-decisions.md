# Operator decisions in phase 4 (2026-11-15, human:jeroennouwsdev)

- **P3** (`reviews/phase-4/round-1.md` R1-03, a host padding-only or border-only change is never seen), "Fix it, red
  first": the fix round makes such a change re-measure the tier, as FR-025 and contracts/elements.md promise, with red
  tests in both harnesses first. The stale research records named in R1-04 (R-13 recorded cost and observer, R-11
  `minmax`) are corrected in the same round. R1-01 and R1-02 are fixed test-first as the review requires.
- **F1** (standing, from phase 4 on): "the folds are approved from here on". The operator said this in this session,
  confirming the standing decision the wave-1 orchestrator relayed (session_01NUfZSc26YwQLeow31d6R6X, 2026-11-15).
  After a phase's review is approved, the orchestrator may do three things without asking:
  - fold the phase with `fold-history.sh`;
  - push the pre-fold head as `archive/claude/015-workflow-layouts-prefold-phase-N`;
  - force-push the fold with lease to `claude/015-workflow-layouts`.

  It covers nothing else. Every other gate and question still goes to the operator as multiple choice.
