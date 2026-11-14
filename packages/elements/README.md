# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has five elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, `ocelle-scroller`, a
horizontal strip that is a tab stop only while it overflows, and `ocelle-workflow-board` with its
`ocelle-workflow-lane`s, a row of lanes that scrolls inside itself when it is narrower than they are.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-scroller.js` | `dist/ocelle-scroller.js` | `ocelle-scroller` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-workflow-board.js` | `dist/ocelle-workflow-board.js` | `ocelle-workflow-board` only, not the lane; for hosts with a bundler |
| `@ocelle/elements/ocelle-workflow-lane.js` | `dist/ocelle-workflow-lane.js` | `ocelle-workflow-lane` only; for hosts with a bundler |
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

An element written in the HTML before the script loads upgrades when it does; until then its box is empty. A page under
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

## `ocelle-scroller`

`ocelle-scroller` lays out its slotted content in one box that scrolls in the inline direction only; it is a tab stop
and a named group only while its content overflows. It has one default slot, the strip's content.

- `label` (attribute and property, not reflected): the name of the scroller's group while it overflows, trimmed; empty
  or whitespace-only counts as none.
- **Tokens.** `ocelle-scroller` reads the tokens `--ocelle-focus-offset`, `--ocelle-focus-width`,
  `--ocelle-color-focus`, `--ocelle-scroller-fade-size`, `--ocelle-color-ink` (as a mask colour only) and
  `--ocelle-border-width` (the forced-colours edge line).
- **Tree.** While it overflows and has a name, the scroller is one `group` node with that name, holding its content; it
  is not a landmark. While it overflows without a name it is a tab stop with no role and no name. While its content
  fits it adds no tab stop and no role, beyond the `generic` node the host gets from an `id` or a host `aria-label`.
- **Keyboard.** While it overflows, the scroller is a tab stop before its content. `ArrowLeft` and `ArrowRight` on the
  focused scroller, without a modifier, scroll it 40 px with no animation; `Home`, `End`, arrows with Alt, Ctrl, Meta
  or Shift, and every key pressed while a slotted control has focus get the browser's default.
- **Focus.** When the content stops overflowing while the scroller has focus, focus moves to its first focusable
  slotted element, also inside a slotted element's open shadow root, and otherwise to the scroller itself, which shows
  the focus ring inside its box. A slotted control focused with a focus ring is scrolled into view with its ring, at
  least the fade depth from each edge that fades; a control too wide for that keeps the fade off the side it would
  cover until focus leaves it or the box is scrolled.
- **Fades.** Each inline edge with content off-screen fades the content toward transparency over
  `--ocelle-scroller-fade-size`; in forced colours it shows a 1 px `CanvasText` line instead. The fades follow the
  inline direction and are correct on every main ground in both themes.
- **Scrollbar.** The platform's horizontal scrollbar is kept: where it takes space it adds its thickness to the
  scroller's block size, and it is never faded. The box keeps the ring room of its slotted controls on every side.
- **Motion.** Under reduced motion nothing the scroller does animates. The browser's own scrolling of the strip on a
  key pressed while a slotted control has focus is not the scroller's and may animate, also under reduced motion; the
  element does not control it.
- **Naming.** Always give a scroller a `label`. A scroller repeated per item takes a name that identifies the item, such
  as "Tags of WP-12", not the same name on every card.
- **Sizing.** In a shrink-to-fit host (a default flex item, a dialog, a table cell) the scroller takes its content's
  size and does not overflow, so the page may scroll sideways instead: give the scroller a definite or maximum inline
  size there so that it scrolls.
- `ocelle-scroller` has no event, CSS part or CSS custom property.

## `ocelle-workflow-board`

`ocelle-workflow-board` lays its children out in one row in the inline direction, `--ocelle-space-3` apart: each child
takes at least `--ocelle-lane-min-width` and the children share any extra space equally; when their minimum widths
exceed its size, the board scrolls inside itself. It has one default slot, the lanes.

- `label` (attribute and property, not reflected): the name of the board's region while it overflows, trimmed; empty
  or whitespace-only counts as none.
- **Tokens.** `ocelle-workflow-board` reads the tokens `--ocelle-lane-min-width`, `--ocelle-space-3`,
  `--ocelle-focus-offset`, `--ocelle-focus-width`, `--ocelle-color-focus`, `--ocelle-scroller-fade-size`,
  `--ocelle-color-ink` (as a mask colour only) and `--ocelle-border-width` (the forced-colours edge line).
- **Tree, keyboard and focus.** While it overflows and has a name, the board is one `region` landmark with that name,
  holding its lanes. Otherwise its tree, keyboard, focus, fades and scrollbar are those of `ocelle-scroller`, through
  the same overflow-region module.
- **Lanes.** A board holds lanes. Any other child is laid out as a lane: it takes the same minimum and the same equal
  share.
- **Content.** No content widens a lane past its share: text wraps, and a word wider than the lane breaks inside it.
  Content that cannot shrink, such as an element of fixed inline size, is not clipped: it overflows its lane over the
  next one, and when it reaches past the board's end the board scrolls. Put wide content, such as a row of chips, in
  an `ocelle-scroller`. `base.css` caps images nested in a card at the lane's width; a host without it caps them
  itself.
