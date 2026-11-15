# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has five elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, `ocelle-facts` with its item
`ocelle-fact`, a label and value sheet, and `ocelle-empty-state`, an empty or loading panel.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-facts.js` | `dist/ocelle-facts.js` | `ocelle-facts` and its item `ocelle-fact`; for hosts with a bundler |
| `@ocelle/elements/ocelle-fact.js` | `dist/ocelle-fact.js` | `ocelle-fact` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-empty-state.js` | `dist/ocelle-empty-state.js` | `ocelle-empty-state` only; for hosts with a bundler |
| `@ocelle/elements/browser.js` | `dist/browser/ocelle-elements.js` | every element, Lit inside; for hosts without a bundler |
| `@ocelle/elements/custom-elements.json` | `custom-elements.json` | the manifest, also named by the `customElements` field |

The entry points, and the browser build's file path, are public surface.

## Builds

The package ships two builds of the same element source.

The module build, `dist/*.js`, imports `lit` by a bare specifier and needs a bundler: it is for hosts with one, such
as Kitty Desktop. `lit` 3.3.3 is its one runtime dependency, pinned exactly.

The browser build, `dist/browser/ocelle-elements.js`, holds Lit, imports nothing and defines every element: it is for
hosts without a bundler, such as the Ocelle console. A host without a bundler copies `dist/browser/ocelle-elements.js`
out of the package, serves it by path and loads it with one same-origin `<script type="module" src>` and no import
map:

```html
<link rel="stylesheet" href="/assets/tokens.css">
<script type="module" src="/assets/ocelle-elements.js"></script>
<ocelle-icon name="close"></ocelle-icon>
```

An element written in the HTML before the script loads upgrades when it does; until then an element without
light-DOM content has an empty box, and one with light-DOM content shows that content as plain inline text. A page under
`script-src 'self'` cannot load the module build directly: nothing can map its bare `lit` import there (an inline
import map is an inline script). Both builds run under `default-src 'none'; script-src 'self'; style-src 'self'` with
no exception: no inline script, no inline style, no `eval`, no network request.

The browser build starts with a licence banner naming Apache-2.0, Lit's copyright and BSD-3-Clause licence, and
`THIRD_PARTY_NOTICES`, so a copy of the file keeps its notice. The full notices are in `THIRD_PARTY_NOTICES` and
`licenses/lit-BSD-3-Clause.txt` in the package.

## Tokens

Link `tokens.css` of `@ocelle/tokens` first. The elements read their sizes and colours from its custom properties by
inheritance and bundle none of them. The package declares it as a peer dependency, `"@ocelle/tokens": "workspace:0.0.0"`.
Linked without it, `--ocelle-icon-size` is undefined, so an icon is drawn at the SVG default size (300 × 300 px in a
paragraph). Linked without it, an `ocelle-brand-mark` is drawn at the SVG default size too, and its ring is not
painted.

## `ocelle-icon`

```html
<ocelle-icon name="close"></ocelle-icon>
<ocelle-icon name="close" label="Close"></ocelle-icon>
```

- `name` (attribute and property, reflected): the icon's name, exactly as listed in Icons. Any other value, an empty
  name or no name draws nothing and keeps the box, without an error or a console message.
- `label` (attribute and property, not reflected): the accessible name of a standalone meaningful icon, trimmed. Empty
  or whitespace-only counts as none. Without a label the icon is decorative: hidden from the accessibility tree, and it
  adds nothing to the name of the control or text around it.

The icon is drawn inline in its shadow root in `currentColor`, so it takes the colour of the text around it, and in
forced colours the system colour of its context. `ocelle-icon` reads the token `--ocelle-icon-size`: overriding it on
an ancestor resizes every icon in that subtree. A host rule that sets the icon's `inline-size` or `block-size` wins; in
a box that is not square the drawing is scaled to the smaller side and centred. `ocelle-icon` has no slot, event, CSS
part or CSS custom property.

## Icons

