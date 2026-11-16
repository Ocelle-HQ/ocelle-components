# Phase 5 red evidence (T066)

Constitution VIII asks that the final tests of a unit, run against the code from before the unit, fail. In phase 5
the stories themselves (`storybook/stories/{notice,form-input,form-select}.stories.ts`) are under the test pathspec,
as is `storybook/test/integration/elements-stories.test.ts`, so `tdd-check.sh` check 2 overlays them onto the base
(analysis C1). This file records how the check reads here, and the run it cannot give (analysis C3).

- Base: `77dfda1797aa9878c7fa0fd408101077a7044329` (`reviews/phase-5/base.sha`, T060).
- Red commit: `2d7545ae336e0d18938e170a5af133e8347c3318` (`reviews/phase-5/red-commits`, `phase` line).
- Head of the check: `af1356a2edf10330844bd716d1c9377ab93aa46c` (`tdd-check.json`, committed in `c93057a`).

## (1) How `tdd-check.sh` reads in phase 5

`tdd-check.json`: `"status":"pass"`, red commit exit 1, `"final_tests_on_base_exit":1`, `"head_exit":0`,
`"problems":[]`.

- **Check 2, final tests on the base** (`check-final-tests-on-base.log`): **exit 1**, "34 of 4005 tests failed".
  The overlay brings the final `elements-stories.test.ts`, the three story files and the four gate test files with
  the T061 addendum's counts onto the base; it cannot bring `storybook/baselines/`, the phase's only output outside
  the test pathspec. So the stories exist there, their index and render assertions pass (none of the 1 index and 60
  render tests is in the log), and the failures are the assertions that need the baselines, and nothing else:
  - **The 30 baseline assertions** of T061, `elements-stories.test.ts:402` "`<story-id>` has its committed
    baselines in light and dark, each a PNG file", one per story of US4 scenario 1, each `AssertionError: expected
    [ { …(2) }, { …(2) } ] to deeply equal [ { …(2) }, { …(2) } ]` (no file, so no PNG signature, in either theme):
    - `elements-ocelle-notice--`: `info`, `success`, `warning`, `danger`, `neutral`, `regular-size`,
      `compact-size`, `with-heading`, `without-heading`, `announcing`;
    - `elements-ocelle-form-input--`: `empty`, `placeholder`, `filled`, `with-description`, `with-error`,
      `required`, `disabled`, `read-only`, `focused`, `hover`;
    - `elements-ocelle-form-select--`: `empty`, `placeholder`, `filled`, `with-description`, `with-error`,
      `required`, `disabled`, `focused`, `hover`, `option-groups`.
  - **The 4 baseline counts among the pinned counts** of the T061 addendum (`decision-stop-1.md`, option (a)):
    - `gates/test/integration/plant-repo.test.ts:218` "copies storybook/baselines when the repository holds it":
      `expected [ …(42) ] to have a length of 102 but got 42` (the `toHaveLength(102)` at line 225);
    - `gates/test/integration/visual.test.ts:115` "captures the repository's 42 story-themes twice under docker and
      exits 0 …": `expected { code: 1, stdout: [ …(61) ], …(1) } to deeply equal { code: +0, …(2) }` (the
      `visual: 102 captures match their baselines` at line 120; the gate exits 1 with 60 `missing-baseline`
      findings, the 30 new stories in two themes, and its summary);
    - `gates/test/integration/visual.test.ts:126` "keeps the capture, its diff image and run 1 …":
      `expected { code: 1, findings: [ …(62) ], …(1) } to deeply equal { code: 1, findings: [ …(2) ], …(1) }` (the
      planted two findings plus the same 60 `missing-baseline` findings; the `2 findings in 102 story-themes` at
      line 139 is behind it);
    - `gates/test/integration/visual.test.ts:239` "writes nothing on an unchanged tree and says so":
      `expected 42 to be 102 // Object.is equality` (the `toBe(102)` at line 244).
  - The other pinned counts hold at the base with the stories overlaid, as `decision-stop-1.md` expects: the
    `storybook-build` test (`built 51 stories`, line 55) and both `axe` tests (`axe: 102 story-theme runs …; 10
    notes (0 incomplete, 10 excepted)`, line 56, and `2 findings in 104 story-theme runs`, line 68) are not in the
    log. They count stories and story-themes, which the overlay brings; they do not count baselines.
  - So the non-zero exit comes from the baseline assertions and the baseline counts alone, as T066 requires. No
    other test fails, every failure is an `AssertionError`, and the exit is not zero: nothing here stops the phase.
- **The index and render assertions' red evidence** is `red-phase.log` (the red commit, where the stories did not
  exist): "98 of 4005 tests failed", the 91 tests of T061 (1 index, 60 render, 30 baseline) and the 7 pinned-count
  assertions of the addendum in 6 tests (`axe.test.ts:51` and `:61`, `plant-repo.test.ts:218`,
  `storybook-build.test.ts:48`, `visual.test.ts:115`, `:126` and `:239`). `check-red-phase.log` is the check's own
  run of the red commit and gives the same 98 failures.
- **Check 3, head** (`check-head.log`): exit 0, "4005 tests passed in 161 files".

