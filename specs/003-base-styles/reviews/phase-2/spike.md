# Phase 2 spike record (T007)

**Browser**: Chromium 153.0.8010.12 (Playwright 1.64.1's Chromium, headless, launched by `chromium.launch()` with
`PLAYWRIGHT_BROWSERS_PATH` set), on Node 22 in the container (the pinned Node is 26.13.0; nothing here depends on it).
**Date**: 2026-11-09. **Base**: `base.sha` of this directory.

**Outcome**: no stop-and-ask point of tasks.md was reached. Every measurement of research R-06 (steps 1 to 5) and R-05
agrees with the plan, and every R-10 browser plant bites against the scratch rule it undoes. Two test-writing notes
came out of it (§ Notes for the tests).

## Scratch files (not committed)

The spike changed no file of the repository. It worked in a scratch directory that a small Node server (Node's
`http`, as `packages/tokens/test/browser/serve.ts`) served on `127.0.0.1` under
`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`, with `img-src 'self'` added for `page.html`
only (R-09, plan decision 15). The server inserted plant `<link>`s after the scratch stylesheet on request and could
drop the `tokens.css` link (the US1-6 case).

**Scratch stylesheet** (`scratch.css`), linked after `tokens.css` (generated from the current `source.ts` by
`css(source)`), in this order:
1. a `:root` rule defining the six R-08 tokens with their data-model § New tokens values:
   `--ocelle-line-height-compact: 1.5`, `--ocelle-line-height-prose: 1.65`, `--ocelle-font-size-subhead: 1.125rem`,
   `--ocelle-measure-reading: 68ch`, `--ocelle-measure-cell: 12ch`, `--ocelle-measure-container: 100cqi`;
2. the whole data-model § Rule table as unlayered author rules with the table's selectors and declarations, in the
   table's order: base layer (8 rules, the `forced-colors` rule included), compact scale (4), prose (19), identifier
   wrap (1).

Each plant stylesheet was linked after it. The US1-6 plant ran with the `tokens.css` link dropped; the six scratch
tokens are none of the focus tokens.

**Scratch pages**, built from data-model § Test fixtures, every one linking `tokens.css`, `scratch.css` and a scratch
`layout.css` (host CSS on `data-fixture` selectors only: the `forced-color-adjust: none` region, the grid `60px 1fr`
host, the flex host with a `60px` rail and a `flex: 1` item, the dialog at `inline-size: var(--ocelle-dialog-max-inline)`,
the 300 px two-column `1fr` grid, and three probes: `color: Highlight`, `color: var(--ocelle-color-focus)` and
`inline-size: var(--ocelle-target-min)`):

| Page | Contents | Used by |
|---|---|---|
| `page.html` | link (`href="#target"`), button, text input, `tabindex="0"` div, select, textarea, a two-item `ul`, `code`/`kbd`/`samp`/`pre` outside and inside a `data-ocelle-prose=""` container, `img` (`media.svg`, 200×100), `picture`, `video`, `canvas`, `svg`, all at `width="2000" height="1000"`, and the `forced-color-adjust: none` region with a button and the two colour probes | R-05, US1 plants, list semantics |
| `prose.html` | `h1` to `h6`, a paragraph with a link, an `<a id>` target and inline code, nested lists, a block quote, a 200-character `pre` line followed by a line with runs of spaces, `hr`, three 12-column tables (`#wide` with a 103-character caption ending in a full stop, one with no caption, one with a link in its first cell), the two-column table that fits, a paragraph outside the container and a `data-ocelle-prose="true"` container | R-06 steps 1, 2, 4, 5; US3 plants |
| `prose-rtl.html` | `<html dir="rtl">`, `#wide` with the same caption | R-06 step 5 (rtl) |
| `prose-hosts.html` | `#wide` in a prose container that is the `1fr` grid item beside a 60 px rail, the `flex: 1` item beside a 60 px rail, nested one level inside the grid item, and, with the table that fits, in a prose container inside the definite-width `<dialog>` | R-06 steps 3, 4 |
| `prose-root.html` | `data-ocelle-prose=""` on `<html>`, one paragraph | US3-5 root plant |
| `compact.html` | regular text, a compact region with a nested `regular` region, a `data-ocelle-density="true"` region, the value hook as `""`, `ink` and `true` | US2 plants |
| `compact-root.html` | `data-ocelle-density="compact"` on `<html>`, body text, a button, the target-min probe | US2-4 plants |
| `wrap.html` | the 300 px two-column grid with a hooked 120-character identifier and a short text, the same unhooked, a `data-ocelle-wrap="true"` identifier | US4 plants |

