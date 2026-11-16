# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has `ocelle-icon`, with a set
of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, `ocelle-listbox` with its `ocelle-option` children,
`ocelle-tabs` with its `ocelle-tab` and `ocelle-tab-panel` children, and `ocelle-segmented-choice` with its
`ocelle-segment` children.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-listbox.js` | `dist/ocelle-listbox.js` | `ocelle-listbox` and `ocelle-option`; for hosts with a bundler |
| `@ocelle/elements/ocelle-option.js` | `dist/ocelle-option.js` | `ocelle-option` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-tabs.js` | `dist/ocelle-tabs.js` | `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel`; for hosts with a bundler |
| `@ocelle/elements/ocelle-tab.js` | `dist/ocelle-tab.js` | `ocelle-tab` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-tab-panel.js` | `dist/ocelle-tab-panel.js` | `ocelle-tab-panel` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-segmented-choice.js` | `dist/ocelle-segmented-choice.js` | `ocelle-segmented-choice` and `ocelle-segment`; for hosts with a bundler |
| `@ocelle/elements/ocelle-segment.js` | `dist/ocelle-segment.js` | `ocelle-segment` only; for hosts with a bundler |
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

## `ocelle-listbox`

`ocelle-listbox` is a single-select listbox of `ocelle-option` children: the host writes the options as its children,
in the page's own markup, and reads the selected value from the listbox. The options stay in the page's tree beside
each other, so the listbox needs no id reference and the host writes no ARIA attribute of its own.

```html
<ocelle-listbox label="Folders">
  <ocelle-option value="alpha"><ocelle-icon slot="icon" name="folder"></ocelle-icon>alpha</ocelle-option>
  <ocelle-option value="beta">beta</ocelle-option>
</ocelle-listbox>
```

`value` (attribute and property, not reflected): the selected option's value, `""` when none. Setting it to a value an
enabled option has selects the first such option; setting it to `""` or to a value no enabled option has clears the
selection. A host set never emits an event, and setting the current value changes nothing. A non-empty `value` that
no enabled option has is remembered until an option with that value appears or is enabled, which is then selected,
with no event; the next user selection or host set forgets it.

`label` (attribute and property, not reflected): the listbox's accessible name, trimmed; a host `aria-label` decides
over it. Without either the listbox is unnamed: a host must name it.

`ocelle-listbox-change` with `detail` `{ value }`: the user selected another option with Enter, Space or a click;
`value` already reads the new value when it is dispatched. `ocelle-listbox-activate` with `detail` `{ value }`: the
user confirmed an option, with Enter on the selected option or a double-click on an enabled option (whose first click
selects it, so its change event comes first); not cancelable. A host confirms the choice by listening to it, for
example to open a folder. Both events bubble and are composed.

Keys, on an option: ArrowDown and ArrowUp move focus to the next and previous enabled option without wrapping, Home and
End to the first and last; selection does not follow focus. Enter and Space select the focused option. The listbox
handles no other key: Escape, Tab, ArrowLeft, ArrowRight and letters (there is no typeahead) reach the page unhandled.
The listbox is one tab stop: the selected option when it is enabled, else the option that last had focus, else the
first enabled option. Disabled options are skipped by the keys and the tab stop but stay focusable, so a focused option
that becomes disabled keeps focus.

`ocelle-option`: `value` (attribute and property, reflected) and `disabled` (boolean, reflected). An option with no
`value`, or a blank one, has its index among the listbox's options as its value, as a string; the default is not
written to the attribute. An option's `icon` slot takes a leading icon by the slot convention; the icon adds nothing to
the option's name. An `ocelle-option` is only meaningful inside an `ocelle-listbox`: outside one it has no role and no
tab stop.

