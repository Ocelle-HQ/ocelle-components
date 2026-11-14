# Phase 2, review round 3: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R3-02 | fixed: on a press, `applyPointer` now runs `settle(page)` (the fonts, then two animation frames) between `mouse.move()` and `mouse.down()`, as the operator decided. Run 1 already matched the baselines, so none was regenerated and none changed. | fix-3 be3fd52 (red-fix-3.log: the new test fails on its deep equality: the steps were `["count ocelle-button", "move 60,40", "down"]`, with no `fonts`, `frame`, `frame` before `down`) | gates/lib/story-page.ts (`applyPointer`, the press branch); gates/test/story-page.test.ts (new) |
| R3-01 | fixed through R3-02: the visual integration test it named passes in the full suite (3362 of 3362). The orchestrator's `tdd-check.sh 2` gives the final verdict. | fix-3 (as R3-02) | none of its own |
| R3-03 | no change: it is outside this phase, as the review and the operator said. It is left for landing. | none | none |

## R3-02

- **Why code outside this phase changed.** `gates/lib/story-page.ts` is feature 006's gate code. It is the shared story
  driver, and both the visual gate and the axe gate use it for every story that declares `pointer: { hover }` or
  `pointer: { press }`. The race is in that driver, not in the story. `SecondaryPressed` is just the first pressed
  story whose corner anti-aliasing shows it. Fixing the driver makes every current and future pressed story
  deterministic, and it is what the operator decided. The hover path is unchanged. It still moves and returns, and
  `conditionsAfterRender` settles after it as before.
- **Red test: why a call-order test and not a timing reproduction.** The defect is a race that only shows under CPU
  load, and no test can fail on it every time. The strongest deterministic evidence I could build is a unit test on a
  fake page that pins the order. In it, `page.evaluate` runs its function in the test process against stubbed
  `window`, `document.fonts` and `requestAnimationFrame`, so the in-page steps of `settle` are recorded in order with
  the mouse calls. The press test expects `count, move, fonts, frame, frame, down`. The hover test expects
  `count, move` and no press. This shows that one settle sits between the move and the press. The load runs below
  show that this ordering removes the nondeterminism.
- **`red.sh 2 fix-3`:** `"tests_only": true`, `"red": true`, `"recorded": true`, exit 1. 1 of 3362 tests failed, and
  it was the new press test on its assertion. No other test failed in that run.
- **Mutation.** I ran `pnpm run gate:mutation -- --base HEAD` before committing (the working tree against be3fd52). It
  produced 5 mutants on the changed lines of 1 file, and none survived. There were 0 timeouts, 1 compile error
  (line 356, a string literal replaced by `""`), 0 zero-mutant entries and 0 equivalent records. The changed lines
  have no Stryker disable comment, because the new unit test covers them.
- **Load runs, with the fix.** I ran `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` 8 times in a row while 16
  `yes > /dev/null` processes ran on the 4 cores. Before each run's summary line, `pgrep -c -x yes` counted 16. All
  8 exited 0 with `visual: 76 captures match their baselines (docker only: no cross-engine comparison)` and no
  `nondeterministic` line. They took 112, 110, 112, 112, 113, 115, 116 and 112 s. Afterwards the busy processes were
  killed (`pgrep` counted 0).
- **Control, without the fix, under the same load.** I put the pre-fix `story-page.ts` (from be3fd52) back in the work
  tree for this control only, then restored the fix. With 16 busy processes, 3 of 6 runs exited 1 with
  `elements-ocelle-button--secondary-pressed/light: visual: nondeterministic: run 1 and run 2 differ`, and the other
  3 matched. So this load reproduces R3-02 at the review's rate. The fix's 8 of 8 is a real difference, not a quiet
  machine.
- **Baselines.** None changed. `git status storybook/baselines` is clean.

## Checks run (after the fix, on the final tree)

- `gate:typecheck`, `gate:lint` (280 files), `gate:style-lint` (14), `gate:test-lint` (188), `gate:prefix` (220),
  `gate:pins` (5), `gate:config-copies`, `gate:manifest` (3 elements), `gate:contrast` (193 light, 201 dark, 182
  required), `gate:brand-rules` (7 rules) and `gate:csp` (12 files): all pass.
- `gate:storybook-build`: 38 stories built.
- `gate:axe`: 76 story-theme runs, 0 serious or critical, 10 excepted notes.
- `gate:plants` with `OCELLE_VISUAL_ENGINE=docker`. Shards 1, 2 and 3 (76 plants each, the other gates) passed. So
  did the visual shards 18 (`fail-hover-style-changed`), 27 (`fail-pointer-target-below-fold`), 28
  (`fail-pointer-target-missing`), 30 (`fail-press-style-changed`), 46 (`pass-hover-and-press`) and 49
  (`pass-repository`), and the axe shards 58 (`fail-hover-near-fold`), 59 (`fail-hover-reveals-unlabelled`), 64
  (`fail-pointer-target-below-fold`) and 75 (`pass-repository`). Each printed `every plant as expected`. These are
  every visual and axe plant that declares a pointer, plus both repository plants.
- `gate:mutation -- --base HEAD`: see above.
- `pnpm test`: 3362 tests passed in 149 files.
