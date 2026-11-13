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
  failing after 10 frames. The stacking and probe plants are run with this wait. A body resizes the host 600 → 300 →
  600 px and asserts two columns, one column, two columns.
- **The measure pass owns the class (PLAN-FRESH-3-002).** A 300 px block sheet (stacked) is resized to 290 px; after
  the layout wait it is still one column (the `<dl>`'s computed `grid-template-columns` is one track and each value is
  below its label). Plant: the class not restored after the measure (the pass toggles `stacked` only when the decision
  changes); this body must fail.
- **Re-decide triggers (US1-12, PLAN-FRESH-3-001 (c)).** Each body compares the changed sheet with a fresh load of
  the same content in the same space, and asserts the fresh load's layout (two columns) as well, so it cannot pass on
  a sheet that stacks everywhere. The content is the one phase 1's spike fixes (R-02): its two-column size is above
  the threshold at 1200 and 1280 px and its stacked size below it.
  - widen: the pair "Created by op" / "Ada Lovelace and Charles Babbage" in a `showModal()` dialog, loaded at a 360 px
    viewport (one column), widened to 1200 px: two columns, as a load at 1200 px;
  - relabel: the pair "Id" / the same value in a dialog at 1280 px (one column), relabelled "Created by operator":
    two columns, as a fresh load;
  - value text: the same stacked sheet with its value's text node changed in place (the driver's `text`, a
    `characterData` change) to a longer text whose two-column size crosses the threshold: two columns, as a fresh
    load.
  Plant: the extra triggers removed (the pass runs only from the host and probe `ResizeObserver` and on `layout`);
  the widen and relabel bodies must fail. A second plant, `characterData` removed from the observer, must fail the
  value-text body.
- **Unobserved changes (FR-009, PLAN-FRESH-3-001 (c)).** For each case phase 1's spike names as outside the guarantee
  (R-02 § Changes the pass does not observe), a body makes that change twice, once with `layout="columns"` and once
  with an inline size on the sheet, and asserts the chosen layout after the change (the consumer's remedy the README
  gives), paired with the automatic layout of a fresh load in the changed space. If the spike names no such case,
  there is no body and the README says history independence holds in every measured host.
- **Copy (US1-4, PLAN-TESTABILITY-1-012).** The driver selects the rendered value's text and performs a user copy;
  the body reads the copy event's `clipboardData.getData("text/plain")` and asserts it equals the 64-character
  identifier. The same body asserts US1-3's wrap (the value spans more than one line box). Plant: a copy of
  `ocelle-fact` that inserts U+200B every 16 characters into its value; US1-4 must fail.

**Progress (US3).**
- **No fill transition (US3-2, PLAN-FRESH-3-003 (b)).** US3-2 reads the fill's inline size after `settle()` (one
  frame after the change) and asserts 75% of the track, with `animations()` on the bar empty in the same read (the
  bar is determinate, so nothing may run on it). The value-removed body reads the 40% mark's inline size after
  `settle()`, with and without reduced motion, and in the same read asserts that `animations()` on the bar holds no
  `CSSTransition` and nothing whose target is the fill's inline size. It does not assert `animations()` empty: without
  reduced motion the bar is indeterminate in a new loading episode, so its mark runs the sweep (a `CSSAnimation` on
  `transform`, R-06), which is correct. Under reduced motion `animations()` is also empty (US3-5). Plant: a 200 ms
  `inline-size` transition on the fill (`--ocelle-motion-base`); US3-2 must fail on its 75% read and on `animations()`,
  and the value-removed body must fail on its 40% read and on the `CSSTransition`.
- **Value properties (US3-1 to US3-4, US3-6; PLAN-TESTABILITY-1-006).** `AxNode` carries `value`, `valuemin`,
  `valuemax` and `valuetext` (§ Driver additions). Every absence assertion sits beside a presence read of the same
  property for a determinate bar in the same body.
- **Value text (US3-3).** The oracle is picked in phase 3's spike among platform reads only (R-05). No
  `internals` reflection read. If no platform read exposes it, US3-3 goes to the operator before the red commit.