Options added, removed or reordered after render are followed; when the focused option is removed, focus moves to the
next enabled option after it, else the nearest one before it; when the selected option is removed, `value` becomes
`""` with no event. A moved option keeps its selection and its focus. The listbox writes `aria-selected`,
`aria-disabled` and `tabindex` on its options; a host's own values of these on an option are overwritten. Keep option
values unique: a host set selects the first option with the value. A listbox has no `disabled` of its own; disable
every option to disable it. A listbox whose every option is disabled, or with no option, has no tab stop.

The scroll container is the part `list`: a host that limits the listbox's height sets `max-block-size` on
`ocelle-listbox`, and the focused option is scrolled into view with its focus ring inside the list. Each option is at
least `--ocelle-target-min` high and its label wraps; a hovered enabled option is filled `--ocelle-color-hover-bg`.
The selected option shows a bar of `--ocelle-bar-width` in `--ocelle-color-accent-strong` on its inline-start edge, and
`Highlight` in forced colours; the listbox is for the main grounds. A keyboard-focused option shows the token focus
ring on all four sides, above its neighbours.

`ocelle-listbox` and `ocelle-option` read the tokens `--ocelle-color-ink`, `--ocelle-color-hover-bg`,
`--ocelle-color-accent-strong`, `--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`,
`--ocelle-focus-offset`, `--ocelle-bar-width`, `--ocelle-target-min`, `--ocelle-space-2`, `--ocelle-space-3` and
`--ocelle-icon-size`.

## `ocelle-tabs`

