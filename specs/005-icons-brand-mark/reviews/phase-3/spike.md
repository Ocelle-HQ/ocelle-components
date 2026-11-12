# Phase 3 measurement (T031)

Run on 2026-11-10 in this container (Linux x64, Node 22.23.4, Playwright 1.64.1 driving Chrome for Testing
153.0.8010.12 at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, device scale factor 1), with scratch files
only (a Node script in the session scratchpad; nothing of it is committed).

No stop-and-ask outcome was met: R-08's "equal" rule holds for a correct `scale: -1 1` mirroring of all thirteen
drawings, with a wide margin, and the "differs" rule holds for the four inline-direction icons. The rules stay as
R-08 states them.

## Method

- A scratch custom element `scratch-icon` with an open shadow root that adopts one stylesheet with `ocelle-icon`'s
  rules (R-04: `:host` inline-block at `--ocelle-icon-size` square, `vertical-align: middle`, `flex: none`; the `svg`
  block at 100 %) and R-08's rule `:host(:dir(rtl)) .mirror { scale: -1 1; }`. Its `svg` is the one `ocelle-icon`
  renders (`viewBox="0 0 24 24"`, `aria-hidden`, `focusable="false"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-width="2"`, round caps and joins), with the class `mirror` on the four inline-direction icons.
- Per name, one page body with two containers set through the CSSOM: `#ltr` (`dir="ltr"`) at `left: 0` and `#rtl`
  (`dir="rtl"`) at `left: 100px`, both `position: absolute; top: 0; display: flex`, `--ocelle-icon-size: 80px`,
  black on white, each holding one icon. Every icon box measured at integer coordinates (`[0, 0, 80, 80]` and
  `[100, 0, 80, 80]`), and every capture is exactly 80 × 80 px.
- Capture: Playwright's element screenshot of each icon (PNG, 8-bit RGBA, decoded with `node:zlib` and the five PNG
  row filters). The difference of a pixel is its largest per-channel difference.
- "Equal" (R-08): at most 1 % of pixels (64 of 6400) over 32/255, none over 96/255. "Differs": more than 5 % of
  pixels over 64/255.

## The drawings measured (the ones T037 implements)

Own drawings on the 24-unit grid, geometry within 2 to 22 (R-07); `*` mirrors in right-to-left text.

| Name | Shapes |
|---|---|
| `chevron-start`* | polyline `15 5 8 12 15 19` |
| `chevron-end`* | polyline `9 5 16 12 9 19` |
| `chevron-up` | polyline `5 15 12 8 19 15` |
| `chevron-down` | polyline `5 9 12 16 19 9` |
| `arrow-start`* | line 19,12 to 5,12; polyline `11 6 5 12 11 18` |
| `arrow-end`* | line 5,12 to 19,12; polyline `13 6 19 12 13 18` |
| `menu` | lines 4,6–20,6; 4,12–20,12; 4,18–20,18 (phase 2) |
| `close` | lines 6,6–18,18; 18,6–6,18 (phase 2) |
| `folder` | path `M3 5h6l2 3h10v11H3z` |
| `file` | path `M6 3h8l5 5v13H6z`; polyline `14 3 14 8 19 8` |
| `search` | circle 10,10 r 6; line 14.5,14.5 to 20,20 |
| `table` | rect 3,4 18 × 16 rx 1; lines 3,10–21,10; 3,15–21,15; 12,10–12,20 |
| `copy` | rect 8,8 12 × 12 rx 1; path `M16 8V4H4v12h4` |

Every shape kind of data-model § Icon is used: line, polyline, path, rect, circle.

## Results with the correct rule (only the four have `mirror`)

`rtl ~ flip(ltr)` compares the `rtl` capture with the `ltr` capture flipped horizontally; `rtl ~ ltr` with the
`ltr` capture as it is. Figures: share of pixels over 32/255, over 64/255, and the largest difference.

| Name | Mirrors | `rtl ~ flip(ltr)` | `rtl ~ ltr` | Oracle and result |
|---|---|---|---|---|
| `chevron-start` | yes | 0 %, 0 %, 15 | 13.44 %, 13.09 %, 255 | equal to the flip, differs from `ltr`: pass |
| `chevron-end` | yes | 0 %, 0 %, 15 | 13.44 %, 13.09 %, 255 | pass |
| `arrow-start` | yes | 0 %, 0 %, 8 | 12.19 %, 12.00 %, 255 | pass |
| `arrow-end` | yes | 0 %, 0 %, 8 | 12.19 %, 12.00 %, 255 | pass |
| `chevron-up` | no | 0 %, 0 %, 15 | 0 %, 0 %, 0 | equal to `ltr`: pass |
| `chevron-down` | no | 0 %, 0 %, 8 | 0 %, 0 %, 0 | pass |
| `menu` | no | 0 %, 0 %, 4 | 0 %, 0 %, 0 | pass |
| `close` | no | 0 %, 0 %, 13 | 0 %, 0 %, 15 | pass |
| `folder` | no | 12.63 %, 12.13 %, 255 | 0 %, 0 %, 0 | pass |
| `file` | no | 22.41 %, 21.44 %, 255 | 0 %, 0 %, 0 | pass |
| `search` | no | 27.53 %, 25.97 %, 255 | 0 %, 0 %, 0 | pass |
| `table` | no | 0 %, 0 %, 12 | 0 %, 0 %, 0 | pass |
| `copy` | no | 22.13 %, 21.38 %, 255 | 0 %, 0 %, 0 | pass |

The largest difference of any "equal" comparison of a correct mirroring is 15/255 with no pixel over 32/255, so the
1 % / 32 / 96 rule has a wide margin. (`close` differs from itself by up to 15/255 between the two boxes, at no pixel
over 32/255: rasterisation at the two offsets is not bit-identical even unmirrored, which the count rule allows.) The
"differs" figures of the four are 12.0 % to 13.1 % over 64/255, far above 5 %.

## The plant "mirroring applied to every icon"

The same run with the class `mirror` on all thirteen drawings: the four are unchanged; the nine non-directional
icons' `rtl` capture then equals their flipped `ltr` capture, and against the unflipped `ltr` capture:

| Name | `rtl ~ ltr` under the plant | "Equal" |
|---|---|---|
| `folder` | 12.63 %, 12.13 %, 255 | fails |
| `file` | 22.41 %, 21.42 %, 255 | fails |
| `search` | 27.52 %, 25.95 %, 255 | fails |
| `copy` | 22.09 %, 21.38 %, 255 | fails |
| `chevron-up`, `chevron-down`, `menu`, `close`, `table` | 0 % over 32/255, largest 0 to 1 | holds (left-right symmetric drawings) |

So the plant bites on `folder`, `file`, `search` and `copy`, the four the spec names (US2-4); the five symmetric
drawings cannot tell a mirrored rendering from an unmirrored one, as the spec expects.
