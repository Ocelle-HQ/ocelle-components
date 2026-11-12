# Contract: `@ocelle/elements` overlays (public surface)

All additions are semver MINOR (constitution VII). After 1.0.0 a removal or rename of any item here, or a change to
an event's `detail`, is MAJOR.

## Entry points (`packages/elements/package.json` `exports`)

- `@ocelle/elements/ocelle-dialog.js`, `@ocelle/elements/ocelle-drawer.js`, `@ocelle/elements/ocelle-tooltip.js`:
  each defines its own tag. `ocelle-dialog` and `ocelle-drawer` also define `ocelle-icon`, which they render.
- The package root `@ocelle/elements` and the browser build define all of them.
- `src/index.ts` re-exports `OcelleDialog`, `OcelleDrawer`, `OcelleTooltip`. The export keys, sorted, are
  `OcelleBrandMark, OcelleDialog, OcelleDrawer, OcelleIcon, OcelleTooltip` (plus those of missions merged before).

## `ocelle-dialog`

```html
<ocelle-dialog label="Open project" close-label="Close" open>
  <p>Choose a folder.</p>
  <!-- body content -->
  <div slot="footer"><button>Cancel</button><button>Open</button></div>
</ocelle-dialog>
```

- Attributes and properties: `open` (boolean, reflected), `label`, `close-label` (default "Close"). Host `aria-label`
  is observed.
- Slots: default (body), `footer`. Parts: `panel`, `heading`, `body`, `footer`, `close-button`.
- CSS custom property: `--ocelle-dialog-inline-size` (default `var(--ocelle-measure-reading)`).
- Events: `ocelle-dialog-close-request` (cancelable; `detail.reason`: `"escape" | "close-button"`) and
  `ocelle-dialog-close` (`detail.reason`: `"escape" | "close-button" | "host"`).
- Accessibility: one `dialog` node, modal, named by the label (heading level 2) or the host `aria-label`.

### Host pattern

```js
opener.addEventListener("click", () => { dialog.open = true; });
dialog.addEventListener("ocelle-dialog-close-request", (e) => { if (hasUnsavedInput()) e.preventDefault(); });
dialog.addEventListener("ocelle-dialog-close", (e) => { /* e.detail.reason */ });
```

## `ocelle-drawer`

As `ocelle-dialog`, with the `ocelle-drawer-` event prefix, `"backdrop"` as an extra reason, and:

- `side`: `"start"` (default) | `"end"`, reflected.
- `ground`: `"sheet"` (default) | `"chrome"`, reflected.
- `heading-hidden`: boolean, reflected.
- No `--ocelle-dialog-inline-size`. The width is the token `--ocelle-drawer-inline`, capped by
  `--ocelle-dialog-max-inline`.

### #12's personal drawer (the consumer this API is shaped for)

```html
<ocelle-drawer label="Personal" ground="chrome" heading-hidden side="start">
  <ocelle-personal-rail><!-- #8 --></ocelle-personal-rail>
</ocelle-drawer>
```

## `ocelle-tooltip`

```html
<ocelle-tooltip text="Projects"><button aria-label="Projects"><ocelle-icon name="folder"></ocelle-icon></button></ocelle-tooltip>
<ocelle-tooltip text="Saves a draft you can reopen later" describes><button>Save</button></ocelle-tooltip>
```

- Attributes and properties: `text`, `placement` (`top` default, `bottom`, `start`, `end`; reflected), `disabled`
  (reflected), `describes` (reflected).
- Slot: default (the trigger is the first assigned element). Part: `bubble`. Events: none.
- Without `describes` the bubble is hidden from assistive technology. The trigger must carry its own accessible name,
  and the text repeats it (#12's icon-only nav item, #7's ellipsised pill tag).
- With `describes`, the tooltip adds one hidden light-DOM `span[slot="ocelle-description"]` to its host and its id to
  the trigger's `aria-describedby`. This is supported only when the trigger is itself the focusable element.

### #7 and #12 (consumers inside their own shadow roots)

```js
// inside ocelle-nav-item's shadow root (icon-only mode)
html`<ocelle-tooltip text=${this.label} placement="end"><a href=${this.href} aria-label=${this.label}>…</a></ocelle-tooltip>`
// inside ocelle-pill-tag's shadow root, only while the text is ellipsised
html`<ocelle-tooltip text=${this.text} ?disabled=${!this.truncated}><button class="pill">${this.text}</button></ocelle-tooltip>`
```

## Tokens (`@ocelle/tokens`)

- `--ocelle-drawer-inline`, `--ocelle-tooltip-delay`, `--ocelle-tooltip-max-inline` (values in data-model).

## Engine floor

Chromium 120+ / **WebKit 17+** (was 16.4). The newest feature is the Popover API. Recorded in the elements README
§ Engines.