- **Reduced motion (US3-5, PLAN-TESTABILITY-1-009).** The body reads running animations and transitions on the
  element's subtree (`getAnimations`, § Driver additions): none under reduced motion, paired in the same body with at
  least one running animation on the mark without reduced motion, and the still mark's geometry (30% to 70% of the
  track). Both reads fall inside the first sweep iteration after the mount (which starts a fresh loading episode,
  § Driver additions), the reduced-motion read first, so "none" cannot come from a sweep that has already ended.
  Plant: the still-mark inset removed. Removing `animation: none` is an equivalent change (the duration is already
  0 ms under reduced motion), recorded, not a plant.
- **Bounded sweep (US3-12, PLAN-A11Y-SECURITY-1-001 (a)).** Without reduced motion, the mark's animation has a finite
  end time below 5000 ms (`effect.getComputedTiming().endTime`); after `finished` resolves the subtree has no running
  animation and the mark has the still mark's geometry. Plant: `infinite` restored.
- **One sweep per loading episode (US3-14, US3-15, PLAN-FRESH-2-005 (a), PLAN-FRESH-3-004 (a)).**
  - US3-14: after a fresh mount an indeterminate bar is shown; 2 s later the driver's `replace` swaps it for a new
    indeterminate bar (a new node, in one task, as an htmx swap does). The body asserts a running animation on the new
    bar right after the swap (it joined the window), then, 5 s after the first bar was shown, no running animation on
    any bar and the still mark's geometry. Plant: the shared start dropped (each animation keeps its own start);
    US3-14 must fail.
  - Within one episode: after the window, a bar made determinate and indeterminate again within one task (one
    `setProperty` of `value` and its removal before a frame) shows no running animation at once, paired with the still
    mark's geometry.
  - US3-15: after the window, the only bar is removed (the driver's `remove`), the driver waits two animation frames
    (`frames(2)`), and a new indeterminate bar is inserted (`replace` on a placeholder): a running animation on the
    new bar, whose end time is below 5000 ms after its own start. Paired in the same body with the still mark on the
    first bar before its removal. Plant: the episode never ends (the start kept for the document); US3-15 must fail.
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
  - shrink-to-fit hosts (dialog, popover, float, default flex item, a flex row with a 400 px fixed sibling, a grid
    `auto` track, a table cell) with FR-009's bound; a sheet with the spike's named content (R-02, "Created by op" /
    "Ada Lovelace and Charles Babbage" or its lengthened form) loaded at 360 px then widened to 1200 px in each, with
    the same layout as loaded at 1200 px (PLAN-CORRECTNESS-1-003 (a), PLAN-FRESH-2-001 (c), PLAN-FRESH-3-001 (c));
  - the re-decide trigger bodies (widen, relabel, value text), the 300 → 290 px measure-pass body and the
    unobserved-change bodies of § Oracles (US1-12, PLAN-FRESH-3-001 (c), PLAN-FRESH-3-002);
  - `layout` (US1-11, FR-013, PLAN-FRESH-2-001 (c)): a short sheet in a dialog at 1280 px, one column without
    `layout` and two columns with `layout="columns"`; `layout="stacked"` in a 600 px block container, one column;
    `layout="columns"` at a 320 px viewport, two columns with the page scroll width equal to the viewport width; an
    unknown value (`layout="grid"`) acting as unset; removing `layout` returning to the automatic layout;
  - the resize body (600 → 300 → 600 px);
  - the hook fallbacks: invalid (`24 rem`), a percentage and 0, each at 320 px, stacked; and the page scroll width at
    320 px with the probes present (PLAN-A11Y-SECURITY-1-004);
  - a valid hook where the default gives the opposite result (PLAN-FRESH-2-003): a 300 px sheet with the hook at
    15rem in two columns, and a 600 px sheet with the hook at 40rem stacked;
  - the hook changed at run time (PLAN-FRESH-2-004): a sheet held at 450 px, hook 15rem (two columns), then 40rem
    (one column) with no resize of the sheet, asserted after the layout wait;
  - inside a `data-ocelle-density="compact"` region: values at 14 px and 1.5; in a `regular` region nested in it:
    17 px and 1.45; `density="compact"` alone: values at 17 px, row gap `--ocelle-space-1`
    (PLAN-CORRECTNESS-1-002 (b));
  - the import of `ocelle-facts.js` alone defines `ocelle-fact` (entry test, PLAN-CORRECTNESS-1-012 (a));
  - unset properties write no attribute (`density` and `layout`, and `label` and `wrap` on a fact)
    (PLAN-CORRECTNESS-1-011 (a)).
- **empty state:**
  - slots filled and emptied after first render; several actions at 320 px (SPEC-2-07);
  - heading only, actions only, and visual plus text: the first present part starts at the block padding edge, the
    last ends at it, and each gap is R-04's for that pair (PLAN-CORRECTNESS-1-009);
  - hidden slotted content (US2-9, PLAN-FRESH-2-007 (a)): an action slotted with `hidden` leaves the body as the last
    present part (no gap below it), and removing `hidden` brings the action back with the body-to-actions gap; a
    slotted `<div hidden>` as the only visual leaves the heading at the block padding edge; default-slot text changed
    from whitespace to words makes the text part present. Plant: the `hidden` observer removed;
  - unset `variant` writes no attribute.
- **progress:**
  - `value-text` ignored while indeterminate and kept when clamped (SPEC-2-02);
  - a `value` set, then removed: the mark is 40% of the track, with and without reduced motion, and no `CSSTransition`
    runs on the bar; the sweep animation may run without reduced motion (PLAN-CORRECTNESS-1-005, PLAN-FRESH-3-003);
  - right-to-left indeterminate: at the start of the sweep the mark is at the inline-start (right) side and moves
    towards the left; the determinate fill grows from the right (PLAN-CORRECTNESS-1-004);
  - one sweep per loading episode: US3-14, the determinate-then-indeterminate body within one task after the window,
    and US3-15 (PLAN-FRESH-2-005 (a), PLAN-FRESH-3-004 (a));
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
| stacking | US1-2, resize | plant: the `stacked` class's one-column rule removed |
| threshold from a valid hook | valid-hook bodies (15rem at 300 px, 40rem at 600 px) | plant: the hook probe ignored (the default probe's measure always used); each valid-hook body must fail |
| threshold fallback | hook-fallback bodies (invalid, percentage, 0 at 320 px) | plant: the default probe removed (no fallback); each fallback body must fail |
| threshold change without resize | hook-change body (450 px) | plant: the probes not observed (only the host); the hook-change body must fail |
| `layout` override | US1-11 | reason: one and two columns are asserted for the same short sheet in one body, and `stacked` in a container where the automatic layout gives two columns |
| probes add no overflow | 320 px probe body | plant: `block-size: 1px` on the probe |
| row gaps, default and compact | US1-9 | reason: both are asserted in one body, differ from each other and from the grid default (0) |
| right-to-left columns | RTL body | reason: the label's inline position is asserted in LTR and RTL in one body |
| value type and figures | US1-5 | reason: 17 px differs from the 16 px default; `tabular-nums` differs from `normal` |
| compact-region value scale | compact-region body | plant: the two hook declarations removed from `base.css`'s compact rule |
| wrap policy on the value only | US1-3, standalone wrap body | plant: the `wrap` rule removed; reason for the label: `normal` is asserted beside the value's `anywhere` |
| facts forced colours | US1-8 | reason: system colours differ from the token colours read in the same body |
| empty-state gaps and padding | US2-3, US2-4, present-parts bodies | plant: the "last present part has no margin" rule removed; reason: default and panel values are asserted in one body and differ |
| hidden slotted content | US2-9 | plant: the `hidden` observer removed (presence counted from `slotchange` only) |
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
| no fill transition | US3-2, value-removed body | plant: a 200 ms `inline-size` transition on the fill |
| one sweep per loading episode (element logic, listed here with its plants) | US3-14, US3-15 | plants: the shared start dropped (US3-14); the episode never ends (US3-15) |
| right-to-left sweep | RTL indeterminate body | plant: the right-to-left keyframes rule removed |
| determinate direction | RTL determinate body | reason: the fill's inline-start edge is asserted at the left in LTR and the right in RTL in one body |
| visible label figures | US3-10 | reason: `tabular-nums` differs from `normal` |
| facts before upgrade (`@ocelle/styles`) | styles browser test | plant: the rule removed from `base.css` |
| hidden fact before upgrade (`@ocelle/styles`) | styles browser test (hidden fact) | plant: `:not([hidden])` removed from the rule |

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
| `text(id, value)` | sets the data of the element's first text node (a `characterData` change, not a `childList` one) and waits for the element's ancestors' updates (PLAN-FRESH-3-001 (c)) | 1 |
| `remove(id)` | removes an element from the page | 3 |
| `frames(n)` | waits `n` animation frames (PLAN-FRESH-3-004 (a)) | 3 |
| `replace(id, markup)` | replaces an element with new nodes parsed from markup, in one task, as an htmx swap does | 3 |
| episode reset in `mount` | each harness's `mount` deletes the document's loading-episode record (R-06), so every body starts as a fresh page even when the previous body left a bar connected; its test mounts an indeterminate bar, waits past the 4.2 s window (no running animation), mounts again and asserts a running sweep | 3 |
| `pressTab()`, `focused()` | presses Tab; returns the focused element through shadow roots | 2 |
| `reducedMotion(mode)` | the command `emulateReducedMotion`: `page.emulateMedia({ reducedMotion })` in `emulate()`, so forced colours do not clear it; reset in each progress test file's `afterEach`; its test asserts `matchMedia` after the command, after a later `emulateForcedColors` call, and after the reset | 3 |
| `animations(id)` | running animations and transitions on the element and its shadow subtree, with kind (`CSSAnimation` or `CSSTransition`), target part, animated property, play state and end time | 3 |
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
  the indeterminate progress story without reduced motion (PLAN-FRESH-2-009). The sweep ends 4.2 s after the page
  start with `animation-fill-mode: none`, and after PLAN-FRESH-2-005 (a) re-inserting the bar or making it
  determinate and then indeterminate does not restart it within a loading episode. So each of the two motion reads
  is taken on its own fresh load of the story (a new document, so a new episode) and within its first 1400 ms:
  - the read without reduced motion records the mark animation's `currentTime` and fails as "read outside the first
    iteration" when it is 1400 ms or more;
  - the reduced-motion read has no mark animation to time (R-06: `animation: none`), so it is timed by the clock
    (PLAN-FRESH-3-005): the test records `performance.now()` in the page as soon as the story's element has first
    rendered, and the read, in one evaluation, takes `performance.now()` again and fails as "read outside the first
    iteration" when it is 1400 ms or more after the first; asserts `matchMedia("(prefers-reduced-motion:
    reduce)").matches`, so an emulation that silently did not apply fails loudly; and only then asserts no running
    animation or transition.
  A slow machine thus fails loudly instead of passing or failing on timing, and "no running animation" cannot be the
  result of a sweep that already ended or of a missing emulation;
- every story: each progressbar node in its accessibility tree has a non-empty name, paired with the count of
  progressbar nodes in the progress and panel-loading stories being above 0. Plant: one story's `label` removed.

## `@ocelle/styles` tests (phase 1)

- `packages/styles/test/browser/compact.test.ts`: inside a compact region `--ocelle-facts-value-size` and
  `--ocelle-facts-value-line-height` resolve to the compact size and line height, and inside a nested regular region
  to `--ocelle-font-size-fact` and `--ocelle-line-height-normal`.
- A browser test on an undefined `ocelle-facts` (no element module loaded): each `ocelle-fact` child is a block, one
  per line; a child with `hidden` computes `display: none` and has no box (no client rects, its text not in the
  sheet's `innerText`) (PLAN-FRESH-2-002); once the elements are defined, the rule no longer matches. Plants: the rule
  removed; `:not([hidden])` removed.
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
