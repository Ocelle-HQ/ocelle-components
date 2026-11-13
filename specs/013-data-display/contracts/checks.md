# Contract: the checks this feature adds or extends

No gate is added; one gate, `style-lint`, gains a recorded allowance (R-10). Every existing gate runs on the new
source, stories and built output. This file says what each test asserts and where it lives, so that `/speckit-tasks`
and review can trace each acceptance scenario.

## Scenario bodies and harnesses (FR-052)

| Element | Scenario file | In-process test (mutated) | Fixture test (built browser build, strict CSP) |
|---|---|---|---|
| facts and fact | `packages/elements/test/scenarios/facts.ts` | `test/facts.test.ts` | `test/browser/facts.test.ts` |
| empty state | `test/scenarios/empty-state.ts` | `test/empty-state.test.ts` | `test/browser/empty-state.test.ts` |
| progress | `test/scenarios/progress.ts` | `test/progress.test.ts` | `test/browser/progress.test.ts` |

- **One body per scenario.** Each acceptance scenario of US1 to US3 is a body named after it (`US1-3`), and each body
  makes at least one assertion that can fail.
- **"Does not" outcomes are paired.** A body that asserts something does not happen also asserts a positive outcome
  in the same body. Examples: no tab stop added (US2-6) is paired with the button receiving focus; no event emitted
  (US3-2) is paired with the value changing; no current value (US3-4) is paired with a determinate bar's value read in
  the same body.
- **Red per body (PLAN-TESTABILITY-1-001, PLAN-TESTABILITY-1-002).** Each phase's red run is against its scaffold
  (below), so modules resolve and every body fails on an assertion, not on an import. The red log is checked per body,
  not only by the run's exit code (SC-006): a body that passes in the red run is a finding, and its oracle is changed
  before green.
- **Plants.** Where the oracle could pass vacuously, a plant is named in `tasks.md`, as in 005: a mutated copy of the
  element (or stylesheet) that the test must fail on. They are listed below with the behaviour they guard.

## Scaffold (PLAN-TESTABILITY-1-001)

Phases 1 to 3 each start with a scaffold commit, recorded by `.specify/extensions/story/scripts/scaffold.sh <phase>`
after `base.sh` and before the red commit, as 005 did (`reviews/phase-N/scaffold.sha`):
- the phase's new modules (`src/ocelle-facts.ts` and `src/ocelle-fact.ts`; `src/ocelle-empty-state.ts`;
  `src/ocelle-progress.ts`) with their `define` call, `@tagname`, declared properties and an empty `render()`, and no
  behaviour;
- their exports in `src/index.ts`, `src/browser.ts` and `package.json`, so the entry tests and the browser build
  resolve;
- no test file (the script refuses one).

The red log must show each scenario body failing on an assertion. The scaffold has no behaviour and needs no red
step (constitution VIII exemption), which the phase review states.

## Bodies that the platform alone could pass (PLAN-TESTABILITY-1-002)

Some outcomes are the light DOM's own default and would hold without the element. Each of these bodies also asserts
something only the element gives:

| Body | Outcome the light DOM gives anyway | Assertion only the element gives |
|---|---|---|
| US2-1 | heading, paragraph and button in AX order | the consumer markup is written out of slot order (actions, body, heading, visual), so the AX order heading, paragraph, button proves the slotting |
| US2-2 | the heading's level | the heading is laid out in the element's column: centred in the body part and below the visual |
| US2-6 | the button's tab stop | the button sits in the actions part, below the text, centred in the column |
| FR-011 link in a fact | the link's tab stop | the link's box is inside the value column (`<dd>`), right of the label column |
| US1-4 | the value's text is unchanged | the copy oracle below, paired with US1-3's wrap |

## Oracles

**Facts (US1).**
- **Structure (US1-6, PLAN-TESTABILITY-1-004).** Besides the AX tree, US1-6 asserts the flat-tree structure axe's
  `definition-list` and `dlitem` rules read: the shadow `<dl>`'s element children are only `<dt>` and `<dd>`, in
  alternating order starting with `<dt>`, one pair per visible fact. The `<dl><slot>` plant (A1 structure) must fail
  this assertion. axe itself is not run in the harness (that would be a new dev dependency, and the assertion covers
  the two rules).
- **Each definition is its own value (US1-6, US1-7, US1-10, reorder; PLAN-TESTABILITY-1-005).** These bodies read
  `axSubtree` (which includes slotted light-DOM text), with a distinct value per pair, and assert that each definition
  holds its own fact's value text and follows its own fact's term. Plant: the slots assigned in reverse order.
