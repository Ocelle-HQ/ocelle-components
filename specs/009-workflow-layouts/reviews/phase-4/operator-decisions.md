# Operator decisions in phase 4 (2026-11-15, human:jeroennouwsdev)

- **P3** (`reviews/phase-4/round-1.md` R1-03, a host padding-only or border-only change is never seen), "Fix it, red
  first": the fix round makes such a change re-measure the tier, as FR-025 and contracts/elements.md promise, with red
  tests in both harnesses first. The stale research records named in R1-04 (R-13 recorded cost and observer, R-11
  `minmax`) are corrected in the same round. R1-01 and R1-02 are fixed test-first as the review requires.
