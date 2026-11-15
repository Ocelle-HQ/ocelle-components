# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has four elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, `ocelle-dialog`, a modal dialog,
and `ocelle-drawer`, a modal side drawer.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-dialog.js` | `dist/ocelle-dialog.js` | `ocelle-dialog` and the `ocelle-icon` it renders; for hosts with a bundler |
| `@ocelle/elements/ocelle-drawer.js` | `dist/ocelle-drawer.js` | `ocelle-drawer` and the `ocelle-icon` it renders; for hosts with a bundler |
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

## `ocelle-dialog`

```html
<button id="open-project">Open project</button>
<ocelle-dialog id="dialog" label="Open project" close-label="Close">
  <p>Choose a folder.</p>
  <div slot="footer"><button>Cancel</button><button>Open</button></div>
</ocelle-dialog>
```

`ocelle-dialog` shows its content modally over the page in a native `<dialog>`: the page behind is inert to pointer,
keyboard and the accessibility tree until it closes. It is centred in the viewport, on the sheet ground with the
raised shadow, over the overlay backdrop.

- `open` (attribute and property, reflected): whether the dialog is shown; setting it shows or closes the dialog, and
  the dialog sets it to false whenever it closes.
- `label` (attribute and property): the visible heading (level 2) and the dialog's accessible name. A label is
  required: without a `label` or a host `aria-label` the dialog has no accessible name, and it invents none.
- `close-label` (attribute; property `closeLabel`): the name of the close control, "Close" by default; set it in the
  host's language. The close control is a native button holding the `close` icon, at least `--ocelle-target-min` in
  both axes, with the focus ring.
- Slots: the default slot is the body; `footer` holds the actions, at the end of the panel, and is not rendered while
  empty.
- Parts: `panel` (the `<dialog>`), `heading`, `body`, `footer` and `close-button`.
- `--ocelle-dialog-inline-size`: the dialog's preferred inline size, `--ocelle-measure-reading` by default; the dialog
  is never wider than `--ocelle-dialog-max-inline` nor taller than `--ocelle-dialog-max-block`.
- Events: `ocelle-dialog-close-request` (cancelable; `detail.reason` is `"escape"` or `"close-button"`) when the user
  asks to close it, and `ocelle-dialog-close` (`detail.reason` is the request's reason, or `"host"` when the host set
  `open` to false or the platform closed it) once it has left the top layer and focus has returned; both bubble and
  are composed, and opening dispatches nothing. Cancelling `ocelle-dialog-close-request` keeps the dialog open, with
  focus inside, on every repetition. A click on the backdrop does nothing.

```js
opener.addEventListener("click", () => { dialog.open = true; });
dialog.addEventListener("ocelle-dialog-close-request", (e) => { if (hasUnsavedInput()) e.preventDefault(); });
dialog.addEventListener("ocelle-dialog-close", (e) => { /* e.detail.reason */ });
```

`ocelle-dialog` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-ink`, `--ocelle-color-overlay`,
`--ocelle-elevation-raised`, `--ocelle-radius-2`, `--ocelle-border-width`, `--ocelle-dialog-max-inline`,
`--ocelle-dialog-max-block`, `--ocelle-measure-reading`, `--ocelle-font-sans`, `--ocelle-font-size-md`,
`--ocelle-font-size-lg`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-line-height-tight`,
`--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-6`, `--ocelle-target-min`,
`--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-color-focus`, `--ocelle-motion-base` and
`--ocelle-easing-standard`, and its close icon `--ocelle-icon-size`.

**Focus.** On open, focus moves to the first slotted element marked `autofocus` in the body, else to the body's first
focusable element, else to the close control. While the dialog is open, Tab and Shift+Tab move only among its
focusable elements (the close control, the body's content and the footer's) and wrap at the ends; elements that are
not rendered are skipped and a radio group is one stop. Between the cycle's ends Tab moves as the engine does, so
content with a closed shadow root, an iframe or media controls keeps its inner focusable parts reachable by Tab and
Shift+Tab in both directions: Shift+Tab from the close control onto such content at the dialog's end enters it from
its end, with or without `delegatesFocus`. Leaving a slotted iframe past the cycle's end with Tab can cost one extra
press. Slotted content with a positive `tabindex` is visited in the engine's order, and the cycle wraps where that
order ends. An overflowing scroller in slotted content with nothing focusable inside (a wide prose table) is a Tab
stop where the engine focuses scrollers (Chromium 130 and later); elsewhere it is skipped.

On close, focus returns to the element that had it when the dialog opened, inside shadow roots too, as long as focus
is still inside the dialog or on the body; focus another dialog has taken is kept. Where focus lands when the opener
is gone: the opener while it is connected, not `disabled` and not inert; otherwise the initial focus target of the
overlay beneath, if one is open; otherwise the document body. To move focus elsewhere after a close, move it in the
`ocelle-dialog-close` listener, which runs after focus returned: the page stays inert until the exit ends, so a move
to page content between `open = false` and `ocelle-dialog-close` has no effect.

**Escape.** Escape asks the topmost dialog to close. A slotted widget that handles Escape calls `preventDefault()`,
not `stopPropagation()`: if it stops Escape's propagation, the dialog does not see the key, and the platform can close
a vetoed dialog on a repeated Escape, with reason `"host"`; the first vetoed sequence in a page may hold the veto on a
second press as well. Escape with focus inside a slotted iframe does nothing to
the dialog. An Escape that cancels an IME composition or clears a non-empty search field requests nothing.

While a slotted popover (`popover="auto"` or `"hint"`, a menu), a native `<dialog>` shown modally from slotted
content, or a non-modal `<dialog>` opened after the dialog (by `show()` or the `open` attribute) whose `closedby` is
`closerequest` or `any` is open, Escape closes it alone, as the platform does, and the dialog requests nothing; Tab
inside a nested native modal is left to the platform. A slotted non-modal `<dialog>` that was already open when the
dialog opened, whatever its `closedby`, or one opened after it with `closedby` absent, `auto` or `none`, is ordinary
content: Escape requests the dialog's close on every press and leaves it open, so close it yourself if needed. Such a
dialog reopened by removing and setting its `open` attribute stays ordinary content (the change fires no event the
dialog can see); reopen it with `close()` and then `show()` or the attribute to have Escape close it alone. An open
`<dialog>` moved into an already open dialog is outside what was measured: if the platform then closes the dialog on
Escape, the close comes with reason `"host"`.

**Closing.** During the exit, Escape, the close control and the backdrop request nothing; only `open = true` stops a
close. A slotted `<form method="dialog">` does nothing to the dialog: close it with `open = false` from the form's
submit handler. Removing an open dialog from the document (a move, a morph, a portal) closes it with no event and sets
`open` to false; set `open` again after re-inserting it.

**Layout.** The body is at least three times `--ocelle-target-min` tall (132 px by default) at every size, so a
one-line confirmation has space below its text; while the body overflows it is a Tab stop, so it scrolls by keyboard.
The heading and footer stay visible while the body scrolls; when the viewport is too short for them and the body's
minimum, the panel scrolls as a whole. The body has a definite inline size, so prose fills it.

**Motion and forced colours.** The dialog fades in and out over `--ocelle-motion-base` with
`--ocelle-easing-standard`, and not at all under `prefers-reduced-motion: reduce`, whatever an ancestor sets on those
tokens. In forced colours the panel has a `CanvasText` border on a `Canvas` ground, the backdrop is `Canvas`, and the
close control's focus ring is a `Highlight` outline.

## `ocelle-drawer`

```html
<ocelle-drawer id="filters" label="Filters" side="end">
  <form><!-- the filters --></form>
  <div slot="footer"><button>Reset</button><button>Apply</button></div>
