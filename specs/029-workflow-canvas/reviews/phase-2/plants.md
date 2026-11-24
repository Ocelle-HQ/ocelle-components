# Plants of phase 2

- base: a56fc8309667984bcc63c6f0e341c140728bbd65
- command: `pnpm run gate:plants -- --affected a56fc8309667984bcc63c6f0e341c140728bbd65 --list`
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected a56fc8309667984bcc63c6f0e341c140728bbd65 --list
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
plants: affected since a56fc8309667984bcc63c6f0e341c140728bbd65: 21 of 317 plants selected, none judged (--list)
```

The affected selector listed the cases for the exact hosted judge. The local engine lacks the pinned visual image. The hosted verdict covers all selected cases, including the visual and axe cases.

The eight updated manifest overlays were independently built through `buildRepoTree` and checked by the repository manifest gate.

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
