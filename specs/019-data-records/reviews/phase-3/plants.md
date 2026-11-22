# Plants of phase 3

- base: 59c3b4b61a2841a4de68a700b263c0bee44d1cc0
- command: `pnpm run gate:plants -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc --list` in the working tree for the selection, then `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc` in a scratch worktree of the review round 1 fix tree (`<scratch-worktree>`) whose only difference is `packages/elements/package.json` restored to the base.
- exit: 0 (the scoped run: 21 of 315 plants judged, every plant as expected); the selection 0

This run replaces the phase's earlier one, as the fix command asks (review round 1, `round-1-fixes.md`). It is
scoped the same way, for the same reason, and selects the same 21 plants. Why scoped (the operator's CI-first rule,
`reviews/operator-ci-first-decision.md`; phase 2's approach, accepted in its round 1, `reviews/phase-2/plants.md`;
this phase's round 1, R1-08): the scaffold's two new entry points in `packages/elements/package.json` are "not
mapped", so `--affected` selects every plant (315, the multi-hour run CI's Plants check makes). The run below is the
selection without that one path: the plants of the gates this phase's other changes reach (the element sources,
`custom-elements.json`, `base.css`, the stories and baselines, and the plant fixtures this phase updates): the
contrast, brand-rules, manifest, storybook-build, visual and axe plants. The round's fixes change the chain's and the
timeline's source only (a render on connection, the kept size observer, comments and records); `gate:manifest` is
clean, `visual:update` under docker wrote nothing (`0 added, 0 changed, 0 removed`) and `gate:axe` is unchanged. The
plant fixtures are as the phase's green work left them (the earlier record, at 91298a9, describes their update). CI's
Plants check judges every plant.

```text
$ pnpm run gate:plants -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc --list
$ node gates/bin/plants.ts -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since cd1d73c8d5c390e674480268fb9953c770b10bfc: 315 of 315 plants selected, none judged (--list)
exit: 0
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc   (in <scratch-worktree>, package.json at the base)
$ node gates/bin/plants.ts -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc
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
note: plant time: manifest/break-missing: 1.3 s
note: plant time: manifest/pass-repository: 1.5 s
note: plant time: manifest/break-not-json: 2.4 s
note: plant time: manifest/fail-lost-attribute: 2.5 s
note: plant time: manifest/pass-reordered: 3.4 s
note: plant time: manifest/fail-stale-property: 3.7 s
note: plant time: manifest/fail-undescribed-attribute: 4.6 s
note: plant time: manifest/fail-undescribed-css-part: 4.7 s
note: plant time: manifest/fail-undescribed-css-property: 5.7 s
note: plant time: manifest/fail-undescribed-property: 5.8 s
note: plant time: manifest/fail-undescribed-event: 6.9 s
note: plant time: manifest/fail-undescribed-slot: 7.0 s
note: plant time: storybook-build/pass-repository: 3.2 s
note: plant time: visual/fail-missing-baseline: 501.3 s
note: plant time: visual/fail-one-pixel: 506.1 s
note: plant time: visual/fail-same-pixels-other-bytes: 503.9 s
note: plant time: visual/fail-token-changed: 630.3 s
note: plant time: visual/pass-repository: 491.2 s
note: plant time: axe/pass-repository: 253.3 s
plants: affected since cd1d73c8d5c390e674480268fb9953c770b10bfc: 21 of 315 plants judged, every plant as expected; not the Plants check
exit: 0
```
