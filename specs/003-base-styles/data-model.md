# Data Model: Base Styles (003)

## Hook (public surface, constitution VII)

| Hook | Attribute | Values | Family | Effect |
|---|---|---|---|---|
| compact | `data-ocelle-density` | `compact`, `regular` | compact scale | size and line height for the element (the body when on `<html>`) and its descendants |
| value | `data-ocelle-value` | empty, `ink` | compact scale | value text style, on the main grounds only (see below) |
| prose | `data-ocelle-prose` | empty | prose | the prose rules for the element's descendants; on a content container, not on `<html>` |
| identifier wrap | `data-ocelle-wrap` | `anywhere` | identifier wrap | `overflow-wrap: anywhere` on the element |

An attribute with any other value has no effect: every hook selector matches its documented values exactly
(`[data-ocelle-prose=""]`, `[data-ocelle-value=""]`, `[data-ocelle-value="ink"]`, `[data-ocelle-density="compact"]`,
`[data-ocelle-density="regular"]`, `[data-ocelle-wrap="anywhere"]`), so `data-ocelle-prose="true"` or
`data-ocelle-value="false"` does nothing (operator decision PLAN-CORRECTNESS-1-002 (a)). A bare attribute
(`<div data-ocelle-prose>`) has the empty value and matches. Hook selectors are one attribute plus `:where(…)`
(specificity (0,1,0)). Base-layer selectors are entirely in `:where(…)` (0,0,0), except the two pseudo-element
selectors of the box-sizing rule, which are (0,0,1) (research R-03).

The value hook is for the main grounds (canvas, sheet, pane, panel, inspector, rail, inset, accent-low, hover-bg):
`ink` and `ink-muted` are contrast-checked only there. On the chrome (top bar, icon rail, personal rail) it would put
`ink` (1.00:1 in light theme) or `ink-muted` (2.64:1) on the chrome ground, so hosts must not use it there (operator
decision PLAN-A11Y-SECURITY-1-004 (a)).

The prose hook goes on a content container, not on `<html>`: the container rule is scoped with `:where(:not(html))`,
so on `<html>` it sets neither the root font size nor the root line height (operator decision PLAN-FRESH-1-010 (b)).

## Rule table of `base.css`

The tests assert these values; the order in the file is the order of the sections below (R-03).

**Base layer**

| Selector | Declarations |
|---|---|
| `:where(*)`, `:where(*)::before`, `:where(*)::after` | `box-sizing: border-box` (pseudo-elements are invalid inside `:where()`, so they stay outside it: (0,0,0), (0,0,1), (0,0,1)) |
| `:where(:root)` | `color-scheme: var(--ocelle-color-scheme)` |
| `:where(body)` | `margin: 0`; `font-family: var(--ocelle-font-sans)`; `font-size: var(--ocelle-font-size-md)`; `line-height: var(--ocelle-line-height-normal)`; `color: var(--ocelle-color-ink)`; `background-color: var(--ocelle-color-canvas)` |
| `:where(img, picture, video, canvas, svg)` | `max-inline-size: 100%`; `block-size: auto` (keeps the aspect ratio when the width is capped) |
| `:where(button, input, select, textarea)` | `font: inherit` |
| `:where(code, pre, kbd, samp)` | `font-family: var(--ocelle-font-sans)`; `font-variant-numeric: var(--ocelle-figures)` |
| `:where(:focus-visible)` | `outline-style: solid`; `outline-width: var(--ocelle-focus-width)`; `outline-color: var(--ocelle-color-focus)`; `outline-offset: var(--ocelle-focus-offset)` |
| `@media (forced-colors: active)` `:where(:focus-visible)` | `outline-color: Highlight` (observable only inside a host region with `forced-color-adjust: none`, where the browser does not force the colour; operator decision PLAN-TESTABILITY-1-006 (b), research R-05) |

**Compact scale**

| Selector | Declarations |
|---|---|
| `[data-ocelle-density="compact"]:where(:not(html))`, `[data-ocelle-density="compact"] > :where(body)` | `font-size: var(--ocelle-font-size-sm)`; `line-height: var(--ocelle-line-height-compact)` |
| `[data-ocelle-density="regular"]:where(:not(html))`, `[data-ocelle-density="regular"] > :where(body)` | `font-size: var(--ocelle-font-size-md)`; `line-height: var(--ocelle-line-height-normal)` |
| `[data-ocelle-value=""]`, `[data-ocelle-value="ink"]` | `font-family: var(--ocelle-font-sans)`; `font-size: var(--ocelle-font-size-sm)`; `font-variant-numeric: var(--ocelle-figures)`; `color: var(--ocelle-color-ink-muted)` |
| `[data-ocelle-value="ink"]` | `color: var(--ocelle-color-ink)` |

**Prose** (every selector starts `[data-ocelle-prose=""]`)

