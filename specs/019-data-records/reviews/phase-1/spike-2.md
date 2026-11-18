# Phase 1 spike 2 (T082), with T003's re-measure

Run on 2026-11-18 in this container (Linux x64, Node 22.23.4, Chromium 156.0.8078.4 from Playwright 1.64.1, Lit 3.3.3,
axe-core 4.14.0), as T003 was (`spike.md`, which stays as it is): one scratch spike file in Vitest's browser mode at
the in-process harness's setup (tokens from `packages/tokens/src/source.ts` without the `@font-face` rules, `base.css`
adopted, viewport set through `page.viewport`), the AX tree read through the repository's `axTree` command, forced
colours through `emulateForcedColors`, keys through Playwright's keyboard (`userEvent.keyboard`, real key events), and
pixels through `page.screenshot` decoded by `test/pixels.ts`. It ran twice: with Playwright's default
`--hide-scrollbars` (as the harnesses and the stories run; "hidden") and without it (classic 15 px scrollbars, as
009's `test/browser/scrollbar.test.ts` launches; "classic"). One check ran as a plain Playwright script on a page served
with the fixture's policy (`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`). Nothing of it
is committed.

The stand-ins: a scratch copy of 009's `overflow-region.ts` with a prototype of the block-axis option as
contracts/overflow-region-block-axis.md states it (`blockAxis`, `blockStartBox`, `data-axis="both"` with
`overflow-y: auto` and `scrollbar-gutter: stable`, either axis overflowing, ArrowUp/ArrowDown by the step, the keys the
browser keeps untouched, `blockEdgeState` with the room rule, `data-block-fade`, the four-layer mask written per
instance, `blockClearanceScroll` with the fallback, `.region-edge.block-end` as the contract's stylesheet table gives
it, and a switch between the two `pinnedEnd` candidates); T003's `ocelle-data-table` stand-in given `sticky-header`
and `striped` (reflected), the column flex of contracts/ocelle-data-table.md § The bound, the gutter subtracted from
`--data-table-box-size`, and the edge after 009's two; blocks 1, 2 and 4 as contracts/styles-data-table.md gives
them, with the inventory decisions' rules (sticky table, pinned `<thead>`, `sheet` header ground, stripe, the hover
inside `@media (hover: hover)`, the forced-colours row band, block 2's sticky `border-collapse`, block 4). The US1
sticky table: five columns (Id, Title, Lane, Cost with `data-ocelle-align="end"`, Link), 20 body rows of 30 px, a
27 px header row, the unbroken identifier in row 3.

**Outcome: the pinned-box measure is asked as planned (Q-1), and three results contradict research or the contract
and stop the phase (Q-2 to Q-4).** Everything else T082 lists holds (§§ 1 to 12). No scaffold, no red commit.

## 1. The slotted sticky `<thead>` pins to the shadow `.region-box`

20 rows, `max-block-size: 300px` on the host, at 1280 and 320 px (at 320 px the table also overflows sideways:
scroll width 490, client width 305); at rest, scrolled to the middle (`scrollTop` 168, at 320 px also `scrollLeft`
93) and to the end (336; 170).

| Check | 1280 px | 320 px |
|---|---|---|
| the `<thead>` pinned while scrolled | yes, at every position | yes, at every position, also scrolled sideways (the header row scrolls with its columns) |
| **its block-start edge against the box's client block-start edge** | **+5 px** at rest, middle and end | **+5 px** at rest, middle and end |
| what shows in the 5 px band above the pinned header while scrolled | the body rows (`elementFromPoint` returns a `th` / `td` of the body) | the same |
| `elementFromPoint` at each visible header cell's centre | that header cell, at every position | the same |
| header cells' ground | `rgb(251, 250, 247)` (`--ocelle-color-sheet`), opaque, painting over the body rows | the same |
| the header rule | 1 px `rule-strong`, its bottom at the pinned row's block-end edge at every position (moves with the row) | the same |
| the page's scroll height | 800, unchanged by any scroll | 800 |
| the same with the box's `padding-block` zeroed by a test-only rule | the header's block-start edge at the client block-start edge (0) | |
| the same with a test-only `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))` on the `<thead>` | 0 px once scrolled 5 px or more (no band, no row above it); +5 px at rest (`scrollTop` 0, not yet pinned) | the same |

Sticky positioning measures from the scroll container's padding edge, and 009's `.region-box` keeps the ring room
(`--ocelle-focus-offset` + `--ocelle-focus-width`, 5 px) as block padding. So the pinned header stops 5 px below the
client block-start edge and the scrolled rows show through above it. US1-17, US1-18 and T079's keys body assert the
header's block-start edge at the client block-start edge within 0.5 px, and candidate (b) of the pinned-box measure
(the client block start plus the `<thead>`'s block size) is 5 px short of the pinned header's real block-end edge
(§ 11). **→ Q-2.**

## 2. `data-axis="both"`: client and offset widths, the gutter, LTR and RTL

`scrollbar-gutter: stable` reserves 15 px in **both** runs: with classic scrollbars, and also with
`--hide-scrollbars`, where no scrollbar is drawn (so the harnesses and the stories have a 15 px empty band on that
side whenever `sticky-header` is set, overflowing or not).

| Case (host `max-block-size: 300px`) | `offsetWidth` / `clientWidth` | gutter | block-axis scrollbar side | inline-axis scrollbar (classic) |
|---|---|---|---|---|
| fits (3 rows, 1280 px), LTR | 1280 / 1265 | 15 | right | 0 |
| block axis only (20 rows, 1280 px), LTR | 1280 / 1265 | 15 | right | 0 |
| both axes (20 rows, 320 px), LTR | 320 / 305 | 15 | right | 15 (client height 285) |
| inline only (3 rows, 320 px), LTR | 320 / 305 | 15 | right | 15 |
| the same four under `dir="rtl"` | the same | 15 | **left** (`clientLeft` 15) | the same |
| option off (009's box), 20 rows, 320 px | 320 / 320 | none | none (`overflow-y: hidden`; the box is as tall as the table, 636) | 0 hidden / 15 classic |

**RTL with the gutter and no block overflow.** Under `dir="rtl"`, a box with `scrollbar-gutter: stable` that
overflows inline but not in the block axis starts at `scrollLeft` −15, its content's inline start is 15 px past the
client edge, and `scrollTo({ left: 0 })` (or any positive value) leaves it at −15: the first 15 px of the content
cannot be scrolled into view. Plain boxes, no element involved, both runs:

| RTL box, 320 px wide, content 500 px | at rest | the content's start past the client edge | reachable |
|---|---|---|---|
| `overflow-y: hidden`, no gutter (009) | 0 | 0 | yes |
| `overflow-y: auto`, no gutter, block overflow (a real scrollbar on the left, classic) | 0 | 0 | yes |
| `overflow-y: auto; scrollbar-gutter: stable`, no block overflow | −15 | 15 | **no** |
| the same with `overflow-y: hidden` | −15 | 15 | **no** |
| `scrollbar-gutter: stable both-edges` | −30 | 30 | **no** |
| `scrollbar-gutter: stable` with block overflow too | 0 | 0 | yes |

In the stand-in data table (`sticky-header`, `dir="rtl"`, 3 rows, 320 px): `scrollLeft` −14 at rest, `data-fade="both"`
at rest (the module reads the −14 as scrolled from the start), and the first column header's start 9 px past the
client edge (15 less the track's 5 px ring room and 1 px). LTR is not affected. The contract's reason for the stable
gutter (the caption cap and the mask figures never feeding back on a scrollbar that comes and goes) stands; the
choice clips an RTL table's start. **→ Q-3.**

## 3. The four-layer mask

Test-only: cells and text `rgb(0, 0, 255)` on a white page, so a pixel's red channel gives the mask's alpha; 320 px,
20 rows, `scrollTop` 40, so `data-fade="end"` and `data-block-fade="end"`; alpha sampled 16 px from the inline end
(inline fade only), 16 px above the client block end (block fade only), and at both (the corner).

| Layer order (top first) and `mask-composite` | inline only | block only | corner (16, 16) | expected product | block-axis scrollbar pixels | inline-axis scrollbar pixels (classic) |
|---|---|---|---|---|---|---|
| block scrollbar, inline scrollbar, block-end fade, inline fade; `add, add, intersect, add` | 0.49 | 0.49 | **0.24** | 0.24 | drawn (`139` thumb, `252` track; classic) | drawn |
| inline fade, block-end fade, inline scrollbar, block scrollbar; `intersect, add, add, add` | 0.49 | 0.49 | 0.24 | 0.24 | **masked** (page white `255`) | **masked** |
| the first order with every layer `add` (009's operator) | **1.00** | **1.00** | 0.73 | | drawn | drawn |

Under `dir="rtl"` the same (corner 0.25, product 0.25; the block scrollbar on the left drawn, at x 2). So the order
the contract leaves to the spike is: the two opaque scrollbar layers on top, each `add`, then the block-end fade
`intersect`, then the inline fade at the bottom (its operator unused): `mask-composite: add, add, intersect, add`,
`mask-size` `<gutter>px 100%, 100% <inline scrollbar>px, <clientWidth>px <clientHeight>px, <clientWidth>px
<clientHeight>px`, the fade layers positioned at the client area's side (left in LTR, right in RTL with the gutter on
the left), the block scrollbar layer at its side. With `add` between the fades, the opaque layer of the fade that is off
undoes the other fade (alpha 1), as the contract feared.

## 4. The block-end fade

1280 px, 20 rows, `max-block-size: 300px`, no caption (the pinned header's block-end edge 32 px below the client
block-start edge, § 1):

| Case | `data-block-fade` | fade depth (`.region-edge.block-end` block size) | the fade's block-start edge | the header's block-end edge |
|---|---|---|---|---|
| at rest | `end` | 32 | 268 | 32 (at or above the fade: yes) |
| scrolled to the end (336) | absent | | | |
| 1 px from the end (335) | absent (within 1 px) | | | |

The room rule (twice the depth, 64 px, below `pinnedEnd` 32): bounds 80, 90 and 95 (space 48, 58, 63): no fade
while rows are below; 100, 110, 120 (space 68, 78, 88): `end`.

Forced colours (`emulateForcedColors("active")`): the box's `mask-image` computes `none`; `.region-edge.block-end`
draws `1px solid rgb(0, 0, 0)` (`CanvasText`) with its block-end edge at the frame's (both 300); at the end the line is
gone (`0px none`). The pinned header's cells compute `rgb(255, 255, 255)` (`Canvas`, opaque), their rule `CanvasText`,
`elementFromPoint` still returns each header cell scrolled to the middle.

## 5. The host and `.region-frame` as a column flex

| Host rule (1280 px, 20 rows) | host block size | box block size | table | box overflowing |
|---|---|---|---|---|
| `max-block-size: 300px` | 300 | 300 | 626 | yes (`group`, `data-block-fade="end"`) |
| `block-size: 300px` | 300 | 300 | 626 | yes |
| `block-size: 900px` | 900 | 636 (the table and the block padding; not stretched) | 626 | no |
| none | 636 | 636 | 626 | no tab stop, no role |

Shrink-to-fit hosts with `sticky-header` (3 rows; 20 rows in the bounded dialog): host 504.59 px = table 479.59 + 10 px
ring room + 15 px gutter, never 0, stable over two more `settle`; one `.box-size` callback and one write in the
inline-block and the start-aligned column flex, two in the open `<dialog>` (the gutter appears after the first
delivery and the shrink-to-fit host widens by it once); no `ResizeObserver` loop error in any.

## 6. Block clearance

1280 px, 20 rows, `max-block-size: 300px` (290 for the faded link), the box focused and then `Tab` to the link;
`scrollTop` read in each of the next ten animation frames.

| Case | before | after | per-frame `scrollTop` |
|---|---|---|---|
| a link in row 12 under the pinned header (its top 3 px below the header's block-end edge, its ring above it) | 333 | 331: the ring's block-start edge at the header's block-end edge (0) | 331 in every frame: no jump back |
| a link in row 9, 20 px into the block-end fade and 5 px below the client block end | 0 | Chromium's focus scroll runs before `focusin` (5 at `focusin`), the clearance writes 42 in the same task: the ring's block-end edge at the fade's block-start edge (0) | 42 in every frame |
| a link in row 17, below the box | 0 | Chromium scrolls it into view before `focusin` (336, the end); no further write; no fade at the end | 336 in every frame |
| a link in a header cell, scrolled to 150 | 150 | 150, no block-axis write | 150 |
| a ring box taller than the space (a 120 px link in a 160 px bound) | | aligned below the header, `suppressEnd` true, `data-block-fade` absent; after a 10 px scroll `end` again | |

## 7. The caption cap with the gutter subtracted

`sticky-header`, `max-block-size: 300px`, a four-line caption at 320 px: `--data-table-box-size` 305px (320 less the
15 px gutter), `--data-table-end-fade` 32px, the caption's `max-inline-size` 263px, every line box's inline end
(263.1, 210.0, 231.7, 38.9) inside the unmasked width (273). At 600 px: 585px, no end fade, cap 575, lines inside 585.
Resized 320 → 600 → 320 px: no `ResizeObserver` loop error. The same in both runs.

## 8. Separated borders, stripes, hover

- Row rules, collapsed (no `sticky-header`) against separated with `border-spacing: 0` (`sticky-header`, unbounded):
  the collapsed rules sit on half pixels (31.5, 61.5, …), the separated ones on whole pixels (32, 62, …): every
  difference is exactly 0.5 px; the last row has none in both. Header rule 1 px in both.
- `striped` with two `<tbody>`, a `hidden` second row in the first: the hidden row and row 4 painted
  `rgb(226, 221, 211)` (`inset`), rows 1 and 3 not; in the second `<tbody>` its second row painted, its first not.
- A hovered even row (`userEvent.hover`, `:hover` matched): light `rgb(226, 221, 211)`, equal to `inset` (Q-I2's
  collision, no change); dark (`data-theme="dark"`) `rgb(42, 38, 31)` (`hover-bg`) against `inset`
  `rgb(48, 43, 35)`. The hovered cell's box unchanged.
- Forced colours: every first body cell has a 3 px solid band, `Canvas` on odd rows, `CanvasText` on the striped even
  rows (the hidden one included), `Highlight` (`rgba(5, 0, 73, 0.8)`) on the hovered row; the first cell's width
  (742.86) and the second cell's start (749.36) are the same hovered or not.

## 9. axe-core 4.14.0 on a bounded sticky table

With the `axe` gate's rule selection (as T003, `spike.md` § 2), on the document:

| Case | violations | incomplete |
|---|---|---|
| 1280 px, `max-block-size: 300px` (block axis only), the contract's `.region-edge.block-end` | none | **`color-contrast` (serious) on the five cells of row 9**, the row under the edge; reason `bgOverlap` |
| the same, the bound ending at a row's end (272 and 277 px) | none | the same on row 8 |
| the same with the box's mask removed (test-only) | none | the same: the mask is not the cause |
| the room-rule case (90 px, no fade) | none | the same on row 2 |
| no bound (no overflow, no tab stop) | none | the same on row 20, the last row |
| **no `sticky-header` at all** (the edge is in the template always, contract § Shadow structure) | none | the same on row 20 |
| the edge given `inline-size: 0` outside forced colours (test-only), bounded | none | **none**; `scrollable-region-focusable` passes |

The contract lays `.region-edge.block-end` out always, absolutely positioned at the frame's block end, full width and
as tall as the fade depth, with no ground; axe sees an element stacked over the rows it covers and reports their
contrast as undeterminable. The `axe` gate counts a serious incomplete node as a finding, so every data-table story
(not only the sticky ones) would fail `gate:axe` without an exception entry. Research R-18 expected no serious or
critical finding. Chromium's AX tree is unchanged (the edge is `aria-hidden`). **→ Q-4.**

## 10. The keys the browser keeps

1280 px, 40 rows, `max-block-size: 300px` (range 936), the box focused; a window `keydown` listener reads
`defaultPrevented` after the module's host listener.

| Key | from → to | prevented | `data-block-fade` | header's block-start edge |
|---|---|---|---|---|
| `PageDown` | 0 → 262 | no | `end` | +5 (§ 1) |
| `PageUp` | 200 → 0 | no | `end` | +5 |
| `End` | 0 → 936 (the end) | no | absent | +5 |
| `Home` | 0 → 0 | no | `end` | +5 |
| `Space` | 0 → 262 | no | `end` | +5 |
| `Shift+Space` | 200 → 0 | no | `end` | +5 |
| `ArrowDown` (the pair) | 0 → 40 | **yes** | `end` | +5 |

Focus stays on the box. With the test-only negative inset of § 1 the header's edge is 0 after `PageDown`, `End`,
`Space` and `ArrowDown`, and +5 after `Home`, `PageUp` and `Shift+Space` (back at the block start, not pinned).

## 11. The pinned-box measure (re-analysis A1 (c))

320 px, `sticky-header`, 20 rows, the two-line caption "Work packages of mission nineteen, every lane and owner"
above the `<thead>` (the header's block-end edge 80.6 px below the client block start at rest; its block size 27), a
link in row 1 (just below the header), bounds 100, 120, 140 and 300 px. "Rest" is `scrollTop` 0, "half" 24 (half the
caption away), "past" 79 (the caption scrolled away, the header pinned, § 1's 5 px included). Fade depth 32, so the
room rule needs 64 px below `pinnedEnd`.

| Bound | Position | (a) the current edge: `pinnedEnd` / space / fade | (b) as if pinned (client start + 27): `pinnedEnd` / space / fade | the fade's block-start edge against the header's block-end edge |
|---|---|---|---|---|
| 100 | rest | 80.6 / 19.4 / none | 27 / 73 / `end` | (b): **12.6 px above it** (68 against 80.6): the fade covers the header row's lower part |
| 100 | half | 56.6 / 43.4 / none | 27 / 73 / `end` | (b): 11.4 below |
| 100 | past | 32 / 68 / `end` | 27 / 73 / `end` | 36 below |
| 120 | rest | 80.6 / 39.4 / none | 27 / 93 / `end` | (b): 7.4 below |
| 120 | half | 56.6 / 63.4 / none | 27 / 93 / `end` | |
| 140 | rest | 80.6 / 59.4 / none | 27 / 113 / `end` | (b): 27.4 below |
| 140 | half | 56.6 / 83.4 / `end` | 27 / 113 / `end` | |
| 300 | rest | 80.6 / 219.4 / `end` | 27 / 273 / `end` | 187.4 below |

Block clearance of the link in row 1 (`Tab` from the focused box):

| Bound | At rest: (a) | At rest: (b) | Past the caption (row 1 under the pinned header): (a) | Past: (b) |
|---|---|---|---|---|
| 100 | Chromium scrolls to 4, clearance to 5; ring 1 px below the header | 41: the caption scrolled 41 px away so the ring clears the fade (ring 1 px below the header) | 49.6: the ring's block-start edge 0.4 px under the header's block-end edge (scroll rounding) | 54.6: the ring **5.4 px under the header** (the header is at 5 to 32, (b) assumes 0 to 27) |
| 120 | 0 (already clear) | 21 | as 100 | as 100 |
| 140 | 0 | 0.6 | as 100 | as 100 |
| 300 | 0 | 0 | as 100 | as 100 |

With the test-only negative inset of § 1 (the header pinned at 0 to 27): the at-rest rows are the same (the header is
not yet pinned there), and past the caption both candidates give 27 and the same clearance (54.6, the ring 0.4 px under
the header's edge). Without a caption the two candidates differ by the 5 px of § 1 at the block start (32 against 27)
and agree once the header is pinned only with the negative inset.

So: (a) never fades the header and always clears the real header, but under a tall caption in a small bound the fade
is absent at rest until the caption scrolls away (here up to a 140 px bound). (b) shows the fade at rest, but in the
100 px bound its fade covers the header's lower 12.6 px at rest, which the room rule exists to prevent, and it clears a
link to 5 px under the pinned header unless Q-2 removes the 5 px offset; its clearance at rest scrolls the caption
partly away (41 and 21 px). **→ Q-1.**

## 12. Print of a bounded sticky table (T003 item changed by the inventory decisions)

1280 px, 30 rows, a caption, `max-block-size: 300px`, a paragraph after it; print media: the box keeps 300 px,
`overflow-y: auto` and the mask; the paragraph follows at 405 px. The PDF (one page) shows the caption, the header and
the first eight rows, the eighth faded, and the paragraph right after: a bounded table prints its box only (T013's
README statement holds), the rows past the box are not printed.

## T003, re-measured for what the decisions changed

T003's record (`spike.md`) stands; the decisions since changed four of its points, re-measured here:

- **US1-1's oracle (spike Q2 (a)).** The element's AX subtree against the same table outside given
  `text-transform: uppercase` on its column headers by a constructed sheet adopted by the document: equal at 1280 and
  320 px (beyond the shadow `generic` nodes and, at 320 px, the `group` "Work packages"); the five headers named "ID",
  "TITLE", "LANE", "OWNER", "LINK", their static text the same. On a page served with the fixture's strict policy, a
  constructed sheet adopted by the document applies (`text-transform` `none` → `uppercase`) with no
  `securitypolicyviolation` event, the headers then named "ID", "TITLE"; a `style` element added as a control is
  blocked with one `style-src-elem` violation. So T006's test-only rule works in both harnesses.
- **The host `aria-label` stories (spike Q1 (b)).** Nothing to re-measure: `spike.md` § 2 measured both states (the
  non-blank and the blank host `aria-label`, overflowing) with the gate's rule selection. § 9 above does not change
  that for a table without `sticky-header` once Q-4 is settled (today the always-rendered block-end edge gives every
  data table the incomplete result there).
- **The prose override (`spike.md` § 7), with the inventory decisions' rules.** The `sticky-header striped` table
  inside `[data-ocelle-prose=""]` against the same outside, computed `border-collapse`, `border-spacing`, `display`,
  `overflow-x`, `position`, `top`, `background-color`, `text-align`, `font-variant-numeric`, font size and weight,
  padding, rules, `min-width`, `text-transform`, `letter-spacing` and `color` on the table, the `<thead>`, a column
  header, the numeric header, a row header, a body cell, an even (striped) cell and a numeric cell: **no difference**.
  Inside prose the header pins as outside (§ 1's +5 px included). Block 4 on a plain prose table: the numeric header and
  cell `text-align: end` with `tabular-nums`, a cell without the hook `start`.
- **Print (`spike.md` § 8).** § 12 above: a bounded sticky table prints its box only.
- **R-05 (`spike.md` § 4).** Not changed by any decision; still "none".

## T005

Research R-16's data-table table holds one row per role of the library's data table as
`sources/spec-kitty-design-inventory.md` § 1 lists them: the five structure roles (the scroller wrapper, the table
class, the caption, the header cells, the body cells), the two modifiers (the numeric cell, the sticky header) and the
five states (zebra rows, row hover, forced colours, the overflowing scroller, tone): twelve rows, none missing, none
"pending inventory"; the library's data table has no part. Confirmed; no variant without an element or variant, and
no rc.10 variant named by the operator.

## Facts for the red bodies (no decision needed)

- The mask: layer order and operators of § 3 (`add, add, intersect, add`, scrollbar layers on top); T079's mask
  oracle reads the computed `mask-composite` as that list.
- The gutter is 15 px in both runs (also with hidden scrollbars), so the box's client width is 15 px less than its
  offset width whenever `sticky-header` is set; `--data-table-box-size` is then the measured width less 15 (§ 7).
- Collapsed and separated row rules differ by exactly 0.5 px (§ 8): the "within 0.5 px" oracle holds at its bound, so
  the comparison must be `≤ 0.5` (not `< 0.5`).
- Chromium's own focus scroll runs before `focusin` (§ 6): the clearance reads the position after it and writes once;
  no frame shows a jump back.
- In the light theme a hovered striped row computes the same ground as the stripe (§ 8); a body asserting the hover on
  a striped row reads it in the dark theme, or on an odd row.
- The open `<dialog>` shrink-to-fit host gets two `.box-size` callbacks with `sticky-header` (§ 5), not one.
- `PageDown` and `Space` scroll 262 px in a 300 px box (§ 10); a body asserts the direction and a non-zero move, not
  the amount.

## Questions for the operator

**Q-1. The pinned-box measure (re-analysis A1 (c); always a stop before the scaffold).** § 11 records both candidates
at 320 px with a two-line caption.

- (a) The current edge: `pinnedEnd` is the `<thead>`'s laid-out block-end edge as it is now. The fade never reaches the
  header and the clearance always clears the real header (§ 11); under a tall caption in a small bound the fade is
  absent at rest until the caption scrolls away (bounds up to 140 px here), the scrollbar being the only cue then.
- (b) As if pinned: `pinnedEnd` is the client block start plus the `<thead>`'s block size. The fade shows at rest
  under a tall caption, but in the 100 px bound it covers the header's lower 12.6 px at rest, and the clearance at rest
  scrolls the caption away; once pinned it is right only if Q-2 removes the 5 px offset (else 5 px short).
- (c) Both: the room rule by (b), and the fade drawn only while its block-start edge is also at or below the current
  edge (a). From § 11's figures: no fade at rest in the 100 px bound, a fade at rest in the 120, 140 and 300 px bounds;
  the clearance by (a). (Computed from the recorded figures, not run as a variant.)

**Q-2. The pinned header stops 5 px below the client block-start edge (§ 1), and the rows show above it while
scrolled.** This contradicts US1-17, US1-18 and T079's keys body (the header's block-start edge at the client
block-start edge within 0.5 px) and the room rule's and clearance's premise.

- (a) Block 1 pins the `<thead>` at `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) +
  var(--ocelle-focus-width)))` (measured, § 1, § 10, § 11): pinned at the client edge once scrolled 5 px, no band;
  at the block start the header keeps the 5 px ring room above it. The oracles read "at the client block-start edge
  once scrolled; at the block start, the ring room below it". No module change.
- (b) The module, with the option on, sets the box's `padding-block-start` to 0 (measured with a test-only rule, § 1):
  the header at the client edge at every position, the oracles as written; a focus ring of a control in a header cell
  loses its block-start ring room (the header cell's own padding is 4 px, the ring needs 5). A change of the
  contract's stylesheet table.
- (c) Keep it: the header pins at the client edge plus the ring room, rows stay visible in the 5 px band above it; the
  oracles, candidate (b) of Q-1 and the README statement change to that position.

**Q-3. Under `dir="rtl"`, `scrollbar-gutter: stable` hides the first 15 px of a table that overflows sideways but not
downwards (§ 2).** Chromium starts such a box at `scrollLeft` −15 and never scrolls it to 0; the stand-in shows
`data-fade="both"` at rest and the first column cut by 9 px. It contradicts R-18's gutter choice (FR-008: no content
lost; WCAG 1.4.10).

- (a) The gutter in LTR only: under `:host(:dir(rtl))` (the module's stylesheet) the box gets `overflow-y: auto`
  without `scrollbar-gutter`, so in RTL the scrollbar comes and goes with block overflow; the caption cap and the mask
  figures then need a write when the scrollbar comes or goes (the module's box observer sees the client size change;
  `.box-size` does not) — not measured.
- (b) No gutter in either direction: the same trigger cost in both directions; the stories and harnesses (hidden
  scrollbars) lose the 15 px empty band.
- (c) Keep the gutter, but the module writes `data-axis="both"` only while the box overflows in the block axis (a box
  whose rows fit keeps 009's `overflow-y: hidden`, no gutter, no bug): the gutter appears and goes with block overflow,
  as in (b), but only for sticky tables that really scroll down; US1-20's and T014's unbounded-story assertion of
  `data-axis="both"` changes to its absence — not measured.

**Q-4. The always-laid-out `.region-edge.block-end` makes axe-core 4.14.0 report a serious `color-contrast`
incomplete result (`bgOverlap`) on the rows under it, in every data table (§ 9).** The `axe` gate counts it, so the 21
data-table stories would fail `gate:axe`; R-18 expected no finding.

- (a) The edge measures the depth with its block size only, as 009's inline edges measure with their inline size:
  `inline-size: 0` (no `inset-inline`) outside forced colours, full width inside forced colours where it draws the
  line (measured: no violation and no incomplete, the depth still 32 px). A change of the contract's stylesheet row.
- (b) The module reads the block fade depth from `.region-edge.end`'s inline size (the same token), and
  `.region-edge.block-end` is laid out only in forced colours, for the line (not measured; one more contract change:
  the depth's measure).
- (c) Keep the contract and record the cells under the edge in `storybook/a11y-exceptions.json` for each data-table
  story-theme (an exception per node, each with a sunset); not recommended, and each entry is itself a stop-and-ask
  point.

## Addendum before the red commit: spike-2 Q-3 (c) and Q-S2-1 (a) (T082)

Run on 2026-11-18 in this container (the same versions and harness as above), on a scratch copy of the spike's module
with the decisions applied: `data-axis="both"` written only while the option is on and `scrollHeight − clientHeight
> 1` (decided afresh on every measure, the attribute an output change, the mask figures read after it is written),
`.region-edge.block-end` zero-wide outside forced colours (Q-4 (a)), the `<thead>` at the negative inset (Q-2 (a)),
`pinnedEnd` the current edge (Q-1 (a)), and `blockClearanceScroll` with `before` (Q-S2-1 (a)); the stand-in data
table keeps the measured `.box-size` inline size and rewrites `--data-table-box-size` less the current gutter in the
end fade's single animation frame after the box's `data-axis` changes. Every case ran with hidden scrollbars
(Playwright's default `--hide-scrollbars`, as the harnesses and the stories run) and with classic scrollbars. Nothing
of it is committed.

**Outcome: two results contradict the decisions and stop the phase (Q-A1, Q-A2).** No `ResizeObserver` loop error in
any case, no oscillation of the attribute, the cap rewrite one frame after each change; but with hidden scrollbars the
gutter still costs a both-axes table 15 px of inline scroll range (LTR and RTL), with classic scrollbars an RTL table
is left 14 px off its start when the gutter goes, and the caption link's "past the caption" case is met by Chromium's
own focus scroll alone. No scaffold, no red commit; T082 stays open.

### A1. `data-axis` per overflow case (host `max-block-size: 300px`)

| Case | `data-axis` | `overflow-y` | gutter | at rest: `scrollLeft` / `data-fade` | inline range (far end) | back to `scrollLeft` 0 | mask |
|---|---|---|---|---|---|---|---|
| fits (3 rows, 1280 px), LTR and RTL, both runs | absent | `hidden` | 0 | 0 / absent | | | none |
| inline only (3 rows, 320 px), LTR and RTL, both runs | absent | `hidden` | 0 | 0 / `end`; the first column header's start at the track's start | 170 (LTR) / −169 (RTL) | 0, `end` | 009's two layers, figures as 009 |
| block only (20 rows, 1280 px), LTR and RTL, both runs | `both` | `auto` | 15 (left in RTL) | 0 / absent; `data-block-fade="end"` | | | four layers, `add, add, intersect, add`, sizes as the contract |
| both (20 rows, 320 px), LTR, classic | `both` | `auto` | 15 | 0 / `end` | 185 = 490 − 305, `start` at the end | 0 | four layers |
| both, RTL, classic | `both` | `auto` | 15 | 0 / `end` | −184 | 0 | four layers |
| **both, LTR, hidden** | `both` | `auto` | 15 | 0 / `end` | **170**: `data-fade="both"` at the far end, the table's last 15 px never reachable | 0 | four layers |
| **both, RTL, hidden** | `both` | `auto` | 15 | **−14 / `both`**; the track's start 14 px past the client edge | −184 | **−14**: the start never reachable | four layers |

With hidden scrollbars and `scrollbar-gutter: stable`, Chromium reserves the 15 px gutter (`clientWidth` 305) but
sizes the inline scroll range as if it were not there (range 170 = 490 − 320, against 185 with classic scrollbars):
in LTR the table's end, in RTL its start, cannot be scrolled into view. Q-3 (c) removed the inline-only case of § 2
but not this one: a table that overflows both ways keeps the gutter. § 2's "with block overflow too the start is
reachable" held for classic scrollbars only; its hidden run of the data table already showed `scrollLeft` −14 for RTL
both axes (`S2-hidden`, not carried into the record). The harnesses, the stories and the baselines run hidden, and
T080's paired body ("the same table bounded in the block axis carrying `data-axis="both"` with `scrollLeft` 0 at
rest", RTL at 320 px, both axes) would fail in process at green.

### A2. The bound set and lifted at run time (four-line caption, LTR and RTL, 1280 and 320 px)

Unbounded → `max-block-size: 300px` → none → `block-size: 200px`. In every run and both directions the attribute, the
gutter and the mask follow (absent, 0, 009's two layers or none; then `both`, 15, four layers with matching sizes;
then back), each change in the `ResizeObserver` delivery after the rule change, and `--data-table-box-size` rewritten
in the next animation frame (for example set at 1500.3 ms, rewritten 305px at 1515.9 ms; a frame callback run before
the rewrite in that frame still reads 320px), never in the task of the change; no `ResizeObserver` loop error. Every caption line inside the
unmasked width in LTR (both runs) and in RTL with classic scrollbars while bounded. Two failures, both RTL at 320 px:

| Run | Bounded | Lifted (the gutter goes) |
|---|---|---|
| hidden | `scrollLeft` −14, `data-fade="both"`, caption line ends past the client edge (329 > 320) (A1's range defect) | −14, `both`, lines past the edge |
| classic | 0, `end`, lines inside | **−14, `both`**: Chromium keeps the offset the gutter caused, so the table is left 14 px from its start with no user scroll and the caption's lines run past the edge (329 > 320); reachable by scrolling back |

### A3. Block overflow only from a gutter-caused inline scrollbar (1280 px, 6 rows, table 1200, 1260 and 1268 px)

Not reproduced: with the gutter in (a bound below the table's height), the gutter made the track overflow inline by
up to 13 px (`scrollWidth` 1278, `clientWidth` 1265), but Chromium drew no inline scrollbar for it even with classic
scrollbars (`offsetHeight − clientHeight` 0). Widening the bound to the table's height + 5 px then ended the block
overflow and the attribute was removed once; mounted straight into that bound it never appeared. Ten sampled frames
each: one value throughout, no oscillation, no loop error, in both runs.

### A4. A link in the caption (Q-S2-1 (a)), the spike's "rest" and "past" positions

320 px, the two-line caption "Work packages of mission nineteen, every lane and owner" with "owner" a link on its
second line (asserted: two line boxes, the link on line 2; caption 48.6 px), 20 rows, bounds 100 and 300 px, LTR and
RTL, both runs; identical figures throughout.

- **At rest:** tabbed to from the focused box: `scrollTop` 0 before and after in every frame, the ring box at 21.3 to
  48.3 px below the client block-start edge, the clearance computed with `before` true and writing nothing,
  `data-block-fade` unchanged (`end` in 300, absent in 100 by the room rule). As the contract states.
- **Past the caption** (`scrollTop` 79: the caption scrolled away, the header pinned at 0 to 27): **Chromium's focus
  scroll alone already scrolls the box to 0** (it centres a focused element that is out of view; clamped at the block
  start), before `focusin`. The link is then at its at-rest position (ring box 21.3 px below the client edge, the
  `<thead>` 5.3 px below the ring box, `elementFromPoint` returns the link), and the clearance, with or without
  `before`, writes nothing. The contract's expected value (the ring box's block-start edge at the client block-start
  edge within 0.5 px) is met by no variant, and the guarantee itself (shown whole, above the `<thead>`) is met by the
  platform alone, so the red body would pass at red and T024's new plant (`before` always false) would not bite on it.

### A5. The caption link partly scrolled out at the top (measured to find a position that tells the variants apart)

The same table, the link's border-box top placed at −12, −6, −2 and +2 px from the client block-start edge
(`scrollTop` 38, 32, 28, 24; the caption partly away, the `<thead>` in flow below it, not yet pinned), then tabbed
to. LTR and RTL, 100 and 300 px, both runs; identical figures:

| Variant | `scrollTop` after | ring box's block-start edge | within 0.5 px of the client edge | `elementFromPoint` | `<thead>` below the ring |
|---|---|---|---|---|---|
| Chromium alone (clearance off) | 26 (24 from +2: no scroll, the link itself visible) | −4.7 (−2.7) | no | the link | yes (5.3) |
| the clearance without `before` (from `pinnedEnd`) | 0 | 21.3 | no | the link | yes |
| the clearance with `before` (Q-S2-1 (a)) | 21 | **0.3** | **yes** | the link | yes |

One write, no jump back over ten frames. Here the three differ: Chromium aligns the link's border box (not its ring
box) at the edge, the clearance from `pinnedEnd` scrolls the whole caption back, and the clearance with `before`
scrolls back by the ring room only. A body at this position fails at red (−4.7) and the `before` plant bites (21.3).

### The same cases without `scrollbar-gutter` (measured for Q-A1)

The scratch module with `scrollbar-gutter: auto` on `[data-axis="both"]` (so `overflow-y: auto` only while the box
overflows in the block axis, the scrollbar coming and going with it), A1, A2, A4 and A5 again in both runs:

- hidden: no gutter at all (`offsetWidth` = `clientWidth`), the inline range full (170 at 320 px in both directions,
  the start at `scrollLeft` 0 at rest and after the bound is set and lifted, `data-fade="end"`), four layers with a
  0 px block-scrollbar layer, `--data-table-box-size` 320px (nothing to subtract), every caption line inside;
- classic: the real scrollbar takes 15 px while the box overflows in the block axis (on the left in RTL);
  RTL both axes at `scrollLeft` 0 at rest, range 184, back to 0; after the bound is lifted 0 and `end` (not −14);
  `--data-table-box-size` 305px and 320px following, rewritten one frame after each change; every caption line
  inside;
- no `ResizeObserver` loop error; A4 and A5 unchanged.

## Questions for the operator (addendum)

**Q-A1. The stable gutter still loses 15 px of inline scroll range (A1, A2).** With hidden scrollbars (the harnesses,
the stories, the baselines) a sticky table that overflows in both axes cannot reach its last 15 px in LTR or its first
14 px in RTL (`scrollLeft` −14 and `data-fade="both"` at rest); with classic scrollbars an RTL table is left at −14
when the gutter goes at run time. It contradicts R-18's gutter choice (FR-008: no content lost; WCAG 1.4.10) and
T080's paired RTL body.

- (a) No `scrollbar-gutter` (spike-2 Q-3 (b) on top of (c)): `[data-axis="both"]` gives `overflow-y: auto` only,
  still written only while the box overflows in the block axis; the scrollbar's room is the client width the module
  and the data table already read (`offsetWidth − clientWidth`, 0 with hidden scrollbars). Measured clean in both runs
  and directions (§ The same cases without `scrollbar-gutter`). Contract, research R-18, FR-018 and the bodies drop
  "the 15 px gutter" for "the block-axis scrollbar's room, 0 with hidden scrollbars"; the stories lose the 15 px empty
  band; `.box-size` less `offsetWidth − clientWidth` stays.
- (b) Keep the gutter and treat hidden scrollbars as a test artefact: the RTL and both-axes bodies run with classic
  scrollbars only (as 009's `test/browser/scrollbar.test.ts`), and the module resets an RTL box to its start when the
  gutter goes and the user had not scrolled (not measured); the stories and baselines keep showing the clipped 15 px.
- (c) Keep the gutter and drop the both-axes RTL guarantee: README statement that a sticky table that overflows both
  ways under hidden or overlay-like scrollbars loses 15 px at its inline end (LTR) or start (RTL); T080's paired body
  changes to classic scrollbars. Not recommended (FR-008).

**Q-A2. The caption link "past the caption" is met by Chromium alone (A4).** Once the caption has scrolled under the
pinned header, Chromium's focus scroll centres the link and clamps at `scrollTop` 0 before `focusin`; the clearance
writes nothing with or without `before`, the contract's "ring box at the client block-start edge within 0.5 px" never
holds, and the red body (and T024's `before` plant) would be vacuous there.

- (a) Move the "past the caption" half of US1-26 and T079's element-before body to the partly scrolled position of A5
  (the link's border box 2 to 12 px above the client edge, the caption partly away): expected ring box at the client
  block-start edge within 0.5 px, the `<thead>` below it, `elementFromPoint` the link, no jump back; Chromium alone
  −4.7 (fails at red), without `before` 0 → 21.3 (the plant bites). The fully-past position stays as a "the link shown
  whole above the `<thead>`" assertion paired with it, recorded as one the platform alone meets.
- (b) As (a), and drop the fully-past position from the bodies altogether (the platform's centring is not this
  module's behaviour).
- (c) Keep the bodies as written and change the expected value at the fully-past position to Chromium's result
  (`scrollTop` 0, the link at its at-rest position); the `before` rule then has no body that fails without it, and the
  plant is recorded as not biting (a stop-and-ask point of its own). Not recommended.
