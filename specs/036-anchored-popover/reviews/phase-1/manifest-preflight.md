# Phase 1 manifest preflight

The inventory is pinned to phase base `58a38e180433d2b1eb748ac321e1234acd761c4b`. With Node `26.13.0` and pnpm
`12.16.1`, `pnpm --filter @ocelle/elements run manifest` exited `0` and generated the package manifest from the Phase 1
source at `f046dfa614d573d66a0d76fdd6438895f2e9b4ce`. The initial preflight found eight tracked full overlays and one
extra stale finding for `ocelle-anchored-popover` in each. Refreshing the generated module in each overlay restored the
original results. The `pass-reordered` addition reverses object keys while preserving array order.

The regression commit `3dd2d1365c5397586ed81740ee4a1f1c435e1fcd` had one assertion failure and 63 passing manifest
tests. The analyzer reported `view` and `listeners` from a private callback as module declarations. The corrected
source makes the module declare only `OcelleAnchoredPopover`. Regeneration removed those two variable entries from
the package snapshot and the eight overlays.

`node tooling/speckit/bin/component-preflight.ts manifest --base 58a38e180433d2b1eb748ac321e1234acd761c4b` exited `0`.
All eight full overlays matched their raw expected findings with no missing snapshots or unexpected or missing findings.

| Manifest Plant | Raw finding |
| --- | --- |
| `fail-lost-attribute` | `packages/elements/custom-elements.json: manifest: stale: ocelle-icon.attribute.label differs from the generated manifest` |
| `fail-undescribed-attribute` | `packages/elements/src/ocelle-plant.ts: manifest: no-description: ocelle-plant.attribute.tone has no description` |
| `fail-undescribed-css-part` | `packages/elements/src/ocelle-plant.ts: manifest: no-description: ocelle-plant.css-part.drawing has no description` |
| `fail-undescribed-css-property` | `packages/elements/src/ocelle-plant.ts: manifest: no-description: ocelle-plant.css-property.--ocelle-plant-gap has no description` |
| `fail-undescribed-event` | `packages/elements/src/ocelle-plant.ts: manifest: no-description: ocelle-plant.event.ocelle-plant-change has no description` |
| `fail-undescribed-property` | `packages/elements/src/ocelle-plant.ts: manifest: no-description: ocelle-plant.property.tone has no description` |
| `fail-undescribed-slot` | `packages/elements/src/ocelle-plant.ts: manifest: no-description: ocelle-plant.slot.icon has no description` |
| `pass-reordered` | No findings |

The `break-not-json` snapshot retains phase-base blob `98232c64fce9360c79f119cf6de8f670f69f1c44`.
`node gates/bin/manifest.ts` exited `0` and reported 50 elements checked with no findings.

The focused checks used Vitest `5.0.5` and ran serially on CPU `0`.

| Vitest project | Focused tests | Result | Exit |
| --- | --- | --- | --- |
| `elements-node` | `node/manifest.test.ts`, `node/readme.test.ts` | 1,215 passed | `0` |
| `elements-build` | `build/build.test.ts`, `build/pack.test.ts` | 48 passed | `0` |
| `elements (chromium)` | `entry-root.test.ts`, `entry-anchored-popover.test.ts`, `exports.test.ts` | 18 passed | `0` |
