# Phase 6, review round 2 (operator round from the landing review): fixes

All three findings are records and documentation and change no behaviour, so there is no red commit (constitution
VIII: no behaviour; tasks.md fix round 2 of phase 6).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed | none (record only) | specs/012-button-action-row/reviews/phase-6/ci-run.md (new: CI run 44098238937 on 497b05f, per shard gate step and job wall time, totals, attempts, the operator's answer and the pending follow-up); specs/012-button-action-row/tasks.md (T067 ticked on the gate-step figure, citing this decision) |
| O2-02 | fixed | none (docs only; no test pins these figures, gates/test/gates-readme.test.ts checked) | gates/README.md (the plant-sharding paragraph); gates/lib/plant-runner.ts (the `shardSize` comment, no code); specs/006-storybook-workbench/plan.md line 637 is planner territory: the replacement text is handed to the orchestrator to route, not edited here. The routed edits to specs/006-storybook-workbench/plan.md landed in 904e5cf (the row) and 226e29e (the Complexity Tracking intro), and the split-count approval wording in 8dc8147 (added at fix round 3, O4-03) |
| O2-03 | fixed | none (docs only; the pinned rule-(f) wording is kept) | gates/README.md (the `brand-rules` row's rule text gains the `-delay` exception and the literal-`ms` rule); specs/002-design-tokens/contracts/gates.md § Plants (the `brand-rules` Fail cell lists `f-motion-spin-missing`, with phase 4 fix-2's `f-delay-marker-misplaced` and `f-motion-not-ms`, each marked as added by 012) |

Checks: notes.md § Fix round 2.
