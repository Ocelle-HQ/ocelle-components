# Data Model: Base Styles (003)

## Hook (public surface, constitution VII)

| Hook | Attribute | Values | Family | Effect |
|---|---|---|---|---|
| compact | `data-ocelle-density` | `compact`, `regular` | compact scale | size and line height for the element (the body when on `<html>`) and its descendants |
| value | `data-ocelle-value` | empty, `ink` | compact scale | value text style |
| prose | `data-ocelle-prose` | empty | prose | the prose rules for the element's descendants |
| identifier wrap | `data-ocelle-wrap` | `anywhere` | identifier wrap | `overflow-wrap: anywhere` on the element |

An attribute with any other value has no effect. Hook selectors are one attribute plus `:where(…)` (specificity
(0,1,0)); base-layer selectors are entirely in `:where(…)` (0,0,0) (research R-03).

## Rule table of `base.css`

The tests assert these values; the order in the file is the order of the sections below (R-03).

**Base layer**

| Selector | Declarations |
|---|---|
| `:where(*, *::before, *::after)` | `box-sizing: border-box` |
| `:where(:root)` | `color-scheme: var(--ocelle-color-scheme)` |
| `:where(body)` | `margin: 0`; `font-family: var(--ocelle-font-sans)`; `font-size: var(--ocelle-font-size-md)`; `line-height: var(--ocelle-line-height-normal)`; `color: var(--ocelle-color-ink)`; `background-color: var(--ocelle-color-canvas)` |
| `:where(img, picture, video, canvas, svg)` | `max-inline-size: 100%` |
| `:where(button, input, select, textarea)` | `font: inherit` |
| `:where(code, pre, kbd, samp)` | `font-family: var(--ocelle-font-sans)`; `font-variant-numeric: var(--ocelle-figures)` |
| `:where(:focus-visible)` | `outline-style: solid`; `outline-width: var(--ocelle-focus-width)`; `outline-color: var(--ocelle-color-focus)`; `outline-offset: var(--ocelle-focus-offset)` |
| `@media (forced-colors: active)` `:where(:focus-visible)` | `outline-color: Highlight` |

**Compact scale**

| Selector | Declarations |
|---|---|
| `[data-ocelle-density="compact"]:where(:not(html))`, `[data-ocelle-density="compact"] > :where(body)` | `font-size: var(--ocelle-font-size-sm)`; `line-height: var(--ocelle-line-height-compact)` |
| `[data-ocelle-density="regular"]:where(:not(html))`, `[data-ocelle-density="regular"] > :where(body)` | `font-size: var(--ocelle-font-size-md)`; `line-height: var(--ocelle-line-height-normal)` |
| `[data-ocelle-value]` | `font-family: var(--ocelle-font-sans)`; `font-size: var(--ocelle-font-size-sm)`; `font-variant-numeric: var(--ocelle-figures)`; `color: var(--ocelle-color-ink-muted)` |
| `[data-ocelle-value="ink"]` | `color: var(--ocelle-color-ink)` |

**Prose** (every selector starts `[data-ocelle-prose]`)

