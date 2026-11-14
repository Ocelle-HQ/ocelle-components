# Phase 2 notes (implementer)

Phase base `296e02d` (`base.sha`).

## T016a: pinned element lists at the phase base

Searched at the phase base, `packages/elements/test`, `gates/test` and `storybook/test`, for assertions that pin the
package's element classes, entry points, `exports` keys, manifest module paths, `dist` files or a count that follows
from them (`grep -rn "ocelle-brand-mark\|OcelleBrandMark\|brand-mark.js\|2 elements\|42 story"`). Each one this phase's
green tasks (T020 to T024) change is changed in the red commit:

| File and place at the base | What it pins | Change in the red commit |
|---|---|---|
| `packages/elements/test/exports.test.ts:9-10` | the root's run-time exports, sorted | `OcelleCard` and `OcelleSectionHeader` added in the namespace's sorted order |
| `packages/elements/test/entry-root.test.ts:11-12` | the elements the root defines, as its classes | `ocelle-card` and `ocelle-section-header` added (T014) |
| `packages/elements/test/node/readme.test.ts:125-131` (`entryRows`) | the README's Entry points table | the rows of `@ocelle/elements/ocelle-card.js` and `@ocelle/elements/ocelle-section-header.js` after the element rows, before `browser.js` |
| `packages/elements/test/node/readme.test.ts:173` | the `exports` keys | `./ocelle-card.js`, `./ocelle-section-header.js` in the same place |
| `packages/elements/test/node/manifest.test.ts:250` | the manifest's module paths by code point | `src/ocelle-card.ts`, `src/ocelle-section-header.ts` added |
| `packages/elements/test/build/build.test.ts:44-49` | the module build's file list and the root's imports | `ocelle-card.js`, `ocelle-section-header.js` and the root importing both |
| `packages/elements/test/build/build.test.ts:83-90` | the elements the browser build defines | `ocelle-card` and `ocelle-section-header` added |
| `packages/elements/test/build/pack.test.ts:20-21` | the packed element files | `dist/ocelle-card.js`, `dist/ocelle-section-header.js` added |
| `gates/test/manifest.test.ts:86, 91` | "manifest: 2 elements checked" on the repository | 4 elements |
| `gates/test/integration/manifest.test.ts:19` | the same, on the repository's plant tree | 4 elements |
| `gates/test/integration/axe.test.ts:52, 56, 68` | the repository's 42 story-themes (44 with the plant's story) | 66 (68): the twelve new stories (T023) in two themes |
| `gates/test/integration/visual.test.ts:116, 120, 139, 244` | the 42 story-themes and 42 baseline files | 66; these five tests need a container engine and fail here at the base and at HEAD (operator decision "Baselines at landing"), and the baseline count holds once the baselines are committed at landing |
| `storybook/test/integration/elements-stories.test.ts` | the element stories' ids | extended to the new stories (T017) |

No sibling (#16, #15, #9) had changed these lists by the phase base.

The R-12 contrast counts were re-read at the base and are at the places R-12 lists (T009).

## Departures from the task text, with the reason

- T014 names one file, `entry-card-order.test.ts`, for both definition orders. Once both elements are defined in a test
  file's iframe neither can be undefined, so the reverse order (the section header first) is a second file,
  `entry-card-order-reverse.test.ts`, with the same assertions.
- The readme test's Styles fragment "Variant rules go inside `@media not (forced-colors: active)` …" contradicted the
  amended convention of FR-001 and FR-036; it is replaced by the two fragments of the amended paragraph (colour and
  ground variant rules inside the query, layout-only variant rules outside), which assert more.
- The driver gains `listen`, `heard` and `move` (test plumbing for the no-event check of R-13 and the DOM moves of
  R-05), in both harnesses; the readers they forward to are the DOM's own.
