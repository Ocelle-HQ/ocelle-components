---
phase: 3
round: 2
verdict: changes_requested
base: 4100cdcf42433c4ed73aa2b5f155f120d326bf96
head: 3296180
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 3, round 2: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #25 (reviews/landing/round-1.md)
raised L1-01 (blocking) and L1-04 (note), both about what phase 3 built (lever 1 in vitest.mutation.config.ts; the
lever 3 records). On 2026-11-11 the operator chose how to handle them. Recorded as an operator round so that the fix
procedure (label fix-2) and a round 3 review apply. The operator's answers are quoted verbatim. -->

Operator's answer to "How should it be fixed?" (L1-01): **"Only source-table first (Recommended)"** ("Narrow lever 1:
tokens-source-table (one fast file) stays at groupOrder 1, and every other project, the rest of tokens included, goes
back to one group at 2 in default order. Test-first: red on a gate-source static mutant, re-measure the source.ts
entries and the gate entries. Recorded as an operator round on phase 3.").

Operator's answer to "Which should be folded too?" (the landing notes): **"L1-03 to L1-05 (Recommended)"** ("Fold the
cheap ones: the trailing space (test-first) and the two dated record notes. L1-06 and L1-07 are recorded as
accepted."). L1-04 belongs to this phase; L1-03 and L1-05 are phase 2's (its round 2).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | vitest.mutation.config.ts | Landing review L1-01: lever 1 runs the whole `tokens` project (`build.test.ts`'s child processes included) before every other project, so static mutants of gate source wait behind it: report.ts:106 and plant-judge.ts:51 kills became Timeouts (8 in the whole-diff run at HEAD, 0 with main's mutation config). Spec FR-013 forbids kills turning into Timeouts. | Red test first: the order test of `gates/test/integration/vitest-mutation-config.test.ts` asserts the narrowed order (`source-table.test.ts` first; the rest of `tokens` and every other project in one group after it, in Vitest's default order), red against the current split. Then `tokens-source-table` stays at `groupOrder` 1 and every other project (the rest of `tokens` included) is at 2. Evidence: an FR-013 before/after per-mutant comparison on gate-source static mutants (`gates/lib/mutation/report.ts` and `gates/lib/plant-judge.ts` against base 3a247ef, as L1-01 reproduced): no Killed → Timeout against main's mutation config; and the eight 30-line `source.ts` measurement runs again (FR-009, FR-010 sandbox half, FR-011), with the reference entries. Update research R-05, the config comment, and `evidence/README.md`. |
| O2-02 | note | specs/001-repository-foundation/research.md R-08 (:372-383, :430), specs/001-repository-foundation/plan.md (:50-51, :209-210) | Landing review L1-04: both still state 60-line entries with no dated note. | One dated 2026-11-11 sentence in each, pointing to the FR-013 amendment of 001 spec.md (30-line entries, operator decision of mission 007). |

L1-06 (more cuts) and L1-07 (sandbox paths in evidence files) are accepted by the operator and need no change.

## Verdict

changes_requested (operator round).
