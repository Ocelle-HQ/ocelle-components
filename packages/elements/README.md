# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has seven elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, and the layout elements
`ocelle-section-header`, `ocelle-card`, `ocelle-page-header`, `ocelle-context-sidebar` and `ocelle-personal-rail`.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-card.js` | `dist/ocelle-card.js` | `ocelle-card` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-section-header.js` | `dist/ocelle-section-header.js` | `ocelle-section-header` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-page-header.js` | `dist/ocelle-page-header.js` | `ocelle-page-header` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-context-sidebar.js` | `dist/ocelle-context-sidebar.js` | `ocelle-context-sidebar` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-personal-rail.js` | `dist/ocelle-personal-rail.js` | `ocelle-personal-rail` only; for hosts with a bundler |
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

The rail sizes no item: items are sized by themselves, at `--ocelle-size-rail-item` (40 px), the size #12's
`ocelle-nav-item` is expected to have.
The rail sets only the gap, the items' centring and the chrome ink as its colour, which an item takes when it
inherits colour. A plain `<a>` does not: give `<a>` items `color: inherit` and a target of at least 24 px, or use
`ocelle-nav-item` elements.

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

## Forwarded slots

A shell that forwards a slot of its own into an element of this package, such as
`<slot name="footer" slot="footer"></slot>` in its shadow root, assigns that `<slot>` element to the element's slot.
The element counts it as content even when nothing is assigned to the forwarded slot, so the part takes its wrapper,
gap, padding or divider with nothing in it. Forward a slot only when it has content, or remove the forwarding
`<slot>` when it has none.

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
