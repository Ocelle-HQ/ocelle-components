# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has eighteen elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, `ocelle-scroller`, a
horizontal strip that is a tab stop only while it overflows, `ocelle-workflow-board` with its
`ocelle-workflow-lane`s, a row of lanes that scrolls inside itself when it is narrower than they are,
`ocelle-list-detail`, a list beside its detail that collapses to one column by the space it has, `ocelle-dialog`, a
modal dialog, `ocelle-drawer`, a modal side drawer, `ocelle-tooltip`, a tooltip that shows a short text beside its
trigger, the layout elements `ocelle-section-header`, `ocelle-card`, `ocelle-page-header`, `ocelle-context-sidebar`
and `ocelle-personal-rail`, `ocelle-facts` with its item `ocelle-fact`, a label and value sheet, `ocelle-empty-state`,
an empty or loading panel, and `ocelle-progress`, a progress bar.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-scroller.js` | `dist/ocelle-scroller.js` | `ocelle-scroller` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-workflow-board.js` | `dist/ocelle-workflow-board.js` | `ocelle-workflow-board` only, not the lane; for hosts with a bundler |
| `@ocelle/elements/ocelle-workflow-lane.js` | `dist/ocelle-workflow-lane.js` | `ocelle-workflow-lane` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-list-detail.js` | `dist/ocelle-list-detail.js` | `ocelle-list-detail` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-dialog.js` | `dist/ocelle-dialog.js` | `ocelle-dialog` and the `ocelle-icon` it renders; for hosts with a bundler |
| `@ocelle/elements/ocelle-drawer.js` | `dist/ocelle-drawer.js` | `ocelle-drawer` and the `ocelle-icon` it renders; for hosts with a bundler |
| `@ocelle/elements/ocelle-tooltip.js` | `dist/ocelle-tooltip.js` | `ocelle-tooltip` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-card.js` | `dist/ocelle-card.js` | `ocelle-card` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-section-header.js` | `dist/ocelle-section-header.js` | `ocelle-section-header` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-page-header.js` | `dist/ocelle-page-header.js` | `ocelle-page-header` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-context-sidebar.js` | `dist/ocelle-context-sidebar.js` | `ocelle-context-sidebar` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-personal-rail.js` | `dist/ocelle-personal-rail.js` | `ocelle-personal-rail` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-facts.js` | `dist/ocelle-facts.js` | `ocelle-facts` and its item `ocelle-fact`; for hosts with a bundler |
| `@ocelle/elements/ocelle-fact.js` | `dist/ocelle-fact.js` | `ocelle-fact` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-empty-state.js` | `dist/ocelle-empty-state.js` | `ocelle-empty-state` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-progress.js` | `dist/ocelle-progress.js` | `ocelle-progress` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-data-table.js` | `dist/ocelle-data-table.js` | `ocelle-data-table` only; for hosts with a bundler |
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

## `ocelle-tooltip`

```html
<ocelle-tooltip text="Projects"><button aria-label="Projects"><ocelle-icon name="folder"></ocelle-icon></button></ocelle-tooltip>
<ocelle-tooltip text="Saves a draft you can reopen later" describes><button>Save</button></ocelle-tooltip>
```

`ocelle-tooltip` shows a short text in a bubble beside its trigger, the first element in its default slot, when the
pointer rests on the trigger or the trigger receives keyboard focus.

- `text` (attribute and property): the bubble's plain text; an empty text shows no bubble.
- `placement` (attribute and property, reflected): `top` (the default), `bottom`, `start` or `end`, the side of the
  trigger the bubble is shown on, `start` and `end` in the tooltip's direction.
- `disabled` (attribute and property, reflected): no bubble is shown.
- `describes` (attribute and property, reflected): the text becomes the trigger's accessible description.
- Slots: the default slot holds the trigger; the `description` slot is the tooltip's own and is never rendered. Part:
  `bubble`. Events: none.

The host is `display: contents`, so wrapping a trigger leaves the trigger's box unchanged: a pill that ellipsises in a
narrow container still does, and an item keeps its place in a list.

**Show and hide.** The bubble shows after the pointer has rested on the trigger for `--ocelle-tooltip-delay`, and at
once when the trigger, or a control inside it, receives keyboard focus (it matches `:focus-visible`); focus from a
pointer click or a tap neither shows nor keeps it. It stays while the pointer is on the trigger or on the bubble, which
the pointer can reach across the gap between them, or the trigger has keyboard focus, with no timeout, and hides when
none of these holds. Escape hides it and goes no further: focus and pointer do not move, an open dialog or drawer
around it stays open and the next Escape asks to close that, and the bubble stays hidden until the pointer re-enters or
keyboard focus arrives again. At most one bubble is shown on the page; it hides when its trigger is removed or disabled
and when a dialog or drawer opens. The delay applies under `prefers-reduced-motion: reduce` too (a delay is not
motion), and the bubble never animates.

**Placement.** The bubble is shown in the top layer through the Popover API, above any open dialog or drawer, whole,
whatever the overflow, transform or stacking context around the trigger. It is placed on its `placement` side,
`--ocelle-space-2` away, and shown on the opposite side when it would overflow the viewport less `--ocelle-gutter`;
when it fits on neither side it stays on its `placement` side; across that axis it is kept inside the viewport less
`--ocelle-gutter`; it follows the trigger when anything scrolls or the viewport is resized. It is never wider than
`--ocelle-tooltip-max-inline`: longer text wraps, an unbreakable string included. Its position is written to a
stylesheet the tooltip adopts, never to a `style` attribute.

`ocelle-tooltip` reads the tokens `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-radius-2`,
`--ocelle-border-width`, `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-line-height-normal`,
`--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-gutter`, `--ocelle-tooltip-delay` and
`--ocelle-tooltip-max-inline`. In forced colours the bubble has the `Canvas` ground, `CanvasText` text and a
`CanvasText` border.

**Accessibility.** The trigger carries its own accessible name: the tooltip never names it. The bubble only repeats or
supplements what is available otherwise, so it never carries essential information; touch input shows no bubble,
except on a text-field trigger, which shows it on any focus. Without `describes`, the bubble is hidden from assistive
technology and the trigger gets no description from the tooltip: use it when the text repeats the trigger's name. Set
`describes` when the text adds to the trigger's name. With `describes`, the tooltip adds one hidden `span` with
`slot="description"` and `role="tooltip"` to its own children, its text set as text, and that span's id to the
trigger's `aria-describedby`, keeping the ids the host put there; it puts both back when a re-render of the host's
template removes them, and moves the id when the trigger is replaced. No id reference crosses a shadow root.

**Limits.** Triggers are buttons and links. A text field matches `:focus-visible` on any focus, so around one the
bubble shows on focus however it arrives, by a click or a tap too. `describes` is supported only when the trigger is
itself the focusable element (a native control, or a custom element focusable as its host): a custom element whose
inner control takes focus cannot be described from outside its shadow root. On touch there is no hover, and a tap on a
button or link does not give keyboard focus, so a tap shows no bubble. In an engine without the Popover API (below the
engine floor) the tooltip shows nothing and throws nothing.

#12's icon-only nav item: the link carries its name, and the bubble repeats it on hover and keyboard focus. #7's pill
tag: the tooltip shows the full text only while the tag is ellipsised. Both render the tooltip inside their own shadow
root, around their own inner control:

```js
// inside ocelle-nav-item's shadow root (icon-only mode)
html`<ocelle-tooltip text="Projects" placement="end"><a href="/projects" aria-label="Projects">…</a></ocelle-tooltip>`;
// inside ocelle-pill-tag's shadow root
html`<ocelle-tooltip text="${this.text}" ?disabled=${!this.truncated}><button class="pill">${this.text}</button></ocelle-tooltip>`;
```

## `ocelle-section-header`

```html
<ocelle-section-header>
  <span slot="eyebrow">Mission</span>
  <h2 slot="heading">Runs</h2>
  <p slot="description">Every run of the mission, newest first.</p>
  <button slot="actions" type="button">New run</button>
