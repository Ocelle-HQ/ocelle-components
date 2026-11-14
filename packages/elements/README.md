# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has three elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, and `ocelle-button`, the first
control, which follows the control conventions below.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-button.js` | `dist/ocelle-button.js` | `ocelle-button` only; for hosts with a bundler |
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

## `ocelle-button`

```html
<ocelle-button>Save</ocelle-button>
<ocelle-button variant="primary"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>
<ocelle-button variant="quiet" size="compact" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon></ocelle-button>
<ocelle-button flush size="compact">Projects</ocelle-button>
<ocelle-button variant="quiet" ground="inset">Retry</ocelle-button>
<ocelle-button variant="quiet" ground="chrome">Menu</ocelle-button>
```

`ocelle-button` is a native button in the Ocelle look. It follows the control conventions below: one inner
`<button type="button">`, the part `control`, in its shadow root; a keyboard user and a screen-reader user meet a normal
button.

- `variant` (attribute and property, reflected): `primary` (filled), `secondary` (the default; bordered on a surface)
  or `quiet` (bordered, no fill); any other value renders `secondary`.
- `size` (attribute and property, reflected): `default` (the default; at least `--ocelle-target-min`, 44 px, in both
  dimensions) or `compact` (the compact text scale, `--ocelle-font-size-sm` and `--ocelle-line-height-compact`, and at
  least 24 px in both dimensions); any other value renders `default`.
- `flush` (boolean attribute and property, reflected): no inline padding, no border and no fill, the label in
  `--ocelle-color-ink`, and the content at the box's inline start, so its label (or icon) lines up with the text around
  it; the minimum block and inline size of its `size` stay.
- `ground` (attribute and property, reflected): the ground the button sits on, since an element cannot see its
  ancestor's colour. `accent-low`, `inset`, `hover-bg` or `state` (any of the state grounds) gives a bordered variant an
  `--ocelle-color-accent-strong` border; absent or any other value means the main grounds `color-canvas`,
  `color-sheet`, `color-pane`, `color-panel`, `color-inspector` and `color-rail`, with an
  `--ocelle-color-control-border` border. `ground="chrome"` is for the chrome grounds (`color-chrome`,
  `color-chrome-hover`): the label is `--ocelle-color-chrome-ink`, a bordered variant has an
  `--ocelle-color-chrome-muted` border and no fill, so `secondary` looks like `quiet` there; hover fills with
  `--ocelle-color-chrome-hover`, pressed with `--ocelle-color-chrome-active`, and both turn the border
  `--ocelle-color-chrome-ink`; the primary looks as on every ground.
- `label` (attribute and property, not reflected): the accessible name, trimmed; empty or whitespace-only counts as
  none.
- `disabled` (boolean attribute and property, reflected): the disabled state of the control conventions.
- The default slot is the label; the `icon` slot holds one icon before it (the slot convention). With no label in
  the default slot (no non-whitespace text in what it holds), the icon takes no gap and is centred in the button; a
  `flush` button still starts it at its inline start. Name such an icon-only button with `label`. The button follows
  text written into or removed from its own content; a label forwarded through another component's shadow-root
  `<slot>` is read when that slot's assignment changes, not when the forwarded text changes.

On a container whose surface changes (a list or table row that takes `color-hover-bg` on hover, or `color-accent-low`
when selected), set `ground` for the changed surface statically (`hover-bg` or `accent-low`):
`--ocelle-color-accent-strong` meets 3:1 on every main ground, so the border holds in both states.

**Activation.** Each activation that delivers a `click` (a pointer click, Enter or Space, the element's `click()`) also
dispatches `ocelle-button-activate` from the element: a `CustomEvent` with `bubbles: true`, `composed: true`,
`cancelable: true` and `detail` `{}`, dispatched before the `click` reaches any bubble-phase listener on the element or
its ancestors. Its target is the element, which identifies the button. Calling `preventDefault()` on it cancels the
`click`'s default action; a button has none, so the `click` is still delivered, with `defaultPrevented` `true`. A
disabled button dispatches neither event. The `click` reaches the host as an ordinary `click` event whose target is the
element.

**Looks.** Hover and pressed change the surface and the border: a bordered variant's border becomes
`--ocelle-color-hover-border`; the primary fills with `--ocelle-color-accent-hover` on hover and `--ocelle-color-accent`
when pressed; `secondary` and `quiet` fill with `--ocelle-color-hover-bg` on hover and `--ocelle-color-active-bg` when
pressed; a flush button changes its surface only. The primary always has an `--ocelle-color-accent-strong` border,
since the ochre fill alone is no boundary on the light grounds. A disabled button has `--ocelle-color-disabled-ink`
text and border, on `--ocelle-color-disabled-bg` where its variant has a fill.

A flush button's hover fill is `--ocelle-color-hover-bg`, so its hover shows no change where the ground has that
colour: on `color-hover-bg` in both themes, on `color-inset` in light, on `color-neutral-bg` in dark, and with `ground="chrome"` on
`color-chrome-hover` in both themes; hover carries no information there, and focus and pressed still show.

Keyboard focus shows the token focus ring on the inner control (`--ocelle-color-focus`, `--ocelle-focus-width`,
`--ocelle-focus-offset`); a pointer click does not. The focus ring is drawn outside the button: a container that clips
(`overflow` other than `visible`) and holds a flush button at its edge keeps at least `--ocelle-focus-offset` +
`--ocelle-focus-width` of unclipped space around it, for example `padding-inline` of that size with a matching negative
margin. In forced colours the label and border are `ButtonText`, hover and pressed borders and the focus ring
`Highlight`, a flush button's hover and pressed a dashed `Highlight` outline, and a disabled button `GrayText`.

A long label wraps between words inside the button, which grows in block size; it is never truncated. A single word
wider than the button breaks inside the word.

**Forms.** `ocelle-button` does not take part in forms: its inner control is always `type="button"`, so activating it
inside a `<form>` neither submits nor resets the form, and it has no `type`, `name`, `value` or `form` attribute. A host
that submits from it calls `form.requestSubmit()` in its click handler:

```js
button.addEventListener("click", () => form.requestSubmit());
```

`ocelle-button` reads the tokens `--ocelle-target-min`, `--ocelle-space-2`, `--ocelle-space-4`, `--ocelle-space-6`,
`--ocelle-border-width`, `--ocelle-radius-2`, `--ocelle-font-size-md`, `--ocelle-font-size-sm`,
`--ocelle-line-height-normal`, `--ocelle-line-height-compact`, `--ocelle-icon-size`, the focus tokens
`--ocelle-color-focus`, `--ocelle-focus-width` and `--ocelle-focus-offset`, and the colour tokens named above
(`--ocelle-color-sheet`, `--ocelle-color-ink`, `--ocelle-color-control-border`, `--ocelle-color-accent`,
`--ocelle-color-on-accent`, `--ocelle-color-accent-strong`, `--ocelle-color-accent-hover`,
`--ocelle-color-hover-bg`, `--ocelle-color-hover-border`, `--ocelle-color-active-bg`, `--ocelle-color-chrome-ink`,
`--ocelle-color-chrome-muted`, `--ocelle-color-chrome-hover`, `--ocelle-color-chrome-active`,
`--ocelle-color-disabled-bg`, `--ocelle-color-disabled-ink`). It has no CSS custom property of its own.

## Control conventions

Every control of this library (`ocelle-button`, and the action row, navigation items, copy control and form controls
after it) follows these rules.

1. **One inner control.** Each control renders exactly one native `<button type="button">` in an open shadow root
   attached with `delegatesFocus`; the host has no role and no tabindex. `element.focus()` focuses the inner control,
   and `element.click()` clicks it, so a click started by `click()` gets the same guarantees as any other click. A
   click dispatched on the host with `dispatchEvent` is outside the guarantees: it does not pass through the inner
   control, so the element stops it. The host is a grid container (`inline-grid` for `ocelle-button`) and the inner
   control its single stretched item, so the inner control fills the host when a flex row or a grid stretches it; a
   stretched button grows to the row's height (set `align-self` on the element to avoid it). A host may restyle the
   element's `display` and size: the element also listens for `click` and `auxclick` on the host from its constructor
   and stops any that did not pass through the inner control, in every state, so host area outside the inner control
   never activates it. Capture-phase listeners, and listeners added to the element before it is upgraded, are outside
   that guarantee: they run before the element's own listener.
2. **Disabled.** `disabled` means the control cannot be used here at all: the inner control is out of the tab order,
   reported disabled and not activated. Not activated means: no `ocelle-*` event and no `click` reaching a
   bubble-phase listener on the element or its ancestors (up to `document` and `window`); capture-phase listeners are
   outside it.
3. **Name order.** The inner control's name is the element's `label` (trimmed; empty or whitespace-only counts as
   none), and otherwise the element's content; slotted icons never contribute. When a control's content is visible,
   its `label` contains the visible text, ideally at its start, so a user who speaks a control's visible name reaches
   it (label in name). A control with no text, no `label` and no icon has no accessible name: a host mistake that axe
   reports; the element adds no fallback text.
4. **Primary action.** A primary action uses `size="default"` (44 × 44 px minimum); `variant="primary"` is a look, not
   what makes an action primary.

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
  falls back to `<style>` elements, which the strict CSP blocks).

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
