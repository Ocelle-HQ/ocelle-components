# Contract: checks added or changed by 005

## New gate `manifest`

| | |
|---|---|
| Command | `pnpm run gate:manifest` (`gates/bin/manifest.ts`), `--root <dir>` |
| CI check | "Custom-elements manifest" (own job in `.github/workflows/ci.yml`); a required check once the operator adds it to the ruleset on `main`, which makes fifteen required checks (`gates/README.md` § Required checks and the `gates/lib/registry.ts` comment change from fourteen) |
| Tool | `@custom-elements-manifest/analyzer` 0.11.0, a root devDependency, so it resolves from `gates/bin` and in plant trees |
| Checks | the committed `packages/elements/custom-elements.json` equals the manifest `packages/elements/scripts/manifest.ts` generates from `packages/elements/src/ocelle-*.ts`; every public member of the six kinds has a non-empty description |
| Exit 1 | `stale` (per differing member, or whole file), `no-description` (per member) |
| Exit 2 | manifest missing or not JSON; source cannot be analysed |
| Fail plants | `fail-stale-property`, `fail-lost-attribute`, `fail-undescribed-property`, `fail-undescribed-attribute`, `fail-undescribed-event`, `fail-undescribed-slot`, `fail-undescribed-css-part`, `fail-undescribed-css-property` |
| Pass plants | `pass-repository` (the configuration set alone, which holds the element source, generator and manifest), `pass-reordered`; a gates-integration expectation that `pass-repository` exits 0 in a built plant tree |
| Breaking plants | `break-not-json`, `break-missing` |
| Registry | `gates/gates.json`, `gates/lib/registry.ts` (FR-020 list), `gates/README.md` row |

## Changed

| Check | Change |
|---|---|
| `style-lint` (`ocelle/token-only`) | exact values only: `scale` takes `-1` and `1` (plants `pass-scale-mirror`, `fail-scale-factor` with `scale: 2`, `fail-scale-length` with `scale: 2px 1`); `aspect-ratio` takes `1` (plants `pass-aspect-square`, `fail-aspect-ratio-other` with `aspect-ratio: 2`); the unit `lh` only as `1lh` (plants `pass-one-line`, `fail-lh-multiple` with `block-size: 2lh`) (research.md R-03) |
| `mutation` | changed `packages/elements/src/**` ranges run under `stryker.elements.config.json` (elements project only), other ranges under `stryker.config.json`, results merged; the default Vitest mutation config excludes `elements`, `elements-build` and `elements-browser`; plants `pass-element-source`, `fail-element-source-survivor`, `fail-element-source-no-coverage`, `fail-mixed-survivors` (R-12) |
| plant repositories (`gates/lib/plant-repo.ts`) | the configuration set gains `stryker.elements.config.json`, `vitest.mutation.elements.config.ts` (also matched by `configurationName`) and the element files `packages/elements/src`, `packages/elements/scripts/manifest.ts`, `packages/elements/custom-elements-manifest.config.mjs`, `packages/elements/custom-elements.json`; plant trees also link each package's `node_modules`; `gates/test/plant-repo.test.ts` and the gates-integration plant-repo test change first (R-12) |
| `contrast` | 13 new rows (160 light, 168 dark, 328 entries); the pinned counts change first in `gates/test/contrast-pairs.test.ts`, `gates/test/contrast.test.ts`, `gates/test/integration/plants-robustness.test.ts`, `gates/test/integration/token-gates.test.ts`, and the record comment in `gates/bin/contrast.ts` (R-09) |
| `unit-tests` | new Vitest projects `elements-node`, `elements-build` and `elements-browser`; `elements` excludes `test/node/**`, `test/build/**` and `test/browser/**`; `gates/test/vitest-config.test.ts` changes first |
| `csp`, `prefix` | no change of rules; their scope (`packages/*/dist/**`) now holds the module build and the browser build |
| `pins` | new exact pins `lit` 3.3.3 (dependency of `@ocelle/elements`), `@custom-elements-manifest/analyzer` 0.11.0 (root dev). Rule `allow-builds`: an entry set to `true` is a finding unless it is in the gate's approved list, exactly `rs-module-lexer@2.9.0` (operator decision, PLAN-A11Y-SECURITY-1-005 (c)); `pnpm-workspace.yaml` gains that entry; plants `pass-approved-build`, `fail-allow-builds-unpinned-approval` (`rs-module-lexer: true`), `fail-allow-builds-other-version` (`"rs-module-lexer@2.9.1": true`), the existing `fail-allow-builds-entry` kept; `gates/README.md` pins row and an amendment note in 001's research.md R-04 (R-16) |

## Package tests (`@ocelle/elements`)

| File | Project | Proves |
|---|---|---|
| `test/scenarios/*.ts` | (imported by both harnesses) | the shared scenario bodies and the driver interface: every browser scenario of the spec once |
| `test/*.test.ts` | `elements` (browser mode, mutated) | the scenario bodies on source: drawing, size, colour, naming via `axTree`, forced colours via `emulateForcedColors` (text, link, button, disabled button), mirroring pixels, slot convention on `ocelle-test-host`; `define.test.ts` (FR-006), `entry-icon.test.ts` and `entry-root.test.ts` (FR-002, US1-17), the expected-table test per icon (R-07) |
| `test/browser/*.test.ts` | `elements-browser` (Node + Playwright) | the same scenario bodies on the built browser build on strict-CSP fixture pages, each with zero violations (`addInitScript` collector), allowed requests only and no console message; plus upgrade after server HTML (US1-15), double definition (US1-10), US1-17's runtime half, US1-8's console check, US1-14's 500-icon request check, the slot convention with the test-host bundle, and a control page for the collector |
| `test/node/manifest.test.ts` | `elements-node` (mutated) | the generator's normalisation (empty lists, `IconName` union, `aria-label` dropped) and the generated manifest's `tagName`, defaults and schema version |
| `test/node/brand-pairs.test.ts` | `elements-node` (mutated) | FR-026 pairing, with its removed-row plant |
| `test/node/readme.test.ts` | `elements-node` (mutated) | the documentation statements of the spec |
| `test/node/vite-config.test.ts` | `elements-node` (mutated) | the browser build's configuration: entry, format, file name, `emptyOutDir`, no externals, no `development` condition, the banner |
| `test/build/build.test.ts` | `elements-build` (not mutated) | module build imports only own files and `lit`, and an element's module imports neither the root nor the other element; browser build self-contained, production Lit, no console call, starts with the licence banner |
| `test/build/pack.test.ts` | `elements-build` (not mutated) | packed file list holds `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES` and the browser build's file |
