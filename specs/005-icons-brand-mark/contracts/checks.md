# Contract: checks added or changed by 005

## New gate `manifest`

| | |
|---|---|
| Command | `pnpm run gate:manifest` (`gates/bin/manifest.ts`), `--root <dir>` |
| CI check | "Custom-elements manifest" (own job in `.github/workflows/ci.yml`) |
| Checks | the committed `packages/elements/custom-elements.json` equals the manifest `packages/elements/scripts/manifest.ts` generates from `packages/elements/src/ocelle-*.ts`; every public member of the six kinds has a non-empty description |
| Exit 1 | `stale` (per differing member, or whole file), `no-description` (per member) |
| Exit 2 | manifest missing or not JSON; source cannot be analysed |
| Fail plants | `fail-stale-property`, `fail-lost-attribute`, `fail-undescribed-property`, `fail-undescribed-attribute`, `fail-undescribed-event`, `fail-undescribed-slot`, `fail-undescribed-css-part`, `fail-undescribed-css-property` |
| Pass plants | `pass-repository`, `pass-reordered` |
| Breaking plants | `break-not-json`, `break-missing` |
| Registry | `gates/gates.json`, `gates/lib/registry.ts` (FR-020 list), `gates/README.md` row |

## Changed

| Check | Change |
|---|---|
| `style-lint` (`ocelle/token-only`) | `scale` takes unitless numbers; pass plant `pass-scale-mirror`, fail plant `fail-scale-length` |
| `mutation` | changed `packages/elements/src/**` ranges run under `stryker.elements.config.json` (elements project only); pass plant `pass-element-source` |
| `contrast` | 13 new rows (160 light, 168 dark); the pinned counts in `gates/test/integration/token-gates.test.ts` follow |
| `unit-tests` | new Vitest projects `elements-node` and `elements-browser`; `elements` excludes `test/browser/**` and `test/node/**`; `vitest.mutation.config.ts` excludes `elements-browser` |
| `csp`, `prefix` | no change of rules; their scope (`packages/*/dist/**`) now holds the module build and the browser build |
| `pins` | new exact pins `lit` 3.3.3 (dependency), `@custom-elements-manifest/analyzer` 0.11.0 (dev) |

## Package tests (`@ocelle/elements`)

| File | Project | Proves |
|---|---|---|
| `test/*.test.ts` | `elements` (browser mode, mutated) | element behaviour on source: drawing, size, colour, naming via `axTree`, forced colours via `emulateForcedColors`, mirroring pixels, slot convention on `ocelle-test-host`, registration |
| `test/browser/*.test.ts` | `elements-browser` (Node + Playwright) | the built browser build on strict-CSP fixture pages: zero violations, allowed requests only, sizes, upgrade after server HTML, double definition (US1-10), slot convention with the test-host bundle |
| `test/node/build.test.ts` | `elements-node` | module build imports only own files and `lit`; browser build self-contained, production Lit, no console call |
| `test/node/manifest.test.ts` | `elements-node` | the generator's normalisation (empty lists, `IconName` union) |
| `test/node/brand-pairs.test.ts` | `elements-node` | FR-026 pairing, with its removed-row plant |
| `test/node/readme.test.ts` | `elements-node` | the documentation statements of the spec |
| `test/node/pack.test.ts` | `elements-node` | packed file list holds `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES` |
