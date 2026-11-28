# Plants of phase 1

- base: aee31975f93b764512109c4ea8ba2dbfb2976f1b
- command: OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected aee31975f93b764512109c4ea8ba2dbfb2976f1b
- exit: 0
- selection: 21 of 326 Plants

The full required hosted Plants job passed on candidate `0fd302f6392cb71953a4e4e92c7b80e602e12b36`, tested merge `fdb917eccb7cb6816785f90535431c9324cf28ca`. [Hosted CI run 46100810218](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46100810218)

The command completed locally under pinned Docker. Standard output and standard error follow verbatim.

```text
$ node gates/bin/plants.ts -- --affected aee31975f93b764512109c4ea8ba2dbfb2976f1b
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
note: plant time: manifest/break-missing: 1.0 s
note: plant time: manifest/fail-lost-attribute: 1.4 s
note: plant time: manifest/fail-stale-property: 2.9 s
note: plant time: manifest/fail-undescribed-attribute: 3.2 s
note: plant time: manifest/break-not-json: 3.8 s
note: plant time: manifest/fail-undescribed-css-part: 3.9 s
note: plant time: manifest/fail-undescribed-css-property: 5.4 s
note: plant time: manifest/fail-undescribed-property: 5.5 s
note: plant time: manifest/fail-undescribed-slot: 6.5 s
note: plant time: manifest/fail-undescribed-event: 6.8 s
note: plant time: manifest/pass-reordered: 8.2 s
note: plant time: manifest/pass-repository: 8.2 s
note: plant time: storybook-build/pass-repository: 4.4 s
note: plant time: visual/fail-missing-baseline: 1116.0 s
note: plant time: visual/fail-one-pixel: 1168.0 s
note: plant time: visual/fail-same-pixels-other-bytes: 1118.3 s
note: plant time: visual/fail-token-changed: 1344.9 s
note: plant time: visual/pass-repository: 1392.3 s
note: plant time: axe/pass-repository: 519.2 s
plants: affected since aee31975f93b764512109c4ea8ba2dbfb2976f1b: 21 of 326 plants judged, every plant as expected; not the Plants check
```
