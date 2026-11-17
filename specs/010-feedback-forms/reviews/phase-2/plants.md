# Plants of phase 2

- base: 8d46b783aefac5dfab78a74d3fb3dc17cb016eb3
- command: `OCELLE_VISUAL_ENGINE=docker OCELLE_CHROMIUM_PATH=<chromium 1243> pnpm run gate:plants -- --affected 8d46b783aefac5dfab78a74d3fb3dc17cb016eb3`
- exit: 0

Fix round fix-4 (operator round 4, O4-01 and O4-02), run at the fix's working tree on 2026-11-17, 1354 s wall-clock.
The base is the red commit's parent (`8d46b78`), not `base.sha` (`6c9400c`): since `6c9400c` the branch has
changed `gates/bin/plants.ts`, so `--affected 6c9400c` selects every plant ("by gates/bin/plants.ts (shared gate
source)"), an unsharded run of over two hours (a first attempt was stopped for that reason). Against `8d46b78` the
only changed source is `packages/elements/src/ocelle-notice.ts` (a comment), and the selection is the 21 plants below.
The phase's earlier plant run (T023, with its notes on the removed "alert pending tone" row and the timing stop) is this
file's previous version in history (`f307ff7`). CI's Plants check still judges every plant.

```text
$ node gates/bin/plants.ts -- --affected 8d46b783aefac5dfab78a74d3fb3dc17cb016eb3
note: affected: contrast/repository-values, by packages/elements/src/ocelle-notice.ts
note: affected: brand-rules/repository-values, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/break-missing, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/break-not-json, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-lost-attribute, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-stale-property, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-undescribed-attribute, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-undescribed-css-part, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-undescribed-css-property, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-undescribed-event, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-undescribed-property, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/fail-undescribed-slot, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/pass-reordered, by packages/elements/src/ocelle-notice.ts
note: affected: manifest/pass-repository, by packages/elements/src/ocelle-notice.ts
note: affected: storybook-build/pass-repository, by packages/elements/src/ocelle-notice.ts
note: affected: visual/fail-missing-baseline, by packages/elements/src/ocelle-notice.ts
note: affected: visual/fail-one-pixel, by packages/elements/src/ocelle-notice.ts
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/src/ocelle-notice.ts
note: affected: visual/fail-token-changed, by packages/elements/src/ocelle-notice.ts
note: affected: visual/pass-repository, by packages/elements/src/ocelle-notice.ts
note: affected: axe/pass-repository, by packages/elements/src/ocelle-notice.ts
note: plant time: contrast/repository-values: 0.4 s
note: plant time: brand-rules/repository-values: 0.4 s
note: plant time: manifest/break-missing: 1.0 s
note: plant time: manifest/pass-repository: 1.1 s
note: plant time: manifest/break-not-json: 1.7 s
note: plant time: manifest/fail-lost-attribute: 1.9 s
note: plant time: manifest/pass-reordered: 2.6 s
note: plant time: manifest/fail-stale-property: 2.7 s
note: plant time: manifest/fail-undescribed-attribute: 3.3 s
note: plant time: manifest/fail-undescribed-css-property: 3.5 s
note: plant time: manifest/fail-undescribed-event: 4.2 s
note: plant time: manifest/fail-undescribed-property: 4.3 s
note: plant time: manifest/fail-undescribed-slot: 5.0 s
note: plant time: manifest/fail-undescribed-css-part: 5.0 s
note: plant time: storybook-build/pass-repository: 2.4 s
note: plant time: visual/fail-missing-baseline: 223.1 s
note: plant time: visual/fail-one-pixel: 224.1 s
note: plant time: visual/fail-same-pixels-other-bytes: 230.5 s
note: plant time: visual/fail-token-changed: 291.0 s
note: plant time: visual/pass-repository: 234.1 s
note: plant time: axe/pass-repository: 142.9 s
plants: affected since 8d46b783aefac5dfab78a74d3fb3dc17cb016eb3: 21 of 309 plants judged, every plant as expected; not the Plants check
```
