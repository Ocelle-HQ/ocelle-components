---
phase: 2
round: 3
verdict: changes_requested
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: 336959d
tdd_check: fail
---

# Phase 2 review, round 3

Scope: the round-2 fix, `git diff f2b7b8a..336959d`. That is the red fix-2 commit dbf0ed9 (only
`packages/elements/test/button.test.ts`, +44), the green commit 7a785f6 (`ocelle-button.ts`, which adds `childList` to
the observer options and rewrites the comment, plus the README line, the fix note, `red-commits` and `red-fix-2.log`),
and the tdd-check outputs 336959d. The gates below re-checked the whole phase (`48cdc95..336959d`). The work tree was
clean, apart from the gitignored `storybook/.visual/`. Read: round-2.md, round-2-fixes.md, red-fix-2.log,
check-red-fix-2.log, check-head.log, tdd-check.json, and tasks.md Phase 2 (every task ticked).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | tdd-check.json (`"status":"fail"`, `"problems":["tests fail at HEAD"]`); check-head.log:42 | The tdd-check fails: at HEAD, 1 of 3360 tests failed. The failing test is `gates/test/integration/visual.test.ts:115` "captures the repository's 76 story-themes twice under docker and exits 0". The cause is R3-02. | Fix R3-02, then rerun `tdd-check.sh 2` and get `pass`. |
| R3-02 | blocking | storybook/stories/button.stories.ts:83-87 (`SecondaryPressed`, `pointer: { press: "ocelle-button" }`); applied by gates/lib/story-page.ts:353-355 | **This phase's pressed story does not capture to the same bytes every time.** Under CPU contention the visual gate reports `elements-ocelle-button--secondary-pressed/dark: visual: nondeterministic: run 1 and run 2 differ` (the light theme too), exits 1 and prints exactly 2 stdout lines: the finding and `visual: 1 finding in 76 story-themes (docker only: no cross-engine comparison)`. That matches the failure in check-head.log (code 1, 2 stdout lines). Evidence (all at HEAD, docker, Chromium 1248 in the pinned image): `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` matched all 76 captures in 5 of 5 runs on an idle machine and in 1 of 1 run with 8 busy `yes` processes on the 4 cores. With 16 busy processes it failed 3 of 6 runs. All three findings were this one story (dark, dark, light). None of the other 75 story-themes ever differed, including the three hovered stories and the focused one. In every failure run 1 matched its baseline byte for byte and run 2 did not. The difference is 34 to 36 pixels at the four rounded corners of the button only (x 16-19 and 82-85, y 32-35 and 72-75), each off by at most 1 in one channel, for example `2a2824` against `2a2924`. The pressed fill and the label are identical. So the pressed state is reached, but the corner anti-aliasing depends on timing: `applyPointer` calls `mouse.down()` right after `mouse.move()`, with no frame between the hover paint and the press paint, and the raster result depends on whether a frame was produced in between. A probe in a scratch worktree (not committed) added `settle(page)` before `mouse.down()` on the press path. That probe passed 6 of 6 runs with 16 busy processes, and every baseline still matched. That supports, but does not prove, the cause. Per the constitution's "stories and baselines per state" and the gate's own `nondeterministic` rule, a story whose capture changes between runs is not an acceptable baseline. It only shows under load, but `pnpm test` runs this gate alongside the rest of the suite, so it brings the load itself. That is why the failure appears in red-fix-1.log, red-fix-2.log, the implementer's first post-fix `pnpm test` and check-head.log, and not in an isolated run. My 2 full `pnpm test` runs and 5 direct `vitest run`s at HEAD did not hit it, so this is intermittent, not environment-only: it is specific to this story. | Make the pressed capture byte-stable, and show it under load: for example 6 or more `gate:visual` runs with 16 busy processes and no `nondeterministic` finding, plus a passing tdd-check. One option the probe supports is to wait one settle (fonts and two frames) between the move and the press in `applyPointer`. That is 006's gate code, so it needs a red test or plant per Principle VIII and a reason recorded for changing code outside this phase. Another option is to change the story so that its press capture is deterministic. Do not regenerate the baseline as the fix: run 1 already matches it. |
| R3-03 | note | gates/test/integration/setup-offline.test.ts:54 | In all 5 of my direct `node node_modules/vitest/vitest.mjs run` runs (3 in the main tree, 2 in a fresh worktree at HEAD), "exits 2 naming the missing package ..." failed. pnpm reported `ERR_PNPM_NO_OFFLINE_TARBALL:` without `missing: is-number`. Under `pnpm test` it passed in 2 of 2 runs, and it passed in check-head.log. Neither the file nor `gates/bin/setup-offline.ts` has changed since 001 (`git log 48cdc95..HEAD` shows nothing), so it does not come from this phase. It depends on how the suite is started. The implementer saw it once (round-2-fixes.md). | None in this phase. Worth a backlog note: the suite should not depend on being started through pnpm. |