- **Ground.** The board paints no ground of its own: put it, and its flat lanes, on a main ground.
- **Sizing.** In a shrink-to-fit host (a default flex item, a dialog, a table cell) the board takes its lanes' minimum
  widths and gaps and does not overflow, so the page may scroll sideways instead: give the board a definite or maximum
  inline size there so that it scrolls.
- **Updates.** The board follows changes of its own size, of a lane's size and of its children. A change inside a
  lane that changes only the inline size of a descendant, and neither the board's size nor a lane's, is picked up at
  the board's next size, slot or scroll event.
- `ocelle-workflow-board` has no event, CSS part or CSS custom property.

## `ocelle-workflow-lane`

`ocelle-workflow-lane` is a column of a board with an optional title, an optional count and a variant. It has one
default slot, the lane's content, such as cards.

- `label` (attribute and property, not reflected): the lane's title, shown and used as its name, trimmed; empty or
  whitespace-only counts as absent, and no title is shown.
- `count` (attribute and property, not reflected): a whole number of 0 or more, shown after the title with tabular
  figures as plain digits (`03` shows 3). The attribute counts only when, after trimming, it is decimal digits alone,
  at most `Number.MAX_SAFE_INTEGER`; the property, when it is a safe integer of 0 or more; anything else counts as
  absent.
- `count-label` (attribute, and property `countLabel`, not reflected): the count's text in the name, trimmed, such as
  "3 work packages"; the visible count still shows the number.
- `variant` (attribute and property, reflected): `flat` drops the lane's ground, corners and padding and sets the title
  and count in small uppercase; any other value gives the default.
- **Tree.** The lane is one `group` named by its title, then ", " and the `count-label` or the count when a count is
  shown ("Ready, 3"); without a title, by the count's text alone; without a shown count, by the title alone. With
  neither it adds no role and no name. A non-blank host `aria-label` names the group alone. No word is added to the
  name in any language: a host that wants words passes them in `count-label`. The visible title and count are hidden
  from the accessibility tree, so the name is not read twice. The lane is not a live region: a change of `count` or
  `count-label` updates the visible count and the name, and is not announced.
- **Default.** The default lane's ground is `--ocelle-color-sheet`, which differs from `--ocelle-color-canvas`,
  `--ocelle-color-panel`, `--ocelle-color-inspector` and `--ocelle-color-pane` in both themes, with
  `--ocelle-radius-row` corners and `--ocelle-space-3` padding; its title is `--ocelle-font-size-sm` at
  `--ocelle-font-weight-strong` in `--ocelle-color-ink`, and its count follows in `--ocelle-color-ink-muted`. In forced
  colours it draws a 1 px `CanvasText` border.
- **Flat.** The flat lane has no ground, corners or padding of its own: its cards sit on the board's ground. Its title
  and count are `--ocelle-font-size-xs` at `--ocelle-font-weight-strong` in `--ocelle-color-ink-soft`, uppercase,
  spaced by `--ocelle-tracking-caps`, in `--ocelle-font-sans` with tabular figures. In forced colours it draws no
  border.
- **Tokens.** `ocelle-workflow-lane` reads the tokens `--ocelle-color-sheet`, `--ocelle-radius-row`,
  `--ocelle-space-3`, `--ocelle-font-size-sm`, `--ocelle-font-size-xs`, `--ocelle-font-weight-strong`,
  `--ocelle-color-ink`, `--ocelle-color-ink-soft`, `--ocelle-color-ink-muted`, `--ocelle-tracking-caps`,
  `--ocelle-font-sans`, `--ocelle-figures` and `--ocelle-border-width`; the board gives it `--ocelle-lane-min-width`.
- **Title.** A long title wraps between words, and a word wider than the lane breaks inside it; the lane does not
  widen for it, and the count stays visible.
- `ocelle-workflow-lane` has no event, CSS part or CSS custom property.

## Host ARIA

