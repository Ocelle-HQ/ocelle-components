# Contract: `@ocelle/elements` 0.x surface added by 005

## Entry points (`package.json` `exports`)

| Specifier | File | For |
|---|---|---|
| `@ocelle/elements` | `dist/index.js` | bundler hosts; defines every element |
| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | bundler hosts; defines `ocelle-icon` only |
| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | bundler hosts; defines `ocelle-brand-mark` only |
| `@ocelle/elements/browser.js` | `dist/browser/ocelle-elements.js` | hosts without a bundler: one `<script type="module" src>`; Lit inside, imports nothing, defines every element |
| `@ocelle/elements/custom-elements.json` | `custom-elements.json` | tooling; also named by the `customElements` field |

The module build imports only its own files and `lit` / `lit/*`; `lit` 3.3.3 is a `dependencies` entry (exact).

**Browser build file path.** A host without a bundler (the Ocelle console) does not resolve the specifier: it copies
`dist/browser/ocelle-elements.js` out of the package and serves it by path. That tarball path is therefore public
surface as well (renaming or moving it is a MAJOR change after 1.0.0); the README gives it as the path to copy, and the
CHANGELOG names it (FR-031). The file starts with a licence banner naming Apache-2.0, Lit's copyright and
BSD-3-Clause licence, and `THIRD_PARTY_NOTICES` (FR-029).

**Engines.** The elements need constructable stylesheets (`adoptedStyleSheets`: Chromium 73+, WebKit 16.4+) and no
`window.ShadyCSS` polyfill on the page; Lit's `<style>` fallback is then unreachable. Only Chromium is measured.

## Elements

### `<ocelle-icon name="…" label="…">`

- `name`: one of `chevron-start chevron-end chevron-up chevron-down arrow-start arrow-end menu close folder file
  search table copy` (exact; reflected). Anything else draws nothing.
- `label`: accessible name for a standalone meaningful icon (trimmed; empty counts as none; not reflected).
- Host `aria-label` names it too and wins over `label`; when present it decides alone, so a blank host `aria-label`
  leaves the icon unlabelled even with a `label`. Chromium uses the host value as written (spaces kept), so hosts pass
  it trimmed; the element never rewrites it. Host `aria-hidden="true"` hides it. Host `role` and
  `aria-hidden="false"` are unsupported.
- Box: `--ocelle-icon-size` square unless the host sizes it; colour: `currentColor`; mirrors the four
  inline-direction icons under `dir="rtl"`.
- No slots, events, parts or CSS custom properties.

### `<ocelle-brand-mark ground="chrome" tone="mono" label="…">`

- `ground="chrome"`: for `color-chrome` / `color-chrome-hover` grounds. `tone="mono"`: one colour,
  `currentColor`, wins over `ground`. Both reflected; other values give the default (main grounds).
- `label`, host `aria-label`, host `aria-hidden` as for `ocelle-icon`.
- Box: `--ocelle-icon-size` high, width following height (`aspect-ratio: 1`), so a host that sets only the height
  gets a square; a host that sets only the width gets a non-square box with the drawing scaled to the smaller side.
- Forced colours: ring and spot `currentColor` in every variant.
- No slots, events, parts or CSS custom properties.

## Slot convention (for controls of later missions)

A control that shows icons renders, in an `inline-flex` row with `align-items: flex-start`,
`<span class="icon-slot"><slot name="icon"></slot></span>` before its label and, if it has an end icon,
`<span class="icon-slot trailing"><slot name="trailing"></slot></span>` after it, and adds the internal
`iconSlotStyles` to its `static styles`. The row sets the type (font size, line height) that the wrappers and the
label inherit; each wrapper is one line box tall (`1lh`) with the icon centred in it. Slotted icons (an `ocelle-icon`
or an `<svg>` with a `viewBox`) are then `--ocelle-icon-size` square whatever the page sets, centred on the label's
first line at any type size and leading (overflowing the line box evenly when taller than it), `--ocelle-space-2`
from the label, in the control's text colour; empty slots take no space. The convention adds no generated content, so
a control named by its visible label keeps exactly that name. A host resizes slotted icons only through
`--ocelle-icon-size`. An icon-only control names its own inner control; slotted icons get no `label`.

## Records

`NOTICE` (trademark note), `THIRD_PARTY_NOTICES` (Lit entry), `packages/elements/licenses/lit-BSD-3-Clause.txt`,
`packages/elements/README.md`, `packages/elements/CHANGELOG.md`; the packed tarball holds `LICENSE`, `NOTICE`,
`THIRD_PARTY_NOTICES`.
