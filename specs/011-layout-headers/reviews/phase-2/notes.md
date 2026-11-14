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
- R-04 gives the actions wrapper `flex: 0 0 auto`. With it, six actions at 320 px stay on one line and overflow the
  header (the red test "FR-004, many actions at 320 px" fails on it). The wrapper keeps the initial `flex: 0 1 auto`
  instead: on a line of its own and wider than it, it shrinks to the line and its actions wrap, `--ocelle-space-2`
  apart. Side by side with the heading nothing changes, since the row wraps before any item shrinks. The source
  comment of `src/ocelle-section-header.ts` says so; research.md is not changed here.
- The slotted heading, eyebrow and description are `display: block` (a normal `::slotted()` rule that a page rule
  beats), so that a `span` eyebrow's border box is its line and the gaps of FR-011 hold when they are measured to the
  slotted element's border box, as US1-2 asks.

- The heading column is never hidden, so a header with an eyebrow and actions but no heading or description keeps its
  actions at the inline end (FR-010); the row is hidden when heading, description and actions are all empty, so an
  eyebrow alone takes no gap under it (FR-005). The wrappers of the unstyled slot parts carry only the `empty` class,
  so no class name exists that no rule reads.
- The first mutation run of the green code (`gate:mutation -- --base 296e02d`) had survivors that no test covered: an
  empty card body, an eyebrow-and-description header, an eyebrow-and-actions header, and the header's
  `requestUpdate()` on connection (a card copy that never notifies). The tests for them were added to the red commit
  (amended before the green commit, red.sh run again), and the code changed as the two items above say; the second
  run has no survivor and one equivalent record (`#compact`'s initial value, set by `willUpdate` before every render).

## Left open

- **T023, baselines part** (operator decision 2 of `reviews/operator-decisions-implementation.md`, "Baselines at
  landing"): the twelve stories (`storybook/stories/section-header.stories.ts`, `storybook/stories/card.stories.ts`)
  are written and pass the story test, the 320 px pass and the `axe` gate (66 story-themes, run here). Their visual
  baselines are not produced: there is no docker or podman in this container. T023 stays open until the baselines come
  from CI's captures at `/ocelle-land`.
- The `visual` gate's plant `gates/plants/visual/fail-token-changed` lists every light story-theme that shows
  `color-ink` and says that a later story adds its line there. The new stories very likely show it (their headings
  are in `--ocelle-color-ink`), but which story-themes differ can only be measured in the pinned container, so the
  plant's list is not changed here. It is part of the same open item: `gate:plants` judges the visual plants only
  where a container engine runs, and the list is updated when the baselines are produced.
- The token stories' baselines (`tokens--colour.*.png`, `tokens--type.*.png`) change with the four new tokens, since
  those stories list every token of their group. They are refreshed with the same CI captures.

## Gate plants changed by the new tokens and elements (part of the green commit)

- `gates/plants/contrast/text-below-threshold`: the plant changes `color-ink-muted`, and `color-eyebrow` is its alias,
  so the eyebrow rows get the same recorded figures and the same three below-threshold findings.
- `gates/plants/manifest/{fail-lost-attribute,fail-undescribed-*,pass-reordered}`: their copies of the committed
  manifest regenerated with the two new elements (the same derivation as before: the repository's manifest with the
  plant's source, minus the icon's `label` attribute, or with its keys reversed).
- `gates/plants/storybook-build/fail-empty-index`: the two new story files replaced by story files with no story
  export, as the plant does for the other four.
