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

# Operator decision, phase 3 review round 2

Decided by: human:jeroennouwsdev, 2026-11-04.

## R2-01: commit 569dce4 without a `Signed-off-by` trailer

Decision: **re-sign and force-push.** The orchestrator ran `git rebase --signoff 569dce4^`, which re-signed that commit
(now 2df63ba) and replayed the two round 2 review commits (now 954d70e and 1a50f59) with the same tree. It then
force-pushed the feature branch with lease. `gate:signoff --range e05b8c2..HEAD` afterwards: 13 commits checked, no
finding. No file content changed.

# Operator decision, follow-up op for R1-03

Decided by: human:jeroennouwsdev, 2026-11-04.

## R1-03: how the follow-up op makes `source.ts` mutable

Decision: **drop `as const`** from the token records in `packages/tokens/src/source.ts`, so that Stryker generates the
value mutants the source-table test must kill. `TokenName` must stay a literal union without it. The op also corrects
the phase 2 claim that those mutants were killed.
