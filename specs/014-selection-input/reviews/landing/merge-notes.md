# Landing merge notes — PR #54 (merge of origin/main)

- Operator decisions: 1 (merge now, no final fold) and 3 (Driver contract, option 1), in `operator-decisions.md`.
- Merge base: 3828d2f. origin/main: b594b7e (missions 008, 009, 011, 013; ops 015, 016).
- Command: `git merge --signoff origin/main`, with no rebase. 44 files conflicted: 43 content conflicts and one add/add,
  on `packages/elements/test/browser/driver.test.ts`.

## Driver rename (operator decision 3, option 1)

The rename is a separate commit before the merge ("test(elements): rename 014's colliding Driver methods before
merging main"). It sits on the branch's own line, so its diff is only the rename and 014's tests were proven green on
it before main came in (elements and elements-browser: 43 files, 885 tests passed). Main's methods keep their names
and signatures.

| Old (014) | New | Why it collided on main |
|---|---|---|
| `press(key, modifiers?)` | `pressKeys(key, modifiers?)` | 008's `press(key, { shift? })` |
| `click(target, { button, modifiers, count, force })` | `clickTarget(target, options?)` | 008's `click(id, inner?, { button? })` |
| `hover(target)` | `hoverTarget(target)` | 008's `hover(id \| null, inner?)` |
| `activeElement(): Focused \| null` | `focusedElement()` | 011's `activeElement(): ActiveElement` |
| `viewportSize(width, height)` (setter) | `setViewportSize(width, height)` | 008's `viewportSize(): Size` (getter) |

Where the renames were applied:

- The `Driver` interface (`test/scenarios/driver.ts`).
- Both harnesses (`test/in-process.ts`, `test/browser/driver.ts`).
- Every 014 scenario body: listbox, tabs, segmented-choice, copy-field, link, driver-commands and driver-recorders.
- The in-process harness tests: listbox, tabs, segmented-choice and link.

Comment references to the driver methods were renamed too. The link fixture's own `Navigation` interface
(`click`, `press`) is not the Driver, so it keeps its names.

The planner should update spec, tasks, research and contracts wording to these names. This commit does not touch them.
The references are in tasks.md T002 and T008a, and in research.md R-11.

`focus(target)` exists on both sides with the same meaning: it focuses by script, then settles. The merged interface
declares it once, in 009's place. The fixture implementation is 014's, which uses the shared resolver.

### Target and the shared resolver

- `Target` (`test/scenarios/driver.ts`) is now
  `string | { id, inner } | { parent, kind, index }`, which combines 009's shadow form and 014's child form.
- One resolver finds every form: `resolve` in `test/page-helpers.ts`, which gains the `{ id, inner }` branch.
- **In process:** `test/in-process.ts` keeps one `resolve` that calls it. Main's local resolver was removed.
- **Fixture:** `test/browser/driver.ts` reaches the same resolver through `window.__ocelleDriver.resolve`. Main's
  methods that resolved a target inline in `page.evaluate` now call it: `rectOf`, `computed`, `focus`, `scrollLeft`,
  `setScrollLeft`, and `frameRecord`'s subject and `read.of`. Their behaviour is unchanged.
- The accessibility commands (`axStates`, `axUpdates`) work over CDP on the DOM tree, so they still take only the id
  and child forms. `test/commands.ts` exports that type as `Target`, and `scenarios/driver.ts` re-exports it as
  `AxTarget`. For the same reason, `tab()`/`panel()` and the `ancestors`/`controls` helpers in `scenarios/tabs.ts`
  now return or take `AxTarget`.

### Two checks the stop report predicted

- **Exact `axTree` comparisons against main's richer `AxNode`.**
  - Main's `reported()` adds `description`, `modal`, a heading's `level` and a range node's value fields, and adds
    each only when Chromium reports it.
  - 014's `axStates` builds its nodes with its own `named()` (role and name only), so `AxState` and `controls` are
    unaffected.
  - 014's direct `axTree` assertions all pass on the merge (the elements and elements-browser runs below). The phase-1
    plant "axTree with an extra field" asserted that no field is added *by the 014 commands*, and that still holds.
- **The stale `AxState` comment.** "005's `AxNode` stays `{ role, name }`" now reads "`AxNode` keeps its own fields".

## Conflict files and their resolution

Generated or regenerated:

- `packages/elements/custom-elements.json`: regenerated with `pnpm --filter @ocelle/elements run manifest`. Every one
  of the 27 modules equals its entry on the side that owns it.
- `gates/plants/manifest/fail-lost-attribute/tree/packages/elements/custom-elements.json`: the regenerated manifest
  with the plant's change (the icon's `label` attribute removed). The change is the diff of the plant copy against the
  real manifest, which is identical on both sides.
