# Phase 2 spike (T011)

Run on 2026-11-10 in this container (Linux x64 glibc, Chromium 1243 at
`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, pnpm 12.16.1), with scratch files only, in a copy of the
repository at `af90e30` made with `git archive` into the session scratchpad. Nothing of the scratch files is
committed. Node: 22.23.4 (the container's) and **26.13.0** (CI's pin), the official
`node-v26.13.0-linux-x64.tar.xz` from nodejs.org, its SHA-256 checked against the release's `SHASUMS256.txt`, put
first on `PATH`.

No stop-and-ask outcome was met: every check below came out as research.md predicts.

## 1. R-16 on Node 26.13.0 (deferred from phase 1, review note R2-01)

Method as `reviews/phase-1/install-scripts.md`: a fresh copy without any `node_modules`, an `npm` shim first on
`PATH` that logs each call and exits 1, then `pnpm install --frozen-lockfile` with Node 26.13.0 as `node`.

| Check | Result on Node 26.13.0 |
|---|---|
| `pnpm install --frozen-lockfile` (clean tree) | exit 0; `.../node_modules/rs-module-lexer postinstall$ node postinstall.js` then `postinstall: Done`; no other build script ran; `pnpm exec node --version` is `v26.13.0` |
| native binding loads | yes: `require(".../rs-module-lexer/binding").getTargetTriple()` is `x86_64-unknown-linux-gnu` under `v26.13.0`; binding `@xn-sakina/rml-linux-x64-gnu@2.9.0` |
| no `npm install` ran | the shim's log was never written (zero calls); no `npm-install` directory under `node_modules` |
| `@xn-sakina/rml-wasm` absent | absent from `node_modules/.pnpm` |
| `fsevents` absent (Linux) | absent from `node_modules/.pnpm` |
| `pnpm run setup:offline` | exit 0: `setup: installed offline; Chromium at /opt/pw-browsers/chromium-1243/chrome-linux64/chrome` |
| `pnpm run gate:pins` | exit 0: `pins: 5 manifests checked, no finding` |

macOS stays unverified (no runner), as phase 1 recorded.

## 2. The analyzer (R-06)

Scratch element `spike/ocelle-spike.ts`, written as R-06 says: the real `define` helper (a module-level
`define("ocelle-spike", OcelleSpike)` that calls `customElements.define` only when the tag is free),
`static override properties = { name: { type: String, reflect: true }, label: { type: String } }`, `declare` fields
`name: SpikeName | undefined` and `label: string | undefined`, `static override get observedAttributes()` returning
`[...super.observedAttributes, "aria-label"]`, a private `#internals` field, the class JSDoc `@tagname ocelle-spike`
and `@default undefined` on each property.

**API vs CLI.** In process: `create({ modules, plugins: litPlugin(), context: { dev: false } })`, with `create` and
`ts` from `@custom-elements-manifest/analyzer` (its own TypeScript 5.4.5) and `litPlugin` from
`@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js` (the package has no `exports` map, so
the deep import resolves), modules made with `ts.createSourceFile(path, text, ts.ScriptTarget.ES2015, true)` exactly
as `cli.js` makes them. CLI: `cem analyze --litelement --globs spike/ocelle-spike.ts --outdir <tmp>`. The two outputs
are deep-equal, on Node 22.23.4 and on Node 26.13.0, and the Node 22 and Node 26 API outputs are byte-identical.
**Decision: `scripts/manifest.ts` uses the API in process** (R-06's first option), so `manifest.test.ts` and the gate
need no child process.

**Builds denied.** The API path never loads `rs-module-lexer`: a `module.registerHooks` resolve hook logged no
`rs-module-lexer` or `rml-` module during the API run (it logged the analyzer's `typescript@5.4.5`), while the CLI loads
`rs-module-lexer/index.js`, `binding.js` and the `.node` binding at start (through `find-external-manifests.js`, which
only `cli.js` imports). So the generator works whether or not the approved `postinstall` ran.

**Output** (schema and shape the normaliser starts from):

- `"schemaVersion": "1.0.0"`, `"readme": ""`, one `javascript-module` per file with `path` as given.
- The class declaration has `tagName: "ocelle-spike"` (from `@tagname`) and `customElement: true`, `superclass`
  `{ name: "LitElement", package: "lit" }`, and `description` from the class JSDoc.
- `members`: `name` (`type.text` `"SpikeName | undefined"`, `default: "undefined"`, `attribute: "name"`,
  `reflects: true`, description), `label` (`"string | undefined"`, `default: "undefined"`, `attribute: "label"`, no
  `reflects` key), and **`#internals` (`privacy: "private"`, `readonly: true`)**: the normaliser must drop non-public
  members as well as non-public attributes.
- `attributes`: `{ "name": "aria-label" }` (no description; dropped by the normaliser), `name` and `label` with type,
  description, `default` and `fieldName`.
- No `slots`, `events`, `cssParts`, `cssProperties` keys at all (the normaliser adds them as empty arrays).
- `exports` holds only the `js` export of the class: the `define` helper yields no `custom-element-definition` export.
- The type alias is not expanded (`SpikeName | undefined`), so the normaliser's `IconName` expansion is needed.

## 3. `axTree` and `emulateForcedColors` (R-11, R-13)

Scratch Vitest browser-mode run (Vitest 5.0.5, `@vitest/browser-playwright`), commands defined in the scratch
config's `test.browser.commands`. `axTree(id)`: a CDP session on `ctx.page`, `Page.getFrameTree` to find the frame
whose URL is `(await ctx.frame()).url()` (the test iframe), `DOM.getDocument({ depth: -1, pierce: true })` to find the
element with that `id` and collect the backend node ids of the element and of its shadow roots' subtrees (not its
light-DOM children), `Accessibility.getFullAXTree({ frameId })`, then the unignored nodes among those ids as
`{ role, name }`.

| Element (each with an `id`, in one paragraph) | `axTree` |
|---|---|
| custom element, `ElementInternals.ariaHidden = "true"`, shadow `svg aria-hidden` | `[]` |
| custom element, internals `role = "img"`, `ariaLabel = "Close"` | `[{ role: "image", name: "Close" }]` |
| plain custom element, nothing set | `[{ role: "generic", name: "" }]` (the hazard R-13 answers) |
| internals `img`/`"Close"`, host `aria-label=" Spaced "` | `[{ role: "image", name: " Spaced " }]` (host value as written) |
| internals `ariaHidden = "true"`, host `aria-label="Close"` | `[]` (the unknown-name-with-host-`aria-label` row) |
| `<button id>Go</button>` | `[{ role: "button", name: "Go" }]` (its light-DOM `StaticText` excluded) |
| missing id | `[]` |

Including light-DOM children gave the button a second `StaticText "Go"` node, so the command collects the element and
its shadow subtree only, as T012 says. `emulateForcedColors("active", "dark")` (Playwright `page.emulateMedia` with
`forcedColors` and `colorScheme`) made `matchMedia("(forced-colors: active)")` and `(prefers-color-scheme: dark)` true
inside the test iframe (a button's colour became `rgb(255, 255, 255)`), and `"none"` made it false again.

## 4. Browser build under the strict CSP (R-05)

`vite build` (8.3.5) in library mode on the scratch element, format `es`, file `browser/ocelle-elements.js`, no
externals, default conditions, output `banner` set: one 20 191-byte file that starts with the `/*! … */` banner,
holds no `import` statement or `import(` (the only match of `import` is Lit's `importNode`), no `console.` call, no
`lit-html/development` and no `ssr-dom-shim`. (Vite's library mode keeps whitespace in `es` output; the size matches
R-05's 20 kB probe.)

Served on 127.0.0.1 with `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
font-src 'self'`, the page holding one `<script type="module" src="ocelle-elements.js">` and
`<ocelle-spike id="x" name="close">`, violation collector by `page.addInitScript`:

| Page | Result |
|---|---|
| element page | zero violations; requests exactly `/` and `/ocelle-elements.js`; no console message; no page error; element defined, shadow root holds the `svg`, one adopted stylesheet, no `<style>` element |
| control page (one `style` attribute) | violation `style-src-attr` recorded; Chromium also writes the violation to the console, so the console recorder sees it too |

## Consequences for the red step

- The manifest generator is the API, in process (section 2); its normaliser drops private members and attributes,
  `aria-label`, and adds the four empty lists; schema version `1.0.0` (T017).
- `axTree` collects the element and its shadow subtree only (section 3; T012's button case).
- The fixture console recorder must treat the control page's console line as expected there, and zero console
  messages on every other page (section 4).
