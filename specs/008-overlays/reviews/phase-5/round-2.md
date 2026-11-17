---
phase: 5
round: 2
verdict: changes_requested
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
base: 9a44e8e8589e6719232a725c6b5f4042a08ee126
head: ea79307365270a2f0f1746653fc183395127d472
---

# Phase 5, round 2: operator round at landing (PR #47)

Phase 5 owns the row below: its round-1 fix R1-03 gave the row a bound of 100 to `beforeDelay`. During landing, `tdd-check.sh 2` (after phase 2 round 2) failed only on this row: "the leave came at or after 100 ms from the entry in each of 3 runs". It is the second failure of this row in three full `pnpm test` runs on this machine. `ocelle-tooltip.ts` and the tooltip tests did not change in that round. The operator decided on 2026-11-16, answer quoted verbatim:

- "… The other R-12 rows were stabilised earlier by giving each one a 1000 ms tooltip delay, which this row never got. What should I do?" = "Give it the 1000 ms delay (Recommended)"

## Findings

- **R2-01** (blocking). Location: `packages/elements/test/scenarios/tooltip.ts`, the row "Escape, then a brief hover (FR-033, R-12)" (about :845 to :860).
  - **The problem:** under load the pointer's leave does not come within 100 ms of the entry, so the row gets no judgeable run and fails. The row's timing assumes the default tooltip delay.
  - **Required:** the same remedy as the R-12 leave and re-entry rows (phase 5 `notes.md`, a36d8a1): the row's page sets `#tip { --ocelle-tooltip-delay: 1000ms; }`, and the bounds and waits scale with it. "No bubble at any frame" must still be judged only on runs whose leave came before the delay, and must still fail without the Escape dismissal; show that with a hand-applied break, because a test-only stabilisation has no red commit.
