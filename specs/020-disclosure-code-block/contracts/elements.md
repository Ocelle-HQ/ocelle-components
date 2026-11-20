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
| slot | `summary` | — | — | The summary's content; its text names the control. No interactive content. |
| slot | `icon` | — | — | An icon that replaces the chevron (`chevron-end` closed, `chevron-down` open) in both states; decorative, never labelled. |
| slot | (default) | — | — | The panel's content. |
| event | `ocelle-disclosure-toggle` | `CustomEvent<{ open: boolean }>` | — | After each change of the open state, whatever caused it, in a later task after the attribute is reflected; at most one per task with the final state; none at upgrade or when the state ends where it began. Bubbles, composed, not cancelable. |
| CSS part | `details` | — | — | The inner `details`. |
| CSS part | `summary` | — | — | The summary control. |
| CSS part | `panel` | — | — | The panel wrapper. |
| custom state | `open` | — | — | `:state(open)` exactly while open. |
| CSS custom property | none | | | |

Methods: `click()` clicks the summary (toggles once); `focus()` focuses the summary (`delegatesFocus`).

Tokens read (README section): `font-size-md`, `font-weight-medium`, `line-height-normal`, `color-ink`,
`color-hover-bg`, `space-1`, `space-2`, `radius-2`, `icon-size`, `color-focus`, `focus-width`, `focus-offset`.

README statements: the open state is the attribute (bind `open` from the server; a morph that drops it closes the
disclosure and fires the event); listen to `ocelle-disclosure-toggle`, not `toggle`; a host `aria-expanded` is not
supported, use `open`; no interactive content in the summary; nested disclosures are told apart by `event.target`;
clicks on the panel's content reach the page (no host guard, unlike the controls); before upgrade the summary and
panel show as plain content; no animation.

## `ocelle-code-block` (`src/ocelle-code-block.ts`)

A preformatted block for code, commands, logs and digests, in the library's sans with tabular figures.

| Kind | Name | Type | Default | Description |
|---|---|---|---|---|
| property / attribute | `overflow` | `string \| undefined` | `undefined` | `scroll` (trimmed, any ASCII case): long lines stay on one line and the block scrolls sideways, a tab stop and named group only while it overflows. Anything else or absent: lines wrap inside the block. Reflected. |
| property / attribute | `label` | `string \| undefined` | `undefined` | The scroll box's name while it overflows; trimmed; blank counts as none. A non-blank host `aria-label` wins. No effect in wrap mode. Not reflected. |
| property / attribute | `digest` | `boolean \| undefined` | `undefined` | Shows the text as a digest: a prefix up to the last colon, then groups of four with a gap; copied and read text stay unbroken. Reflected. |
| slot | none | | | The text is the element's light-DOM text content, read as a copy; children add no markup or style. |
| event | none | | | |
| CSS part | `block` | — | — | The inset box. |
| CSS part | `code` | — | — | The `pre` that holds the text. |
| CSS custom property | none | | | |

Observed standard attribute: `aria-label` (not a property; the module reads it).

Tokens read: `color-inset`, `font-sans`, `figures`, `font-size-md`, `line-height-relaxed`, `measure-reading`,
`space-1`, `space-3`, `radius-2`, `border-width`, and through the overflow-region module `focus-offset`,
`focus-width`, `color-focus`, `scroller-fade-size`, `color-ink` (mask only).

README statements: start the text on the opening tag's line (a newline after it is shown); markup inside is not
rendered; always give a scroll block a `label`; do not set a host `aria-label` in wrap mode; in a shrink-to-fit host
give a scroll block a definite or maximum inline size; in scroll mode the `ocelle-scroller` statements on keyboard,
focus, fades, scrollbar, motion and sizing hold (by reference); print shows what is laid out; no copy control, no
highlighting.

## README § Element conventions: the digest rule (FR-033)

> **Digests.** An element that shows a digest (a hash, with or without an algorithm prefix) groups it the same way: the
> prefix is everything up to and including the last colon and is shown as written; the rest is split into groups of
> four code points from the start, the last group holding the remainder. Units are inline boxes separated by a
> `--ocelle-space-1` gap and a `<wbr>`, with no character added, so a copy and the screen-reader reading give the
> digest as written. Lines break only between units; a unit wider than the line breaks inside (WCAG 1.4.10). Text
> holding whitespace is not a digest and is shown ungrouped. `ocelle-code-block`'s `digest` is the first use;
> `ocelle-facts` values are the consumer's text and are not grouped.

## Internal modules used, unchanged

- `src/control.ts`: `MovedAttributes`, `resolveIds`, `controlStyles` (disclosure). Not `guardHost` (R-03).
- `src/icon-slot.ts`: `iconSlotStyles` (disclosure).
- `src/focusable.ts`: `deepActive` (disclosure, R-02).
- `src/overflow-region.ts`: `OverflowRegion`, `overflowRegionStyles` (code block), as
  `specs/009-workflow-layouts/contracts/overflow-region.md` states, with no option of mission 019.
- `src/ocelle-icon.ts`: imported by the disclosure module for its chevron.
