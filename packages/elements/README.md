# @ocelle/elements

The Ocelle web components: standards-based custom elements (Lit 3) that work in any page, a server-rendered page
under a strict Content Security Policy, a Svelte shell or a desktop webview. This release has nine elements:
`ocelle-icon`, with a set of thirteen icons, `ocelle-brand-mark`, the Ocelle rosette, `ocelle-notice`, a message box
that can announce itself, `ocelle-form-input`, a labelled text field that takes part in its form,
`ocelle-form-select`, a labelled native select for closed choices that takes part in its form, `ocelle-facts` with its
item `ocelle-fact`, a label and value sheet, `ocelle-empty-state`, an empty or loading panel, and `ocelle-progress`, a
progress bar.

## Entry points

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-notice.js` | `dist/ocelle-notice.js` | `ocelle-notice` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-form-input.js` | `dist/ocelle-form-input.js` | `ocelle-form-input` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-form-select.js` | `dist/ocelle-form-select.js` | `ocelle-form-select` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-facts.js` | `dist/ocelle-facts.js` | `ocelle-facts` and its item `ocelle-fact`; for hosts with a bundler |
| `@ocelle/elements/ocelle-fact.js` | `dist/ocelle-fact.js` | `ocelle-fact` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-empty-state.js` | `dist/ocelle-empty-state.js` | `ocelle-empty-state` only; for hosts with a bundler |
| `@ocelle/elements/ocelle-progress.js` | `dist/ocelle-progress.js` | `ocelle-progress` only; for hosts with a bundler |
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
the region is empty for that time first, so a screen reader is handed the whole text as a change. The wait also ends
no earlier than `W` of the load state in which the region last became empty, counted from then, so a change right
after a first load is written no earlier than the pre-load `W` after the notice was first rendered (about 650 to 690
ms after the change on Chromium), since the tests' reading of Chromium's serialisation holds an empty state begun
before the load to the pre-load delay. Changes closer together than `W`, in one task or in different tasks, merge: only the final text is announced, once, and a text that
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

## Form controls

`ocelle-form-input` and later form-like elements are form-associated custom elements: the native control, its visible
label, its description and its error live in one open shadow root, so every ID reference among them stays inside it.
This is the convention every form-like element of this library follows. The host takes part in its form through
`ElementInternals`: it submits its value under `name` (nothing without `name` or while disabled), joins the form a
`form` attribute names, follows a disabled `<fieldset>`, restores its default value on a form reset and its state on
history restore, and is associated with an external `<label for>`. The `form` attribute joins the form it names, as
on a native control; it is a standard attribute and the manifest does not list it.

**Members.** Shared attributes and properties: `name`, `label`, `description`, `error`, `required` and `disabled` (all
reflected), and the `value` property. The host exposes `form`, `labels`, `validity`, `validationMessage`,
`willValidate`, `checkValidity()` and `reportValidity()` as a native control does; `focus()` on the host focuses the
inner control, and the host is not a tab stop of its own. The host's validity flags and message are the inner
control's native constraint validation, and `reportValidity()` focuses the inner control and makes the browser show its
message. CSS parts: `label`, `control`, `description` and `error`. Slots: none: the label, the description and the
error are text attributes.

**Naming.** The inner control's accessible name is a host `aria-label` that is not blank, alone; otherwise the text of
each external `<label>` in `labels` order, then the `label` text, each with whitespace collapsed and trimmed, joined by
one space; with none of them the control has no name, and one is required. When a visible label is drawn (`label` or
an external `<label>`), a host `aria-label` must contain the visible label text; any other combination is not
supported. A label that is associated later is picked up when the control next renders or takes focus; a changed text
of an associated label renames the control at once. The `description` is the control's accessible description,
followed by a host `aria-description` and the error. A host `aria-label` and `aria-description` also stay on the host's
node, so Chromium exposes the host as a generic with the same name and description beside the control. A host
`aria-labelledby` and a host `aria-describedby` are not supported: they would reference across the shadow root; use
`label`, `aria-label` or `description` instead. A host `aria-invalid`, `aria-required` or `aria-disabled` reaches the
inner control only with the value `"true"`, combined with the element's own `error`, `required` and `disabled`; write
only `"true"` or nothing: any other value is not supported. Prefer the element's own attributes. A host
`aria-required="true"` adds no constraint, and a host `aria-disabled="true"` leaves the control focusable.

**Events.** The native `input` event of the inner control reaches the host with `value` already updated; each
committed change dispatches `ocelle-form-input-change`, a `CustomEvent` with `detail: { value }`, `bubbles` and
`composed`; a change by script, by reset or by restore dispatches none. For htmx, trigger on
`hx-trigger="ocelle-form-input-change"` (or `input`): the native `change` event does not leave the shadow root, and
htmx's default trigger for an unknown element is `click`. A plain form submit or `hx-post` on the form needs nothing,
since the values are in the form's data.

**Size and look.** The host is `display: block` and the control fills its inline size; the element sets no width of
its own, so in a filter bar the page sets the element's width or places it as a flex or grid item. The label is drawn
above the control, the description under the label and the error under the control. The form controls are for the main
grounds; a control on a state ground, `--ocelle-color-accent-low`, an inset or a hover ground is not supported.

**Error.** A non-empty `error` is shown under the control in `--ocelle-color-danger`, with the control's boundary in
`--ocelle-color-danger` at `--ocelle-bar-width`, makes the control invalid for assistive technology, is added after the
description to its accessible description, and is announced politely once each time it changes to a new text. The
error does not block submission or change the form's validity: the host clears it. It is announced through a separate
live region in the control's shadow root, as `ocelle-notice` announces, with the same wait `W`, hold `H` and merging.
Setting `error` to empty resets the baseline, so the same text set again is announced again; a change of whitespace
only is no change; changes closer together than `W` merge. An `error` in the page as first loaded is not announced and
does not move focus: it is read with the control's description when the user reaches it, so put an error summary or a
notice at the top of the page and focus it. A control inserted after the build has loaded with an `error` announces it
politely once, each control its own; moving a control within the page in one task announces nothing. Load the build
before any swap or script inserts form controls with `error`: a control upgraded by the registration does not announce.
Only the host's own `hidden` attribute counts as a reveal for a form control: removing it announces the current error
once; a control shown through a hidden ancestor announces nothing.

**Implicit submission.** In a form with no submit button that holds a native text input and a form control, Enter in
the native input submits, since the browser does not count the custom element as a field that blocks implicit
submission; Enter in the form control does not.

**Before the definition loads.** Before the definition has loaded, a form control is not in its form's data and is
not validated; to hide undefined elements, add a rule such as `ocelle-form-input:not(:defined) { visibility: hidden; }`
to the page's own stylesheet. The base stylesheet ships no such rule.

**Limits.** Not measured: restore by autofill, where the browser draws the validation message, the `email` keyboard
hint and the masking of `password`. WebKit is not measured for form controls: its form association and
`ElementInternals` are an open limitation.

## `ocelle-form-input`

```html
<form method="post" action="/lanes">
  <ocelle-form-input name="title" label="Title" description="Shown on the lane card" required></ocelle-form-input>
  <ocelle-form-input name="email" label="Email" type="email" autocomplete="email" error="Email is taken"></ocelle-form-input>
  <button>Save</button>