- `gates/plants/manifest/fail-undescribed-{attribute,css-part,css-property,event,property,slot}`
  (`tree/packages/elements/custom-elements.json`): each copy is the generator's output on the repository source with
  the plant's `src/ocelle-plant.ts` added.
  - In the merge commit, five of them (all but `-attribute`) were built by patching main's plant diff onto the
    regenerated manifest. The patch landed on the wrong context, so the plant's declaration also appeared inside
    another module, and the full plants run reported 5 not-caught plants ("unexpected … stale").
  - d885610 regenerates them as described above. The five then passed (`gate:plants -- --affected c4eb93a`, exit 0).
- `gates/plants/manifest/pass-reordered/tree/packages/elements/custom-elements.json`: the regenerated manifest with
  every object's keys reversed. The same transform reproduces both sides' copies byte for byte.
- `knowledge/speckit-flows/runs/index.md`: rows merged in sorted order (main's 008, 009, 011, 013, then 014). I did not
  rerun summary.sh, because it would also rewrite `runs/014-selection-input.md`.

Merged so both sides' behaviour stays:

- `packages/elements/package.json`: main's exports first, then 014's nine, then `./browser.js` and
  `./custom-elements.json`.
- `packages/elements/src/index.ts`: all 27 classes in sorted order, with one combined comment.
- `packages/elements/test/entry-root.test.ts`: main's tests and 014's.
- `packages/elements/test/exports.test.ts`: the 27 sorted names, plus 014's `customElements.get` checks.
- `packages/elements/test/commands.ts`:
  - Both sides' types and commands are present.
  - `RawAxNode` carries `description`, `value` and `properties: RawAxProperty[]`.
  - `AxScope` is `"element" | "subtree" | "ancestors"`.
  - `BrowserCommands` declares every command.
- `packages/elements/test/in-process.ts`:
  - Imports from both sides.
  - Main's two-frame `settle` with the srcdoc wait.
  - 014's resolver, `keyboardText` and `framesAndTask`.
  - At mount, 014's page-helper reset and main's frames and delay sheets.
  - Both sets of methods.
- `packages/elements/test/browser/driver.ts`: both sides' imports, mount and methods. Main's `focus` is replaced by
  014's, which has the same behaviour through the shared resolver. Inline resolutions use the shared resolver (see
  above).
- `packages/elements/test/browser/serve.ts`: main's `VisitOptions` (touch) together with 014's link-target note.
- `packages/elements/test/browser/driver.test.ts` (add/add): one file holding both suites, 009/013's fixture-driver
  tests and 014's commands and recorders.
- `packages/elements/test/scenarios/driver.ts`: the Driver of both sides, with the renames and the widened `Target`.
  The activation-entry comment keeps "the activating `click`", which names the DOM event, not the driver method.
- `packages/elements/test/build/build.test.ts`: both sides' module-build describes. The browser-build "self-contained"
  test now checks all 27 definitions.
- `packages/elements/test/node/manifest.test.ts`: module paths are the sorted union of 27, and both sides' declaration
  tests are kept.
