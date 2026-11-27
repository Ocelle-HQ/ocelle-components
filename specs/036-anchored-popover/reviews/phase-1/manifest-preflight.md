# Phase 1 manifest preflight

The inventory is pinned to phase base `58a38e180433d2b1eb748ac321e1234acd761c4b`. With Node `26.13.0` and pnpm
`12.16.1`, `pnpm --filter @ocelle/elements run manifest` generated the package manifest from the Phase 1 source at
`cb6b2405d98fa8152c4a894cdf844fc481c4a4d9`. The initial preflight found eight tracked full overlays and one extra
stale finding for `ocelle-anchored-popover` in each. Adding the generated module to each overlay restored the original
results. The `pass-reordered` addition reverses object keys while leaving array order unchanged.

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

| Vitest project | Focused tests | Result |
| --- | --- | --- |
| `elements-node` | Manifest and README | 1,214 passed |
| `elements-build` | Build and pack | 48 passed |
| `elements (chromium)` | Root and standalone imports and exports | 18 passed |

The generated module at this local checkpoint includes `view` and `listeners` as non-exported variable declarations.
Both originate inside a private callback. The package snapshot and overlays must be regenerated after the source repair
and the manifest regression assertion must pass before publishing.