</ocelle-section-header>

<ocelle-section-header variant="eyebrow"><h3 slot="heading">Recent</h3></ocelle-section-header>
<ul>…</ul>
```

`ocelle-section-header` styles a heading the page slots, with an optional eyebrow above it, an optional description
under it and optional actions at its inline end. It creates no heading of its own: slot one heading element (`h1` to
`h6`) in `heading`, and its level is the page's. The page's own rules for that heading win over the header's styles.
Place the header outside a `[data-ocelle-prose]` region: the prose rules of `@ocelle/styles` for `h1` to `h6` are page
rules, so they win over the header's heading style.

- `heading` (slot): the page's heading element, drawn in `--ocelle-font-display` at `--ocelle-font-weight-strong`,
  `--ocelle-line-height-tight` and `--ocelle-color-ink`, at `--ocelle-font-size-lg`, or at `--ocelle-font-size-subhead`
  at the compact size, with no margin.
- `eyebrow` (slot): a short label above the heading, on a line of its own, drawn with the eyebrow style:
  `--ocelle-font-sans` at `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow`
  and `--ocelle-line-height-normal`, in `--ocelle-color-eyebrow`, upper case, with `--ocelle-figures`.
- `description` (slot): supporting text under the heading, at `--ocelle-font-size-sm` in `--ocelle-color-ink-muted`.
- `actions` (slot): controls at the inline end of the heading's first line, their block start at the heading's. When
  the heading's longest word and the actions do not fit side by side, the actions move under the heading,
  `--ocelle-space-2` below it, at its inline start, and a word longer than the line wraps inside itself.

The gaps are `--ocelle-space-1` between eyebrow and heading and between heading and description, `--ocelle-space-4`
between the heading and the actions, and `--ocelle-space-2` between two actions; the header has no padding of its own.

- `size` (attribute and property, reflected): `regular` or `compact`. Not set, or any other value, draws the heading
  regular, at `--ocelle-font-size-lg`, or compact in a compact `ocelle-card`'s `header` slot. `compact` draws it at
  `--ocelle-font-size-subhead`; the gaps stay the same.
- `variant` (attribute and property, reflected): `default` or `eyebrow`. Not set, or any other value, draws as
  `default`. `eyebrow` draws the heading with the eyebrow style, for a heading used as a label above a list, and renders
  neither the `eyebrow` nor the `description` slot; `actions` stay. `size` and a compact card change nothing in the
  eyebrow variant.

The eyebrow variant draws the heading upper case while its DOM text stays as written; Chromium names the heading by its
drawn, upper-case text.

`ocelle-section-header` reads the tokens `--ocelle-font-display`, `--ocelle-font-sans`, `--ocelle-font-size-lg`,
`--ocelle-font-size-subhead`, `--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-tight`,
`--ocelle-line-height-normal`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-space-1`,
`--ocelle-space-2`, `--ocelle-space-4`, `--ocelle-figures`, `--ocelle-font-size-eyebrow`,
`--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`.

The section header trims the block margins of its slotted eyebrow and description, so a `p` description sits
`--ocelle-space-1` under the heading; a page rule that sets those margins wins.

An empty slot of the section header takes no space: no box, gap or margin. A slot is empty when no element is assigned
to it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so
remove an element from the slot rather than hide it. The layout follows the slots' content as it changes.

The section header replaces the part-level padding and gap overrides Kitty Desktop sets on its section headers: an empty
part takes no padding or gap, and the gaps between filled parts are the header's own.

`ocelle-section-header` has no event, CSS part or CSS custom property, and adds no tab stop.

## `ocelle-card`

```html
<ocelle-card density="compact">
  <ocelle-section-header slot="header"><h2 slot="heading">Runs</h2></ocelle-section-header>
  <p>Twelve runs this week.</p>
</ocelle-card>

<ocelle-card inset><p>A card nested inside another surface.</p></ocelle-card>
```

`ocelle-card` draws a header above a body, with a `--ocelle-border-width` border in `--ocelle-color-rule`,
`--ocelle-radius-row` corners and the `--ocelle-color-sheet` ground.

- `header` (slot): the card's header, usually an `ocelle-section-header`.
- The default slot: the card's body.
- `density` (attribute and property, reflected): `regular` or `compact`. Not set, or any other value, draws regular:
  padding `--ocelle-space-7` and a `--ocelle-space-2` gap between header and body. `compact` has padding
  `--ocelle-space-5` and a `--ocelle-space-4` gap.
- `inset` (boolean attribute and property, reflected): present with any value, the empty string included, draws the card
  on `--ocelle-color-inset`, for a card nested inside another surface, and changes nothing else. Absent, the card is on
  `--ocelle-color-sheet`. In forced colours both grounds are the system background, so an inset card looks like a
  regular one.

A compact card draws an `ocelle-section-header` in its `header` slot at the compact size, unless the header has a valid
`size` of its own (`regular` or `compact`), which wins; a header with an empty or invalid `size` takes the card's
density. Only a header assigned to the card's own `header` slot is compacted: one in its body, inside another element in
the `header` slot, or in a card nested in it keeps its own size.

`@ocelle/elements/ocelle-card.js` does not define `ocelle-section-header`: a page that slots one imports both. The
compact size works whichever is defined first, and when the two come from two copies of the package; a header of a copy
that does not answer Lit's `requestUpdate()` learns of a density change only at its own next update.

The card has no role: it adds no region, article or group, and a page that needs a region or an article adds it, for
example by wrapping the card in a `section` with an accessible name.

`ocelle-card` reads the tokens `--ocelle-border-width`, `--ocelle-color-rule`, `--ocelle-radius-row`,
`--ocelle-color-sheet`, `--ocelle-color-inset`, `--ocelle-space-2`, `--ocelle-space-4`, `--ocelle-space-5` and
`--ocelle-space-7`.

The card trims the block-start margin of the first visible body element and the block-end margin of the last, skipping
a `hidden` element at either edge, so a `p` body starts at the header gap and ends at the padding edge. The margins
between body elements are the page's, and a page rule that sets the trimmed margins wins.

An empty slot of the card takes no space: a card with no header has no header gap. A slot is empty when no element is
assigned to it and every text assigned to it is whitespace; an assigned element counts as content even when it is
`hidden`, so remove an element from the slot rather than hide it.

In forced colours the card's border is drawn in a system colour, and a compact card keeps its padding, gap and compact
header. `ocelle-card` has no event, CSS part or CSS custom property, and adds no tab stop.

## `ocelle-page-header`

