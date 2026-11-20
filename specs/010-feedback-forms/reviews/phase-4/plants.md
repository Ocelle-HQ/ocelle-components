# Plants of phase 4

- base: 68f46083a325702a91f0f78b215a8aaabc59cf85
- command: `OCELLE_VISUAL_ENGINE=docker OCELLE_CHROMIUM_PATH=<chromium 1243> pnpm run gate:plants -- --affected 68f46083a325702a91f0f78b215a8aaabc59cf85`
- exit: 0

Fix round fix-2 (operator round 2, O2-01), run at the fix's working tree on 2026-11-17, 1248 s wall-clock. The base is
the red commit's parent (`68f4608`), not `base.sha` (`835df81`): since `835df81` the branch has merged `main`, which
changed `gates/bin/plants.ts`, so `--affected 835df81` selects every plant (309 of 309, "by gates/bin/plants.ts (shared
gate source)"; checked with `--list`), an unsharded run of over two hours. Against `68f4608` the only changed source
is `packages/elements/src/ocelle-form-select.ts`, and the selection is the 21 plants below. The phase's earlier plant
run (T056, 301 plants judged at `5908fa7`) is this file's previous version in history. CI's Plants check still judges
every plant.

```text
$ node gates/bin/plants.ts -- --affected 68f46083a325702a91f0f78b215a8aaabc59cf85
note: affected: contrast/repository-values, by packages/elements/src/ocelle-form-select.ts
note: affected: brand-rules/repository-values, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/break-missing, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/break-not-json, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-lost-attribute, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-stale-property, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-undescribed-attribute, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-undescribed-css-part, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-undescribed-css-property, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-undescribed-event, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-undescribed-property, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/fail-undescribed-slot, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/pass-reordered, by packages/elements/src/ocelle-form-select.ts
note: affected: manifest/pass-repository, by packages/elements/src/ocelle-form-select.ts
note: affected: storybook-build/pass-repository, by packages/elements/src/ocelle-form-select.ts
note: affected: visual/fail-missing-baseline, by packages/elements/src/ocelle-form-select.ts
note: affected: visual/fail-one-pixel, by packages/elements/src/ocelle-form-select.ts
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/src/ocelle-form-select.ts
note: affected: visual/fail-token-changed, by packages/elements/src/ocelle-form-select.ts
note: affected: visual/pass-repository, by packages/elements/src/ocelle-form-select.ts
note: affected: axe/pass-repository, by packages/elements/src/ocelle-form-select.ts
note: plant time: brand-rules/repository-values: 0.4 s
note: plant time: contrast/repository-values: 0.4 s
note: plant time: manifest/break-missing: 0.9 s
note: plant time: manifest/pass-repository: 1.1 s
note: plant time: manifest/break-not-json: 1.5 s
note: plant time: manifest/fail-lost-attribute: 1.9 s
note: plant time: manifest/pass-reordered: 2.2 s
note: plant time: manifest/fail-stale-property: 2.7 s
note: plant time: manifest/fail-undescribed-attribute: 2.9 s
note: plant time: manifest/fail-undescribed-css-part: 3.7 s
note: plant time: manifest/fail-undescribed-event: 3.8 s
note: plant time: manifest/fail-undescribed-css-property: 4.5 s
note: plant time: manifest/fail-undescribed-property: 4.6 s
note: plant time: manifest/fail-undescribed-slot: 5.2 s
note: plant time: storybook-build/pass-repository: 1.9 s
note: plant time: visual/fail-missing-baseline: 202.7 s
note: plant time: visual/fail-one-pixel: 206.1 s
note: plant time: visual/fail-same-pixels-other-bytes: 203.8 s
note: plant time: visual/fail-token-changed: 270.7 s
note: plant time: visual/pass-repository: 216.8 s
note: plant time: axe/pass-repository: 140.0 s
plants: affected since 68f46083a325702a91f0f78b215a8aaabc59cf85: 21 of 309 plants judged, every plant as expected; not the Plants check
```
