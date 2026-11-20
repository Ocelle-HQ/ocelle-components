# Contract: the two elements' public surface

What the manifest (`custom-elements.json`) and the README sections declare for each element. Every list is stated
even when empty (README § Element conventions, Manifest). Both are MINOR additions (constitution VII).

## `ocelle-disclosure` (`src/ocelle-disclosure.ts`)

A disclosure: a summary that opens and closes a panel inline, on native `details` and `summary` semantics.

| Kind | Name | Type | Default | Description |
|---|---|---|---|---|
| property / attribute | `open` | `boolean \| undefined` | `undefined` | Whether the panel is shown. Reflected: a user toggle, find in page and a script set the attribute alike, so server markup and htmx morphs keep it. |
| attribute (moved) | `aria-label` | string | — | Names the summary control; moved onto it, mirrored in `data-ocelle-moved-aria-label`. |
| attribute (moved) | `aria-labelledby` | ID list | — | Names the summary by element reference, resolved in the host's tree; mirrored. |
| attribute (moved) | `aria-describedby` | ID list | — | Describes the summary by element reference; mirrored. |
| attribute (moved) | `title` | string | — | The summary's advisory title; mirrored. |
| attribute (mirror) | `data-ocelle-moved-aria-label`, `-aria-labelledby`, `-aria-describedby`, `-title` | string | — | Element-owned; hosts never write them. |
| attribute (mapped) | `aria-expanded` | `"true" \| "false"` | — | Mapped onto `open` and removed from the host: `"true"` opens, `"false"` closes, any other value changes nothing. No mirror; `open` is the persisted state. Read after `open` at upgrade. |
| slot | `summary` | — | — | The summary's content; its text names the control. No interactive content. |
| slot | `icon` | — | — | An icon (`ocelle-icon` or a bare `svg`) that replaces the chevron (`chevron-end` closed, `chevron-down` open) in both states; decorative, never labelled; the wrapper is `aria-hidden="true"`, so a `<title>` adds nothing to the name. |
| slot | (default) | — | — | The panel's content. |
| event | `ocelle-disclosure-toggle` | `CustomEvent<{ open: boolean }>` | — | After each change of the open state, whatever caused it, in a later task after the attribute is reflected. Changes made before the inner `details`' native `toggle` runs are coalesced (always those of one task, sometimes those of several): at most one event per native `toggle`, with the final state; none at upgrade or when the state ends where the last event left it. Bubbles, composed, not cancelable. |
| CSS part | `details` | — | — | The inner `details`. |
| CSS part | `summary` | — | — | The summary control. |
| CSS part | `panel` | — | — | The panel wrapper. |
| custom state | `open` | — | — | `:state(open)` exactly while open. |
| CSS custom property | none | | | |

Methods: `click()` clicks the summary (toggles once); `focus(options)` is overridden to focus the summary (the root
has no `delegatesFocus`, R-01).

Host styles: `:host { display: block }`, `:host([hidden]) { display: none }`. Forced colours: the summary is
`CanvasText` on `Canvas`, the focus ring `Highlight` (R-04).

Tokens read (README section): `font-size-md`, `font-weight-medium`, `line-height-normal`, `color-ink`,
`color-hover-bg`, `space-1`, `space-2`, `radius-2`, `icon-size`, `color-focus`, `focus-width`, `focus-offset`.

README statements: the open state is the attribute (bind `open` from the server; a morph that drops it closes the
disclosure and fires the event); listen to `ocelle-disclosure-toggle`, not `toggle`, and do not count events to count
changes (changes before the native `toggle` are coalesced); a host `aria-expanded` is mapped onto `open` and removed,
prefer `open`; two departures from control conventions rule 1, both because the host holds the panel's content: no
host click guard, and no `delegatesFocus` (`focus()` is overridden, so a click on panel content moves no focus); a
script or morph close with focus in the panel, also inside a panel control's shadow root, moves focus to the summary;
no interactive content in the summary; nested disclosures are told apart by `event.target`;
clicks on the panel's content reach the page (no host guard, unlike the controls); before upgrade the summary and
panel show as plain content; no animation.

