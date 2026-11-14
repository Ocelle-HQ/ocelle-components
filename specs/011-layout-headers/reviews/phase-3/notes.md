# Phase 3 notes (implementer)

Phase base `a9a46eb` (`base.sha`), scaffold `4d0dc28` (`scaffold.sha`).

## T028a: pinned element lists at the phase base

Searched at the phase base, `packages/elements/test`, `gates/test` and `storybook/test`, for assertions that pin the
package's element classes, entry points, `exports` keys, manifest module paths, `dist` files or a count that follows
from them (`git grep -n "OcelleSectionHeader\|section-header\.js\|src/ocelle-section-header.ts\"\|4 elements\|33 stories\|\b66\b\|68 story" a9a46eb`).
Each one this phase's green tasks (T030, T031) change is changed in the red commit:

| File and place at the base | What it pins | Change in the red commit |
|---|---|---|
| `packages/elements/test/exports.test.ts:8-11` | the root's run-time exports, sorted | `OcellePageHeader` added in the namespace's sorted order (after `OcelleIcon`, before `OcelleSectionHeader`) |
| `packages/elements/test/entry-root.test.ts:9-17` | the elements the root defines, as its classes | `ocelle-page-header` added (T027) |
| `packages/elements/test/node/readme.test.ts:160-168` (`entryRows`) | the README's Entry points table | the row of `@ocelle/elements/ocelle-page-header.js` after the element rows, before `browser.js` |
| `packages/elements/test/node/readme.test.ts:210` | the `exports` keys | `./ocelle-page-header.js` in the same place |
| `packages/elements/test/node/manifest.test.ts:250` | the manifest's module paths by code point | `src/ocelle-page-header.ts` added (before `src/ocelle-section-header.ts`) |
| `packages/elements/test/build/build.test.ts:44-61` | the module build's file list and the root's imports | `ocelle-page-header.js` and the root importing it |
| `packages/elements/test/build/build.test.ts:115-126` | the elements the browser build defines | `ocelle-page-header` added |
| `packages/elements/test/build/pack.test.ts:20-23` | the packed element files | `dist/ocelle-page-header.js` added |
| `gates/test/manifest.test.ts:86, 91` | "manifest: 4 elements checked" on the repository | 5 elements |
| `gates/test/integration/manifest.test.ts:19` | the same, on the repository's plant tree | 5 elements |
| `gates/test/integration/axe.test.ts:52, 56, 68` | the repository's 66 story-themes (68 with the plant's story) | 76 (78): the five new stories (T031) in two themes |
| `gates/test/integration/visual.test.ts:116, 120, 139, 244` | the 66 story-themes and 66 baseline files | 76; the baselines are made in the pinned container under docker (operator decision 4) |
| `gates/test/integration/plant-repo.test.ts:225` | the 66 baselines the plant tree copies | 76 |
| `gates/test/integration/storybook-build.test.ts:55` | "built 33 stories" | 38 |
| `storybook/test/integration/elements-stories.test.ts` | the element stories' ids | extended to the five page-header stories (T028) |

No sibling (#16, #15, #9) had changed these lists by the phase base.

## Departures and choices, with the reason

- The page header is built from research.md R-04 and R-07 as amended (`a9a46eb`, operator decision 5): the section
  header's structure (outer column, eyebrow wrapper, wrapping row of the heading column and the actions), the actions
  wrapper keeping the initial `flex: 0 1 auto`, the heading column hidden while the `heading` and `description` slots
  are both empty, and the actions then taking `margin-inline-start: auto`. The row is hidden when heading,
  description and actions are all empty, so an eyebrow alone takes no gap under it, as in the section header.
- The section header's lesson R1-02 (`reviews/phase-2/round-1.md`) is covered from the red commit: a scenario in 300 px
  containers with actions only, an eyebrow and actions, a heading and actions, and a description and actions.
- The 320 px pass of `storybook/test/integration/elements-stories.test.ts` also asserts that the story's elements are
  upgraded (each has its shadow root), so that the pass of a story whose content fits at 320 px cannot hold while the
  element is undefined. This applies to the section-header and card stories too, which are green with it.
- `background: none` (R-07, "no ground of its own") is not written as a declaration: it is the host's initial value, so
  the declaration would be one no plant could catch. The scenarios assert the host's computed ground is transparent,
  beside the rule under the band.
- Before the red commit, the style plants of R-17 and a mutation run (`gate:mutation -- --base a9a46eb`: 29 mutants,
  none survived) were run on the green code in the working tree. One plant had no failing scenario:
  `::slotted([slot="description"])` removed from the `display: block` group, because a `p` description is block-level
  already and `--ocelle-font-size-md` equals the page's 16 px, so an inline `span` description sits where a block one
  would. The token-sentinel scenario gained a twin whose description is a `span`: at the 15 px sentinel its border box
  is the heading column's gap below the heading only when it is drawn as a block. The heading is left out of the
  group: the `heading` slot takes a heading element, which is a block already, so `display: block` there would be a
  declaration no plant could catch.

## Baselines (T031), under operator decision 4

Made in #10's pinned container as #10 designed, `pnpm run visual:update -- --engine docker`: "baselines: wrote 10
files (10 added, 0 changed, 0 removed), 257798 bytes in total", the five new story-themes in light and dark
(`elements-ocelle-page-header--{heading-only,filled,compact,empty-heading,long-heading}`). No other baseline changed,
so there is no unexpected PNG to report. The visual plant `fail-token-changed` gains the four new light story-themes
that show `color-ink` (all but `elements-ocelle-page-header--empty-heading`, which has no heading); `gate:plants` judged
it as expected in the pinned container. No cross-engine comparison was possible: podman is absent here, so
`gate:visual` ran under docker alone ("docker only: no cross-engine comparison"). CI, which runs the gate under docker
and podman, confirms these baselines at landing.

## Gate plants changed by the new element (part of the green commit)

- `gates/plants/manifest/{fail-lost-attribute,fail-undescribed-*,pass-reordered}`: their copies of the committed
  manifest regenerated with the page header (the same derivation as phase 2's: the repository's manifest with the
  plant's source, minus the icon's `label` attribute, or with its keys reversed; the derivation reproduces the copies at
  the phase base byte for byte).
- `gates/plants/storybook-build/fail-empty-index`: the new story file replaced by one with no story export.
- `gates/plants/visual/fail-token-changed`: the four light story-themes above.

## Checks at the green state

OCELLE_CHROMIUM_PATH set to Chromium 1243; docker 29.9.2 as the engine (podman absent).

| Check | Result |
|---|---|
| `red.sh 3 phase` on `39df391` | tests only, red: 86 of 3379 failed, every one on an assertion (`red-phase.log`) |
| `gate:typecheck`, `gate:lint` (289 files), `gate:style-lint` (17), `gate:test-lint` (194), `gate:csp` (21), `gate:prefix` (250), `gate:pins` (5 manifests), `gate:config-copies` | pass |
| `gate:manifest` | "manifest: 5 elements checked, no finding" |
| `gate:storybook-build` | "built 38 stories" |
| `gate:axe` | "axe: 76 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)" |
| `gate:visual -- --engine docker` | "visual: 76 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:mutation -- --base a9a46eb` | 29 mutants, none survived; 3 compile errors, 1 zero-mutant entry (`src/index.ts`), 0 equivalent records |
| `gate:plants` (no `--skip-container`, `OCELLE_VISUAL_ENGINE=docker`) | "301 plants of 17 gates and the registry judged, every plant as expected" |
| `pnpm test` (dockerd running) | "3379 tests passed in 152 files" |
