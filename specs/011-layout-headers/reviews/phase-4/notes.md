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