</form>
```

`ocelle-form-input` is a labelled text field with an optional description and a host-set error, that takes part in its
form like a native input. It follows the form-control convention above.

- `type` (attribute and property, reflected): `text` (the default), `email`, `url`, `tel`, `search`, `password` or
  `number`; any other value behaves as `text` and the property reads `"text"`, while the attribute keeps the value as
  written.
- `placeholder`, `autocomplete`, `inputmode` (`inputMode`), `pattern`, `min`, `max` and `step` (strings), `minlength`
  (`minLength`) and `maxlength` (`maxLength`) (numbers) and `readonly` (`readOnly`, boolean), attributes and reflected
  properties, pass to the inner field unchanged; an absent one reads `undefined` (`readOnly` reads `false`).
- The input's `value` attribute is its default value, restored on reset; the `value` property is the current value.
  Changing the attribute changes the current value only while the user has not edited it and no script has set `value`
  since the last reset. There is no `defaultValue` property.

Pressing Enter in the field dispatches `ocelle-form-input-change` if the value changed, then submits the form as a
native input does. Event: `ocelle-form-input-change`, `detail: { value }`. CSS parts: `label`, `control`,
`description` and `error`. Slots: none. No CSS custom property of its own. `ocelle-form-input` reads the tokens
`--ocelle-color-sheet`, `--ocelle-color-control-border`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`,
`--ocelle-color-danger`, `--ocelle-color-focus`, `--ocelle-color-disabled-bg`, `--ocelle-color-disabled-ink`,
`--ocelle-border-width`, `--ocelle-bar-width`, `--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-focus-width`,
`--ocelle-focus-offset`, `--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`,
`--ocelle-space-1`, `--ocelle-space-2` and `--ocelle-space-3`. The label is in `--ocelle-font-size-sm`,
`--ocelle-font-weight-strong` and `--ocelle-line-height-normal` in `--ocelle-color-ink`; the field is on
`--ocelle-color-sheet` with a boundary of `--ocelle-border-width` in `--ocelle-color-control-border`, radius
`--ocelle-radius-2`, at least `--ocelle-target-min` high, with the token focus ring on `:focus-visible` and the
disabled colours when disabled; the description is in `--ocelle-color-ink-muted` and the error in
`--ocelle-color-danger`, both in `--ocelle-font-size-sm` and `--ocelle-line-height-normal`. The placeholder is in
`--ocelle-color-ink-muted`. The field inherits the host's font. In forced colours the boundary is `CanvasText`, the
focus ring `Highlight`, and the error keeps its boundary at `--ocelle-bar-width`. Long unbroken text in the label, the
description or the error wraps at any character.