`ocelle-tabs` is a tablist of `ocelle-tab` children with their `ocelle-tab-panel` panels: the host writes the tabs and
the panels as its children, in the page's own markup, and the tabs pair with the panels by order (the first tab with the
first panel, and so on); tabs or panels without a partner are not rendered. The tabs write the association themselves:
an `id` on each tab and panel that has none (a child's own `id` is kept and used), `aria-controls` on every paired tab
and `aria-labelledby` on the shown panel. A host writes no `id`, `aria-*` or `slot` on the children.

```html
<ocelle-tabs label="Mission views">
  <ocelle-tab value="spec">Spec</ocelle-tab>
  <ocelle-tab value="plan"><ocelle-icon slot="icon" name="file"></ocelle-icon>Plan</ocelle-tab>
  <ocelle-tab-panel>…the spec…</ocelle-tab-panel>
  <ocelle-tab-panel>…the plan…</ocelle-tab-panel>
</ocelle-tabs>
```

`value` (attribute and property, not reflected): the selected tab's value. Exactly one tab is selected whenever a tab is
enabled: on first render the tab whose value `value` names, else the first enabled tab. Setting `value` to a value an
enabled tab has selects the first such tab; setting it to `""` or to a value no enabled tab has keeps the selection. A
host set never emits an event, and setting the current value changes nothing. A non-empty `value` that no enabled tab
has is remembered until a tab with that value appears or is enabled, which is then selected, with no event; the next
user selection or host set forgets it.

`label` (attribute and property, not reflected): the tablist's accessible name, trimmed. Name the tabs with `label`: a
host `aria-label` on `ocelle-tabs` does not name the tablist (the element does not forward it, and it would name the
host as a second node around the tablist).

`ocelle-tabs-change` with `detail` `{ value }`: the user selected another tab with an arrow key, Home, End, Enter, Space
or a click; `value` already reads the new value when it is dispatched. It bubbles and is composed.

Keys, on a tab: ArrowRight and ArrowLeft move focus and selection to the next and previous enabled tab in visual order
(swapped under right-to-left), wrapping at the ends; Home and End to the first and last enabled tab. Enter and Space
select a focused tab that is not selected. The tabs handle no other key: ArrowUp, ArrowDown, Escape and letters reach
the page unhandled, and keys pressed inside a panel are the panel content's. Only the selected tab is in the tab order.
Tab from it moves into the selected panel: to the panel's first focusable element, or to the panel itself, which then
shows the focus ring, when the panel holds nothing focusable (focusables inside shadow roots count, and the panel's
content is followed after render).

When the selected tab is removed or disabled, the next enabled tab after it is selected, else the nearest one before it,
with no event; focus moves with the selection when the tab had focus. With every tab disabled, or none, no tab is
selected, no panel is shown and `value` reads `""`.

`ocelle-tab`: `value` (attribute and property, reflected) and `disabled` (boolean, reflected). A tab with no `value`, or
a blank one, has its index among the tabs as its value, as a string; the default is not written to the attribute. A
tab's `icon` slot takes a leading icon by the slot convention; the icon adds nothing to the tab's name or its panel's.
An `ocelle-tab` or `ocelle-tab-panel` is only meaningful inside an `ocelle-tabs`: outside one it has no role and no tab
stop.

The tabs write `aria-selected`, `aria-disabled` and `tabindex` on their tabs and `tabindex` on the shown panel; a host's
own values of these are overwritten. Keep tab values unique: a host set selects the first tab with the value. The tabs
have no `disabled` of their own; disable every tab to disable them.

The tab row is the part `tablist`, and the shown panel sits in the part `panels`, beside the tablist; when the tabs are
wider than the row they wrap onto further rows, and the row never scrolls sideways. The selected tab shows a bar of
`--ocelle-bar-width` in `--ocelle-color-accent-strong` on its block-end edge, and `Highlight` in forced colours; the
tabs are for the main grounds. Each tab is at least `--ocelle-target-min` high and its label wraps; a hovered enabled
tab is filled `--ocelle-color-hover-bg`. A keyboard-focused tab shows the token focus ring on all four sides, above its
neighbours.

`ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel` read the tokens `--ocelle-color-ink`, `--ocelle-color-hover-bg`,
`--ocelle-color-accent-strong`, `--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`,
`--ocelle-focus-offset`, `--ocelle-bar-width`, `--ocelle-target-min`, `--ocelle-space-2`, `--ocelle-space-3` and
`--ocelle-icon-size`.

## `ocelle-segmented-choice`

`ocelle-segmented-choice` is a toolbar of `ocelle-segment` toggle buttons, exactly one of them pressed: the host writes
the segments as its children, in the page's own markup, and the group is one tab stop with arrow keys between the
segments. It is for a few mutually exclusive options, such as a filter or a view switch.

```html
<ocelle-segmented-choice label="Lane filter" value="all" joined>
  <ocelle-segment value="all">All</ocelle-segment>
  <ocelle-segment value="mine"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Mine</ocelle-segment>
  <ocelle-segment value="blocked">Blocked</ocelle-segment>
  <ocelle-segment value="done">Done</ocelle-segment>
</ocelle-segmented-choice>
```

`value` (attribute and property, not reflected): the pressed segment's value. Exactly one segment is pressed whenever a
segment is enabled: on first render the segment whose value `value` names, else the first enabled segment. Setting
`value` to a value an enabled segment has presses the first such segment; setting it to `""` or to a value no enabled
segment has keeps the press. A host set never emits an event, and setting the current value changes nothing. A
non-empty `value` that no enabled segment has is remembered until a segment with that value appears or is enabled,
which is then pressed, with no event; the next user press or host set forgets it.

`label` (attribute and property, not reflected): the toolbar's accessible name, trimmed; a host `aria-label` names it
too and, when present, decides alone (see Host ARIA).

`joined` (boolean, reflected): the joined variant. The segments touch, one shared line of `--ocelle-border-width` lies
between neighbours and between rows, and only each row's first segment has rounded start corners and each row's last
segment rounded end corners. The group recomputes the rounding itself when it wraps or unwraps: no host script,
observer or `style` attribute is needed. It observes its own size and its segments' sizes while joined, and regroups
when its segments change.

`ocelle-segmented-choice-change` with `detail` `{ value }`: the user pressed another segment with Enter, Space or a
click; `value` already reads the new value when it is dispatched. It bubbles and is composed.

Keys, on a segment: ArrowRight and ArrowDown move focus to the next enabled segment, ArrowLeft and ArrowUp to the
previous one (ArrowLeft and ArrowRight swapped under right-to-left), wrapping at the ends; Home and End to the first and
last enabled segment. The arrows move focus only. Enter and Space press the focused segment. The group handles no
other key: Escape and letters reach the page unhandled, and Tab leaves the group. Only the pressed segment is in the
tab order. A pressed segment cannot be un-pressed by the user.

When the pressed segment is removed or disabled, the next enabled segment after it is pressed, else the nearest one
before it, with no event; focus moves with the press when the segment had focus. With every segment disabled, or none,
no segment is pressed and `value` reads `""`.

`ocelle-segment`: `value` (attribute and property, reflected) and `disabled` (boolean, reflected). A segment with no
`value`, or a blank one, has its index among the segments as its value, as a string; the default is not written to the
attribute. A segment's `icon` slot takes a leading icon by the slot convention; the icon adds nothing to the segment's
name. An `ocelle-segment` is only meaningful inside an `ocelle-segmented-choice`: outside one it has no role and no tab
stop.

The segmented choice writes `aria-pressed`, `aria-disabled` and `tabindex` on its segments; a host's own values of
these are overwritten. Keep segment values unique: a host set presses the first segment with the value. The segmented
choice has no `disabled` of its own; disable every segment to disable it.

In the default variant the segments stand `--ocelle-space-2` apart, each with a border of `--ocelle-border-width` in
`--ocelle-color-control-border` and the radius `--ocelle-radius-2`; the pressed segment is filled
`--ocelle-color-accent-low` with a border of `--ocelle-bar-width` in `--ocelle-color-accent-strong`. In the joined
variant the lines around the pressed segment, and around a hovered one, are `--ocelle-color-accent-strong` at the same
width, and the pressed segment is filled `--ocelle-color-accent-low` with a bar of `--ocelle-bar-width` in
`--ocelle-color-accent-strong` along its block-end edge inside its box; in forced colours the bar and the default
pressed border are `Highlight` and every line is `ButtonBorder`; the segmented choice is for the main grounds. Each
segment's box is at least `--ocelle-target-min` high and its label wraps; a hovered enabled segment is filled
`--ocelle-color-hover-bg` with `--ocelle-color-accent-strong` lines. A keyboard-focused segment shows the token focus
ring on all four sides, above its neighbours.

`ocelle-segmented-choice` and `ocelle-segment` read the tokens `--ocelle-color-ink`, `--ocelle-color-hover-bg`,
`--ocelle-color-accent-low`, `--ocelle-color-accent-strong`, `--ocelle-color-control-border`,
`--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`,
`--ocelle-border-width`, `--ocelle-bar-width`, `--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-space-2`,
`--ocelle-space-3` and `--ocelle-icon-size`.

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

The exception is `ocelle-tabs`, whose tablist is a part inside its shadow root rather than the host: it is named by
`label` only, and a host `aria-label` on it does not name the tablist (see `ocelle-tabs`).

A host `aria-hidden="true"` hides the element, labelled or not. A host `hidden` attribute removes the element: no box
and no node, labelled or not. A host `role` or `aria-hidden="false"` is not supported: name the element with `label` or
`aria-label` instead.

## Two copies on a page

Two copies of the package on one page, two versions or the browser build beside a bundle of the module build, cannot
both define an element: the first definition wins and the second import throws nothing. The elements on the page are
then the first copy's.

## Engines

Engine floor: Chromium 125+ and WebKit 17.4+, with no `window.ShadyCSS` polyfill on the page. Each figure is the
newest feature the elements use:

- Custom states (`:state()` and `ElementInternals.states`): Chromium 125, WebKit 17.4 (the joined segmented choice's
  rows);
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
`define("<tag>", <Class>)` call: importing the module defines that element and the elements it renders or owns as children, and importing the package root
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