### Files the phase changes

`git diff --name-only 77dfda1..af1356a -- . ':!specs'` lists 72 files, all within T066's widened list:

- `storybook/stories/notice.stories.ts`, `form-input.stories.ts`, `form-select.stories.ts`;
- `storybook/test/integration/elements-stories.test.ts`;
- 60 files under `storybook/baselines/` (30 stories, light and dark);
- by the T061 addendum, the pinned counts only (one-line changes each) in
  `gates/test/integration/storybook-build.test.ts` (line 55), `visual.test.ts` (lines 120, 139, 244),
  `axe.test.ts` (lines 56, 68) and `plant-repo.test.ts` (line 225);
- by the stop 2 decision (`decision-stop-2.md`, option (a); plant fixtures, no test assertion),
  `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/{notice,form-input,form-select}.stories.ts`
  and `gates/plants/visual/fail-token-changed/plant.json`.

`storybook/stories/render.ts`, which is not a test path, is not among them: it stays as T060's base has it, so the
base is the code without the stories. No story needed a change to it.

## (2) The final story test against the base, alone

Check 2 overlays the stories as well, so it cannot show the index and render assertions failing against the code
from before the phase. This run does (constitution VIII; analysis C3), as T005a does in phase 1.

- Run: `git worktree add --detach <tmp> 77dfda1797aa9878c7fa0fd408101077a7044329`; in it
  `git checkout c93057a -- storybook/test/integration/elements-stories.test.ts` and nothing else (the file is the same
  at `af1356a` and `c93057a`), so no story file, no baseline and none of the addendum's counts is there;
  `pnpm run setup:offline && pnpm test`; output kept as `reviews/phase-5/check-final-story-test-on-base.log`;
  worktree removed.
- Environment: with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (the Chromium the
  check's own logs name) and `PLAYWRIGHT_BROWSERS_PATH` pointing at a scratchpad alias (`chromium-1248` →
  `/opt/pw-browsers/chromium-1243`), as `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path
  describes. A first attempt without them stopped in setup (`setup: Chromium not found at
  /opt/pw-browsers/chromium-1248/chrome-linux64/chrome`, exit 2) before any test ran; its output was replaced by the
  kept run.
- **Exit code 1**, "91 of 4005 tests failed": exactly the 91 tests T061 added, each on an `AssertionError`, and no
  other test. None of T061's tests passes there. The gate tests are at their base counts in this worktree (21
  stories, 42 story-themes and baselines), match the base, and pass.

The failing tests, with their messages (`elements-stories.test.ts`, describe "the ocelle-notice, ocelle-form-input
and ocelle-form-select stories in the built Storybook (010 US4-1, US4-2, FR-033)"):

- **Index, 1 test** (line 359), "the index holds a story for each notice tone, size, with and without a heading and
  announcing, and each form element's states, under the element's title": `AssertionError: expected [ { …(2) },
  { …(2) }, { …(2) }, …(27) ] to deeply equal [ { …(4) }, { …(4) }, { …(4) }, …(27) ]` (the 30 found entries are
  not the 30 expected stories with their titles and names).
- **Render, 60 tests**, one per story and theme:
  - `ocelle-notice`, 20 tests (line 369), "`<id>` in `<theme>`: renders its ocelle-notice in the story's tone, size
    and heading, with base.css applied, no pointer and no request outside the origin", for the ten notice stories in
    light and dark: light `AssertionError: expected { …(5) } to deeply equal { …(5) }`, dark `AssertionError:
    expected { …(5) } to deeply equal { Object (frame, notices, ...) }`;
  - `ocelle-form-input`, 20 tests (line 386), "`<id>` in `<theme>`: renders its ocelle-form-input in the story's
    state, focus by script only, the pointer parameter on hover alone, with base.css applied and no request outside
    the origin", for the ten input stories in light and dark: light `expected { …(5) } to deeply equal { …(5) }`,
    dark `expected { …(5) } to deeply equal { Object (frame, controls, ...) }`;
  - `ocelle-form-select`, 20 tests (line 386), the same title with `ocelle-form-select`, for the ten select stories
    in light and dark, with the same two messages.
- **Baselines, 30 tests** (line 402), "`<id>` has its committed baselines in light and dark, each a PNG file", for
  the 30 stories listed under (1): `AssertionError: expected [ { …(2) }, { …(2) } ] to deeply equal [ { …(2) },
  { …(2) } ]`.

T061 changed no other test of `elements-stories.test.ts` (its diff adds the new describe block, its helpers and two
imports). The addendum's changed count assertions are not part of this run, since only the story test is overlaid;
their red evidence is `red-phase.log` (7 assertions failing) and, for the baseline counts, check 2 above.

## README (T066)

The map of FR-035 and SC-006 to `readme.test.ts` assertions and their red runs is `reviews/phase-5/readme-map.md`:
every item has an assertion seen failing in a red run of phases 2 to 4; the phase adds no README item and no
assertion.

## Result

Check 2's failures are the 30 baseline assertions and the 4 baseline-count tests, with a non-zero exit; the run of
the final story test alone against the base fails every test T061 added, on an assertion, with exit 1. Nothing stops
the phase.
