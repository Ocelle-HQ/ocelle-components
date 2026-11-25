# Plants of phase 3

- base: `5cd17445bbe9cad02200548885d1e15ddfbc946a`
- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` (hosted full Plants job)
- exit: 0
- Candidate `948c01faf02870fb69f355acd19a272f874044c5`, checked as merge `9c81bf8d033fc195fb2582ceef3beefa37e8b797`. [Hosted Plants result](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137876348201)

The local selector identified 21 affected plants. The hosted aggregation judged all 317 plants from their shard reports.

```text
$ pnpm run gate:plants -- --affected 5cd17445bbe9cad02200548885d1e15ddfbc946a --list
$ node gates/bin/plants.ts -- --affected 5cd17445bbe9cad02200548885d1e15ddfbc946a --list
note: affected: contrast/repository-values, by packages/elements/custom-elements.json
note: affected: brand-rules/repository-values, by packages/elements/custom-elements.json
note: affected: manifest/break-missing, by packages/elements/custom-elements.json
note: affected: manifest/break-not-json, by packages/elements/custom-elements.json
note: affected: manifest/fail-lost-attribute, by gates/plants/manifest/fail-lost-attribute/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-stale-property, by packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-attribute, by gates/plants/manifest/fail-undescribed-attribute/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-css-part, by gates/plants/manifest/fail-undescribed-css-part/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-css-property, by gates/plants/manifest/fail-undescribed-css-property/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-event, by gates/plants/manifest/fail-undescribed-event/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-property, by gates/plants/manifest/fail-undescribed-property/tree/packages/elements/custom-elements.json
note: affected: manifest/fail-undescribed-slot, by gates/plants/manifest/fail-undescribed-slot/tree/packages/elements/custom-elements.json
note: affected: manifest/pass-reordered, by gates/plants/manifest/pass-reordered/tree/packages/elements/custom-elements.json
note: affected: manifest/pass-repository, by packages/elements/custom-elements.json
note: affected: storybook-build/pass-repository, by packages/elements/custom-elements.json
note: affected: visual/fail-missing-baseline, by packages/elements/custom-elements.json
note: affected: visual/fail-one-pixel, by packages/elements/custom-elements.json
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/custom-elements.json
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by packages/elements/custom-elements.json
note: affected: axe/pass-repository, by packages/elements/custom-elements.json
plants: affected since 5cd17445bbe9cad02200548885d1e15ddfbc946a: 21 of 317 plants selected, none judged (--list)
```

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```
