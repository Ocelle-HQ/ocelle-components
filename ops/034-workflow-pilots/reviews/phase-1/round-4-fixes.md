# Phase 1 fixes, round 4

| ID | Resolution | Red test | Where |
|---|---|---|---|
| R4-01 | Fixed | The real observer CLI checks an advancing association, contradictory or missing immutable head, ambiguous checkout and a local merge with reversed API parents. [Signed red log](red-fix-4.log) | [Observer collector](../../../../tooling/speckit/bin/evidence-reuse-observe.ts) · [Integration tests](../../../../gates/test/integration/evidence-reuse-observe.test.ts) |

The collector uses the unique PR association and its repository IDs for membership and requires matching immutable `head_sha` and `head_commit.id` on each exact CI attempt. It binds the Visual job to that attempt and head, verifies a single logged PR merge checkout, compares the hosted tree and ordered parents to the raw local Git object, and requires the merge's first parent to equal the current base. It continues through the existing current-candidate, audited-input, runtime and fresh-safeguard checks.

The canonical `fix-4` replay recorded five assertion failures at signed tests-only commit `268aa5eb8b4d2fc1edc0097610ad219f31650073`. The focused green passed 14 CLI integration cases and all 138 existing eligibility cases under Node 26.13.0. The advancing-link fixture reaches the runtime safeguard and rejects its deliberately missing `pin-record` upload. T016 remains open for the completed live #104 pair and exact required checks.

The full local `tdd-check.sh 1` replay passed on signed implementation head `248d358e15fab3966e733eaa34fb3dd672a55c27`. It retained 98 original assertions and all 12 round 1 assertions alongside the five round 4 assertions. The final tests failed on the phase base and both review bases, and passed on the implementation head. [Current replay](tdd-check.json) · [Earlier signed replay](https://github.com/Ocelle-HQ/ocelle-components/blob/509915d1a7ce2413539587330cce9f7b6d776984/ops/034-workflow-pilots/reviews/phase-1/tdd-check.json)