- **Layout settle (US1-1 to US1-3, US1-9, the resize bodies; PLAN-TESTABILITY-1-003).** The driver's `layout` wait
  (R-02): after `updateComplete`, poll once per animation frame until two consecutive frames give the same geometry,
  failing after 10 frames. The "probe removed" plant is run with this wait. A body resizes the host 600 → 300 →
  600 px and asserts two columns, one column, two columns.
- **Copy (US1-4, PLAN-TESTABILITY-1-012).** The driver selects the rendered value's text and performs a user copy;
  the body reads the copy event's `clipboardData.getData("text/plain")` and asserts it equals the 64-character
  identifier. The same body asserts US1-3's wrap (the value spans more than one line box). Plant: a copy of
  `ocelle-fact` that inserts U+200B every 16 characters into its value; US1-4 must fail.

**Progress (US3).**
- **Value properties (US3-1 to US3-4, US3-6; PLAN-TESTABILITY-1-006).** `AxNode` carries `value`, `valuemin`,
  `valuemax` and `valuetext` (§ Driver additions). Every absence assertion sits beside a presence read of the same
  property for a determinate bar in the same body.
- **Value text (US3-3).** The oracle is picked in phase 3's spike among platform reads only (R-05). No
  `internals` reflection read. If no platform read exposes it, US3-3 goes to the operator before the red commit.
- **Reduced motion (US3-5, PLAN-TESTABILITY-1-009).** The body reads running animations and transitions on the
  element's subtree (`getAnimations`, § Driver additions): none under reduced motion, paired in the same body with at
  least one running animation on the mark without reduced motion, and the still mark's geometry (30% to 70% of the
  track). Plant: the still-mark inset removed. Removing `animation: none` is an equivalent change (the duration is
  already 0 ms under reduced motion), recorded, not a plant.
- **Bounded sweep (US3-12, PLAN-A11Y-SECURITY-1-001 (a)).** Without reduced motion, the mark's animation has a finite
  end time below 5000 ms (`effect.getComputedTiming().endTime`); after `finished` resolves the subtree has no running
  animation and the mark has the still mark's geometry. Plant: `infinite` restored.
- **Mark colour (US3-7).** Plant: the `accent-strong` inset shadow removed.
- **Forced colours (US3-8, PLAN-A11Y-SECURITY-1-006).** The track's outline colour and the fill's background are
  system colours and differ; the fill's computed `box-shadow` is `none`. Plant: the forced-colours `box-shadow: none`
  removed.

## Extra scenario bodies

From the spec check notes and squad round 1:
- **facts:**
  - dynamic add, remove and reorder, and a label change (SPEC-2-06);
  - a fact hidden at first render; `hidden` toggled on and off after render (no row, no term, no definition, then back
    in source order); `aria-hidden="true"` on a fact; `lang` on a fact read from its `<dt>` (computed language)
    (PLAN-A11Y-SECURITY-1-003);
  - right-to-left columns (SPEC-2-08); a 640 px "200% zoom" case (SPEC-2-05);
  - `ocelle-fact` outside `ocelle-facts`, with `wrap="anywhere"`: the value wraps anywhere, the label between words
    (PLAN-CORRECTNESS-1-015);
  - a standalone fact moved into an `ocelle-facts` (one term, no extra label text in the AX subtree) and back out
    (the plain rendering) (PLAN-TESTABILITY-1-014);
  - a non-`ocelle-fact` child is hidden;
  - shrink-to-fit hosts (dialog, popover, float, flex item) with FR-009's bound; a short sheet in a dialog at 1280 px
    in two columns; a sheet loaded at 360 px then widened to 1200 px in two columns (PLAN-CORRECTNESS-1-003 (a));
  - the resize body (600 → 300 → 600 px);
  - the hook: invalid (`24 rem`), a percentage and 0, each at 320 px, stacked; and the page scroll width at 320 px
    with the probes present (PLAN-A11Y-SECURITY-1-004);
  - inside a `data-ocelle-density="compact"` region: values at 14 px and 1.5; in a `regular` region nested in it:
    17 px and 1.45; `density="compact"` alone: values at 17 px, row gap `--ocelle-space-1`
    (PLAN-CORRECTNESS-1-002 (b));
  - the import of `ocelle-facts.js` alone defines `ocelle-fact` (entry test, PLAN-CORRECTNESS-1-012 (a));
  - unset properties write no attribute (`density`, and `label` and `wrap` on a fact) (PLAN-CORRECTNESS-1-011 (a)).
- **empty state:**
  - slots filled and emptied after first render; several actions at 320 px (SPEC-2-07);
  - heading only, actions only, and visual plus text: the first present part starts at the block padding edge, the
    last ends at it, and each gap is R-04's for that pair (PLAN-CORRECTNESS-1-009);
  - unset `variant` writes no attribute.
