# Plants of phase 3

- base: cd1d73c8d5c390e674480268fb9953c770b10bfc
- command: `pnpm run gate:plants -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc --list` in the working tree for the selection, then `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected cd1d73c8d5c390e674480268fb9953c770b10bfc` in a scratch worktree of the green tree (`<scratch-worktree>`) whose only difference is `packages/elements/package.json` restored to the base.
- exit: 0 (the scoped run: 21 of 315 plants judged, every plant as expected); the selection 0

Why scoped (the operator's CI-first rule, `reviews/operator-ci-first-decision.md`; phase 2's approach, accepted in its
round 1, `reviews/phase-2/plants.md`): the scaffold's two new entry points in `packages/elements/package.json` are
"not mapped", so `--affected` selects every plant (315, the multi-hour run CI's Plants check makes). The run below is
the selection without that one path: the plants of the gates this phase's other changes reach (the element sources,
`custom-elements.json`, `base.css`, the stories and baselines, and the plant fixtures this phase updates): the
contrast, brand-rules, manifest, storybook-build, visual and axe plants. The package.json exports change no plant's
input among them. CI's Plants check judges every plant.

Before the first run the plant fixtures were brought up to the two new elements and fourteen stories, as phases 1 and
2 did: the seven manifest fixtures of `gates/plants/manifest/*/tree/packages/elements/custom-elements.json` that hold
a copy of the manifest (`fail-lost-attribute`, the six `fail-undescribed-*`) by a three-way merge of the base
manifest, the fixture and the new manifest (each plant's own delta kept, every merge clean), `pass-reordered` by
writing the new manifest with every object's keys reversed (its transform, checked to reproduce the base fixture
byte for byte), and `visual/fail-token-changed` listing the thirteen chain stories that show `color-ink` in light
(every chain story but the empty one; 146 to 159 findings).

The first scoped run (on the same tree before the step's content part became a block) exited 1 with one problem:
`gates/plants/axe/pass-repository: plants: not-accepted: expected exit 0 with no finding, got exit 1
(elements-ocelle-evidence-chain--long-step/light color-contrast-incomplete,
elements-ocelle-evidence-chain--long-step/dark color-contrast-incomplete)`. axe read the gap between the two line
boxes of the inline `part="content"` span as an overlap (`bgOverlap`); the content part is now a block inside the
inline-block host, with the same pixels (`gates.md`). The run below is the second, after that change and the line-end
refactor of `element-plants.md`.

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
note: plant time: manifest/break-missing: 0.8 s
note: plant time: brand-rules/repository-values: 1.3 s
note: plant time: manifest/pass-repository: 1.4 s
note: plant time: manifest/break-not-json: 2.0 s
note: plant time: manifest/fail-lost-attribute: 2.2 s
note: plant time: manifest/pass-reordered: 3.0 s
note: plant time: manifest/fail-undescribed-attribute: 3.1 s
note: plant time: manifest/fail-stale-property: 4.0 s
note: plant time: manifest/fail-undescribed-css-part: 4.0 s
note: plant time: manifest/fail-undescribed-css-property: 5.0 s
note: plant time: manifest/fail-undescribed-event: 5.1 s
note: plant time: manifest/fail-undescribed-property: 6.0 s
note: plant time: manifest/fail-undescribed-slot: 6.1 s
note: plant time: storybook-build/pass-repository: 2.5 s
note: plant time: visual/fail-missing-baseline: 457.9 s
note: plant time: visual/fail-one-pixel: 479.7 s
note: plant time: visual/fail-same-pixels-other-bytes: 481.2 s
note: plant time: visual/fail-token-changed: 598.1 s
note: plant time: visual/pass-repository: 472.8 s
note: plant time: axe/pass-repository: 251.2 s
plants: affected since cd1d73c8d5c390e674480268fb9953c770b10bfc: 21 of 315 plants judged, every plant as expected; not the Plants check
exit: 0
```
