# Spec check 3: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-3-01 | fixed | spec.md FR-011 (a mutant survives when no test kills it, including a mutant on a line no test runs; killed only by a failing test, a timeout or a runtime error); FR-025 (second mutation plant: a changed line of sample source that no test runs); US2 Independent Test and scenario 3 (uncovered case); Edge Cases |
| SPEC-3-02 | answered | spec.md new FR-035 (`CODEOWNERS` naming `@MOES-Media` as the only owner of the whole repository); FR-032 (`@MOES-Media`, as in `CODEOWNERS`, is the private contact until private vulnerability reporting is on); SC-006 (script checks `CODEOWNERS` and the handle in `SECURITY.md`); US4 Independent Test and scenarios 1 and 3; Assumptions |
| SPEC-3-03 | answered | spec.md FR-032 (acknowledgement within 3 working days, status update within 10 working days); US4 scenario 3; SC-006 |
| SPEC-3-04 | fixed | spec.md FR-022 (test code of the three packages is in scope; code and tests outside the packages, such as gate scripts and their tests, are not); FR-028 prefix-check row |
| SPEC-3-05 | fixed | spec.md FR-011 ("changed code" is lines added or modified relative to the base; survivors on unchanged lines of a changed file do not fail the run); FR-028 mutation row; Edge Cases |
| SPEC-3-06 | fixed | spec.md FR-007 (the plan defines how the base commit is passed and whether the story review command must change; if so this feature changes it in both copies) |
| SPEC-3-07 | fixed | spec.md FR-025 (plants are not test code unless their name makes them a test file; a gate's red step is a failing test of the gate itself and its plants arrive with the green commit; the plan says where gate tests live). FR-006 and FR-028 unchanged |
| SPEC-3-08 | fixed | spec.md FR-002 (all repository TypeScript checked in strict mode); FR-020 (typecheck in strict mode; code lint rule set beyond the test lint, named by the plan); FR-025 (typecheck and code-lint plants) |
| SPEC-3-09 | fixed | spec.md FR-025 (minimum plants for typecheck, code lint, content-security check with one plant per FR-021 construct, configuration-copies check, sign-off check with both failure cases and two pass plants) |
| SPEC-3-10 | fixed | spec.md FR-004 (a package with no tests does not fail a run with tests elsewhere; a missing browser exits non-zero naming the online install command and skips nothing); US1 scenarios 9 and 10; Edge Cases |
| SPEC-3-11 | fixed | spec.md FR-001 (the root manifest is the workspace root, not one of the three packages) |
| SPEC-3-12 | fixed | spec.md FR-024 (numeric `font-weight`, angles, `aspect-ratio`, grid line numbers and `scale()` factors are raw; a `var()` reference is a token and not itself raw, the custom property's value is checked where declared; a raw fallback inside `var()` is rejected; test code and stories are not covered; system colour keywords allowed, as the operator confirmed) |
| SPEC-3-13 | fixed | spec.md US4 scenario 3 (rewritten as one sentence) |
| SPEC-3-14 | fixed | No change needed; the finding asks for none |

Notes for the plan:

- FR-007 leaves the mechanism for passing the mutation base commit, and any change to the story review command, to
  the plan.
- FR-020 leaves the code lint's rule set to the plan; FR-025 needs a plant for a rule the test lint does not have.
- FR-025 leaves to the plan where gate tests live and how each gate's plants are presented to it.
- FR-035 leaves the `CODEOWNERS` location (any location GitHub reads) to the plan.
