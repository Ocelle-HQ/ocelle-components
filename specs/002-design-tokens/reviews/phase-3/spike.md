# Phase 3 spike (T030): Storybook under the strict CSP

Run on 2026-11-04 against the phase base `e05b8c2`, before any phase 3 test, with the pinned Storybook
**10.6.5** (`storybook`, `@storybook/html-vite`, as installed in phase 1; the plan's 10.6.4 was superseded by the
pin), Vite 8.3.5, Node 22.23.4 in this container, Chromium through Playwright 1.64.1 with the scratchpad browser
alias of phase 1 R1-02. The throwaway configuration (`storybook/.storybook/{main,preview,manager}.ts`,
`preview-head.html`, `preview.css`, `storybook/stories/spike.stories.ts`, `storybook/.generated/`) was not
committed. Builds went to a scratch directory, not `storybook/dist/`.

Throwaway story: one story (`Spike/Colour`) rendering the colour group from `packages/tokens/src/source.ts` (relative
import) as `<dl>` of name and value with a `<span class="ocelle-swatch" data-token="…">` per token, no style
attribute. `.generated/tokens.css` is `css(source)`, `.generated/swatches.css` one
`.ocelle-swatch[data-token="<name>"] { background: var(--ocelle-<name>) }` per colour token, both linked from
`preview-head.html`; `.generated/` is the Storybook static directory.

## 0. Network access of the build (analysis E2)

The build ran under a preload (`--import`, passed through `NODE_OPTIONS` so that every Node child process loads
it) that patches `net.Socket.prototype.connect` and `dns.lookup` / `dns.promises.lookup` / `dns.resolve`, records
every connection and lookup to a non-loopback host and fails it. Each process that loaded it wrote its pid.

| Run | Processes with the preload | Recorded connections and lookups |
|---|---|---|
| control: `net.connect({ host: "93.184.215.14", port: 443 })` | 1 | exactly 1 (`connect 93.184.215.14:443`) |
| control: `fetch("https://example.com")` | 1 | exactly 1 (`connect example.com:443`; fetch fails "network blocked") |
| `storybook build --disable-telemetry` (`core.disableTelemetry: true`) | 3 | **none** |

Result: the build makes no network access. Not a stop condition.

## 1. `csp` gate findings on the Vite preview bundle and on `sb-addons/` (by hand; not a gate result)

`checkOutput` of `gates/bin/csp.ts` run by hand on the files (they are outside the static scope of FR-023):

