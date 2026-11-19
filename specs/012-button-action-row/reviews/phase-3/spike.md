# Phase 3 spike (T030): element reflection, the engine floor, the move, and the analyzer's `cssStates`

**Method** (2026-11-15, scratch files only, none committed): a Playwright script on Chromium **156.0.8078.4**
(`/opt/pw-browsers/chromium-1248`, the build the pinned Playwright 1.64.1 expects; phase 2 measured on 153 from
`chromium-1243`), with a scratch page holding two scratch elements: `x-plain` (no Lit; an open shadow root with
`delegatesFocus`, one inner `<button>`, `attachInternals()`) and `x-lit` (Lit 3.3.3 from the repository's
`node_modules`, loaded by an import map). The accessibility tree was read with CDP `Accessibility.getFullAXTree`. The
analyzer was run through `packages/elements/scripts/manifest.ts`'s `generate` over a scratch root holding one
`src/ocelle-spike.ts`.

## 1. Element reflection on this Chromium

- `ariaControlsElements`, `ariaLabelledByElements` and `ariaDescribedByElements` exist on `Element.prototype`, and
  `states` on `ElementInternals.prototype`.
- A host with `aria-controls="panel-1 nope panel-2" aria-labelledby="lbl" aria-describedby="desc"` whose element
  resolves each id with `getRootNode().getElementById`, assigns the found elements to the inner button and removes
  the host attribute: the inner button is `button "Archive"`, description "Gone for good", `controls` relation
  `[panel-1, panel-2]` (the missing `nope` skipped, order kept); the host has no ARIA attribute left.
- An element in a **sibling** shadow root assigned to `ariaControlsElements`: the getter returns `[]` and the tree has
  no relation (unresolved, as R-04 states).
- A host inside a shadow root, referring to an element of that shadow root: `getRootNode()` is the shadow root and the
  relation resolves (`controls [mine]`).
- `internals.states.add("expanded")`: the host matches `:state(expanded)` and not `:state(pressed)`.

## 2. The engine-floor figures

From MDN browser-compat-data **8.1.9** (`__meta.timestamp` 2026-11-12, the release the plan cites; npm tarball sha256
`c99eff2b…472c`):

| Feature | Chrome | Safari (and iOS) | Firefox |
|---|---|---|---|
| `Element.ariaControlsElements` | 135 | 16.4 | 136 |
| `Element.ariaLabelledByElements` | 135 | 16.4 | 136 |
| `Element.ariaDescribedByElements` | 135 | 16.4 | 136 |
| `ElementInternals.states` / `CustomStateSet` | 90 | 17.4 | 126 |
| CSS `:state()` | 125 (90 to 124: the dashed-ident form `:--foo` only) | 17.4 | 126 |

So the release with all three reflection properties is Chrome 135, and the floor of research R-04 holds: **Chromium
135** (element reflection; `:state()` from 125) and **WebKit 17.4** (custom states; reflection from 16.4). The Chrome
release notes could not be read: `developer.chrome.com` and `chromestatus.com` are refused by this container's proxy
(HTTP 403 on CONNECT), so the figures are the compatibility data's, as the plan's are.

## 3. Moving an attribute present before upgrade, and set later

`x-lit` observes `aria-expanded`, `aria-label` and `title` beside Lit's own attributes (a `static get
observedAttributes()` that adds them to `super.observedAttributes`), stores the value, removes the host attribute and
renders the value on the inner button:

- **Present before upgrade** (in the parsed markup before `customElements.define`): the constructor sees the
  attributes; `attributeChangedCallback` runs for each at upgrade, connected, before Lit's first update; the element's
  own `removeAttribute` comes back as `attributeChangedCallback(name, value, null)`, which is ignored. After the first
  update the host has only its `id` and the inner button has `aria-expanded="true" aria-label="Close" title="tip"`
  (`button "Close"`, description "tip", expanded).
- **Set later** (`setAttribute("aria-expanded", "false")`): one callback with the value, one with `null` (ignored); the
  inner button reads `false`.
- **`removeAttribute` after the move, then `host.ariaExpanded = null`**: no callback at all (the attribute is absent),
  so removal is a no-op, as R-03 states; `host.ariaExpanded = "true"` sets the attribute and is moved like any set.
- **Created with `document.createElement` and set before connecting**: the callback runs while disconnected and the
  move works; references must therefore be resolved again on `connectedCallback` (the root is not known before), as
  R-04 says.
- **Parsed by `innerHTML` into a connected container**: moved at the parse's upgrade; the host keeps no attribute.

## 4. Does analyzer 0.11.0 emit `cssStates` from JSDoc?

Yes. `@cssstate expanded - …` (and `@cssState`) gives `cssStates: [{ name, description }]` on the declaration, so the
normaliser needs no fallback for them (R-15). `@attr {string} aria-expanded - …`, `@attr {string}
data-ocelle-moved-aria-expanded - …` and `@attribute {string} title - …` each give an attribute with its description
and no `fieldName`, beside the Lit property's attributes, and an attribute the element also lists in its
`observedAttributes` getter is not added twice. The current normaliser drops `aria-label` from every element
(`standardAttributes`), so a declared `aria-label` would be lost; T037 changes it to drop a standard attribute only when
the element does not declare it with a description.

## Outcome

The plan holds on every point: reflection resolves in the host's tree, skips missing ids and leaves other shadow roots
unresolved; the floor figures are the compatibility data's; the move works for attributes present at upgrade and set
later, and removal after a move fires nothing; the analyzer emits `cssStates`. No stop-and-ask.
