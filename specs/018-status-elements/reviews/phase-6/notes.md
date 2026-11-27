# Phase 6 notes (implementer): User Story 5, truncation and the full-text tooltip

## Commits

- No scaffold: the tests call no module or method that does not exist yet (the skill's step 4 applies only then).
  `reviews/phase-6/base.sha` (`c2731a36`) is committed with the red commit.
- `e5102bd0` red: T056 to T058 (operator decision I3: story tests, scenario bodies, node tests and pinned counts in the red
  commit).
- green: T059 to T062 (the commit that adds this file).

## Red record

`red.sh 6 phase` on `e5102bd0` (the amended red commit): `tests_only: true`, `red: true`, `recorded: true`, exit 1,
**79 of 8315 tests failed** (`red-phase.log`, sandbox paths redacted). By file:

- `pill-tag-truncation.test.ts` (27 of 27) and its fixture twin `browser/pill-tag-truncation.test.ts` (27 of 27): every
  body fails on its assertions: the base has no tooltip around the control (every bubble read is `"none"` where the
  full text is expected) and wraps an enabled pill's text instead of truncating it (the label's styles, edges and
  overflow read as wrapping). No syntax, import or setup error; no timeout.
- `entry-pill-tag.test.ts` (1): the entry point does not define `ocelle-tooltip`.
- node: `readme.test.ts` (12: the entry-point row, 4 fragments, 7 rules), `changelog.test.ts` (1).
- stories and gates: the two story ids in light and dark (4), 215 stories, 430 story-themes and baselines, 432 axe
  plant runs (`axe` 2, `plant-repo` 1, `storybook-build` 1, `visual` 3).

Before the red commit, the scenarios were run in process against the base source (27 of 27 failing on assertions,
the entry test included) and against the working implementation (26 of 26 passing), so each fails for the missing
behaviour. None of the timing flakes named by the operator (dialog, tooltip, drawer) appeared in the red run.

The first red run (`b8d780ac`, before the amend) failed 77 of 8313, the same files. The amend adds, after the first
mutation run, a fitting right-to-left twin to US5-2, a text replaced while truncated to US5-5, and the forwarded-slot
body (the two extra failures, one per harness); no assertion was weakened. The red commit was amended as the flow
allows and `red.sh` run again (its run was cut off once by a container restart before it reported; the evidence it
had recorded for `e5102bd0`, red-commits and red-phase.log, was complete and checked after the restart).

## Departures from the plan, and points for the review

- **No scaffold commit.** The orchestrator listed "scaffold, then red"; the skill makes the scaffold conditional on
  tests that need modules that do not exist yet, and none does (`ocelle-pill-tag.ts`, `ocelle-tooltip.ts` and every
  driver method used exist on the base). The base is recorded in the red commit instead.
- **`ocelle-tooltip` reads any `slotchange` that reaches its slot (found while going green; a point for 008).** The
  pill's own slots (`.label`'s default slot, the `icon` slot) sit inside the inner control, which is the tooltip's
  slotted trigger, so their `slotchange` events bubble through the tooltip's slot, and the tooltip's
  `#onSlotchange` (`ocelle-tooltip.ts` 387-396) takes `event.target.assignedElements()[0]` as its new trigger: after a
  button ↔ link switch the pill's text slot fired last and left the tooltip with no trigger (`assignedElements()` of a
  text-only slot is empty), so its bubble never showed; an icon slot change made the icon the trigger, so keyboard
  focus on the control showed nothing. The tooltip is used as merged (not changed): the pill stops each of its own
  slots' `slotchange` at the slot (`stop`, and `event.stopPropagation()` in `#onSlotchange`). The US4-10, mode-switch
  and icon bodies kill both halves (plants below). 008's tooltip would do well to ignore a `slotchange` whose target is
  not its own slot; that is a triage note for 008, not a change made here.