```html
<ocelle-page-header size="compact">
  <span slot="eyebrow">Workspace</span>
  <h1 slot="heading">Missions</h1>
  <p slot="description">Every mission of the workspace, newest first.</p>
  <button slot="actions" type="button">New mission</button>
</ocelle-page-header>
```

`ocelle-page-header` starts a screen: a band holding an optional eyebrow naming the area, the screen's title, an
optional subtitle and the screen's actions, ruled off below. The page header creates no heading of its own: slot one
heading element (`h1` to `h6`) in `heading`, usually the screen's `h1`, and its level is the page's. The page's own
rules for that heading win over the header's styles. Place the page header outside a `[data-ocelle-prose]` region: the
prose rules of `@ocelle/styles` for `h1` to `h6` are page rules, so they win over the header's heading style.

- `heading` (slot): the page's heading element, the screen's title, drawn in `--ocelle-font-display` at
  `--ocelle-font-weight-display`, `--ocelle-tracking-display`, `--ocelle-line-height-tight` and `--ocelle-color-ink`,
  at `--ocelle-font-size-2xl`, or at `--ocelle-font-size-xl` at the compact size, with no margin.
- `eyebrow` (slot): a short label above the heading naming the area, on a line of its own, drawn with the eyebrow style
  at both sizes: `--ocelle-font-sans` at `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`,
  `--ocelle-tracking-eyebrow` and `--ocelle-line-height-normal`, in `--ocelle-color-eyebrow`, upper case, with
  `--ocelle-figures`.
- `description` (slot): a subtitle under the heading, at `--ocelle-font-size-md` in `--ocelle-color-ink-soft`,
  `--ocelle-space-1` below the heading.
- `actions` (slot): the screen's controls at the inline end of the heading's first line, their block start at the
  heading's, `--ocelle-space-4` from it. When the heading's longest word and the actions do not fit side by side, the
  actions move under the description, or under the heading when there is none, `--ocelle-space-2` below it, at its
  inline start, and a word longer than the line wraps inside itself.

The band has block padding `--ocelle-space-4`, inline padding `--ocelle-space-6` and a `--ocelle-border-width` rule in
`--ocelle-color-rule` along its block end. The gaps are `--ocelle-space-1` between eyebrow and heading and
`--ocelle-space-2` between two actions. The page header has no ground of its own: the band shows the surface it sits on,
the page canvas or a pane.

- `size` (attribute and property, reflected): `regular` or `compact`. Not set, or any other value, draws regular, the
  heading at `--ocelle-font-size-2xl`. `compact` draws the heading at `--ocelle-font-size-xl` (24 px), for dense
  screens; everything else stays the same.

`ocelle-page-header` reads the tokens `--ocelle-font-display`, `--ocelle-font-sans`, `--ocelle-font-size-2xl`,
`--ocelle-font-size-xl`, `--ocelle-font-size-md`, `--ocelle-font-weight-display`, `--ocelle-tracking-display`,
`--ocelle-line-height-tight`, `--ocelle-line-height-normal`, `--ocelle-color-ink`, `--ocelle-color-ink-soft`,
`--ocelle-color-rule`, `--ocelle-border-width`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-4`,
`--ocelle-space-6`, `--ocelle-figures`, `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`,
`--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`.

The page header trims the block margins of its slotted eyebrow and description, so a `p` description sits
`--ocelle-space-1` under the heading; a page rule that sets those margins wins.

An empty slot of the page header takes no space: no box, gap or margin. A slot is empty when no element is assigned to
it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so
remove an element from the slot rather than hide it. The layout follows the slots' content as it changes.

The page header replaces the pinned page-header font rules Kitty Desktop sets on its page headers: the title, eyebrow
and subtitle fonts and the band are the header's own, at either size.

In forced colours the rule under the band is drawn in a system colour, and a compact header keeps its compact title.
`ocelle-page-header` has no event, CSS part or CSS custom property, adds no tab stop, and exposes no heading, banner or
other landmark of its own.

## `ocelle-context-sidebar`

```html
<ocelle-context-sidebar label="Team navigation">
  <p slot="head">Kitty team</p>
  <ul>
    <li><a href="/missions">Missions</a></li>
    <li><a href="/runs">Runs</a></li>
  </ul>
  <ocelle-section-header><h2 slot="heading">Projects</h2></ocelle-section-header>
  <p slot="footer">3 of 5 missions done</p>
</ocelle-context-sidebar>
```

`ocelle-context-sidebar` is the column beside a screen's content: a head, sections of navigation and a footer, ruled
off from each other.

- `head` (slot): the sidebar's head, the team or project it belongs to, padded `--ocelle-space-4` on every side.
- The default slot: the sections, one element each (a `ul` of links, a `div`, an `ocelle-section-header`), each drawn
  as a block padded `--ocelle-space-4` on every side across the sidebar's whole inline size.
- `footer` (slot): the sidebar's footer, a progress summary for example, padded `--ocelle-space-4` on every side and
  kept at the sidebar's block end.

A `--ocelle-border-width` divider in `--ocelle-color-rule` lies between the head and the first section, between each
two sections and between the last section and the footer, across the sidebar's whole inline size; with no sections,
one divider lies between the head and the footer. The sidebar's ground is `--ocelle-color-rail`.

- `label` (attribute and property, not reflected): the name of the sidebar's navigation landmark, trimmed. Not set,
  empty or whitespace-only, the landmark has no name; the sidebar is drawn the same either way.

Set a distinct `label` on every sidebar: assistive technology lists the navigation landmarks of a page, and unnamed
ones give its user nothing to tell them apart. A host `aria-label` decides the landmark's name alone when present: a
non-empty one is the name even when `label` is set, and a blank one leaves the landmark unnamed even with a `label`.
`label` names the landmark only when the host has no `aria-label`, so removing the host `aria-label` falls back to
`label`. The sidebar never writes, changes or removes the host's `aria-label`.

`ocelle-context-sidebar` reads the tokens `--ocelle-color-rail`, `--ocelle-color-rule`, `--ocelle-border-width` and
`--ocelle-space-4`.

The sidebar trims the block margins of each section, and the block-start margin of the first visible element and the
block-end margin of the last visible element of its head and of its footer, skipping a `hidden` element at either
edge, so a `p` or a `ul` sits `--ocelle-space-4` inside its part. The margins between the elements of the head or of
the footer are the page's, and a page rule that sets the trimmed margins wins.

An empty slot of the sidebar takes no space: no padding and no divider. A slot is empty when no element is assigned to
it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so
remove an element from the slot rather than hide it. The layout follows the slots' content as it changes.

Wrap each section in an element: text in the default slot is drawn between the sections, with the sections' inline
padding and no block padding, but it is not a section and gets no divider of its own. A `hidden` section draws nothing
of its own, no box, padding or divider, but it still counts as content: a sidebar whose sections are all hidden keeps
the dividers around its empty default slot, so remove sections from the slot rather than hide them all.

A `template` or `script` element in the default slot, such as a `<template>` that Alpine.js keeps in the page for
`x-if` or `x-for`, is not a section: it is not drawn and gets no padding or divider. Like a hidden section, it still
counts as content.

A page rule does not change a section's padding, inline margins, divider or display: the sidebar sets them
`!important`, as the slot convention does, so a page reset such as `ul { margin: 0; padding: 0 }` leaves them in
place. A section's block margins are the page's to set.

The sidebar fills its container's block size when its content is shorter, with the footer at the block end and the
free space above the footer, and grows with its content when it is taller, the footer following the last section;
scrolling is the container's. This holds in a block, flex-row or grid container alike, because the host is
`align-self: start`. A page rule on the host's `align-self` wins, so a page that sets it to `stretch` in a flex row or
grid of definite block size keeps the sidebar at the container's size. In a flex row or a flex column the container
sets the sidebar's inline size (an `inline-size`, a `flex` value, a grid track): there `align-self: start` leaves it
at its content's inline size. In a flex column, `align-self: stretch` on the host also gives it the container's inline
size.

The sidebar replaces the part-level padding and gap overrides and the token-painted dividers Kitty Desktop sets on its
context sidebars: the parts' padding and the dividers are the sidebar's own, and an empty part takes none.

In forced colours the sidebar's dividers are drawn in a system colour. `ocelle-context-sidebar` has no event, CSS part
or CSS custom property and adds no tab stop. The host itself is its one navigation landmark, with no other landmark
inside it.

## `ocelle-personal-rail`

```html
<ocelle-personal-rail label="Personal">
  <a href="/inbox">Inbox</a>
  <a href="/runs">Runs</a>
  <a href="/docs">Docs</a>
  <a slot="bottom" href="/account">Account</a>
