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

This is the surface at the end of the feature. Phases 2 to 4 ship `ocelle-icon` only: `./ocelle-brand-mark.js` and
the mark's definition in `dist/index.js` and the browser build arrive in phase 5 (analysis F1 (a)). Nothing is
published before the feature merges.

**Tokens.** `@ocelle/tokens` is a `peerDependencies` entry (`workspace:0.0.0`), as for `@ocelle/styles`: the elements
read its custom properties by inheritance and bundle none of them. A host links `tokens.css` first; without it
`--ocelle-icon-size` is undefined, so an icon or mark takes the SVG default size (300 × 300 px in a paragraph) and the
mark's ring is not painted. The README says so; the peer dependency is named in the CHANGELOG (FR-031).

**Browser build file path.** A host without a bundler (the Ocelle console) does not resolve the specifier: it copies
`dist/browser/ocelle-elements.js` out of the package and serves it by path. That tarball path is therefore public
surface as well (renaming or moving it is a MAJOR change after 1.0.0); the README gives it as the path to copy, and the
CHANGELOG names it (FR-031). The file starts with a licence banner naming Apache-2.0, Lit's copyright and
BSD-3-Clause licence, and `THIRD_PARTY_NOTICES` (FR-029).

**Engines.** Chromium 120+ and WebKit 16.4+, the newest feature the elements use: `:dir()` (Chromium 120, WebKit
16.4; the icons' mirroring), Media Queries 4 `not (forced-colors: active)` (Chromium 104, WebKit 16.4; the mark's
variants and ring), the `lh` unit (Chromium 109; the slot convention), `scale` (Chromium 104) and constructable
stylesheets (`adoptedStyleSheets`: Chromium 73, WebKit 16.4), with no `window.ShadyCSS` polyfill on the page; Lit's
`<style>` fallback is then unreachable. An element that uses a newer feature raises this floor in the README's
engines section, the one list (README convention), and records the feature in its own feature's research.
Only Chromium is measured.

## Elements

### `<ocelle-icon name="…" label="…">`

- `name`: one of `chevron-start chevron-end chevron-up chevron-down arrow-start arrow-end menu close folder file
  search table copy` (exact; reflected). Anything else draws nothing.
- `label`: accessible name for a standalone meaningful icon (trimmed; empty counts as none; not reflected).
- Host `aria-label` names it too and wins over `label`; when present it decides alone, so a blank host `aria-label`
  leaves the icon unlabelled even with a `label`. Chromium uses the host value as written (spaces kept), so hosts pass
  it trimmed; the element never rewrites it. Host `aria-hidden="true"` hides it. Host `hidden` removes its box and
  every node (`:host([hidden]) { display: none; }`). Host `role` and `aria-hidden="false"` are unsupported.
- Box: `--ocelle-icon-size` square unless the host sizes it; colour: `currentColor`; mirrors the four
  inline-direction icons under `dir="rtl"`.
- No slots, events, parts or CSS custom properties.

### `<ocelle-brand-mark ground="chrome" tone="mono" label="…">`

- `ground="chrome"`: for `color-chrome` / `color-chrome-hover` grounds. `tone="mono"`: one colour,
  `currentColor`, wins over `ground`. Both reflected; other values give the default (main grounds).
- `label`, host `aria-label`, host `aria-hidden`, host `hidden` as for `ocelle-icon`.
- Box: `--ocelle-icon-size` high, width following height (`inline-size: max-content; aspect-ratio: 1`), so a host
  that sets only the height gets a square, in a column flex container too; a host that sets only the width gets a
  non-square box with the drawing scaled to the smaller side. A percentage host size needs a container of definite
  height: in one with only a minimum height (or none) the percentage acts as `auto` and the mark is drawn at the SVG
  default size, 300 × 300 px.
- Forced colours: ring and spot `currentColor` in every variant.
- No slots, events, parts or CSS custom properties.

## Slot convention (for controls of later missions)

A control that shows icons renders, in an `inline-flex` row with `align-items: flex-start` and the class `icon-row`,
`<span class="icon-slot"><slot name="icon"></slot></span>` before its label and, if it has an end icon,
`<span class="icon-slot trailing"><slot name="trailing"></slot></span>` after it, and adds the internal
`iconSlotStyles` to its `static styles`. The row sets the type (font size, line height) that the wrappers and the
label inherit; each wrapper is one line box tall (`1lh`) with the icon centred in it. Slotted icons (an `ocelle-icon`
or an `<svg>` with a `viewBox`) are then `--ocelle-icon-size` square whatever the page sets, centred on the label's
first line at any type size and leading (overflowing the line box evenly when taller than it), `--ocelle-space-2`
from the label, in the control's text colour; empty slots take no space. The row's block padding,
`calc((var(--ocelle-icon-size) - 1lh) / 2)` from `iconSlotStyles` (0 when the line box is at least the icon size),
keeps that overflow inside the control's box; a control never sets block padding on the row; it puts any further block padding on an element around the row. The convention adds no generated content, so
a control named by its visible label keeps exactly that name. A host resizes slotted icons only through
`--ocelle-icon-size` on the control or an ancestor: `iconSlotStyles` sets `--ocelle-icon-size: inherit !important`
on every slotted element, so the token set on a slotted icon itself has no effect. An icon-only control names its own inner control; slotted icons get no `label`.

## Records

`NOTICE` (trademark note), `THIRD_PARTY_NOTICES` (Lit entry), `packages/elements/licenses/lit-BSD-3-Clause.txt`,
`packages/elements/README.md`, `packages/elements/CHANGELOG.md`; the packed tarball holds `LICENSE`, `NOTICE`,
`THIRD_PARTY_NOTICES`.
