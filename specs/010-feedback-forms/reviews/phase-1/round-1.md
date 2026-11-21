---
phase: 1
round: 1
verdict: changes_requested
base: 2635c1d706a3eb10ad7c3aac782cf7112b6c0956
head: b95f05dd054b8dd00a28800c9206ebb9844d450a
tdd_check: fail
---

# Phase 1 review, round 1

Scope: `git diff 2635c1d..b95f05d` (base record `b555bba`, red `306bd2b`, red run record `1fa6203`, spike note
`4bf0bf5`, green `8217e41`, evidence `e31416e`, check `8bbb990`, evidence part 2 `b95f05d`). No scaffold (none is
expected in phase 1). The working tree was clean when the review started. `tdd-check.json` was older than HEAD, so I ran
`tdd-check.sh 1` again with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. That run
rewrote `tdd-check.json`, `check-red-phase.log`, `check-final-tests-on-base.log` and `check-head.log`, and they are
committed with this review.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/test/browser/driver.test.ts:53-71` | The fixture-page `laterTask()` test can pass when the step does nothing, so it does not always fail without its step (T001b, "each test fails without its step"; Principle VIII, "assertions that can fail"). The test posts the message and requests the frame in one `page.evaluate`, then calls `driver.laterTask()`, then reads `order` in a second `page.evaluate`. It only checks that both callbacks ran before that second read. Two CDP round trips are often enough time for a message and a rendering update to happen anyway, whatever the step did. Evidence: in my `tdd-check.sh` run, check 1 re-ran the red commit `306bd2b`, where `laterTask` is the T001d no-op stub. It reported 89 failures, not the 90 in `red-phase.log`, and the one missing is this test (`check-red-phase.log` has no fixture-page `laterTask` line; the in-process `driver.test.ts:43` one is there). Then I ran the whole `elements-browser` project at `306bd2b` three times in a separate worktree. In run 3 this test passed ("28 failed", not 29). Run alone, it failed 6 out of 6 times. So it passes the no-op stub when the machine is loaded. That also means `red-evidence.md` § (1)'s claim "every test of T001 to T001c fails there; none passes" rests on runs where the timing happened to work out. The in-process twin (`driver.test.ts:43-56`) does not have this problem: it pushes `"insert"` after the step returns and asserts the order. | Rewrite the fixture-page test so that a no-op `laterTask` fails it every time, for example by recording in the page when the step returned, as the in-process test does with `"insert"`, so the test no longer depends on how fast CDP is. This is a test change after the red commit, so it must be a stricter replacement with the reason recorded. Show it failing against the T001d stub several times under a full-suite run, then update `red-evidence.md` § (1) with that evidence. |
| R1-02 | note | `specs/010-feedback-forms/contracts/testing.md:19-20`; `research.md:520` | The spike (`spike.md` § Quiet window) says the contract's quiet-window formula (largest `W` + minimum hold + largest `D`) adds up to 1750 ms at Chromium's figures, but the contract text says "700 + 700 + 350 = 2100 ms". R-09's cost figure of about 2.4 s per cell is based on that wrong sum. The code (`test/live.ts` `quietWindow`) and the tests follow the formula, so the phase's behaviour is consistent with it. | The operator or the plan owner should fix the arithmetic in the contract and in R-09. Nothing in this phase needs to change. |
| R1-03 | note | `tdd-check.json` | The `tdd-check` status is `fail` only because of the problem "tests fail at HEAD", and the only tests failing at HEAD are 5 visual-gate tests in `gates/test/integration/visual.test.ts` (lines 115, 126, 239, 251, 271). They need a container engine. Here `docker info` cannot reach `/var/run/docker.sock`, and the same 5 tests fail in `check-final-tests-on-base.log` (that file is not changed by this phase), in `check-red-phase.log` and at HEAD. Under the operator's standing decision (relayed 2026-11-14), these are environment-only and say nothing about this phase. No phase test fails at HEAD. | None for this phase. Rerun them in an environment with a container engine before landing. |

## Test quality

- **Red evidence.** The red commit `306bd2b` changes only test-pathspec files (T001 to T001d; `red.sh` tests-only).
  In its original run (`red-phase.log`, exit 1) and in the stub-overlay run (`check-final-tests-on-stubs.log`,
  exit 1), all 85 tests of T001 to T001c fail on assertions against the neutral stubs: `toEqual`, `toBe`,
  `toThrow`, and `rejects.toThrow` ("promise resolved "[]" instead of rejecting"). None fails on a syntax, import or
  setup error. One exception is R1-01: under load, the fixture-page `laterTask` test passes against its stub.
- **No weakening.** `git diff 306bd2b..HEAD` touches only `test/browser/driver.ts`, `test/browser/serve.ts`,
  `test/in-process.ts`, `test/live-reading.ts`, `test/live.ts` and `vitest.config.ts`. That is implementation only:
  no `*.test.ts` file, `live-rules.ts` or fixture file changed after the red commit. The AX node lists in
  `test/fixtures/ax/` are unchanged since the red commit, and `spike.md` § Node lists compares them field by field
  with lists re-recorded by the capture (only ids and `url` differ).
- **Assertions.** The tests have no `skip`, no `only`, no assertion-free test and no snapshot-only assertion. The
  places that read `?? Number.NaN` or `=== undefined ? 0 : …` feed an unconditional `expect`, so a missing value
  makes the test fail; none of them hides an assertion. Every test whose expected value is the stubs' neutral value
  also asserts a non-neutral fixture of the same rule: `live-rules.ts` "never changes", "appears holding text",
  "flicker"/"frame" each beside `savedKept()`; `driver.test.ts` `submit` null beside a filled submission; `plants`
  rows `resolves.not.toEqual([])`. This meets T001's C1 condition. Each plant row asserts that the planted body
  rejects with its message and that the unplanted body passes (`plants.test.ts:72-75`, `browser/plants.test.ts:69-74`).
  `plants.md` records that all 5 rows bite.
- **Coverage of the contract.** Every T001a and T001b item has a test in each harness the task names: insert in 4
  ways, `laterTask`, `registerFirstLoad`, `readyState`, `insertInteractive`, `after` and `W`, `hostRole`, the form
  steps, `navigateAwayAndBack`, start/startDocument/stop/atLeast, and the bounds. The fixture-page tests also assert
  a clean recorder: no CSP violation and only allowed requests.
- **Mutation.** `pnpm run gate:mutation -- --base 2635c1d…` reports "nothing to mutate: no package or gate source
  line changed". The phase changes only test-pathspec code and `vitest.config.ts`; the planted readings take the
  place of mutation for the oracle, as R-09 and the plan's Principle VIII row say. No survivors and no
  equivalent-mutant records.
- **Check 2.** `check-final-tests-on-base.log` exits 1, with 13 phase tests failing on
  `commands.liveStart is not a function` and the 5 environment-only tests. This matches T005a (2). As
  `red-evidence.md` says, check 2 is not evidence for T001 to T001c here. One plants row (in-process bounds) also
  fails there, for the same command reason; `red-evidence.md` points out this difference from T005a's wording, and
  it is acceptable.

## Checks run

All checks were run on HEAD `b95f05d` in the main checkout, with `OCELLE_CHROMIUM_PATH` set.

| Check | Result |
|---|---|
| `tdd-check.sh 1` | `fail`: red exit 1 (89 failures, see R1-01), base overlay exit 1 (18), HEAD exit 1 (the 5 environment-only tests of R1-03; 3192 of 3197 pass) |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 286 files |
| `gate:test-lint` | exit 0, 196 files |
| `gate:style-lint` | exit 0 |
| `gate:prefix` | exit 0 |
| `gate:csp` | exit 0, 10 files |
| `gate:pins`, `gate:config-copies`, `gate:brand-rules`, `gate:manifest`, `gate:contrast` | exit 0 each |
| `gate:signoff -- --range 2635c1d..HEAD` | exit 0, 8 commits |
| `gate:mutation -- --base 2635c1d…` | nothing to mutate |
| `elements-browser` project at `306bd2b`, 3 runs; the `laterTask` test alone, 6 runs | 29, 29, 28 failures; alone, 6 of 6 fail (R1-01) |

Not run: `gate:visual`, `gate:axe`, `gate:storybook-build` and `gate:plants`. They need a container engine, which
this session does not have, and this phase changes no element, story or baseline.

Other checks:

- **Tasks.** T001 to T005a are all ticked, and their work is in the diff. Nothing outside the phase was changed.
- **Constitution.** No element is added, so I, II, III and VII do not apply. IV: the fixture pages assert zero CSP
  violations, and the recorder is injected over CDP and is not shipped.
- **Plan.** The plan is followed: the commands are registered in the root `vitest.config.ts` beside `axTree`, the
  capture is shared through `test/live.ts`, and the in-process `D` comes from the one constant in
  `test/in-process.ts`.
- **Spike.** `spike.md` records every T002 item, and no stop condition was reached. The 30-line shard took 105.9 s,
  under the 420 s limit, and the largest overshoot of `drive.after` was 4.3 ms, under `2W/3` = 66.7 ms.

## Earlier findings

None (first round).
