# Phase 4 notes

## Plan decision 1 and the T060 measurement

Plan decision 1 was answered yes at the T059a stop (`decision-1.md`). The joined rows use custom states, and the
package's engine floor rises to Chromium 125 / WebKit 17.4. T062a, T064a, T066a and T067a are skipped. The README's
Engines section now names the floor and the feature, and the CHANGELOG records the raise.

T060 (`measure.md`) did not meet its stop condition:
- the rounding is settled when `afterResizeDelivery` resolves;
- a re-wrap at the same group size is seen;
- no resize-loop warning appears.

## The row states as built

R-06 names four states: `row-start`, `row-end`, `first-row` and `last-row`. The spec rounds each row on its own
(US3-10: Done, alone on row 2, is rounded on both ends), so only `row-start` and `row-end` change any paint. The
segment therefore sets only those two, plus a third state, `joined`.

`joined` exists because a segment's own stylesheet cannot see its parent's attribute. The joined margins, the square
inner corners and the joined pressed paint key on it.

The parent sets all three through one internal method under a module-private symbol (`rowStates`, `src/internals.ts`).
It calls the method only when the segment has it. The method is marked `@internal`, so the manifest does not list it.
`first-row` and `last-row` would have no observable effect, so they are not built.

## US2-21 with the real element (T062b)

`test/scenarios/tabs.ts` gains US2-21's body with an `ocelle-segmented-choice` in the selected Plan panel, run in both
harnesses. The phase 3 stand-in body (a nested `ocelle-tabs`) stays, as T062b asks. The in-process tabs harness
(`test/tabs.test.ts`) now imports the segmented choice. The body failed in the red run and passes now.

## Tests changed after the red commit

- `test/scenarios/segmented-choice.ts`, `resized()` and `measured()`: before each resize, the body now waits for a task
  in the page.
  - **Why.** The driver's `afterResizeDelivery` resolves inside a `ResizeObserver` callback. In process, the body went
    on in that callback's microtask, so the next resize happened during the delivery itself. Chromium then reported
    `ResizeObserver loop completed with undelivered notifications` for the test's own new observer on `#box`.
  - **The spec.** US3-10 resizes "in an ordinary task", and `measure.md` did the same. The fixture harness already
    resized in a task of its own: each driver step is a separate `page.evaluate`.
  - **Strictness.** The continuous-resize body's assertion is unchanged: no console message and no error event, with
    the rounding read at each delivery.
- `test/scenarios/segmented-choice.ts`, US3-11: the joined pressed bar under forced colours is now read from its
  computed style, not from its pixels.
  - **Why.** The emulated palette's `Highlight` is translucent (`rgba(5, 0, 73, 0.8)` in process). The bar's pixels
    are that colour blended with the ground, so no pixel can equal the resolved `Highlight`.
  - **What the body reads now.** The `::before` content; its block-end border, which is 3 px wide and `Highlight`; its
    inset `0px`, so the bar is inside the box; and the segment's own block-end line, 1 px.
  - **What it still reads from pixels.** The 1 px `ButtonBorder` line under the bar, the shared line and the top line.
  - **Plant.** "The bar as an inset box-shadow only" still fails it: the bar's border width is then `0px`.
- No other test changed. The scenario bodies, expected values and pairings of the red commit are otherwise unchanged.

## A behaviour fix found in green

The first green run failed US3-18's second case: a host rule widens Mine's inline-end padding with no DOM change. The
group observed content boxes, and a padding change leaves the content box as it was. It now observes border boxes
(`ResizeObserver` `box: "border-box"`). This is within green, before the green commit, so it is not a fix after review.

## Visual baselines under docker (T068)

By the operator's decision of 2026-11-14 (`reviews/phase-2/operator-decisions.md`), phase 4's baselines were produced
in #10's pinned container under docker with `pnpm run visual:update`. It wrote 18 files: the nine segmented-choice
stories, light and dark. No shared baseline changed or was removed, the token stories included.
`pnpm run gate:visual` then reported "90 captures match their baselines (docker only: no cross-engine comparison)".

No podman cross-engine check was possible in this session, because there is no podman. CI's `visual` gate, which runs
both engines, confirms the baselines at landing.

The story-theme and baseline counts that the gate tests pin moved from 72 to 90, and the stories from 36 to 45:
`visual.test.ts`, `plant-repo.test.ts`, `axe.test.ts` (92 with the plant story) and `storybook-build.test.ts`. The nine
light segmented-choice stories, each showing its segments' `color-ink` text, joined the findings of the
`visual/fail-token-changed` plant and its note (44 findings).

The baselines were inspected:
- the joined wrapped story rounds All's start, Blocked's end and Done's both ends, with one shared line between the
  rows;
- the hovered joined story draws Blocked's lines in `accent-strong` over its neighbours';
- the focused story's ring is drawn on all four sides beside the pressed All.

## Axe

`gate:axe`: 90 story-theme runs, 0 serious or critical, and 22 notes, all excepted (the Prose document's ten and the
scrolling listbox story's twelve). The segmented-choice stories add no finding and no exception;
`storybook/a11y-exceptions.json` is unchanged.

## The red run

`red-phase.log`: 185 of 3811 tests fail, every one with an `AssertionError`. The failing files are the phase's new and
changed tests.

`gates/test/integration/visual.test.ts:271` ("captures a story alone byte for byte ...") also fails in phase 1's and
phase 3's red logs. It is not a test of this phase.
