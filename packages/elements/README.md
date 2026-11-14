# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has three elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, and `ocelle-notice`, a message
box that can announce itself.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-notice.js` | `dist/ocelle-notice.js` | `ocelle-notice` only; for hosts with a bundler |
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

## `ocelle-notice`

```html
<ocelle-notice tone="success">Saved.</ocelle-notice>
<ocelle-notice tone="danger" announce>
  <span slot="heading">Run failed</span>
  The lane stopped at step 3. <a href="/runs/7">View run 7</a>
</ocelle-notice>
<ocelle-notice size="compact" tone="warning">Disk almost full.</ocelle-notice>
```

`ocelle-notice` shows a message about a state or result in a box whose look follows its tone, with an optional
heading, in the regular or the compact size.

- `tone` (attribute and property, reflected): `info` (the default), `success`, `warning`, `danger` or `neutral`; any
  other value behaves as `info` and the property reads `"info"`, while the attribute keeps the value as written. The
  box's ground is `--ocelle-color-<tone>-bg`, with a bar of `--ocelle-bar-width` in `--ocelle-color-<tone>` along its
  inline-start edge, so the ground is never the only mark of the tone; the text is `--ocelle-color-ink`.
- `size` (attribute and property, reflected): `regular` (the default) or `compact`; any other value behaves as
  `regular` and the property reads `"regular"`, while the attribute keeps the value as written. The compact size sets
  the text in `--ocelle-font-size-sm` and `--ocelle-line-height-compact`, the scale of the base styles' compact density,
  with a smaller padding.
- `announce` (boolean attribute and property, reflected): the notice announces its text once, politely for `info`,
  `success` and `neutral` and assertively for `warning` and `danger`.

Slots: `heading` (optional; only elements are assigned to it) and the default slot, the body. CSS parts: `heading` and
`body`. The notice has no event and no CSS custom property of its own. `ocelle-notice` reads the tokens
`--ocelle-color-<tone>`, `--ocelle-color-<tone>-bg`, `--ocelle-color-ink`, `--ocelle-radius-row`,
`--ocelle-bar-width`, `--ocelle-border-width`, `--ocelle-space-1` to `--ocelle-space-4`, `--ocelle-font-size-subhead`,
`--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-tight` and
`--ocelle-line-height-compact`. Slotted content keeps its own semantics and focus: the notice sets no `tabindex` and
traps no focus. Long unbroken text wraps inside the box at any character. In forced colours the box has a border of
`--ocelle-border-width` in `CanvasText`, the bar in `CanvasText` too, and the text is `CanvasText` on `Canvas`.

**Heading.** The heading is absent when no element is assigned to the `heading` slot or the text content of its
elements is empty or whitespace only: it then draws no box and leaves no gap, so a server template can write
`<span slot="heading"></span>` for a null heading. The rule reads text content only, so a heading whose only content is
an `ocelle-icon` or an `img` is absent, and a heading whose only text is inside an `aria-hidden="true"` element is drawn
but adds nothing to the announced text. A present heading is drawn above the body at `--ocelle-font-weight-strong`, in
`--ocelle-font-size-subhead` and `--ocelle-line-height-tight` with a gap of `--ocelle-space-2` (compact:
`--ocelle-font-size-sm`, `--ocelle-line-height-compact`, `--ocelle-space-1`).

**Announced text.** The announced text is the heading text, then the body text, joined by one space: the text nodes, the
`label` of an `ocelle-icon` and the `alt` of an `img`, skipping elements with `hidden` or `aria-hidden="true"` and
`script`, `style` and `template` elements. Other accessible names (`title`, a slotted element's `aria-label`) do not
count. For other slotted content (an element with `role="img"` and an `aria-label`, an `svg`, CSS-generated content,
content hidden by a host rule without `hidden`) the announced text is not specified.

**When it announces.** "Announced" in this library's tests means a change of a live region's text in Chromium's
accessibility tree, read from the states that Chromium can hand to assistive technology; no screen reader runs in the
tests. With `announce`, a notice announces its text when it is inserted after the page has loaded, when its `hidden`
is removed, and on each change of its text or of its politeness. A notice that is part of the page as first loaded is
not announced: one connected while `document.readyState` is `"loading"`, or upgraded by the registration of the
definition. A notice inserted after the build has loaded is announced, however it is inserted (`innerHTML`, a
`<template>`, a `DOMParser` document, an htmx swap or `document.createElement`). Load the build before any swap or
script inserts announcing notices: a notice upgraded by the registration does not announce. Setting `announce`, or a
host `role` of `alert` or `status`, on an existing notice announces nothing: its current text is the baseline for the
next change. Moving a notice within the page in one task, or a re-render, announces nothing; the same text set again,
or a change of whitespace only, is no change. Removing `announce` stops the announcements.

**How it announces.** The notice announces through a separate live region in its shadow root, visually hidden and
atomic, that never holds the visible content: a copy of the text is written into it `W` after the last trigger. `W` is
twice Chromium's accessibility serialisation delay, 150 ms once `document.readyState` is `"complete"` and 350 ms before
(`AXObjectCacheImpl::GetDeferredEventsDelay()` in `ax_object_cache_impl.cc`), so 300 ms after load and 700 ms before;
the region is empty for that time first, so a screen reader is handed the whole text as a change. Changes closer
together than `W`, in one task or in different tasks, merge: only the final text is announced, once, and a text that
is back to the last announced text when the wait ends announces nothing. A text that keeps changing more often than
every `W` is not announced until it stops changing. A copy is held for `H`, 5000 ms, or until the next announcement but
at least `W`, and then removed. `H` is a chosen figure, not measured: the tests cannot see when a screen reader fetches
the text. For up to `H` a browse-mode user may meet the text twice, in the notice and in the copy.

**Host roles.** A host `role="alert"` announces assertively and `role="status"` politely whatever the tone, with or
without `announce`; with a role that gives the host's node no live politeness, such as `note`, `region` or `none`, the
notice behaves as with no role. The host's node keeps the role and is never a second live region. For a host
`role="alert"`, the insertion, the reveal and a change of the role to `alert` write no copy: Chromium's alert event for
the host's node reads the notice (`ui/accessibility/ax_event_generator.cc`, lines 394, 416-417 and 1081-1082). The alert
event is Chromium's behaviour and is not measured; WebKit is not measured, and its live regions in shadow roots are an
open limitation. What the event does for a `role="alert"` notice of the page as first loaded is not measured either,
and a later Chromium may change it. Text or a `tone` set in the same task as that insertion, reveal or role change is
part of the alert reading and is not announced again. A change made in a later task but before Chromium's next
serialisation is read twice, by the alert event and by the copy, so set the text before, or in the same task as, the
insertion, reveal or role change. A notice inserted or revealed as `role="alert"` and changed to `role="status"` in the
same task announces its text politely once, as a `status` notice would, since no alert event fires. Later text changes
of a `role="alert"` notice announce assertively through the copy.

**Hiding.** Only the host's own `hidden` attribute hides and reveals the notice: removing it announces the current
text once, as an insertion does, and changes while hidden are not announced. A notice shown by a hidden ancestor (a
container with `hidden`, a closed `<details>`, a `display: none` panel) is not announced by its live region; a
`role="alert"` notice shown that way is read by Chromium's alert event all the same.

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

On `ocelle-icon` and `ocelle-brand-mark`, a host `aria-label` names the element as `label` does, and when present it
decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`. On `ocelle-icon` and
`ocelle-brand-mark`, when both are set, the host `aria-label` is the name; removing it falls back to `label`. On
`ocelle-icon` and `ocelle-brand-mark`, Chromium uses a host `aria-label` as written, surrounding spaces included, so
pass it trimmed; the element never rewrites it. An unknown icon name exposes nothing, named or not.

On `ocelle-icon` and `ocelle-brand-mark`, a host `aria-hidden="true"` hides the element, labelled or not. On
`ocelle-icon` and `ocelle-brand-mark`, a host `hidden` attribute removes the element: no box and no node, labelled or
not. On `ocelle-notice` a host `aria-hidden="true"` is not supported: hide the notice with a host `hidden` attribute,
which gives it no box and announces nothing while it is set. On `ocelle-icon` and `ocelle-brand-mark`, a host `role` or
`aria-hidden="false"` is not supported: name the element with `label` or `aria-label` instead. `ocelle-notice` takes a
host `role` as its section says: `alert` and `status` make it announce, a role that gives its node no live politeness
leaves it as without a role, and `log`, other live roles and a host `aria-live`, `aria-atomic`, `aria-relevant` or
`aria-hidden="false"` are not supported.

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
fields, not decorators. Every element class carries the JSDoc tag `@tagname <tag>`, every public property a
description, and every public property that can be set a `@default` tag with the value the property reads before
anything sets it, `@default undefined` for an optional one: the manifest takes the tag name and the defaults from them.
An element that
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
