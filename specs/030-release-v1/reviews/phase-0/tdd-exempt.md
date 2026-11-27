# Phase 0 is exempt from the red/green check

Phase 0 of 030 merges `origin/main` (`d45efd57402395999fcd7ab8fc29fba2c14a4e88`, with mission 018 and op 023) into
`claude/011-release-v1` (T001) and rechecks the design documents against the merged tree (T002,
`specs/030-release-v1/reviews/recheck.md`). It adds no behaviour: it changes no package source, gate source, workflow
or test, only the merge of `main` and two records under `specs/030-release-v1/reviews/`. No test can be written that
fails before this phase and passes after it, so there is no red commit; the merged tree's own checks (typecheck, lint,
sandbox paths) were run after the merge and are recorded in `reviews/recheck.md`.
