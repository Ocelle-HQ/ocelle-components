# Contract: the `@ocelle/styles` data-table rules

`packages/styles/src/base.css` gains four blocks: the data-table rules (block 1), the prose override that follows
them (block 2) and the numeric-cell hook after it (block 4, inventory decision IQ-3), all after 003's identifier-wrap
rule; and the four pre-upgrade list-item rules (block 3), in the base layer right after 013's `ocelle-facts`
pre-upgrade rule and before the focus rule (recheck Q5 (b), 2026-11-17). Research R-06, R-07, R-08, R-18, R-19 and R-20
have the values and the reasons. 003's `packages/styles/test/source.test.ts` transcribes blocks 1, 2 and 4 after the
wrap rule, in the order wrap, block 1, block 2, block 4 (its last-rule assertion), and block 3 in its `baseLayer`
slice after the facts rule (the timeline's two rules, then the chain's two). Phase 1's red adds blocks 1, 2 and 4,
phase 2's red the timeline's rules and phase 3's red the chain's, each in the phase whose green adds them (R-06).

## Block 1: the data-table rules, at specificity (0,0,0)

The caption's cap reads `--data-table-box-size` and `--data-table-end-fade`, which `ocelle-data-table` writes on
its `.region-track`. The two names are a documented base-style hook between `@ocelle/elements` and `@ocelle/styles`,
public surface under constitution VII (analysis I7 (a)): the README of each package names them, each CHANGELOG lists
them as surface, and a rename in either package is a breaking change for both. Before upgrade neither is set, and the
cap falls back to `--ocelle-measure-container` with no end fade.

Every selector is wrapped whole in `:where()`, so any consumer rule on the same element wins (US1-14). Only the direct
table of an `ocelle-data-table` is selected, whether the element is defined or not, so a nested table is not styled.

