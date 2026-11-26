---
phase: 1
round: 1
verdict: approved
base: 702d08fcdbd0c1b6592a180cdd89e35e6df4e6a4
head: 21dc7ad4d50127dc77924759f2c6e81ffdd73df7
tdd_check: fail
---

# Phase 1 review, round 1

Change under review: `git diff 702d08f..21dc7ad` (red `3cf8b51`, green `1c71ccc`, then evidence and documentation
commits `f9a927a`, `0668ca1`, `21dc7ad`). No uncommitted change apart from the re-run `tdd-check` outputs committed
with this review.

**On `tdd_check: fail` with `verdict: approved`.** `tdd-check.json`, which I re-ran at HEAD `21dc7ad`, reports `fail`
with one problem, "tests fail at HEAD". The failing tests are exactly 5, all in
`gates/test/integration/visual.test.ts` (lines 115, 126, 239, 251, 271). Each one needs the pinned container under docker
or podman, and there is no docker daemon in this sandbox (`docker info`: no `/var/run/docker.sock`). The same 5 fail
at the base too (`check-final-tests-on-base.log`), and `recheck-10.md` item 10 found them failing at `3828d2f` as well.
The phase did not change that file. Under the operator decision of 2026-11-14 (`reviews/phase-1/operator-decisions.md`;
spec amended in `21dc7ad`, `reviews/phase-1/spec-amendment.md`), container-engine tests that also fail at the phase base
are environment-only, "not a red/green or review finding". The other three conditions of the check hold: the red
commit changes only test paths and fails, the final tests fail against the base, and every other test passes at HEAD
(3151 of 3156). The frontmatter keeps the script's literal status. The verdict rests on the operator decision.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `packages/elements/test/commands.ts:268`, `:270`, `:317`, `:319` | `recordAxUpdates` depends on wall-clock waits: a 500 ms warm-up after `Accessibility.enable`, measured against Chromium's roughly 270 ms merge window, and a 300 ms settle before `stop`. The margin is documented and the tests pass. On a slower CI runner, though, the two-update scenario (`scenarios/driver-recorders.ts`, "emptied in one frame and filled in the next") could merge into a single update and fail spuriously. | None now. If it flakes in CI, raise the warm-up or wait on an observed first `nodesUpdated` event instead of a fixed delay. |
| R1-02 | note | `packages/elements/test/browser/driver.test.ts:37` | "runs the fixture bodies of both scenario lists" (`toBeGreaterThan(15)`) also passed at red. It guards against the `fixture` filter dropping bodies and is not a behaviour test. It can fail, so it is acceptable. | None. |
| R1-03 | note | `gates/bin/mutation.ts` run | `gate:mutation -- --base 702d08f` reports "nothing to mutate: no package or gate source line changed". All of this phase's code is test infrastructure (`packages/elements/test/**`, `vitest*.config.ts`). The substitute evidence that the tests bite is T008a's plant record (`plants.md`): 24 named plants, each caught. I read every scenario body against its named plant and agree that each one would be caught. I did not re-run the plants myself. | None. |

No blocking finding.

## Test quality

- **Red proof.** As T008a requires, the red proof for T002 and T003 is `red.sh 1` (T005a), not `tdd-check.sh`'s run
  against the base. The driver lives under `packages/elements/test/`, which `test_pathspec` counts as a test path, so
  the base run overlays the finished driver. At the base the phase therefore fails only through T004 (`axStates` is not
  a registered command: 5 tests) and T005 (Vitest configuration: 3 tests), plus the 2 in-process `axUpdates` bodies,
  whose `axUpdatesStart` command is registered in `vitest.config.ts`. This is the expected shape.
- **Red commit `3cf8b51`.** It changes only test paths (`tdd-check`: no non-test change). Its red run
  (`red-phase.log`, matching my re-run `check-red-phase.log` apart from timing lines) has 50 failures: 45 belong to this
  phase and 5 are the environment-only container tests. Of the 45:
  - 40 fail on "not implemented" stubs or on `commands.axStates` not being a function, i.e. on the missing behaviour;
  - 3 fail on the Vitest configuration assertions (`vitest-config.test.ts:50`, `:131`, `vitest-mutation-config.test.ts:85`);
  - 2 fail on Chromium's `NotAllowedError` from the real `navigator.clipboard.read()` ("write, read and readText",
    in process and on the fixture). With no observer installed, the call reached the real clipboard. That is the
    missing behaviour, not a setup error.
- **No weakening.** `git diff 3cf8b51..HEAD` on the test files and on `scenarios/driver-commands.ts`,
  `scenarios/driver-recorders.ts` and `browser/fixtures/` is empty. Only driver implementation files under the test path
  changed after red (`browser/driver.ts`, `serve.ts`, `commands.ts`, `in-process.ts`, new `page-helpers.ts`).
