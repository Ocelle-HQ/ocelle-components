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
| US2-2 | the heading's level | the heading is laid out in the element's column: centred in the column (`part="body"`) and below the visual |
| US2-6 | the button's tab stop | the button sits in the actions part, below the text, centred in the column |
| FR-011 link in a fact | the link's tab stop | the link's box is inside the value column (`<dd>`), right of the label column |
| US1-4 | the value's text is unchanged | the copy oracle below, paired with US1-3's wrap |
| US1-19 | the link's tab stop and the consumer's text | each value's box is inside its own cell, below its label, in the grid's column for its source position |
| US2-10 | the eyebrow `<p>` before the heading in AX order | the eyebrow's computed type (12 px, 500, ink-muted, upper case) and its gap to the heading, written in markup after the heading |
| US2-11 | two paragraphs one after the other | no user-agent margin on either and the `--ocelle-space-2` gap between them (the light DOM alone gives 1em margins), read against the default-slot area (the internal `.text` wrapper), not `part="body"` |
| visual and eyebrow body (FR-025) | the parts in AX order if the markup were in that order | the markup is written heading, body, eyebrow, visual, so the order visual, eyebrow, heading, body in the column and in the AX tree proves the slotting, with the visual-to-eyebrow gap |
| inline-content body (FR-026) | text, a link and text on one line in the light DOM | three block boxes separated by `--ocelle-space-2` (the light DOM alone gives one line box), beside a `<p>` with the same content on one line box |

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
- **Layout settle (US1-1 to US1-3, US1-9, the resize bodies; PLAN-TESTABILITY-1-003; operator decision "(a) Defer
  + 2-frame wait", 2026-11-14).** The driver's `layout` wait (R-02): after `updateComplete`, wait at least 2
  animation frames, then read once per animation frame until two consecutive frames give the same geometry, failing
  after 10 frames. The measure pass from the `ResizeObserver` runs one frame after the callback, so a wait that
  compares from the first frame can return on the old layout (measured in phase 1's spike); the old layout showing for
  one frame after an observed resize is accepted and no body asserts the layout within that frame. Every body that
  reads a layout after a resize, a hook change or a dialog reopened uses this wait. The stacking and probe plants are
  run with this wait. A body resizes the host 600 → 300 → 600 px and asserts two columns, one column, two columns.
- **No `ResizeObserver` loop error (R-02, operator decision "(a) Defer + 2-frame wait").** The error is a `window`
  `error` event with no error object: Playwright's `console` and `pageerror` events do not record it, so the fixture
  harness cannot see it, and Vitest's in-process harness logs it as `console.error`. The assertion therefore lives in
  the in-process harness (`packages/elements/test/facts.test.ts`): around a run of flips (the host resized 600 → 300
  → 600 px in a block container; the widen case in a `showModal()` dialog, 360 → 1200 px; the hook changed 15rem →
  40rem → 15rem at a fixed 450 px width; a `layout="grid"` sheet resized 300 → 600 → 800 px), each read with the
  layout wait, the test records every `window` `error` event (capture phase) and every `console.error` call, and
  asserts that none carries "ResizeObserver loop". Paired: the same test asserts each flip happened (the layout or
  column count after each step), and that the recorder sees a synthetic `ErrorEvent` with that message dispatched by
  the test itself, so it cannot pass on a recorder that sees nothing. Plant: the measure pass run synchronously inside
  the `ResizeObserver` callback (no `requestAnimationFrame`); this test must fail.
- **The measure pass owns the class (PLAN-FRESH-3-002).** A 300 px block sheet (stacked) is resized to 290 px; after
  the layout wait it is still one column (the `<dl>`'s computed `grid-template-columns` is one track and each value is
  below its label). Plant: the class not restored after the measure (the pass toggles `stacked` only when the decision
  changes); this body must fail.
- **Re-decide triggers (US1-12, PLAN-FRESH-3-001 (c)).** Each body compares the changed sheet with a fresh load of
  the same content in the same space, and asserts the fresh load's layout (two columns) as well, so it cannot pass on
  a sheet that stacks everywhere. The content is the one phase 1's spike fixes (R-02): its two-column size is above
  the threshold at 1200 and 1280 px and its stacked size below it, each by at least 16 px (operator decision "Widen
  the margin", 2026-11-14): at most 368 px where the body expects one column, at least 400 px where it expects two,
  at the 384 px default threshold. The spike measured "Created by op" / "Ada Lovelace and Charles Babbage" at only
  386.1 px, so the implementer re-chooses the widen content (and checks relabel and value text), re-measures it and
  records it in `reviews/phase-1/spike.md` and R-02; the names below are the pre-margin content, replaced by the
  recorded content where it differs.
  - widen: the pair "Created by op" / "Ada Lovelace and Charles Babbage" in a `showModal()` dialog, loaded at a 360 px
    viewport (one column), widened to 1200 px: two columns, as a load at 1200 px;
  - relabel: the pair "Id" / the same value in a dialog at 1280 px (one column), relabelled "Created by operator":
    two columns, as a fresh load;
  - value text: the same stacked sheet with its value's text node changed in place (the driver's `text`, a
    `characterData` change) to a longer text whose two-column size crosses the threshold: two columns, as a fresh
    load.
  Plant: the extra triggers removed (the pass runs only from the host and probe `ResizeObserver` and on `layout`);
  the widen and relabel bodies must fail; the bodies wait for the first decision (the layout wait after mount) before
  they act, since under the plant the first decision comes from the observer alone (spike § 4). A second plant, `characterData` removed from the observer, must fail the
  value-text body.
- **Unobserved changes (FR-009, PLAN-FRESH-3-001 (c)).** For each case phase 1's spike names as outside the guarantee
  (R-02 § Changes the pass does not observe), a body makes that change twice, once with `layout="columns"` and once
  with an inline size on the sheet, and asserts the chosen layout after the change (the consumer's remedy the README
  gives), paired with the automatic layout of a fresh load in the changed space. The spike named one case
  (`reviews/phase-1/spike.md` §§ 5 and 7): **a sheet in a consumer's CSS grid `auto` track whose neighbour is
  removed.**
  - Two-column layout: a sheet with the round 3 widen content in the `auto` track of a 600 px consumer grid beside a
    neighbour, the neighbour removed. With `layout="columns"`: two columns after the change; with an inline size on
    the sheet (at least 400 px): two columns after the change; paired with a fresh load of the same content in the
    track without the neighbour, automatic, two columns.
  - Grid layout: a `layout="grid"` sheet with the US1-18 content in the `auto` track of a consumer grid at a 1000 px
    viewport, the neighbour removed. With an inline size on the sheet (at least 2 × T): four columns after the
    change; paired with a fresh load without the neighbour, four columns.
- **Copy (US1-4, PLAN-TESTABILITY-1-012).** The driver selects the rendered value's text and performs a user copy;
  the body reads the copy event's `clipboardData.getData("text/plain")` and asserts it equals the 64-character
  identifier. The same body asserts US1-3's wrap (the value spans more than one line box). Plant: a copy of
  `ocelle-fact` that inserts U+200B every 16 characters into its value; US1-4 must fail.

- **Grid structure (US1-13, FR-014, IQ-05 (b)).** US1-13 asserts the AX description list as US1-6 does (four terms
  and four definitions, each definition after its term, each definition holding its own fact's value) and the
  flat-tree structure axe reads in the grid: the `<dl>`'s element children are only `<div>` groups, each holding
  exactly one `<dt>` followed by one `<dd>`, one group per visible fact, in source order. Plant: the groups not
  rendered (the ungrouped A5 structure with the grid's tracks); US1-13 must fail on the structure and on the cell
  geometry.
- **Grid geometry (US1-13 to US1-18).** Read after the layout wait: the `<dl>`'s computed `grid-template-columns`
  track count (4, 2 or 1) and equal track sizes; each group's box (its row and column from its block and inline
  start), each `<dt>`'s box above its `<dd>`'s box in the same cell (block end at or above the value's block start,
  inline starts aligned); no two groups' boxes intersecting; the page scroll width against the viewport. US1-13 also
  reads the grid's spacing as exact token values from `packages/tokens/src/source.ts` (analysis G2): the
  label-to-value gap (a `<dt>`'s block end to its `<dd>`'s block start) is `--ocelle-space-1`, and the column gap
  (one group's inline end to the next group's inline start in the same row) is `--ocelle-space-4`; and FR-014's "no
  ground, divider or border": the `<dl>`, each group, `<dt>` and `<dd>` compute a transparent `background-color`
  and `border-*-style: none`, read beside a sibling `<div>` in the same body that a page rule gives a ground and a
  border, read as non-default, so the read cannot pass on a reader that returns defaults. US1-14
  asserts two columns at 600 px and one at 320 px in one body, so the plants below fail on a count, not on timing.
  US1-15 asserts the empty tracks of the one- and three-fact sheets at 1280 px (the first cell a quarter of the
  sheet's content box less the gaps). US1-17 asserts the first group's inline-end edge at the sheet's right edge under
  `dir="rtl"`, beside the left edge in a left-to-right sheet in the same body. US1-18 compares the widened dialog with
  a fresh load at 1280 px and asserts the fresh load's column count (four) as well, so it cannot pass on a sheet that
  is one column everywhere; the content is the one phase 1's spike fixes for US1-12 (its four-column size at 1280 px
  is at least 2 × T and its size at 360 px below T; the spike lengthens it if not).
  Plants: the four-column rule removed (US1-13 fails), the grid layout's two-column rule removed (US1-14 fails), the
  four-column point at T instead of 2 × T (the 600 px half of US1-14 fails: four columns at 600 px), the grid
  measure read in the decided layout instead of four columns (US1-18 fails), the grid `<dt>`'s `margin-block-end`
  removed (US1-13 fails on the label-to-value gap), and a divider added as a `border-block-end` on each group
  (US1-13 fails on the border read).
- **Label type (US1-5, FR-006; analysis G4).** The US1-5 body also reads a label's computed style in the same sheet:
  font family through `--ocelle-font-sans`, size `--ocelle-font-size-sm`, weight `--ocelle-font-weight-medium`,
  colour `--ocelle-color-ink-muted` (R-03), and asserts the label's size and weight each differ from the value's
  (`--ocelle-font-size-fact`, `--ocelle-font-weight-regular`) and its colour from the value's `--ocelle-color-ink`.
  Expected values come from `packages/tokens/src/source.ts`.

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
  `valuemax` and `valuetext` (§ Driver additions). `valuetext` reads `""` in Chromium (phase 3 spike) and no body
  asserts a value text on it. Every absence assertion sits beside a presence read of the same property for a
  determinate bar in the same body.
- **Indeterminate inputs (US3-6, FR-032; analysis G8).** Besides below 0, above max, `NaN` and `max` ≤ 0, the US3-6
  body sets `value=""` and `value="   "` (each indeterminate: no current value exposed, the indeterminate mark shown,
  not a 0-width fill) and, after a determinate value, the property to `null` (indeterminate again), each paired in
  the same body with a determinate bar's value read and with no exception thrown.
- **Value text (US3-3; operator decision on the phase 3 spike, (a)).** No platform read exposes the value text
  (`reviews/phase-3/spike.md`, R-05), so the body proves the wiring, not the exposure: with `value-text="7 of 12"` and
  `show-label`, the visible `value-text` part reads "7 of 12", paired in the same body with the progressbar's name,
  value, min and max read from the accessibility tree; it is absent while the bar is indeterminate and kept when the
  value is clamped (SPEC-2-02's bodies). No `internals` reflection read. The README states that the library's tests
  do not verify the value text's exposure to assistive technology.
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
- **Sizes and label position (US3-9, FR-034, FR-035; analysis G3).** In one body, two bars with `label` and
  `show-label`: at the default size the track's block size is 8 px and the label's box is above the track (its block
  end at or above the track's block start, their inline starts aligned); with `size="compact"` the track is 4 px and
  the label's box is beside the track on the same line (their block ranges overlap and their inline ranges do not).
  With a determinate value and `value-text` on the compact bar, the value text's box is on the same line after the
  track's inline end (IQ-13 (b)).
- **Value text at the row's inline end (US3-10, FR-035, IQ-13 (b)).** With `label`, `show-label`, a determinate
  value and `value-text` at the default size, in a 400 px host: the label's inline start equals the track's, the
  value text's inline end equals the track's, and both boxes are above the track; under `dir="rtl"` in the same body
  the label's box is at the right and the value text's at the left. Plant: the value text's `margin-inline-start:
  auto` removed (it follows the label); US3-10 must fail.
- **Fallback text (FR-039, IQ-15 (b)).** A bar with `label="Tasks done"`, `value="7"`, `max="12"` and the text
  "7/12" as its content: after upgrade the text node has no client rect, the page's `innerText` does not contain
  "7/12", and no accessibility node in the page has the name or text "7/12"; paired in the same body with the
  progressbar node named "Tasks done" with value 7. Plant: a default `<slot>` added to the shadow root (the text shown
  and exposed); this body must fail.
- **Inline placement (IQ-12 (a)).** In one body: a bar's host computes `display: block`; a second bar inside a
  paragraph, given `display: inline-block; inline-size: 12rem` by a page rule, has a 12rem box whose block range
  overlaps the paragraph's first line box, beside the text before it.
- **No tab stop (FR-039; analysis G7).** A button before and a button after a bar: from the first button, one Tab
  moves focus to the second (the driver's `pressTab` and `focused`), paired in the same body with the bar's
  progressbar node exposed with its name, so the bar is present and skipped.
- **Mark colour (US3-7).** Plant: the `accent-strong` inset shadow removed.
- **Forced colours (US3-8, PLAN-A11Y-SECURITY-1-006).** The track's outline colour and the fill's background are
  system colours and differ; the fill's computed `box-shadow` is `none`. Plant: the forced-colours `box-shadow: none`
  removed.

## Extra scenario bodies

From the spec check notes and squad round 1:
- **facts:**
  - no pairs (FR-010; analysis G1): an `ocelle-facts` with no `ocelle-fact` child (empty, and with only whitespace)
    renders no box with an inline or block size above 0 in its shadow root, its subtree in the AX tree holds no list,
    term or definition, and no error is reported; in the same body one `ocelle-fact` is then added and the AX tree
    holds one description list with one term and one definition;
  - a very long label (FR-005, edge case "Very long label"; analysis G2): in a 600 px sheet in two columns, a pair
    whose label is several sentences long: the label column's inline size equals 50% of the sheet's content box, the
    label spans more than one line box and breaks only between words, and the value column takes the rest (its
    inline start at the label column's end plus the column gap); a short-label pair in the same sheet sits in the
    same columns;
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
    "Ada Lovelace and Charles Babbage" or the form re-chosen for the 16 px margin) loaded at 360 px then widened to
    1200 px in each, with
    the same layout as loaded at 1200 px (PLAN-CORRECTNESS-1-003 (a), PLAN-FRESH-2-001 (c), PLAN-FRESH-3-001 (c));
  - the re-decide trigger bodies (widen, relabel, value text), the 300 → 290 px measure-pass body and the
    unobserved-change bodies of § Oracles (US1-12, PLAN-FRESH-3-001 (c), PLAN-FRESH-3-002);
  - `layout` (US1-11, FR-013, PLAN-FRESH-2-001 (c)): a short sheet in a dialog at 1280 px, one column without
    `layout` and two columns with `layout="columns"`; `layout="stacked"` in a 600 px block container, one column;
    `layout="columns"` at a 320 px viewport, two columns with the page scroll width equal to the viewport width; an
    unknown value (`layout="table"`; `grid` is now a value, FR-014) acting as unset; removing `layout` returning to
    the automatic layout;
  - the grid layout (US1-13 to US1-19, FR-014, IQ-05 (b)) with the oracles of § Oracles; also: `layout` changed from
    `grid` to `columns` and back after render (structure and slots re-assigned, AX list unchanged); `density="compact"`
    with `layout="grid"` (row gap `--ocelle-space-1`, column gap unchanged); a hidden fact in the grid (no cell); the
    probes' hook at 15rem on a 600 px grid sheet (four columns, 600 ≥ 2 × 240) to show both points move with the hook;
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
  - slots filled and emptied after first render; several actions at 320 px, with a long heading and a long body in
    the same element (SPEC-2-07; edge case "Long empty-state heading or body at 320 px", analysis G6): the page
    scroll width equals the viewport width, heading and body each span more than one line box and break only between
    words, and each stays inside the element's content box;
  - heading only, actions only, and visual plus text: the first present part starts at the block padding edge, the
    last ends at it, and each gap is R-04's for that pair (PLAN-CORRECTNESS-1-009);
  - hidden slotted content (US2-9, PLAN-FRESH-2-007 (a)): an action slotted with `hidden` leaves the body as the last
    present part (no gap below it), and removing `hidden` brings the action back with the body-to-actions gap; a
    slotted `<div hidden>` as the only visual leaves the heading at the block padding edge; default-slot text changed
    from whitespace to words makes the text part present. Plant: the `hidden` observer removed;
  - eyebrow only, and eyebrow plus actions: the eyebrow at the block padding edge and, with no heading, the
    eyebrow-to-actions gap; with a heading, the eyebrow-to-heading gap (R-04's table, both variants) (IQ-08 (c));
  - a visual and an eyebrow (FR-025; analysis G1): a visual, an eyebrow, a heading and a body paragraph, written in
    markup as heading, body, eyebrow, visual. In the column the order is visual, eyebrow, heading, body (each part's
    block start below the previous part's block end) and in the AX tree the same; the gap from the visual's block
    end to the eyebrow's block start is `--ocelle-space-3`, and `--ocelle-space-5` with `variant="panel"`, both in
    one body;
  - an eyebrow and body text with no heading (FR-025; analysis G1): the eyebrow at the block padding edge, and the
    gap from its block end to the paragraph's block start `--ocelle-space-2`, `--ocelle-space-3` in the panel, both
    in one body;
  - inline content in the default slot (edge case "Empty-state body with inline content", FR-026; analysis G3): a
    text run, an `<a>` and a text run placed directly in the default slot give three block boxes, one below the
    other, separated by `--ocelle-space-2`; in the same body a single `<p>` holding the same text and link is one
    line box;
  - US2-10 and US2-11 as § Bodies that the platform alone could pass. US2-11's oracle reads the default-slot area,
    the internal `.text` wrapper's box (or the first and last slotted elements' edges against it), not `part="body"`,
    which is the whole column and has the heading and the block padding before the first paragraph (analysis I2);
  - unset `variant` writes no attribute.
- **progress:**
  - `value-text` ignored while indeterminate and kept when clamped (SPEC-2-02), read on the visible `value-text`
    part with `show-label`: absent while indeterminate, "7 of 12" when clamped, paired with a determinate bar's part
    read (US3-3);
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
  - a long label beside a compact bar at 320 px (edge case; analysis G5): `size="compact"`, `show-label` and a label
    of several sentences, at a 320 px viewport: the track's inline size is at least the `--ocelle-measure-cell` value
    (from `source.ts`), the label wraps between words, and the page scroll width equals the viewport width;
  - no tab stop (FR-039), as in § Oracles;
  - unset properties write no attribute (`size`, `ground`);
  - the fallback-text body and the inline-placement body of § Oracles (IQ-15 (b), IQ-12 (a)).

## CSS-only behaviours (PLAN-TESTABILITY-1-008)

Stryker does not mutate declarations inside a `css` template, so each behaviour that lives only in CSS has a plant, or
a stated reason why its expected value differs from the browser default and from the other variant:

| Behaviour | Body | Plant, or reason |
|---|---|---|
| label column capped at 50% | long-label body | plant: `fit-content(50%)` replaced by `auto` |
| value column never widened | unbroken-value body (600 px two-column sheet, a 64-character value without `wrap`) | plant: the value tracks' `minmax(0, 1fr)` replaced by `1fr` (two-column and stacked) and the `<dd>`'s `min-inline-size: 0` removed, together; each of the two changes alone is equivalent (either rule alone keeps the column's minimum at 0; reviews/phase-1/plants.md § Resolution, operator decision (b)) |
| stacking | US1-2, resize | plant: the `stacked` class's one-column rule removed |
| threshold from a valid hook | valid-hook bodies (15rem at 300 px, 40rem at 600 px) | plant: the hook probe ignored (the default probe's measure always used); each valid-hook body must fail |
| threshold fallback | hook-fallback bodies (invalid, percentage, 0 at 320 px) | plant: the default probe removed (no fallback); each fallback body must fail |
| threshold change without resize | hook-change body (450 px) | plant: the probes not observed (only the host); the hook-change body must fail |
| `layout` override | US1-11 | reason: one and two columns are asserted for the same short sheet in one body, and `stacked` in a container where the automatic layout gives two columns |
| probes add no overflow | 320 px probe body | plant: `block-size: 1px` on the probe |
| row gaps, default and compact | US1-9 | reason: both are asserted in one body, differ from each other and from the grid default (0) |
| right-to-left columns | RTL body | reason: the label's inline position is asserted in LTR and RTL in one body |
| value type and figures | US1-5 | reason: 17 px differs from the 16 px default; `tabular-nums` differs from `normal` |
| label type | US1-5 | reason: the label's size, weight and colour are asserted beside the value's in one body, and each pair differs (14 px vs 17 px, 500 vs 400, ink-muted vs ink) |
| compact-region value scale | compact-region body | plant: the two hook declarations removed from `base.css`'s compact rule |
| wrap policy on the value only | US1-3, standalone wrap body | plant: the `wrap` rule removed; reason for the label: `normal` is asserted beside the value's `anywhere` |
| facts forced colours | US1-8 | reason: system colours differ from the token colours read in the same body |
| empty-state gaps and padding | US2-3, US2-4, present-parts bodies | plant: the "last present part has no margin" rule removed; reason: default and panel values are asserted in one body and differ |
| hidden slotted content | US2-9 | plant: the `hidden` observer removed (presence counted from `slotchange` only) |
| heading weights | US2-3, US2-4 | reason: 600 and 500 differ from each other and from the user-agent heading's 700 |
| progress bar width in `visual` | US2-7 (phase 3, real bar) | plant: the `::slotted(ocelle-progress)` rule removed, run in phase 3 only (T052): phase 2's stand-in is not an `ocelle-progress`, so the rule cannot match it (analysis U2) |
| empty-state forced colours | US2-8 | reason: system colours differ from the token colours |
| eyebrow type | US2-10 | plant: the `::slotted([slot="eyebrow"])` type rule removed (16 px, 400, ink, no upper case) |
| eyebrow gaps | US2-10, eyebrow present-parts bodies, eyebrow and text body | plant: the eyebrow's heading-dependent class ignored (the `space-2` gap before a heading); reason: default and panel are asserted in one body, and the eyebrow-to-text gap (`space-2`, panel `space-3`) differs from the eyebrow-to-heading gap (`space-1`, panel `space-2`) |
| eyebrow below the visual, visual-to-eyebrow gap | visual and eyebrow body | reason: the order is set by the template, and the markup is written in another order; the gap is the visual's margin (`space-3`, panel `space-5`), asserted in both variants in one body and different from 0 |
| body margins reset | US2-11 | plant: the `::slotted(:not([slot]))` `margin-block: 0` removed (1em user-agent margins return) |
| body gap | US2-11, inline-content body | plant: the text wrapper's `gap` removed (the two paragraphs touch, and the three blocks of the inline-content body touch) |
| grid tracks | US1-13, US1-14 | plants: the four-column rule removed; the grid layout's two-column rule removed |
| grid label-to-value gap | US1-13 | plant: the grid `<dt>`'s `margin-block-end` removed (the label touches the value) |
| grid column gap | US1-13 | reason: the exact `--ocelle-space-4` value is asserted, and differs from a grid's default column gap (0) |
| grid paints no ground, divider or border | US1-13 | plant: a divider added as a `border-block-end` on each group; reason for the ground: a transparent `background-color` is read beside a sibling's non-default ground in the same body |
| grid cell (label above value) | US1-13 | plant: the groups not rendered (§ Oracles, grid structure) |
| grid compact row gap | grid compact body | reason: the compact and default row gaps are asserted in one body and differ |
| grid right-to-left | US1-17 | reason: the first cell's edge is asserted at the left in LTR and the right in RTL in one body |
| value text at the inline end | US3-10 | plant: the value text's `margin-inline-start: auto` removed |
| content inside the bar not shown | fallback-text body | plant: a default `<slot>` added to the shadow root |
| track clip | 320 px sweep body | plant: `overflow: clip` removed |
| block sizes | US3-9 | reason: default 8 px and compact 4 px in one body |
| label above or beside the bar | US3-9 | reason: the label's box is above the track at the default size and on the same line at compact size, in one body |
| track minimum length | compact long-label body at 320 px | plant: the track's `min-inline-size` removed |
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
| `layout(id)` | the layout-settle wait (R-02): at least 2 animation frames, then one read per frame until two consecutive frames give the same host and `<dl>` geometry, failing after 10 | 1 |
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
| `changeAttributes(id, changes)` | sets and removes attributes of one element in order, in one task, then waits for every element to render; its body shows a set-then-removed attribute reaches an observer as one delivery of two records | 3 |
| `textOf(id, inner)` | the text content of the first shadow element matching `inner`, or null; its body reads a shadow `dt` and a missing element | 3 |
| `rendered(id)` | the element's `innerText` and the client-rect count of a range over its contents; its body tells slotted from unslotted light-DOM text | 3 |
| `property(id, name)` | a property's value as the page holds it; its body reads a number input's `valueAsNumber`, `value` and a missing property | 3 |
| `events(id, during)` | runs `during` with `EventTarget.prototype.dispatchEvent` wrapped on the page, restores it, and returns the types of the events dispatched on the element, its shadow root or a node in it, in order (review round 1, R1-01: US3-2's "no event is emitted"); its body shows a host CustomEvent and a shadow event listed, another element's not | 3 |
| `animations(id)` and `setProperty` widened | `animations(id)` also reports each entry's `currentTime`; `setProperty` also takes a number, a boolean or null (US3-6's `null`) | 3 |
| AX value properties | `AxNode`, `axNodes` and `axSubtree` carry `value`, `valuemin`, `valuemax` and `valuetext`; `value`, `valuemin` and `valuemax` tested present and absent on a native `<progress>` and an ElementInternals bar; `valuetext` reads `""` in Chromium and is not asserted (phase 3 spike) | 3 |

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
commit. Each new story must be present in the built index, render its element in light and dark, and make no outside
request. Since #10 the Storybook is served with no CSP and the test counts no violation (006 FR-020); run-time strict
CSP is proven on the element package's fixture pages (FR-055). It also checks, on every story of the four elements (PLAN-TESTABILITY-1-010,
PLAN-A11Y-SECURITY-1-005):
- every facts story at a 320 px viewport, the grid stories included: page scroll width equals the viewport width
  (SC-002), paired with the sheet's rendered inline size above 0;
- every story under reduced motion: no running animation or transition (SC-005), paired with a running animation on
  the indeterminate progress story without reduced motion (PLAN-FRESH-2-009). In phases 1 and 2 no story animates
  yet, so the facts and empty-state reduced-motion reads are paired only with the `matchMedia` assertion; the
  animation positive arrives with the indeterminate progress story in phase 3 (T044), and from then on the check on
  every story runs beside it (analysis G9). The sweep ends 4.2 s after the page
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
| `prefix` | New source, tests, stories and build output: no `sk-`, no monospace. The README mapping (FR-058) holds the `.sk-*` family names in Markdown, which the gate skips; the readme tests assert the mapping rows by role name and hold no `sk-` string, built directly or indirectly (operator decision I1, "Roles, not sk- names", tasks gate; R-11). |
| `csp` | The built output of `@ocelle/elements` (since 006 FR-020 no Storybook file is in its scope). Run-time CSP on the fixture pages. |
| `contrast` | Unchanged: no row added (PLAN-CORRECTNESS-1-007 (b)). Run in each of phases 1 to 3 (expected unchanged), since US1-8, US2-8 and US3-7 rely on the existing rows. |
| `mutation` | New element source, in process; Timeout and CompileError are reported and pass (#23). CSS-only behaviours are covered by plants (above). |
| `test-lint` | New tests. |
| `storybook-build` | #10's (on `main`, 3828d2f). Builds the new stories; `built <n> stories` grows by each phase's stories. |
| `visual` | #10's. Every new story in light and dark against its baseline in `storybook/baselines/`, committed in the phase's green commit from `pnpm run visual:update` in the pinned container; no existing baseline changes (research R-08). |
| `axe` | #10's, axe-core 4.14.0. Every new story in light and dark with no serious or critical violation or incomplete result, and no `storybook/a11y-exceptions.json` entry added (research R-08). The progress name is not checked by axe (R-05). |
| `plants` | The `pass-repository` plants of `storybook-build`, `visual` and `axe` run on the repository's stories and baselines, the new ones included. |
