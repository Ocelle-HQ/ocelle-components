# Squad round 1: fixes 2

Resolves the `unresolved` rows of `verify-1.md`.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-CORRECTNESS-1-007 | decided: (b) | plan.md § Source Code: the `.specify/memory/constitution.md` line now says MINOR amendment 1.3.1 → 1.4.0 (FR-040, FR-041, R-14), matching the Constitution Check, Phases 5 and Complexity Tracking |
| PLAN-FRESH-1-001 | decided: (a) | plan.md § Source Code: the `ci.yml` line now lists `workflow_call` inputs `base`, `head` and `release`, with the Sign-off job at `if: ${{ !inputs.release }}` (R-10), matching contracts/release-workflow.md § `ci.yml` change |
