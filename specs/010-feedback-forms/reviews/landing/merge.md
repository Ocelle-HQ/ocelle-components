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

# Second merge of main (b594b7e9)

`git merge --signoff origin/main` at branch head `16281ff` with `origin/main` at `b594b7e9` (mission 011, layout and
headers, #44; mission 008, overlays, #47; mission 009, workflow and layouts, #46), merge base `23ba5c5`. 41 files
conflicted; all were resolved in the merge commit `7514ba39`, keeping both sides. The first attempt
(`merge-stop-2.md`) stopped on the manifest generator; the operator's decision O3-01 (`reviews/phase-3/round-3.md`)
is on the branch since `7aecd09`, so the generator merged without a clash. The gates found one resolution error, fixed
in `6d484388` and `8d87751a` (below). No story baseline was regenerated: the visual gate matches all 346 captures
against the baselines both sides committed, so no story's pixels change through the merge. The lockfile is unchanged by the merge, so no install was
needed.

## Resolution per file

Pinned counts are branch + main - base, from the figures each side pinned, then checked against the gates on the
merged tree: 346 story-themes (182 + 286 - 122), 348 with the axe plant story, 173 stories (91 + 143 - 61), 21
elements (9 + 18 - 6), 174 contrast pairs in light and 182 in dark (165 + 169 - 160, 173 + 177 - 168), 163 required
per theme (154 + 158 - 149), 326 required pairs, 356 pair entries.

| File | Resolution |
|---|---|
| `packages/elements/scripts/manifest.ts`, `packages/elements/custom-elements-manifest.config.mjs` | The branch's side, which is main's generator and config with the `form-control.ts` entry (O3-01, `7aecd09`): `internalBases = ["form-control.ts", "overlay.ts"]`, globs `src/ocelle-*.ts`, `src/overlay.ts`, `src/form-control.ts`. The standard-attribute list is the union, the branch's eight names (main has `aria-label` only); no attribute main's elements declare is one of the added names, as the regenerated manifest shows. |
| `packages/elements/custom-elements.json` | Regenerated (`pnpm --filter @ocelle/elements run manifest`). Each of the 21 modules equals, object for object, the same module of the branch's or of main's committed manifest (the six both have are equal on both sides); `schemaVersion` and `readme` are unchanged. |
| `gates/plants/manifest/{fail-lost-attribute,pass-reordered,fail-undescribed-*}/tree/packages/elements/custom-elements.json` | Regenerated by the procedure of `reviews/phase-3/manifest.md` (T025), as `round-3-fixes.md` last applied it: each `fail-undescribed-*` copy is the generator's output over the merged `src/` with the plant's `src/ocelle-plant.ts` beside it, `fail-lost-attribute` the merged manifest without `ocelle-icon`'s `label` attribute, `pass-reordered` the merged manifest with every object's keys reversed. Run with the merged generator, the procedure reproduced all eight copies of the branch head byte for byte from the branch head's `src/`, and all eight of main from main's `src/`, before it was applied to the merged tree. `fail-lost-attribute` auto-merged textually and was regenerated too; `break-not-json` and the style-lint plants' hand-written partial manifests are unchanged. |
| `packages/elements/test/node/manifest.test.ts` | Main's tests kept, among them "reads every src/ocelle-*.ts and src/overlay.ts, and nothing else: a base in overlay.ts gives inherited members, one in helper.ts does not" (round 4, R4-01), the overlay-module test and the dialog, drawer and tooltip entry tests; the branch's T030/T041c generator test with `src/form-control.ts`, its normalise cases and the notice, form-input and form-select entry tests kept. The module path list is the 21 paths in code-point order. |
| `packages/elements/src/index.ts` | Union of the exports in code-point order of name, each type after its class (`IconName` after `OcelleIcon`, `FormInputType`, `NoticeSize`, `NoticeTone`); the header comment names all 21 elements and the internal modules of both sides (the overflow-region, lane-count, tier and list-detail measurement modules, the overlays' base, `src/form-control.ts`, `src/icon-svg.ts`). |
| `packages/elements/package.json` | `exports`: `.`, the icon and mark, the branch's three entries (`ocelle-notice`, `ocelle-form-input`, `ocelle-form-select`), main's twelve (009's four, 008's three, 011's five) and the 013 four, then `browser.js` and the manifest. |
| `packages/elements/README.md` | Intro: "twenty-one elements", naming both sides'. Entry points: both sets of rows, in the order of `exports`. Sections: the branch's (`ocelle-notice`, Form controls, `ocelle-form-input`, `ocelle-form-select`) then main's (`ocelle-dialog` to `ocelle-personal-rail`), then the 013 sections and the rest as main has them. Host ARIA: see below. |
| `packages/elements/CHANGELOG.md` | Unreleased / Added: both sides' entries, the branch's first. |
| `packages/elements/test/node/readme.test.ts` | Fragments, entry rows and CHANGELOG surfaces of both sides; the `exports` key list in `package.json` order. Host ARIA: see below. |
| `packages/elements/test/exports.test.ts` | The 21 root export keys in code-unit order, each checked to be a function (main's form of the test, which checks every name); the comment names both sides' tasks. |
| `packages/elements/test/entry-root.test.ts` | Header comment of both; the branch's first test (icon, mark, notice, input, select) and main's first test (icon to personal rail) both kept as two tests, with the 013 tests after them. |
| `packages/tokens/src/source.ts`, `gates/bin/contrast.ts` | Comments only: "163 required pairs per theme", and the Stryker comment's test title "174 pairs in light and 182 in dark, 163 required per theme". `color-ink`'s grounds (`main` and the state grounds, 010 R-04) and main's `color-eyebrow` auto-merged; `packages/tokens/contrast/pairs.json` auto-merged. |
| `gates/test/contrast-pairs.test.ts`, `gates/test/contrast-required.test.ts`, `gates/test/contrast.test.ts`, `gates/test/integration/token-gates.test.ts`, `gates/test/integration/plants-robustness.test.ts` | The union counts above: 174 and 182 entries, 356 lines, 163 triples per theme and 326 pairs (A.8 with 011's `color-eyebrow` row, which auto-merged into the hand transcription, plus 010's five ink-on-state-ground triples), `--print` 326 lines; the robustness plants' summaries 174/182 and 175/182 (the one added pair), 163 required. |
| `gates/plants/visual/fail-token-changed/plant.json` | Findings: main's list in main's order, with the branch's 30 mission-010 findings inserted where the branch has them (after `elements-ocelle-brand-mark--labelled/light`, before main's dialog findings): 146 in all (53 of the base, 30 of mission 010, 63 of missions 008, 009 and 011), no duplicate. Main had moved the eight `tokens--*` findings; a textual union would have listed them twice, so the list was built from the two sides' JSON. `why`: main's text with the branch's clause on the thirty mission-010 stories, "one hundred and forty-six". |
| `gates/test/integration/axe.test.ts` | 346 story-theme runs, 348 with the plant story; the title 346. Notes unchanged (10 excepted). |
| `gates/test/integration/visual.test.ts` | 346 captures, 346 story-themes in the findings line, 346 baselines before the baseline command; the title 346. |
| `gates/test/integration/storybook-build.test.ts` | 173 stories. |
| `gates/test/integration/manifest.test.ts`, `gates/test/manifest.test.ts` | "manifest: 21 elements checked". |
| `gates/test/integration/plant-repo.test.ts` | 346 repository story-themes. |
| `storybook/test/integration/elements-stories.test.ts` | Built from both sides' files: main's header comment and imports with the branch's `fileURLToPath`, the common icon and mark sections, the branch's section (notice, form-input, form-select stories and their baselines), main's sections (009, 008, 011), then the 013 sections and main's story-frames test. No name is shared between the two sections. |
| `vitest.config.ts` | Main's projects (the 1280 × 800 viewport, `elements-touch`, `elementExcluded`, `elementBrowserCommands`) with the branch's `liveStart` and `liveStop` added to `elementBrowserCommands`, and the branch's `optimizeDeps` (the three Lit directives the elements import) and `fileParallelism: false` kept on the `elements` project. |
| `packages/elements/test/commands.ts` | Both: the branch's `AxDetail`, `axDetails` and the `"details"` scope; main's `Rect`, `ActiveElement`, `TextBox` and its readers. |
| `packages/elements/test/browser/global-setup.ts`, `packages/elements/test/browser/serve.ts` | Both builds (the branch's plant bundle `ocelle-plants.js`, main's test controls `ocelle-test-controls.js` and `ocelle-test-list-detail.js`) and both served paths; comments of both. |
| `packages/elements/test/scenarios/driver.ts`, `packages/elements/test/in-process.ts`, `packages/elements/test/browser/driver.ts` | Both sides' types, imports, helpers and steps. Six step names were added on both sides: see below. The fixture driver keeps the branch's signature (`served` for `submit`) and returns `FixtureDriver`; its page globals of the branch's `listenFor` are `ocelleFormListening` and `ocelleFormHeard`, beside main's `ocelleListening`. Both mounts: the branch's resets (timing, `readyState`, listeners, submissions) and main's (probe, last key, the frames and delay sheets). |
| `packages/elements/test/driver.test.ts`, `packages/elements/test/browser/driver.test.ts` | Both sides' tests. In process: the branch's header, helpers and both `afterEach` hooks (the branch's `mount("")`, main's reduced-motion reset), main's `DriverHost`, `recordKeys` and `plain`, then the branch's describes and main's. On the fixture, built from both sides' files: both `open` helpers were top-level functions of the same name with other signatures, so main's is `openPlain` (its call sites renamed, nothing else changed); then the branch's describe and main's. |
| `packages/elements/test/scenarios/{form-input,form-select,form-twins,notice}.ts` | The branch's scenario bodies, with the five renamed steps (below); no assertion changed. |

### Host ARIA: the sentence both sides replaced

Both sides replaced the base's package-wide sentence "A host `aria-label` names the element as `label` does, and when
present it decides alone: ...". The branch scoped it, and the base's other five host-ARIA sentences, to `ocelle-icon`
and `ocelle-brand-mark` ("On `ocelle-icon` and `ocelle-brand-mark`, ...") beside the notice's and the form controls'
rules; 009 split it ("A host `aria-label` names the element as `label` does. For `ocelle-icon` and
`ocelle-brand-mark`, when present it decides alone: ...") and added the scroller, board and lane rule and the
list-detail rule, keeping the other five base sentences.

- The five base sentences main did not change follow the branch's change: its scoped sentences are kept and the base
  fragments in main's list are not (the README no longer states them package-wide, which a form control's whitespace
  rule and the notice's host `role` contradict).
- For the sentence both changed, the README states 009's wording, and the test pins 009's fragment in place of the
  branch's: it states the branch's icon and mark rule and the package-wide first clause both.
- 009's scroller, board, lane and list-detail fragments are kept; the paragraph orders the rules by element.
- Main's elements keep the base rules for `aria-hidden`, `hidden` and `role` in one README sentence, "On the other
  elements, a host `aria-hidden="true"` hides the element, a host `hidden` attribute removes it, and a host `role` or
  `aria-hidden="false"` is not supported", which the test pins as a new fragment.

### The driver steps both sides added

Six driver steps were added under the same name on both sides (`call`, `click`, `focusPath`, `heard`, `listen`,
`press`), five of them with other arguments or results. Main had met the same between 008 and 009 by naming the later
steps apart (009's `chord`, `clickAt`, `deepActive` beside 008's `press`, `click`, `focusPath`). The same rule here:

| Branch's step | Main's step of that name | Merged |
|---|---|---|
| `call(id, method, ...args)`: the result as `property` reads one | `call(id, name)`: void, then `settle()` (009's `remeasure()`) | One step with the branch's signature: it calls, waits with `settle()` and returns the result; main's calls pass no argument and ignore the result |
| `press(id, key)`: focuses `id`, presses `key` | 008's `press(key, { shift })` | the branch's is `pressOn(id, key)` |
| `click(id, at)`: a click at a point of the border box | 008's `click(id, inner, { button })` | `clickPoint(id, at)` |
| `focusPath()`: `string[]`, `localName#id` per level | 008's `focusPath()`: a string, `fh[in]` | `focusChain()` |
| `listen(ids, types)` and `heard()`: `Heard[]` | 009's `listen(ids)` and `heard()`: `string[]` | `listenFor(ids, types)` and `heardEvents()` |

The branch's scenario bodies and driver tests call the new names; nothing else in them changed.

### The fix: the form steps' wait (`6d484388`)

The merged `settle()` is 009's: two animation frames, every `ocelle-*` element rendered, every `<iframe srcdoc>`
loaded, then a frame; the branch's was the render and one frame. Every driver step took 009's, the branch's form and
announcement steps included (`insert`, `insertInteractive`, `batch`, `reset`, `type`, `pressOn`, `blur`, `clickPoint`,
`registerFirstLoad`). Their scenarios time a change in fractions of the test W = 100 ms from the end of the step
(`after`), so these steps now ended three rendering updates after their change. The plant row "minimum hold: a trigger
during the hold empties the copy at once turns US1-13 10 ms after a write red" (`test/plants.test.ts`) then stayed
green on its plant, in three runs out of three. In that body the trigger came about 50 ms after the write, not 3 ms,
and the plant's early removal was no longer seen. The fix gives those steps their wait back as `updated()`, in both
harnesses; main's steps and the merged `call()` keep `settle()`. The plants file then passed 79 of 79. No assertion
changed.

### The fix: the pinned browser commands (`8d87751a`)

The merged `elementBrowserCommands` (`vitest.config.ts`) holds main's commands and the branch's `liveStart` and
`liveStop`, and both browser element projects register it. Main's `gates/test/vitest-config.test.ts` pins the exact
command list of the two projects; the merge kept main's list, and `gate:unit-tests` failed on that one test. The pinned
list is now the union, in code-unit order.

## Gate results on the merged tree

Run in this container with Chromium build 1243 through `OCELLE_CHROMIUM_PATH` and `OCELLE_VISUAL_ENGINE=docker`. The
static gates, `gate:signoff`, `gate:unit-tests`, `gate:storybook-build`, `gate:visual`, `gate:axe` and the plants
were run at `8d87751a`. The container restarted twice during the runs, which stopped the gate running at the time;
each of those gates was run again from the start.

| Gate | Result |
|---|---|
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "477 files checked, no finding" |
| `gate:style-lint` | exit 0, "43 files checked, no finding" |
| `gate:test-lint` | exit 0, "356 files checked, no finding" |
| `gate:csp` | exit 0, "48 files checked, no finding" (27 before the Storybook was built) |
| `gate:prefix` | exit 0, "511 files checked, no finding" (497 before the Storybook was built) |
| `gate:contrast` | exit 0, "174 pairs checked in light, 182 in dark (163 required per theme)" |
| `gate:manifest` | exit 0, "manifest: 21 elements checked, no finding" |
| `gate:config-copies` | exit 0, the two `story-config.yml` copies identical |
| `gate:pins` | exit 0, "5 manifests checked, no finding" |
| `gate:brand-rules` | exit 0, "7 rules checked" |
| `gate:signoff -- --range origin/main..HEAD` | exit 0, "113 commits checked, no finding" (at `8d87751a`) |
| registry | no gate of its own; checked inside `gate:plants` |
| `gate:unit-tests` | Before `8d87751a`: 1 of 7916 failed, the pinned command list (above). At `8d87751a`: exit 1, "1 of 7916 tests failed": `gates/test/integration/visual.test.ts:115`, "captures the repository's 346 story-themes twice under docker", hit its 600 000 ms timeout. That file run alone right after passed 11 of 11 (1568 s for the file). Reported as a timing-sensitive failure, not changed: the test's timeout is main's, and it captures 346 story-themes twice under the load of the full suite. Earlier runs: the in-process `elements` and `elements-touch` projects passed 2115 of 2116 at the merge commit, the one failure being the minimum-hold plant row fixed by `6d484388`. |
| `gate:storybook-build` | exit 0, "built 173 stories" |
| `gate:visual` | exit 0 in 436 s, "346 captures match their baselines (docker only: no cross-engine comparison)"; no baseline regenerated |
| `gate:axe` | exit 0 in 291 s, "346 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)" |
| `gate:plants` | The plan is 29 shards (`--plan`). Old shard reports were cleared. Each shard (`--shard <k>`, three at a time) exited 0 with "every plant as expected"; the visual shards took up to about 1 600 s each. Then `--verdict storybook/.visual/plant-shards`: exit 0, "plants: 314 plants of 17 gates and the registry judged, every plant as expected". Among them are the eight manifest plants with the regenerated copies and `visual/fail-token-changed` with its 146 findings (668 s). |

Merge-resolution errors found by the gates: two, each fixed in its own `fix(landing)` commit (`6d484388`,
`8d87751a`).
