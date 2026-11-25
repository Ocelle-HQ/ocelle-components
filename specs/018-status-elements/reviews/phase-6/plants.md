# Plants of phase 6

- base: c2731a36106984d8f27d29b9b0a0af52c15f70e3
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-6/base.sha)`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected c2731a36106984d8f27d29b9b0a0af52c15f70e3
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
note: plant time: contrast/repository-values: 0.3 s
note: plant time: brand-rules/repository-values: 0.4 s
note: plant time: manifest/break-not-json: 1.1 s
note: plant time: manifest/break-missing: 1.1 s
note: plant time: manifest/fail-stale-property: 1.8 s
note: plant time: manifest/fail-lost-attribute: 1.8 s
note: plant time: manifest/fail-undescribed-attribute: 2.6 s
note: plant time: manifest/fail-undescribed-css-part: 2.7 s
note: plant time: manifest/fail-undescribed-css-property: 3.4 s
note: plant time: manifest/fail-undescribed-event: 3.5 s
note: plant time: manifest/fail-undescribed-property: 4.2 s
note: plant time: manifest/fail-undescribed-slot: 4.2 s
note: plant time: manifest/pass-repository: 5.0 s
note: plant time: manifest/pass-reordered: 5.0 s
note: plant time: storybook-build/pass-repository: 5.6 s
note: plant time: visual/fail-missing-baseline: 566.9 s
note: plant time: visual/fail-one-pixel: 542.5 s
note: plant time: visual/fail-same-pixels-other-bytes: 555.5 s
note: plant time: visual/fail-token-changed: 729.5 s
note: plant time: visual/pass-repository: 539.7 s
note: plant time: axe/pass-repository: 357.0 s
plants: affected since c2731a36106984d8f27d29b9b0a0af52c15f70e3: 21 of 317 plants judged, every plant as expected; not the Plants check
```