## `ocelle-form-select`

```html
<form method="get" action="/board">
  <ocelle-form-select name="lane" label="Lane" description="Only cards in this lane are shown">
    <option value="">All lanes</option>
    <optgroup label="Active">
      <option value="todo">To do</option>
      <option value="doing" selected>Doing</option>
    </optgroup>
    <option value="done">Done</option>
  </ocelle-form-select>
  <button>Filter</button>
</form>
```

`ocelle-form-select` is a labelled native select for closed choices, with an optional description and a host-set
error, that takes part in its form like a native select. It follows the form-control convention above. Attributes and
reflected properties: `name`, `label`, `description`, `error`, `required` and `disabled`. Properties: `value`, `form`,
`labels`, `validity`, `validationMessage` and `willValidate`. Methods: `checkValidity()`, `reportValidity()` and
`focus()`.

- Its choices are its light-DOM `<option>` and `<optgroup>` children, written as for a native `<select>`: the native
  select inside mirrors their order, labels, values, `selected` (the default selection, restored on reset) and
  `disabled`, and follows every later change to them. The light-DOM children are not rendered and not exposed, so a
  server-rendered page needs no script to fill the select. One choice only: there is no `multiple` and no `size`.
- A host `value` attribute is ignored: the default selection is the last option marked `selected`, or the first
  enabled option without one. The `value` property is the current choice; setting it to a value no option has selects
  nothing and reads `""`, as on a native select. There is no `defaultValue` property. With nothing selected (no
  option, or such a value), the select submits nothing, as a native select.
- When the chosen option is removed, the choice falls back to the first enabled option, as on a native select, with
  no event.
