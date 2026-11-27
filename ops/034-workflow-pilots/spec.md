# Feature Specification: Verification improvements and workflow pilots

**Input**: [Approved triage](../../triage/034-workflow-pilots.md) · [Epic #92](https://github.com/Ocelle-HQ/ocelle-components/issues/92)

## User Story 1 — Improve verification using matched evidence

A maintainer can compare verification approaches on a pinned candidate, see which proof is available, and identify missing work while a component is still being planned.

1. **Given** a historical shard with default and element entries, **when** its exact inputs run together and in separate unchanged configuration subsets, **then** the report compares the same coverage, mutant outcomes and timings and flags invalid or inconclusive comparisons.
2. **Given** a prior exact successful run and an update confined to audited review evidence, **when** the separate eligibility check observes the current candidate, **then** it records the matched inputs, immutable run references, and fresh safeguards. It rejects provenance, input or runtime uncertainty and the full required CI still executes.
3. **Given** a public manifest change or a shared Storybook host task, **when** the preflight reviews the plan and candidate, **then** it gives actionable owned paths, confirms actual fixture and project results, and identifies missing mutation evidence relevant to the change.
4. **Given** a live pilot has finished, **when** the maintainer compares it with the required verification, **then** the checkpoint records results, time, compute and rework and informs an adjustment before the next ready ticket.

## Requirements

- **FR-001**: Benchmark on the exact folded historical input with each unchanged standard selector assigned exactly once in both arms. Compare complete receipt provenance, ranges, mutant identities and statuses, and preserve standard pass/fail behavior, threshold and equivalent-mutant rules. Keep grouping and configuration isolation distinguishable.
- **FR-002**: Report eligibility separately on the exact current candidate. Permit only one audited gate initially and a narrow review-evidence allowlist. Validate same-repository and same-PR trusted workflow provenance, successful complete jobs, exact head/base/tested merge, gate inputs and runtime identities, plus fresh current Sign-off and Sandbox paths. Treat unreadable data, ambiguous results, drift or an unknown input as ineligible.
- **FR-003**: Reuse the existing manifest overlay and Vitest verification inputs. Report paths and exact raw findings for the eight manifest overlays and check actual discovery in the default mutation configuration for the declared host tests. Require an actual scoped mutation result to establish host coverage.
- **FR-004**: Keep required checks running on both exact heads. Validate the op with known regressions, then run #89 and #86 in separate missions after readiness checks. Record a measured retrospective and verify any change between tickets.
