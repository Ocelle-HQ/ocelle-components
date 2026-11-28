# Plants of Phase 2

Previous candidate receipt. The current candidate is running the same selection and full gate again. [Current run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162541866)

- base: a6ef9048f9ca30f69a32dd9b55e7d4085f154104
- candidate: f4fc2e8bbf2ab1c30b2513fbb0078bfe81440a5f
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

The selector recorded 21 affected Plants. The repository's standard sharded workflow judged the full inventory, including all 21, on the identical candidate with Docker and Podman for Visual Plants. All 77 shards and the aggregate passed. [Selection](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158758007/job/141021118919) · [Complete Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158758007/job/141026461453)

- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`
- exit: 0

```text
plants: 326 plants of 18 gates and the registry judged, every plant as expected
```
