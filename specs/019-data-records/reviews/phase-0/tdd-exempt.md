# Phase 0 is exempt from the red/green check (T002)

Phase 0 (Setup, T001 and T002) is a recheck of the plan, the tasks and the contracts against `main` as merged into
this branch (merge commit 8ee3351, `reviews/main-merge.md`). It writes `reviews/recheck.md`, renames driver helpers in
`contracts/checks.md` to the merged ones, and writes this file. It changes no source, no test, no style, no story and
no configuration, so it has no behaviour: there is nothing a test could assert that is false before the phase and
true after it, and no test can fail for it. The first test-first phase is phase 1, whose red commit follows its spike
and scaffold.
