# Plants of phase 2

- base: 79d9ebb0ae29a4a015f1291d176a9163840f714e
- command: OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 303f034669a010d5f73a596d1d4906767dc53d90
- exit: 0
- selection: 21 of 326 Plants

The local run started on `4a4fe0d8df740d0747819af99c0a4a12ada6272b`. Its source, stories, baselines, manifests and Plant definitions are identical at `66da4da78d73cc2d94e6748f188ad4e59fe04a0b`. The latter commit changed one expected count in the seeded Axe integration test. The full hosted Plants check passed on that candidate at tested merge `2f08c51b6c7aefb205c301685f248c21fa3923cd`. [Hosted CI run 46112847765](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46112847765)

Standard output and standard error follow verbatim.

```text
$ node gates/bin/plants.ts -- --affected 303f034669a010d5f73a596d1d4906767dc53d90
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
note: affected: visual/fail-token-changed, by packages/elements/custom-elements.json
note: affected: visual/pass-repository, by packages/elements/custom-elements.json
note: affected: axe/pass-repository, by packages/elements/custom-elements.json
note: plant time: brand-rules/repository-values: 0.4 s
note: plant time: contrast/repository-values: 0.4 s
note: plant time: manifest/break-not-json: 0.9 s
note: plant time: manifest/break-missing: 0.9 s
note: plant time: manifest/fail-lost-attribute: 2.2 s
note: plant time: manifest/fail-stale-property: 2.2 s
note: plant time: manifest/fail-undescribed-attribute: 3.0 s
note: plant time: manifest/fail-undescribed-css-part: 3.0 s
note: plant time: manifest/fail-undescribed-css-property: 4.0 s
note: plant time: manifest/fail-undescribed-event: 4.1 s
note: plant time: manifest/fail-undescribed-slot: 5.0 s
note: plant time: manifest/pass-reordered: 5.1 s
note: plant time: manifest/pass-repository: 6.0 s
note: plant time: manifest/fail-undescribed-property: 6.2 s
note: plant time: storybook-build/pass-repository: 2.2 s
note: plant time: visual/fail-missing-baseline: 1391.8 s
note: plant time: visual/fail-one-pixel: 1027.8 s
note: plant time: visual/fail-same-pixels-other-bytes: 938.8 s
note: plant time: visual/fail-token-changed: 1197.3 s
note: plant time: visual/pass-repository: 952.7 s
note: plant time: axe/pass-repository: 467.5 s
plants: affected since 303f034669a010d5f73a596d1d4906767dc53d90: 21 of 326 plants judged, every plant as expected; not the Plants check
```