- `packages/elements/test/node/readme.test.ts`:
  - Both sides' README expectations are kept.
  - **Module rule.** 014's sentence ("defines that element and the elements it renders or owns as children") replaces
    013's "no other, except that a container module also imports its item element". 014's sentence is the general
    form: it covers 013's container and 008's rendered icon. The README says it once.
  - **Engine floor.** The higher floor is kept, Chromium 125+ and WebKit 17.4+ (014). 008's
    "Chromium 120+ and WebKit 17+" line is dropped, and 008's Popover API bullet stays.
  - **Overview count (mechanical, as the coordinator asked).** "eleven elements" becomes "twenty-seven elements", and
    the overview test names all 27: `mainElements` (008/009/011/013's sixteen) is added beside `selectionElements`.
    The README overview was updated to match.
- `packages/elements/README.md`:
  - Overview: 27 elements, main's list then 014's, with 014's engine and entry-point paragraph.
  - Entry-point table: main's rows, then 014's.
  - Element sections: main's, then 014's (and its Examples), placed before "Mapping from kitty-mission-ui".
  - Engines: floor Chromium 125+ / WebKit 17.4+, with both the custom-states and the Popover API bullets.
  - Module rule: 014's sentence.
- `packages/elements/CHANGELOG.md`: both Unreleased lead paragraphs (014's MINOR change first, then 009's minor
  change), and both sides' Added entries (main's, then 014's). Both sides are MINOR, so MINOR is kept.
- `packages/tokens/CHANGELOG.md`: main's motion line (with `--ocelle-tooltip-delay`) and 014's contrast-pair entry.
- `storybook/.storybook/stories-layout.css`: main's rules, then 014's story sizes. The header comment names 014.
- `storybook/test/integration/elements-stories.test.ts`: main's file with 014's imports and 014's appended block. 014's
  changes against the base were pure additions.
- `vitest.config.ts`:
  - The commands of both sides are in `elementBrowserCommands`.
  - `elementExcluded` also excludes `test/browser-file/**`, so neither elements nor elements-touch picks the file:
    suite.
  - Main's elements-touch project is kept, and so is 014's elements-browser-file project.
- `vitest.mutation.config.ts`, `gates/test/vitest-config.test.ts` and
  `gates/test/integration/vitest-mutation-config.test.ts`:
  - Nine excluded projects: elements-touch and elements-browser-file are both excluded.
  - The expected command list gains `axStates`, `axUpdatesStart` and `axUpdatesStop`.

Counts recomputed for the union, each checked against the gate's own output (see the gate table):

| What | Base | 014 | main | Merged |
|---|---|---|---|---|
| Contrast pairs, light / dark | 160 / 168 | 166 / 174 | 169 / 177 | 175 / 183 |
| Required pairs per theme (total) | 149 (298) | 155 (310) | 158 (316) | 164 (328) |

- **`gates/test/contrast.test.ts`, `contrast-pairs.test.ts`, `contrast-required.test.ts`,
  `integration/token-gates.test.ts` and `integration/plants-robustness.test.ts`:** these carry the contrast counts.
  The plants-robustness plant with one more light pair is 176 / 183.
- **`gates/test/manifest.test.ts`, `integration/manifest.test.ts`:** 27 elements checked (014 11, main 18).
- **`gates/test/integration/storybook-build.test.ts`:** 177 stories (base 21, +34 from 014, +122 from main).
- **`gates/test/integration/axe.test.ts`, `visual.test.ts`, `plant-repo.test.ts`:** 354 story-themes (base 42, +68
  from 014, +244 from main). The axe plant run is 356, and 014's listbox exceptions are kept.
- **`gates/plants/visual/fail-token-changed/plant.json`:** the union of the "differs" findings, 149 light story-themes
  (main's 116 + 014's 33). The `why` names both sides' stories.

## Fixes the merged result needed

These are type and lint fixes only, with no behaviour change:

- `scenarios/segmented-choice.ts`: main widened `setProperty`'s value type, so 014's `true as unknown as string`
  assertions became unnecessary (lint). They were removed.
- `commands.ts`: in main's `reported()`, `?.value?.value` became `?.value.value`, because the merged
  `RawAxProperty.value` is required (lint).

## Follow-up commits

- **d885610** "test(gates): regenerate five manifest plants' copies from their plant source" (see the manifest
  plants above).

- **c4eb93a** "test(gates): give the visual integration runs 900 s after the merge of main".
  - **Why.** The first full unit-tests run on the merge failed once, in `gates/test/integration/visual.test.ts`: the
    test that captures the repository's 354 story-themes twice timed out at 600 s. Run alone it passed in 456 s.
  - **Change.** The file's `timeout` constant goes from 600 s to 900 s. No assertion changes.
  - The same full run also failed `browser/drawer.test.ts` once, on "Rapid toggle during the entry, motion on". That
    was a timing flake under load: the file passed 3 times out of 3 alone, and passed in the full elements-browser run
    and in the second full unit-tests run. It needed no change.

## Baselines

No visual baseline changed. The visual gate reports 354 captures matching their baselines.

## Gates on the result

| Gate | Exit | Notes |
|---|---|---|
| typecheck, lint, test-lint, style-lint, brand-rules, pins, config-copies, prefix, csp | 0 | |
| contrast | 0 | 175 / 183 pairs, 164 required |
| manifest | 0 | 27 elements |
| unit-tests | 0 | 8004 tests in 247 files, on c4eb93a |
| storybook-build | 0 | 177 stories |
| visual (docker) | 0 | 354 captures match their baselines |
| axe | 0 | 354 story-theme runs; 22 notes, all excepted |
| `vitest run --project elements-browser-file` | 0 | |
| signoff `--range 3828d2f..HEAD` | 1 | Only main's six squash merges, which have no Signed-off-by line: b594b7e, 13af7a9, bea3130, 23ba5c5, c4c0af4, ce1d9c7 |
| signoff `--range origin/main..HEAD` | 0 | Every branch commit, the merge included |
| plants (full) | 1 | 5 manifest plants not caught, fixed by d885610 |
| plants (`--affected c4eb93a`) | 0 | The 5 manifest plants |
| mutation `--base 3828d2f --files packages/elements/src/index.ts` | 0 | Zero mutants on the export lines. This is the one mutable file the conflict resolution wrote. |

# Second merge (landing operator decision 4)

- **Merged:** origin/main at 7f61959. This is the single merge; main was fetched right before. It brings mission 012
  (#50, `ocelle-button`, `ocelle-action-row`), mission 010 (#49, `ocelle-notice`, `ocelle-form-input`,
  `ocelle-form-select`), triage records (#52) and op 021 (#53). An earlier attempt at 096ee16 was aborted before any
  commit and is not in the history.
- **Merge base:** b594b7e.
- **Merge commit:** e47888d (`git merge --signoff origin/main`, never rebased). It contains only the conflict
  resolution.
- **Order:** the three rename commits before the merge, on the branch's own line, are listed below.

## Renames before the merge (landing decision 3: main's landed code untouched, 014 takes distinct names)

| Commit | Old (014) | New | Collides with |
|---|---|---|---|
| 8dd5582 | `test/scenarios/link.ts` (ocelle-link's US5 bodies) | `test/scenarios/ocelle-link.ts` | 012's own `test/scenarios/link.ts` (ocelle-button's link mode), the same path |
| 6876c76 | type `Target` (string \| { id, inner } \| { parent, kind, index }) | `DriverTarget` | 012's `interface Target { inner? }`; 009's union is now main's `ElementTarget` (main's decision D1) |
| 6876c76 | type `ClickOptions` (button, modifiers, count, force) | `TargetClickOptions` | 012's `ClickOptions` (modifiers, button, position) |
| 4aa2a6e | `driver.focus(target)` in 014's bodies | `driver.focusNode(target)` | main moved 009's `focus(target)` to `focusTarget` and gave `focus(id)` to 012 |
| 4aa2a6e | `driver.computed(target, property)` in 014's bodies | `driver.computedNode(target, property)` | main moved 009's `computed` to `computedOf` and gave `computed(id, property, inner?)` to 012 |
| 3d8ee86 | type `AxState` (test/commands.ts, `axStates`) | `AxNodeState` | 012's `AxState` (scenarios/driver.ts, `axState(id, inner?)`) |
| e47888d (in the resolution) | `AxScope`'s `"ancestors"` (014 phase 3) | `AxStatesScope = "element" \| "subtree" \| "ancestors"` | main's `AxScope = "element" \| "subtree" \| "details"`, which keys `axTree`'s reader table |

The first merge's renames (`pressKeys`, `clickTarget`, `hoverTarget`, `focusedElement`, `setViewportSize`) still
stand. For the planner, every 014 name now differs from main's. Spec, tasks, research and contracts wording is not
touched here, so where it names `scenarios/link.ts`, `Target`, `ClickOptions`, `focus`, `computed`, `AxState` or
`AxScope` for 014, it should take the new names above.

## Conflict files and their resolution (30)

- **`packages/tokens/src/source.ts`, `packages/tokens/contrast/pairs.json`, `packages/tokens/CHANGELOG.md`**
  - Main's `color-accent-strong` grounds (`[...main, ...stateGrounds, ...chrome]`, 012 R-08) include 014's six main
    grounds, so the grounds are main's, with a comment naming 014's selected bars.
  - The auto-merged pairs.json held 12 duplicate entries (014's six accent-strong pairs per theme, identical to
    012's). I removed 014's copies, and pairs.json now equals main's byte for byte.
  - The CHANGELOG keeps both entries.
- **`packages/elements/test/browser/fixtures/link-target.html` (add/add):** one page serving both missions. It keeps
  014's `<p id="target">The link target page</p>`, which the link bodies read, and 012's note paragraph. 012's tests
  read only its URL and the server's visits.
- **`packages/elements/test/scenarios/link.ts`:** both sides added this path. 014's file was renamed first (8dd5582),
  so main's file is untouched. 014's US5-7 spacing body and both sides' tests are unchanged.
- **`packages/elements/test/scenarios/driver.ts`:**
  - Imports and exports are united.
  - Main's `Modifier`, `Target`, `ElementTarget` and `ClickOptions` are kept. 014's `DriverTarget` and
    `TargetClickOptions` sit beside them, and 014's duplicate `Modifier` (identical) is dropped.
  - Main's `computed`/`computedOf` and `focus`/`focusTarget` are kept, with 014's `computedNode` and `focusNode`
    beside them.
  - 014's methods and main's 010/012 methods are both kept.
  - The temporary `Target = DriverTarget` alias is dropped.
- **`packages/elements/test/commands.ts`:**
  - 014's `Target`, `AxNodeState` and `AxUpdate` are kept beside main's `AxDetail`.
  - One `RawAxProperty`, whose related nodes carry both `backendDOMNodeId` (014) and `idref` (010).
  - `AxScope` is main's, and `AxStatesScope` is 014's (see the table).
- **`packages/elements/test/in-process.ts`:**
  - Imports from both sides.
  - Main's `resolve(ElementTarget)` is back as main wrote it. 014's page-helper resolver is now `resolveNode`,
    used by 014's methods only (`box`, `focusNode`, `computedNode`, `clickTarget`, `hoverTarget`, `mutate`,
    `resize`, `afterResizeDelivery`, `computedPart`, `activationRecord`).
  - The mount does both sides' resets.
  - Main's `computed`/`computedOf` are kept.
- **`packages/elements/test/browser/driver.ts`:**
  - Imports are united.
  - Main's methods are as main wrote them: `rectOf`'s signature, `computed`/`computedOf`, `focusTarget` and 012's
    form listeners at mount.
  - 014's methods are kept, and 008's old `focus(target)` and `press(key, { shift })` (moved by main) are dropped.
- **`packages/elements/test/browser/driver.test.ts`:** 014's suite beside 010's driver steps, and main's
  `openPlain`.
- **`vitest.config.ts`, `gates/test/vitest-config.test.ts`:** both sides' browser commands. The expected list is the
  sorted union of 18.
- **`packages/elements/src/index.ts`, `test/exports.test.ts`, `test/entry-root.test.ts`:** 32 exported classes in
  code-point order, with main's type exports (`FormInputType`, `IconName`, `NoticeSize`, `NoticeTone`). 014's
  `customElements.get` checks are kept.
- **`test/build/build.test.ts`, `test/node/manifest.test.ts`:** both sides' module and declaration tests. Module
  paths are the sorted union of 32.
- **`packages/elements/README.md`, `test/node/readme.test.ts`:**
  - **Overview:** "thirty-two elements", main's list then 014's. The overview test names all 32: `mainElements` gains
    010's and 012's five.
  - **Engine floor:** the higher one, Chromium 135+ / WebKit 17.4+ (012). 014's custom-states line folds into 012's
    bullet ("… (`ocelle-button`'s moved states) and the joined segmented choice's rows (014)"). The overview sentence
    and its test say Chromium 135.
  - **Host ARIA:** 014's exceptions paragraph (tabs, link) before main's rewritten `aria-hidden`/`role` paragraph.
  - **Exports list:** package.json's order.
- **`gates/plants/manifest/*/tree/packages/elements/custom-elements.json` (pass-reordered conflicted; I rebuilt all
  eight):**
  - The six `fail-undescribed-*` copies are the generator's output with the plant's `src/ocelle-plant.ts` added (as
    d885610).
  - `fail-lost-attribute` is the regenerated manifest with main's plant `ocelle-icon` module, its one change.
  - `pass-reordered` is the regenerated manifest with every object's keys reversed.
- **`packages/elements/custom-elements.json`:** regenerated by `pnpm --filter @ocelle/elements run manifest`. All 32
  modules equal their entry on the side that owns them.
- **`gates/plants/visual/fail-token-changed/plant.json`:** the union of the "differs" findings. That is main's 189
  plus 014's 34 since b594b7e (the 33 of the first merge and T114's composed story), 223 light story-themes. The
  `why` names both sides.
- **The other gate count tests and `gates/test/integration/visual.test.ts`:** union counts, below. The visual test
  takes main's 1200 s time limit, the higher, pinned by main's visual-timeout test.

## Counts (union), and where each is checked

| Count | 014 (3d8ee86) | main (7f61959) | Merged | Checked |
|---|---|---|---|---|
| Elements (manifest gate) | 27 | 23 | 32 | locally: `gate:manifest` "32 elements checked" |
| Contrast pairs light / dark (required per theme) | 175 / 183 (164) | 207 / 215 (196) | 207 / 215 (196) | locally: `gate:contrast` output |
| Required pairs (`--print` lines) | 328 | 392 | 392 | locally (gates unit tests) |
| Stories | 178 | 224 | 259 | locally by story-file count (the method gives 143, 178 and 224 on b594b7e, HEAD and main, matching each side's gate test); CI run 44797053961 (Storybook build and Unit tests: success) |
| Story-themes (visual captures, axe runs, plant repository) | 356 | 448 | 518 (axe plant 520) | CI run 44797053961 (Visual regression, Accessibility, Unit tests: success) |
| fail-token-changed light differs | 150 | 189 | 223 | CI run 44797053961 (Plants: success) |

## Baselines

No baseline conflicted, and no baseline is regenerated by this merge.

Main changed no existing token value, but it did change shared element code that 014's elements use:
- `src/icon-slot.ts`: a labelled row's `.label` is baseline-aligned, and the slotted size rules are scoped to the
  `icon` and `trailing` slots.
- `src/ocelle-icon.ts` and `src/icon-svg.ts`: the drawing moved to icon-svg.ts.

014's option, tab and segment rows and the copy field use these. Main states that no position inside a labelled row
moves, and 014's in-process geometry suites pass on the merge. Whether any 014 baseline's pixels change was left to CI's
Visual regression on the final head. CI run 44797053961 passed Visual regression: no 014 baseline moved, so the
icon-slot change needed no baseline.

## Gates on the merge (landing decision 5: CI carries the heavy gates)

CI: run [44797053961](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44797053961) on 749a41d (the merge e47888d plus records and the log redaction, 749a41d "docs(014-selection-input): redact sandbox paths in the phase logs"), conclusion success, 177 of 177 jobs successful.

| Gate | Local exit | CI (run 44797053961) | Notes |
|---|---|---|---|
| typecheck | 0 | Typecheck: success | on e47888d |
| lint | 0 | Code lint: success | 562 files |
| test-lint | 0 | Test lint: success | 424 files |
| style-lint | 0 | Style lint: success | 60 files |
| brand-rules | 0 | Brand rules: success |  |
| pins | 0 | Install and pins: success |  |
| config-copies | 0 | Story config copies: success |  |
| prefix | 0 | Prefix: success | 619 files |
| csp | 0 | Content security: success | 55 files |
| contrast | 0 | Contrast: success | 207 / 215, 196 required |
| manifest | 0 | Custom-elements manifest: success | 32 elements |
| signoff `--range origin/main..HEAD` | 0 | Sign-off: success | 120 commits locally |
| plants `--affected ac2eebe… --list` (phase 6 base) | 0 |  | 317 of 317 selected (shared gate source), none judged |
| plants `--affected 5164806… --list` (phase 7 base) | 0 |  | 317 of 317 selected, none judged |
| full plants run | not run (landing decision 5) | Plants plan, 77 Plants shards and Plants: success | the Plants job: "plants: 317 plants of 17 gates and the registry judged, every plant as expected" |
| unit-tests | not run in full; targeted runs below | Unit tests: success |  |
| storybook-build | not run (decision 5) | Storybook build: success |  |
| visual (docker) | not run (decision 5) | Visual regression: success | no baseline moved |
| axe | not run (decision 5) | Accessibility: success |  |
| mutation | not run (decision 5) | Mutation plan, 80 Mutation shards and Mutation testing: success |  |
| targeted: gates, elements-node, tokens, storybook, styles projects | 0 |  | 101 files, 3750 tests |
| targeted: elements (in process), 29 files the resolution touched or that use the touched driver | 0 |  | 760 tests |
| targeted: elements-browser, 10 fixture files (driver, link, link-subpixel, button, action-row, harness-scenarios, listbox, tabs, segmented-choice, copy-field) | 0 |  | 535 tests |
| targeted: elements-browser-file and elements-build | 0 |  | 42 tests |

The mission 008 flake ("Rapid toggle during the entry, motion on") did not show in these targeted runs. The composed
dialog story's `<details>` focus-trap gap (op 022) was not exercised by them either, so it is still recorded as a known
gap.