</ocelle-personal-rail>
```

`ocelle-personal-rail` is the narrow dark column of personal navigation: icon links from its start, and a bottom
group, an account link for example, at its end. It is drawn on `--ocelle-color-chrome` with `--ocelle-color-chrome-ink`
text in both themes.

- The default slot: the primary items, from the rail's block start (vertical) or inline start (horizontal).
- `bottom` (slot): the bottom group, kept at the rail's block end (vertical) or at the inline end of its first row
  (horizontal).

The items are `--ocelle-space-1` apart and centred across the rail. A `--ocelle-border-width` divider in
`--ocelle-color-chrome-muted` lies between the two groups, `--ocelle-space-1` from each, only when both are filled.

- `orientation` (attribute and property, reflected): `vertical` or `horizontal`. Not set, or any other value, draws
  vertical: a column `--ocelle-shell-rail-width` (52 px) wide, padded `--ocelle-space-2` in the block direction and
  `--ocelle-space-1` inline, which leaves a 44 px content box, with the divider across it. `horizontal` draws a row
  padded `--ocelle-space-2` that fills its container's inline size: the primary items wrap onto further rows from its
  inline start, the bottom group sits at the inline end of the first row, at most half the content box wide, and the
  divider runs over the rail's whole block size.
- `label` (attribute and property, not reflected): the name of the rail's navigation landmark, trimmed. Not set, empty
  or whitespace-only, the landmark has no name; the rail is drawn the same either way.

Set a distinct `label` on every rail: assistive technology lists the navigation landmarks of a page, and unnamed ones
give its user nothing to tell them apart. A host `aria-label` decides the landmark's name alone when present: a
non-empty one is the name even when `label` is set, and a blank one leaves the landmark unnamed even with a `label`.
`label` names the landmark only when the host has no `aria-label`, so removing the host `aria-label` falls back to
`label`. The rail never writes, changes or removes the host's `aria-label`.

The rail changes orientation only when `orientation` changes: it has no viewport or container query of its own, and
changing it keeps focus, the document and tab order and the landmark. The page sets it, from wherever its tier comes
from; this one sets it from a viewport media query whose bound is exclusive, `matchMedia("(width < Npx)")` (never
`max-width: N`, which also matches at N), vertical while the viewport is at least 720 px wide and horizontal below:

```js
const rail = document.querySelector("ocelle-personal-rail");
const narrow = matchMedia("(width < 720px)");
const orient = () => {
  rail.orientation = narrow.matches ? "horizontal" : "vertical";
};
orient();
narrow.addEventListener("change", orient);
```

For #12: `orientation` and `label` are the whole interface a shell or a personal drawer uses to drive the rail. A
shell that wants the rail horizontal inside its drawer and vertical in its column sets `orientation` from its own
tier, with an exclusive bound in its own query; the rail does not care where the value comes from. It emits no event.
The container-tier convention (Element conventions) describes the tiers of an element that chooses its own.

The rail sizes no item: items are sized by themselves, at `--ocelle-size-rail-item` (40 px), the size #12's
`ocelle-nav-item` is expected to have. The rail sets only the gap, the items' centring and the chrome ink as its
colour, which an item takes when it inherits colour. A plain `<a>` does not: give `<a>` items `color: inherit` and a
target of at least 24 px, or use `ocelle-nav-item` elements once they are released; no release of this package ships
`ocelle-nav-item` yet.

`ocelle-personal-rail` reads the tokens `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`,
`--ocelle-color-chrome-muted`, `--ocelle-border-width`, `--ocelle-shell-rail-width`, `--ocelle-space-1` and
`--ocelle-space-2`.

An empty slot of the rail takes no space: no gap and no divider, so a rail without bottom items has no divider, and
one with only bottom items has them at its block end (vertical) or inline end (horizontal). A slot is empty when no
element is assigned to it and every text assigned to it is whitespace; an assigned element counts as content even
when it is `hidden`, so remove an element from the slot rather than hide it. The layout follows the slots' content as
it changes.

A vertical rail fills its container's block size when its content is shorter, with the free space between the divider
and the bottom group, and grows with its content when it is taller, the bottom group following the primary items;
scrolling is the container's. This holds in a block, flex-row or grid container alike, because the host is
`align-self: start`. A page rule on the host's `align-self` wins, so a page that sets it to `stretch` in a flex row or
grid of definite block size keeps the rail at the container's size.

The rail replaces the personal-rail `::part` overrides Kitty Desktop sets on its personal rail: the rail's width,
padding, gap, divider and orientation are its own, and the items are the page's.

In forced colours the rail's divider is drawn in a system colour, and a horizontal rail keeps its row.
`ocelle-personal-rail` has no event, CSS part or CSS custom property and adds no tab stop. The host itself is its one
navigation landmark, with no other landmark inside it.

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

## `ocelle-progress`

```html
<ocelle-progress value="7" max="12" label="Tasks done"></ocelle-progress>
<ocelle-progress label="Loading plan"></ocelle-progress>
```

`ocelle-progress` is a progress bar: with a `value` it is determinate, its fill growing from the inline start (the
right under `dir="rtl"`); without one it is indeterminate. The determinate bar is for work with a known amount, and
the indeterminate bar for loading a region, or running work, with no known end; for a state, such as a row that is
running, use `ocelle-status-indicator`. `ocelle-progress` emits no event and adds no tab stop.

**Naming.** Name every bar: set `label`, the accessible name, as text. A host `aria-label` also names it and overrides
`label`, but makes axe report a false `aria-prohibited-attr` in your own audit; prefer `label`. To name a bar after a
nearby heading, pass the heading's text as `label`; the element takes no ID reference. A bar with neither `label` nor
a host `aria-label` has no name: that is a consumer error, which the element does not correct. axe does not check the
bar's name, since it does not read the element's internals: check the name in your own tests. The label is text only:
there is no slot for a rich label.

**Host.** The host is the progressbar: a `role` on it replaces the progressbar and a `tabindex` makes it a tab stop, so
set neither. For a loading block that takes focus, put your own `<h2 tabindex="-1">` in an `ocelle-empty-state`'s
`heading` slot, with the bar in `visual`. The host is a block and fills its container's inline size. To place a bar
inside a line of text, set its `display` (for example `inline-block`) and an inline size from outside. The element has
no slot: text inside it (a "7/12" fallback) shows only before the element is defined, and after that it is neither
shown nor exposed; the bar keeps its own name and value.

**Values.** `max` defaults to 100; a `max` that is not a number above 0 counts as 100. A `value` below 0 is shown and
exposed as 0, and above `max` as `max`. An unset, empty or whitespace-only `value`, a `value` that is not a finite
number, and the property set to `null` or `undefined` make the bar indeterminate: no current value is exposed.
`value-text` gives the words for the current value (for example "7 of 12"): it is exposed while the bar is
determinate, kept as given when the value is clamped, and not used while the bar is indeterminate. Without it the
platform announces the value itself; the element formats no number. The library's tests do not verify the value
text's exposure to assistive technology: no read a test can make in Chromium reports it. They check the visible value
text, and the bar's name and value in the accessibility tree.

**Label.** `show-label` shows the label as text above the bar, or beside it with `size="compact"`, with the value text
when the bar is determinate; both use tabular figures and are hidden from assistive technology, which reads the name
and value from the bar itself. The value text sits at the inline end of the label row: at the default size the row is
above the bar, the label at its inline start; in compact the row holds the label, the bar and the value text, in that
order. A long label wraps between words, and the bar keeps at least `--ocelle-measure-cell`.

**Sizes.** The track is `--ocelle-space-2` high, and `--ocelle-space-1` with `size="compact"`; any other value acts as
unset.

**Motion.** The indeterminate bar's mark sweeps across the track three times, 4.2 s in all at the default tokens, and
then rests as the still mark, a partial fill in the middle of the track, with nothing running: the motion ends by
itself in less than 5 s (WCAG 2.2.2). The sweep lasts `--ocelle-motion-base` × 21 in all: overriding
`--ocelle-motion-base` above 238 ms takes it past 5 s. There is one sweep per loading episode: a bar inserted, replaced
in one task, re-shown or made indeterminate again while the episode lasts continues the episode's sweep, and after the
sweep has ended shows the still mark at once. The episode ends when no indeterminate bar is on the page at a frame; the
next indeterminate bar starts a new episode with its own sweep. Keep one bar, or swap it in one task, across one
continuous wait: a bar removed and inserted again a frame or more later starts a new sweep. Under
`prefers-reduced-motion: reduce` nothing runs on the bar and the still mark shows at once. The fill has no transition:
its inline size changes at once with each value.

**Colour.** The fill is `--ocelle-color-accent` with an `--ocelle-color-accent-strong` edge on every side, so the
filled part is never marked by ochre alone; the track is `--ocelle-color-inset` and clips the mark.
`ground="tinted"` draws the track's boundary in `--ocelle-color-accent-strong`: use it for a bar on `color-inset`,
`color-accent-low`, `color-hover-bg` or a state ground, and in a row that can be hovered or selected. Unset, the
boundary is `--ocelle-color-control-border`, for `color-canvas`, `color-sheet`, `color-pane`, `color-panel`,
`color-inspector` and `color-rail`. Any other value of `ground` acts as unset. In forced colours the track has a
system-colour outline and the fill is `Highlight`.

**Tokens.** `ocelle-progress` reads the tokens `--ocelle-color-accent`, `--ocelle-color-accent-strong`,
`--ocelle-color-inset`, `--ocelle-color-control-border`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`,
`--ocelle-font-size-sm`, `--ocelle-figures`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-radius-1`,
`--ocelle-border-width`, `--ocelle-measure-cell`, `--ocelle-motion-base` and `--ocelle-easing-standard`.

## `ocelle-data-table`

`ocelle-data-table` holds one native `<table>` as its first child and shows it unchanged in a scroll region: `<ocelle-data-table label="Work packages"><table>…</table></ocelle-data-table>`. The table keeps its own rows, cells, headers and caption; the element writes nothing on it and emits no event. Its other children are not shown.

The region's name is the host `aria-label` when it is not blank, else `label`, else the caption's text; give an overflowing table a caption or a `label`. Give an overflowing table a `label` that differs from its caption's text: a region named by its caption is announced with the table's own name. The `hidden` attribute, not CSS, hides part of a caption from the name. While the table fits, the region has no tab stop, role or name, and the table is exposed as it is; while it overflows, the region is a tab stop and a named `group` holding the same table, scrolled by ArrowLeft and ArrowRight, with fades at the edges that have content beyond them.

Sizing: a wrapper that is itself the flex or grid item, around the element, needs `min-inline-size: 0` too. In a shrink-to-fit host (a dialog, an inline-block, a start-aligned flex) the data table takes its table's width and overflows only when its own inline size is bounded.

The caption scrolls with the table until the overflow-region module's pinned-start option lands. The caption's longest word widens the table; in a bounded host a caption word wider than the box overflows it and the region scrolls. Otherwise the caption wraps inside the box's unmasked width. A caption that grows after load (its text edited, a style changed or a web font loaded late) widens the table as it would on a fresh load.

The look comes from `@ocelle/styles`: link its `base.css` on the page, or adopt it in a consumer's shadow root. Inside a `data-ocelle-prose` container a consumer rule on the table needs a specificity above (0,1,0), or (0,1,0) placed after `@ocelle/styles`. Before upgrade the table is styled by `@ocelle/styles` with no scroll region. Chromium names each column header by its drawn upper-case text, so the accessible names of column headers follow the upper case, as for the eyebrow heading of `ocelle-section-header`.

Base-style hook: the element writes `--data-table-box-size` (the box's measured inline size) and `--data-table-end-fade` (the end fade's depth while it shows) for `@ocelle/styles`' caption cap. Both are public surface of `@ocelle/elements` and `@ocelle/styles`, and a consumer does not set them.

`sticky-header` pins the `<thead>` while the body scrolls in a block size the page bounds on the host with its own `block-size` or `max-block-size`; with no bound nothing scrolls in the block axis. The caption scrolls away in the block axis. ArrowUp and ArrowDown scroll the region, and PageUp, PageDown, Home, End, Space and Shift+Space scroll it as the browser does. A focused link in the body is kept below the pinned header. The block end fades while rows are below, never under the header, with a line in forced colours. A bounded table prints its box only.

`striped` gives each `<tbody>`'s even rows the `--ocelle-color-inset` ground, hidden rows counted. A hovered body row takes the `--ocelle-color-hover-bg` ground: a look only, with no event, no tab stop and no cursor; always on where the device can hover, nothing on a touch screen. In the light theme a hovered striped row shows no change, because `hover-bg` equals `inset` there. For an end-aligned numeric column, put `@ocelle/styles`' `data-ocelle-align="end"` on the column's cells.

Printed, content past the box is clipped; a consumer who prints sets a print rule of its own. No change the data table makes to its region leaves it in a state a fresh load would not give, and nor does a change to its table or caption after load.

## Mapping from kitty-mission-ui

Each `.sk-facts`, `.sk-empty-state` and `.sk-progress` modifier and state that kitty-mission-ui uses, and each
modifier, state and structure role of the design library's `.sk-data-table` (which has no part), by role, with the
element and variant that replaces it, or the consumer's own remedy. No data-table row of the mapping reads "pending
inventory".

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
| `.sk-progress` | progress default | `ocelle-progress` with `value`, `max`, `label` and `show-label` |
| `.sk-progress` | progress narrow | `ocelle-progress`; the track fills the host's inline size |
| `.sk-progress` | progress compact | `ocelle-progress size="compact"` |
| `.sk-progress` | progress indeterminate | `ocelle-progress` with no `value` |
| `.sk-progress` | progress determinate | `ocelle-progress` with `value` and `max` |
| `.sk-progress` | progress meta | `value-text` with `show-label`, the consumer passing the formatted percentage (the element formats no number), at the inline end of the label row |
| `.sk-progress` | progress external text | `value-text` with `show-label`, or the consumer's own text beside the element |
| `.sk-progress` | progress label | `ocelle-progress` with `label` and `show-label`; the label is text only, with no slot |
| `.sk-progress` | progress labelled by heading | consumer's: the heading's text passed as `label`, with no ID reference |
| `.sk-progress` | progress aria-label | `label` without `show-label`, or a host `aria-label` |
| `.sk-progress` | progress fallback text | consumer's: the element draws the bar itself; text inside it shows only before upgrade and is neither shown nor exposed after it |
| `.sk-progress` | progress heading | consumer's: its own `<h2 tabindex="-1">` in an `ocelle-empty-state`'s `heading` slot with the bar in `visual`; no `role` or `tabindex` on the host |
| `.sk-progress` | progress inline | `ocelle-progress`, a block host given `display: inline-block` and an inline size by the consumer |
| `.sk-progress` | progress in empty-state | `ocelle-empty-state`'s `visual` slot |
| `.sk-progress` | progress in busy region | `ocelle-progress` placed directly; `aria-busy` stays on the consumer's region |
| `.sk-progress` | progress slotted | `ocelle-progress` in another element's slot; nothing is needed from the element |
| `.sk-progress` | progress grid layout | `ocelle-progress` with `show-label` at the default size: the label at the inline start and the value text at the inline end of the row above the bar, which spans the full width below; the consumer no longer places the parts |
| `.sk-progress` | progress centred | `ocelle-empty-state`'s `visual` slot, which centres the bar and spans it up to the reading measure |
| `.sk-data-table` | data table scroller | `ocelle-data-table`'s region: a named `group` tab stop only while the table overflows, with the overflow-region focus ring; give an overflowing table a `label` that differs from its caption |
| `.sk-data-table` | data table class | the consumer's own `<table>` inside `ocelle-data-table`, with no class |
| `.sk-data-table` | data table caption | the table's `<caption>`, styled by `@ocelle/styles` |
| `.sk-data-table` | data table header cells | the eyebrow column headers of `@ocelle/styles`; for sentence case, the consumer's own rule on the header cells, which wins over the (0,0,0) rules |
| `.sk-data-table` | data table body cells | the compact body cells of `@ocelle/styles` |
| `.sk-data-table` | data table numeric cell | `data-ocelle-align="end"` on the column's cells, `@ocelle/styles`' hook |
| `.sk-data-table` | data table sticky header | `ocelle-data-table sticky-header`, with the page's block bound on the host (`block-size` or `max-block-size`) |
| `.sk-data-table` | data table zebra rows | `ocelle-data-table striped` |
| `.sk-data-table` | data table row hover | built in: the hover ground of `@ocelle/styles` on a device that can hover |
| `.sk-data-table` | data table forced colours | built in: system colours for text and rules, and the row band for the stripe and the hover |
| `.sk-data-table` | data table overflowing | built in: the region's tab stop, role and name while the table overflows |
| `.sk-data-table` | data table tone | none: the data table carries no tone |

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
  spaced by `--ocelle-tracking-eyebrow`, in `--ocelle-font-sans` with tabular figures. In forced colours it draws no
  border.
- **Tokens.** `ocelle-workflow-lane` reads the tokens `--ocelle-color-sheet`, `--ocelle-radius-row`,
  `--ocelle-space-3`, `--ocelle-font-size-sm`, `--ocelle-font-size-xs`, `--ocelle-font-weight-strong`,
  `--ocelle-color-ink`, `--ocelle-color-ink-soft`, `--ocelle-color-ink-muted`, `--ocelle-tracking-eyebrow`,
  `--ocelle-font-sans`, `--ocelle-figures` and `--ocelle-border-width`; the board gives it `--ocelle-lane-min-width`.
- **Title.** A long title wraps between words, and a word wider than the lane breaks inside it; the lane does not
  widen for it, and the count stays visible.
- `ocelle-workflow-lane` has no event, CSS part or CSS custom property.

## `ocelle-list-detail`

`ocelle-list-detail` lays out a list beside the selected record's detail, with an optional inspector: three columns
when there is room for them, two with the inspector stacked under the detail, and one pane at a time below its
threshold or when the host sets `narrow`. It follows the container-tier convention (Element conventions).

- `collapse-below` (attribute, and property `collapseBelow`, not reflected): one column below this length; the default
  is `--ocelle-list-detail-collapse` (40rem) as computed on the element.
- `inspector-below` (attribute, and property `inspectorBelow`, not reflected): the inspector stacks under the detail
  below this length; the default is `--ocelle-list-detail-inspector-collapse` (60rem) as computed on the element.
- `narrow` (attribute and property, reflected): forces the one-column layout whatever the element's size.
- `detail-open` (attribute, and property `detailOpen`, reflected): in one column, shows the detail pane, with the
  inspector stacked under it, instead of the list; in two or three columns it has no effect.
- `remeasure()`: requests a measurement of the element's intrinsic sizes for the next animation frame, for a change
  the element cannot see (the container-tier convention lists them), and in that frame re-chooses the tier from a fresh
  measurement of the element's border box. On an element that is not in a document, never connected or removed, it
  does nothing: a never-connected element measures itself at its first render anyway, and after changing a removed
  element, call `remeasure()` once it is inserted again. On an element in a document that is not rendered, with no box
  (in a closed `<dialog>`, under a `display: none` ancestor or with `hidden`), a pass or a call of `remeasure()` writes
  nothing and leaves the figures and the tier as they were; once the element is rendered (the dialog opened, the
  ancestor or the host shown) it measures itself afresh, with no call of `remeasure()` needed.
- **Slots.** It has three slots: `list`, the list pane; the default slot, the detail pane; and `inspector`, the optional
  inspector pane. An empty `inspector` slot adds no track, no border and no space.
- **Tokens.** `ocelle-list-detail` reads the tokens `--ocelle-list-track-width`, `--ocelle-shell-inspector-width`,
  `--ocelle-list-detail-collapse`, `--ocelle-list-detail-inspector-collapse`, `--ocelle-color-rule`,
  `--ocelle-border-width`, `--ocelle-focus-width` and `--ocelle-color-focus`.
- **Widths.** The list pane is `--ocelle-list-track-width` wide, the inspector `--ocelle-shell-inspector-width`, its
  border included, and the detail takes the rest; a 1 px `--ocelle-color-rule` border, decorative only, runs between
  adjacent panes, in `CanvasText` in forced colours. Long content in a pane wraps or scrolls inside it (the base
  styles of `@ocelle/styles`); no pane widens for its content.
- **Focus.** When a layout or `detail-open` change hides the pane that holds focus, the element moves focus to the
  start of the pane that is shown: that pane takes focus by script only, never as a tab stop, and shows the focus ring
  inset, in `Highlight` in forced colours. Focus outside the hidden pane is not moved. The way back to the list is the
  host's own control; the element emits no event. The next Tab reaches the shown pane's first focusable element. At
  upgrade, focus is moved only when it is inside a pane that the first layout hides.
- **Tree.** The element adds no role, landmark or name of its own: the host names its own landmarks or headings in the
  panes. The panes' slotted content is in the tree in pane order, list, detail and inspector; a hidden pane adds no
  node.
- `ocelle-list-detail` has no event, CSS part or CSS custom property.
## Forwarded slots

A shell that forwards a slot of its own into an element of this package, such as
`<slot name="footer" slot="footer"></slot>` in its shadow root, assigns that `<slot>` element to the element's slot.
The element counts it as content even when nothing is assigned to the forwarded slot, so the part takes its wrapper,
gap, padding or divider with nothing in it. Forward a slot only when it has content, or remove the forwarding
`<slot>` when it has none.

## Host ARIA

A host `aria-label` names the element as `label` does. For `ocelle-icon` and `ocelle-brand-mark`, when present it
decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`. For `ocelle-scroller`,
`ocelle-workflow-board`, `ocelle-workflow-lane` and `ocelle-data-table` a blank host `aria-label` counts as absent, so `label` still names
the element: Chromium names a host from a present `aria-label` and does not fall back from a blank one, so these
elements put their role and name on a node in their shadow root, named by the host's non-blank `aria-label`, trimmed,
or else by `label`. `ocelle-list-detail` takes no name: a host `aria-label` is not used. When both are set, the host
`aria-label` is the name; removing it falls back to `label`. Chromium uses a host `aria-label` as written, surrounding spaces included, so pass it trimmed;
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

