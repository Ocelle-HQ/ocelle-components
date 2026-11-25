# Specification — Shorten the CI and review path

## User story

As a contributor and reviewer, I can get exact evidence for the active change early and see which CI work can finish faster, with the full verification verdict available on the final pull request revision.

## Acceptance scenarios

- Given the standard mutation plan for a pinned element change, when the contributor selects the shadow run, then adjacent planned element entries can share a Stryker invocation within a 60-changed-line budget. The receipt identifies both plans, covers the same changed lines, and reports Stryker startup and mutation execution times. When a standard mutant is missing or its result changes, then comparison is incomplete or shows a difference for review.
- Given a Visual integration scenario with its existing fixture, expected verdict and cleanup, when the Unit planner discovers and renders the split files, then it assigns all 11 scenarios exactly once and the aggregate validates their results. The standalone Visual gate still runs both engines and the full baseline inventory.
- Given a changed allowlisted collateral test with local red and green proof, when a reviewer reads the early receipt, then they can resolve the exact reviewed revision and project/file, verify every expected case passed, and identify the matching Visual or Accessibility gate. Given mismatched or incomplete evidence, the phase cannot claim that deferred proof.
- Given two worktree returns for ready tasks in one phase, when their pin, contents and sign-off are checked, then only complete clean returns with disjoint owned paths are eligible for staging. The integration owner verifies the combined test-only red before applying behavior and verifies green before review.

## Requirements

- **FR-001** — Expose candidate mutation grouping only through an explicit shadow selection. Preserve standard options, limits, cut semantics, verdicts, Plants, and required check contexts. Candidate timing data must identify the revision, selector group, runner, configuration and outcome.
- **FR-002** — For mutation comparison retain every standard mutant's stable identity and verdict. Report candidate-only cut-spanning mutants separately. Treat skipped, malformed, incomplete, or timed-out execution as failed comparison. The 100% threshold and existing equivalent-mutant policy apply.
- **FR-003** — Keep all 11 Visual integration cases, assertions, engine behavior and fixture cleanup. Discover them through the existing Unit planner with distinct file ownership. The complete Unit aggregate and independent full Visual gate retain their current checks.
- **FR-004** — Bind early review evidence to the exact candidate, planned cases and applicable full gate. Extend eligibility only by an explicit, reviewed list of collateral files. Keep named red and green assertions, new behavior and helper tests local. Verify the full final revision before merge.
- **FR-005** — A worktree handoff proof checks the pinned revision, clean state, linear signed-off commit range, and each commit's exact changed paths. Reject unowned paths and overlap across returns. The canonical owner applies the verified commits and handles serial fallback.
- **FR-006** — Compare the trial with the current paths on pinned #94 inputs and #75. Record revision and environment, inventory and fault outcomes, latency, runner minutes and retries. Forward a recommendation for promotion only after review of equivalent or stronger evidence.

## Pilot inputs

Use the recorded #94 base and tested tree for changed-source mutation comparisons. Use the separate #75 discovery work for the Visual split, candidate receipts, and any worktree slices whose file ownership is disjoint. An empty mutation plan in #75 cannot supply positive mutation coverage.
