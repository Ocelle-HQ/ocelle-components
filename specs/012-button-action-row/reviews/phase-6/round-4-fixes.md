# Phase 6, review round 4 (operator round from landing round 2): fixes

All five findings are documentation and comments and change no behaviour, so there is no red commit (constitution
VIII: no behaviour; tasks.md T073 to T077, "a documentation unit with no red commit").

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O4-01 | fixed | none (docs only; no test pins these figures, gates/test/gates-readme.test.ts checked) | gates/README.md (the plant-sharding paragraph); gates/lib/plant-runner.ts (the `shardSize` comment, no code): 194 stories, 77 shards (4 + 48 + 25), CI run 44298568583 on ac2d73a (attempt 1, 148/148 jobs) with its gate-step and job-wall figures, run 44098238937 kept and labelled as before 009's merge. specs/006-storybook-workbench/plan.md (the Complexity Tracking intro and the row "Plant roots hold every repository story") is planner territory: the planner edited it at cb1ae7ba, before this fix, and the README and the comment use its wording and figures, so the three places agree; it is not edited here |
| O4-02 | fixed | none (docs only) | gates/README.md (the same paragraph) and the `shardSize` comment: "approved by the operator at 012 phase 1's review" becomes 8dc8147's wording, put to the operator at 012 phase 1's review and accepted at phase 2 (012 tasks.md T067; 012 reviews/phase-2/notes.md, "Story count", "decided by the operator: proceed") |
| O4-03 | fixed | none (record only) | reviews/phase-6/round-2-fixes.md (the O2-02 row) and reviews/phase-6/notes.md (§ Fix round 2, the T070 bullet): the existing sentences stay; each adds that the routed 006 plan.md edits landed in 904e5cf (the row) and 226e29e (the Complexity Tracking intro), and the split-count approval wording in 8dc8147 |
| O4-04 | fixed | none (comment only; `others: 244` and `4 + 48 + 25` are pinned in gates/test/plant-runner.test.ts) | gates/lib/plant-runner.ts (the `otherShardSize` comment, no code): 244 into 4 shards, 232 into 3 named as before 009's merge |
| O4-05 | fixed | none (record only) | reviews/phase-4/plants.md § "Operator decision on the fix-2 plants record": the operator's verbatim "all 312 plants" stays, followed by a bracketed note that the total was 312 before 009's merge and is 317 after it; the `--affected 55ec410` bullet says 317 plants (`--affected 55ec410 --list` prints "317 of 317 plants selected", rerun for this fix; 244 + 48 + 25), 312 before the merge |

## Figures used (CI run 44298568583 on ac2d73a, attempt 1)

Supplied by the orchestrator; the same as in specs/006-storybook-workbench/plan.md at cb1ae7ba.

- Plant gate step: at most 524 s (shard 39), none at or over 570 s, 24972 s in all, 6.94 runner-hours.
- Job wall time over the 77 shard jobs: peak 692 s (shard 21), 29 shards over 570 s, 34745 s in all, 9.65
  runner-hours.
- round-4.md's "9.71 runner-hours" counts the Plants plan and verdict jobs as well as the 77 shards. The README and
  the comment state the shard figure, 9.65 runner-hours, as the shard jobs' wall time, as the 006 plan does (34745 s,
  9.65 runner-hours); round-4.md is not edited.

Checks: notes.md § Fix round 3.

Phase 6 round 5 R5-01 (landing round 3 R3-01): T073 to T077 ticked in tasks.md, their work being 265e819c; R5-02: red-phase.log line 8 store path redacted to `<pnpm store>`, as ddb134c9 did in the check logs.