Every scratch page reported zero CSP violations (`securitypolicyviolation` collector, as 002), `page.html` with its
image loaded (`naturalWidth` 200).

## R-06 (verify in the spike)

1. **Accessibility tree** (`Accessibility.getFullAXTree` through a CDP session), at 320 px and 1280 px, light and
   dark: each of the four prose tables keeps role `table`. `#wide` is named by its caption ("Quarterly figures for
   each of the twelve regions, in thousands, with the totals at the end of the row."); the table with no caption has
   the empty name. Each 12-column table has 3 `row`, 12 `columnheader` and 24 `cell` nodes, the table that fits 2, 2
   and 2. Walking `childIds` from the table: the first row holds `columnheader` nodes named by their header text, and
   every cell of each body row sits at the child index of a `columnheader` of the same row length (association
   holds in all four tables). With `#wide` focused by Tab, the focused AX node (`focused` property) is the table, role
   `table`, named by the caption. No better observable was found: the nodes carry no row or column index property, so
   the test uses the `childIds` structure as R-06 plans.
2. **12ch floor**: `min-inline-size: var(--ocelle-measure-cell)` on `th` and `td` holds in the anonymous table
   layout. At 320 px every one of the 112 cells of the prose tables is at least `12 × measureText("0")` wide in its
   own font (narrowest margin 0: the cells sit exactly at the floor, 117.375 px for 16 px text; `min-inline-size`
   computes `117.375px`). The four cells of the fitting table (`th` at 12 px, `td` at 16 px) measure 117.375 px each, the column taking the 16 px floor of its `td`. The content-floor
   alternative was not needed.
3. **Hosts at 320 px**: `documentElement.scrollWidth` 320; in the grid, flex and nested hosts the prose container is
   260 px wide, and `#wide` has `clientWidth` 260 against `scrollWidth` 1409. At 200 % zoom (640 px CSS viewport,
   `deviceScaleFactor: 2`): page 640, containers 580, tables 580 against 1409. **Dialog at 1280 px** (`showModal()`
   through `page.evaluate`): the dialog is 1242 px; the table that fits has `clientWidth` 1204 = `scrollWidth` 1204
   and is never focused across four Tab presses (the Tab cycle is `BODY`, `wide-dialog`, `BODY`, `wide-dialog`); the
   wide table in it overflows (1204 against 1409) and is a tab stop.
4. **Fitting-table plant** `[data-ocelle-prose=""] :where(table) { max-inline-size: var(--ocelle-measure-cell) }`:
   bites. At 320 px in normal flow the table that fits becomes `clientWidth` 117 against `scrollWidth` 235 and a tab
   stop (`fits` appears in the Tab cycle); in the dialog likewise (117 against 235, first Tab lands on it). Without
   it: 320 = 320 and never a tab stop. `overflow-x: scroll` does not bite (320 = 320, not a tab stop), as R-10 says.
5. **Caption line boxes** of `#wide` at 320 px (`Range.getClientRects()` on the caption's contents, rects with the
   same `top` within 1 px merged into one line box, smallest `left`, largest `right`; the table's visible box from
   `getBoundingClientRect()`, x 0 to 320):
   - `ltr`, `scrollLeft` 0: 3 rects, 3 lines, x 0–289.5, 0–316.7, 0–110.8: inside, each starting at the start edge.
   - `ltr`, after Tab to the table and two ArrowRight presses (`scrollLeft` 80 once settled): the same lines,
     inside.
   - `rtl`, `scrollLeft` 0: 4 rects (the full stop is a rect of its own) merged into 3 lines, x 30.5–320, 3.3–320,
     208.2–320: inside, each ending at the right (start) edge. The merge is exercised.
   - `rtl`, at the most negative `scrollLeft` (-1088): the same lines, inside.

   The three caption plants each bite alone:

   | Plant | `ltr` 0 | `ltr` scrolled | `rtl` 0 | `rtl` most negative |
   |---|---|---|---|---|
   | `max-inline-size: none` | outside (one line 0–725.2) | outside | outside (-406.2–320) | outside |
   | `position: static` | passes | outside (lines from x -80) | passes | outside (lines from x 1091.3) |
   | `text-align: center` | not at the start edge (15.2, 1.6, 104.6) | passes | not at the start edge | passes |

   So `max-inline-size: none` fails the `scrollLeft`-0 containment assertion, `position: static` only the scrolled
   assertions and `text-align: center` only the start-edge assertion, as R-06 step 5 requires.

Also measured for US3-3: the focused `#wide` computes `outline-offset: -3px` (`outline-width: 3px`), so its ring lies
at x 0 to 320 inside the 320 px viewport. The plant `outline-offset: var(--ocelle-focus-offset)` puts it at x -5 to
325 (bites).

## R-05: the forced-colours ring in a `forced-color-adjust: none` region

`emulateMedia({ forcedColors: "active" })`, the button in the region focused by Tab:

| Theme | Ring colour | `color: Highlight` probe | `--ocelle-color-focus` probe | With the plant (`Highlight` rule removed) |
|---|---|---|---|---|
| light | `rgba(5, 0, 73, 0.8)` | `rgba(5, 0, 73, 0.8)` | `rgb(143, 94, 15)` | `rgb(143, 94, 15)` |
| dark | `rgba(0, 230, 255, 0.8)` | `rgba(0, 230, 255, 0.8)` | `rgb(224, 162, 58)` | `rgb(224, 162, 58)` |

The ring is observable in the region: equal to `Highlight` with the rule and to the token focus colour without it.
Outside the region the focused button computes `rgba(5, 0, 73, 0.8)` (forced by the browser), style `solid`, width
3px, and its border is `2px outset`.

## R-10 browser plants

Each plant was linked after the scratch stylesheet on its scratch page. "Without" is the guard's observation with no
plant (it passes); "with" is the problem the guard's helper reports.

| Guard | Plant | Without | With (bites) |
|---|---|---|---|
| control borders (US1-4), forced colours | `button { border: 0 }` | button `2px outset`, input `2px inset`, region button `2px outset` | button and region button `0px none` |
| pointer click shows no ring (US1-2) | `:focus { outline-style: solid }` | link, button, `tabindex="0"`: `none`; input: `solid` | link, button, `tabindex="0"`: `solid` |
| outline style without tokens (US1-6) | the 002 shorthand, `tokens.css` dropped | Tab-focused button `solid` (width 3px, the UA's `medium`); body margin 0; `::before` `border-box` | `none` |
| forced-colours ring in the region (US1-4) | `@media (forced-colors: active) { :where(:focus-visible) { outline-color: var(--ocelle-color-focus) } }` | `Highlight` | the token focus colour (table above) |
| media ratio of `img`, `video`, `svg` (US1-10) | `:where(img, video, svg) { block-size: revert-layer }` | all five 320 × 160 at 320 px | `img`, `picture`'s `img`, `video`, `svg` 320 × 1000; `canvas` 320 × 160 |
| media ratio of `canvas` (US1-10) | `:where(canvas) { aspect-ratio: 1 / 1 }` | 320 × 160 | `canvas` 320 × 320 |
| only the region is compact (US2-2) | `body { font-size: var(--ocelle-font-size-sm) }` | regular text 16px / 23.2px | 14px / 20.3px |
| root size and target-min (US2-4) | `[data-ocelle-density="compact"] { font-size: var(--ocelle-font-size-sm) }` | root 16px, target-min 44 px, body 14px / 21px | root 14px, target-min 38.5 px |
| ring under compact on `<html>` (US2-4) | `[data-ocelle-density="compact"] :where(:focus-visible) { outline-width: var(--ocelle-border-width) }` | ring 3px | 1px |
| density undocumented value (FR-005) | `[data-ocelle-density] { … }` (presence form) | `"true"` region 16px / 23.2px | 14px / 21px |
| value undocumented value (US2-3) | `[data-ocelle-value] { color: var(--ocelle-color-ink-muted) }` | `"true"` span ink `rgb(21, 19, 15)` | ink-muted `rgb(94, 88, 79)` |
| prose outside its container (US3-5) | `p { line-height: var(--ocelle-line-height-prose) }` | outside paragraph 23.2px | 26.4px |
| prose undocumented value (US3-5) | `[data-ocelle-prose] :where(p) { … }` (presence form) | `"true"` paragraph 23.2px | 26.4px |
| prose rule not on `<html>` (US3-5) | `[data-ocelle-prose] { line-height: var(--ocelle-line-height-prose) }` | `<html>` 16px / `normal` | `<html>` line height 26.4px (the body paragraph stays 23.2px, so the guard reads the root) |
| no page scroll in the hosts (US3-3, SC-004) | `[data-ocelle-prose=""] :where(table) { container-type: normal }` | page 320, containers 260 | page 1469, containers 1408.5 (`contain: none` does not bite: page 320) |
| inset table ring (US3-3) | `… :where(table:focus-visible) { outline-offset: var(--ocelle-focus-offset) }` | ring x 0–320 | x -5–325 |
| caption, three plants (US3-3, US3-9) | see R-06 step 5 | inside, at the start edge | each fails its own assertion |
| table that fits (US3-3) | `… :where(table) { max-inline-size: var(--ocelle-measure-cell) }` | 320 = 320, not a tab stop | 117 against 235, tab stop |
| link underlined in every state (US3-6) | `… :where(a:any-link:hover, a:any-link:focus-visible) { text-decoration-line: none }` | `underline` at rest, hover and keyboard focus | `none` on hover and focus |
| `<a id>` target unstyled (US3-6) | `[data-ocelle-prose=""] :where(a) { color: var(--ocelle-color-link) }` | the running text's ink | link colour `rgb(132, 86, 13)` |
| `pre` copy (US3-8) | `[data-ocelle-prose=""] :where(pre) { white-space: normal }` | the selection equals the source text, `pre-wrap` | the runs of spaces and the line break collapse; a bare `pre { white-space: normal }` does not bite (`pre-wrap` kept) |
| wrap is opt-in (US4-2) | `* { overflow-wrap: anywhere }` | unhooked column 1058.4 px against 38.8 px | both 150 px |
| no ellipsis (US4-1) | `[data-ocelle-wrap] { text-overflow: ellipsis; overflow: hidden; white-space: nowrap }` | `clip`, not clipped, 8 lines | `ellipsis`, clipped, 1 line |
| identifier copy (US4-3) | `[data-ocelle-wrap] { text-transform: uppercase }` | selection equals the source | differs |
| wrap undocumented value (FR-005) | `[data-ocelle-wrap] { overflow-wrap: anywhere }` | `"true"` identifier `normal` | `anywhere` |

**Plants that have no bite, as planned** (recorded, not stop points):
- **List semantics** (FR-007): with `ul { list-style: none }`, `ul { display: contents }`, `ul { display: grid }`,
  `ul { display: flex }`, `ul { display: block }`, and `ul, li { list-style: none } li { display: block }`, the AX
  tree still holds one `list` node with both `listitem` nodes. No CSS plant drops the role in Chromium 153; the test
  keeps role `list` next to the `box-sizing` positive with this recorded reason (R-10).
- **Table semantics** (US3-7): `[data-ocelle-prose=""] :where(table) { display: grid }` keeps role `table`, the
  caption name, 3 rows, 12 column headers, 24 cells and the association, in every table. By R-10's own condition the
  guard has no plant and this measurement is its recorded reason (phase 4).
- The alternatives R-10 already rejects were confirmed not to bite: `block-size: revert` (media stay 320 × 160),
  `contain: none` (page 320), `overflow-x: scroll` (table fits, no tab stop), bare `pre { white-space: normal }`.

## Notes for the tests

- **Pointer click on an in-page link**: a click on `<a href="#target">` navigates to the fragment, and Chromium then
  leaves no element focused, so the link half of the pointer guard would read `none` with or without the plant. With
  the click's default prevented (a listener added through `page.evaluate`, which the page's CSP does not govern) the
  link keeps focus after the click: `none` without the plant, `solid` with it. The US1-2 test prevents the default
  before clicking.
- **Scrolled caption**: ArrowRight scrolls smoothly (`scrollLeft` 0, 18, 61, 80 over about 150 ms), so the scrolled
  assertions wait until `scrollLeft` is above 0 and stable before reading the rects (phase 4).
- **`pre` copy**: the selection drops a trailing line break before `</pre>`, so the fixture's `pre` ends without one
  (phase 4).

## Source-level plants (R-10 § Source-level guards)

These plants can only bite against the checks written later in this phase, so the spike does not run them. They run
as T009's tests in `packages/styles/test/source.test.ts`: each plant string of R-10 § Source-level guards goes through
the check's helper, which must report it, and each boundary string must pass. Their result is recorded below once the
phase is green.