| File | Findings |
|---|---|
| `assets/iframe-<hash>.js` (Vite preview bundle) | 9: `function-call` ×4 (`Function(\`return this\`)()` ×2, line 554 and 555; `Function(\`binder\`, …)` ×2, line 579), `style-attribute` ×5 (line 698, the logger's `<span style="color: …">` strings) |
| `sb-addons/storybook-core-server-presets-0/common-manager-bundle.js` | 1: `eval` (line 620, `(0,eval)(\`(${t})\`)`, Storybook's argument parser in the manager) |
| `sb-addons/storybook-1/manager-bundle.js` (built from `.storybook/manager.ts`) | none |

These are Storybook's own code, as R-10 predicted; they are left to the run-time test (FR-023 exception 2).

## 2. Run-time CSP violations under the Storybook page's header

Server: Node `http`, every response with the header; collector `securitypolicyviolation` by `addInitScript` in every
frame, cross-checked with the console's CSP messages; requests outside the origin recorded.
Header (FR-023): `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self'`.

| Build | Page | Violations by directive (source) |
|---|---|---|
| as built | manager `index.html` | `img-src` 1 (favicon link), `style-src-elem` 2 (inline `<style>`), `script-src-elem` 2 (inline `<script>`) |
| as built | preview `iframe.html` | `style-src-elem` 2, `script-src-elem` 3 (inline) |
| externalised | manager `index.html` | `img-src` 1 (favicon); `style-src-elem` 10: Emotion's `StyleSheet._insertTag` 4 (`sb-manager/globals-runtime.js`), React-rendered `<style>` elements 4, a component that prepends a `<style>` 1, the highlight addon's keyframes `<style>` in the framed preview 1 |
| externalised | preview `iframe.html` | `style-src-elem` 1: the highlight addon creates `<style data-highlight="keyframes">` |
| externalised, `features` off (below) | preview `iframe.html` | **none**; no request outside the origin |

Externalisation (the prototype of `storybook/scripts/externalise.ts`), over every `*.html` of the output with the
parse5 tokenizer: an inline `<script>` (no `src`) becomes `<script src="./inline-<sha256, 16 hex>.js">` keeping its
`type`, its text written to that file beside the HTML (so relative imports keep working); an inline `<style>`
becomes `<link rel="stylesheet" href="./inline-<hash>.css">`; a `style` attribute would become
`data-ocelle-style="<hash>"` with the rule `[data-ocelle-style="<hash>"] { … }` in a linked `inline-<hash>.css`
(the entries have none in markup; the one `style="…"` in `iframe.html` sits inside an inline script and moves out
with it). An external script is left as it is.

Techniques of R-10, in order:

1. **Emotion's cache inserting into adopted constructable stylesheets: not possible.** The manager's Emotion cache
   is the default `EmotionCacheContext` value, created when `sb-manager/globals-runtime.js` (prebuilt, copied
   verbatim) loads, before `.storybook/manager.ts` runs; the manager root offers no way to supply another cache.
   And 6 of the 10 manager violations do not come from Emotion at all (React-rendered `<style>` elements, a
   prepended `<style>`, the highlight keyframes). Only patching DOM prototypes in the page could intercept them;
   that is not one of R-10's techniques and was not tried.
2. **The preview alone (`iframe.html`), without the manager UI: one violation left**, the highlight addon's
   keyframes `<style>`.
3. **Settings of the pinned Storybook:** `main.ts` `features: { highlight: false, backgrounds: false, measure: false,
   outline: false, viewport: false, actions: false, controls: false, interactions: false }` removes the core
   addons' preview code; with (2) **zero violations**.

Configuration that reaches zero: the preview alone, with the `features` above, after externalisation. As R-10
states for this case, `frame-src 'self'` is dropped; the preview still fetches `./index.json`, so `connect-src
'self'` stays. Header of the Storybook page:

```text
default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'
```

Verified under exactly that header, for the story in light and in dark (`iframe.html?id=…&globals=theme:<theme>`;
the decorator of `preview.ts` sets `data-theme` on the preview's `<html>` from the `theme` global): header served
equal to it, zero violations, zero requests outside the origin (requests: the page, the externalised files,
`tokens.css`, `swatches.css`, the bundle chunks, `index.json`), `--ocelle-color-canvas` `#F1EEE8` in light and
`#15130F` in dark, 40 `<dt>` (the colour group), no element with a `style` attribute.

The manager UI (`index.html`) stays outside the Storybook page: it cannot run under the header without a technique
R-10 does not list. The run-time test (T036) therefore serves the whole build but opens the preview only; the
manager's theme is still checked by the unit test of US1 scenario 13.

## 3. Canvas text

`HTMLCanvasElement.prototype.getContext` and `CanvasRenderingContext2D.prototype.fillText`, `strokeText` and
`measureText` were wrapped by `addInitScript` to record every call: **no call** in light or dark. The token stories
draw no canvas text.

## 4. Run-time monospace check (contracts/gates.md § Monospace in Storybook)

Every element of the preview, open shadow roots included, checked for a computed `font-family` naming a family of
the prefix gate's monospace list, then with the control element (`element.style.fontFamily = "Menlo, monospace"`
through `page.evaluate`) and after removing it.

| Configuration | Before the control | With the control | After |
|---|---|---|---|
| as above | 2: `pre.sb-errordisplay_code` (Storybook's error display, stack ending `"Lucida Console", Consolas, Monaco, monospace`) and `code#error-stack` (the user-agent `monospace` of `<code>`); both hidden but in the DOM of `iframe.html` | 3 (the two and the control) | 2 |
| plus `.storybook/preview.css`, imported by `preview.ts` (Vite emits it as an external stylesheet linked from `iframe.html`): `pre, code, kbd, samp, .sb-errordisplay_main .sb-errordisplay_code { font-family: var(--ocelle-font-sans); }` | **0** | exactly 1, the control | **0** |

The theme cannot reach these elements (they are the preview's markup); the preview stylesheet removes them, using
the token. With it, no monospace element remains. The control is reported exactly once.

## 5. Mutation shard holding a 120-line `source.ts` entry (R-03 *Mutation path*)

`gate:mutation -- --base 98c1dcd --files packages/tokens/src/source.ts:1-120` (the first shard entry `--plan` gives
for the file), 4 cores: **41 s, exit 0, "0 mutants on the changed lines of 1 file"**. Stryker 10.1.1 creates no
mutant in `source.ts` at all (whole file: 0): its instrumenter treats a `TSAsExpression` as a type node
(`@stryker-mutator/instrumenter` `util/syntax-helpers.js`, `tsTypeAnnotationNodeTypes`) and does not descend into
it, and every record is inside `[ … ] as const satisfies readonly TokenRecord[]` (the ground lists in `as const`
too). So the shard is far under the limit, but **the value mutants of `source.ts` that R-03 counts on the node
table test to kill are never generated**; the table test still checks the values, but the mutation gate sees
nothing of `source.ts`. This concerns phase 2's source, not phase 3's scope; reported to the operator, not changed
here.

To bound the time the entry would take if its literals were mutated, the run was repeated with a scratch copy in
which `as const` was dropped (`] satisfies readonly TokenRecord[]`), Stryker directly with `--mutate
packages/tokens/src/source.ts:1-120` and the TypeScript checker off (the copy makes one `@ts-expect-error` in
`index.test.ts` unused, which fails the checker's initial compile): **343 mutants, 303 killed, 40 timeouts, 0
survived, 5 min 4 s.** Under the 10-minute `mutation-shard` limit. The tree was restored afterwards.

## 6. `csp` and `prefix` by hand on the files in scope (FR-023)

Files: `storybook/stories/spike.stories.ts`, `storybook/.storybook/{main,manager,preview}.ts`,
`.storybook/preview-head.html`, `.storybook/preview.css`, `storybook/.generated/{tokens,swatches}.css`, and the
HTML entries after externalisation, `storybook/dist/iframe.html` and `storybook/dist/index.html` (10 files), laid
out at their repository paths in a scratch root.

| Check | Result |
|---|---|
| `checkOutput` (`gates/bin/csp.ts`, not yet widened: `.html` get the markup rules, `.ts` and `.css` are only counted) | exit 0, "csp: 10 files checked, no finding" |
| `scanScript` by hand on the four `.ts` files (today's JavaScript rules, dynamic code and markup literals) | no finding |
| `scanText` (`gates/bin/prefix.ts`) on all 10 files | no finding |

No inline script, style element or style attribute is left in the HTML entries.

## Outcome

No stop condition holds: no network access at build; zero run-time CSP violations and zero monospace elements in
the chosen configuration; no canvas text; no finding on the files in scope; the shard far under 10 minutes.
Configuration carried into T040:

- `main.ts`: `framework: "@storybook/html-vite"`, `stories: ["../stories/*.stories.ts"]`,
  `staticDirs: ["../.generated"]`, `core: { disableTelemetry: true }`, `features` as in step 2; the build script
  passes `--disable-telemetry`, then runs `externalise.ts` over the output's `*.html`.
- `preview-head.html` links `./tokens.css` and `./swatches.css`; `preview.ts` imports `./preview.css` (step 4) and
  sets `data-theme` on `<html>` from the `theme` global (toolbar item, also settable by `globals=theme:dark`).
- The Storybook page is the preview, `iframe.html`, under
  `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'`.

For the operator: (a) the manager UI is not usable under the CSP (step 2, technique 1), so the reference is the
preview alone and the header has no `frame-src`; (b) `source.ts` yields no mutant at all (step 5).
