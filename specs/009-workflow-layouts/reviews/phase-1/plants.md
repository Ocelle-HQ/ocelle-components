# Phase 1 plants (R-17)

Each plant was applied to the working tree on top of the green implementation, its tests run, and the file restored
byte for byte (compared with a copy) before the green commit. Nothing planted was committed.

| # | Test | Plant | Result |
|---|---|---|---|
| 1 | T004 `color-sheet as the default lane's ground (R-10)` in `packages/tokens/test/source-table.test.ts` | `color-sheet` light set to `#F1EEE8` (canvas, panel and inspector) in `packages/tokens/src/source.ts` | fails in light: `expected [ 'color-canvas', 'color-panel', …(1) ] to deeply equal []`; dark passes |
| 2 | the same test | `color-sheet` dark set to `#1C1A15` (pane) | fails in dark: `expected [ 'color-pane' ] to deeply equal []`; light passes |
| 3 | T005 frames, both harnesses (`test/frames.test.ts`, `test/browser/frames.test.ts`) | `test/fixtures/frames.css` reduced to its header comment, no rule | all 8 fail on the inline size: in process `{ innerWidth: 1280, inlineSize: 1280 }` for W (876 expected), 1280 for R (1196), 720 for N (636), 320 for S (288); on the fixture the same 4 fail |
| 4 | T005 driver and frames, both harnesses (`test/driver.test.ts`, `test/browser/driver.test.ts`, both frame tests) | `viewport()` in both drivers settles without resizing | 8 of 10 fail: both `viewport()` tests, in process all four frames (iframe at Vitest's 414 px), on the fixture N and S. Fixture W and R pass, as expected: the fixture page opens at 1280 px, their own viewport, so `innerWidth` is right without a resize |

## Why T004 needs a plant

T004 guards values that already hold before 009 (`color-sheet` `#FBFAF7` / `#211E18` against `#F1EEE8` / `#15130F`
for canvas, panel and inspector and `#FFFFFF` / `#1C1A15` for pane), so it passes in the red commit (`b47541b`), as
the operator's decision PLAN-CORRECTNESS-1-011 (b) chose a ground that already differs. Plants 1 and 2 are its proof
that it can fail, one per theme.