- **progress:**
  - `value-text` ignored while indeterminate and kept when clamped (SPEC-2-02);
  - a `value` set, then removed: the mark is 40% of the track, with and without reduced motion (PLAN-CORRECTNESS-1-005);
  - right-to-left indeterminate: at the start of the sweep the mark is at the inline-start (right) side and moves
    towards the left; the determinate fill grows from the right (PLAN-CORRECTNESS-1-004);
  - at a 320 px viewport, motion not reduced, the page scroll width equals the viewport width while the sweep runs
    (sampled at several animation times) (PLAN-CORRECTNESS-1-006);
  - `ground="tinted"`: the track boundary colour resolves to `--ocelle-color-accent-strong`; unset, to
    `--ocelle-color-control-border` (US3-13);
  - unset properties write no attribute (`size`, `ground`).

## CSS-only behaviours (PLAN-TESTABILITY-1-008)

Stryker does not mutate declarations inside a `css` template, so each behaviour that lives only in CSS has a plant, or
a stated reason why its expected value differs from the browser default and from the other variant:

| Behaviour | Body | Plant, or reason |
|---|---|---|
| label column capped at 50% | long-label body | plant: `fit-content(50%)` replaced by `auto` |
| value column never widened | US1-3 | plant: `minmax(0, 1fr)` replaced by `1fr` |
| stacking | US1-2, resize | plant: the probe removed |
| probes add no overflow | 320 px probe body | plant: `block-size: 1px` on the probe |
| row gaps, default and compact | US1-9 | reason: both are asserted in one body, differ from each other and from the grid default (0) |
| right-to-left columns | RTL body | reason: the label's inline position is asserted in LTR and RTL in one body |
| value type and figures | US1-5 | reason: 17 px differs from the 16 px default; `tabular-nums` differs from `normal` |
| compact-region value scale | compact-region body | plant: the two hook declarations removed from `base.css`'s compact rule |
| wrap policy on the value only | US1-3, standalone wrap body | plant: the `wrap` rule removed; reason for the label: `normal` is asserted beside the value's `anywhere` |
| facts forced colours | US1-8 | reason: system colours differ from the token colours read in the same body |
| empty-state gaps and padding | US2-3, US2-4, present-parts bodies | plant: the "last present part has no margin" rule removed; reason: default and panel values are asserted in one body and differ |
| heading weights | US2-3, US2-4 | reason: 600 and 500 differ from each other and from the user-agent heading's 700 |
| progress bar width in `visual` | US2-7 | plant: the `::slotted(ocelle-progress)` rule removed |
| empty-state forced colours | US2-8 | reason: system colours differ from the token colours |
| track clip | 320 px sweep body | plant: `overflow: clip` removed |
| block sizes | US3-9 | reason: default 8 px and compact 4 px in one body |
| mark edge | US3-7 | plant: the inset shadow removed |
| tinted boundary | US3-13 | plant: the `ground="tinted"` rule removed |
| forced-colours fill | US3-8 | plant: the fill's `box-shadow: none` removed |
| still mark | US3-5, US3-12 | plant: the still-mark inset removed |
| bounded sweep | US3-12 | plant: `infinite` restored |
| right-to-left sweep | RTL indeterminate body | plant: the right-to-left keyframes rule removed |
| determinate direction | RTL determinate body | reason: the fill's inline-start edge is asserted at the left in LTR and the right in RTL in one body |
| visible label figures | US3-10 | reason: `tabular-nums` differs from `normal` |
| facts before upgrade (`@ocelle/styles`) | styles browser test | plant: the rule removed from `base.css` |

## Driver additions (PLAN-TESTABILITY-1-013, PLAN-CORRECTNESS-1-013, PLAN-TESTABILITY-1-006)

`test/scenarios/driver.ts` has none of these, and `test/browser/serve.ts` fixes the viewport at 1280 × 800. Each is
added to the `Driver` interface, implemented in `test/in-process.ts` and `test/browser/driver.ts`, and tested on its
own (in `test/commands.test.ts` for the Vitest commands, in the driver tests otherwise), in the red commit of the
first phase that uses it:

