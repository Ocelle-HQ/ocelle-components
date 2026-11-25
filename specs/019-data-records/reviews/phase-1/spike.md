# Phase 1 spike (T003)

Run on 2026-11-17 in this container (Linux x64, Node 22.23.4, HeadlessChrome 156.0.8078.4 from Playwright 1.64.1's
`/opt/pw-browsers`, Lit 3.3.3, axe-core 4.14.0 from the root `node_modules`). Scratch files only, in the session
scratchpad: a throw-away Vitest browser configuration and one spike file run in Vitest's browser mode at the in-process
harness's setup (tokens generated from `packages/tokens/src/source.ts` with the `@font-face` rules removed, `base.css`
adopted, a 1280 × 800 viewport resized through `page.viewport`), with Chromium's AX tree read through the repository's
`axTree` command. Nothing of them is committed. Where the vendored font matters (the late web font of R-05 and the
one-long-word fraction of R-02), `SchibstedGrotesk-wght.woff2` was loaded as a `FontFace`.

The stand-in is `ocelle-data-table` defined in the spike's own frame, built on 009's `OverflowRegion` as T016 and
contracts/ocelle-data-table.md describe it: `slotAssignment: "manual"`, the module's structure plus the empty
`.box-size`, the four own rules (`:host { display: block; min-inline-size: 0 }`, `:host([hidden])`,
`:host .region-track { inline-size: fit-content }`, `:host .box-size { block-size: 0 }`), `overflowRegionStyles`
after them, the first `table` child assigned in `updated()`, the name `label?.trim() || captionText || undefined`
(R-04's walk), one `MutationObserver` (`childList`, `subtree`, `characterData`, `hidden` / `aria-hidden` / `alt`), one
`ResizeObserver` on `.box-size` writing `contentBoxSize[0].inlineSize` as `--data-table-box-size` into its own
per-instance sheet adopted after the module's, and the end fade written one animation frame after the rendered fade's
end state changes, as the measured px width of `.region-edge.end`. The page had blocks 1 and 2 as research R-06 and
contracts/styles-data-table.md give them, as a document sheet after `base.css`. Switchable variants of the stand-in
gave the three loop plants of R-07.

**Outcome: two stop-and-ask points reached.** Every layout, loop, overflow, prose and print expectation of research
holds (§§ 3 to 8). Two results do not:

1. **The sunset check (§ 2): axe-core 4.14.0 is clean** on an overflowing data table named by a non-blank host
   `aria-label`, and on 009's `ocelle-scroller` named the same way, with the `axe` gate's own rule selection: no
   violation, no incomplete result; `aria-prohibited-attr` runs on the host and passes. plan.md § Complexity Tracking
   names a clean result a stop-and-ask point (tasks.md § Stop-and-ask points, third item).
2. **The AX tree differs from the same table outside in one respect (§ 1):** Chromium names each column header, and
   its static text, by its drawn upper-case text ("ID", not "Id"), because block 1's column-header rule sets
   `text-transform: uppercase`. Research R-01 sends any difference beyond the region's `group` node to the operator.

The phase stops here: no scaffold, no red commit. The questions are at the end. T005 (the operator's
`.sk-data-table` inventory for research R-16) is also still open and blocks T013's mapping statements before the red
commit.

## 1. The AX tree and axe, inside the element and outside (R-01)

Markup: a `<main>` with the element (`label="Work packages"`) around a table with a caption "Work packages", five
`<th scope="col">` cells (Id, Title, Lane, Owner, Link) and four body rows (a `<th scope="row">` and four cells, one a
link), the same table in a plain `<div>` beside it.

| Check | 1280 px (fits) | 320 px (overflows: box 320, scroll width 504) |
|---|---|---|
| box state | no `tabindex`, `role`, `aria-label` or `data-fade` | `tabindex="0"`, `group` "Work packages", `data-fade="end"` |
| AX subtree of the element, unignored | host `generic`, one shadow `generic`, then the table | host `generic`, one shadow `generic`, `group` "Work packages", then the table |
| the table's nodes | `table` "Work packages", `caption`, `rowgroup`, `row`, 5 `columnheader`, 4 `row` with `rowheader` and 4 `cell` each, the links | the same |
| against the same table outside | equal, **except the five column-header names and their static text, upper case inside** | the same |
| same, with the outside table's column headers given `text-transform: uppercase` (test-only) | equal | equal |
| same, names compared case-folded | equal | equal |
| axe `td-headers-attr`, `th-has-data-cells`, `table-fake-caption` | pass inside and outside | pass inside and outside |
| axe `scrollable-region-focusable` | inapplicable (nothing scrolls) | passes inside (the box is focusable); inapplicable outside |
| axe full run on the element | no violation, no incomplete | no violation, no incomplete |

A `headers`/`id` table (two `<th id>` and two `<td headers>`) inside the element: `td-headers-attr` and
`th-has-data-cells` pass; the cells are exposed under their column headers.

The shadow wrappers add only `generic` nodes while the table fits and the `group` while it overflows, as R-01 states.
The one other difference is the column headers' case: Chromium applies `text-transform` to accessible names, as
`packages/elements/README.md` already records for 011's eyebrow heading ("Chromium names the heading by its drawn,
upper-case text"). The element itself adds nothing: the difference comes from block 1's style and would appear for any
table given that style. **→ Question 2.**

## 2. The sunset check of plan.md § Complexity Tracking (host `aria-label`)

Each page at 320 px; axe-core 4.14.0 run on the document twice, with axe's defaults and with the `axe` gate's
selection (`gates/lib/axe-rules.ts`: every default rule and every `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa`
rule, less experimental and harness-document rules).

| Host | AX (first nodes) | axe (defaults) | axe (gate's selection) |
|---|---|---|---|
| data table, overflowing, `aria-label="Deployments"`, `label="Work packages"` | host `generic` "Deployments", `generic`, `group` "Deployments", `table` "Work packages" | only the page-level `page-has-heading-one` (moderate; a harness-document rule the gate does not run) | no violation, no incomplete; `aria-prohibited-attr` applies to the host and the box and passes |
| data table, fitting, the same host `aria-label` | host `generic` "Deployments", `generic`, `table` | the same | the same |
| data table, overflowing, blank host `aria-label="  "` | host `generic` (no name), `generic`, `group` "Work packages" | the same | the same |
| 009's `ocelle-scroller`, overflowing, `aria-label="Deployments"`, `label="Strip"` | host `generic` "Deployments", `generic`, `group` "Deployments" | the same | the same |
| 009's `ocelle-scroller`, blank host `aria-label=" "` | host `generic`, `generic`, `group` "Strip" | the same | the same |

So the pinned axe-core reports no serious or critical finding on the data table named by a host `aria-label`, blank
or not, and none on 009's element either. The Complexity Tracking row's sunset condition is met for the data table's
region. The Chromium AX tree does show the host itself as a `generic` node named "Deployments" beside the `group` of
the same name (the README's Host ARIA section says the same of the closed dialog and drawer); axe does not report it.
**→ Question 1.**

## 3. The track at `fit-content` (R-03)

| Table | 1280 px | 600 px | 320 px |
|---|---|---|---|
| US1 table with a hyphenated identifier `mission-019-data-records-x` | fits, table 1270 (box less 10 px ring room) | fits, 590 | fits, 310: the identifier breaks at its hyphens |
| two columns, a 26-letter identifier `abcdefghijklmnopqrstuvwxyz`, with and without `wrap="anywhere"` | fits | fits | fits: its min-content width is under 310 px |
| US1 table with the unbroken 26-character identifier `01JD8X2K7Q9M4N6P3R5T0V2W8Y` | fits | fits | overflows: scroll width 504, `group` "Work packages", `data-fade="end"`; page scroll width 320 |
| two columns, a 36-character unbroken identifier, 320 px | | | without `wrap`: overflows (366 / 320); `wrap="anywhere"` set later: fits (320 / 320), equal to a fresh load with it |

As R-03 expects: cells wrap first, and the table overflows only when its min-content width does not fit (an unbroken
identifier without the wrap policy, or more columns than fit at their longest word). For the red bodies: the US1
table's identifier must have no break opportunity (a ULID-like string, not a hyphenated slug), or the US1-4 table fits
at 320 px.

## 4. The overflow state after changes, against a fresh load (R-05)

At 600 px (the late font at 500 px), each state after the change compared with a fresh load of the end state:

| Change | Result | Same as a fresh load |
|---|---|---|
| `<tbody>` swapped fitting → overflowing → fitting | overflowing (758 / 600, `group`, `end`), then fitting | yes, both |
| whole `<table>` swapped (`innerHTML`, and `replaceChild`) | the same | yes |
| a cell's text node edited (`characterData`) to overflow and back | overflowing (994 / 600), then fitting | yes, both |
| the web font loaded late (`document.fonts.add` after first render) | still overflowing, scroll width 591 → 546 | yes (546 / 500 fresh) |
| the table given `hidden`, then shown | fitting with no `tabindex`, then overflowing again | yes |
| `wrap="anywhere"` set on an overflowing host | fits | yes |

No change was found after which the overflow state differs from a fresh load: the module's own triggers (track and box
resize, `slotchange`) see every case. Research R-05's result is "none", so T013 adds no conditional README statement.

## 5. The caption (R-07)

At 320 px, US1 table overflowing, a two-line caption:

| Position | `data-fade` | caption `max-inline-size` | caption start = table start | lines inside the unmasked extent |
|---|---|---|---|---|
| at rest | `end` | 278 px (320 − 10 − 32) | yes (5 = 5) | yes (rights 239.9, 278.7 ≤ 288) |
| scrolled to the middle | `both` | 278 px | yes (−87 = −87) | not asserted (the caption scrolls with the table, Q-F (b)) |
| scrolled to the end | `start` | 310 px (end fade gone) | yes (−179 = −179) | not asserted |

- `position: static` computed; `--data-table-box-size: 320px` written on `.region-track` reaches the slotted caption
  (its computed `--data-table-box-size` is `320px`), so both properties cross the flat tree.
- A fitting table in a 300 px wrapper: no `data-fade`, cap 290 px, the long caption wraps at the table's width (290).
- The narrow column (a 400 px wrapper at 1280 px, resized to 600 px; a table that overflows at both): `data-fade="end"`
  at rest at both widths, cap 358 then 558 px, every line inside the unmasked extent (368, 568). No loop error.
- The end-fade body: a 400 px block host, a fitting three-column table, caption "Deploy approvals Deploy approvals
  Deploy approvals D" (one line, 369.6 px, under the 390 px cap; in the harness's fallback font). A cell edit makes the
  table overflow: after `settle`, `data-fade="end"`, two line boxes, both inside the unmasked extent (≤ 368), the
  computed `--data-table-end-fade` on `.region-track` `32px`, equal to `.region-edge.end`'s width (32). The edit
  undone: no `data-fade`, one line, the property empty. One end-fade write per change; no loop error. The caption text
  depends on the font; the body should assert its precondition (one line at the fitting cap) and the harness that loads
  Schibsted Grotesk may need its own text.
- A block host on first load whose caption rewraps between the fallback cap (`100cqi`, the viewport) and the measured
  cap (a 500 px wrapper, an overflowing table, a 150-word caption): 13 lines inside the unmasked extent, no loop error.
  A caption only rewraps between the two caps when the table overflows: a fitting table's caption is never wider than
  the table whatever the cap.

## 6. Hosts and the `ResizeObserver` loop (R-02, R-07)

Shrink-to-fit hosts at 1280 px, a fitting two-column table with a long caption:

| Host | host width | table width | caption | `.box-size` callbacks | box-size writes | stable after two more `settle` | loop error |
|---|---|---|---|---|---|---|---|
| open `<dialog>` (`showModal()`) | 122.5 | 112.5 (+10 ring room) | wraps at the table's width, 6 lines | 1 | 1 | yes | none |
| `display: inline-block` wrapper | 122.5 | 112.5 | the same | 1 | 1 | yes | none |
| column flex, `align-items: flex-start` | 122.5 | 112.5 | the same | 1 | 1 | yes | none |

Never 0 px wide. A `hidden` host shown in a 400 px wrapper: overflowing, caption inside the unmasked extent, no loop
error.

The one-long-word body (an inline-block, cells "Ok" and "3", caption "Deployment approvals pending"): the table widens
to the caption's longest word, no `tabindex`, no `data-fade`, host = table + 10 px, one callback, no loop error at every
measured `letter-spacing`. The box's width depends on the font, so the test-only `letter-spacing` that gives a
fractional part between 0.1 and 0.4 px is per harness:

| Font | `letter-spacing` | box width | fraction |
|---|---|---|---|
| fallback (in-process harness, `@font-face` removed) | 0.07 px | 91.297 | 0.297 (0.05 px gives 0.109) |
| Schibsted Grotesk (the fixture harness) | 0.02 px | 89.203 | 0.203 (also 0.12 px, 0.22 px) |

Without `letter-spacing` the fraction is 0.609 (fallback), outside the range. The plants of R-07 bite as expected:

| Variant | Case | Loop error |
|---|---|---|
| the specified design | every case above | none |
| the box size written as `clientWidth` | one-long-word, fractions 0.109, 0.297 (fallback) and every in-range value with Schibsted Grotesk | yes ("ResizeObserver loop completed with undelivered notifications", on `window` and through `console.error`) |
| the same | fractions 0.609 and 0.906 | none (the rounding goes up) |
| the observer on `.region-box`, writing synchronously | the first-load block host above | yes |
| the end fade written in the task of the change | the end-fade body's cell edit | yes |

## 7. The prose override (FR-012, R-06)

The element inside `[data-ocelle-prose=""]` against the same element outside, computed values of every property R-06
restates on the table, the caption, a column header, a row header, a body cell and a last-row cell: no difference,
except the table box's own inherited `line-height` (26.4 px from the prose container, 23.2 px outside), which 003's
prose rules do not set on the table and which no text of the table uses (the caption and the cells set their own).
003's rules still reach a plain table in the same prose container (its `th` keeps 8 px / 12 px padding, weight 600).
Block 2 beats 003's prose rules on every target.

## 8. Print (R-07's README line)

The US1 table overflowing in a 320 px wrapper, printed to PDF from Chromium (`page.pdf`, print media): the region keeps
`overflow-x: auto` and the end fade's mask. The PDF shows the caption and the first two columns only; the columns past
the box (Lane, Owner, Link) are clipped and the identifier fades at the box's end. The README states that printed
content past the box is clipped and that a consumer who prints sets a print rule of its own; no print rule is added.

## Questions for the operator

**Question 1. The sunset check is clean (§ 2).** axe-core 4.14.0, with the `axe` gate's rule selection, reports no
serious or critical finding (no violation, no incomplete) on an `ocelle-data-table` named by a non-blank host
`aria-label`, overflowing or fitting, nor on a blank one, nor on 009's `ocelle-scroller`. plan.md § Complexity Tracking
makes this a stop: the operator decides whether phase 1 adds that state's story or the row stays.

- (a) Phase 1 adds one story, "overflows, named by a host `aria-label`" (`aria-label="Deployments"` beside
  `label="Work packages"`), so 13 data-table stories and 26 baselines (`visual:update` must print `(26 added, 0
  changed, 0 removed)`); T014, T019 and T020 change accordingly, and the Complexity Tracking row's scope drops the data
  table's region (the timeline and the chain stay, each checked by its own spike). The browser bodies stay.
- (b) Phase 1 adds two stories, the non-blank and the blank host `aria-label` (14 stories, 28 baselines), and the row
  drops the data table's region as in (a).
- (c) The row stays as it is: no story for the state, the browser bodies are the evidence, and this result is recorded
  in the row; the check is repeated on the next axe-core upgrade.

**Question 2. Column-header names are upper case in the AX tree (§ 1).** With block 1's `text-transform: uppercase`,
Chromium names each column header by its drawn text ("ID", "TITLE"), so US1-1's "exactly as the same `<table>` outside
the element" does not hold against an unstyled table; it holds in structure, roles, row and cell association and every
other name. 011's eyebrow heading has the same exposure, recorded in the elements README.

- (a) Keep the uppercase eyebrow. US1-1's oracle compares the element's subtree with the same table outside given the
  same column-header `text-transform` by a test-only rule (so the element adds nothing, which is what FR-003 and FR-004
  guard), plus one assertion that the column headers are named in upper case; both READMEs state that Chromium names
  column headers by their drawn upper-case text.
- (b) Keep the uppercase eyebrow. US1-1's oracle compares against the unstyled table with names compared case-folded,
  plus the same upper-case assertion and README line as (a).
- (c) Drop `text-transform: uppercase` from the column headers (FR-006, US1-3 and research R-06 change), so the names
  stay as written; the headers keep the other three eyebrow tokens and the colour.

**Still open before the red commit: T005.** Research R-16 holds no `.sk-data-table` inventory yet. The operator
supplies kitty-mission-ui's `.sk-data-table` modifiers and states with a count each (role names only), recorded by the
planner in R-16 in a documentation commit of its own; T013's mapping statements are blocked until then.

## Facts for the red bodies (no decision needed)

- The US1 table's 26-character identifier has no break opportunity (for example `01JD8X2K7Q9M4N6P3R5T0V2W8Y`); a
  hyphenated slug breaks at its hyphens and the table fits at 320 px (§ 3).
- The one-long-word precondition needs a per-harness `letter-spacing` (§ 6): 0.07 px in process, 0.02 px on the
  fixture with Schibsted Grotesk.
- The end-fade body's caption is chosen per font and asserts its one-line precondition first (§ 5).
- Research R-05 records "none": no change of the table escapes the module (§ 4).
