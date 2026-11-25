# Plants of phase 4

- base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d (the mission's base, phase 1's `base.sha`: phase 4 changes no source, so its own base, 4106d7d, would
  select nothing; tasks.md T078, quickstart.md step 4)
- command: `pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d --list` in the working tree for the selection, then
  `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d` twice in a scratch worktree of this branch
  (`<scratch-worktree>`), scoped as below; run 2 after commit 6f97540.
- exit: 0 (run 2, the scoped run: 22 of 314 plants judged, every plant as expected); the selection 0; run 1 exit 1

## What CI judges, and why the local run is scoped

Under the operator's standing CI-first decision (`reviews/operator-ci-first-decision.md`, 2026-11-20, which post-dates
T078 and overrides its full local runs), **the full plant run is left to CI's required Plants check**, which judges every
plant before any merge. Locally, the affected plants run scoped, as phases 2 and 3 did (`reviews/phase-3/plants.md`).

The selection on the working tree is every plant (315), by `gates/lib/mutation/report.ts` (shared gate source); the
mission's other "every plant" path is `packages/elements/package.json` (its entry points, "not mapped", phase 3's
record). The scratch worktree restores, to the mission's base, the files that select plants by gate source rather than
by what the elements change:

- run 1: `gates/lib/mutation/report.ts` and `packages/elements/package.json` (40 plants: the 22 of the elements'
  gates and 18 mutation plants, by `gates/bin/mutation.ts`);
- run 2: those two, and `gates/bin/mutation.ts` (a comment change) and the plant `mutation/error-checker-failure`,
  both added with `report.ts`'s checker rule in phase 1 (22 plants).

Those gate files were last changed in phase 1 (c8452f4, as folded) and every plant, the mutation plants among them, was
judged on them by phase 1's full run in shards (`reviews/phase-1/plants.md`); with `report.ts` at its base the
mutation plants test the base's gate, not this branch's, so run 2 leaves them to that record and to CI. The selection of
run 2 is the plants of the gates the elements' changes reach (the element sources, `custom-elements.json`,
`base.css`, the stories and baselines, and the plant fixtures the mission updates): the contrast, brand-rules,
manifest, storybook-build, visual and axe plants.

## Run 1 (exit 1) and the fix

Run 1 reported two problems:

- `mutation/error-checker-failure`, "not-reported-broken": an artefact of the scoping. The plant checks
  `report.ts`'s checker rule (phase 1), which the worktree had restored to the base. Run 2 drops it with that file.
- `storybook-build/fail-empty-index`, "not-caught": **a stale plant fixture.** The plant replaces each repository
  story file with one that has no story export, so the built index is empty; phases 2 and 3 added
  `event-timeline.stories.ts` and `evidence-chain.stories.ts` with no stub in its tree, so the plant's build held
  their 27 stories and the gate passed it. Neither phase's scoped run selected the plant (its own files were unchanged
  since phase 1). Commit 6f97540 adds the two stubs, in the data table's form; the plant's tree, built from this branch,
  then gives `storybook/dist/index.json: storybook-build: empty-index: the built index holds no story` and exit 1, and
  run 2 judges it as expected. CI's Plants check would have failed on it.

