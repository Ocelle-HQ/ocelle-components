# Plants of phase 4

- base: 3e263aa1ae1ae8b671347bcda5997583cc5d3771
- hosted verdict: pnpm run gate:plants -- --verdict storybook/.visual/plant-shards
- exit: 0 (hosted aggregate)

Local affected selection for this phase:

```text
$ node gates/bin/plants.ts -- --affected 3e263aa1ae1ae8b671347bcda5997583cc5d3771 --list
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
plants: affected since 3e263aa1ae1ae8b671347bcda5997583cc5d3771: 21 of 317 plants selected, none judged (--list)
```

The hosted aggregate at `4e2c898` passed the full set, covering this selection.

[Hosted Plants verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44976411157/job/137071300281)
