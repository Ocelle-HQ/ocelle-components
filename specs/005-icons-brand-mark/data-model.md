# Data Model: Icons and Brand Mark (005)

## Icon (`packages/elements/src/icons.ts`)

| Field | Type | Rule |
|---|---|---|
| `name` | `IconName` | one of the thirteen names (FR-017), unique |
| `mirror` | `boolean` | `true` for `chevron-start`, `chevron-end`, `arrow-start`, `arrow-end` only |
| `shapes` | list of `Shape` | non-empty; renders as the children of one `<svg viewBox="0 0 24 24">` |

`Shape` is one of `path { d }`, `line { x1 y1 x2 y2 }`, `polyline { points }`, `rect { x y width height rx? }`,
`circle { cx cy r }`. Every shape is stroked with `currentColor`, `stroke-width="2"`, `stroke-linecap="round"`,
`stroke-linejoin="round"`, `fill="none"`; the attributes are set once on the `svg` and inherited. No shape has an
`id`, `style`, `href`, event-handler attribute or colour other than `currentColor` (FR-010, FR-012, FR-018). Painted
area (geometry bounds grown by 1 unit, half the stroke) lies within 0 to 24 (US2-2). No two icons have equal `shapes`.

`IconName` = `"chevron-start" | "chevron-end" | "chevron-up" | "chevron-down" | "arrow-start" | "arrow-end" | "menu"
| "close" | "folder" | "file" | "search" | "table" | "copy"`. The package exports the type (with the classes) but no
runtime list of names (FR-018).

## `ocelle-icon` (`OcelleIcon`)

| Member | Kind | Type | Default | Attribute | Reflects |
|---|---|---|---|---|---|
| `name` | property | `IconName \| undefined` | `undefined` (no drawing) | `name` | yes |
| `label` | property | `string \| undefined` | `undefined` (unlabelled) | `label` | no |

No slot, event, CSS part or CSS custom property. Reads the token `--ocelle-icon-size`. Observes the host attribute
`aria-label` (not a property; R-13).

**State** (derived on every update): `drawable` = `name` is a key of the icon table (exact). `accessibleName` =
trimmed host `aria-label` if non-empty, else trimmed `label` if non-empty, else none.

| `drawable` | `accessibleName` | Shadow root | Internals |
|---|---|---|---|
| no | any | empty (no `svg`) | `ariaHidden "true"`, no role, no label |
| yes | none | the icon's `svg` (`aria-hidden="true"`) | `ariaHidden "true"`, no role, no label |
| yes | a name | the icon's `svg` (`aria-hidden="true"`) | `role "img"`, `ariaLabel` = name, `ariaHidden` null |

A host `aria-hidden="true"` hides the element in every row (ARIA precedence over internals).

## `ocelle-brand-mark` (`OcelleBrandMark`)

| Member | Kind | Type | Default | Attribute | Reflects |
|---|---|---|---|---|---|
| `ground` | property | `"chrome" \| undefined` | `undefined` (main grounds) | `ground` | yes |
| `tone` | property | `"mono" \| undefined` | `undefined` | `tone` | yes |
| `label` | property | `string \| undefined` | `undefined` | `label` | no |

No slot, event, CSS part or CSS custom property. Reads `--ocelle-icon-size`, `--ocelle-color-ink`,
`--ocelle-color-chrome-ink`, `--ocelle-color-accent`. Naming as for `ocelle-icon` with `drawable` always true.

**Variants** (CSS on exact attribute values; any other value is the default):

| Variant | Selector | Ring stroke | Spot fill |
|---|---|---|---|
| default (main grounds) | none | `--ocelle-color-ink` | `--ocelle-color-accent` |
| chrome | `:host([ground="chrome"])` | `--ocelle-color-chrome-ink` | `--ocelle-color-accent` |
| mono (wins over chrome) | `:host([tone="mono"])` | `currentColor` | `currentColor` |
| forced colours (all) | `@media (forced-colors: active)` | `currentColor` | `currentColor` |

**Drawing** (`rosette.ts`): `viewBox="0 0 100 100"`; four `path` arcs with class `ring`, each with its own
`stroke-width`, `fill="none"`, `stroke-linecap="round"`; one `ellipse` with class `spot` and a `transform` attribute
for its rotation. Geometry is the reference's rosette group under its `translate(14 14) scale(0.72)` (R-09).

## Slot convention (`packages/elements/src/icon-slot.ts`)

| Part | Markup in the control's shadow root | Rule |
|---|---|---|
| icon wrapper | `<span class="icon-slot"><slot name="icon"></slot></span>` | `inline-flex`, centred, `flex: none`, a zero-width-space `::before` strut |
| label | the control's own label element | between the two wrappers |
| trailing wrapper | `<span class="icon-slot trailing"><slot name="trailing"></slot></span>` | as the icon wrapper |
| slotted icon | any element in either slot | `--ocelle-icon-size` square, `!important`; gap `--ocelle-space-2` by inline margin toward the label, `!important` |

The control's row is `display: inline-flex; align-items: flex-start`.

## Contrast rows (`packages/tokens/contrast/pairs.json`, new)

| Theme | fg | bg | kind | status |
|---|---|---|---|---|
| light, dark | `color-accent` | `color-chrome`, `color-chrome-hover` | non-text | checked |
| dark | `color-accent` | the nine main grounds | non-text | checked |

`figure` is computed by `gates/lib/wcag.ts` at the file's precision; `source` is `"computed"`. Counts: 160 light,
168 dark.

## Manifest (`packages/elements/custom-elements.json`)

Schema 2.1.0 (the analyzer's). One module per element file; each element declaration has `tagName`, `name` (class),
`customElement: true`, `members` (the public properties, each with `type.text`, `default`, `description`,
`attribute`, `reflects`), `attributes` (each with `type`, `description`, `fieldName`), and `slots`, `events`,
`cssParts`, `cssProperties` (empty arrays here). `name`'s `type.text` is the expanded union of the thirteen names
plus `undefined`.

## Gate finding (`manifest`)

`<path>:<line>: manifest: <rule>: <message>` with rules `stale` (location `packages/elements/custom-elements.json`,
message naming `<element>` and `<member kind> <member name>`, or "differs from the generated manifest") and
`no-description` (message naming element, kind and name). Exit codes as `gates/README.md`.
