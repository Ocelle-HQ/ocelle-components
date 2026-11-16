# Landing: merge of `origin/main` into the branch

Operator decision: merge `main` into `claude/009-feedback-forms`, no rebase. `git merge --signoff origin/main` at
branch head `86505f5` with `origin/main` at `23ba5c5` (mission 013, data display, #43; ops 015 and 016), merge base
`3828d2f`. 26 files conflicted; all were resolved in the merge commit `fe0feb8`, keeping both missions. No design clash
was found that needed a stop (see `property` below); no story baseline was regenerated.

## Resolution per file

Pinned counts are the union of both missions, computed as branch + main - base from the figures each side pinned, then
checked against the gates on the merged tree (section below).

| File | Resolution |
|---|---|
| `packages/elements/src/index.ts` | Union of the exports in code-point order of name: `OcelleBrandMark`, `OcelleEmptyState`, `OcelleFact`, `OcelleFacts`, `OcelleFormInput` (+ type `FormInputType`), `OcelleFormSelect`, `OcelleIcon` (+ type `IconName`), `OcelleNotice` (+ types `NoticeSize`, `NoticeTone`), `OcelleProgress`; the header comment names all nine elements. |
| `packages/elements/package.json` | `exports`: the branch's three entries (`ocelle-notice`, `ocelle-form-input`, `ocelle-form-select`) then main's four (`ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`). |
| `packages/elements/README.md` | Intro: "nine elements", naming both missions' elements. Entry points table: both sets of rows, in the order of `exports`. The element sections: the branch's (`ocelle-notice`, Form controls, `ocelle-form-input`, `ocelle-form-select`) then main's (`ocelle-facts`, `ocelle-empty-state`, `ocelle-progress`, Mapping from kitty-mission-ui). |
| `packages/elements/CHANGELOG.md` | Unreleased / Added: both missions' entries, the branch's first. |
| `packages/elements/custom-elements.json` | Regenerated (`pnpm --filter @ocelle/elements run manifest`) from the merged source. Every module equals, object for object, the same module of the branch's or of main's committed manifest; the nine modules are in path order. |
| `gates/plants/manifest/{fail-lost-attribute,pass-reordered,fail-undescribed-*}/tree/packages/elements/custom-elements.json` | Regenerated with the procedure of reviews/phase-3/manifest.md (T025): each `fail-undescribed-*` copy is the generator's output over the merged `src/` with the plant's `src/ocelle-plant.ts` beside it, `fail-lost-attribute` the merged manifest without `ocelle-icon`'s `label` attribute, `pass-reordered` the merged manifest with every object's keys reversed. The six `fail-undescribed-*` copies had auto-merged textually and were regenerated too. Run on the branch head's tree, the procedure reproduced all eight branch copies byte for byte; on main's tree, seven of eight: main's `pass-reordered` orders the keys of its three new modules otherwise than by reversal, which the plant (a pass: any reordering) does not depend on, so the documented reversal is used for the whole file. The style-lint plants' hand-written partial manifests (`fail-element-property-misspelt`, `pass-element-property`) are main's (the branch adds no element CSS property). |
| `gates/plants/visual/fail-token-changed/plant.json` | Findings: the branch's 50 then main's 33 new ones, 83 in all (20 of the base, 30 of mission 010, 33 of mission 013), no duplicate; `why` names all of them ("eighty-three"). |
| `gates/test/integration/axe.test.ts` | 182 story-theme runs (102 + 122 - 42), 184 with the plant story (104 + 124 - 44); the test title 182 story-themes. Notes unchanged (10 excepted). |
| `gates/test/integration/visual.test.ts` | 182 captures, 182 story-themes in the findings line, 182 baselines before the baseline command; the title 182. |
| `gates/test/integration/storybook-build.test.ts` | 91 stories (51 + 61 - 21). |
| `gates/test/integration/manifest.test.ts`, `gates/test/manifest.test.ts` | "manifest: 9 elements checked" (5 + 6 - 2). |
| `gates/test/integration/plant-repo.test.ts` | 182 repository story-themes. |
| `packages/elements/test/exports.test.ts` | The nine root export keys and their types, in code-unit order; the comment names both missions' tasks. |
| `packages/elements/test/entry-root.test.ts` | Header comment of both; the branch's first test (icon, mark, notice, input, select) and main's three tests (facts, empty state, progress) all kept. |
| `packages/elements/test/node/manifest.test.ts` | Module path list: the nine paths. Both missions' per-element declaration tests kept (notice, form-input, form-select; facts, empty-state, progress, fact). |
| `packages/elements/test/node/readme.test.ts` | Fragments, entry rows and CHANGELOG surfaces: both missions'; the `exports` key list in `package.json` order. |
| `storybook/test/integration/elements-stories.test.ts` | Both sides appended a section after the brand-mark stories; the branch's file followed by main's section (no name collision between the two). |
| `vitest.config.ts` | Commands `axTree`, `emulateForcedColors`, `emulateReducedMotion`, `liveStart`, `liveStop`; the branch's `fileParallelism: false` and `optimizeDeps` kept, with main's `lit/directives/if-defined.js` (imported by `ocelle-facts`) added to the pre-bundled directives for the reason the branch gave for the other two. |
| `packages/elements/test/commands.ts` | Both: `AxDetail` (branch) and `ReducedMotion` (main); `RawAxNode` carries `description` and `value`; `emulateMotion` (main) and the branch's `AxScope` with `"details"`. |
| `packages/elements/test/scenarios/driver.ts` | Both sets of types (`InsertHow`, `Operation`, `Heard`, `Validity`, ... and `TreeNode`, `Running`) and imports; main's 013 steps added to `Driver` (they had landed textually inside `FixtureDriver`); one `property` (see below). |
| `packages/elements/test/in-process.ts`, `packages/elements/test/browser/driver.ts` | The branch's driver (timing, capture, form steps, the per-step `lastEnd` wrapper) with main's imports, main's mount line deleting `Symbol.for("ocelle.progress.sweepStart")`, and main's 013 steps added to the driver object; one `property`. |
| `packages/elements/test/driver.test.ts`, `packages/elements/test/browser/driver.test.ts` | Both files were added on both sides: the branch's tests, then main's `driverAdditionScenarios` describe; the helper elements of `scenarios/driver-additions.ts` are defined once per file (no tag shared with `fixtures/live-regions.ts`). |

### `property`: the one step both missions added

Both missions added `Driver.property(id, name)`. The branch's returned a string, number or boolean as it is and
anything else as null; main's returned the value as the page holds it, and main's driver-additions body pins an unset
property as `undefined` (and progress US3 reads `undefined` for an empty `value`). No test of the branch pins null for
an unset property (its absent pass-through properties are read with `typeOf`). The merged step returns a string,
number or boolean as it is, an unset value as `undefined`, and null and any other value as null, in both harnesses;
`call` and `propertyIn` keep the branch's rule (a `call` returning undefined reads null, which the branch pins). Both
missions' driver tests pass with it.

## Gate results on the merged tree

Run at `fe0feb8` in this container (Chromium build 1243 through `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=docker`).
The lockfile is unchanged by the merge, so no install was needed.

| Gate | Result |
|---|---|
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "355 files checked, no finding" |
| `gate:style-lint` | exit 0, "22 files checked, no finding" |
| `gate:test-lint` | exit 0, "255 files checked, no finding" |
| `gate:csp` | exit 0, "23 files checked, no finding" |
| `gate:prefix` | exit 0, "324 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "manifest: 9 elements checked, no finding" |
| `gate:config-copies` | exit 0, the two `story-config.yml` copies identical |
| `gate:pins` | exit 0, "5 manifests checked, no finding" |
| `gate:brand-rules` | exit 0, "7 rules checked" |
| registry | no gate of its own; checked inside `gate:plants` |
| `gate:unit-tests` | exit 0, "4736 tests passed in 174 files" (23:06). A first run had 5 failures, all in `gates/test/integration/visual.test.ts` with exit 2 from the gate: the Docker daemon was not running in the container. Once it was started, that file alone passed (11 of 11), then the full gate passed. |
| `gate:storybook-build` | exit 0, "built 91 stories" |
| `gate:visual` | exit 0, "182 captures match their baselines (docker only: no cross-engine comparison)"; no baseline regenerated |
| `gate:axe` | exit 0, "182 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)" |
| `gate:plants` | exit 0: the 28 shards of the plan (`--shard <k>`, three at a time), each "every plant as expected", then `--verdict storybook/.visual/plant-shards`: "plants: 309 plants of 17 gates and the registry judged, every plant as expected". The manifest plants with the regenerated copies and `visual/fail-token-changed` (343 s) are among them, each as expected. |

`gate:plants -- --affected <base> --list` (op 016) selects the full set from either base: from the branch head
`86505f5` by `gates/bin/plants.ts` (shared gate source, op 016), from `origin/main` by
`packages/elements/custom-elements-manifest.config.mjs` (unmapped). So the full set was judged. A single unsharded
run, about 210 s per visual plant at 91 stories, would not have finished within the container's task limit; it was
stopped after 239 plants with no unexpected outcome so far, and the set was judged shard by shard as above.

No merge-resolution error was found by the gates; there is no `fix(landing)` commit.
