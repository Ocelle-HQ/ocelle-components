# Operator decisions, phase 3 review round 1

Decided by: human:jeroennouwsdev, 2026-11-04.

## R1-01: the Storybook manager under the strict CSP

Decision: **preview only, amend the spec.** The token reference under the strict CSP is the Storybook preview
(`iframe.html`) alone. Amend US1 acceptance scenario 11, SC-008, T036 and contracts/gates.md, plus any other text that
requires the manager to be checked at run time, to the preview-only reading. Stop shipping the manager in the build, or,
if that is not possible, label it in the build and README as outside the CSP guarantee. Then fix phase 3 test-first
against the amended text.

## R1-03: no Stryker mutants inside `source.ts` (`as const`)

Decision: **follow-up op after this run.** Phase 3 is not changed for it. After the mission, open an op to either drop
`as const` from the records or have the mutation gate flag a changed file that yields zero mutants. Correct the phase 2
claim that the source-table test kills the value mutants as part of that op.
