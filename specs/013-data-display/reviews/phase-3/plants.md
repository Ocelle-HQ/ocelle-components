# Phase 3 plants (T052 step 1, T052a)

Each progress plant of contracts/checks.md (§ Oracles (Progress), § CSS-only behaviours) run once on 2026-11-15
against the green source (`ff9a9ac`): `packages/elements/src/ocelle-progress.ts` (or, for the `::slotted` plant,
`packages/elements/src/ocelle-empty-state.ts`) edited as named, the shared bodies run in process
(`packages/elements/test/progress.test.ts`, 28 bodies, or `packages/elements/test/empty-state.test.ts`, 20 bodies),
then the file restored from a copy of the green source. Scratch runner in the session scratchpad; no plant is
committed. The story plant edits `storybook/stories/progress.stories.ts` and runs the story test's naming check.

| Plant | Guard named | Result |
|---|---|---|
| the still-mark inset removed (`inset-inline-start: 30%` of the indeterminate mark) | US3-5, US3-12 | bites: 6 bodies fail, US3-5 and US3-12 among them (the mark at 0% to 40%), and US3-6, US3-14, US3-15 and the one-episode body, which read the still mark too |
| `infinite` restored (`animation-iteration-count: infinite`) | US3-12 | bites: 5 bodies fail, US3-12 among them (end time `Infinity`), and US3-14, US3-15, the one-episode body and the mount-reset body, whose sweep never ends |
| the track clip removed (`overflow: clip`) | 320 px sweep body | bites: the 320 px sweep body fails (the page scroll width above 320 while the mark is past the track's end); the other 27 pass |
| the track `min-inline-size` removed | compact long-label body | bites: the compact long-label body fails (the track shrinks below `--ocelle-measure-cell`); the other 27 pass |
| the inset shadow removed (the fill's `accent-strong` edge) | US3-7 | bites: US3-7 fails, and US3-13, which reads the same paint |
| the tinted rule removed (`:host([ground="tinted"]) .track`) | US3-13 | bites: US3-13 fails (the boundary stays `control-border`); the other 27 pass |
| the forced-colours `box-shadow: none` removed from the fill | US3-8 | bites: US3-8 fails (the `accent-strong` edge kept under `forced-color-adjust: none`); the other 27 pass |
| the right-to-left keyframes removed (`:host(:dir(rtl))` rule) | right-to-left indeterminate body | bites: that body fails (the `dir="rtl"` mark moves left to right); the other 27 pass |
| the shared start dropped (no `startTime` set from the episode) | US3-14 | bites: US3-14 fails (the replacement starts its own sweep and still runs 5 s after the first bar); the other 27 pass |
| the episode never ends (the frame callback no longer deletes the record) | US3-15 | bites: US3-15 fails (the new bar joins the ended sweep and shows the still mark); the other 27 pass |
| a 200 ms fill `inline-size` transition added (`--ocelle-motion-base`) | US3-2, value-removed body | bites: both fail (the fill not at 75% or 40% at once, a `CSSTransition` on `inline-size`); the other 26 pass |
| the `::slotted(ocelle-progress)` rule removed from `ocelle-empty-state`, against the real bar (phase 2 review R1-03) | US2-7 | bites: US2-7 fails (the bar shrinks to its content in the centred column, not the smaller of the column and `--ocelle-measure-reading`); the other 19 empty-state bodies pass |
| a story's `label` removed (`elements-ocelle-progress--determinate` without `label`) | story test, progressbar names | bites: that story's naming check fails (`unnamed: 1`); the other 39 naming checks pass |
| T052a: the value text's `margin-inline-start: auto` removed | US3-10 | bites: US3-10 fails (the value text follows the label instead of ending at the track's inline end); the other 27 pass |
| T052a: a default `<slot>` added to the shadow root | fallback-text body | bites: the fallback-text body fails ("7/12" rendered and exposed); the other 27 pass |

Every plant bites. No plant needed a decision. Removing the reduced-motion `animation: none` is the equivalent change
contracts/checks.md records (the duration is already 0 ms under reduced motion), not a plant.