## `ocelle-code-block` (`src/ocelle-code-block.ts`)

A preformatted block for code, commands, logs and digests, in the library's sans with tabular figures.

| Kind | Name | Type | Default | Description |
|---|---|---|---|---|
| property / attribute | `overflow` | `string \| undefined` | `undefined` | `scroll` (trimmed, any ASCII case): long lines stay on one line and the block scrolls sideways, a tab stop and named group only while it overflows. Anything else or absent: lines wrap inside the block. Reflected. A switch to wrap while the scroll box has focus moves focus to the block. |
| property / attribute | `label` | `string \| undefined` | `undefined` | The scroll box's name while it overflows; trimmed; blank counts as none. A non-blank host `aria-label` wins. No effect in wrap mode. Not reflected. |
| property / attribute | `digest` | `boolean \| undefined` | `undefined` | Shows the text as a digest: a prefix up to the last colon, then groups of four code points with a gap; copied and read text stay unbroken (a whole-block selection ends with the platform's one block newline). Reflected. |
| slot | none | | | The text is the element's light-DOM text content, read as a copy; children add no markup or style. |
| event | none | | | |
| CSS part | `block` | — | — | The inset box. |
| CSS part | `code` | — | — | The `pre` that holds the text. |
| CSS custom property | none | | | |

Observed standard attribute: `aria-label` (not a property; the module reads it).

Tokens read: `color-inset`, `font-sans`, `figures`, `font-size-md`, `line-height-relaxed`, `measure-reading`,
`space-1`, `space-3`, `radius-2`, `border-width`, and through the overflow-region module `focus-offset`,
`focus-width`, `color-focus`, `scroller-fade-size`, `color-ink` (mask only).

Host styles: `:host { display: block; max-inline-size: var(--ocelle-measure-reading) }`, `:host([hidden]) { display:
none }`; `.block { direction: ltr; unicode-bidi: isolate }`; `.code { min-block-size: 1lh }` (R-06).

README statements: start the text on the opening tag's line (a newline after it is shown); markup inside is not
rendered and markup-like text stays text; code is always shown left to right, also in an `rtl` page (so a scroll block
starts at the left and fades at the right there); a switch from `scroll` to wrap while the box has focus moves focus
to the block; always give a scroll block a `label`; do not set a host `aria-label` in wrap mode; in a shrink-to-fit host
give a scroll block a definite or maximum inline size; in scroll mode the `ocelle-scroller` statements on keyboard,
focus, fades, scrollbar, motion and sizing hold (by reference); print shows what is laid out; no copy control, no
highlighting.

## README § Element conventions: the digest rule (FR-033)

> **Digests.** An element that shows a digest (a hash, with or without an algorithm prefix) groups it the same way: the
> prefix is everything up to and including the last colon and is shown as written; the rest is split into groups of
> four code points from the start, the last group holding the remainder. Units are inline boxes separated by a
> `<wbr>`, with a `--ocelle-space-1` gap after every unit but the last, so a line never starts with a gap; no character
> is added, so a copy and the screen-reader reading give the digest as written. Groups do not wrap inside
> (`white-space: nowrap`, as `-` and `/` in base64 and base64url are break opportunities), so lines break only between
> units; a prefix wider than the line breaks inside (WCAG 1.4.10). Text holding whitespace is not a digest and is shown
> ungrouped. `ocelle-code-block`'s `digest` is the first use;
> `ocelle-facts` values are the consumer's text and are not grouped.

## Internal modules used, unchanged

- `src/control.ts`: `MovedAttributes`, `resolveIds`, `controlStyles` (disclosure). Not `guardHost` (R-03).
- `src/icon-slot.ts`: `iconSlotStyles` (disclosure).
- `src/overflow-region.ts`: `OverflowRegion`, `overflowRegionStyles` (code block), as
  `specs/009-workflow-layouts/contracts/overflow-region.md` states, with no option of mission 019.
- `src/ocelle-icon.ts`: imported by the disclosure module for its chevron.