```text
$ pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d --list
$ node gates/bin/plants.ts -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d --list
note: affected: every plant, by gates/lib/mutation/report.ts (shared gate source)
plants: affected since 8d104af23ce177ec4acbbfaba59bf433f9520d6d: 315 of 315 plants selected, none judged (--list)
exit: 0
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d   (run 1, in <scratch-worktree>: report.ts and package.json at the base)
$ node gates/bin/plants.ts -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d
note: affected: mutation/error-checker-failure, by gates/bin/mutation.ts
note: affected: mutation/error-dry-run-fails, by gates/bin/mutation.ts
note: affected: mutation/error-unresolvable-base, by gates/bin/mutation.ts
note: affected: mutation/error-zero-mutant-failing-test, by gates/bin/mutation.ts
note: affected: mutation/fail-disable-all, by gates/bin/mutation.ts
note: affected: mutation/fail-element-source-no-coverage, by gates/bin/mutation.ts
note: affected: mutation/fail-element-source-survivor, by gates/bin/mutation.ts
note: affected: mutation/fail-gate-source-survivor, by gates/bin/mutation.ts
note: affected: mutation/fail-mixed-survivors, by gates/bin/mutation.ts
note: affected: mutation/fail-no-test-runs, by gates/bin/mutation.ts
note: affected: mutation/fail-record-without-reason, by gates/bin/mutation.ts
note: affected: mutation/fail-unchecked-line, by gates/bin/mutation.ts
note: affected: mutation/pass-compile-error, by gates/bin/mutation.ts
note: affected: mutation/pass-element-source, by gates/bin/mutation.ts
note: affected: mutation/pass-fully-checked, by gates/bin/mutation.ts
note: affected: mutation/pass-reasoned-record, by gates/bin/mutation.ts
note: affected: mutation/pass-test-only-change, by gates/bin/mutation.ts
note: affected: mutation/pass-zero-mutant, by gates/bin/mutation.ts
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
note: affected: storybook-build/fail-empty-index, by gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/data-table.stories.ts
note: affected: storybook-build/pass-repository, by packages/elements/custom-elements.json
note: affected: visual/fail-missing-baseline, by packages/elements/custom-elements.json
note: affected: visual/fail-one-pixel, by packages/elements/custom-elements.json
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/custom-elements.json
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by packages/elements/custom-elements.json
note: affected: axe/pass-repository, by gates/plants/axe/pass-repository/plant.json
note: plant time: contrast/repository-values: 0.6 s
note: plant time: brand-rules/repository-values: 0.7 s
note: plant time: manifest/break-missing: 1.5 s
note: plant time: manifest/pass-repository: 1.7 s
note: plant time: manifest/break-not-json: 2.3 s
note: plant time: manifest/fail-lost-attribute: 2.8 s
note: plant time: manifest/pass-reordered: 3.3 s
note: plant time: manifest/fail-stale-property: 4.1 s
note: plant time: manifest/fail-undescribed-attribute: 4.3 s
note: plant time: manifest/fail-undescribed-css-part: 5.2 s
note: plant time: manifest/fail-undescribed-css-property: 5.3 s
note: plant time: manifest/fail-undescribed-event: 6.3 s
note: plant time: manifest/fail-undescribed-property: 6.3 s
note: plant time: mutation/error-unresolvable-base: 7.3 s
note: plant time: manifest/fail-undescribed-slot: 7.4 s
note: plant time: mutation/error-dry-run-fails: 33.1 s
note: plant time: mutation/fail-gate-source-survivor: 36.4 s
note: plant time: mutation/error-checker-failure: 71.0 s
note: plant time: mutation/fail-element-source-no-coverage: 73.4 s
note: plant time: mutation/error-zero-mutant-failing-test: 94.8 s
note: plant time: mutation/fail-disable-all: 97.0 s
note: plant time: mutation/fail-element-source-survivor: 125.5 s
note: plant time: mutation/fail-no-test-runs: 125.6 s
note: plant time: mutation/fail-record-without-reason: 150.1 s
note: plant time: mutation/fail-unchecked-line: 153.2 s
note: plant time: mutation/pass-compile-error: 178.3 s
note: plant time: mutation/pass-fully-checked: 181.5 s
note: plant time: mutation/pass-reasoned-record: 208.8 s
note: plant time: mutation/pass-element-source: 210.8 s
note: plant time: mutation/pass-test-only-change: 212.2 s
note: plant time: mutation/pass-zero-mutant: 233.5 s
note: plant time: mutation/fail-mixed-survivors: 258.7 s
note: plant time: storybook-build/fail-empty-index: 3.3 s
note: plant time: storybook-build/pass-repository: 2.8 s
note: plant time: visual/fail-missing-baseline: 487.4 s
note: plant time: visual/fail-one-pixel: 468.8 s
note: plant time: visual/fail-same-pixels-other-bytes: 468.1 s
note: plant time: visual/fail-token-changed: 634.7 s
note: plant time: visual/pass-repository: 482.2 s
note: plant time: axe/pass-repository: 258.2 s
gates/plants/mutation/error-checker-failure: plants: not-reported-broken: expected exit 2 (could not run), got exit 0
gates/plants/storybook-build/fail-empty-index: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0
plants: 2 problems in 40 plants (affected since 8d104af23ce177ec4acbbfaba59bf433f9520d6d; not the Plants check)
[ELIFECYCLE] Command failed with exit code 1.

real	51m4.993s
user	17m10.473s
sys	1m32.759s
exit: 1
$ OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d   (run 2, in <scratch-worktree>: report.ts, mutation.ts, package.json and mutation/error-checker-failure at the base; 6f97540's stubs)
$ node gates/bin/plants.ts -- --affected 8d104af23ce177ec4acbbfaba59bf433f9520d6d
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
note: affected: storybook-build/fail-empty-index, by gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/data-table.stories.ts
note: affected: storybook-build/pass-repository, by packages/elements/custom-elements.json
note: affected: visual/fail-missing-baseline, by packages/elements/custom-elements.json
note: affected: visual/fail-one-pixel, by packages/elements/custom-elements.json
note: affected: visual/fail-same-pixels-other-bytes, by packages/elements/custom-elements.json
note: affected: visual/fail-token-changed, by gates/plants/visual/fail-token-changed/plant.json
note: affected: visual/pass-repository, by packages/elements/custom-elements.json
note: affected: axe/pass-repository, by gates/plants/axe/pass-repository/plant.json
note: plant time: contrast/repository-values: 0.5 s
note: plant time: manifest/break-missing: 0.9 s
note: plant time: brand-rules/repository-values: 1.3 s
note: plant time: manifest/pass-repository: 1.5 s
note: plant time: manifest/break-not-json: 2.2 s
note: plant time: manifest/fail-lost-attribute: 2.5 s
note: plant time: manifest/pass-reordered: 3.4 s
note: plant time: manifest/fail-stale-property: 3.5 s
note: plant time: manifest/fail-undescribed-attribute: 4.6 s
note: plant time: manifest/fail-undescribed-css-property: 4.6 s
note: plant time: manifest/fail-undescribed-css-part: 5.8 s
note: plant time: manifest/fail-undescribed-event: 5.8 s
note: plant time: manifest/fail-undescribed-slot: 6.9 s
note: plant time: manifest/fail-undescribed-property: 6.9 s
note: plant time: storybook-build/fail-empty-index: 2.9 s
note: plant time: storybook-build/pass-repository: 3.1 s
note: plant time: visual/fail-missing-baseline: 482.9 s
note: plant time: visual/fail-one-pixel: 482.6 s
note: plant time: visual/fail-same-pixels-other-bytes: 491.2 s
note: plant time: visual/fail-token-changed: 630.4 s
note: plant time: visual/pass-repository: 493.6 s
note: plant time: axe/pass-repository: 269.8 s
plants: affected since 8d104af23ce177ec4acbbfaba59bf433f9520d6d: 22 of 314 plants judged, every plant as expected; not the Plants check

real	47m44.186s
user	4m10.939s
sys	0m33.940s
exit: 0
```

## Review round 1 fix (the phase's own base)

The fix changes no source, gate, story or baseline: test files, the elements README's mapping row and records. The
selection on the phase base is the one plant that 6f97540 touches, as the review found. This run is appended, not a
replacement, because the sections above are T078's mission-wide record, which the round keeps and corrects (R1-03).

- base: 4106d7d50025bec14023a86c39a34493e80ea49b (`base.sha`)
- command: `pnpm run gate:plants -- --affected 4106d7d` in the working tree, with the fix applied
- exit: 0

```
$ node gates/bin/plants.ts -- --affected 4106d7d
note: affected: storybook-build/fail-empty-index, by gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/event-timeline.stories.ts
note: plant time: storybook-build/fail-empty-index: 3.1 s
plants: affected since 4106d7d: 1 of 315 plants judged, every plant as expected; not the Plants check
exit: 0
```
