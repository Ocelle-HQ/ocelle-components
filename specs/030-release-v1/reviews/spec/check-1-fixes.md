# Spec check 1 fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md Story 2 Independent Test and Scenario 2: the expected unmet set on today's `main` is the `#498` row (#13), the `#509` row (#7, #9, #5) and the `#524 #526` row (#7), named by first upstream number whatever the owner; this matches FR-010 |
| SPEC-1-02 | fixed | spec.md Story 4 narrative and Scenario 1, SC-001: install `@ocelle/tokens`, `@ocelle/styles` and `@ocelle/elements`, as FR-030 does. No separate minimal-install scenario: Scenario 4 already covers `@ocelle/elements` with its peer |
| SPEC-1-03 | fixed | spec.md new FR-034 (pass case and three planted failures on real registry inputs, inputs picked by the plan, no registry write), FR-033 notes that the local rehearsal does not prove FR-031, Story 4 Independent Test, new SC-008 |
| SPEC-1-04 | answered | Operator (jeroennouwsdev, 2026-11-25) chose (b). spec.md operator decisions list, FR-020 (publish path only from a `v*` tag push, no manual dispatch), new FR-027 (dry-run-only path from pull request or manual dispatch, every pre-publish step, no publish job, no environment binding, no identity-token permission), FR-026 (static check covers FR-027), Story 3 Independent Test and new Scenario 7, fork edge case, Key Entities, new SC-009. No O-step added: the dry run needs no operator-only action |
