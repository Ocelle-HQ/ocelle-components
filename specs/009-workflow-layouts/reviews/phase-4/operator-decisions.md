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
- **P4** (`reviews/phase-4/round-2.md` R2-01 and R2-02), "Fix R2-02, document R2-01":
  - **R2-02:** the fix round takes the edge box out of the element's intrinsic sizes, red first in both harnesses.
    min-content is then the narrowest tier's and max-content the widest tier's again (contracts/elements.md:124).
  - **R2-01:** its two cases are recorded as known limitations in FR-025, the contract's container-tier convention
    and the README:
    - a percentage inline padding that changes with the host's container;
    - a host whose content box is narrower than its own inline padding and borders.
  - **The host's remedy:** `remeasure()` is made to re-choose the tier from a fresh measurement, red first. A host
    calls it after such a change.
