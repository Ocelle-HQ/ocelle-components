# Contract: the four elements' public surface

Each element follows `packages/elements/README.md` § Element conventions (005). This contract is the surface the
manifest must declare (FR-054). Every list is stated even when it is empty. The surface is MINOR before 1.0.0
(constitution VII). States and rules are in [../data-model.md](../data-model.md), and the reasons are in
[../research.md](../research.md).

## Modules and exports

| Tag | Module | Class | Entry point |
|---|---|---|---|
| `ocelle-facts` | `src/ocelle-facts.ts` | `OcelleFacts` | `@ocelle/elements/ocelle-facts.js` |
| `ocelle-fact` | `src/ocelle-fact.ts` | `OcelleFact` | `@ocelle/elements/ocelle-fact.js` |
| `ocelle-empty-state` | `src/ocelle-empty-state.ts` | `OcelleEmptyState` | `@ocelle/elements/ocelle-empty-state.js` |
| `ocelle-progress` | `src/ocelle-progress.ts` | `OcelleProgress` | `@ocelle/elements/ocelle-progress.js` |

- **Module dependencies.** `ocelle-facts.ts` imports `ocelle-fact.ts`, so importing the sheet defines both. Every
  other module defines only its own tag.
- **Package root.** `src/index.ts` re-exports all four, and `src/browser.ts` defines all four in the browser build.
- **`package.json`.** `exports` gains the four entry points. `custom-elements.json` gains four declarations.

## `ocelle-facts`

| Kind | Name | Type / value | Default | Description (manifest) |
|---|---|---|---|---|
| property / attribute | `density` / `density` | `"default" \| "compact"` | `"default"` | Row spacing: `compact` for dense screens. |
| slot | (default) | `ocelle-fact` elements | none | The pairs, in source order. Other children are not shown. |
| part | `list` | `<dl>` | none | The description list grid. |
| part | `label` | `<dt>` | none | Each term (label). |
| part | `value` | `<dd>` | none | Each definition (value) box. |
| CSS property | `--ocelle-facts-stack-below` | length | 24rem from tokens | Below this inline size, each value stacks under its label. |
| events | none | | | |

Tokens read (README, not manifest): `font-sans`, `font-size-sm`, `font-size-fact`, `font-weight-medium`,
`font-weight-regular`, `color-ink`, `color-ink-muted`, `figures`, `line-height-normal`, `space-1`, `space-3`,
`space-4`, `shell-sidebar-width`, `space-10`.

## `ocelle-fact`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `label` / `label` (reflected) | `string` | `""` | The label (term) of this pair. |
| property / attribute | `wrap` / `wrap` (reflected) | `"anywhere" \| undefined` | `undefined` | `anywhere` breaks a long identifier value anywhere instead of overflowing. |
| slot | (default) | nodes | none | The value. |
| part | `label` | `<span>` | none | The label, rendered only outside `ocelle-facts`. |
| CSS properties | none | | | |
| events | none | | | |

## `ocelle-empty-state`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `variant` / `variant` (reflected) | `"default" \| "panel"` | `"default"` | `panel` fills a list or inspector panel with a larger rhythm and lighter heading. |
| slot | `visual` | nodes | none | An icon or an `ocelle-progress` above the heading. |
| slot | `heading` | a heading element | none | The consumer's heading. Its level is the consumer's. |
| slot | (default) | nodes | none | The explanation. |
| slot | `actions` | buttons or links | none | Actions. They wrap when narrow. |
| part | `body` | `<div>` | none | The centred column. |
| CSS properties | none | | | |
| events | none | | | |

## `ocelle-progress`

| Kind | Name | Type / value | Default | Description |
|---|---|---|---|---|
| property / attribute | `value` / `value` | `number \| null` | `null` | Current amount. Absent, empty or not a number means indeterminate. Clamped to 0 to max. |
| property / attribute | `max` / `max` | `number \| null` | `null` | Maximum. Absent, not a number, or 0 or less means 100. |
| property / attribute | `valueText` / `value-text` | `string` | `""` | Words for the current value, for example "7 of 12". Exposed while determinate. |
| property / attribute | `label` / `label` | `string` | `""` | Accessible name. Required unless the host has an `aria-label`. |
| property / attribute | `showLabel` / `show-label` | `boolean` | `false` | Shows the label (and value text) as text. |
| property / attribute | `size` / `size` (reflected) | `"default" \| "compact"` | `"default"` | `compact` is a thin bar with the label beside it. |
| observed attribute | `aria-label` | | | Not declared in the manifest (README convention). It names the bar, overriding `label`. |
| part | `track` | `<div>` | none | The track. |
| part | `fill` | `<div>` | none | The filled part, or the moving mark. |
| part | `label` | `<span>` | none | The visible label (with `show-label`). |
| part | `value-text` | `<span>` | none | The visible value text (with `show-label`). |
| CSS properties | none | | | |
| events | none | | | |

## README sections (FR-056, FR-058)

- **`ocelle-facts`** (with `ocelle-fact`): usage, the slotted-item convention (only `ocelle-fact` children; the sheet
  renders the terms; manual slot assignment, R-01), the wrap policy, digests are the consumer's, the threshold hook,
  and tokens read.
- **`ocelle-empty-state`**: the heading rule (the consumer's own heading, no `level`), slots, variants, the cascade
  note, the loading panel, and tokens read.
- **`ocelle-progress`**: naming (`label` or host `aria-label`; an unnamed bar is a consumer error), the value rules,
  `value-text`, reduced motion, the contrast note on inset grounds, the busy vocabulary (FR-033), axe not checking the
  name (R-05), and tokens read.
- **Element conventions**: one paragraph each for slotted items (FR-056) and for the identifier wrap property.
- **Engines**: manual slot assignment (`slotAssignment: "manual"`, `HTMLSlotElement.assign`): Chromium 86, WebKit
  16.4. The floor is unchanged.
- **Mapping (FR-058)**: each kitty-mission-ui `.sk-facts`, `.sk-empty-state` and `.sk-progress` variant to its element
  and variant, naming roles only.
