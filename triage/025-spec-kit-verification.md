---
triage: 025
issues: []
decision: op
target: "ops/025-spec-kit-verification"
in_scope: []
out_of_scope: [42, 61, 68, 74]
semver: none
spec_prompt: "Op requested by the operator (triage/025-spec-kit-verification.md): reduce repeated phase verification with focused, assertion-classified, resumable red, base, scaffold and head checks, and parallelize the complete Vitest suite behind the existing Unit tests check. Prove equivalent test inventory and fail closed on incomplete evidence. Preserve independent review and all merge gates."
status: proposed
---

# Triage 025: Spec Kit verification and Unit tests CI

## Issues read

The operator asked to apply the proposed Spec Kit and CI improvements and use the workflow on #74. The workflow scope comes from that request and the documented follow-up to #64.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #64, `ops/022-focus-trap-details-icon-name/operator-decisions.md` and `knowledge/speckit-flows/log.md` | Prior fix and evidence | In scope for diagnosis | A one-phase check replayed four full suites and failed to finish through container restarts. The retrospective records resumable sub-checks or reuse of CI results as follow-up work. |
| #45 | Merged op | Precedent | Affected Plants provide local feedback while CI still verifies every plant. |
| #42 | Closed issue | Out of scope | This proposed op leaves mutation shard planning and mutation requirements as they are. |
| #61 | Open issue | Out of scope | Timing-sensitive browser tests can fail under load. It is evidence for isolating CI jobs and keeping their serial settings. |
| #68 | Open issue | Out of scope | The sign-off, podman and plant-hook issues have different acceptance criteria. |
| #74 | Open issue | Pilot consumer | The textarea and its public contract are a separate mission. |

## Decision

**Op, no package semver change.** The operator requested a bounded change to phase verification and scheduling of the complete existing unit test gate. The same review authorities, required check names and behavior of the package form the acceptance boundary.

## Scope

- Select changed tests and relevant consumers of changed shared test support in each phase proof. Preserve isolated worktrees, tests-only and ancestry checks, the required red, base and scaffold evidence, and a passing check at the phase head. Credit failures only when the expected behavior assertion failed. Treat missing, uncollected, or unrelated tests and setup or runner errors as incomplete evidence.
- Resume completed sub-checks only with identical fixtures, code, selection, tool and environment identities. Keep enough opened evidence for an independent reviewer to audit the result.
- Time the full suite by project or file, run balanced jobs on isolated runners, preserve the serial setting for timing-sensitive browser files within a job, and validate visit counts and inventory against the original full run. Keep the existing Unit tests verdict and require every planned shard to succeed on the tested revision. Start full CI on the first reviewable green push and require the final merge candidate to pass all existing checks.
- Exercise the updated path against #74 after the workflow is available. Component implementation, mutation tuning, and browser flake fixes belong to their own scopes.

## Risks and open questions

Incomplete discovery, a stale cache key, or a successful aggregate with a missing shard could weaken the gate. The plan needs failure-path tests for those cases and a conservative fallback when focused selection is uncertain. CI wall time can still be limited by mutation shards. SHA and tree identities used for evidence must stay valid when the existing workflow folds history.

## What would change this decision

Changing the quality criteria, skipping full-suite coverage, or weakening independent review would require a separate operator decision and a new scope.
