# Spec check 2: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-2-01 | fixed | spec.md FR-009 (passing samples may be ordinary package tests; every sample a gate must fail on is a plant under `gates/plants/`, run only by the plant job); FR-028 (built output and plants excluded from normal gates, "no normal gate ever sees" a failing sample); FR-025 (unit-test plants: a failing test per package setup and one needing a browser); US1 Independent Test (plant job runs the test command against those plants); US2 Independent Test |
| SPEC-2-02 | answered | spec.md FR-024 (allow-list: `0` and percentages, CSS keywords, unitless numbers in `line-height`, `flex`, `z-index`, `opacity`, `order`, `fr` units, `calc()` over tokens; everything else, including every length with a unit, rejected) |
| SPEC-2-03 | answered | spec.md FR-005 (Chromium only); FR-008 (the engine of FR-005); US1 scenario 6 |
| SPEC-2-04 | answered | spec.md FR-032 (maintainers' GitHub handles, as in `CODEOWNERS`, until private vulnerability reporting is on); FR-034 (public GitHub handles are not personal data); US4 scenario 3; SC-006; Assumptions |
| SPEC-2-05 | answered | spec.md FR-023 (sign-off identity matches the author; agent sign-off by the authoring agent valid; merge commits and root commit `d08d413` exempt); US3 scenario 6; Edge Cases; FR-028 sign-off row |
| SPEC-2-06 | fixed | spec.md SC-004 (seven patterns, enumerated); FR-025 (one test-lint plant per pattern, and a mutation plant) |
| SPEC-2-07 | fixed | spec.md FR-006 (the two paths named; `.backup` copy out of the check); FR-028 row; Key Entities; Edge Cases; US1 scenario 7 |
| SPEC-2-08 | fixed | spec.md FR-028 (new "test code" = test files, files under a `test` directory, `*.stories.ts`; excluded from package source; test lint covers test code); FR-006 (test file patterns match FR-028's test code exactly) |
| SPEC-2-09 | fixed | spec.md FR-020 (plant job is its own named check on every pull request) |
| SPEC-2-10 | fixed | spec.md FR-025 (the plan defines how each gate's plant is presented to it) |
| SPEC-2-11 | fixed | spec.md FR-007 (outside a pull request the mutation command compares against a base commit passed in by its caller, for a phase its base commit); FR-011 |
| SPEC-2-12 | fixed | spec.md FR-013 (pull requests over the SC-005 bound are split; the limit is not raised) |
| SPEC-2-13 | fixed | spec.md FR-001 (no other workspace package; root configuration and gate scripts live outside the packages); FR-028 ("repository TypeScript" for typecheck and code lint) |
| SPEC-2-14 | fixed | spec.md FR-022 (font declaration defined; tests build forbidden names at run time, literals only in plants) |
| SPEC-2-15 | fixed | spec.md SC-001 (measured by timing a cold-cache CI run at verification; not a merge gate) |

Notes for the next check:

- FR-032 refers to the repository's `CODEOWNERS` (as the operator's answer does), but no `CODEOWNERS` file is tracked
  yet and no requirement of this feature adds one. The plan or the operator should confirm where it comes from.
- Under FR-024, system colour keywords (such as `Canvas`, `ButtonText`, used in forced-colours styles) count as CSS
  keywords and are allowed; named colours are rejected.
