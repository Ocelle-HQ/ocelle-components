# Plants of phase 3

- Base `786dbb41d487540d38be3710d0aff799f2f53171`
- Selector `pnpm run gate:plants -- --affected 786dbb41d487540d38be3710d0aff799f2f53171 --list`
- Exit 0

```text
$ node gates/bin/plants.ts -- --affected 786dbb41d487540d38be3710d0aff799f2f53171 --list
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
plants: affected since 786dbb41d487540d38be3710d0aff799f2f53171: 21 of 317 plants selected, none judged (--list)
```

## Local execution

- Command `pnpm run gate:plants -- --affected 786dbb41d487540d38be3710d0aff799f2f53171 --skip-container`
- Exit 1 on the initial overlays

The Axe repository Plant took 689.3s and matched its expected verdict. Seven manifest overlays exposed an additional stale-export finding because the typed event also adds a per-element manifest export. The five visual Plants require the pinned container engines.

```text
$ node gates/bin/plants.ts -- --affected 786dbb41d487540d38be3710d0aff799f2f53171 --skip-container
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
note: plant time: contrast/repository-values: 0.5 s
note: plant time: brand-rules/repository-values: 0.5 s
note: plant time: manifest/break-missing: 1.1 s
note: plant time: manifest/break-not-json: 1.3 s
note: plant time: manifest/fail-lost-attribute: 2.9 s
note: plant time: manifest/fail-stale-property: 3.0 s
note: plant time: manifest/fail-undescribed-css-part: 4.5 s
note: plant time: manifest/fail-undescribed-attribute: 4.6 s
note: plant time: manifest/fail-undescribed-css-property: 6.0 s
note: plant time: manifest/fail-undescribed-event: 6.1 s
note: plant time: manifest/fail-undescribed-slot: 7.3 s
note: plant time: manifest/fail-undescribed-property: 7.3 s
note: plant time: manifest/pass-repository: 8.5 s
note: plant time: manifest/pass-reordered: 8.6 s
note: plant time: storybook-build/pass-repository: 2.8 s
note: plant time: axe/pass-repository: 689.3 s
plants: skipped (no container): gates/plants/visual/fail-missing-baseline
plants: skipped (no container): gates/plants/visual/fail-one-pixel
plants: skipped (no container): gates/plants/visual/fail-same-pixels-other-bytes
plants: skipped (no container): gates/plants/visual/fail-token-changed
plants: skipped (no container): gates/plants/visual/pass-repository
gates/plants/manifest/fail-undescribed-attribute: plants: not-caught: findings differ: unexpected packages/elements/custom-elements.json stale
gates/plants/manifest/fail-undescribed-css-part: plants: not-caught: findings differ: unexpected packages/elements/custom-elements.json stale
gates/plants/manifest/fail-undescribed-css-property: plants: not-caught: findings differ: unexpected packages/elements/custom-elements.json stale
gates/plants/manifest/fail-undescribed-event: plants: not-caught: findings differ: unexpected packages/elements/custom-elements.json stale
gates/plants/manifest/fail-undescribed-property: plants: not-caught: findings differ: unexpected packages/elements/custom-elements.json stale
gates/plants/manifest/fail-undescribed-slot: plants: not-caught: findings differ: unexpected packages/elements/custom-elements.json stale
gates/plants/manifest/pass-reordered: plants: not-accepted: expected exit 0 with no finding, got exit 1 (packages/elements/custom-elements.json stale)
plants: 7 problems in 16 plants (affected since 786dbb41d487540d38be3710d0aff799f2f53171; not the Plants check); partial run: 5 visual plants not run
[ELIFECYCLE] Command failed with exit code 1.
```

Each of the eight corrected overlays was rebuilt with `buildRepoTree` and run through the repository manifest gate. The resulting exit and complete finding list matched its unchanged Plant expectation.

```text
fail-lost-attribute: fail as planted (1 exact findings)
fail-undescribed-attribute: fail as planted (1 exact findings)
fail-undescribed-css-part: fail as planted (1 exact findings)
fail-undescribed-css-property: fail as planted (1 exact findings)
fail-undescribed-event: fail as planted (1 exact findings)
fail-undescribed-property: fail as planted (1 exact findings)
fail-undescribed-slot: fail as planted (1 exact findings)
pass-reordered: pass as planted (0 exact findings)
```

The full hosted Plants verdict on the exact Phase 3 candidate is pending.

## Corrected local affected run

Signed `b150795e880d360d38204171baffe252990735db` exited 0. All 16 available selected cases matched their expected verdicts. The repository Axe Plant took 454.7s. The five visual Plants require the pinned container engines.

```text
$ node gates/bin/plants.ts -- --affected 786dbb41d487540d38be3710d0aff799f2f53171 --skip-container
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
note: plant time: contrast/repository-values: 1.0 s
note: plant time: brand-rules/repository-values: 1.0 s
note: plant time: manifest/break-not-json: 1.8 s
note: plant time: manifest/break-missing: 1.9 s
note: plant time: manifest/fail-stale-property: 3.4 s
note: plant time: manifest/fail-lost-attribute: 3.6 s
note: plant time: manifest/fail-undescribed-attribute: 4.6 s
note: plant time: manifest/fail-undescribed-css-property: 4.7 s
note: plant time: manifest/fail-undescribed-event: 6.2 s
note: plant time: manifest/fail-undescribed-css-part: 6.2 s
note: plant time: manifest/fail-undescribed-property: 7.3 s
note: plant time: manifest/fail-undescribed-slot: 7.4 s
note: plant time: manifest/pass-reordered: 9.0 s
note: plant time: manifest/pass-repository: 9.0 s
note: plant time: storybook-build/pass-repository: 3.8 s
note: plant time: axe/pass-repository: 454.7 s
plants: skipped (no container): gates/plants/visual/fail-missing-baseline
plants: skipped (no container): gates/plants/visual/fail-one-pixel
plants: skipped (no container): gates/plants/visual/fail-same-pixels-other-bytes
plants: skipped (no container): gates/plants/visual/fail-token-changed
plants: skipped (no container): gates/plants/visual/pass-repository
plants: affected since 786dbb41d487540d38be3710d0aff799f2f53171: 16 of 317 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```