| Rest of selector | Declarations |
|---|---|
| (the container itself) | `font-size: var(--ocelle-font-size-md)`; `line-height: var(--ocelle-line-height-prose)` |
| ` :where(h1, h2, h3, h4, h5, h6)` | `line-height: var(--ocelle-line-height-tight)`; `margin-block: var(--ocelle-space-6) var(--ocelle-space-3)` |
| ` :where(h1)` | `font-size: var(--ocelle-font-size-2xl)`; `font-weight: var(--ocelle-font-weight-display)` |
| ` :where(h2)` | `font-size: var(--ocelle-font-size-subhead)`; `font-weight: var(--ocelle-font-weight-strong)` |
| ` :where(h3)` | `font-size: var(--ocelle-font-size-fact)`; `font-weight: var(--ocelle-font-weight-strong)` |
| ` :where(h4, h5, h6)` | `font-size: var(--ocelle-font-size-md)`; `font-weight: var(--ocelle-font-weight-strong)` |
| ` :where(p, ul, ol, blockquote, pre, table, hr)` | `margin-block: 0 var(--ocelle-space-4)` |
| ` :where(p, li, blockquote)` | `max-inline-size: var(--ocelle-measure-reading)` |
| ` :where(ul, ol)` | `padding-inline-start: var(--ocelle-space-6)` |
| ` :where(blockquote)` | `margin-inline: 0`; `padding-inline-start: var(--ocelle-space-4)`; `border-inline-start: var(--ocelle-bar-width) solid var(--ocelle-color-rule-strong)`; `color: var(--ocelle-color-ink-soft)` |
| ` :where(hr)` | `border: 0`; `border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule)` |
| ` :where(a)` | `color: var(--ocelle-color-link)`; `text-decoration-line: underline`; `overflow-wrap: anywhere` |
| ` :where(a:hover)` | `color: var(--ocelle-color-link-hover)` |
| ` :where(code)` | `background-color: var(--ocelle-color-inset)`; `padding-inline: var(--ocelle-space-1)`; `border-radius: var(--ocelle-radius-2)`; `overflow-wrap: anywhere` |
| ` :where(pre)` | `background-color: var(--ocelle-color-inset)`; `padding: var(--ocelle-space-3)`; `border-radius: var(--ocelle-radius-2)`; `white-space: pre-wrap`; `overflow-wrap: anywhere` |
| ` :where(pre code)` | `padding-inline: 0`; `background-color: transparent` |
| ` :where(table)` | `display: block`; `overflow-x: auto`; `max-inline-size: 100%`; `border-collapse: collapse` |
| ` :where(th, td)` | `min-inline-size: var(--ocelle-measure-cell)`; `padding: var(--ocelle-space-2) var(--ocelle-space-3)`; `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)`; `text-align: start` |
| ` :where(th)` | `font-size: var(--ocelle-font-size-xs)`; `font-variant-numeric: var(--ocelle-figures)`; `font-weight: var(--ocelle-font-weight-strong)`; `border-block-end-color: var(--ocelle-color-rule-strong)` |

A compact region inside prose keeps the compact scale: its own rule sets size and line height on the region, and no
prose rule sets them on its descendants except headings (FR-024). On one element with both hooks the prose rule comes
later in the file and wins.

**Identifier wrap**

| Selector | Declarations |
|---|---|
| `[data-ocelle-wrap="anywhere"]` | `overflow-wrap: anywhere` |

## New tokens (`@ocelle/tokens`, research R-08)

| Token | Group | Value |
|---|---|---|
| `line-height-compact` | type | `1.5` |
| `line-height-prose` | type | `1.65` |
| `font-size-subhead` | type | `1.125rem` |
| `measure-reading` | shell | `68ch` |
| `measure-cell` | shell | `12ch` |

114 tokens after this feature (109 + 5). Each passes `validateSource`, appears in `tokens.css`, `tokens.json` and
`TokenName`, and is transcribed by hand into `packages/tokens/test/expected.ts`.

## Test fixtures (`packages/styles/test/fixtures/`)

- `page.html`: base layer controls (link, button, text input, `tabindex="0"` element), media wider than the page,
  a list, `code`/`pre`/`kbd`/`samp`.
- `compact.html`: nested compact and regular regions, the value hook in both variants, both hooks on one element,
  prose inside compact and compact inside prose.
- `prose.html`: the User Story 3 fixture (spec): every listed element plus `h5`, `h6` and a nested list; three wide
  12-column tables (caption; no caption; a link in one cell); a table that fits; a 200-character code line; a
  120-character inline code path and bare URL link; the same content again outside the container.
- `wrap.html`: the two-column `1fr` grid with hooked and unhooked identifiers, an identifier in prose and in a compact
  `span`.
- `plants/*.css`: one stylesheet per guard plant of research R-10.