</ocelle-drawer>
```

`ocelle-drawer` shows its content modally in a full-height panel against the inline start or end edge of the
viewport, in a native `<dialog>`: the page behind is inert to pointer, keyboard and the accessibility tree until it
closes. It has the focus, Escape, close control and event model of `ocelle-dialog`, with the `ocelle-drawer-` events,
and a click on the backdrop asks to close it. Everything the `ocelle-dialog` section states about focus, Escape,
closing and forced colours holds for the drawer as well.

- `open`, `label` and `close-label`, the slots and the parts are those of `ocelle-dialog`.
- `side` (attribute and property, reflected): `start` (the default) or `end`, the inline edge of the viewport in the
  drawer's direction, so `start` is the left edge under `dir="ltr"` and the right edge under `dir="rtl"`.
- `ground` (attribute and property, reflected): `sheet` (the default) or `chrome`, the chrome ground
  `--ocelle-color-chrome` with `--ocelle-color-chrome-ink` in both themes. Any other value of `side` or `ground` gives
  the default.
- `heading-hidden` (attribute; property `headingHidden`, reflected): the heading is not painted and takes no space,
  but stays in the accessibility tree as the drawer's level-2 heading, and the drawer's accessible name is unchanged;
  the close control stays visible, focusable and in its place at the panel's block start.
- Events: `ocelle-drawer-close-request` (cancelable; `detail.reason` is `"escape"`, `"close-button"` or `"backdrop"`)
  when the user asks to close it, and `ocelle-drawer-close` (`detail.reason` is the request's reason, or `"host"` when
  the host set `open` to false or the platform closed it) once it has left the top layer and focus has returned; both
  bubble and are composed, and opening dispatches nothing. Cancelling `ocelle-drawer-close-request` keeps the drawer
  open, with focus inside, on every repetition.

```js
opener.addEventListener("click", () => { drawer.open = true; });
drawer.addEventListener("ocelle-drawer-close-request", (e) => { if (hasUnsavedInput()) e.preventDefault(); });
drawer.addEventListener("ocelle-drawer-close", (e) => { /* e.detail.reason */ });
```

**Backdrop.** A primary-button click on the backdrop asks to close the drawer with reason `"backdrop"`; a press that
starts in the panel and ends on the backdrop, or starts on the backdrop and ends in the panel, a click inside the panel
and a secondary-button click do nothing. A click on the backdrop of an `ocelle-dialog` opened over the drawer closes
neither.

**Layout.** The drawer is as wide as `--ocelle-drawer-inline` (the sidebar width), never wider than
`--ocelle-dialog-max-inline`, and as tall as the viewport; it has no `--ocelle-dialog-inline-size`. The two corners on
the panel's inner edge, the edge facing the page, are rounded with `--ocelle-radius-2`; the two against the viewport's
edge are square. The body fills the panel between the header and the footer, so the footer sits at the panel's end;
it keeps the dialog's minimum of three times `--ocelle-target-min`, and when the viewport is too short the panel
scrolls as a whole.

**Motion.** The drawer slides in from its own edge and back out over `--ocelle-motion-base` with
`--ocelle-easing-standard`, mirrored under `dir="rtl"`, and not at all under `prefers-reduced-motion: reduce`, whatever
an ancestor sets on those tokens.

`ocelle-drawer` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-ink`, `--ocelle-color-overlay`,
`--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-elevation-raised`, `--ocelle-radius-2`,
`--ocelle-border-width`, `--ocelle-drawer-inline`, `--ocelle-dialog-max-inline`, `--ocelle-font-sans`,
`--ocelle-font-size-md`, `--ocelle-font-size-lg`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`,
`--ocelle-line-height-tight`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-6`,
`--ocelle-target-min`, `--ocelle-size-visually-hidden`, `--ocelle-focus-width`, `--ocelle-focus-offset`,
`--ocelle-color-focus`, `--ocelle-motion-base` and `--ocelle-easing-standard`, and its close icon
`--ocelle-icon-size`.

#12's personal drawer: the chrome ground, a heading kept for the accessibility tree only, and the personal rail as its
body.

```html
<ocelle-drawer label="Personal" ground="chrome" heading-hidden side="start">
  <ocelle-personal-rail><!-- the personal rail --></ocelle-personal-rail>
</ocelle-drawer>
```

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

With a host `aria-label`, an open `ocelle-dialog` exposes one named node, its modal dialog, named by the host
`aria-label`; while it is closed, Chromium exposes the host itself as a named generic node. With a host `aria-label`,
an open `ocelle-drawer` exposes one named node, its modal dialog, named by the host `aria-label`; while it is closed,
Chromium exposes the host itself as a named generic node.

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