- **`#readLabel()` renders again only when the label state changes.** Before, it requested an update on every text
  change, so every text edit re-ran `updated()` and its measure, and the truncation `MutationObserver` and `slotchange`
  measure could never be told apart from it (their plants would survive). The `bare` row still follows the text as
  before (phase 4 and 5 bodies pass unchanged). Its `false` mutant (always render again) is equivalent: an extra
  update re-renders the same template and re-measures what the observers already measured.
- **The `min-inline-size: 0` chain and `overflow-wrap: anywhere` (carried from phase 5) are not written: in Chromium
  no layout tells them apart from the rules already merged.** tasks.md T059 says "written once T056's bodies observe
  them"; none can:
  - The host's `min-inline-size: 0`: the flex-row and grid-track bodies (a truncating pill shrinks to the room left,
    its margin box inside the row) pass with and without it (plant run: survived, 2 passed). Measured in process: an
    enabled interactive pill with "Blocked by the review of the scheduler" in an `inline-size: min-content` container
    is 26 px wide (its control's padding and border), its `.icon-row` and `.label` 0 px, so the host's automatic
    minimum in a flex row or an auto grid track is already that, not its text; a stand-in with the same row and label
    rules in a plain `inline-flex` button is 310 px. The text span's link is the merged `.label { min-inline-size: 0 }`
    (phase 4), the row's the merged `.icon-row { max-inline-size: 100% }` (phase 4, which caps its automatic minimum;
    a `min-inline-size: 0` on it survived its plant, 8 bodies passed), the control's `--ocelle-target-small` (phase 5,
    FR-043; a 0 there would break US4-7's 24 px target).
  - `overflow-wrap: anywhere` on the disabled text: in 13 layouts (a block, a flex row with and without a `flex: none`
    sibling, an auto grid track, a `min-content` grid track, a `min-content`, `max-content` and `fit-content` container,
    an inline-block, a float, an absolutely positioned box, an auto and a fixed table layout) a disabled pill with a
    34-letter word has the same box and the same number of lines with `anywhere` and with the merged `.label {
    overflow-wrap: break-word }`, because the host's cap (`max-inline-size: calc(100% - 2 extents)`) and the label's
    `min-inline-size: 0` already keep the word inside the pill. US5-6's long-word body pins the behaviour (the word
    broken inside the disabled pill, its enabled twin truncating it).

  Operator question Q-P6-1 below.
- **The disabled text's rule** is `white-space: normal; overflow: visible; text-overflow: clip` in the interactive host
  sheet (undoing the enabled `nowrap`, `hidden`, `ellipsis`), with the merged `break-word`.
