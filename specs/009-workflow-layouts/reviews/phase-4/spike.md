# Phase 4 spike: list-detail's measurement pass and sizer (T045, research.md R-13)

Run on 2026-11-14 at the phase base `2caad68`, in scratch files only (a prototype of `ocelle-list-detail`, its tier
rules and its measurement module, and one in-process test that printed its observations), with the in-process driver
of `packages/elements/test/in-process.ts` in Chromium 1248 (`pnpm exec vitest run --project elements`). The scratch
files were deleted after the run; nothing of them is committed. The green implementation (T054 to T056) follows the
prototype as it stood at the passing run.

## The prototype

- **Pass.** One animation-frame callback, scheduled at most once per frame from a `MutationObserver` on the assigned
  elements of the three slots (`childList`, `characterData`, `subtree`; no `attributes`), `slotchange` and
  `remeasure()`, and run synchronously in `willUpdate` before a `narrow`, `detail-open`, `collapse-below` or
  `inspector-below` change. It sets the grid's `data-tier` to a measurement tier `max` (the widest grid, every present
  pane shown, `inline-size: max-content`), reads the grid's inline size, sets `min` (the one-column stack as a block,
  `inline-size: min-content`), reads it, and restores the tier, all in the same callback.
- **Sizer.** The two figures go into the instance's one constructed sheet (`.sizer {}` and `.grid {}`, set through
  `CSSStyleRule.style.setProperty`, only when changed): the sizer's `inline-size` (max-content figure, capped by
  `max-inline-size: 100%`) and the grid's `min-inline-size` (min-content figure). No `style` attribute.
- **Host measurement.** A `ResizeObserver` gives the tier only, never runs the pass.

## Figures (all with `driver.messages()` empty)

| Case | R-13 / US3-12 expects | Measured |
|---|---|---|
| 1196 px flex row | 1073 px, three columns | 1073 px, `three`, the same tier on every frame of ten |
| 636 px flex row | 636 px, one column | 636 px, `one`, stable over ten frames |
| `<dialog open>` with `max-inline-size: var(--ocelle-dialog-max-inline)`, 1280 px viewport | three columns | 1073 px, `three`, stable |
| table cell of a 636 px table | one column | 630 px (the cell's padding and spacing), `one`, stable |
| stale content: `narrow`, the detail's inner content replaced by a 40rem block, then `narrow` removed | 1196 px, three columns | 1196 px while still `narrow` (the replacement is a light-DOM mutation, so the next frame's pass sees it), then 1196 px, `three` |
| content change, a 35rem block twice as tall | 1153 px in the first frame record after the change, three columns | first `resize:` entry after the change is 1153, `three` |
| content change, a 35rem block of the same height | as above | first `resize:` entry after the change is 1153, `three` |
| unseen: a property of a slotted element that renders a 40rem block in its shadow root (`narrow`) | 1073 px for ten frames, then 1196 px after `remeasure()` | 1073 on every frame of ten; first `resize:` after `remeasure()` is 1196, `one` |
| unseen: a class swap on the detail's light-DOM block that a page rule makes 40rem wide (`narrow`) | as above | as above |
| a slotted element that appends a 35rem block from its own `ResizeObserver` (`narrow`, then `detail-open`) | 1153 px after settle, the detail shown in one column, no error | 1153 px, `one`, the detail shown and the list `display: none`, no message |

In every frame record the grid's `data-tier` read only the old and the new tier (`one`, `three`), never `max` or
`min`: the measurement grid never reached a frame.

## What the spike changed in the prototype, and why

The figures above hold only with these three choices. Each was measured both ways; none changes a figure of R-13, so
the spike does not stop the phase (tasks.md, stop-and-ask point T050). They are design details inside R-13's decision,
recorded here and in the green commit.

1. **The sizer is an empty `aria-hidden` `<svg>`, not a `div`.** With a `div` sizer of `inline-size: 1073px` and
   `max-inline-size: 100%`, the 636 px row stayed at 1073 px and three columns, and the table cell at 1073 px: a
   percentage maximum does not count in a box's min-content contribution, so the sizer's 1073 px was also the
   element's min-content size. An `<svg>` is a replaced element, and a replaced element whose maximum size is a
   percentage contributes zero to min-content (CSS Sizing 3 § 5.2.2, compressible replaced elements), so the sizer
   gives the max-content figure only. With it the 636 px row shrinks to 636 px and the table cell to 630 px. The grid
   track that holds the sizer is `1fr` because `minmax(0, 1fr)` is a function, which `style-lint`'s `token-only` rule
   reports as raw; `1fr` is equivalent here because every grid item has `min-inline-size: 0` or no min-content.
2. **The tier is measured on a zero-height probe, not on the host.** With the host's own `ResizeObserver` on its
   border box, the `ResizeObserver` case reported "ResizeObserver loop completed with undelivered notifications.":
   the appended block grows the host's block size inside the slotted element's delivery, and the host is shallower
   than the slotted element. The tier needs the inline size only, so the element observes an `aria-hidden`
   `.probe` of `block-size: 0` before the grid, whose border box is the host's content box, and adds the host's
   inline padding and borders, read from its computed style, to give the host's border-box inline size
   (data-model.md `measured`). A block-size change no longer notifies the observer, and the case reports nothing.
   The fixture element of this case stops observing itself once it has appended its block; otherwise its own second
   notification, at its own depth, brings the message whatever the element does.
3. **The panes have `contain: inline-size` outside the measurement tiers.** Without it, a shown pane's content counts
   in the grid's own intrinsic size, so in three columns the same-height case reached 1153 px by CSS alone with the
   `MutationObserver` silenced (measured: first `resize:` 1153 without any pass). With it, the same run stays at
   1073 px on every frame, so the figures come from the pass alone and US3-12's plant "the shown-pane
   `ResizeObserver` as the trigger" can bite on the same-height case as R-13 says. The measurement tiers set
   `contain: none`, so the pass reads the content. R-13's "Recorded cost" reads that a shown pane's change in three
   columns "shows without a pass" where CSS carries it; with the containment it waits for the next trigger like every
   other unseen change. No test or contract states the CSS case; the README's convention says unseen changes wait for
   the next trigger or `remeasure()`, which now holds for every pane.

## Result

Every figure of R-13 holds, with no window error and no leaked measurement frame. The phase continues to the red step.
