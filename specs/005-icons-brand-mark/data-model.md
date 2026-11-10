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
| "close" | "folder" | "file" | "search" | "table" | "copy"`, declared as this explicit union. The table is typed
`Readonly<Record<IconName, Icon>>`, so the type checker rejects a missing or extra name, and is not written `as const`
(Stryker does not mutate inside `as const`, R-07). The package exports the type (with the classes) but no runtime list
of names (FR-018). The tests hold an independent expected table of the same shape (`test/icons-expected.ts`).

## `ocelle-icon` (`OcelleIcon`)

| Member | Kind | Type | Default | Attribute | Reflects |
|---|---|---|---|---|---|
| `name` | property | `IconName \| undefined` | `undefined` (no drawing) | `name` | yes |
| `label` | property | `string \| undefined` | `undefined` (unlabelled) | `label` | no |

No slot, event, CSS part or CSS custom property. Reads the token `--ocelle-icon-size` (from `@ocelle/tokens`, a peer
dependency; without `tokens.css` the box falls back to the SVG default size, R-04). Observes the host attribute
`aria-label` (not a property; R-13).

**Box**: `:host` `inline-block`, `--ocelle-icon-size` square (R-04); `:host([hidden]) { display: none; }`, so a host
`hidden` removes the box and, with it, every node (PLAN-FRESH-2-001; a shadow `:host` display rule would otherwise
beat the user-agent `[hidden]` rule).

**State** (derived on every update): `drawable` = `name` is a key of the icon table (exact). `accessibleName`
(FR-034): if the host has an `aria-label` attribute, it decides alone: its value if it holds a non-whitespace
character (as the host wrote it; Chromium keeps surrounding spaces, so hosts pass it trimmed), else none, even with a
`label`; if the host has no `aria-label`, the trimmed `label` if non-empty, else none.

| `drawable` | `accessibleName` | Shadow root | Internals |
|---|---|---|---|
| no | any | empty (no `svg`) | `ariaHidden "true"`, no role, no label |
| yes | none | the icon's `svg` (`aria-hidden="true"`) | `ariaHidden "true"`, no role, no label |
| yes | a name | the icon's `svg` (`aria-hidden="true"`) | `role "img"`, `ariaLabel` = name, `ariaHidden` null |

A host `aria-hidden="true"` hides the element in every row (ARIA precedence over internals). When a host `aria-label`
names the element, Chromium takes the name from the host attribute; the internals' `ariaLabel` matters only for the
`label` case. The element never writes the host's `aria-label`.

## `ocelle-brand-mark` (`OcelleBrandMark`)

| Member | Kind | Type | Default | Attribute | Reflects |
|---|---|---|---|---|---|
| `ground` | property | `"chrome" \| undefined` | `undefined` (main grounds) | `ground` | yes |
| `tone` | property | `"mono" \| undefined` | `undefined` | `tone` | yes |
| `label` | property | `string \| undefined` | `undefined` | `label` | no |

No slot, event, CSS part or CSS custom property. Reads `--ocelle-icon-size`, `--ocelle-color-ink`,
`--ocelle-color-chrome-ink`, `--ocelle-color-accent` (from `@ocelle/tokens`, a peer dependency; without `tokens.css`
the ring is not painted, R-09). Naming as for `ocelle-icon` with `drawable` always true.

**Box**: `block-size: var(--ocelle-icon-size)`, `inline-size: max-content`, `aspect-ratio: 1` (R-09,
PLAN-FRESH-2-003): 20 × 20 px by default, in flow and in a row or column flex container alike (with `inline-size:
auto` a column flex container stretches it to its width); a host `block-size` alone gives a square of that size; a
host `inline-size` alone gives a non-square box with the drawing scaled to the smaller side and centred. A host
percentage height scales the mark only in a container of definite height (`block-size: 100%` in a 48 px
`block-size` flex bar gives 48 × 48 px); against an indefinite height (a `min-block-size` bar, a paragraph) it acts
as `auto` and the mark falls back to the SVG default size, 300 × 300 px (PLAN-FRESH-3-003, R-09).
`:host([hidden]) { display: none; }` as for the icon (PLAN-FRESH-2-001).

**Variants** (CSS on exact attribute values; any other value is the default). The variant rules are inside
`@media not (forced-colors: active)`, so none of them applies in forced colours and the forced-colours rules need not
outrank any variant selector (R-09):

| Variant | Selector | Ring stroke | Spot fill |
|---|---|---|---|
| default (main grounds) | `.ring`, `.spot` inside `@media not (forced-colors: active)` | `--ocelle-color-ink` | `--ocelle-color-accent` |
| chrome | `:host([ground="chrome"]) .ring` inside `@media not (forced-colors: active)` | `--ocelle-color-chrome-ink` | `--ocelle-color-accent` |
| mono (wins over chrome) | `:host([tone="mono"])` inside `@media not (forced-colors: active)` | `currentColor` | `currentColor` |
| forced colours (every variant) | `.ring`, `.spot` inside `@media (forced-colors: active)` | `currentColor` | `currentColor` |

Measured with this structure: in forced colours every variant's ring and spot are the context's system colour in
both palettes (R-09).

**Drawing** (`rosette.ts`): `viewBox="4 4 92 92"`, chosen from the rosette's painted extent (7.5 to 93.9 about the
ring's centre (50, 50)); four `path` arcs with class `ring`, each with its own `stroke-width` (15, 12, 16, 11),
`fill="none"`, `stroke-linecap="round"`; one `ellipse` with class `spot` and a `transform` attribute for its rotation.
Geometry is the reference's rosette group in the group's own coordinates, with no transform (R-09); against the
reference group the fit of US4-9 is scale 1, translation 0.

## Slot convention (`packages/elements/src/icon-slot.ts`)

| Part | Markup in the control's shadow root | Rule |
|---|---|---|
| icon wrapper | `<span class="icon-slot"><slot name="icon"></slot></span>` | `inline-flex`, `block-size: 1lh` (one line box of the row), icon centred in it, `flex: none`; no generated content |
| label | the control's own label element | between the two wrappers |
| trailing wrapper | `<span class="icon-slot trailing"><slot name="trailing"></slot></span>` | as the icon wrapper |
| slotted icon | any element in either slot | `--ocelle-icon-size` square, `!important`; `--ocelle-icon-size: inherit !important` on the slotted element, so a page rule setting the token on the element itself has no effect and the icon always takes the control's value, the one the row's padding uses (PLAN-FRESH-3-001, R-10); gap `--ocelle-space-2` by inline margin toward the label, `!important` |

The control's row carries the class `icon-row`, is `display: inline-flex; align-items: flex-start`, and sets the type
(font size, line height) that the wrappers and the label inherit. `iconSlotStyles` gives it `padding-block:
calc((var(--ocelle-icon-size) - 1lh) / 2)` (0 when the line box is at least the icon size, since a negative `calc()`
padding is clamped to 0), so a slotted icon taller than the line box stays inside the control's box
(PLAN-FRESH-2-002 (a), R-10). A control never sets block padding on the row; it puts any further block padding on an element around the row.

## Contrast rows (`packages/tokens/contrast/pairs.json`, new)

| Theme | fg | bg | kind | status |
|---|---|---|---|---|
| light, dark | `color-accent` | `color-chrome`, `color-chrome-hover` | non-text | checked |
| dark | `color-accent` | the nine main grounds | non-text | checked |

`figure` is computed by `gates/lib/wcag.ts` at the file's precision; `source` is `"computed"`. Counts: 160 light,
168 dark, 328 entries (from 158, 157 and 315; every test that pins them changes first, R-09).

## Manifest (`packages/elements/custom-elements.json`)

`"schemaVersion": "1.0.0"`, as analyzer 0.11.0 writes it (measured, R-06). One module per element file; each element
declaration has `tagName` (from the class's `@tagname` JSDoc tag), `name` (class), `customElement: true`, `members`
(the public properties, each with `type.text`, `default` (`"undefined"`, from `@default undefined`), `description`,
`attribute`, `reflects`), `attributes` (each with `type`, `description`, `fieldName`; the observed `aria-label` is
dropped by the normaliser), and `slots`, `events`, `cssParts`, `cssProperties` (empty arrays here). `name`'s
`type.text` is the expanded union of the thirteen names plus `undefined`.

## Gate finding (`manifest`)

`<path>:<line>: manifest: <rule>: <message>` with rules `stale` (location `packages/elements/custom-elements.json`,
message naming `<element>` and `<member kind> <member name>`, or "differs from the generated manifest") and
`no-description` (message naming element, kind and name). Exit codes as `gates/README.md`.
