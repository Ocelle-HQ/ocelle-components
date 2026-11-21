# Plants of phase 2

- base: 5e7f6df60c22a732e4f5a383f4b0c97774261794
- command: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e --list` in the working tree for the selection, then `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e` in a scratch worktree of the green tree (`<scratch-worktree>`) whose only difference is `packages/elements/package.json` restored to the base.
- exit: 0 (the scoped run: 21 of 315 plants judged, every plant as expected); the selection 0

Why scoped (the operator's CI-first rule, `reviews/operator-ci-first-decision.md`, as relayed for this phase): the
scaffold's two new entry points in `packages/elements/package.json` are "not mapped", so `--affected` selects every
plant (315, the multi-hour run CI's Plants check makes). The run below is the selection without that one path: the
plants of the gates this phase's other changes reach (the element sources, `custom-elements.json`, `base.css`, the
stories and baselines, and the plant fixtures this phase updates): the contrast, brand-rules, manifest,
storybook-build, visual and axe plants. The package.json exports change no plant's input among them (the stories and
the manifest read the element sources). CI's Plants check judges every plant.

The first scoped run (on the same tree before the plant fixtures were updated) exited 1 with 8 problems: seven manifest
fixtures of `gates/plants/manifest/*/tree/packages/elements/custom-elements.json` (the six `fail-undescribed-*` and
`pass-reordered`) did not know the two new elements (`fail-lost-attribute`'s fixture lacked them too and was judged as
expected; it is regenerated with the others), and `visual/fail-token-changed` did not list the twelve timeline stories that show `color-ink` in light (every timeline
story but the empty one). The fixtures were regenerated from the new manifest (each plant's own delta kept: its
`ocelle-plant` module, the icon's lost `label`, the reversed key order) and the twelve stories added, as phase 1 did
for the data table; the run below is the second.

```text
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e --list
Scope: all 5 workspace projects
✓ Lockfile passes supply-chain policies (verified 3d ago)
Lockfile is up to date, resolution step is skipped
Already up to date
.../node_modules/rs-module-lexer postinstall$ node postinstall.js
.../node_modules/rs-module-lexer postinstall: Done
Done in 200ms using pnpm v12.16.1
$ node gates/bin/plants.ts -- --affected 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e: 315 of 315 plants selected, none judged (--list)
exit: 0
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e   (in <scratch-worktree>, package.json at the base)
$ node gates/bin/plants.ts -- --affected 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e
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
note: plant time: brand-rules/repository-values: 0.6 s
note: plant time: manifest/break-missing: 1.4 s
note: plant time: manifest/pass-repository: 1.6 s
note: plant time: manifest/break-not-json: 2.5 s
note: plant time: manifest/fail-lost-attribute: 2.5 s
note: plant time: manifest/pass-reordered: 3.7 s
note: plant time: manifest/fail-stale-property: 3.7 s
note: plant time: manifest/fail-undescribed-attribute: 5.0 s
note: plant time: manifest/fail-undescribed-css-part: 5.1 s
note: plant time: manifest/fail-undescribed-event: 6.1 s
note: plant time: manifest/fail-undescribed-css-property: 6.3 s
note: plant time: manifest/fail-undescribed-property: 7.3 s
note: plant time: manifest/fail-undescribed-slot: 7.5 s
note: plant time: storybook-build/pass-repository: 3.0 s
note: plant time: visual/fail-missing-baseline: 450.2 s
note: plant time: visual/fail-one-pixel: 448.9 s
note: plant time: visual/fail-same-pixels-other-bytes: 443.9 s
note: plant time: visual/fail-token-changed: 550.6 s
note: plant time: visual/pass-repository: 456.5 s
note: plant time: axe/pass-repository: 234.8 s
plants: affected since 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e: 21 of 315 plants judged, every plant as expected; not the Plants check
exit: 0
```
