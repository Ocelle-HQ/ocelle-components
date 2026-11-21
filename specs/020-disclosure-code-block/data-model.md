# Data model: Disclosure and Code Block

The public state of the two elements and how it changes. The surface itself is in
[contracts/elements.md](contracts/elements.md); the reasons are in [research.md](research.md).

## `ocelle-disclosure`

| Field | Source | Values | Notes |
|---|---|---|---|
| `open` | attribute `open` and property, reflected | `true`; `false` or `undefined` (closed) | `undefined` and `false` are one closed state; after a user close the property is `false` and the attribute absent (R-02) |
| summary | light-DOM children with `slot="summary"` | any phrasing content | the summary control's name when no host `aria-labelledby` or `aria-label`, through the summary's `ariaLabelledByElements = [.label]` (the wrapper around the slot); empty: no name; interactive content not supported (R-01, R-03) |
| icon | light-DOM child with `slot="icon"` | an `ocelle-icon` or bare `svg` | replaces the chevron in both states; decorative: the icon wrapper is `aria-hidden="true"`, so a titled bare `svg` adds no node, and the summary is named from `.label`, not from content, so its `<title>` adds no name (R-01) |
| panel | other light-DOM children (default slot) | any flow content | hidden while closed by the platform's `details`, revealable by find in page |
| moved ARIA | host `aria-label`, `aria-labelledby`, `aria-describedby`, `title` | strings; ID lists | moved to the summary, mirrored in `data-ocelle-moved-*` (control conventions rule 4); a host `aria-labelledby` or `aria-label` takes over the summary's name and clears the `.label` reference, which returns when both are gone (R-03) |
| mapped ARIA | host `aria-expanded` | `"true"`, `"false"`, other | mapped onto `open` (`"true"` opens, `"false"` closes, other values change nothing) and removed from the host in every case; no mirror (R-03) |
| reported state | internal | boolean | the last state an `ocelle-disclosure-toggle` reported; set at the first update from the initial `open` |

### State transitions

| From | Trigger | To | Event |
|---|---|---|---|
| closed | click, Enter, Space on the summary; `element.click()`; find in page; `open = true`; `setAttribute("open", "")`; a morph that adds `open`; host `aria-expanded="true"` | open | one `ocelle-disclosure-toggle`, `detail.open === true`, in a later task, after the attribute is reflected |
| open | click, Enter, Space; `element.click()`; `open = false`; `removeAttribute("open")`; a morph that removes `open`; host `aria-expanded="false"` | closed | one, `detail.open === false`; focus in the panel, also inside a panel control's shadow root, moves to the summary |
| any | several changes before the native `toggle` runs (always those in one task) ending in the state last reported | unchanged | none |
| any | several changes before the native `toggle` runs ending in the other state | the other state | exactly one, with the final state |
| any | host `aria-expanded` with a value other than `"true"` or `"false"` | unchanged | none; the attribute is removed |
| any | the same state set again | unchanged | none |
| at upgrade | initial `open` present or absent, then a host `aria-expanded` of `"true"` or `"false"` if present (it wins) | that state | none |

Custom state: `:state(open)` exactly while open.

## `ocelle-code-block`

| Field | Source | Values | Notes |
|---|---|---|---|
| text | the host's `textContent`, read at each render | string | followed by a `MutationObserver` (child list, character data, subtree); children's markup ignored; each line shown left to right in every page direction, the block in the page direction; under a computed `rtl` scroll box the element records the box and text it last opened at the line starts, and writes again when either differs (R-06) |
| `overflow` | attribute and property, reflected | `scroll` (trimmed, ASCII case-insensitive) is the scroll policy; anything else or absent is wrap | a switch to wrap while focus is in the scroll structure (the box, or the frame after the module's handover) moves focus to `.block` (temporary `tabindex="-1"`, removed on `focusout`; the library's focus ring, R-06) |
| `label` | attribute and property, not reflected | string | names the scroll box while it overflows; trimmed, blank counts as none; a non-blank host `aria-label` wins |
| `digest` | boolean attribute and property, reflected | `true`; `false` or `undefined` | |
| overflow state | the overflow-region module's outputs (scroll mode only) | `overflowing`, `fadeAttribute`, `name` | module-owned; nothing written to the host |

### Digest derivation (FR-029, R-07)

1. `trimmed` = text with leading and trailing whitespace removed (JavaScript `String.prototype.trim`).
2. If `trimmed` holds a whitespace character, no digest: shown as in the default mode.
3. Code points: `Array.from(trimmed)`.
4. `prefix` = the code points up to and including the last `:` (empty when there is no `:`).
5. `groups` = the rest, in runs of four code points from the start; the last run holds the remainder (1 to 4).
6. Units = `prefix` (when not empty) followed by `groups`; rendered with `map` as inline spans joined by `<wbr>`, each
   unit a Lit text binding; groups `nowrap`, the gap a `margin-inline-end` on every unit but the last (R-07).

Examples: `sha256:` + 64 hex gives `sha256:` and 16 groups; `ni:sha-256:abcd1` gives `ni:sha-256:`, `abcd`, `1`;
`sha256:` alone gives the prefix and no groups; `abcdefghij` gives `abcd`, `efgh`, `ij`; `x:ab😀cdef` gives `x:`,
`ab😀c`, `def` (no lone surrogate); the empty string gives no units (an empty block, one line high by `.code`'s
`min-block-size: 1lh`).

### Mode matrix

| `overflow` | `digest` | Rendering | Tab stop | Role and name |
|---|---|---|---|---|
| wrap | off | `pre` with the text, `pre-wrap`, `anywhere` | never | none |
| wrap | on | `pre` with the units, wrapping only between units, the prefix inside only where it and its gap are wider than the line | never | none |
| scroll | off | the module's frame with the `pre`, `white-space: pre` | only while overflowing | `group` named by the module's name rule, while overflowing and named |
| scroll | on | as above with the units on one line | only while overflowing | as above |