| Rest of selector | Declarations |
|---|---|
| `:where(:not(html))` (the container itself, never the root) | `font-size: var(--ocelle-font-size-md)`; `line-height: var(--ocelle-line-height-prose)` |
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
| ` :where(a:any-link)` | `color: var(--ocelle-color-link)`; `text-decoration-line: underline`; `overflow-wrap: anywhere` (an `<a id>` or `<a name>` target with no `href` is not a link and keeps the running text's colour) |
| ` :where(a:any-link:hover)` | `color: var(--ocelle-color-link-hover)` |
| ` :where(code)` | `background-color: var(--ocelle-color-inset)`; `padding-inline: var(--ocelle-space-1)`; `border-radius: var(--ocelle-radius-2)`; `overflow-wrap: anywhere` |
| ` :where(pre)` | `background-color: var(--ocelle-color-inset)`; `padding: var(--ocelle-space-3)`; `border-radius: var(--ocelle-radius-2)`; `white-space: pre-wrap`; `overflow-wrap: anywhere` |
| ` :where(pre code)` | `padding-inline: 0`; `background-color: transparent` |
| ` :where(table)` | `display: block`; `overflow-x: auto`; `max-inline-size: 100%`; `container-type: inline-size`; `border-collapse: collapse` (the inline-size containment that `container-type` applies stops the table's min-content width from widening a grid or flex column above the prose container, and makes the table the caption's query container; the prose container must get its width from its context, not its content, operator decision PLAN-FRESH-2-001 (a); research R-06) |
| ` :where(table:focus-visible)` | `outline-offset: calc(var(--ocelle-focus-width) * -1)` (an inset ring, so all four sides show when the table is flush with the viewport; operator decision PLAN-A11Y-SECURITY-1-003 (a)) |
| ` :where(caption)` | `position: sticky`; `inset-inline-start: 0`; `max-inline-size: var(--ocelle-measure-container)`; `text-align: start` (the caption is capped at the table's visible width and wraps inside the visible part of the scroll box; the sticky offset keeps it in view while the table scrolls and `text-align: start` starts each line at the box's start edge; all of it mirrors under `dir="rtl"`. Each part has its own assertion and plant: PLAN-FRESH-2-002, PLAN-FRESH-3-001 (a), research R-06, R-10) |
| ` :where(th, td)` | `min-inline-size: var(--ocelle-measure-cell)`; `padding: var(--ocelle-space-2) var(--ocelle-space-3)`; `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)`; `text-align: start` |
| ` :where(th)` | `font-size: var(--ocelle-font-size-xs)`; `font-variant-numeric: var(--ocelle-figures)`; `font-weight: var(--ocelle-font-weight-strong)`; `border-block-end-color: var(--ocelle-color-rule-strong)` |

A compact region inside prose keeps the compact scale: its own rule sets size and line height on the region, and no
prose rule sets them on its descendants except headings (FR-024). On one element with both hooks the prose rule comes
later in the file and wins.

The prose family has no `@media print` rule: print is out of scope, so a printed wide table shows only the columns
that fit the page, and a host that prints adds its own print rule (operator decision PLAN-FRESH-3-002 (b); spec
Assumptions, README).

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
| `measure-container` | shell | `100cqi` |

115 tokens after this feature (109 + 6). Each passes `validateSource`, appears in `tokens.css`, `tokens.json` and
`TokenName`, and is transcribed by hand into `packages/tokens/test/expected.ts`.

## Test fixtures (`packages/styles/test/fixtures/`)

- `page.html`: base layer controls (link, button, text input, `tabindex="0"` element), media wider than the page
  (an `img`, `video`, `canvas` and `svg` with `width="2000" height="1000"`, the `img` source the local file
  `media.svg` of the same 2:1 natural ratio, and a `picture`), a list,
  `code`/`pre`/`kbd`/`samp`, and a host region with `forced-color-adjust: none` holding a button (User Story 1
  scenario 4). It is the one fixture served with `img-src 'self'` added to the strict CSP, so its image loads with zero
  violations (operator decision PLAN-FRESH-2-003 (b), research R-09).
- `media.svg`: the local 2:1 image of `page.html`, served as `image/svg+xml`.
- `compact.html`: nested compact and regular regions, a region with an undocumented density value
  (`data-ocelle-density="true"`), the value hook in both variants and with an undocumented value
  (`data-ocelle-value="true"`), both hooks on one element, prose inside compact and compact inside prose.
- `prose.html`: the User Story 3 fixture (spec): every listed element plus `h5`, `h6` and a nested list; an `<a id="x">`
  target with no `href`; three wide 12-column tables (a caption of at least 80 characters; no caption; a link in one
  cell); a table that fits, which is two columns of short text (at most 2 × (12ch + 2 × space-3), under 320 px); a
  200-character code line; a 120-character inline code path and bare URL link; the same content again outside the
  container; and a container with the undocumented value `data-ocelle-prose="true"`.
- `prose-hosts.html`: the wide 12-column table in a prose container that is (1) the `1fr` item of a grid beside a
  60 px rail, (2) the `flex: 1` item of a flex row beside a 60 px rail, and (3) nested one level inside the `1fr` grid
  item (research R-06, PLAN-A11Y-SECURITY-1-001); and (4) the wide table and the table that fits in a prose container
  inside a `<dialog>` with a definite width (`inline-size: var(--ocelle-dialog-max-inline)` in `layout.css`), which
  the test opens with `showModal()` through `page.evaluate` (the host requirement of operator decision
  PLAN-FRESH-2-001 (a)).
- `prose-root.html`: `data-ocelle-prose` on `<html>` (the documented misuse; the container rule does not match it).
- `wrap.html`: the 300 px two-column `1fr` grid with hooked and unhooked identifiers, an identifier with an
  undocumented value (`data-ocelle-wrap="true"`), an identifier in prose and in a compact `span`.
- `layout.css`: the host CSS the fixtures need and `base.css` does not provide: the 300 px two-column grid, the grid and
  flex hosts and the definite-width dialog of `prose-hosts.html`, and the `forced-color-adjust: none` host region. It
  holds host CSS only, no rule of `base.css`, and its selectors are `data-fixture` attributes (no class, no style
  attribute). `serve.ts` serves it, and the fixtures that need it link it after `base.css` (research R-09).
- `plants/*.css`: one stylesheet per guard plant of research R-10.
- `control.html`: not a file in `fixtures/`; `serve.ts` writes it from 002's `controlPage`
  (`packages/tokens/test/browser/serve.ts`), a page with one inline `<style>`. It is the one page that must report a
  violation, exactly one `style-src` violation, which shows that the collector works (SC-001, research R-09).
