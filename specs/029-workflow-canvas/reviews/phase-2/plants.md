# Plants of phase 2

- base: 76afb213e7ed2f451896a26e894081acf380d44a
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

The official local affected command with `--skip-container` exited 0 after judging all 16 selected cases that use the local toolchain. Every case matched its expected verdict. The Axe repository Plant took 706.8s.

```text
plants: affected since a56fc8309667984bcc63c6f0e341c140728bbd65: 16 of 317 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```

The five visual Plants require the pinned container image from hosted CI. The complete hosted Plants verdict remains part of candidate verification.

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

The exact Phase 2 candidate passed the full hosted Plants judge. All 317 Plants across 17 gates and the registry matched their expected verdicts, including all five visual fixtures in the affected selection. [Exact hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45445205967/job/138640924435)

## Phase 2 review round 1

The affected selector at `73390c2f73621a20674ce099c2c1808af075c58d` returned the same 21 cases. The fresh official local partial run exited 0. Its Axe repository case took 551.9s.

```text
pnpm run gate:plants -- --affected a56fc8309667984bcc63c6f0e341c140728bbd65 --skip-container
plants: affected since a56fc8309667984bcc63c6f0e341c140728bbd65: 16 of 317 plants judged, every plant as expected; not the Plants check; partial run: 5 visual plants not run
```

The candidate's five selected visual Plants use the hosted pinned engine.