| Name | Mirrors | Consumer need |
|---|---|---|
| `chevron-start` | yes | back navigation; the start direction of scrollers and breadcrumbs |
| `chevron-end` | yes | the disclosure (#13); the end direction of scrollers and breadcrumbs |
| `chevron-up` | no | collapsing a disclosure (#13) and scrolling up |
| `chevron-down` | no | expanding a disclosure (#13), menus and selects |
| `arrow-start` | yes | going back to the previous screen |
| `arrow-end` | yes | the action row's trailing arrow (#7) |
| `menu` | no | the top bar's menu button (#12) |
| `close` | no | closing a dialog or drawer and dismissing (#16) |
| `folder` | no | kitty-mission-ui's Projects screen ("Open project") and the folders of the Artifact Viewer's file tree, replacing its dropped folder icon (spec-kitty-design#496) |
| `file` | no | the files of kitty-mission-ui's Artifact Viewer file tree (spec-kitty-design#496) |
| `search` | no | kitty-mission-ui's Artifact Viewer, replacing its own magnifier glyph (spec-kitty-design#496) |
| `table` | no | kitty-mission-ui's Artifact Viewer, replacing its own table glyph (spec-kitty-design#496) |
| `copy` | no | the copy field's control (#14) |

Every drawing is the project's own, on a 24-unit grid with one stroke width, round caps and joins, painted only in
`currentColor`. `chevron-start`, `chevron-end`, `arrow-start` and `arrow-end` follow the inline direction: under
right-to-left text (`dir="rtl"` on the icon or an ancestor) they are mirrored, so start points right and end points
left; the other icons are never mirrored. The package exports no list of the names; the manifest's type of `name` is
their union. The names are public surface: renaming or removing one is a major change, adding one a minor change.

## `ocelle-brand-mark`

```html
<ocelle-brand-mark></ocelle-brand-mark>
<ocelle-brand-mark ground="chrome"></ocelle-brand-mark>
<ocelle-brand-mark tone="mono"></ocelle-brand-mark>
<ocelle-brand-mark label="Ocelle"></ocelle-brand-mark>
```

`ocelle-brand-mark` draws the Ocelle rosette, a broken ring around an ochre spot, inline in its shadow root from tokens
only. By default it is for the main grounds (`color-canvas`, `color-sheet`, `color-pane`, `color-panel`,
`color-inspector`, `color-rail`, `color-inset`, `color-accent-low` and `color-hover-bg`): ring `--ocelle-color-ink`,
spot `--ocelle-color-accent`.

- `ground` (attribute and property, reflected): `chrome` for the dark chrome grounds `color-chrome` and
  `color-chrome-hover` (the top bar and the rails, in both themes): ring `--ocelle-color-chrome-ink`, spot
  `--ocelle-color-accent`.
- `tone` (attribute and property, reflected): `mono` paints ring and spot in `currentColor`, the colour of the text
  around the mark, on any ground; it wins over `ground`.
- `label` (attribute and property, not reflected): the accessible name of the mark, trimmed; empty or whitespace-only
  counts as none. Without a label the mark is decorative: hidden from the accessibility tree, as beside the product
  name in a top bar, which carries the name.

Any other value of `ground` or `tone` gives the default. The main-ground variant on the chrome, or the chrome variant on
a main ground, is a host mistake: it is documented, not detected. `ocelle-brand-mark` reads the tokens
`--ocelle-icon-size`, `--ocelle-color-ink`, `--ocelle-color-chrome-ink` and `--ocelle-color-accent`.

The mark is `--ocelle-icon-size` high and as wide as high: a host that sets only its `block-size` gets a square, in a
flex column too, and one that sets only its `inline-size` gets a box that is not square, with the drawing scaled to
the smaller side and centred. A host that sizes the mark by percentage needs a container of definite height: against
an indefinite one (a bar with only a minimum height, or a paragraph) the percentage acts as `auto` and the mark falls
back to the SVG default size, 300 × 300 px.

In forced colours the ring and the spot are painted in `currentColor` in every variant, the system colour of their
context. On the light main grounds the ochre spot measures 2.6:1: the ring carries the mark, and a host that needs
every part at 3:1 uses `tone="mono"`. `ocelle-brand-mark` has no slot, event, CSS part or CSS custom property.

## `ocelle-facts`

```html
<ocelle-facts>
  <ocelle-fact label="Owner">Ada Lovelace</ocelle-fact>
  <ocelle-fact label="Status">Running</ocelle-fact>
  <ocelle-fact label="Mission id" wrap="anywhere">01JD8Y4K3QW7E5V0R2T9N6M1XC</ocelle-fact>
</ocelle-facts>
```

`ocelle-facts` shows label and value pairs as one description list: each pair is an `ocelle-fact` child, its label the
`label` attribute and its value the fact's content, which the sheet never copies or rewrites. A screen reader hears each
label with its value. A fact with no label keeps an empty label box and an empty term; a fact with no content keeps an
empty value box and an empty definition.

**Layout.** With `layout` unset the sheet is two columns while its own inline size, as laid out in two columns, is at
least `--ocelle-facts-stack-below`, and one column, each value below its label, below it. In two columns the label
column is as wide as the widest label, up to half the sheet, and longer labels wrap inside it; the value column takes
the rest and its content never widens it. `--ocelle-facts-stack-below` takes an absolute length; a percentage, 0 or an
invalid value falls back to the default, `calc(var(--ocelle-space-10) * 6)` (24rem). Set it on the sheet or an
ancestor. `layout="columns"` keeps two columns and `layout="stacked"` one column at any size; any other value acts as
unset. In a shrink-to-fit host (a dialog, a popover, a float, a flex item) the two-column size is the content's own, so
a sheet with short content stacks even where the host has room: set `layout` or give the sheet an inline size. The
sheet re-decides when it is resized, when the threshold changes, when its pairs or their content change (value text
included) and when the window is resized. After a resize the old layout can show for one frame. It does not observe
every change of the space it is offered: in a consumer's CSS grid `auto` track whose neighbour can be removed, the
layout may stay as it was; set `layout` or give the sheet an inline size there (for `layout="grid"`, an inline size).

**Grid.** `layout="grid"` shows each pair as a cell, its label above its value: four columns from twice
`--ocelle-facts-stack-below`, two from it, one below it, as one description list. The cells have equal widths and fill
each row from the inline start; a row may end with empty columns. In a shrink-to-fit host a grid sheet is four tracks
wide, each as wide as its widest cell: give it an inline size there. Set `wrap="anywhere"` on machine values in a grid
cell. The sheet paints no ground, divider or border; the surface is the container's.

**Children.** Only `ocelle-fact` children are pairs: other children, and facts with `hidden` or `aria-hidden="true"`,
are neither shown nor exposed; `lang` and `dir` on a fact apply to its label. A link or a button in a value keeps its
own tab stop and focus ring; the sheet adds none.

**Values.** `wrap="anywhere"` on a fact breaks a long identifier in its value anywhere; the label keeps word wrapping,
and copying gives the value unchanged. A value element with `data-ocelle-wrap="anywhere"` of `@ocelle/styles` does the
same. In every layout an unbroken value without `wrap="anywhere"` can overflow its value box or cell, so machine values
take `wrap="anywhere"`. The sheet never truncates a value: `break-word`, break-anywhere and an ellipsis all map to
`wrap="anywhere"`, with the full value shown. Digests are the consumer's text: the sheet does not group or rewrite
them.

**Density.** `density="compact"` tightens the row gap and changes no type; in a `data-ocelle-density="compact"` region
of `@ocelle/styles` the values take the region's size and line height through `--ocelle-facts-value-size` and
`--ocelle-facts-value-line-height`. A nested `regular` region returns them to the default.

**Restyling.** Do not set `grid-template-columns` through `ocelle-facts::part(list)`: it overrides every layout. In a
consumer's CSS grid, set `min-inline-size: 0` on the `ocelle-facts` host, so a long value cannot widen the track.
Labels are at weight 500 (`--ocelle-font-weight-medium`); `ocelle-facts::part(label)` sets another weight.

**Before upgrade.** Before the elements are defined, `@ocelle/styles` shows each value on its own line and a hidden
fact stays hidden; labels appear only after upgrade.

**Tokens.** `ocelle-facts` reads the tokens `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-font-size-fact`,
`--ocelle-font-weight-medium`, `--ocelle-font-weight-regular`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`,
`--ocelle-figures`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-3`, `--ocelle-space-4` and
`--ocelle-space-10`.

`ocelle-fact` outside `ocelle-facts` shows its label above its value as plain text, with no term or definition.

## `ocelle-empty-state`

```html
<ocelle-empty-state variant="panel">
  <ocelle-icon slot="visual" name="folder"></ocelle-icon>
  <h2 slot="heading">No missions yet</h2>
  <p>Missions you create appear here.</p>
  <button slot="actions" type="button">Create mission</button>
</ocelle-empty-state>
```

`ocelle-empty-state` shows an empty or loading panel: the consumer's own heading, body and actions in one centred
column. The heading level is the consumer's: slot your own heading element in `heading`; the element has no `level`
property and never adds a heading, landmark, live region or tab stop of its own. A slotted heading that is another
element (a `<p>` styled as a heading) keeps its own role. The element emits no event.

**Slots.** Slots: `visual` (an icon or an `ocelle-progress`, above the heading), `eyebrow` (a short line above the
heading), `heading` (the consumer's heading element), the default slot (the body) and `actions` (buttons or links,
which wrap when narrow); `part="body"` is the centred column, with its padding and every slot in it. The body's content
sits in an internal wrapper inside that column, which is not a part.

**Variants.** `variant="panel"` fills a list or inspector panel: block padding `--ocelle-space-10` instead of
`--ocelle-space-6`, larger gaps between parts, and the heading at weight 500 (`--ocelle-font-weight-medium`) instead of
600 (`--ocelle-font-weight-strong`); any other value acts as unset. The panel heading is at weight 500, lighter than
the default's 600, following the text of spec-kitty-design#510; a heading that was bold in a consumer's card becomes
500. The heading is at `--ocelle-font-size-lg` in `--ocelle-color-ink`, the body at `--ocelle-font-size-md` in
`--ocelle-color-ink-muted`, its measure capped at `--ocelle-measure-reading`.

**Gaps.** The first present part starts at the block padding and the last ends at it. Between two present parts the
gap is set by the upper one: after the visual `--ocelle-space-3` (panel `--ocelle-space-5`), after the heading
`--ocelle-space-2` (panel `--ocelle-space-3`), after the body `--ocelle-space-4` (panel `--ocelle-space-6`). A part is
present while something slotted in it renders: an empty slot, or one holding only elements with `hidden` or only
whitespace, takes no space and adds no gap. Hide slotted content with `hidden` or remove it: content hidden by a class
or a style rule is not observed. The actions are `--ocelle-space-2` apart and wrap onto more rows when narrow.

**Eyebrow.** The `eyebrow` slot holds a short line above the heading (a `<p>`, for example "Refused"), not a heading:
the element shows it in `--ocelle-font-sans` at `--ocelle-font-size-xs`, weight 500, `--ocelle-color-ink-muted`, in
upper case, and adds no role to it. The eyebrow sits `--ocelle-space-1` above a heading (panel `--ocelle-space-2`);
with no heading it is `--ocelle-space-2` above the body or the actions (panel `--ocelle-space-3`).

**Body.** The element sets the block margins of the body's elements to 0 and separates the body's children by
`--ocelle-space-2`, in both variants: each slotted element, and each run of slotted text, is a block of its own, so
text meant to flow as one paragraph with a link or an identifier inside it goes in one `<p>`. A page rule that sets
margins on the slotted body content wins over the reset. Give a long path or identifier in the body
`data-ocelle-wrap="anywhere"` of `@ocelle/styles`.

**Cascade.** The element styles slotted content through `::slotted()`, which beats the user-agent styles but not a
page's own rules: a page rule on the slotted heading, eyebrow or body content wins, by design, since the consumer owns
its content.

**Progress and loading.** An `ocelle-progress` in `visual` spans the column, up to `--ocelle-measure-reading`, in both
variants; an icon stays centred. The loading panel is `variant="panel"` with an indeterminate `ocelle-progress` in
`visual`. A screen that moves focus to a loading block slots its own `<h2 tabindex="-1">` in `heading`, with the bar in
`visual`, and focuses the heading; do not put a `role` or `tabindex` on the `ocelle-progress` host.

**Ground.** Neither variant paints a ground, a border or a busy look: the element sits on its container's ground. A
card around it (fill, radius, padding, a dashed or busy-keyed border) is the consumer's own; the dashed refusal card
belongs to the panel-paint family of spec-kitty-design#509, not to this element. In forced colours the heading and the
body take the system text colour.

**Tokens.** `ocelle-empty-state` reads the tokens `--ocelle-font-sans`, `--ocelle-font-size-xs`, `--ocelle-font-size-md`,
`--ocelle-font-size-lg`, `--ocelle-font-weight-medium`, `--ocelle-font-weight-strong`, `--ocelle-color-ink`,
`--ocelle-color-ink-muted`, `--ocelle-measure-reading`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-3`,
`--ocelle-space-4`, `--ocelle-space-5`, `--ocelle-space-6` and `--ocelle-space-10`.

## Mapping from kitty-mission-ui

Each `.sk-facts` and `.sk-empty-state` modifier and state that kitty-mission-ui uses, by role, with the element and
variant that replaces it, or the consumer's own remedy.

| Class family | Role | Element and variant |
|---|---|---|
| `.sk-facts` | facts stacked | `ocelle-facts` with `layout` unset (it stacks below the threshold) or `layout="stacked"`; in a consumer's CSS grid, `min-inline-size: 0` on the host |
| `.sk-facts` | facts two-col | `ocelle-facts` with `layout="columns"`, or unset at or above the threshold; drop the track override and do not restyle the columns through `::part(list)` |
| `.sk-facts` | facts compact | `ocelle-facts density="compact"` |
| `.sk-facts` | facts term | `ocelle-fact`'s `label`, rendered as the sheet's term (`part="label"`) |
| `.sk-facts` | facts term regular | consumer's: `ocelle-facts::part(label)` with `font-weight: var(--ocelle-font-weight-regular)` |
| `.sk-facts` | facts value mono | not supported: no monospace; values are sans with tabular figures, the small size through `--ocelle-facts-value-size` or a compact region |
| `.sk-facts` | facts value wrap | `ocelle-fact wrap="anywhere"` |
| `.sk-facts` | facts value ellipsis | `ocelle-fact wrap="anywhere"`, with the full value shown (no truncation) |
| `.sk-facts` | facts value identifier | `ocelle-fact wrap="anywhere"`, or a value element with `data-ocelle-wrap="anywhere"` |
| `.sk-facts` | facts value tooltip | consumer's: a `title` on its own value content, optional with the full value shown |
| `.sk-facts` | facts value pill | consumer's: pills are inline content in the fact's value |
| `.sk-facts` | facts value action | consumer's: a button in the value keeps its own tab stop |
| `.sk-facts` | facts row optional | consumer's: leave the `ocelle-fact` out or set `hidden` on it |
| `.sk-facts` | facts group heading | consumer's: the heading stays outside the sheet |
| `.sk-facts` | facts group omitted | consumer's: leave the sheet out or render an `ocelle-empty-state`; a sheet with no pairs renders nothing |
| `.sk-facts` | facts workspace marker | consumer's: a `data-*` attribute on the `ocelle-facts` host |
| `.sk-empty-state` | empty-state panel | `ocelle-empty-state variant="panel"`, the heading at 500 and the larger rhythm, with no chrome of its own; the state wrapper and its `aria-busy` stay the consumer's |
| `.sk-empty-state` | empty-state regional | `ocelle-empty-state`, default variant, with only the default slot |
| `.sk-empty-state` | empty-state refusal | `ocelle-empty-state` with the eyebrow in the `eyebrow` slot, an `<h1>` in `heading`, the sentence and the path (with `data-ocelle-wrap="anywhere"`) in the body, and an action; the dashed card is not this element's |
| `.sk-empty-state` | empty-state heading h1 | the consumer's `<h1>` in the `heading` slot |
| `.sk-empty-state` | empty-state heading h2 | the consumer's `<h2>` in the `heading` slot |
| `.sk-empty-state` | empty-state heading paragraph | the consumer's `<p>` in the `heading` slot; a bar named by it takes its text as `label` |
| `.sk-empty-state` | empty-state no heading | the `heading` slot left empty: a loading panel with `ocelle-progress` in `visual`, or a body-only notice |
| `.sk-empty-state` | empty-state body multiple | both paragraphs in the default slot: their margins are reset and they are `--ocelle-space-2` apart |
| `.sk-empty-state` | empty-state body optional | the default slot filled or left empty |
| `.sk-empty-state` | empty-state action | the `actions` slot; the element gives the gap above it, so drop the consumer's own top margin |
| `.sk-empty-state` | empty-state action wrapper | the `actions` slot |
| `.sk-empty-state` | empty-state inline | not this mission: no left-aligned inline variant |
| `.sk-empty-state` | empty-state busy | an indeterminate `ocelle-progress size="compact"` in `visual`; `aria-busy` stays on the consumer's wrapper, and a busy look is the consumer's card |
| `.sk-empty-state` | empty-state message | consumer's: its own dashed card around an `ocelle-empty-state` (default variant) |
| `.sk-empty-state` | empty-state card | consumer's: its own card (fill, radius, inline padding, busy-keyed border) around `ocelle-empty-state variant="panel"`, whose heading is at 500 |
| `.sk-empty-state` | empty-state card dashed | not this mission: panel and card paint, spec-kitty-design#509 |
| `.sk-empty-state` | empty-state ops card | consumer's: as the card, its own card around the element, the heading at the element's weight |
| `.sk-empty-state` | empty-state identifier | consumer's: the value in the body with `data-ocelle-wrap="anywhere"` and its own `title`; no monospace |
| `.sk-empty-state` | empty-state focus target | consumer's: `tabindex="-1"` on its slotted heading; for a loading block, its `<h2 tabindex="-1">` in `heading` with the bar in `visual` |

## Slot convention

A control that shows icons follows one slot convention: an `icon` slot before its label and, where it has an end icon
such as the action row's arrow, a `trailing` slot after it. The control renders, in its shadow root, a row with the
class `icon-row` holding `<span class="icon-slot"><slot name="icon"></slot></span>`, its label, and
`<span class="icon-slot trailing"><slot name="trailing"></slot></span>`, and adds `iconSlotStyles`
(`src/icon-slot.ts`, internal) to its `static styles`:

```ts
static override styles = [css`…the control's own rules…`, iconSlotStyles];

protected override render(): unknown {
  return html`<button class="icon-row"><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span><span class="icon-slot trailing"><slot name="trailing"></slot></span></button>`;
}
```

A host then slots its icons with no size of its own (here into `ocelle-button`, which #7 will add):

```html
<ocelle-button><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>
```

- **Size.** A slotted icon, an `ocelle-icon` or a bare `<svg>`, is `--ocelle-icon-size` square and does not shrink,
  whatever a normal page rule, `base.css` or its `width` and `height` attributes set. A slotted SVG needs a `viewBox`
  to scale: with one, the drawing is scaled into the box, centred, aspect kept; without one it gets the box only.
- **Alignment.** The row sets the type (font size and line height) that the wrappers and the label inherit; each
  wrapper is one line box tall (`1lh`) with the icon centred in it, so the icon is centred on the label's first line
  at any type size and leading, overflowing the line box evenly when it is taller. Set the type on the row, not on the
  label alone.
- **Row padding.** The row's block padding, `calc((var(--ocelle-icon-size) - 1lh) / 2)` from `iconSlotStyles` (0 when
  the line box is at least the icon size), keeps that overflow inside the control's box. A control never sets block
  padding on the row; it puts any further block padding on an element around the row.
- **Gap.** A slotted icon is separated from the label by `--ocelle-space-2`; an empty slot takes no space and adds no
  gap. The `icon` slot is on the label's left in left-to-right text and on its right under `dir="rtl"`; the `trailing`
  slot the other way round.
- **Colour.** A slotted icon takes the control's text colour: `ocelle-icon` draws in `currentColor`, and a bare
  `<svg>` does so when its drawing uses `currentColor`. In forced colours it takes the control's system colour.
- **Base stylesheet.** `base.css` gives every light-DOM `svg` `max-inline-size: 100%` and `block-size: auto`, and page
  rules beat a shadow root's normal rules; the convention's size rules on slotted elements are `!important`, so
  neither `base.css` nor a host rule changes a slotted icon's box.
- **Resizing.** Resize slotted icons only by overriding `--ocelle-icon-size` on the control or an ancestor: the
  convention pins the token on every slotted element to the control's value, so `--ocelle-icon-size` set on a slotted
  icon itself has no effect.
- **Naming.** An icon-only control names its own inner control (for example with `aria-label` on its inner
  `<button>`), never its icon: a slotted icon stays decorative and is never given a `label`. The convention adds no
  generated content, so a control named by its visible label keeps exactly that name.
- **Lint.** The `style-lint` gate allows the unit `lh` only as `1lh`, alone or once as an operand of `+` or `-` beside
  an `--ocelle-*` token inside `calc()`; a factor on a parenthesised `calc()` group that holds `1lh`, such as
  `calc((var(--ocelle-space-1) + 1lh) * 2)`, passes the gate and is checked in review.

The convention is proven on a test-only host, `ocelle-test-host` (`test/fixtures/test-host.ts`), which ships in no
package; the controls of later features follow it.

## Host ARIA

A host `aria-label` names the element as `label` does, and when present it decides alone: a blank host `aria-label`
leaves the element unlabelled even with a `label`. When both are set, the host `aria-label` is the name; removing it
falls back to `label`. Chromium uses a host `aria-label` as written, surrounding spaces included, so pass it trimmed;
the element never rewrites it. An unknown icon name exposes nothing, named or not.

A host `aria-hidden="true"` hides the element, labelled or not. A host `hidden` attribute removes the element: no box
and no node, labelled or not. A host `role` or `aria-hidden="false"` is not supported: name the element with `label` or
`aria-label` instead.

## Two copies on a page

Two copies of the package on one page, two versions or the browser build beside a bundle of the module build, cannot
both define an element: the first definition wins and the second import throws nothing. The elements on the page are
then the first copy's.

## Engines

Engine floor: Chromium 120+ and WebKit 16.4+, with no `window.ShadyCSS` polyfill on the page. Each figure is the
newest feature the elements use:

- `:dir()`: Chromium 120, WebKit 16.4 (the inline-direction icons' mirroring);
- `@media not (forced-colors: active)` (Media Queries 4's `not (…)` without a media type): Chromium 104, WebKit 16.4
  (the brand mark's variants);
- The `lh` unit: Chromium 109 (the slot convention);
- The `scale` property: Chromium 104 (the mirroring);
- Constructable stylesheets (`adoptedStyleSheets`): Chromium 73, WebKit 16.4 (every element's styles; below it Lit
  falls back to `<style>` elements, which the strict CSP blocks);
- Manual slot assignment (`slotAssignment: "manual"`, `HTMLSlotElement.assign()`): Chromium 86, WebKit 16.4
  (`ocelle-facts`). The floor does not change.

An element that uses a feature newer than the floor raises the floor in this section, the one list of the floor
features, and records the feature in its own feature's research.

Only Chromium is measured. WebKit (Kitty Desktop on macOS and Linux) is not: its accessibility tree, forced colours and
mirroring are an open limitation.

## Element conventions

Every element of this library is written the same way, so a later element follows these rules without a design
question.

**Module and registration.** Each element lives in its own module, `src/<tag>.ts`, which ends with one
`define("<tag>", <Class>)` call: importing the module defines that element and no other, except that a container module
also imports its item element, and importing the package root defines every element. `define` (`src/define.ts`, internal) defines a tag only while it is free: a second definition of
the same tag does nothing and throws nothing. The module exports the class and declares it in
`HTMLElementTagNameMap`; `src/index.ts` re-exports it.

**Properties.** Elements declare their reactive properties with `static override properties = { … }` and `declare`
fields, not decorators. Every element class carries the JSDoc tag `@tagname <tag>`, and every public property a
description and `@default undefined`: the manifest takes the tag name and the defaults from them. An element that
observes a standard attribute such as `aria-label` adds it to `observedAttributes` without declaring a property, so
the manifest does not list it.

**Styles.** An element's styles are one `css` tagged template assigned to `static styles`, built only from `--ocelle-*`
tokens and the values the `style-lint` gate allows, so every instance adopts one shared stylesheet. No template has a
`style` attribute or a `<style>` element. Every element's styles hold `:host([hidden]) { display: none; }` beside its
`:host` display rule, which would otherwise beat the user-agent `[hidden]` rule. Variant rules go inside
`@media not (forced-colors: active)`, so a forced-colours rule never has to outrank a variant selector.

**Manifest.** `custom-elements.json` is generated from the element source by
`pnpm --filter @ocelle/elements run manifest` and committed; the `manifest` gate fails when it differs from a
regeneration or when a public member has no description. It declares, for every element, its tag name, its class,
every public property and attribute with type, default and description, and its events, slots, CSS parts and CSS custom
properties, each list stated even when empty. An `--ocelle-*` token of `@ocelle/tokens` that an element reads by
inheritance is not one of the element's CSS custom properties and is not in its manifest entry. This README names the
tokens each element reads, and overriding a token is the way to change what the element takes from it. An element's
own hook is a CSS custom property named `--ocelle-<element>-<property>`, which matches no token name.

**Slotted items.** A container element renders its items' structure in its own shadow root and assigns each item
there by manual slot assignment; its items are its direct children of one item element, and its module imports that
item element. Other children are not shown. `ocelle-facts` and `ocelle-fact` are the first container and item.

**Identifier wrap.** An element whose values can hold machine identifiers takes a `wrap` property with the one value
`anywhere`, which sets `overflow-wrap: anywhere` on the value only, never on a label.

**Stories.** Every element has a story per variant and per state in `storybook/stories/<element>.stories.ts`, in light
and dark, and its stories pass the `csp` and `prefix` gates' Storybook checks.

**Files and tests.** Files: `src/<tag>.ts` per element, internal modules beside them in `src/` (not entry points),
`src/index.ts` (the package root) and `src/browser.ts` (the browser build's entry). Tests: the browser scenarios are
written once in `test/scenarios/` against a driver and run twice, in process on the element source by `test/*.test.ts`
(the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages by
`test/browser/*.test.ts` (the `elements-browser` project). Node tests of the generator, the configuration and this
README are in `test/node/`; tests that run the build or `pnpm pack` are in `test/build/`.

## Licence

Apache-2.0, see `LICENSE`. Every icon is the project's own drawing, under Apache-2.0; no third-party icon set is used,
so `THIRD_PARTY_NOTICES` lists none. The mark is the project's own drawing of the Ocelle rosette, redrawn from the
geometry of Ocelle's app icon, under Apache-2.0. The browser build bundles Lit (BSD-3-Clause), listed in
`THIRD_PARTY_NOTICES`.

"Ocelle" and the rosette mark are trademarks of their owner. The Apache-2.0 licence grants no right to use them
(section 6 of the licence); they may be used only to refer to Ocelle. The package carries the same note in `NOTICE`,
beside `LICENSE` and `THIRD_PARTY_NOTICES`.
