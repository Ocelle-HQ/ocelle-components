# Specification: Shorter phase verification and parallel Unit tests CI

## User story 1

A contributor working on one ticket can demonstrate its test-first behavior during review and hand off a merge candidate whose complete regression suite has passed.

### Acceptance scenarios

1. **Given** a test-only red commit with a named assertion for the phase, **when** the red check runs, **then** its report names that failure and the checkout and selected tests used. An unrelated failure, an empty selection, an import or setup error, or an invalid report cannot prove red.
2. **Given** a completed phase with updated tests, **when** a reviewer replays it, **then** the final tests demonstrate the missing behavior on the base or scaffold as appropriate and pass at the phase head. The test set includes the relevant runnable tests when shared test support changes. A scaffold distinguishes a behavior failure from an absent new module on the base.
3. **Given** a stopped replay, **when** the same phase inputs are checked again, **then** reusable completed sub-checks are reported and work resumes. Changing the test inputs, tested tree, expected outcome or relevant runner inputs invalidates the affected evidence.
4. **Given** a merge candidate, **when** Unit tests CI runs, **then** every test file and project configured for the full suite is assigned once, all assignments run against the same tested revision as the plan, and the existing Unit tests check covers every successful result. A planned shard that fails, skips, goes missing, or returns an incomplete or stale result blocks the check.
5. **Given** an original run and a sharded run of the same configured suite, **when** comparing their inventories, **then** their project and file coverage and per-test results agree. Timing-sensitive browser projects retain their serial behavior inside each isolated runner.

## Requirements

- **FR-001.** Preserve the current story entry points, test-only and ancestry checks, optional scaffold handling, and machine-readable verdicts consumed by review and history folding.
- **FR-002.** Keep the normal full-suite command usable and the existing required CI check names. Use a conservative broader selection when a change's test scope cannot be resolved. A broader test run does not allow an unrelated failure to count as evidence.
- **FR-003.** Record test selection, assertion outcome, input identity and resumable result keyed from immutable inputs, with evidence suitable for independent review.
- **FR-004.** Keep the remaining required checks and mutation semantics. The final merge candidate requires full regression evidence even when phase work uses focused verification.

## Success criteria

Record actual focused-phase time and CI wall time, including queueing where measured. Pilot goals are a focused check within 10 minutes and required CI around 60 minutes. Parity and gate correctness determine readiness.
