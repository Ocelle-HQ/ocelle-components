# Operator decision: op 023, Unit test shard 4 at landing (2026-11-25)

Raised at landing of PR #80 by operator round 6 of phase 1 (`reviews/phase-1/round-6.md`, O6-01): since fix round 4
the CI job "Unit test shard (4)" failed with "Unit tests: shard 0 inventory differs from the plan" on 73c8ba1 (run
45625428767) and f829bcc (run 45673036035). It passed on 98f5bbf, ac5bebc, 4e0ba99, ee83aae and d016b93 with the same
tests.

Fix round 6 stopped at T039 without a provable cause: four local runs of shard 4 matched the plan exactly, and the
implementer ruled out the nested Vitest fixture reporting into the outer run, fixtures inside the repository, and
leftover files or processes.

The CI artifacts of run 45673036035 (`unit-test-shard-4`, `unit-test-plan`) then showed the cause of that failure:
the shard planned 68 files and reported 61. The browser project `elements (chromium)` raised "Failed to run the test
packages/elements/test/list-detail.test.ts"; that file stayed `pending` and the seven `elements (chromium)` files
after it (context-sidebar, drawer-repeated-escape, entry-context-sidebar, entry-ocelle-tab-panel, empty-state,
entry-button, card) never ran. Op 023 changes nothing under `packages/` or in the Vitest configuration, and the tested
revision was the merge with an unchanged `main` (183b20f). Round 4 re-balanced the shard plan, which put that browser
project in the same shard as round 4's focused-runner tests (nested Vitest processes); contention between them is
possible but not shown.

Choice: **close O6-01 without a fix, open an issue, and land.** Phase 1 is accepted at round 6 (`accept.sh 1`); tasks
T039 to T042 are closed by this decision, not done. The issue carries the artifact evidence. Landing goes on once the
final head's CI is green.

Not chosen: downloading the 73c8ba1 artifact first; making round 4's focused-runner tests lighter on an unproven load
hypothesis.

Source: the operator (jeroennouwsdev), answered at a gate of the /ocelle-land session for PR #80.
