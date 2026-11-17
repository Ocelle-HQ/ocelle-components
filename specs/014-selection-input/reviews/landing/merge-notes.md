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
- `gates/plants/manifest/fail-lost-attribute`, `fail-undescribed-attribute`, `fail-undescribed-css-part`,
  `fail-undescribed-css-property`, `fail-undescribed-event`, `fail-undescribed-property` and `fail-undescribed-slot`
  (`tree/packages/elements/custom-elements.json`): each is the regenerated manifest with that plant's own change
  applied. The change is the diff of the plant copy against the real manifest, and it is identical on both sides.
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
