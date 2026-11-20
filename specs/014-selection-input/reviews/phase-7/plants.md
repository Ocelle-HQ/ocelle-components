# Plants of phase 7

- base: ea7eca6^ (a84a3e1f5ae47034c72f1adb20337af990150566, the parent of the first fix-2 red commit, as T114 step 5 names it; review round 2, fix-2)
- command: pnpm run gate:plants -- --affected ea7eca6^
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 'ea7eca6^'
note: affected: contrast/repository-values, by packages/elements/src/ocelle-listbox.ts
note: affected: brand-rules/repository-values, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/break-missing, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/break-not-json, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-lost-attribute, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-stale-property, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-undescribed-attribute, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-undescribed-css-part, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-undescribed-css-property, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-undescribed-event, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-undescribed-property, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/fail-undescribed-slot, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/pass-reordered, by packages/elements/src/ocelle-listbox.ts
note: affected: manifest/pass-repository, by packages/elements/src/ocelle-listbox.ts
note: affected: storybook-build/pass-repository, by packages/elements/src/ocelle-listbox.ts
note: affected: visual/fail-missing-baseline, by packages/elements/src/ocelle-listbox.ts
note: affected: visual/fail-one-pixel, by packages/elements/src/ocelle-listbox.ts
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/src/ocelle-listbox.ts
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by packages/elements/src/ocelle-listbox.ts
note: affected: axe/pass-repository, by packages/elements/src/ocelle-listbox.ts
note: plant time: brand-rules/repository-values: 0.5 s
note: plant time: contrast/repository-values: 0.5 s
note: plant time: manifest/break-missing: 1.3 s
note: plant time: manifest/pass-repository: 1.5 s
note: plant time: manifest/break-not-json: 2.2 s
note: plant time: manifest/fail-lost-attribute: 2.6 s
note: plant time: manifest/pass-reordered: 3.4 s
note: plant time: manifest/fail-stale-property: 3.9 s
note: plant time: manifest/fail-undescribed-attribute: 4.6 s
note: plant time: manifest/fail-undescribed-css-property: 5.1 s
note: plant time: manifest/fail-undescribed-css-part: 5.9 s
note: plant time: manifest/fail-undescribed-event: 6.3 s
note: plant time: manifest/fail-undescribed-property: 7.4 s
note: plant time: manifest/fail-undescribed-slot: 7.5 s
note: plant time: storybook-build/pass-repository: 2.6 s
note: plant time: visual/fail-missing-baseline: 463.7 s
note: plant time: visual/fail-one-pixel: 471.1 s
note: plant time: visual/fail-same-pixels-other-bytes: 461.2 s
note: plant time: visual/fail-token-changed: 590.5 s
note: plant time: visual/pass-repository: 447.4 s
note: plant time: axe/pass-repository: 306.8 s
plants: affected since ea7eca6^: 21 of 314 plants judged, every plant as expected; not the Plants check
```

## The full plants run after the second merge of main

The full run owed by phase 7 operator decision 3 was moved to CI by landing operator decision 5 ("CI carries
heavy gates"). CI's Plants shards on the final head stand in for it; the CI run id is added after the push. Locally,
the selection against the phase base on the merge head e47888d selects every plant
(`pnpm run gate:plants -- --affected 51648060f379f41bd57ed9bf5d0522326fe06b32 --list`: 317 of 317 selected, by shared gate source; exit 0).
