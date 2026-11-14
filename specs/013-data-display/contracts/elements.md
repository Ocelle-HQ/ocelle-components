# Contract: the four elements' public surface

Each element follows `packages/elements/README.md` § Element conventions (005), with the one amendment this mission
makes there (a container module imports its item element, below). This contract is the surface the manifest must
declare (FR-054). Every list is stated even when it is empty. The surface is MINOR before 1.0.0 (constitution VII).
States and rules are in [../data-model.md](../data-model.md), and the reasons are in [../research.md](../research.md).

**Defaults (PLAN-CORRECTNESS-1-011 (a)).** As in 005 (`ocelle-brand-mark`'s `"chrome" | undefined`), every public
property is a `declare` field typed with `| undefined` and documented `@default undefined`. A variant's value is the
variant's name only; the default variant has no value. An unset reflected property writes no attribute, so the
consumer's markup is never rewritten (htmx morphing sees what the server sent). Each description states the effective
default.

## Modules and exports

| Tag | Module | Class | Entry point |
|---|---|---|---|
| `ocelle-facts` | `src/ocelle-facts.ts` | `OcelleFacts` | `@ocelle/elements/ocelle-facts.js` |
| `ocelle-fact` | `src/ocelle-fact.ts` | `OcelleFact` | `@ocelle/elements/ocelle-fact.js` |
| `ocelle-empty-state` | `src/ocelle-empty-state.ts` | `OcelleEmptyState` | `@ocelle/elements/ocelle-empty-state.js` |
| `ocelle-progress` | `src/ocelle-progress.ts` | `OcelleProgress` | `@ocelle/elements/ocelle-progress.js` |

- **Module dependencies (PLAN-CORRECTNESS-1-012 (a)).** `ocelle-facts.ts` imports `ocelle-fact.ts`, so importing the
  sheet defines both. README § Element conventions is amended in phase 1: "importing the module defines that element
  and no other, except that a container module also imports its item element". A readme-test statement proves the
  wording, and `test/build/build.test.ts` asserts that `dist/ocelle-facts.js` imports `./ocelle-fact.js` and no other
  element module, and that every other per-element module imports none. Every other module defines only its own tag.
- **Package root.** `src/index.ts` re-exports all four, and `src/browser.ts` defines all four in the browser build.
- **`package.json`.** `exports` gains the four entry points. `custom-elements.json` gains four declarations.

## `ocelle-facts`

| Kind | Name | Type / value | Default | Description (manifest) |
|---|---|---|---|---|
| property / attribute | `density` / `density` (reflected) | `"compact" \| undefined` | `undefined` | Row spacing: `compact` tightens the gaps for dense screens. Unset gives the default spacing. It does not change the type: in a `data-ocelle-density="compact"` region the values take the region's scale. |
| property / attribute | `layout` / `layout` (reflected) | `"columns" \| "stacked" \| "grid" \| undefined` | `undefined` | `columns` keeps two columns and `stacked` one column at any size. `grid` shows each pair as a cell, label above value, in four, two or one columns from the sheet's own inline size (four from twice `--ocelle-facts-stack-below`, two from it, one below it). Unset switches automatically on the sheet's own two-column inline size; set it for a sheet in a dialog, popover or other shrink-to-fit host, where a short sheet would otherwise stack. |
| slot | (default) | `ocelle-fact` elements | none | The pairs, in source order. Other children, and facts with `hidden` or `aria-hidden="true"`, are not shown. |
| part | `list` | `<dl>` | none | The description list grid. Do not set its columns: a `grid-template-columns` rule here overrides every layout (IQ-01 (a)). |
| part | `label` | `<dt>` | none | Each term (label). Carries the fact's `lang` and `dir`. |
| part | `value` | `<dd>` | none | Each definition (value) box. |
| CSS property | `--ocelle-facts-stack-below` | absolute length | 24rem from tokens | With `layout` unset, below this inline size (the sheet's own, as laid out in two columns) each value stacks under its label. With `layout="grid"`, below it the cells take one column, and from twice it four (the sheet's own size as laid out in four columns). A percentage, 0 or an invalid value falls back to the default. |
| CSS property | `--ocelle-facts-value-size` | length | `--ocelle-font-size-fact` | The values' font size. Set by `@ocelle/styles`' density hook (`--ocelle-font-size-sm` in a compact region). |
| CSS property | `--ocelle-facts-value-line-height` | number | `--ocelle-line-height-normal` | The values' line height. Set by `@ocelle/styles`' density hook (`--ocelle-line-height-compact` in a compact region). |
| events | none | | | |

Tokens read (README, not manifest): `font-sans`, `font-size-sm`, `font-size-fact`, `font-weight-medium`,
`font-weight-regular`, `color-ink`, `color-ink-muted`, `figures`, `line-height-normal`, `space-1`, `space-3`,
`space-4`, `space-10` (the threshold's default is `calc(var(--ocelle-space-10) * 6)`, R-02). The grid layout reads no
other token (R-03). No part, slot or hook is added for the grid: its cell groups carry an internal class.

## `ocelle-fact`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `label` / `label` (reflected) | `string \| undefined` | `undefined` | The label (term) of this pair. Unset or empty gives an empty term. |
| property / attribute | `wrap` / `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks a long identifier value anywhere instead of overflowing. The label keeps word wrapping. Unset wraps between words. |
| slot | (default) | nodes | none | The value. |
| part | `label` | `<span>` | none | The label, rendered only outside `ocelle-facts`. |
| CSS property | `--ocelle-facts-value-size` | length | `--ocelle-font-size-fact` | As on `ocelle-facts`, for a fact outside a sheet. |
| CSS property | `--ocelle-facts-value-line-height` | number | `--ocelle-line-height-normal` | As on `ocelle-facts`, for a fact outside a sheet. |
| events | none | | | |

## `ocelle-empty-state`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `variant` / `variant` (reflected) | `"panel" \| undefined` | `undefined` | `panel` fills a list or inspector panel with a larger rhythm and lighter heading. Unset gives the default variant. |
| slot | `visual` | nodes | none | An icon or an `ocelle-progress` above the heading. A progress bar spans the column up to the reading measure. |
| slot | `eyebrow` | text, a `<p>` | none | A short line above the heading (for example "Refused"), shown small, medium weight, muted and in upper case. Not a heading. |
| slot | `heading` | a heading element | none | The consumer's heading. Its level is the consumer's. |
| slot | (default) | nodes | none | The explanation. Each element is a block with no margins, separated from the next by a small gap; put inline content in one `<p>`. |
| slot | `actions` | buttons or links | none | Actions. They wrap when narrow. |
| part | `body` | `<div>` | none | The centred column, with its padding and every slot in it. The default slot's content sits in an internal wrapper inside it, which is not a part. |
| CSS properties | none | | | |
| events | none | | | |

## `ocelle-progress`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `value` / `value` | `number \| undefined` | `undefined` | Current amount. Unset, empty, `null` or not a number means indeterminate. Clamped to 0 to max. |
| property / attribute | `max` / `max` | `number \| undefined` | `undefined` | Maximum. Unset, not a number, or 0 or less means 100. |
| property / attribute | `valueText` / `value-text` | `string \| undefined` | `undefined` | Words for the current value, for example "7 of 12". Exposed while determinate. |
| property / attribute | `label` / `label` | `string \| undefined` | `undefined` | Accessible name, as text (no rich label). Required unless the host has an `aria-label`; prefer `label`. To name the bar after a nearby heading, pass the heading's text. |
| property / attribute | `showLabel` / `show-label` | `boolean \| undefined` | `undefined` | Shows the label (and value text) as text. Unset hides it. |
| property / attribute | `size` / `size` (reflected) | `"compact" \| undefined` | `undefined` | `compact` is a thin bar with the label beside it. Unset gives the default size. |
| property / attribute | `ground` / `ground` (reflected) | `"tinted" \| undefined` | `undefined` | `tinted` draws the track boundary in the accent-strong colour, for a bar on an inset, accent-low, hover-bg or state ground. Unset is for canvas, sheet, pane, panel, inspector and rail. |
| observed attribute | `aria-label` | | | Not declared in the manifest (README convention). It names the bar, overriding `label`. |
| part | `track` | `<div>` | none | The track. |
| part | `fill` | `<div>` | none | The filled part, the sweeping mark or the still mark. |
| part | `label` | `<span>` | none | The visible label (with `show-label`). |
| part | `value-text` | `<span>` | none | The visible value text (with `show-label`), at the inline end of the label row. |
| slot | none | | | The element has no slot: content inside it shows only before upgrade and is neither shown nor exposed after it. |
| CSS properties | none | | | |
| events | none | | | |

## README sections (FR-056, FR-058)

- **`ocelle-facts`** (with `ocelle-fact`): usage; the slotted-item convention (only `ocelle-fact` children; the sheet
  renders the terms; manual slot assignment, R-01); `hidden` and `aria-hidden="true"` on a fact remove the pair, and
  `lang` and `dir` on a fact apply to its label; the wrap policy (the value only); digests are the consumer's; the
  threshold hook (an absolute length only, with its fallback) and the stacking rule on the sheet's own two-column
  size; `layout`, and that a sheet in a shrink-to-fit host (dialog, popover, float, flex item) with short content
  stacks unless `layout` is set or the sheet is given an inline size; the changes the sheet re-decides on (its own
  resize, a threshold change, a content change including value text, a window resize) and the changes of the offered
  space it does not observe, named by phase 1's spike (R-02: a neighbour of a consumer's CSS grid `auto` track removed), where the
  consumer sets `layout` or gives the sheet an inline size (FR-009, PLAN-FRESH-3-001 (c)); density: `density="compact"` tightens gaps, a
  compact region sets the value scale (#531); before upgrade (each value on its own line through `@ocelle/styles`, a
  hidden fact stays hidden, labels only after upgrade); tokens read; the `.sk-facts` mapping rows (FR-058, phase 1).
  From the input decisions: `layout="grid"`, its four, two and one columns from the threshold and twice it, its
  `<div>` groups inside the one description list, the wrap policy on machine values in a grid cell, and a grid sheet in
  a shrink-to-fit host given an inline size, since it is otherwise four tracks wide (IQ-05 (b), "Grid limits"); in
  every layout, an unbroken value without the wrap policy can overflow its value box or cell, so machine values take
  `wrap="anywhere"` (FR-009 as qualified, "Grid limits"); do not
  restyle the list's columns through `::part(list)` (IQ-01 (a)); in a consumer's CSS grid set `min-inline-size: 0` on the
  host (IQ-02 (a)); labels are at weight 500, and `::part(label)` sets another (IQ-03 (a)); the element never truncates
  a value, and `break-word`, break-anywhere and an ellipsis all map to `wrap="anywhere"` with the full value shown
  (IQ-04 (b)).
- **`ocelle-empty-state`**: the heading rule (the consumer's own heading, no `level`), slots, variants, the gaps
  between present parts (a part with only hidden or whitespace content is absent; hide slotted content with `hidden`
  or remove it, since a class or style rule is not observed), a progress bar in `visual`, the cascade note, the
  loading panel, tokens read, and the `.sk-empty-state` mapping rows (FR-058, phase 2). From the input decisions: the
  `eyebrow` slot (a short line, not a heading; its type and gaps; IQ-08 (c)); the body's margins reset and
  `--ocelle-space-2` between its children, each a block, so inline content goes in one `<p>` (IQ-09 (b)); the panel's
  heading at 500 (#510's text, IQ-06 (a)); no card, border or busy look on the element: a card around it is the
  consumer's, the dashed card is the #509 family's (IQ-07 (a)); a focusable loading heading is the consumer's `<h2
  tabindex="-1">` in `heading` with the bar in `visual` (IQ-11 (b)).
- **`ocelle-progress`**: naming (`label` recommended, or a host `aria-label`; an unnamed bar is a consumer error); axe
  does not check the name, and a host `aria-label` makes axe report a false `aria-prohibited-attr` in a consumer's own
  audit (R-05); the value rules; `value-text`; the bounded sweep (under 5 s, then the still mark, WCAG 2.2.2;
  `--ocelle-motion-base` × 21 in total, so an override above 238 ms takes it past 5 s), run once per loading episode:
  a bar inserted, replaced in one task, re-shown or made indeterminate again continues the episode's sweep and after
  it shows the still mark at once; the episode ends when no indeterminate bar is connected at a frame boundary, and a
  later loading region then gets its own sweep, so keep one bar (or swap it in one task) across one continuous wait
  (PLAN-FRESH-2-005 (a), PLAN-FRESH-3-004 (a)); the fill has no width transition (PLAN-FRESH-3-003 (b)); reduced
  motion; `ground="tinted"` and which
  grounds need it; the busy vocabulary (FR-033); tokens read; the `.sk-progress` mapping rows (FR-058, phase 3).
  From the input decisions: a bar named after a nearby heading takes the heading's text as `label` (IQ-10 (a)); a
  `role` or `tabindex` on the host replaces or alters the progressbar, so set neither (IQ-11 (b)); the host is a
  block, and a bar placed inline gets its `display` and inline size from the consumer (IQ-12 (a)); the value text sits
  at the inline end of the label row (IQ-13 (b)); the label is text only (IQ-14 (a)); text inside the element shows
  only before upgrade and is neither shown nor exposed after it (IQ-15 (b)).
- **Element conventions**: one paragraph each for slotted items (FR-056, with the container-imports-its-item rule) and
  for the identifier wrap property; the `undefined` defaults are unchanged from 005.
- **Builds**: the sentence "until then its box is empty" corrected for elements with light-DOM content (R-01).
- **Engines**: manual slot assignment (`slotAssignment: "manual"`, `HTMLSlotElement.assign`): Chromium 86, WebKit
  16.4. The floor is unchanged.
- **Mapping (FR-058)**: each kitty-mission-ui `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant of the
  inventory in research R-11 to its element and variant, naming roles only. The table holds the `.sk-*` family names
  beside each row's role name (Markdown is outside the `prefix` gate); the readme tests assert the rows by role name,
  with no `sk-` string in test code (operator decision I1, R-11). Each element's rows are written in that element's
  phase, red first (PLAN-FRESH-2-006).

`@ocelle/styles`' README gains, in § Compact scale, the two facts hooks its density rules set, and a section for the
pre-upgrade facts rule (R-07): `:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden]))`, wrapped whole in
`:where()` like every base selector, so its specificity is (0,0,0) and any page rule overrides it, and a hidden fact
keeps the user-agent `display: none` (PLAN-FRESH-2-002).
