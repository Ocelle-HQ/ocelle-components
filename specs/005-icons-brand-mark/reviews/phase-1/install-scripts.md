# Phase 1: install-script verification (T009, research.md R-16)

Container: Linux x64 (glibc), Node 22.23.4, pnpm 12.16.1, 2026-11-10. Lockfile as committed in the phase 1 green
commit (`lit` 3.3.3 in `packages/elements`, `@custom-elements-manifest/analyzer` 0.11.0 at the root), `allowBuilds`
holding `esbuild: false`, `"rs-module-lexer@2.9.0": true` and `"fsevents@2.3.3": true`.

## Method

1. Non-frozen `pnpm install` after the pin change (T008): resolved the analyzer's tree from the registry and wrote
   `pnpm-lock.yaml` (+32 packages, among them `rs-module-lexer@2.9.0`, the nine `@xn-sakina/rml-<platform>@2.9.0`
   optional bindings, `lit@3.3.3`, `lit-html@3.3.3`, `lit-element@4.2.2`, `@lit/reactive-element@2.1.2`). pnpm
   reported `✓ Lockfile passes supply-chain policies` (the release-age policy).
2. Every `node_modules` removed (`node_modules`, `packages/*/node_modules`, `storybook/node_modules`), then
   `pnpm install --frozen-lockfile` from a clean tree, with a directory first on `PATH` holding an `npm` shim that
   appends each call to a log file and exits 1. So any `npm install` by the postinstall would be recorded (and fail).

## Results

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` (clean tree) | exit 0; 501 packages; `.../node_modules/rs-module-lexer postinstall$ node postinstall.js` then `postinstall: Done`; no other build script ran |
| `rs-module-lexer`'s native binding loads | yes: `require(".../rs-module-lexer/binding").getTargetTriple()` returns `x86_64-unknown-linux-gnu`; the package exports `parse`, `parseAsync`, `getTargetTriple`, `ImportType`; the binding is `@xn-sakina/rml-linux-x64-gnu@2.9.0` (`rs-module-lexer.linux-x64-gnu.node`) |
| No `npm install` ran | the `npm` shim's log file was never created (zero calls); no `npm-install` directory anywhere under `node_modules` |
| `@xn-sakina/rml-wasm` absent | absent: no `@xn-sakina+rml-wasm*` entry in `node_modules/.pnpm`, no `node_modules/@xn-sakina/` at the root |
| `fsevents` absent on Linux | absent: no `fsevents*` entry in `node_modules/.pnpm` (its `os: ["darwin"]`), so its script cannot run here |
| `pnpm run setup:offline` | exit 0: `setup: installed offline; Chromium at /opt/pw-browsers/chromium-1243/chrome-linux64/chrome` |
| `pnpm run gate:pins` | exit 0: `pins: 5 manifests checked, no finding` |

The postinstall reads (published `postinstall.js` of 2.9.0, as R-16 describes): it returns at once when
`require('./binding')` yields a target triple; only without a binding, without `RS_MODULE_LEXER_BINARY_PATH` and
without an installed wasm package does it run `npm install --no-save ... @xn-sakina/rml-wasm@2.9.0`. Here the first
branch is taken.

## Not verified

- **macOS**: unverified. The repository has no macOS runner. There `fsevents@2.3.3` is installed and its
  `install: node-gyp rebuild` runs (needs a C/C++ toolchain; `node-gyp` may fetch Node's headers from nodejs.org), and
  `rs-module-lexer` loads `@xn-sakina/rml-darwin-<arch>`. Both rest on the published scripts (R-16) and are recorded
  as residual risks in the `pins` row of `gates/README.md`.
- **Node 26.13.0** (CI's pin, `.node-version`): not available in this container; the same checks run in CI's install
  job and in the phase 2 spike (R-16 *Verification*).
