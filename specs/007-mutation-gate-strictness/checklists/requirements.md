# Specification Quality Checklist: Mutation gate strictness

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-10
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- The feature is repository tooling (the mutation gate), so its users are reviewers and authors, and it names the
  tool (Stryker), its statuses and the files it concerns: these are the domain's terms, not implementation choices.
  The plan chooses the lever for User Story 2.
- The three policy questions were settled with the operator on 2026-11-10 (spec § Clarifications).
- Spec check 1 (2026-11-10): the zero-mutant unit is the entry as the run holds it (FR-003, Key Entities); the
  sandbox runs are defined as the gate's own measurement run with the committed configuration (FR-009), with a red
  run under the same command (FR-011a); the CI bound is on the `gate:mutation` step of every `source.ts` shard
  (FR-010). The operator chose a measurement commit on the mission's pull request for the CI run (Assumptions) and
  dropped a bound for mixed shards (Dropped). Fix note: `reviews/spec/check-1-fixes.md`.
- Spec check 2 (2026-11-10): under the measurement run (checker on), a former op 004 Timeout mutant may end as Killed
  with a killing test on its record, or as CompileError where the red run already has it so (expected for group A);
  the by-hand check is for Killed mutants only; `Group`, `TokenRecord` and `tokenRecords` are neither loosened nor
  tightened (FR-011, FR-012, US2 AS4, SC-003). An entry whose red run already meets the bounds needs no change, and a
  configuration-only lever uses the Principle VIII exemption (FR-011a). FR-001 names the mutant's start line, FR-005
  names the existing finding readers, FR-008 asks for a real zero-mutant run, FR-013 drops the plant-job time clause,
  and the CI measurement records shard contents and re-measures a mixed shard that misses 480 s. Fix note:
  `reviews/spec/check-2-fixes.md`.
