# Contract: the `@ocelle/styles` data-table rules

`packages/styles/src/base.css` gains two blocks: the data-table rules and the prose override that follows them.
Research R-06 has the values and the reasons.

## Block 1: the data-table rules, at specificity (0,0,0)

Every selector is wrapped whole in `:where()`, so any consumer rule on the same element wins (US1-14). Only the direct
table of an `ocelle-data-table` is selected, whether the element is defined or not, so a nested table is not styled.

| Selector (inside `:where()`) | Purpose |
|---|---|
| `ocelle-data-table > table` | `border-collapse`, `inline-size: 100%`, `margin: 0`, sans, figures |
| `ocelle-data-table > table > caption` | caption type, colour, `text-align: start`, sticky at the inline start |
| `ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th)` | compact padding, `sm` / `line-height-compact`, `ink-soft`, row rule, `text-align: start`, `vertical-align: top` |
| `… > thead > tr > th`, `… th[scope="col"]`, `… th[scope="colgroup"]` | eyebrow header: `xs`, medium (Q-B), upper case, `tracking-caps`, `ink-muted`, `rule-strong` rule |
| `… th[scope="row"]`, `… th[scope="rowgroup"]`, `… > :is(tbody, tfoot) > tr > th:not([scope])` | row header: `sm`, medium, `ink`, no case or tracking |
| `… > :is(tbody, tfoot) > tr:last-child > :is(td, th)` | no rule below the last row |
| `ocelle-data-table[wrap="anywhere"] > table > :is(tbody, tfoot) > tr > td` | `overflow-wrap: anywhere` |
| inside `@media (forced-colors: active)` | text and rules in `CanvasText` |

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
| caption | `max-inline-size: none`, block 1's position, inset, `text-align`, font size and line height |

A node test parses 003's prose table rules (`[data-ocelle-prose=""] :where(table…)`, `:where(th, td)`, `:where(th)`,
`:where(caption)` and the shared `:where(p, ul, ol, blockquote, pre, table, hr)`) and fails when the override has no
declaration for one of their properties on the matching target.

## Consumer rules

- **Outside prose.** Any matching rule wins.
- **Inside prose.** A consumer rule needs a specificity above (0,1,0), or (0,1,0) placed after `@ocelle/styles`.
- **In a consumer's shadow root.** `@ocelle/styles` is adopted there too.

The README states all three.
