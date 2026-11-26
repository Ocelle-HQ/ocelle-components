# Phase 5 stop 2: two plants list the repository's stories, and the phase's stories are not in them

- **Raised by**: implementer, 2026-11-16, at the phase-end `gate:plants` run, after green (`8a88bcd`)
- **Stop-and-ask points this falls under**: "A story needs a change outside the three story files" (T066; analysis C3),
  and T066's statement of the files phase 5 changes (the three story files, `elements-stories.test.ts`,
  `storybook/baselines/` and, by the T061 addendum, the pinned counts in four `gates/test/integration/` files).

## What I found

`gate:plants` exits 1, "plants: 2 problems in 301 plants" (`plants.md`, `plants.log`). Both problems are plants of #10
that enumerate the repository's stories; neither is a gate that stopped biting:

1. **`gates/plants/storybook-build/fail-empty-index`** (`not-caught: expected exit 1 with the plant's 1 finding, got
   exit 0`). Its `tree/storybook/stories/` replaces every repository story file (`base`, `tokens`, `icon`,
   `brand-mark`) with one that has a default export and no story, so the built index is empty. The phase's
   `notice.stories.ts`, `form-input.stories.ts` and `form-select.stories.ts` are not replaced, so the index holds their
   30 stories and the gate passes. Mission 005 met the same for `icon` and `brand-mark` and added their replacements
   (plan decision 29).
2. **`gates/plants/visual/fail-token-changed`** (`not-caught: findings differ: unexpected …`). It changes `color-ink`
   in light and lists, in `plant.json`, the 20 light story-themes that show it; its `why` says "A story added later that
   shows color-ink in light adds its line here (research.md R-07)". The gate reported those 20 and the 30 phase 5 light
   story-themes as `differs`, every `elements-ocelle-notice--*`, `elements-ocelle-form-input--*` and
   `elements-ocelle-form-select--*` story in light, and nothing in dark.

The tasks do not provide for either change: T066 names the files phase 5 may change, the operator's decision on stop 1
widened them to the pinned counts only ("No other change to #10's tests"), and `plant.json` is not a test path.

## Question for the operator

How should the two plants be brought up to the story set?

- **(a)** Change them in this phase, in a commit of their own after green (no test assertion changes; the plants are
  fixtures of `gate:plants`), and widen T066's file list to name them:
  - `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/{notice,form-input,form-select}.stories.ts`,
    each a default export with no story (`export default { title: "Empty notice" };` and so on, with the plant's
    one-line comment), as mission 005 did for `icon` and `brand-mark`;
  - `gates/plants/visual/fail-token-changed/plant.json`: the 30 findings `elements-ocelle-{notice,form-input,form-select}--<story>/light`
    `differs` added, and the `why` text's figure moved from twenty to fifty light story-themes (naming mission 010's 30).
  Then rerun the two shards (1 and 16) and the verdict, and record them in `plants.md`.
- **(b)** Something else (for example a planner change to tasks.md first, or the plants changed by another op).

## Also for the operator's attention (not a stop)

- **Plant time.** Each visual plant now captures 102 story-themes: 136 to 192 s per plant here, visual shards of 396 to
  456 s, about 2 h 15 min for all shards run one after the other; the single-process `gate:plants` run did not finish in
  7000 s (`gates.md` § Timing). CI runs the shards in parallel.
- **Test titles.** The T061 addendum changed the pinned figures in the assertions but kept the titles of
  `visual.test.ts:116` and `axe.test.ts:52` ("the repository's 42 story-themes"), which about 300 `Stryker disable`
  comments in `gates/bin/`, `gates/lib/` and `gates/visual/` cite by title. The titles now state a stale figure.
- **The `axe.test.ts:68` count** ("2 findings in 44 story-theme runs" → 104) was not listed in stop 1 but is the same
  kind of pinned count in a named file (the unlabelled-button root holds the repository's stories); the red commit
  changed it with the others, and the T061 addendum names it.

## State

T061 to T065 are done and ticked: red `2d7545a` (`red.sh 5 phase`: tests only, red, recorded; 98 failures, all
assertions), green `8a88bcd`. `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:unit-tests` and the other
phase-end gates are green (`gates.md`); `gate:mutation` has nothing to mutate. Only `gate:plants` is red, on the two
plants above. T066 is open (it follows the operator's `tdd-check.sh` run). No plant file was changed.
