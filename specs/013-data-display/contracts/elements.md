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
| slot | (default) | `ocelle-fact` elements | none | The pairs, in source order. Other children, and facts with `hidden` or `aria-hidden="true"`, are not shown. |
| part | `list` | `<dl>` | none | The description list grid. |
| part | `label` | `<dt>` | none | Each term (label). Carries the fact's `lang` and `dir`. |
| part | `value` | `<dd>` | none | Each definition (value) box. |
| CSS property | `--ocelle-facts-stack-below` | absolute length | 24rem from tokens | Below this available inline size, each value stacks under its label. A percentage, 0 or an invalid value falls back to the default. |
| CSS property | `--ocelle-facts-value-size` | length | `--ocelle-font-size-fact` | The values' font size. Set by `@ocelle/styles`' density hook (`--ocelle-font-size-sm` in a compact region). |
| CSS property | `--ocelle-facts-value-line-height` | number | `--ocelle-line-height-normal` | The values' line height. Set by `@ocelle/styles`' density hook (`--ocelle-line-height-compact` in a compact region). |
| events | none | | | |

Tokens read (README, not manifest): `font-sans`, `font-size-sm`, `font-size-fact`, `font-weight-medium`,
`font-weight-regular`, `color-ink`, `color-ink-muted`, `figures`, `line-height-normal`, `space-1`, `space-3`,
`space-4`, `shell-sidebar-width`, `space-10`.

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
| slot | `heading` | a heading element | none | The consumer's heading. Its level is the consumer's. |
| slot | (default) | nodes | none | The explanation. |
| slot | `actions` | buttons or links | none | Actions. They wrap when narrow. |
| part | `body` | `<div>` | none | The centred column. |
| CSS properties | none | | | |
| events | none | | | |

## `ocelle-progress`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `value` / `value` | `number \| undefined` | `undefined` | Current amount. Unset, empty, `null` or not a number means indeterminate. Clamped to 0 to max. |
| property / attribute | `max` / `max` | `number \| undefined` | `undefined` | Maximum. Unset, not a number, or 0 or less means 100. |
| property / attribute | `valueText` / `value-text` | `string \| undefined` | `undefined` | Words for the current value, for example "7 of 12". Exposed while determinate. |
| property / attribute | `label` / `label` | `string \| undefined` | `undefined` | Accessible name. Required unless the host has an `aria-label`; prefer `label`. |
| property / attribute | `showLabel` / `show-label` | `boolean \| undefined` | `undefined` | Shows the label (and value text) as text. Unset hides it. |
| property / attribute | `size` / `size` (reflected) | `"compact" \| undefined` | `undefined` | `compact` is a thin bar with the label beside it. Unset gives the default size. |
| property / attribute | `ground` / `ground` (reflected) | `"tinted" \| undefined` | `undefined` | `tinted` draws the track boundary in the accent-strong colour, for a bar on an inset, accent-low, hover or state ground. Unset is for canvas, sheet, pane, panel, inspector and rail. |
| observed attribute | `aria-label` | | | Not declared in the manifest (README convention). It names the bar, overriding `label`. |
| part | `track` | `<div>` | none | The track. |
| part | `fill` | `<div>` | none | The filled part, the sweeping mark or the still mark. |
| part | `label` | `<span>` | none | The visible label (with `show-label`). |
| part | `value-text` | `<span>` | none | The visible value text (with `show-label`). |
| CSS properties | none | | | |
| events | none | | | |

## README sections (FR-056, FR-058)

- **`ocelle-facts`** (with `ocelle-fact`): usage; the slotted-item convention (only `ocelle-fact` children; the sheet
  renders the terms; manual slot assignment, R-01); `hidden` and `aria-hidden="true"` on a fact remove the pair, and
  `lang` and `dir` on a fact apply to its label; the wrap policy (the value only); digests are the consumer's; the
  threshold hook (an absolute length only, with its fallback) and the stacking rule on the available space; density:
  `density="compact"` tightens gaps, a compact region sets the value scale (#531); before upgrade (each value on its
  own line through `@ocelle/styles`, labels only after upgrade); tokens read.
- **`ocelle-empty-state`**: the heading rule (the consumer's own heading, no `level`), slots, variants, the gaps
  between present parts, a progress bar in `visual`, the cascade note, the loading panel, and tokens read.
- **`ocelle-progress`**: naming (`label` recommended, or a host `aria-label`; an unnamed bar is a consumer error); axe
  does not check the name, and a host `aria-label` makes axe report a false `aria-prohibited-attr` in a consumer's own
  audit (R-05); the value rules; `value-text`; the bounded sweep (under 5 s, then the still mark, WCAG 2.2.2) and
  reduced motion; `ground="tinted"` and which grounds need it; the busy vocabulary (FR-033); tokens read.
- **Element conventions**: one paragraph each for slotted items (FR-056, with the container-imports-its-item rule) and
  for the identifier wrap property; the `undefined` defaults are unchanged from 005.
- **Builds**: the sentence "until then its box is empty" corrected for elements with light-DOM content (R-01).
- **Engines**: manual slot assignment (`slotAssignment: "manual"`, `HTMLSlotElement.assign`): Chromium 86, WebKit
  16.4. The floor is unchanged.
- **Mapping (FR-058)**: each kitty-mission-ui `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant to its element
  and variant, naming roles only.

`@ocelle/styles`' README gains, in § Compact scale, the two facts hooks its density rules set, and a section for the
pre-upgrade facts rule (R-07).