A host `aria-label` names the element as `label` does. For `ocelle-icon` and `ocelle-brand-mark`, when present it
decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`. For `ocelle-scroller`,
`ocelle-workflow-board` and `ocelle-workflow-lane` a blank host `aria-label` counts as absent, so `label` still names
the element: Chromium names a host from a present `aria-label` and does not fall back from a blank one, so these
elements put their role and name on a node in their shadow root, named by the host's non-blank `aria-label`, trimmed,
or else by `label`. `ocelle-list-detail` takes no name: a host `aria-label` is not used. When both are set, the host
`aria-label` is the name; removing it falls back to `label`. Chromium uses a host `aria-label` as written, surrounding spaces included, so pass it trimmed;
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
- `mask-image`, and `mask-size`, `mask-position`, `mask-origin`, `mask-clip`, `mask-repeat` and `mask-composite`,
  unprefixed: Chromium 120, WebKit 15.4 (the scroller's fades).

An element that uses a feature newer than the floor raises the floor in this section, the one list of the floor
features, and records the feature in its own feature's research.

Only Chromium is measured. WebKit (Kitty Desktop on macOS and Linux) is not: its accessibility tree, forced colours and
mirroring are an open limitation.

## Element conventions

Every element of this library is written the same way, so a later element follows these rules without a design
question.

**Module and registration.** Each element lives in its own module, `src/<tag>.ts`, which ends with one
`define("<tag>", <Class>)` call: importing the module defines that element and no other, and importing the package root
defines every element. `define` (`src/define.ts`, internal) defines a tag only while it is free: a second definition of
the same tag does nothing and throws nothing. The module exports the class and declares it in
`HTMLElementTagNameMap`; `src/index.ts` re-exports it.

**Properties.** Elements declare their reactive properties with `static override properties = { … }` and `declare`
fields, not decorators. Every element class carries the JSDoc tag `@tagname <tag>`, and every public property a
description and `@default undefined`: the manifest takes the tag name and the defaults from them. An element that
observes a standard attribute such as `aria-label` adds it to `observedAttributes` without declaring a property, so
the manifest does not list it.

**Styles.** An element's styles are its shared `static styles`, one or more `css` tagged templates built only from
`--ocelle-*` tokens and the values the `style-lint` gate allows, which every instance adopts, plus at most one
per-instance constructed stylesheet that holds only px figures the element measured from layout. The per-instance sheet
never holds a value from an attribute, a property, a token's text or slotted text, and it is written through
`CSSStyleRule.style`, never through an element's `style`: the overflow-region module's mask size and
`ocelle-list-detail`'s intrinsic sizes are its two uses. No template has a
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

**Stories.** Every element has a story per variant and per state in `storybook/stories/<element>.stories.ts`, in light
and dark, and its stories pass the `csp` and `prefix` gates' Storybook checks.

**Files and tests.** Files: `src/<tag>.ts` per element, internal modules beside them in `src/` (not entry points),
`src/index.ts` (the package root) and `src/browser.ts` (the browser build's entry). Tests: the browser scenarios are
written once in `test/scenarios/` against a driver and run twice, in process on the element source by `test/*.test.ts`
(the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages by
`test/browser/*.test.ts` (the `elements-browser` project). Node tests of the generator, the configuration and this
README are in `test/node/`; tests that run the build or `pnpm pack` are in `test/build/`.

**Overflow region.** The overflow-region module (`src/overflow-region.ts`, internal) gives an element a scroll box that
is a tab stop and a named group, or region, only while it overflows: `ocelle-scroller` uses it, and so does any later
element with a scroll region. Its interface:

- Inputs: the host element (`new OverflowRegion(host, { box, role, step })`), `box`, a function that returns the
  scroll box in the host's shadow root, `role`, `"group"` by default or `"region"`, `step`, 40 px by default, and the
  label through `setLabel(label)`; the host lists `aria-label` in `observedAttributes` and re-renders on its change.
- Outputs, read by the host's render: `overflowing`, `offStart`, `offEnd`, `fadeStart`, `fadeEnd`, `fadeAttribute`
  (`"start"`, `"end"`, `"both"` or undefined) and `name`; the module requests an update when one changes.
- Effects, on the scroll box and the module's own shadow nodes only, never on the host: the box's `tabindex`, `role`
  and `aria-label`, the arrow keys on the box, the focus clearance of slotted controls and the focus handover when
  overflow ends.
- Lifecycle: it adds its listeners and its `ResizeObserver` when the host connects, follows the box after each update,
  and stops when the host disconnects; it emits no event.
- Structure. The host renders `.region-frame` holding `.region-box` (with `data-fade` bound through `ifDefined`), whose
  `.region-track` holds the content, then `.region-ring` and two `.region-edge` elements (`start`, `end`), all but the
  box `aria-hidden`, and adds `overflowRegionStyles` to its `static styles`. The host may put its own content model
  inside `.region-track`, and add rules for the track and its slotted children in its own styles.
- An element that uses the module does not set `tabindex`, `role` or `aria-label` on the box, handle the arrow keys on
  it, add a second fade or edge cue, scroll it smoothly, bind `data-fade` without `ifDefined`, or set the mask's size or
  a ring on `.region-frame` itself.

The module is proven on a test-only host, `ocelle-test-overflow-host` (`test/fixtures/overflow-host.ts`), which ships
in no package.

## Licence

Apache-2.0, see `LICENSE`. Every icon is the project's own drawing, under Apache-2.0; no third-party icon set is used,
so `THIRD_PARTY_NOTICES` lists none. The mark is the project's own drawing of the Ocelle rosette, redrawn from the
geometry of Ocelle's app icon, under Apache-2.0. The browser build bundles Lit (BSD-3-Clause), listed in
`THIRD_PARTY_NOTICES`.

"Ocelle" and the rosette mark are trademarks of their owner. The Apache-2.0 licence grants no right to use them
(section 6 of the licence); they may be used only to refer to Ocelle. The package carries the same note in `NOTICE`,
beside `LICENSE` and `THIRD_PARTY_NOTICES`.