| Selector (inside `:where()`) | Purpose |
|---|---|
| `ocelle-data-table > table` | `border-collapse`, `inline-size: 100%`, `margin: 0`, sans, figures |
| `ocelle-data-table > table > caption` | caption type, colour, `text-align: start`, `position: static` (not sticky until 009's option of R-17; Q-F (b)), no inline size containment (its longest word widens the table, PLAN-FRESH-3-002 (b)), `max-inline-size: calc(var(--data-table-box-size, var(--ocelle-measure-container)) - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)) - var(--data-table-end-fade, 0 * var(--ocelle-scroller-fade-size)))`: the box's measured width less the ring room on both sides and less the end fade only while it shows (the data table writes `--data-table-end-fade`, the measured px width of its `.region-edge.end`, on `.region-track` one animation frame after `.region-box`'s `data-fade` moves into or out of `end` or `both`, outside any `ResizeObserver` delivery), so a fitting table's cap is its own width (R-07) |
| `ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th)` | compact padding, `sm` / `line-height-compact`, `ink-soft`, row rule, `text-align: start`, `vertical-align: top` |
| `… > thead > tr > th`, `… th[scope="col"]`, `… th[scope="colgroup"]` | eyebrow header in 011's eyebrow tokens (recheck Q1 (a)): `font-size-eyebrow`, `font-weight-eyebrow` (600), upper case, `tracking-eyebrow`, `color-eyebrow`, `rule-strong` rule |
| `… th[scope="row"]`, `… th[scope="rowgroup"]`, `… > :is(tbody, tfoot) > tr > th:not([scope])` | row header: `sm`, medium, `ink`, no case or tracking |
| `ocelle-data-table > table > :is(tbody, tfoot):last-child > tr:last-child > :is(td, th)` | no rule below the table's last row only; rows of earlier row groups keep theirs (a `<tfoot>` goes after the `<tbody>` groups, as HTML says; the README states the source-order rule) |
| `ocelle-data-table[wrap="anywhere"] > table > :is(tbody, tfoot) > tr > td` | `overflow-wrap: anywhere` |
| `ocelle-data-table[sticky-header] > table` | `border-collapse: separate`; `border-spacing: 0` (the header rule travels with the pinned row; the row rules, drawn as each cell's block-end border, look as before; FR-017, R-18) |
| `ocelle-data-table[sticky-header] > table > thead` | `position: sticky`; `inset-block-start: 0` (all header rows pinned as one group; no `z-index`: a positioned row group paints above the unpositioned body rows) |
| `ocelle-data-table[sticky-header] > table > thead > tr > :is(td, th)` | `background-color: var(--ocelle-color-sheet)` (opaque, so no row shows through; the operator's decision Q-I1, 2026-11-18) |
| `ocelle-data-table[striped] > table > tbody > tr:nth-child(even) > :is(td, th)` | `background-color: var(--ocelle-color-inset)` (FR-060; each `<tbody>` counts its own rows, hidden rows included) |
| `ocelle-data-table > table > tbody > tr:hover > :is(td, th)` | `background-color: var(--ocelle-color-hover-bg)` (FR-061), after the stripe rule so it wins on a striped row |
| inside `@media (forced-colors: active)` | text and rules in `CanvasText`, no `forced-color-adjust: none`; the row band (FR-013): `ocelle-data-table > table > tbody > tr > :first-child` gets `border-inline-start: var(--ocelle-bar-width) solid Canvas`, then `CanvasText` on `ocelle-data-table[striped]`'s even rows, then `Highlight` on the hovered row, in that order (R-20); the grounds of the stripe, the hover and the pinned header become the system background, as forced colours draw any ground |

The selections are written in the order shown, so a later one wins where two match: a corner cell with `scope="row"`
in `<thead>` is a row header.

## Block 2: the prose override, at specificity (0,1,0)

The same targets, under `[data-ocelle-prose=""] :where(…)`, placed after 003's prose table rules. The block restates
each property 003's prose rules set, with the value block 1 gives. It also sets these values:

| Target | Properties and values |
|---|---|
| table | `display: table`, `overflow-x: visible`, `max-inline-size: none`, `container-type: normal`, `margin-block: 0`, `border-collapse: collapse` |
| cells | `min-inline-size: auto`, block 1's padding, rule and `text-align` |
| header cells | block 1's font size, weight, figures and rule colour, by selection |
| caption | block 1's `max-inline-size` cap, `position: static`, `inset-inline-start: auto`, `text-align`, font size and line height |
| `ocelle-data-table[sticky-header] > table` | `border-collapse: separate` (003's prose table rule sets `collapse` at (0,1,0); the sticky table keeps block 1's value inside prose too, R-18) |

A node test (`packages/styles/test/prose-override.test.ts`) selects every `[data-ocelle-prose=""]` rule in `base.css`
whose selector can match a table, caption, row group, row, column or cell, pseudo-classes included (for example
`:where(table:focus-visible)`), and fails on any of their properties the override does not restate on the matching
target, unless the test's not-applicable list records it with its reason (`outline` and `outline-offset` of
`:where(table:focus-visible)`: the region's box is the tab stop). It does not list 003's selector forms, so a later
003 rule on another table part is read (PLAN-TESTABILITY-1-008).

## Block 4: the numeric-cell hook, at specificity (0,1,0) (FR-019, R-19, inventory decision IQ-3)

One rule after block 2, so it wins over 003's prose cell rule and over block 2's `text-align: start` inside a prose
container, and over block 1 everywhere:

| Selector | Values |
|---|---|
| `[data-ocelle-align="end"]` | `text-align: end`; `font-variant-numeric: var(--ocelle-figures)` |

Only the value `end` matches (the Hooks table's rule: any other value has no effect). It is a documented base-style
hook, public surface under constitution VII: the README's Hooks table gains the row `data-ocelle-align` | `end` |
numeric cells, with a § Numeric cells section, and the CHANGELOG names it. It sets no font size, weight, colour,
padding or wrap, so a header cell keeps its eyebrow type and a body cell its compact padding, and a consumer rule of
(0,1,0) placed after `@ocelle/styles`, or above (0,1,0), overrides it.

## Block 3: list items before upgrade, at specificity (0,0,0)

In the base layer, beside 013's facts rule (recheck Q5 (b)): the timeline's two rules right after
`:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden]))`, then the chain's two, then 003's focus rule. The base
layer's header comment names them with the facts, and `packages/styles/README.md` documents them beside § Facts before
upgrade.

| Selector (inside `:where()`) | Values |
|---|---|
| `ocelle-event-timeline:not(:defined) > ocelle-timeline-event:not([hidden]):not([aria-hidden="true"])` | `display: block` |
| `ocelle-event-timeline:not(:defined) > ocelle-timeline-event[aria-hidden="true"]` | `display: none` |
| `ocelle-evidence-chain:not(:defined) > ocelle-evidence-step:not([hidden]):not([aria-hidden="true"])` | `display: block` |
| `ocelle-evidence-chain:not(:defined) > ocelle-evidence-step[aria-hidden="true"]` | `display: none` |

As 013's rule for facts. One visible item per line before upgrade; attribute times, markers and ordinals show only
after upgrade (the README's "Before upgrade" lines). A slotted time (plan gate Q-E) is light DOM and shows inline where
written; no rule is added for it. An `aria-hidden="true"` item is not shown before upgrade, as after it
(FR-025, PLAN-FRESH-2-005); without the `display: none` rule it would fall back to inline display and show. Styles
browser bodies, with the elements undefined, assert each visible item's box starts below the previous one, and that a
`hidden` item and an `aria-hidden="true"` item are not shown (PLAN-FRESH-1-004, PLAN-FRESH-2-005). They live in
`packages/styles/test/browser/list-items.test.ts`, apart from the data-table file (analysis I5).

## Consumer rules

- **Outside prose.** Any matching rule wins.
- **Inside prose.** A consumer rule needs a specificity above (0,1,0), or (0,1,0) placed after `@ocelle/styles`.
- **In a consumer's shadow root.** `@ocelle/styles` is adopted there too.

The README states all three, and the base-style hook of block 1 (a consumer does not set its two properties). It
also states that the accessible names of column headers follow the drawn upper-case text: Chromium names each column
header by the text block 1's `text-transform: uppercase` draws (spike Q2 (a), 2026-11-18; asserted by T011). And it
states, for the inventory decisions of 2026-11-18 (asserted by T011): the sticky header row's ground
(`--ocelle-color-sheet`), its separated border model and the page's block bound on the host; the stripe on even body
rows per `<tbody>`, hidden rows counted; the hover ground on body rows, and that a hovered striped row shows no
change in the light theme, where `hover-bg` and `inset` are equal (the operator's decision Q-I2, 2026-11-18); the
forced-colours row band that stands in for both; and the `data-ocelle-align="end"` hook (block 4) with its specificity and placement.
