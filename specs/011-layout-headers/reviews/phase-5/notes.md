# Phase 5 notes (implementer)

Phase base `2b1c1ac` (`base.sha`), scaffold `3cda650` (`scaffold.sha`).

## T043a: pinned element lists at the phase base

Searched at the phase base, `packages/elements/test`, `gates/test` and `storybook/test`, for assertions that pin the
package's element classes, entry points, `exports` keys, manifest module paths, `dist` files or a count that follows
from them (`git grep -n "OcelleContextSidebar\|context-sidebar\.js\|src/ocelle-context-sidebar.ts\"\|6 elements\|49 stories\|\b98\b\|\b100 story" 2b1c1ac -- packages/elements/test gates/test storybook/test`,
the context sidebar's own suites left out). Each one this phase's green tasks (T045, T046) change is changed in the red
commit:

| File and place at the base | What it pins | Change in the red commit |
|---|---|---|
| `packages/elements/test/exports.test.ts:8-11` | the root's run-time exports, sorted | `OcellePersonalRail` added in the namespace's sorted order (after `OcellePageHeader`, before `OcelleSectionHeader`) |
| `packages/elements/test/entry-root.test.ts:9-19` | the elements the root defines, as its classes | `ocelle-personal-rail` added (T042) |
| `packages/elements/test/node/readme.test.ts:196-206` (`entryRows`) | the README's Entry points table | the row of `@ocelle/elements/ocelle-personal-rail.js` after the element rows (after `ocelle-context-sidebar.js`), before `browser.js` |
| `packages/elements/test/node/readme.test.ts:248` | the `exports` keys | `./ocelle-personal-rail.js` in the same place |
| `packages/elements/test/node/manifest.test.ts:250` | the manifest's module paths by code point | `src/ocelle-personal-rail.ts` added (after `src/ocelle-page-header.ts`) |
| `packages/elements/test/build/build.test.ts:44-63` | the module build's file list and the root's imports | `ocelle-personal-rail.js` and the root importing it |
| `packages/elements/test/build/build.test.ts:147-160` | the elements the browser build defines | `ocelle-personal-rail` added |
| `packages/elements/test/build/pack.test.ts:20-25` | the packed element files | `dist/ocelle-personal-rail.js` added |
| `gates/test/manifest.test.ts:86, 91` | "manifest: 6 elements checked" on the repository | 7 elements |
| `gates/test/integration/manifest.test.ts:19` | the same, on the repository's plant tree | 7 elements |
| `gates/test/integration/axe.test.ts:52, 56, 68` | the repository's 98 story-themes (100 with the plant's story) | 114 (116): the eight new stories (T046) in two themes |
| `gates/test/integration/visual.test.ts:116, 120, 139, 244` | the 98 story-themes and 98 baseline files | 114; the baselines are made in the pinned container under docker (operator decision 4) |
| `gates/test/integration/plant-repo.test.ts:225` | the 98 baselines the plant tree copies | 114 |
| `gates/test/integration/storybook-build.test.ts:55` | "built 49 stories" | 57 |
| `storybook/test/integration/elements-stories.test.ts` | the element stories' ids | extended to the eight personal-rail stories (T043) |

No sibling (#16, #15, #9) had changed these lists by the phase base.
