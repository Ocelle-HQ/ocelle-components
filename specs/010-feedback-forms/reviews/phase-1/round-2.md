---
phase: 1
round: 2
verdict: approved
base: 2635c1d706a3eb10ad7c3aac782cf7112b6c0956
head: 504f8236bc048994f0617616c320e2785441316e
tdd_check: fail
---

# Phase 1 review, round 2

Scope: `git diff 2635c1d..504f823`. This round looks at what changed since round 1 (`b95f05d`): the fix commit
`b0d0479` (the fixture-page `laterTask()` test, `red-evidence.md`, `round-1-fixes.md` and the `fix-1-*` logs) and the
check commit `504f823` (a `tdd-check.sh 1` run on `b0d0479`). The working tree was clean when the review started.
`tdd-check.json` names `head` `b0d0479`. HEAD `504f823` changes only the four check outputs that run wrote, so the
check covers the code under review and I did not run it again.

`tdd_check` is `fail`, and its only problem is "tests fail at HEAD". The tests that fail at HEAD are the 5
container-engine visual-gate tests (`gates/test/integration/visual.test.ts:115,126,239,251,271`; `check-head.log`:
"5 of 3197 tests failed"). They fail the same way at the base (`check-final-tests-on-base.log`). `docker info` fails
in this session too. Under the operator's standing decision these failures are environment-only, so they do not
block this phase (see R2-02). Apart from them, every check passes and no blocking finding is open, so the verdict is
`approved`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | `packages/elements/test/browser/driver.test.ts:35-61` | `marked()` sees the step's page work only through `page.evaluate` with a function argument. A correct `laterTask` that reached the page another way (a CDP `Runtime.evaluate`, `page.mainFrame().evaluate`, a string argument) would leave no `"end"` mark and fail the test. Today's implementation (`test/browser/driver.ts:264-276`) uses `page.evaluate(async () => …)`, so this costs nothing now. It ties the test to how the step reaches the page, and the contract does not require that. | None for this phase. If the driver's page access changes, move the marking to that path. |
| R2-02 | note | `tdd-check.json`; `check-head.log` | Same as R1-03. The status is `fail` only because of the 5 container-engine visual-gate tests. They fail at the base as well, and this session has no container engine (`docker info` exit 1). They are environment-only under the operator's standing decision. | Rerun them where a container engine is available before landing. |
| R2-03 | note | `contracts/testing.md:19-20`; `research.md:520` | R1-02 still stands: the quiet-window sum in the contract text and R-09's cost figure. It was deferred to the operator or the plan owner as a note, which is correct. | As in R1-02. |

## Test quality

- **The replacement test (R1-01).** The fixture-page `laterTask()` test at `driver.test.ts:81-108` replaces the round-1
  test, and the reason is recorded in a comment (`:81-84`) and in `red-evidence.md` § "Review round 1". It is
  stricter:
  - The old test checked only that `frame` and `message` were in the page's list at a later read.
  - The new one checks the page's own order at the step's last `"end"` mark. The message, the frame posted before the
    step, and a rendering update asked for when the step's page work starts must all come before that mark, and
    nothing may come after it.
  - The setup read and the final read go through the unwrapped `evaluate` that `marked()` returns, so they add no
    marks.
  - The assertion is one unconditional `toEqual`. The `end < 0 ? null : …` branches only build the value it compares,
    so a missing end mark makes the test fail; it does not skip the assertion.
  - The test has no `skip` and no `only`. No other test file changed after the red commit
    (`git diff 306bd2b..HEAD -- '*.test.ts'` touches only this file).
- **It fails against the stubs, whatever the timing.** I made a worktree at the red commit `306bd2b` with the new
  `driver.test.ts` overlaid and ran the whole `elements-browser` project there 3 times, with a fourth
  `elements-browser` run at HEAD going on at the same time for load. Each run had "29 failed | 87 passed". Each time
  this test failed on `expected { before: null, returned: null, …(1) } to deeply equal { before: [ 'frame', …(2) ], …(2) }`,
  an assertion against the no-op stub and not a setup error.
- **It fails against a partial step.** I replaced the stub with a step that does only the `MessageChannel` round trip
  in one `evaluate` and no rendering update. It failed 4 of 4 runs with `before: [ 'message' ]`. So the test needs the
  step's own rendering update, as the contract's `laterTask()` line requires (`contracts/testing.md:75`).
- **The implementer's evidence agrees.** The `fix-1-final-tests-on-stubs-full-{1,2,3}.log` runs show 90 of 3197
  failed, and the `-browser-{1..5}.log` runs show 29 of 116 failed each. This test fails in every one of them.
- **It is not flaky at HEAD.** `elements-browser` at HEAD passed 3 of 3 runs (116 of 116). A correct step is
  deterministic here: the `"step frame"` callback is requested before the step's own `requestAnimationFrame`, so it
  runs in the same rendering update or an earlier one, and in either case before the step resolves.
- **Mutation.** `gate:mutation -- --base 2635c1d…` reports "nothing to mutate: no package or gate source line
  changed", as in round 1. There are no survivors and no equivalent-mutant records.
- Everything else in round 1's test-quality section still holds: no other test changed.

## Checks run

All checks ran on HEAD `504f823` with `OCELLE_CHROMIUM_PATH` set.

| Check | Result |
|---|---|
| `tdd-check.sh 1` (run on `b0d0479`, committed in `504f823`) | `fail`. Red exit 1, now 90 failures, including the old fixture-page `laterTask` test. Base overlay exit 1. HEAD exit 1, only the 5 environment-only tests (R2-02). |
| `gate:typecheck`, `gate:lint` (286 files), `gate:test-lint` (196 files), `gate:style-lint`, `gate:prefix`, `gate:csp` (10 files) | exit 0 each |
| `gate:pins`, `gate:config-copies`, `gate:brand-rules`, `gate:manifest`, `gate:contrast` | exit 0 each |
| `gate:signoff -- --range 2635c1d..HEAD` | exit 0, 11 commits |
| `gate:mutation -- --base 2635c1d…` | nothing to mutate |
| `elements-browser` at HEAD, 3 runs | 116 of 116 pass each |
| `elements-browser` at `306bd2b` with the new test overlaid, 3 runs under load | 29 failed each; the `laterTask` test fails each time |
| the `laterTask` test against a message-only step, 4 runs | fails 4 of 4 |

Not run: `gate:visual`, `gate:axe`, `gate:storybook-build` and `gate:plants`. They need a container engine, which
this session does not have, and this phase changes no element, story or baseline.

Other checks:

- **Tasks.** T001 to T005a are ticked, and their work is present.
- **Scope.** The fix touches only the test file named in R1-01 and evidence under `reviews/phase-1/`.
- **Constitution and plan.** Nothing changed since round 1. The new test still asserts a clean recorder (no CSP
  violation, only allowed requests). `marked()` sends the page its code over the DevTools protocol, so it adds no
  page script.

## Earlier findings

- **R1-01 (blocking): resolved.** The vacuous fixture-page `laterTask()` test has been replaced by a stricter one, with
  the reason recorded. `red-evidence.md` § (1) is updated with the new runs against the stubs. The replacement fails
  the T001d stub every time: in 3 full and 5 project runs under load, and in my 3 runs under load. It also fails a
  partial step. It passes the real step at HEAD. No separate `fix-1` red commit is needed: the fix is to the test
  itself, not to behaviour, and the red evidence for the new test is the stub-overlay runs above.
- R1-02 and R1-03 were notes. They remain notes as R2-03 and R2-02.