- **Story focus and the bubble (plan decision 16).** The `Truncated` story's wrapper awaits the pill's first
  `updateComplete` and focuses it; the pill measures in that first `updated()` and requests the update that enables the
  tooltip, which runs after the wrapper's continuation, so the focus arrives while the tooltip is disabled and no bubble
  opens (as the T002 spike measured: enabling a focused trigger's tooltip shows nothing). The story test reads no open
  bubble 700 ms after the capture's settle, in both themes.
- **Gates not run locally** (operator rule reviews/operator-ci-first.md): `gate:unit-tests` in full, `gate:visual` and
  `gate:axe` over every story, `gate:contrast`, `gate:brand-rules` (no token added); CI judges them.

## Operator question Q-P6-1

**The `min-inline-size: 0` chain (host, `.icon-row`) and the disabled text's `overflow-wrap: anywhere`, carried from
phase 5, cannot be observed in Chromium** (measurements above): a plant removing any of them survives every body. Which
should apply?

- **(a)** Leave them out (as committed): the behaviour they were for is pinned by the flex-row, grid-track and
  long-word bodies, and the merged rules give it; tasks.md T059's "written once T056's bodies observe them" is read as
  "not written". data-model.md § interactive host sheet would then be amended to say so (not done here).
- **(b)** Write them as R-07 and data-model.md say, for engines the tests do not run (WebKit 17.4 is on the engine
  floor), and record each as CSS whose plant survives in Chromium, with the measurements above as the reason.
- **(c)** Write them and add a WebKit run of the flex-row and long-word bodies to observe them (a harness change,
  outside this phase).

## Plants

Each plant of contracts/checks.md § US5 and the US4-10 plant carried from phase 5, and one for each guard added while
going green, was applied once to the final source (restored after) and only the bodies its guard sits in were run in
process (`vitest --project elements test/pill-tag-truncation.test.ts -t <pattern>`):

| Plant | Test file | Bodies | Result | Verdict |
|---|---|---|---|---|
| the ResizeObserver removed | pill-tag-truncation.test.ts | `Trigger, width` | 1 failed | 26 skipped (27) | killed |
| characterData false | pill-tag-truncation.test.ts | `Trigger, characterData` | 1 failed | 26 skipped (27) | killed |
| subtree false | pill-tag-truncation.test.ts | `Trigger, characterData` | 1 failed | 26 skipped (27) | killed |
| childList false | pill-tag-truncation.test.ts | `Trigger, nested childList` | 1 failed | 26 skipped (27) | killed |
| the slotchange listener removed (no measure on slotchange) | pill-tag-truncation.test.ts | `Trigger, slotchange` | 1 failed | 26 skipped (27) | killed |
| re-measure in updated() removed | pill-tag-truncation.test.ts | `Trigger, updated` | 1 failed | 26 skipped (27) | killed |
| the measure by scrollWidth > clientWidth | pill-tag-truncation.test.ts | `Sub-pixel` | 1 failed | 26 skipped (27) | killed |
| observers created in connectedCallback only | pill-tag-truncation.test.ts | `After static` | 2 failed | 25 skipped (27) | killed |
| the ResizeObserver not re-targeted | pill-tag-truncation.test.ts | `After a mode switch` | 2 failed | 25 skipped (27) | killed |
| the ResizeObserver not re-targeted after a reconnection (#span kept) | pill-tag-truncation.test.ts | `After a reconnection` | 1 failed | 26 skipped (27) | killed |
| the interactive host sheet not adopted | pill-tag-truncation.test.ts | `Ring in a clipping` | 1 failed | 26 skipped (27) | killed |
| truncated forced to false | pill-tag-truncation.test.ts | `US5-1|US5-2|US5-4` | 4 failed | 23 skipped (27) | killed |
| truncated forced to true | pill-tag-truncation.test.ts | `US5-1|US5-5|US5-6|Trigger, width` | 5 failed | 3 passed | 19 skipped (27) | killed |
| the refocus in updated() (not queued) | pill-tag-truncation.test.ts | `US4-10` | 1 failed | 26 skipped (27) | killed |
| truncated not cleared while disabled | pill-tag-truncation.test.ts | `US5-6` | 1 failed | 3 passed | 23 skipped (27) | killed |
| the label slot's slotchange reaching ocelle-tooltip | pill-tag-truncation.test.ts | `US4-10|After a mode switch` | 3 failed | 24 skipped (27) | killed |
| the icon slot's slotchange reaching ocelle-tooltip | pill-tag-truncation.test.ts | `An icon` | 1 failed | 26 skipped (27) | killed |
| the full text not collapsed | pill-tag-truncation.test.ts | `Full text` | 1 failed | 26 skipped (27) | killed |
| right to left measured as box.left + text.left | pill-tag-truncation.test.ts | `US5-2` | 1 failed | 26 skipped (27) | killed |
| the slot's assigned nodes not flattened | pill-tag-truncation.test.ts | `forwarded slot` | 1 failed | 26 skipped (27) | killed |
| a changed full text not rendered while truncated stays the same | pill-tag-truncation.test.ts | `US5-5` | 1 failed | 26 skipped (27) | killed |

Every plant is killed. "The refocus in `updated()` (not queued)", which survived in phase 5 for want of a tooltip, is
killed here: with a synchronous refocus the tooltip's `slotchange` for the new control comes after the `focusin` and
resets its focus state, so the keyboard-focused pill shows no bubble after the switch.

Not run as plants, because the rule is not written (Q-P6-1): the host's `min-inline-size: 0` (a first draft had it;
its removal survived the flex-row and grid-track bodies, 2 passed), `.icon-row { min-inline-size: 0 }` (survived, 8
bodies passed) and the disabled text's `overflow-wrap: anywhere` (survived the long-word body in a `min-content`
container, 1 passed).

