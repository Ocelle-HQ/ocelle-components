# Phase 5 T060: operator decision on merging main

decided_by: human:jeroennouwsdev
date: 2026-11-16
question: T060 merges `main` before `base.sh 5`; the operator's earlier decision is that `main` is not merged during
the run and `/ocelle-land` merges it.

Facts at the time: #10's Storybook harness is on the branch (merged at `8c53b7a`), and the T060 recheck against it is
done (`recheck.md`). `main` (`c4c0af4`) has since gained op 015 (mutation CI shard time limit) and op 016 (plants run
only the affected plants locally). Neither changes `storybook/` or `gates/lib/story-page.ts`. The phase 5 base was
recorded at `11cbe7a` before T060 was read.

**Decision: no merge now; record it.** T060's merge is deferred to landing, because #10's harness is already in the
branch and `main`'s later changes do not touch it. Phase 5 runs on the recorded base `11cbe7a`. The landing pass
merges ops 015 and 016 and reruns the gates on the integrated branch.

Options not taken: merging `main` now and redoing `base.sh 5`; stopping for a planner change to T060 first.
