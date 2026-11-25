---
op: 025
triage: triage/025-spec-kit-verification.md
issues: []
mode_of_work: task_execution
accountable: "human:MOES-Media"
semver: none
status: started
---

# Op 025: Shorter phase verification and parallel Unit tests CI

## Intent

Give contributors actionable red/green evidence during the phase and run the complete suite in parallel for pull requests. Op 022 needed four full suites for one local replay. The latest full Unit tests job took 68m 56s for 9,801 tests. This op changes how the work is scheduled and recorded.

## Acceptance

1. A real failed assertion in an identified phase test records red. Missing tests, setup failures and an unrelated failed test cannot record red or pass a replay.
2. Replaying a phase runs the final tests against the base and, when present, scaffold, and verifies green on the phase head. A resume skips successfully completed sub-checks with identical inputs and reruns after input changes. The review still checks the test-only history and inspects independently reviewable logs.
3. CI runs the complete Vitest inventory in parallel and the existing required Unit tests check passes only if all planned shards on the same revision are successful and complete. Missing, duplicated, skipped, stale and failed shard results fail the verdict.
4. Compare a full-run inventory and results with the sharded run on the same revision before relying on the aggregate. Record wall time, slowest shard and remaining required-check time. Exercise the workflow on the separate #74 mission.

## Constitution principles touched

Principle VIII still requires test-only red commits, the right assertion failure, final tests against old code, changed-source mutation checks and non-vacuous gates. Independent review and all required pull-request checks continue to apply. The op changes no package public surface and proposes no exception.