## Mutation

`gate:mutation -- --base <base>` (one job at a time):

- run 1 (before the amend): 126 mutants on the changed lines, 13 survivors. Three were killable and gained tests in the
  amended red commit (the right-to-left measure `box.left + text.left`, killed by a fitting right-to-left twin in
  US5-2; `assignedNodes({ flatten: true })` as `{}` or `false`, killed by the forwarded-slot body; the full-text half
  of the measure's change test as `true`, killed by US5-5's text replaced while truncated). Each of the three also has
  a plant above, killed.
- The other ten are equivalent and recorded with `Stryker disable` comments in the source, each with its reason: the
  initial `#fullText` and `#truncated` (replaced by the first `updated()` measure before any focus or hover can reach
  the tooltip); the observer teardown, as contracts/checks.md § US5 and R-09 foresee (`disconnectedCallback`'s block,
  its `#unwatch()` call, `#unwatch()`'s block, the re-target's `disconnect()`); `super.disconnectedCallback()` (no
  reactive controller or async directive, as `ocelle-tooltip`'s record); the re-target's change test as `true`
  (observing the same span again changes nothing); `#readLabel()`'s change test as `false` (a render again that
  changes nothing).
- run 2 (`mutation-phase.log`, sandbox paths redacted): 126 mutants, **none survived**; 3 timeouts (the measure's
  change test as `false` or with `!==`, which render forever: killed by timeout), 27 compile errors, 9 equivalent
  records.

## Gates run locally

PATH with Node 26 first, `OCELLE_CHROMIUM_PATH` set; per reviews/operator-ci-first.md:

- `gate:typecheck`, `gate:lint` (481 files), `gate:style-lint` (45), `gate:test-lint` (358), `gate:manifest` (23
  elements), `gate:config-copies`, `gate:csp` (48 files), `gate:prefix` (512), `gate:pins` (5 manifests),
  `gate:signoff -- --range <base>..HEAD`: no finding.
- This phase's own suites: in process `pill-tag-truncation.test.ts` (27), with `pill-tag-interactive`, `pill-tag`,
  `entry-pill-tag`, `tooltip`, `consumers`, `exports` (251 with the first 26 bodies); on the fixture
  `browser/pill-tag-truncation.test.ts`, `browser/pill-tag-interactive`, `browser/pill-tag`, `browser/tooltip` (235);
  `elements-node` (838); `storybook-integration` for the pill stories (32: the 14 earlier stories and the 2 new ones in
  both themes).
- `gate:storybook-build`: built 215 stories.
- Baselines: `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` (`docker info` checked first): `baselines: wrote 4
  files (4 added, 0 changed, 0 removed)`, `Truncated` and `DisabledWraps` in light and dark. No existing baseline
  changed. Both `Truncated` captures show the focused pill's ring whole inside its clipping container and no tooltip
  bubble (checked by eye and by the story test). None hand-picked.
- After the amend: in process `pill-tag-truncation`, `pill-tag-interactive`, `pill-tag` (136 passed); on the fixture
  `browser/pill-tag-truncation.test.ts` (27 passed).
- `gate:mutation` (above). `gate:plants -- --affected <base>` under docker (`docker info` checked first): **21 of 317
  plants judged, every plant as expected**, exit 0 (plants.md). The selection is narrower than every plant, so it was
  run, not only listed (reviews/operator-plants.md).
- Not run locally (CI): `gate:unit-tests` in full (red.sh ran the full suite at the red commit), `gate:visual`,
  `gate:axe`, `gate:contrast`, `gate:brand-rules`.
