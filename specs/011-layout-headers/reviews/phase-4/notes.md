# Phase 4 notes (implementer)

Phase base `f679e02` (`base.sha`), scaffold `73b12a2` (`scaffold.sha`).

## Operator decision 1: the sidebar in a flex-column container (measured before the red commit)

Measured on 2026-11-14 in this container's Chromium for Testing 1243 (153.0.8010.12) by `flex-column-probe.mjs`, a
throwaway stand-in element carrying R-09's planned host and shadow rules (`:host { display: flex; flex-direction:
column; min-block-size: 100%; align-self: start; box-sizing: border-box }`, the layout column, the padded head and
footer, the section rules with `!important`), px values in place of the tokens; a head `p`, three `div` sections and a
footer `p`, in an 800 × 600 px container. Output: `flex-column-probe.log`.

| Container | Sidebar inline size | Block size |
|---|---|---|
| block | 800 | 600 |
| flex row | 95.09 | 600 |
| flex row, page rule `align-self: stretch` on the host | 95.09 | 600 |
| grid | 800 | 600 |
| flex column | **95.09** (its content's) | 600 |
| flex column, page rule `align-self: stretch` on the host | 800 | 600 |
| flex column, one section of long text | 800 (to the container, then the text wraps) | 600 |

The sidebar shrinks to its content's inline size in a flex column (and, as any flex item does along the main axis, in
a flex row). It was reported before the red commit; the operator decided "README statement" (decision 6) and tightened
its wording (decision 7). `align-self: start` stays; no scenario changed. The planner amended FR-036, T035, plan.md
item 5 and research.md R-09 (`7950c2d`, `f679e02`), and T035's new assertion is in the red commit as worded there.

## T035a: pinned element lists at the phase base

Searched at the phase base, `packages/elements/test`, `gates/test` and `storybook/test`, for assertions that pin the
package's element classes, entry points, `exports` keys, manifest module paths, `dist` files or a count that follows
from them (`git grep -n "OcellePageHeader\|page-header\.js\|src/ocelle-page-header.ts\"\|5 elements\|38 stories\|\b76\b\|78 story" f679e02`).
Each one this phase's green tasks (T038, T039) change is changed in the red commit:

| File and place at the base | What it pins | Change in the red commit |
|---|---|---|
| `packages/elements/test/exports.test.ts:8-11` | the root's run-time exports, sorted | `OcelleContextSidebar` added in the namespace's sorted order (after `OcelleCard`, before `OcelleIcon`) |
| `packages/elements/test/entry-root.test.ts:9-18` | the elements the root defines, as its classes | `ocelle-context-sidebar` added (T034) |
| `packages/elements/test/node/readme.test.ts:176-185` (`entryRows`) | the README's Entry points table | the row of `@ocelle/elements/ocelle-context-sidebar.js` after the element rows, before `browser.js` |
| `packages/elements/test/node/readme.test.ts:227` | the `exports` keys | `./ocelle-context-sidebar.js` in the same place |
| `packages/elements/test/node/manifest.test.ts:250` | the manifest's module paths by code point | `src/ocelle-context-sidebar.ts` added (after `src/ocelle-card.ts`) |
| `packages/elements/test/build/build.test.ts:44-61` | the module build's file list and the root's imports | `ocelle-context-sidebar.js` and the root importing it |
| `packages/elements/test/build/build.test.ts:132-143` | the elements the browser build defines | `ocelle-context-sidebar` added |
| `packages/elements/test/build/pack.test.ts:20-24` | the packed element files | `dist/ocelle-context-sidebar.js` added |
| `gates/test/manifest.test.ts:86, 91` | "manifest: 5 elements checked" on the repository | 6 elements |
| `gates/test/integration/manifest.test.ts:19` | the same, on the repository's plant tree | 6 elements |
| `gates/test/integration/axe.test.ts:52, 56, 68` | the repository's 76 story-themes (78 with the plant's story) | 98 (100): the eleven new stories (T039) in two themes |
| `gates/test/integration/visual.test.ts:116, 120, 139, 244` | the 76 story-themes and 76 baseline files | 98; the baselines are made in the pinned container under docker (operator decision 4) |
| `gates/test/integration/plant-repo.test.ts:225` | the 76 baselines the plant tree copies | 98 |
| `gates/test/integration/storybook-build.test.ts:55` | "built 38 stories" | 49 |
| `storybook/test/integration/elements-stories.test.ts` | the element stories' ids | extended to the eleven context-sidebar stories (T035) |

No sibling (#16, #15, #9) had changed these lists by the phase base.

## Departures and choices, with the reason

- **The landmark** (R-11): the internals are held under `internalsKey` (`src/naming.ts`, T036), set to the
  `navigation` role and the trimmed `label` (`accessibleName(this.label, null)`) in `updated()`. The role is set there
  rather than in the constructor: the manifest analyzer reads `<anything>.role = …` in a constructor as a class field
  and listed a public `role` member. Before the first update the host has no role; every scenario reads the tree after
  the element has rendered.
- **`@internal` only, no `@ignore`** on the internals field: the analyzer omits a member with either tag, so with both
  the contract's plant "the `@internal` tag removed" changes nothing and no test could catch it. With `@internal`
  alone the plant lists a member `[internalsKey]` and the manifest test fails (plants.md).
- **Slotted content and `display: block`** (phase 3's review note R1-01): the sections are `display: block !important`
  (FR-022 requires a block whatever the element). The head's and footer's slotted elements get no `display` rule: the
  padding belongs to the head and footer wrappers, which are blocks, so any element the page slots is laid out inside
  them; the spec's measurements of the head and footer (US3-3, FR-008) are of `p` elements, which are blocks already,
  so a `display: block` there would be a declaration no plant could catch, as with the page header's heading.
- **Dividers read from pixels**: each divider is a border, either of a shadow wrapper or of a slotted section, so its
  colour cannot be read through `driver.computed` (light DOM only). The scenarios read the rendered pixels of the
  host's border box: a divider is a run of rows every pixel of which is the divider's colour, so it spans the
  sidebar's whole inline size by construction, and its place is matched to the part boxes to within a pixel. A column
  the box covers only in part (a fractional inline size, as in a flex row) is left out.
- **Text in the default slot** (US3-11): a text node's `Range` box is its glyph run, not its line box, so "no block
  padding" is asserted as the text lying within 2 px of the section before it and the section (or divider) after it,
  where a block padding would be `--ocelle-space-4`.
- **US3-4's 600 px containers** are measured on a page of their own each, so the sidebar's border box is inside the
  viewport when its pixels are read.
- **Reset scenarios**: besides the two page resets, a page rule sets the sections' block margins (which wins, FR-008)
  and their padding and display (which do not, FR-022), so each `!important` declaration of the section rule has a
  plant that fails.
- **Class lists with `classMap`**: the first mutation run (`gate:mutation -- --base f679e02`) left nine survivors on the
  template's class lists, written as arrays of names with `""` for an absent class and filtered: a mutant that turns a
  `""` into another string adds a class no rule matches, which no test can see. The wrappers' classes are now Lit's
  `classMap` (`lit/directives/class-map.js`, part of the `lit` dependency), whose keys and conditions every mutant
  changes visibly; the second run had no survivor.

## Baselines (T039), under operator decision 4

Made in #10's pinned container as #10 designed, `pnpm run visual:update -- --engine docker`: "baselines: wrote 22
files (22 added, 0 changed, 0 removed), 466114 bytes in total", the eleven new story-themes in light and dark
(`elements-ocelle-context-sidebar--{full,no-head,no-footer,one-section,text-in-the-slot,empty-sections,hidden-sections,host-aria-label,label-and-host-aria-label,blank-host-aria-label,unnamed}`).
No other baseline changed, so there is no unexpected PNG to report. The visual plant `fail-token-changed` gains the
eleven new light story-themes, which all show `color-ink` (the page's text colour on the sidebar's slotted text). No
cross-engine comparison was possible: podman is absent here, so `gate:visual` ran under docker alone ("docker only: no
cross-engine comparison"). CI, which runs the gate under docker and podman, confirms these baselines at landing.

## Gate plants changed by the new element (part of the green commit)

- `gates/plants/manifest/{fail-lost-attribute,fail-undescribed-*,pass-reordered}`: their copies of the committed
  manifest regenerated with the context sidebar (the derivation of phases 2 and 3: the repository's manifest with the
  plant's source, minus the icon's `label` attribute, or with its keys reversed; the derivation reproduces the copies
  at the phase base byte for byte).
- `gates/plants/storybook-build/fail-empty-index`: the new story file replaced by one with no story export.
- `gates/plants/visual/fail-token-changed`: the eleven light story-themes above.

## Checks at the green state

OCELLE_CHROMIUM_PATH set to Chromium 1243; docker 29.9.2 as the engine (podman absent).

| Check | Result |
|---|---|
| `red.sh 4 phase` on `1933641` | tests only, red: 115 of 3486 failed, every one on an assertion (`red-phase.log`) |
| `gate:typecheck`, `gate:lint` (297 files), `gate:style-lint` (18), `gate:test-lint` (201), `gate:csp` (23), `gate:prefix` (260), `gate:pins` (5 manifests), `gate:config-copies` | pass |
| `gate:manifest` | "manifest: 6 elements checked, no finding" |
| `gate:storybook-build` | "built 49 stories" |
| `gate:axe` | "axe: 98 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)" |
| `gate:visual -- --engine docker` | "visual: 98 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:mutation -- --base f679e02` | 28 mutants on the changed lines of 3 files, none survived; 2 compile errors, 2 zero-mutant entries (`src/index.ts`, `src/naming.ts`: an export and a constant), 1 equivalent record (the `label` property options, as `ocelle-icon`'s) |
| `gate:plants` (no `--skip-container`, `OCELLE_VISUAL_ENGINE=docker`) | "plants: 301 plants of 17 gates and the registry judged, every plant as expected". The run before it judged 300 of 301 as expected: `unit-tests/pass-elements-only` got "could not run: Vitest reported errors outside tests: Failed to run the test" from the browser project under the load of the parallel plant runs; run alone on the same tree it passed ("1 test passed in 1 file"), and it passed in the full run after it |
| `pnpm test` (dockerd running) | "3486 tests passed in 155 files" |
