# Plants of Phase 2

- base: 18b33aecbbcf5ef85296c4bd8f0e328b762adb60
- candidate: 3ff4e940ae544b0010d0b091602685c858b03823
- selector: `pnpm run gate:plants -- --affected a6ef9048f9ca30f69a32dd9b55e7d4085f154104 --list`
- selector exit: 0

```text
note: affected: contrast/repository-values, by packages/elements/src/anchored-popover-placement.ts
note: affected: brand-rules/repository-values, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/break-missing, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/break-not-json, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-lost-attribute, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-stale-property, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-undescribed-attribute, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-undescribed-css-part, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-undescribed-css-property, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-undescribed-event, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-undescribed-property, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/fail-undescribed-slot, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/pass-reordered, by packages/elements/src/anchored-popover-placement.ts
note: affected: manifest/pass-repository, by packages/elements/src/anchored-popover-placement.ts
note: affected: storybook-build/pass-repository, by packages/elements/src/anchored-popover-placement.ts
note: affected: visual/fail-missing-baseline, by packages/elements/src/anchored-popover-placement.ts
note: affected: visual/fail-one-pixel, by packages/elements/src/anchored-popover-placement.ts
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/src/anchored-popover-placement.ts
note: affected: visual/fail-token-changed, by packages/elements/src/anchored-popover-placement.ts
note: affected: visual/pass-repository, by packages/elements/src/anchored-popover-placement.ts
note: affected: axe/pass-repository, by packages/elements/src/anchored-popover-placement.ts
plants: affected since a6ef9048f9ca30f69a32dd9b55e7d4085f154104: 21 of 326 plants selected, none judged (--list)
```

All 77 standard Plants shards and their aggregate passed on the identical candidate. They judged the full pinned inventory, including every case above. Visual Plants used Docker and Podman. [Exact selector](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162541866/job/141032858555) · [Exact aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162541866/job/141038711232)

- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`
- exit: 0

```text
plants: 326 plants of 18 gates and the registry judged, every plant as expected
```
