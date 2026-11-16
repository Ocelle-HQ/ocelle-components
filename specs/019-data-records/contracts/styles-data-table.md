# Contract: the `@ocelle/styles` data-table rules

`packages/styles/src/base.css` gains three blocks, after 003's identifier-wrap rule: the data-table rules, the prose
override that follows them, and the two pre-upgrade list-item rules. Research R-06, R-07 and R-08 have the values and
the reasons. 003's `packages/styles/test/source.test.ts` transcribes them after the wrap rule (R-06).

## Block 1: the data-table rules, at specificity (0,0,0)

Every selector is wrapped whole in `:where()`, so any consumer rule on the same element wins (US1-14). Only the direct
table of an `ocelle-data-table` is selected, whether the element is defined or not, so a nested table is not styled.

| Selector (inside `:where()`) | Purpose |
|---|---|
| `ocelle-data-table > table` | `border-collapse`, `inline-size: 100%`, `margin: 0`, sans, figures |
| `ocelle-data-table > table > caption` | caption type, colour, `text-align: start`, sticky at the inline start, `max-inline-size` capped by `--ocelle-measure-container` less the end fade and the ring room (R-07; Q-F sets the interim inset and cap) |
| `ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th)` | compact padding, `sm` / `line-height-compact`, `ink-soft`, row rule, `text-align: start`, `vertical-align: top` |
| `… > thead > tr > th`, `… th[scope="col"]`, `… th[scope="colgroup"]` | eyebrow header: `xs`, medium (Q-B), upper case, `tracking-caps`, `ink-muted`, `rule-strong` rule |
| `… th[scope="row"]`, `… th[scope="rowgroup"]`, `… > :is(tbody, tfoot) > tr > th:not([scope])` | row header: `sm`, medium, `ink`, no case or tracking |
| `ocelle-data-table > table > :is(tbody, tfoot):last-child > tr:last-child > :is(td, th)` | no rule below the table's last row only; rows of earlier row groups keep theirs (a `<tfoot>` goes after the `<tbody>` groups, as HTML says; the README states the source-order rule) |
| `ocelle-data-table[wrap="anywhere"] > table > :is(tbody, tfoot) > tr > td` | `overflow-wrap: anywhere` |
| inside `@media (forced-colors: active)` | text and rules in `CanvasText`, no `forced-color-adjust: none` |

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
| caption | block 1's `max-inline-size` cap, position, inset, `text-align`, font size and line height |

A node test (`packages/styles/test/prose-override.test.ts`) selects every `[data-ocelle-prose=""]` rule in `base.css`
whose selector can match a table, caption, row group, row, column or cell, pseudo-classes included (for example
`:where(table:focus-visible)`), and fails on any of their properties the override does not restate on the matching
target, unless the test's not-applicable list records it with its reason (`outline` and `outline-offset` of
`:where(table:focus-visible)`: the region's box is the tab stop). It does not list 003's selector forms, so a later
003 rule on another table part is read (PLAN-TESTABILITY-1-008).

## Block 3: list items before upgrade, at specificity (0,0,0)

| Selector (inside `:where()`) | Values |
|---|---|
| `ocelle-event-timeline:not(:defined) > ocelle-timeline-event:not([hidden])` | `display: block` |
| `ocelle-evidence-chain:not(:defined) > ocelle-evidence-step:not([hidden])` | `display: block` |

As 013's rule for facts. One item per line before upgrade; times, markers and ordinals show only after upgrade (the
README's "Before upgrade" lines). Styles browser bodies assert each item's box starts below the previous one with
the elements undefined (PLAN-FRESH-1-004).

## Consumer rules

- **Outside prose.** Any matching rule wins.
- **Inside prose.** A consumer rule needs a specificity above (0,1,0), or (0,1,0) placed after `@ocelle/styles`.
- **In a consumer's shadow root.** `@ocelle/styles` is adopted there too.

The README states all three.
