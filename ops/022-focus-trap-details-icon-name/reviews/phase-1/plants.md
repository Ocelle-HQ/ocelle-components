# Plants of phase 1

- base: dd69835e5500a7bf0757b43e542f8d9dc978953f
- command: pnpm run gate:plants -- --affected dd69835e5500a7bf0757b43e542f8d9dc978953f --skip-container
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected dd69835e5500a7bf0757b43e542f8d9dc978953f --skip-container
note: affected: contrast/repository-values, by packages/elements/src/focusable.ts
note: affected: brand-rules/repository-values, by packages/elements/src/focusable.ts
note: affected: manifest/break-missing, by packages/elements/src/focusable.ts
note: affected: manifest/break-not-json, by packages/elements/src/focusable.ts
note: affected: manifest/fail-lost-attribute, by packages/elements/src/focusable.ts
note: affected: manifest/fail-stale-property, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-attribute, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-css-part, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-css-property, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-event, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-property, by packages/elements/src/focusable.ts
note: affected: manifest/fail-undescribed-slot, by packages/elements/src/focusable.ts
note: affected: manifest/pass-reordered, by packages/elements/src/focusable.ts
note: affected: manifest/pass-repository, by packages/elements/src/focusable.ts
note: affected: storybook-build/pass-repository, by packages/elements/src/focusable.ts
note: affected: visual/fail-missing-baseline, by packages/elements/src/focusable.ts
note: affected: visual/fail-one-pixel, by packages/elements/src/focusable.ts
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/src/focusable.ts
note: affected: visual/fail-token-changed, by packages/elements/src/focusable.ts
note: affected: visual/pass-repository, by packages/elements/src/focusable.ts
note: affected: axe/pass-repository, by packages/elements/src/focusable.ts
note: plant time: brand-rules/repository-values: 0.6 s
note: plant time: contrast/repository-values: 0.7 s
note: plant time: manifest/break-missing: 1.5 s
note: plant time: manifest/pass-repository: 1.7 s
note: plant time: manifest/break-not-json: 2.5 s
note: plant time: manifest/fail-lost-attribute: 2.9 s
note: plant time: manifest/pass-reordered: 3.7 s
note: plant time: manifest/fail-undescribed-attribute: 4.0 s
note: plant time: manifest/fail-stale-property: 4.8 s
note: plant time: manifest/fail-undescribed-css-part: 4.9 s
note: plant time: manifest/fail-undescribed-css-property: 5.9 s
note: plant time: manifest/fail-undescribed-event: 6.0 s
note: plant time: manifest/fail-undescribed-property: 7.0 s
note: plant time: manifest/fail-undescribed-slot: 7.0 s
note: plant time: storybook-build/pass-repository: 2.4 s
note: plant time: axe/pass-repository: 248.0 s
plants: skipped (no container): gates/plants/visual/fail-missing-baseline
plants: skipped (no container): gates/plants/visual/fail-one-pixel
plants: skipped (no container): gates/plants/visual/fail-same-pixels-other-bytes
plants: skipped (no container): gates/plants/visual/fail-token-changed
plants: skipped (no container): gates/plants/visual/pass-repository
plants: affected since dd69835e5500a7bf0757b43e542f8d9dc978953f: 16 of 317 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```