| Addition | What it does | Phase |
|---|---|---|
| `viewport(width, height)` | sets the page's viewport (Vitest browser `page.viewport()`; Playwright `setViewportSize` on the fixture page) | 1 |
| `scrollWidth()` | the document element's scroll width | 1 |
| `layout(id)` | the layout-settle wait (R-02) | 1 |
| `copy(id)` | selects the element's rendered text, performs a user copy, returns the copy event's `text/plain` | 1 |
| `move(id, parentId)` | moves an element under another parent (or to the body) | 1 |
| `pressTab()`, `focused()` | presses Tab; returns the focused element through shadow roots | 2 |
| `reducedMotion(mode)` | the command `emulateReducedMotion`: `page.emulateMedia({ reducedMotion })` in `emulate()`, so forced colours do not clear it; reset in each progress test file's `afterEach`; its test asserts `matchMedia` after the command, after a later `emulateForcedColors` call, and after the reset | 3 |
| `animations(id)` | running animations and transitions on the element and its shadow subtree, with play state and end time | 3 |
| AX value properties | `AxNode`, `axNodes` and `axSubtree` carry `value`, `valuemin`, `valuemax` and `valuetext`; tested on a native `<progress>` and an ElementInternals bar | 3 |

## Contrast (SC-004, PLAN-CORRECTNESS-1-007 (b))

- **No new rows.** `packages/tokens` does not change. Every pair the progress bar makes is an existing row: the mark
  on canvas, sheet, pane, panel, inspector and rail through `color-focus` (`ref: ["color-accent-strong"]`), on inset,
  accent-low, hover-bg and the state grounds through `color-accent-strong`'s own rows, and the track boundary through
  `color-control-border` (default) or `color-accent-strong` (`ground="tinted"`) on the grounds each declares (R-06).
  No pinned count, no A.8 transcription and no comment in `gates/` or `source.ts` changes, so nothing outside the
  test path is in a red commit (PLAN-CORRECTNESS-1-008).
- **A pairing test, in two halves (PLAN-CORRECTNESS-1-015)**, as 005 split `brand-pairs`:
  - `test/node/progress-pairs.test.ts` reads the element source (`src/ocelle-progress.ts`): the mark and edge token
    is `color-accent-strong`, the track ground is `color-inset`, the boundary tokens are `color-control-border` and
    (under `ground="tinted"`) `color-accent-strong`; it then checks against `source.ts` and `pairs.json` that
    `color-focus`'s `ref` is `color-accent-strong` in both themes and that every (token, ground) pair the bar can make,
    for the grounds the README assigns to each `ground` value, is a `checked` row;
  - `test/build/build.test.ts` reads `dist/ocelle-progress.js` and asserts the shipped stylesheet uses the same
    tokens.

## Story test (I3)

`storybook/test/integration/elements-stories.test.ts` gains each phase's stories (research R-08) in that phase's red
commit. Each new story must be present in the built index, render its element in light and dark, and have no CSP
violation and no outside request. It also checks, on every story of the four elements (PLAN-TESTABILITY-1-010,
PLAN-A11Y-SECURITY-1-005):
- every facts story at a 320 px viewport: page scroll width equals the viewport width (SC-002), paired with the
  sheet's rendered inline size above 0;
- every story under reduced motion: no running animation or transition (SC-005), paired with a running animation on
  the indeterminate progress story without reduced motion;
- every story: each progressbar node in its accessibility tree has a non-empty name, paired with the count of
  progressbar nodes in the progress and panel-loading stories being above 0. Plant: one story's `label` removed.

## `@ocelle/styles` tests (phase 1)

- `packages/styles/test/browser/compact.test.ts`: inside a compact region `--ocelle-facts-value-size` and
  `--ocelle-facts-value-line-height` resolve to the compact size and line height, and inside a nested regular region
  to `--ocelle-font-size-fact` and `--ocelle-line-height-normal`.
- A browser test on an undefined `ocelle-facts` (no element module loaded): each `ocelle-fact` child is a block, one
  per line; once the elements are defined, the rule no longer matches.
- `packages/styles/test/readme.test.ts`: the README statements for both.

## Gates touched

| Gate | What changes |
|---|---|
| `manifest` | Four new declarations, regenerated and committed. |
| `style-lint` (`token-only`) | New `css` templates and `base.css` rules. One recorded allowance (R-10): `fit-content(<percentage>)` and `minmax(0, <flex>)` in `grid-template-columns` (phase 1), `translateX(<percentage>)` in `transform` and a bare integer `animation-iteration-count` (phase 3), with unit tests in red, and the allowance, its plants and its `gates/README.md` row in green. |
| `prefix` | New source, stories and build output: no `sk-`, no monospace. |
| `csp` | Storybook checks on the new stories. Run-time CSP on the fixture pages. |
| `contrast` | Unchanged: no row added (PLAN-CORRECTNESS-1-007 (b)). |
| `mutation` | New element source, in process; Timeout and CompileError are reported and pass (#23). CSS-only behaviours are covered by plants (above). |
| `test-lint` | New tests. |
| `visual`, `axe`, `storybook-build` | #10's, not on `main`: see research R-08. |