- **Assertions.** Every scenario returns what it observed, and the harness asserts `toEqual` against a hand-written
  expectation. There is no `skip`, `only`, snapshot or conditional `expect`. The early `return`s inside in-page setup
  helpers (for example `activationHost`, `emptyThenFill`, `observeSizes`) are page setup, not assertions: a missing
  element there changes the observed value, so the test still fails. The fixture harness also asserts zero CSP
  violations, no disallowed or failed request and no console output (`browser/driver.test.ts:43`). `axTree` stays exactly
  `{ role, name }` (`ax-states.test.ts:56`).
- **Coverage of T002 to T005.** Each command and recorder named in T002 and T003 has a body:
  - commands: `press` with modifiers; `click` with `button`, `modifiers` and `count`; child targets for `box`,
    `computed`, `focus`, `click` and `activeElement`; `activeElement` through nested shadow roots; `mutate` in one task;
    the non-settling `resize` (in process only, by design); `afterResizeDelivery`; `computedPart`; `scrollOffset` and
    `viewportSize`;
  - recorders: the keydown recorder in the bubble phase; the clipboard observer for `writeText`, `write`, `read` and
    `readText`, `execCommand` copy, cut and paste, and `setData` on copy and cut events; `activationRecord` deferred and
    synchronous; `axUpdates` across two frames and within one task.

  T004 covers `selected`, `pressed` (true, false, mixed), `disabled`, `controls`, `orientation` and `live`. T005 covers
  the project, its file-access flag, the `elements` exclusion and both mutation-config exclusions.
- **Scaffold.** No `scaffold.sha` for this phase. The stubs were part of the red commit, which is allowed because they
  are test-path files.
- **Mutation.** Nothing to mutate (R1-03).

## Checks run

All checks were run at HEAD `21dc7ad` with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
one at a time.

| Check | Result |
|-------|--------|
| `.specify/extensions/story/scripts/tdd-check.sh 1` | `fail`: only the 5 environment-only container tests (see top) |
| `pnpm test` (inside tdd-check, HEAD) | 5 of 3156 fail: the same environment-only 5 |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0 |
| `gate:style-lint` | exit 0 |
| `gate:test-lint` | exit 0 |
| `gate:config-copies` | exit 0 |
| `gate:prefix` | exit 0 |
| `gate:pins` | exit 0 |
| `gate:signoff -- --range 702d08f..HEAD` | 6 commits checked, no finding |
| `gate:manifest` | exit 0 |
| `gate:contrast` | exit 0 |
| `gate:brand-rules` | exit 0 |
| `gate:csp` | exit 0 |
| `gate:storybook-build` | 21 stories built |
| `gate:axe` | 42 story-theme runs, 0 serious or critical; 10 excepted notes (existing base-styles exceptions) |
| `gate:mutation -- --base 702d08f` | nothing to mutate (test code only) |
| `gate:plants` | exit 2: no container engine for the visual plants (environment) |
| `gate:plants -- --skip-container` | 253 plants of 17 gates judged, every plant as expected; 48 visual plants not run (environment) |
| `gate:visual` | not run: a recorded known gap until `/ocelle-land` (operator decision 2026-11-14, FR-053 and SC-007 as amended) |

**Tasks.** T001 to T008a are all ticked and their work is present:

- T001: the merge `702d08f` is the base, made with `--no-ff` and signed off before `base.sh 1`. The required #10
  artefacts are present, and `recheck-10.md` records 10 items and the fixes to R-12 and R-07.
- T002 to T005: the four test files plus `browser/driver.test.ts`.
- T005a: `red-commits`, `red-phase.log`.
- T006 to T008: driver, commands and the Vitest project.
- T008a: `plants.md`, with every plant T008a lists and one recorded equivalent `resize` variant with its reason.

Changes outside the phase's tasks are the operator-decided spec, plan, research, quickstart and tasks amendment
(`21dc7ad`, documented in `spec-amendment.md`). It leaves no ticked phase 1 task altered in substance.

**Constitution.** This phase changes no element and no public surface. The test page helpers wrap the clipboard so that
a test can prove an element performs no clipboard I/O (I), and the fixture keeps the strict CSP (IV), with the helper
installed through `addInitScript` rather than a page script. VIII is covered above. V's baselines exception is recorded
in plan.md Complexity Tracking with scope, rationale and sunset, approved by the operator.

**Plan.** R-07 (activation record, `nodesUpdated` recorder), R-09 (the `elements-browser-file` node project with
`--allow-file-access-from-files`, excluded from `elements` and from mutation) and R-11 (driver commands, `axStates`
separate from `axTree`) are implemented as planned.

## Earlier findings

None: this is round 1.
