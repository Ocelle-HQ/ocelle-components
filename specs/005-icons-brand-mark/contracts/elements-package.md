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

## Elements

### `<ocelle-icon name="…" label="…">`

- `name`: one of `chevron-start chevron-end chevron-up chevron-down arrow-start arrow-end menu close folder file
  search table copy` (exact; reflected). Anything else draws nothing.
- `label`: accessible name for a standalone meaningful icon (trimmed; empty counts as none; not reflected).
- Host `aria-label` names it too and wins over `label`; host `aria-hidden="true"` hides it. Host `role` and
  `aria-hidden="false"` are unsupported.
- Box: `--ocelle-icon-size` square unless the host sizes it; colour: `currentColor`; mirrors the four
  inline-direction icons under `dir="rtl"`.
- No slots, events, parts or CSS custom properties.

### `<ocelle-brand-mark ground="chrome" tone="mono" label="…">`

- `ground="chrome"`: for `color-chrome` / `color-chrome-hover` grounds. `tone="mono"`: one colour,
  `currentColor`, wins over `ground`. Both reflected; other values give the default (main grounds).
- `label`, host `aria-label`, host `aria-hidden` as for `ocelle-icon`.
- Box: `--ocelle-icon-size` square unless the host sizes it.
- No slots, events, parts or CSS custom properties.

## Slot convention (for controls of later missions)

A control that shows icons renders, in an `inline-flex` row with `align-items: flex-start`,
`<span class="icon-slot"><slot name="icon"></slot></span>` before its label and, if it has an end icon,
`<span class="icon-slot trailing"><slot name="trailing"></slot></span>` after it, and adds the internal
`iconSlotStyles` to its `static styles`. Slotted icons (an `ocelle-icon` or an `<svg>` with a `viewBox`) are then
`--ocelle-icon-size` square whatever the page sets, centred on the label's first line, `--ocelle-space-2` from the
label, in the control's text colour; empty slots take no space. A host resizes them only through
`--ocelle-icon-size`. An icon-only control names its own inner control; slotted icons get no `label`.

## Records

`NOTICE` (trademark note), `THIRD_PARTY_NOTICES` (Lit entry), `packages/elements/licenses/lit-BSD-3-Clause.txt`,
`packages/elements/README.md`, `packages/elements/CHANGELOG.md`; the packed tarball holds `LICENSE`, `NOTICE`,
`THIRD_PARTY_NOTICES`.
