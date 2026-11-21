# Phase 3: operator decisions on the shard planner change and merging main

decided_by: human:jeroennouwsdev
date: 2026-11-15
source: relayed by the orchestrator session (session_01NUfZSc26YwQLeow31d6R6X) and confirmed by the operator in this
session as multiple choice.

1. **No merge of main during the run.** The earlier request to merge main after op 015 (ce1d9c7) is withdrawn.
   /ocelle-land merges main when 010 lands.
2. **The element-shard planner change is split into its own issue and op.** It does not land as part of mission 010.
   That change is T041a and T041b: `gates/lib/mutation/shards.ts`, `gates/bin/mutation.ts`, the
   `@stryker-mutator/instrumenter` dependency, `gates/README.md` wording, and `gates/test/mutation-shards.test.ts` with
   `gates/test/mutation-fakes.ts`. This supersedes decision-design-change-1.md and decision-stop-2.md as far as they
   put that change into 010. How 010 continues (option "revert, record gap"):
   - The T041b implementer run is stopped.
   - The gate change comes off 010's branch as a revert commit. History is kept, so the new op can start from it.
   - T041a and T041b are marked as moved to the op.
   - Phase 3's element mutation shards over 7:00 (stop-1.md, stop-2.md) are recorded as a known gap. With op 015, CI's
     45-minute limit for element shards covers them.
   - T041 is finished without the 7:00 shard rule. The whole-diff `gate:mutation` must still exit 0.