- The native select's own keys are unchanged: ArrowDown and ArrowUp change the choice, and typing a letter selects the
  next option whose label starts with it. Each change the user makes dispatches `ocelle-form-select-change`.
- The open-list indicator is the `chevron-down` icon of the set, drawn in `currentColor` at `--ocelle-icon-size` at
  the inline end of the select, decorative and visible in forced colours; it takes no pointer events, so a click on it
  reaches the select. Importing `@ocelle/elements/ocelle-form-select.js` defines `ocelle-form-select` only: the select
  draws its indicator itself and does not define `ocelle-icon`.

Event: `ocelle-form-select-change`, `detail: { value }`. CSS parts: `label`, `control`, `description` and `error`.
Slots: none. No CSS custom property of its own. For htmx, trigger on `hx-trigger="ocelle-form-select-change"` (or
`input`). `ocelle-form-select` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-control-border`,
`--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-color-danger`, `--ocelle-color-focus`,
`--ocelle-color-disabled-bg`, `--ocelle-color-disabled-ink`, `--ocelle-border-width`, `--ocelle-bar-width`,
`--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-font-size-sm`,
`--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-2`,
`--ocelle-space-3` and `--ocelle-icon-size`, the last for its indicator. The label, the select, the description and the
error are drawn as for `ocelle-form-input`; the select leaves room for the indicator at its inline end.

Before the definition has loaded, a select's `<option>` children may show as text, as the browser draws an unknown
element's content; the rule above for undefined elements hides them. Not measured for `ocelle-form-select`: that
Alt+Down or Space opens the list, and how the browser draws the open list.
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

## Mapping from kitty-mission-ui

Each `.sk-facts`, `.sk-empty-state` and `.sk-progress` modifier and state that kitty-mission-ui uses, by role, with the
element and variant that replaces it, or the consumer's own remedy.

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
decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`. On a form control a host
`aria-label` that is not blank names the control alone; a blank one, empty or whitespace only, is skipped, and the
labels and `label` name the control. On `ocelle-icon` and
`ocelle-brand-mark`, when both are set, the host `aria-label` is the name; removing it falls back to `label`. On
`ocelle-icon` and `ocelle-brand-mark`, Chromium uses a host `aria-label` as written, surrounding spaces included, so
pass it trimmed; the element never rewrites it. On a form control the control's name is a host `aria-label` with
whitespace collapsed and trimmed, while the host's node keeps it as written, surrounding spaces included, so pass it
trimmed with single spaces. An unknown icon name exposes nothing, named or not.

On `ocelle-icon` and `ocelle-brand-mark`, a host `aria-hidden="true"` hides the element, labelled or not. On
`ocelle-icon` and `ocelle-brand-mark`, a host `hidden` attribute removes the element: no box and no node, labelled or
not. On `ocelle-notice` a host `aria-hidden="true"` is not supported: hide the notice with a host `hidden` attribute,
which gives it no box and announces nothing while it is set. On a form control a host `aria-hidden="true"` is not
supported, since the control stays focusable: hide the control with a host `hidden` attribute instead. On `ocelle-icon`
and `ocelle-brand-mark`, a host `role` or `aria-hidden="false"` is not supported: name the element with `label` or
`aria-label` instead. On a form control a host `role` or `aria-hidden="false"` is not supported: name the control with
`label`, a `<label>` or `aria-label` instead. `ocelle-notice` takes a
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
fields, not decorators. Every element class carries the JSDoc tag `@tagname <tag>`, every public property a
description, and every public property that can be set a `@default` tag with the value the property reads before
anything sets it, `@default undefined` for an optional one: the manifest takes the tag name and the defaults from them.
An element that
observes a standard attribute such as `aria-label` adds it to `observedAttributes` without declaring a property, so
the manifest does not list it. An attribute that is the element's own and has no property of its own, such as
`ocelle-form-input`'s `value` (its default value), is declared in the manifest with the class's JSDoc tag `@attribute`,
with its type, default and description.

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
