# Contract: the public surface 011 adds

All additions are MINOR (constitution VII). Every item below is in `custom-elements.json` (the `manifest` gate), the
package README and the CHANGELOG, or in `tokens.css` and the `@ocelle/tokens` CHANGELOG.

## Entry points (`@ocelle/elements` `package.json` `exports`)

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements/ocelle-card.js` | `dist/ocelle-card.js` | `ocelle-card` |
| `@ocelle/elements/ocelle-section-header.js` | `dist/ocelle-section-header.js` | `ocelle-section-header` |
| `@ocelle/elements/ocelle-page-header.js` | `dist/ocelle-page-header.js` | `ocelle-page-header` |
| `@ocelle/elements/ocelle-context-sidebar.js` | `dist/ocelle-context-sidebar.js` | `ocelle-context-sidebar` |
| `@ocelle/elements/ocelle-personal-rail.js` | `dist/ocelle-personal-rail.js` | `ocelle-personal-rail` |

`@ocelle/elements` (the package root) and `@ocelle/elements/browser.js` also define all five. `ocelle-card.js` does
not define `ocelle-section-header`: a page that slots one imports both. The compact size works whichever is defined
first, and when the two come from different copies of the package (research.md R-05, the pull model).

## Elements

### `ocelle-section-header` (class `OcelleSectionHeader`)

| Member | Kind | Type | Default | Description |
|---|---|---|---|---|
| `size` / `size` | property, attribute (reflected) | `"regular" \| "compact" \| undefined` | `undefined` | Heading size; not set draws regular, or compact in a compact card's `header` slot |
| `variant` / `variant` | property, attribute (reflected) | `"default" \| "eyebrow" \| undefined` | `undefined` | `eyebrow` draws the heading as an eyebrow and drops the eyebrow and description slots |

Slots: `heading`, `eyebrow`, `description`, `actions`. Events, parts, CSS custom properties: none.

### `ocelle-card` (class `OcelleCard`)

| Member | Kind | Type | Default | Description |
|---|---|---|---|---|
| `density` / `density` | property, attribute (reflected) | `"regular" \| "compact" \| undefined` | `undefined` | Padding and gap; not set draws regular |
| `inset` / `inset` | property, attribute (reflected) | `boolean \| undefined` | `undefined` | Draws the card on the inset ground |

Slots: `header`, default (the body). Events, parts, CSS custom properties: none.

### `ocelle-page-header` (class `OcellePageHeader`)

| Member | Kind | Type | Default | Description |
|---|---|---|---|---|
| `size` / `size` | property, attribute (reflected) | `"regular" \| "compact" \| undefined` | `undefined` | Title size; not set draws regular |

Slots: `heading`, `eyebrow`, `description`, `actions`. Events, parts, CSS custom properties: none.

### `ocelle-context-sidebar` (class `OcelleContextSidebar`)

| Member | Kind | Type | Default | Description |
|---|---|---|---|---|
| `label` | property only (not reflected; attribute `label` read) | `string \| undefined` | `undefined` | Names the navigation landmark when the host has no `aria-label` |

Slots: `head`, default (sections, one element each), `footer`. Events, parts, CSS custom properties: none. The host
is the navigation landmark (through `ElementInternals`, held under an internal `Symbol("internals")` key so axe's
role computation sees its `navigation` role, research.md R-11, and not listed in the manifest; axe's landmark rules
do not select it); a host `aria-label` names it as the README's
Host ARIA rule says, and the element never writes it. A `hidden` section draws nothing of its own but still counts as content (spec Edge Cases); the edge margins of slotted
sections, head and footer are trimmed, a `hidden` edge element skipped (FR-008); a section's padding, inline margins,
divider and display are `!important`, so a page rule does not change them, while its block margins are the page's
(FR-022).

### `ocelle-personal-rail` (class `OcellePersonalRail`)

| Member | Kind | Type | Default | Description |
|---|---|---|---|---|
| `label` | property only (not reflected; attribute `label` read) | `string \| undefined` | `undefined` | Names the navigation landmark when the host has no `aria-label` |
| `orientation` / `orientation` | property, attribute (reflected) | `"vertical" \| "horizontal" \| undefined` | `undefined` | Layout direction, set by the page or a shell; not set is vertical; the element never changes it itself |

Slots: default (primary items), `bottom`. Events, parts, CSS custom properties: none. The host is the navigation
landmark, named and held as for the sidebar. The host's colour is `--ocelle-color-chrome-ink`; the rail styles no item,
so an item shows chrome ink only when it inherits colour (plain `<a>` items need `color: inherit`, FR-027).

**For #12**: the rail's whole interface for a shell or drawer is `orientation` (and `label`). A shell that wants
the rail horizontal inside the personal drawer and vertical in its column sets `orientation` from its own tier,
with an exclusive bound in its own query. The README's example, which #12 may copy, is a viewport media query,
`matchMedia("(width < Npx)")` (FR-026, research.md R-10); a column- or container-driven tier is #12's to build. Anything more (events, an item density) is #12's to add, as MINOR.

## Tokens (`@ocelle/tokens`)

`--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow`, `--ocelle-color-eyebrow`
(values in [../data-model.md](../data-model.md)).

## Tokens each element reads (documented, not declared)

This table is the single list the readme test checks and the token-sentinel scenarios override (research.md R-13).

| Element | Tokens |
|---|---|
| section header | `font-display`, `font-sans`, `font-size-lg`, `font-size-subhead`, `font-size-sm`, `font-weight-strong`, `line-height-tight`, `line-height-normal`, `color-ink`, `color-ink-muted`, `space-1`, `space-2`, `space-4`, `figures` and the four eyebrow tokens |
| card | `border-width`, `color-rule`, `radius-row`, `color-sheet`, `color-inset`, `space-2`, `space-4`, `space-5`, `space-7` |
| page header | `font-display`, `font-sans`, `font-size-2xl`, `font-size-xl`, `font-size-md`, `font-weight-display`, `tracking-display`, `line-height-tight`, `line-height-normal`, `color-ink`, `color-ink-soft`, `color-rule`, `border-width`, `space-1`, `space-2`, `space-4`, `space-6`, `figures` and the eyebrow tokens |
| context sidebar | `color-rail`, `color-rule`, `border-width`, `space-4` |
| personal rail | `color-chrome`, `color-chrome-ink`, `color-chrome-muted`, `border-width`, `shell-rail-width`, `space-1`, `space-2` |
