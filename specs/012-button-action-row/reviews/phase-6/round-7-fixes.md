# Phase 6, review round 7 (operator round on the visual integration test's time limit): fixes

One blocking finding. The operator asked for test-first, so it has a red commit: eb342bda
(`test(012-button-action-row): phase 6 fix-4 red — O7-01`), recorded by `red.sh 6 fix-4` (red-commits, red-fix-4.log).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O7-01 | fixed | gates/test/visual-timeout.test.ts (new, `gates` project): one `const timeout` in gates/test/integration/visual.test.ts, at least 1_200_000 and at most 1_800_000, and the comment directly above it naming CI run 44481594952, `600 s`, `194 stories`, `388 story-themes`, `519 s`, `171 stories` and `R1-06`. Red at eb342bda: two assertion failures (600000 below 1200000; the comment without `44481594952`), the single-declaration test passing at once (its mutant in plants.md proves it) | gates/test/integration/visual.test.ts: `const timeout = 1_200_000;` (operator 2026-11-19, "1200 s, visual only"), with the reason and the figures in the comment above it (519 s at 171 stories, R1-06; the time-out at 600 s at 194 stories on run 44481594952, passed on 44298568583; twice the limit that failed; the growth with the plant-design follow-up, 012 plan decision 15, R1-06, R1-09). reviews/phase-6/ci-run.md: dated addendum after the follow-up paragraph (T081). gates/test/integration/axe.test.ts and plants-robustness.test.ts keep 600 s (the operator's answer covers the visual test only). specs/006-storybook-workbench/plan.md: changed by the planner at 7802c723, not here; it gives the same figures. The other places that cite the limit are records or verbatim answers and are kept (tasks.md, § Fix round 4) |

Mutants, checks and the local timing: plants.md § Fix round 4, notes.md § Fix round 4. The CI record on the pushed
head (T083) is open: it needs the orchestrator's push and figures.