Engine floor: Chromium 120+ and WebKit 17+, with no `window.ShadyCSS` polyfill on the page. Each figure is the
newest feature the elements use:

- The Popover API: Chromium 114, WebKit 17 (the tooltip's bubble in the top layer; it raised the floor from WebKit 16.4);
- `:dir()`: Chromium 120, WebKit 16.4 (the inline-direction icons' mirroring);
- `@media not (forced-colors: active)` (Media Queries 4's `not (…)` without a media type): Chromium 104, WebKit 16.4
  (the brand mark's variants);
- The `lh` unit: Chromium 109 (the slot convention);
- The `scale` property: Chromium 104 (the mirroring);
- Constructable stylesheets (`adoptedStyleSheets`): Chromium 73, WebKit 16.4 (every element's styles; below it Lit
  falls back to `<style>` elements, which the strict CSP blocks);
- `mask-image`, and `mask-size`, `mask-position`, `mask-origin`, `mask-clip`, `mask-repeat` and `mask-composite`,
  unprefixed: Chromium 120, WebKit 15.4 (the scroller's fades).
- Manual slot assignment (`slotAssignment: "manual"`, `HTMLSlotElement.assign()`): Chromium 86, WebKit 16.4
  (`ocelle-facts`). The floor does not change.

An element that uses a feature newer than the floor raises the floor in this section, the one list of the floor
features, and records the feature in its own feature's research.

Only Chromium is measured. WebKit (Kitty Desktop on macOS and Linux) is not: its accessibility tree, forced colours and
mirroring are an open limitation.
WebKit is not measured for the layout elements either: the tab stop of `ocelle-scroller` and `ocelle-workflow-board`
while they overflow, their arrow keys, their focus handover when overflow ends and `ocelle-list-detail`'s focus moves
are untested there.

## Layout elements: screens, print and states

The layout elements are tested in four frames that stand for screens, each a block box of a stated inline size on a
page whose viewport is wider than the frame, so the element's own measurement is tested, not the viewport's; the
figures assume a 16 px root font size:

- Frame W, 876 px: the 1280 px window beside a context sidebar, 1280 px less the rail (52 px), the sidebar (320 px)
  and two gutters (32 px).
- Frame R, 1196 px: the 1280 px window with the rail only.
- Frame N, 636 px: the narrow tier, at a 720 px viewport (`--ocelle-shell-collapse-sidebar`, 45rem), where the
  sidebar has collapsed.
- Frame S, 288 px: the 320 px reflow width.

These elements are screen layouts. In print, a board shows its lanes as the browser lays them out, and content
off-screen in a scroller is not printed.

Loading, error and disabled states do not apply to `ocelle-scroller`, `ocelle-workflow-board`, `ocelle-workflow-lane`
and `ocelle-list-detail`: they are layout elements, with no such state and no story for one.

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

**Styles.** An element's styles are its shared `static styles`, one or more `css` tagged templates built only from
`--ocelle-*` tokens and the values the `style-lint` gate allows, which every instance adopts, plus at most one
per-instance constructed stylesheet of its own that holds only px figures the element measured from layout, and, in an
element that uses the overflow-region module, the module's per-instance sheet beside it. A per-instance sheet never
holds a value from an attribute, a property, a token's text or slotted text, and it is written through
`CSSStyleRule.style`, never through an element's `style`: the overflow-region module's mask size,
`ocelle-list-detail`'s intrinsic sizes and `ocelle-data-table`'s caption cap (its box size and end fade depth) are its
uses. No template has a
`style` attribute or a `<style>` element. Every element's styles hold `:host([hidden]) { display: none; }` beside its
`:host` display rule, which would otherwise beat the user-agent `[hidden]` rule. Variant rules that set colours or
grounds go inside `@media not (forced-colors: active)`, so a forced-colours rule never has to outrank a variant
selector. Variant rules that set layout only (size, padding, gap, direction, wrapping) stay outside it, so a compact or
horizontal variant keeps its layout in forced colours.

**Manifest.** `custom-elements.json` is generated from the element source by
`pnpm --filter @ocelle/elements run manifest` and committed; the `manifest` gate fails when it differs from a
regeneration or when a public member has no description. It declares, for every element, its tag name, its class,
every public property and attribute with type, default and description, and its events, slots, CSS parts and CSS custom
properties, each list stated even when empty. An `--ocelle-*` token of `@ocelle/tokens` that an element reads by
inheritance is not one of the element's CSS custom properties and is not in its manifest entry. This README names the
tokens each element reads, and overriding a token is the way to change what the element takes from it. An element's
own hook is a CSS custom property named `--ocelle-<element>-<property>`, which matches no token name.

**One native element.** A container whose content is one native element is styled by `@ocelle/styles` rules scoped to
it and assigns that element by manual slot assignment; other children are not shown. `ocelle-data-table` is the first.

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

**Overflow region.** The overflow-region module (`src/overflow-region.ts`, internal) gives an element a scroll box that
is a tab stop and a named group, or region, only while it overflows: `ocelle-scroller` uses it, and so does any later
element with a scroll region. `ocelle-data-table` uses the overflow-region module, as `ocelle-scroller`,
`ocelle-workflow-board` and `ocelle-workflow-lane` do. Its interface:

- Inputs: the host element (`new OverflowRegion(host, { box, role, step, blockAxis, blockStartBox })`), `box`, a
  function that returns the scroll box in the host's shadow root, `role`, `"group"` by default or `"region"`, `step`,
  40 px by default, the block-axis option `blockAxis`, a function that returns whether the box also scrolls in the
  block axis, and `blockStartBox`, a function that returns the box the host pins at the block start or `null`, and the
  label through `setLabel(label)`; the host lists `aria-label` in `observedAttributes` and re-renders on its change.
- `ocelle-data-table` with `sticky-header` is the only user that sets the block-axis option. While it is on and the box
  overflows in the block axis, the module sets `data-axis="both"` on the box, handles ArrowUp and ArrowDown, leaves
  PageUp, PageDown, Home, End, Space and Shift+Space to the browser, keeps a focused element clear of the pinned box,
  and fades the block end while content is below (`data-block-fade="end"`, drawn by `.region-edge.block-end` as a line
  in forced colours). The host renders that third edge after the two others. `ocelle-scroller`,
  `ocelle-workflow-board` and `ocelle-workflow-lane` do not set it, and nothing changes for them.
- Outputs, read by the host's render: `overflowing`, `offStart`, `offEnd`, `fadeStart`, `fadeEnd`, `fadeAttribute`
  (`"start"`, `"end"`, `"both"` or undefined) and `name`; the module requests an update when one changes.
- Effects, on the scroll box and the module's own shadow nodes only, never on the host: the box's `tabindex`, `role`
  and `aria-label`, the arrow keys on the box, the focus clearance of slotted controls and the focus handover when
  overflow ends.
- Lifecycle: when the host connects, it adds its `keydown`, `focusin` and `focusout` listeners on the host and its
  `ResizeObserver`; after each update it follows the box, and on a new box, or none, it first lets go of the old one
  (unobserved, its `scroll` and `slotchange` listeners and its frame's `focusout` listener taken off, its `tabindex`,
  `role` and `aria-label` removed), so the new box takes them over; when the host disconnects, it disconnects the
  observer and takes its three listeners off the host, and the box keeps its attributes as last set; it emits no event.
- Structure. The host renders `.region-frame` holding `.region-box` (with `data-fade` bound through `ifDefined`), whose
  `.region-track` holds the content, then `.region-ring` and two `.region-edge` elements (`start`, `end`), all but the
  box `aria-hidden`, and adds `overflowRegionStyles` to its `static styles`. The host may put its own content model
  inside `.region-track`, and add rules for the track and its slotted children in its own styles.
- An element that uses the module does not set `tabindex`, `role` or `aria-label` on the box, handle the arrow keys on
  it, add a second fade or edge cue, scroll it smoothly, bind `data-fade` without `ifDefined`, or set the mask's size or
  a ring on `.region-frame` itself.

The module is proven on a test-only host, `ocelle-test-overflow-host` (`test/fixtures/overflow-host.ts`), which ships
in no package.

**Container tiers.** The container-tier convention: a tier is chosen from the element's own border-box inline size,
measured by a `ResizeObserver`, never from the viewport. `ocelle-list-detail` follows it, and so does any later
element with tiers. An element with no tiers of its own, such as `ocelle-personal-rail`, measures nothing: the page
sets its layout attribute (the rail's `orientation`) from the page's own tier, with an exclusive bound as below, and
the element does not care where the value comes from. The tier an element renders is internal, never an attribute
of its host.

- A threshold is a `*-below` attribute. After trimming ASCII whitespace it accepts exactly
  `^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$`, units in any ASCII letter case: `rem` resolves at the root's computed
  font size and `em` at the host's, and every other value counts as absent.
- Without the attribute, the threshold is its token as computed on the element, parsed with the same grammar, so a
  host that sets the token on the element or an ancestor moves it; a token value that is not an accepted form gives
  the token's published value.
- Bounds are exclusive: the narrower tier applies only below the threshold, and at exactly the threshold the wider
  tier applies.
- A boolean attribute set by the host, such as `narrow`, forces the narrowest tier.
- No `container-type` is set on a host that may shrink to fit, such as a flex item, a dialog or a table cell: it would
  collapse to 0 px there.
- The element's intrinsic inline sizes do not depend on the tier it shows: its max-content size is that of its widest
  tier and its min-content size that of its narrowest, so a shrink-to-fit host cannot make the tier alternate. The
  element's own inline padding and borders are added to each and are no floor of either.
- The intrinsic sizes are measured in one pass, at most once per animation frame and never inside a
  `ResizeObserver` callback, after a slot change or a light-DOM node or text change in any pane, shown or hidden,
  after a call of `remeasure()`, and, synchronously, before a tier change the host sets through an attribute or a
  property. The figures go into the element's one per-instance sheet (Styles).
- Becoming rendered is a re-measure trigger too: an element first rendered or changed while it had no box, in a
  closed `<dialog>`, under a `display: none` ancestor or with `hidden`, measures its intrinsic sizes afresh in the next
  animation frame once it is rendered (the dialog opened, the ancestor or the host shown), never inside the
  `ResizeObserver` callback that sees it, and then has the size and the tier it has when rendered from the start; the
  host need not call `remeasure()`. A dialog is therefore a shrink-to-fit host whether it starts open or closed.
- While the element is not rendered, a pass or a call of `remeasure()` writes nothing: the figures, the measured size
  and the tier stay as they were, and no figure becomes `NaN` or the 0 px of the missing box.
- Changes with no light-DOM node or text change are not seen and wait for the next of these: an image or a font
  loading, content a slotted element renders in its own shadow root, and an attribute-only change such as a class
  swap; the host calls `remeasure()` after one.
- A change of the element's own inline padding or borders alone re-chooses the tier. Two cases are known limitations,
  and the host calls `remeasure()` after a change in either; it re-chooses the tier from a fresh measurement of the
  element's border box in the next animation frame:
  - a percentage inline padding that changes with the host's container while the element's content box keeps its
    size, such as a content-box host with a fixed or capped inline size and percentage gutters: the change may go
    unseen, unless, for example, the host's container is positioned and the host is not; otherwise the tier stays
    stale until `remeasure()` or the next change the element sees;
  - a host whose content box is narrower than its own inline padding and borders: a change of a px or em padding or of
    a border alone is seen there too, and only a percentage padding may go unseen, as above.
- One pass renders every pane in the measurement grid twice and restores it: about 10 ms (7 to 19 ms) with a 1000-row
  list. Attribute changes, such as a selection's `class` or `aria-selected`, run none; light-DOM swaps and text
  changes run at most one per frame.
- Content a consumer mutates inside its own `ResizeObserver` callback can still make the browser report
  "ResizeObserver loop completed with undelivered notifications." through layout alone, when the shown layout grows a
  shrink-to-fit host; the element does not cause it and cannot prevent it.
- Hosts set `narrow`, `detail-open` and the `*-below` thresholds from a task, not from a `ResizeObserver` callback.

## Licence

Apache-2.0, see `LICENSE`. Every icon is the project's own drawing, under Apache-2.0; no third-party icon set is used,
so `THIRD_PARTY_NOTICES` lists none. The mark is the project's own drawing of the Ocelle rosette, redrawn from the
geometry of Ocelle's app icon, under Apache-2.0. The browser build bundles Lit (BSD-3-Clause), listed in
`THIRD_PARTY_NOTICES`.

"Ocelle" and the rosette mark are trademarks of their owner. The Apache-2.0 licence grants no right to use them
(section 6 of the licence); they may be used only to refer to Ocelle. The package carries the same note in `NOTICE`,
beside `LICENSE` and `THIRD_PARTY_NOTICES`.
