# Phase 1 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the fixture-page `laterTask()` test is replaced by a stricter one that marks the page's `evaluate` calls in the page (`marked`) and asserts the page's order at the step's own last end: the message and frame posted before the step and a rendering update asked for when the step's page work starts all come before it, nothing after. A no-op step leaves no end mark, so it fails whatever the timing. | None as a separate red commit: the finding is that a test was vacuous, so the stronger test is in the fix commit (story-fix step 3). Shown failing against the T001d stubs (worktree at `306bd2b`, new test overlaid) in 3 full `pnpm test` runs (90 of 3197 failed each) and 5 `elements-browser` runs beside the third (29 of 116 failed each); and by hand against a stub that returns from one immediate `evaluate` (3 of 3 fail). | `packages/elements/test/browser/driver.test.ts` (`marked`, the `laterTask()` test); `reviews/phase-1/red-evidence.md` § (1) and its new "Review round 1" subsection; `reviews/phase-1/fix-1-final-tests-on-stubs-full-{1,2,3}.log`, `fix-1-final-tests-on-stubs-browser-{1..5}.log` |
| R1-02 | deferred: a note addressed to the operator or the plan owner (the arithmetic of `contracts/testing.md` and `research.md` R-09); the review says nothing in this phase needs to change, and the implementer role does not edit the contract. | none (not behavioural) | — |
| R1-03 | deferred: a note; the 5 visual-gate tests need a container engine and fail at the base too (environment-only under the operator's standing decision). At this commit `pnpm test` again fails only these 5 (3192 of 3197 pass). | none (environment) | — |

Checks run at the fix commit, `OCELLE_CHROMIUM_PATH` set: `gate:typecheck`, `gate:lint`, `gate:test-lint`,
`gate:csp`, `gate:prefix` exit 0; `pnpm test` exit 1 with only the 5 environment-only tests of R1-03 failing.
