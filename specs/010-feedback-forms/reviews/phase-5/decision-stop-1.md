# Phase 5 stop 1: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-16
question: stop-1.md (#10's gate integration tests pin today's Storybook counts, 21 stories, 42 story-themes,
42 baselines and axe's `10 notes`, in `gates/test/integration/storybook-build.test.ts`, `visual.test.ts`,
`axe.test.ts` and `plant-repo.test.ts`; phase 5's stories change them, and no task covers it)

**Decision: option (a), the counts in the red commit.** A T061 addendum, as T016c did for the element lists: the
red commit updates the pinned counts in those files to the final story set's figures, and T066's file list is
widened to name them. The axe notes figure is set to what the axe gate reports once the stories run; if it moves,
the red commit is amended before green. `tdd-check.sh` check 2 failing on these counts at the base is expected, and
T066 names it beside the baseline assertions. No other change to #10's tests.

Options not taken: (b) deriving the counts from the repository; (c) a planner change to tasks.md first.