## Test quality

- **tdd-check.json**: `fail`, head 7a785f6. The commit 336959d adds only the check's own outputs, so the check is
  current. Red commits: phase fa5ef5c exit 1, fix-1 045bd1f exit 1, fix-2 dbf0ed9 exit 1. The final tests exit 1 on
  the scaffold and 2 on the base. At head they exit 1 (R3-01).
- **Red fix-2 (dbf0ed9).** The commit changes tests only. check-red-fix-2.log shows 1 of 3360 failed, the new test
  (`button.test.ts:111`), on its deep equality. The implementer's red-fix-2.log adds the R3-02 visual failure. The
  failure is caused by the missing behaviour, not by setup: per the fix note, `written` was `["0px","0px","0px"]`,
  and the old observer, which watched `characterData` only, cannot produce anything else for those writes.
- **After red.** `git diff dbf0ed9..HEAD` on the test paths (packages/elements/test, gates/test, storybook/test)
  shows no change. No test was weakened, skipped or deleted.
- **Assertions.** The new test covers the three ways text is written that R2-01 required: an inserted text node,
  `textContent`, and a text node in a nested `<b>`. It asserts the centred 0px icon before the write, 8px after it,
  and the centred 0px icon after the removal, in one hand-written deep equality. It has no conditional assertion.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 48cdc95` on the whole phase: 158 mutants on the changed
  lines of 5 files, none survived. There was 1 timeout (ocelle-button.ts:292, options replaced by `{}`, which makes
  `observe()` throw in the constructor; reported, not blocking), 51 compile errors, 2 zero-mutant entries
  (`icon-slot.ts`, `index.ts`) and 1 equivalent record (ocelle-button.ts:51, accepted in round 1). The fix note says
  `childList: false` is killed by the new test, and the run agrees: no mutant survived on line 292.

## Checks run

These ran on HEAD 336959d, one at a time, except for the load experiments, which add load on purpose:

- `gate:typecheck`, `gate:lint` (279 files), `gate:style-lint` (14), `gate:test-lint` (187), `gate:prefix` (220),
  `gate:pins` (5), `gate:config-copies`, `gate:manifest` (3 elements), `gate:contrast` (193 light, 201 dark, 182
  required), `gate:brand-rules` (7 rules), `gate:csp` (12 files), `gate:storybook-build` (38 stories) and
  `gate:signoff -- --range 48cdc95..HEAD` (20 commits): all pass.
- `gate:axe`: 76 story-theme runs, 0 serious or critical; 10 excepted notes.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual`: 5 of 5 runs match on an idle machine (97-98 s each). Under
  load, 1 of 1 matched with 8 busy processes and 3 of 6 failed with 16, all on R3-02's story. I kept the run-1 and
  run-2 PNGs of each failure in my scratchpad and compared them with the baselines pixel by pixel.
- `pnpm test`: 2 of 2 runs passed 3360 tests.
- `node node_modules/vitest/vitest.mjs run`, which shows full diffs: 3 runs in the main tree and 2 in a fresh worktree
  at 336959d. Each failed only R3-03's test. The visual test passed in all of them.
- `gate:mutation -- --base 48cdc95`: see above.
- The probe for R3-02 ran in a scratch worktree at 336959d with a one-line change to `gates/lib/story-page.ts` (a
  settle before `mouse.down()`). It passed 6 of 6 `gate:visual` runs with 16 busy processes. The worktree has been
  removed, and no repository file was changed.

## Earlier findings

- **R2-01 (blocking): resolved.** The observer now watches `{ characterData: true, childList: true, subtree: true }`
  (packages/elements/src/ocelle-button.ts:292). The red test fix-2 (dbf0ed9, recorded in `red-commits`, exit 1) covers
  text inserted into or removed from a slotted element and into a nested element. It passes at HEAD, and the
  `childList` mutant is killed. The README line (README.md:171-175) now matches the behaviour.
- **R2-02 (note): acceptable.** It is documented, not tracked. README.md:173-175 states that a forwarded label is read
  when the forwarded slot's assignment changes, not when the forwarded text changes. That is accurate for the code,
  and it is the second option round 2 offered.
- **R2-03 (note):** no change was required. R1-02 stays open for the next planning touch.
- **Regressions:** none found. Every gate passes apart from R3-02's intermittent visual finding. No baseline changed
  since round 2 (`git diff f2b7b8a..HEAD -- storybook/baselines` is empty).
