# Phase 4 plants (T061; R-17)

Each plant was applied to the working tree, its tests run, and every file it touched restored byte for byte (the
bytes read before the change written back, then `git diff --exit-code` on those files clean) before the next plant.
Nothing planted was committed. The runner applied each plant as an exact text replacement and ran the named Vitest
project and file in process (`elements`, the project Stryker mutates); the output is summarised below (Vitest
truncates long test names). The plants are the ones T047 and T048 name; T049 names none.

Every plant was run twice: first on the green commit `45a828e`, then on `306a2e3`, the code after the guards and the
simplifications of § Guards (the second run is the one tabled in full; L7's last edit was rewritten for the simplified
slot read). Both runs bite with every plant.

| # | Guard | Plant | Result |
|---|---|---|---|
| L1 | US3-1 and US3-2 in forced colours, both palettes (T047) | `packages/elements/src/ocelle-list-detail.ts`: the border rules placed inside `@media not (forced-colors: active)` | `elements packages/elements/test/list-detail.test.ts`: 2 failed | 41 passed (43); fails: US3-1 and US3-2 in forced colours (ligh…; US3-1 and US3-2 in forced colours (dark…<br>first run, on `45a828e`: 2 failed | 35 passed (37) |
| L2 | US3-4 (T047) | `packages/elements/src/ocelle-list-detail.ts`: `detail-open` applied in every tier (the list hidden whenever `detail-open` is set) | `elements packages/elements/test/list-detail.test.ts`: 3 failed | 40 passed (43); fails: US3-4: in Frame W with detail-open the …; US3-6, focus not moved: with focus outs…; US3 guard: the tier follows the element…<br>first run, on `45a828e`: 2 failed | 35 passed (37) |
| L3 | US3-6, focus not moved (T047) | `packages/elements/src/ocelle-list-detail.ts`: focus moved on every switch: whenever `detail-open` changes or the shown panes change, focus goes to the first shown pane, wherever it was | `elements packages/elements/test/list-detail.test.ts`: 2 failed | 41 passed (43); fails: US3-6, focus not moved: with focus outs…; US3-16: every kind of list-detail of th…<br>first run, on `45a828e`: 2 failed | 35 passed (37) |
| L4 | US3-6 at rest (T047) | `packages/elements/src/ocelle-list-detail.ts`: the pane wrappers focusable at all times (`tabindex="-1"` in the template on each wrapper) | `elements packages/elements/test/list-detail.test.ts`: 6 failed | 37 passed (43); fails: US3-6 at rest: in Frame N no pane wrapp…; US3-6 by keyboard in light: in one colu…; US3-6 by keyboard in dark: in one colum…; US3-6, focus not moved: with focus outs…; US3-7: in two columns with focus in the…; US3 guard: with focus on a pane itself,…<br>first run, on `45a828e`: 5 failed | 32 passed (37) |
| L5 | US3-6 by keyboard, light and dark (T047) | `packages/elements/src/ocelle-list-detail.ts`: the default outset ring (`outline-offset: var(--ocelle-focus-offset)`, base.css's offset) | `elements packages/elements/test/list-detail.test.ts`: 4 failed | 39 passed (43); fails: US3-6 by keyboard in light: in one colu…; US3-6 by keyboard in dark: in one colum…; US3-6 in forced colours (light palette)…; US3-6 in forced colours (dark palette):…<br>first run, on `45a828e`: 4 failed | 33 passed (37) |
| L6 | US3-8 (T047) | `packages/elements/src/ocelle-list-detail.ts`: the inspector always rendered (its pane, track and border whether or not the slot has an element) | `elements packages/elements/test/list-detail.test.ts`: 2 failed | 41 passed (43); fails: US3-8: in Frame R with nothing in the i…; US3 guard: an empty list-detail in Fram…<br>first run, on `45a828e`: 1 failed | 36 passed (37) |
| L7 | US3-8 (T047) | `packages/elements/src/ocelle-list-detail.ts`: the `inspector` slot rendered only when an inspector is present (presence read from the light DOM at each update, not from the slot) | `elements packages/elements/test/list-detail.test.ts`: 2 failed | 41 passed (43); fails: US3-8: in Frame R with nothing in the i…; US3-16: every kind of list-detail of th…<br>first run, on `45a828e`: 2 failed | 35 passed (37) |
| L8 | US3-9 (T047) | `packages/elements/src/list-detail-measure.ts`: the page scrolls: the grid's minimum set to the three-column figure (the max-content figure written as `min-inline-size`) | `elements packages/elements/test/list-detail.test.ts`: 13 failed | 30 passed (43); fails: US3-3: in Frame N only the list shows, …; US3-4: in Frame W with detail-open the …; US3-6 by keyboard in light: in one colu…; US3-6 by keyboard in dark: in one colum…; US3-9: in Frame S one pane at a time sh…; US3-11 (with base.css): in Frame W a de…; US3-12, 636 px row: in a 636 px row the…; US3-12, table cell: in a cell of a 636 …; US3-12, stale content: in the 1196 px r…; US3-12, unseen change: in the 1196 px r…; US3-12, unseen change: in the 1196 px r…; US3 guard: in a 200 px row the element …; US3 guard: a host-set tier change measu…<br>first run, on `45a828e`: 11 failed | 26 passed (37) |
| L9 | US3-10 (T047) | `packages/elements/src/ocelle-list-detail.ts`: any length the browser can resolve accepted: the attribute's value resolved by a probe styled with it, before the grammar | `elements packages/elements/test/list-detail.test.ts`: 1 failed | 42 passed (43); fails: US3-10: in Frame W the accepted collaps…<br>first run, on `45a828e`: 1 failed | 36 passed (37) |
| L10 | US3-12, 1196 px row and 636 px row (T047) | `packages/elements/src/list-detail-measure.ts`, `packages/elements/src/ocelle-list-detail.ts`: an intrinsic size that follows the tier shown: no sizer, no grid minimum, and the panes not contained, so CSS sizes the element from the shown panes | `elements packages/elements/test/list-detail.test.ts`: 12 failed | 31 passed (43); fails: US3-12, 1196 px row: as a default flex …; US3-12, 636 px row: in a 636 px row the…; US3-12, dialog: in an open <dialog> as …; US3-12, stale content: in the 1196 px r…; US3-12, content change: in the 1196 px …; US3-12, content change: in the 1196 px …; US3-12, unseen change: in the 1196 px r…; US3-12, unseen change: in the 1196 px r…; US3-12, a mutation inside a ResizeObser…; US3 style and sheets: no element of the…; US3 guard: in a 200 px row the element …; US3 guard: a host-set tier change measu…<br>first run, on `45a828e`: 10 failed | 27 passed (37) |
| L11 | US3-12, stale content and the two content-change cases: the frame records (T047) | `packages/elements/src/list-detail-measure.ts`: the measurement pass split across a `requestAnimationFrame` (the measurement grid set in one frame, read and restored in the next) | `elements packages/elements/test/list-detail.test.ts`: 16 failed | 27 passed (43); fails: US3-5: in Frame W with narrow the eleme…; US3-7: in two columns with focus in the…; US3-8: in Frame R with nothing in the i…; US3-12, 1196 px row: as a default flex …; US3-12, 636 px row: in a 636 px row the…; US3-12, dialog: in an open <dialog> as …; US3-12, table cell: in a cell of a 636 …; US3-12, stale content: in the 1196 px r…; US3-12, content change: in the 1196 px …; US3-12, content change: in the 1196 px …; US3-12, unseen change: in the 1196 px r…; US3-12, unseen change: in the 1196 px r…; US3-12, a mutation inside a ResizeObser…; US3-16: every kind of list-detail of th…; US3 style and sheets: no element of the…; US3 guard: a host-set tier change measu…<br>first run, on `45a828e`: 15 failed | 22 passed (37) |
| L12 | US3-12, the two content-change cases (T047) | `packages/elements/src/list-detail-measure.ts`: the shown-pane `ResizeObserver` as the trigger (round 1): a `ResizeObserver` on the panes' assigned elements whose callback runs the pass, in place of the `MutationObserver` | `elements packages/elements/test/list-detail.test.ts`: 11 failed | 32 passed (43); fails: US3-12, 1196 px row: as a default flex …; US3-12, 636 px row: in a 636 px row the…; US3-12, dialog: in an open <dialog> as …; US3-12, stale content: in the 1196 px r…; US3-12, content change: in the 1196 px …; US3-12, content change: in the 1196 px …; US3-12, unseen change: in the 1196 px r…; US3-12, unseen change: in the 1196 px r…; US3-12, a mutation inside a ResizeObser…; US3-16: every kind of list-detail of th…; US3 style and sheets: no element of the…<br>first run, on `45a828e`: 11 failed | 26 passed (37) |
| L13 | US3-12, the two unseen changes (T047) | `packages/elements/src/ocelle-list-detail.ts`: `remeasure()` as a no-op | `elements packages/elements/test/list-detail.test.ts`: 2 failed | 41 passed (43); fails: US3-12, unseen change: in the 1196 px r…; US3-12, unseen change: in the 1196 px r…<br>first run, on `45a828e`: 2 failed | 35 passed (37) |
| L14 | US3-12, the class-swap unseen change (T047) | `packages/elements/src/list-detail-measure.ts`: `attributes` observed by the `MutationObserver` | `elements packages/elements/test/list-detail.test.ts`: 2 failed | 41 passed (43); fails: US3-12, unseen change: in the 1196 px r…; US3 guard: a host-set tier change measu…<br>first run, on `45a828e`: 1 failed | 36 passed (37) |
| L15 | US3-12, a mutation inside a ResizeObserver callback (T047) | `packages/elements/src/list-detail-measure.ts`: the pass run in the `MutationObserver` callback | `elements packages/elements/test/list-detail.test.ts`: 1 failed | 42 passed (43); fails: US3-12, a mutation inside a ResizeObser…<br>first run, on `45a828e`: 1 failed | 36 passed (37) |
| L16 | US3-15 (T047) | `packages/elements/src/ocelle-list-detail.ts`: `:host([hidden])` removed | `elements packages/elements/test/list-detail.test.ts`: 1 failed | 42 passed (43); fails: US3-15: a hidden list-detail has no box…<br>first run, on `45a828e`: 1 failed | 36 passed (37) |
| L17 | the once-per-frame pass (T048) | `packages/elements/src/list-detail-measure.ts`: one pass per `MutationObserver` delivery (each request asks for its own animation frame) | `elements packages/elements/test/list-detail-pass.test.ts`: 1 failed | 4 passed (5); fails: runs once in the frame after three light-DOM changes made in three tasks before that frame, and once more for a change in a later frame<br>first run, on `45a828e`: 1 failed (1) |

## Plants of the review fixes (rounds 1 and 2)

Added in round 2 (round-2.md R2-03): the plants of the review fixes are recorded here, not only in the round's fixes
note, and each `listDetailFixes` scenario and each review guard of `list-detail-pass.test.ts` names its plant beside
it. L18 and L19 are round 1's (round-1-fixes.md), run again on the round 2 code; L20 to L26 are new. Every plant was
run on the round 2 fix's working tree with the same runner as above (an exact text replacement, the named files run
in process in `elements`: `list-detail.test.ts`, `list-detail-pass.test.ts` and `list-detail-upgrade.test.ts`, 61
tests, 62 with the L27 guard), and each touched file restored byte for byte and compared with a saved copy before the next.

| # | Guard | Plant | Result |
|---|---|---|---|
| L18 | US3-12 "a mutation inside a ResizeObserver callback" (R1-03's design) | `ocelle-list-detail.ts`: the host's own border box observed (`this.#resize.observe(this, { box: "border-box" })`) in place of the edge box | 4 failed of 61: US3-12, a mutation inside a ResizeObserver callback (the loop message); US3-16; US3 review R2-01, a percentage inline padding (now seen, so not stale); the pass test review R2-01. Round 1's run also failed the US3-12 1196 px row, dialog and content-change cases; since round 2 the fresh measurement after each pass corrects the host's border box in the frame of the pass, so those cases no longer tell this plant apart, and the loop case still does |
| L19 | US3 review R1-03 | `ocelle-list-detail.ts`: the edge box not observed | 2 failed of 61: US3 review R1-03; US3 review R2-01, a host whose content box is narrower than its own inline padding and borders |
| L20 | US3 review R2-02 | `ocelle-list-detail.ts`: the edge box in flow (`position: absolute` removed) | 1 failed of 61: US3 review R2-02 (`empty: 600`, `letters: 592`: the floor back) |
| L21 | US3 review R1-02 | `ocelle-list-detail.ts`: the focused pane read from `document.activeElement` | 1 failed of 61: US3 review R1-02 |
| L22 | US3 review R2-01, percentage padding, and the pass test review R2-01 | `list-detail-measure.ts`: the step after a scheduled pass not run (`this.#after()` removed) | 2 failed of 61: US3 review R2-01, a percentage inline padding (stale after `remeasure()`); the pass test review R2-01 (`two` at the end of the frame) |
| L23 | US3 review R1-03 and R2-01, narrow host | `ocelle-list-detail.ts`: the edge box observed in its content box (always 0 px wide) | 2 failed of 61: US3 review R1-03; US3 review R2-01, a host whose content box is narrower |
| L24 | US3 review R2-01, narrow host (no overflow) | `ocelle-list-detail.ts`: the edge box 1 px tall | 1 failed of 61: US3 review R2-01, a host whose content box is narrower (the positioned scroll container then scrolls past the host's 240 px border box) |
| L25 | US3 review R2-02, the empty max-content case | `ocelle-list-detail.ts`: no pass scheduled at the first render | 1 failed of 61: US3 review R2-02 (an empty list-detail never runs a pass, so its sizer keeps the `<svg>` default 300 px: 702 px, not 691) |
| L26 | the pass test guard "a list-detail inserted from a task in Frame R keeps three columns through its first pass" | `ocelle-list-detail.ts`: the fresh measurement after a pass reads no content box (it keeps the last one the observer reported) | 1 failed of 61: that guard (the grid shows `one` and then `three` again within the first frame, before the observer first reports). Without the guard this plant survived every test; the guard was added after green and the plant is its proof |
| L27 | the scenario guard "a slot change after the first render measures again" | `ocelle-list-detail.ts`: no pass scheduled at a slot change (`this.#measure.schedule()` removed from `#slotChanged`) | 1 failed of 62: that guard (`after: 1073`, not 1196). The first mutation run of the round 2 fix reported this mutant surviving: since the first render schedules a pass (L25), the slot change at the first render no longer told it apart, and no test changed a slot later in a shrink-to-fit host. The guard was added after green; the surviving mutant is its proof |

Every plant bites. The round 2 red tests (`7c640bb`) failed on the code before the fix for the defects themselves
(red-fix-2.log), and L20, L22 and L25 are the round 2 fix undone one part at a time.

## Plants of the landing-pass fix (operator round 5, O5-01; T082)

T078's plants, each run once on the fix's working tree with the same runner (an exact text replacement; in process in
`elements`: `list-detail.test.ts`, `list-detail-pass.test.ts`, `list-detail-upgrade.test.ts` and
`list-detail-first-render.test.ts`, 71 tests), each touched file restored byte for byte and compared with a saved copy
before the next. The red commit `243bd28` failed on the code before the fix for the defects themselves (red-fix-4.log:
the five O5-01 cases in both harnesses and the three README fragments). L31 is not one of T078's named plants: it is
the third part of the fix undone, the observer's not-rendered guard, and the last case is its guard.

| # | Guard | Plant | Result |
|---|---|---|---|
| L28 | US3-12 "not rendered at first" (four cases) and "hidden then remeasured" | `ocelle-list-detail.ts`: no pass scheduled when the element becomes rendered (`this.#measure.resume()` removed from the observer) | 6 failed of 71: the four first-render cases (300 px, the sizer's unmeasured `<svg>` default, in one column, min `0px`); the hidden case (shown again, its minimum stays `480px`, not `560px`); the pass guard O5-01 (no pass once shown) |
| L29 | US3-12 "hidden then remeasured", and the four first-render cases | `list-detail-measure.ts`: a pass that writes the figures it reads with no box (the `getClientRects()` guard removed) | 6 failed of 71: the four first-render cases (0 px in one column, the figures `0px`); the hidden case (`0px` while hidden, `y`'s figures changed, the loop message); the pass guard O5-01 |
| L30 | US3-12 "hidden then remeasured" | `ocelle-list-detail.ts`: `remeasure()` sets the measured size from a non-rendered probe (the guard in `#remeasured` removed: `NaN`) | 5 failed of 71: the hidden case (the two-column `y` shows `three` while hidden, from `NaN`); the four first-render cases (the window's "ResizeObserver loop" message once shown, the tier re-chosen from `NaN`) |
| L31 | US3-12 "hidden then remeasured" | `ocelle-list-detail.ts`: the observer takes the size of a probe that is not rendered (the early return replaced by `if (this.#rendered()) this.#measure.resume();`) | 1 failed of 71: the hidden case (`x` and `y` show `one` while hidden, from the missing box's 0 px) |

Guards added after green (the surviving mutants of the first `gate:mutation -- --base HEAD` and `--base 2caad68` runs
are their proof; red-first does not apply to them):

| Guard | Where | Mutants it kills |
|---|---|---|
| A list-detail resized while rendered runs no pass; hidden, a change runs none until it is shown, then one; hidden and shown again with nothing pending, none | `list-detail-pass.test.ts` | `list-detail-measure.ts`: the pending pass requested at every observation (`if (this.#pending)` replaced by `true`), or left pending after a pass (`this.#pending = false` replaced by `true`) |
| A list-detail removed with a change before and after the removal, then inserted again, runs no pass until the host calls `remeasure()`, and then one | `list-detail-pass.test.ts` | `list-detail-measure.ts` `disconnect()` emptied or its observer left on, `ocelle-list-detail.ts` `this.#measure.disconnect()` removed: since a pass on a grid with no box writes nothing, the removal guard above no longer saw them; the skipped pass then stays pending and runs at reinsertion |

Equivalent record: `list-detail-measure.ts`'s initial `#pending = false` (the first pass runs in an animation frame
before the probe's first observation, and a pass requested while one is requested is coalesced). Simplified instead:
`#rendered()` reads the one probe (`querySelector`), not every probe (`some` and `every` were equivalent).

## Plants of the round 6 fix (R6-01)

Run once on the fix's working tree with the same runner (an exact text replacement; in process in `elements`:
`list-detail.test.ts`, `list-detail-pass.test.ts`, `list-detail-upgrade.test.ts` and `list-detail-first-render.test.ts`,
72 tests), the touched file restored byte for byte and compared with a saved copy afterwards. The red commit `6f66c61`
failed on the code before the fix for the defect itself (red-fix-5.log: 3 of 3800, the new case in both harnesses and
guard 1).

| # | Guard | Plant | Result |
|---|---|---|---|
| L32 | US3-12 "hidden, changed unseen, then shown (R6-01)"; the pass guard O5-01 (`again`) | `ocelle-list-detail.ts`: the fix undone, the observer's not-rendered branch returns without `this.#measure.suspend()` (becoming rendered requests a pass only when a skipped pass left one pending) | 2 failed of 72: the R6-01 case (shown again, its minimum stays `480px`, not `560px`); the pass guard O5-01 (`again` 0, not 1) |

Guard 1 of `list-detail-pass.test.ts` changed in the red commit: it now hides and shows in separate frames, so the
observer sees the element with no box, and expects one pass (`again: 1`); it pinned the narrower trigger that R6-01
rejects. Guard 2 (reinsertion runs no pass until `remeasure()`) holds unchanged: `disconnectedCallback` disconnects the
observer synchronously, so a removed element gets no no-box observation, and the observation on reinsertion sees it
rendered with nothing pending. Mutation: `--base HEAD` (`6f66c61`) 7 mutants, none survived; `--base 2caad68` 336
mutants, none survived. No guard and no equivalent record was added.

## Judgement

All seventeen plants bite: each makes the scenario it guards fail, in process, on the green code and on the final code.

- **L1** fails only the two forced-colours border cases: outside forced colours the borders are unchanged.
- **L2** fails US3-4 (in Frame W the list is hidden by `detail-open`) and the focus case that sets `detail-open` in
  two columns.
- **L3** fails the paired "focus not moved" case of US3-6 (focus outside the element is pulled in) and US3-16, whose
  last switch moves focus by the same rule.
- **L4** fails the rest case of US3-6 (a `tabindex` on every wrapper, and a click on the list's text focuses its
  wrapper) and every case that reads the wrappers' `tabindex` after a switch.
- **L5** fails the keyboard cases (the outset ring's pixels are cut by the clipping frame and the offset reads 2 px)
  and the forced-colours ring cases (offset).
- **L6** and **L7** fail US3-8: with L6 the empty inspector takes its track (the detail is 604 px, not 908 px; on the
  final code the empty-element guard fails too); with L7 an inspector slotted after the first render never shows.
- **L8** fails US3-9 (the page scrolls at 320 px) and every case whose element is narrower than its three-column
  figure.
- **L9** fails US3-10 only: the rejected values that resolve as lengths move the threshold.
- **L10** fails the shrink-to-fit cases of US3-12: in the 1196 px row the element follows the list shown at its first
  layout and stays in one column.
- **L11** fails every case with a frame record of the tier (the record shows `max`, the measurement grid) and the
  cases whose layout is read in the frame after a host-set change.
- **L12** fails both content-change cases of US3-12 (the same-height case stays at 1073 px; the taller case brings
  the "ResizeObserver loop" message), as R-13 says, and the other cases where the pass now runs inside a
  `ResizeObserver` delivery.
- **L13** fails both unseen-change cases (1073 px after `remeasure()`); **L14** fails the class-swap case (seen
  before the call); **L15** fails the `ResizeObserver` append case (the loop message).
- **L16** fails US3-15.
- **L17** fails the once-per-frame count (three passes).

## Guards

The first mutation runs (`gate:mutation -- --base 2caad68 --files <shard>`, each CI shard of `--plan` in turn, on the
green code of `45a828e`) left mutants that no red test reached. Each guard below was added after the green
implementation (red-first does not apply to it: the surviving mutant is its proof that it can fail), and the next run
killed its mutants. Mutants that change nothing observable carry a `Stryker disable` record with the reason, and code
whose branch could not be reached was simplified instead.

| Guard | Where | Mutants it kills |
|---|---|---|
| The tier follows the element's border box: with inline padding and borders, `collapse-below="876px"` gives two columns in Frame W and `877px` one | `scenarios/list-detail.ts` (`listDetailGuards`, both harnesses) | `ocelle-list-detail.ts`: the host's inline padding and borders left out of the measured size, or subtracted |
| An empty list-detail in Frame R draws the list and detail columns and no inspector track | `scenarios/list-detail.ts` | `ocelle-list-detail.ts`: the inspector taken as present before any slot reports (first run; since the simplification below, `connectedCallback` reads the slot before the first render and the initial value is equivalent) |
| In a 200 px row the element is as wide as its one-column min-content (480 px) | `scenarios/list-detail.ts` | `list-detail-measure.ts`: the min-content figure not written, written to another property, or read in a tier other than `min` |
| In Frame R scaled by half the element keeps three columns, also after `detail-open` | `scenarios/list-detail.ts` | `ocelle-list-detail.ts`: the element's transformed box read as its size at every update |
| A host-set tier change measures first: after an unseen class swap, removing `narrow` shows 1196 px | `scenarios/list-detail.ts` | `ocelle-list-detail.ts`: no synchronous pass before a host-set change |
| With focus on a pane wrapper, the next switch moves it on, both ways | `scenarios/list-detail.ts` | `ocelle-list-detail.ts`: focus on a wrapper not seen as focus in that pane |
| A deep text node's data change runs one pass | `list-detail-pass.test.ts` | `list-detail-measure.ts`: `characterData` or `subtree` not observed |
| An element that leaves the slots is no longer observed | `list-detail-pass.test.ts` | `list-detail-measure.ts`: the observer not reset when the slots change |
| A removed list-detail runs no pass, and a pass requested just before is cancelled | `list-detail-pass.test.ts` | `list-detail-measure.ts`, `ocelle-list-detail.ts`: no disconnection of the observer or the frame request |
| A list-detail moved into Frame N measures again (one column, one pass for a change) | `list-detail-pass.test.ts` | `ocelle-list-detail.ts`: the probe and the slots not observed again on reconnection |
| In Frame R focus in the list is not moved at upgrade | `list-detail-upgrade.test.ts` | `ocelle-list-detail.ts`: the first layout chosen without the element's size |
| `55.25rem` is accepted | `tiers.test.ts` | `tiers.ts`: a fraction of one digit only |

Equivalent records (`Stryker disable next-line`, each with its reason in the source):

- `list-detail-measure.ts`: writing a figure that is already in force (`max !== this.#max`, `min !== this.#min`
  replaced by `true`).
- `ocelle-list-detail.ts`: an update with the size in force (`size === this.#measured`); Lit's own
  `disconnectedCallback` (no controller, no async directive); the probe's observer left on a detached element (it is
  observed again on connection); `.pane.undefined` matching no wrapper; the initial `#hasInspector`, which
  `connectedCallback` sets before the first render.
- `tiers.ts`: the empty string for an absent value (any rejected text gives none).

Simplified instead: the figure rules read with `cssRules.item()` (no unreachable throw); the tier restored with
`String(...)` (the grid always has one); the shadow observed in one method from `connectedCallback` and
`firstUpdated` (no `hasUpdated` branch); the focused pane looked up by slot name in a table; the wrapper's
`tabindex` removed on any `focusout` in it; `#hasInspector` set on every slot read; the grammar's unitless `0` told
by its missing unit alone; the probe observed in its default box (it has no padding or border).

## Gates of T061 (as in T030)

Run one at a time on the final code (`306a2e3`, the source of the guards commit; `gate:visual` and `gate:axe` ran on
`45a828e`, whose stories and baselines are unchanged since):

- `pnpm run gate:style-lint`: 20 files checked, no finding.
- `pnpm run gate:csp`: 15 files checked, no finding.
- `pnpm run gate:prefix`: 258 files checked, no finding.
- `pnpm run gate:manifest`: 6 elements checked, no finding.
- `pnpm run gate:mutation -- --base 2caad68`: 280 mutants on the changed lines of 4 files, none survived; 2 timeouts,
  100 compile errors, 1 zero-mutant entry (`src/index.ts`); 8 equivalent records; exit 0 in 446 s. Each CI shard of
  `--plan` (17 shards) was also run alone: the longest took 292 s, so no shard is over 10 minutes.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants`: 306 plants of 17 gates and the registry judged, every plant as
  expected (the visual `fail-token-changed` plant with the six new light list-detail story-themes, the manifest plant
  trees with the new entry, and the `storybook-build` empty-index plant with the new story file).
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual`: 88 captures match their baselines; `pnpm run gate:axe`: 88
  story-theme runs, 0 serious or critical.
