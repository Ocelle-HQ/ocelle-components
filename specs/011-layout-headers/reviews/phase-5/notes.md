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

## Before the red commit

R-10's "measure before red" items were measured with the element written in the working tree first and the red
tests run against it in both harnesses (the element was then set back to the scaffold for the red commit, and the red
run, `red-phase.log`, is against the scaffold): with and without base.css, the host's border box is 52 px wide with a
44 px content box, a horizontal rail's border box equals its container's inline size at 320 px, the host is 600 px
tall in 600 px block, flex-row and grid containers and grows past 100 px ones in all three kinds, a horizontal rail
with only bottom items has them at the inline end in LTR and RTL, the stand-in items' computed colour is
`--ocelle-color-chrome-ink`, and the focus ring of a 40 px item is drawn on every side inside the rail's border box.
The axe half (no `color-contrast` or `target-size` finding on the stand-in items in either theme) is the `axe` gate's
run over the eight rail stories at the green state (below).

Seven of the planned pairing plants were tried at the same time, and a review of the planned declarations against the
scenarios followed. Three things changed the red tests before the red commit:

- **Template re-rendered per orientation** (contracts/checks.md, the US4-5 row): a `keyed(this.orientation, …)`
  template failed no test. Chromium keeps the focus on a slotted link whose slot is replaced in the same update, so
  focus, order and the landmark hold even with new shadow nodes. US4-5 therefore also asserts R-10's reason for the
  outcome, that the template does not change with orientation: the driver gained `identities(id)`, a number per
  shadow element that stays the same for the same node, and US4-5 asserts the numbers before and after each change
  are the same (and not empty). With it the plant fails US4-5 in both harnesses.
- **A bottom group wider than half** (FR-025: "as wide as its items on one row, up to half the rail's content inline
  size, beyond which its own items wrap"): no scenario held `max-inline-size: 50%`, the bottom group's wrapping or its
  `justify-content: flex-end`, so the red tests gained a scenario of its own (two primary and five bottom links at
  320 px). It also showed the primary group centred in a layout made taller by the bottom group's second line; the
  primary items now start at the block start (`align-self: flex-start` on both horizontal groups), as R-10's "items
  are centred in the block direction within their row" reads.
- **US4-3 in a container of definite block size** (600 × 200 px): R-10 sets `min-block-size: auto` on the horizontal
  host, which no scenario held while every container had an indefinite block size; US4-3 now asserts the horizontal
  rail is as tall as its one row in a 200 px tall container.

## Departures and choices, with the reason

- **The landmark and the internals** as phase 4 (R-11): `readonly [internalsKey] = this.attachInternals()` with
  `@internal` only (no `@ignore`), so the plant "the `@internal` tag removed" lists a member and fails the manifest
  test; the role and the name are set in `updated()`, not the constructor, so the analyzer lists no `role` member.
  The wrappers' classes are Lit's `classMap`, for the reason phase 4 records.
- **Two of R-10's declarations are not written**: `flex: 0 1 auto` on the horizontal bottom group is the initial
  value, and `border-block-start: none` on the horizontal divider changes no pixel (the divider is 1 px wide, so its
  block-start border lies in the same column, in the same colour). Each would be a declaration no plant can catch.
- **`align-self: flex-start` moved from the bottom group to both horizontal groups** (above).
- **The README example's bound** is 720 px, the bound US4-4 measures around; the example sets `orientation` on load
  and on the query's `change` event (R-10).
- **US4-10 through a same-origin module**: the driver gained `module(code)`. On the fixture it serves the code as
  `/module.js` of the page's origin through Playwright's request routing, with the fixture's CSP header, and imports
  it from the page (`script-src 'self'` allows it; the browser suite allows the path `module.js` besides the build and
  `rail-items.css`); in process it imports a blob URL of the test page (no CSP there). The body reads the README
  through Vite's `?raw` import in both harnesses, and its first assertion is the example's presence (at red:
  "expected '' to contain 'matchMedia('", `red-phase.log`).
- **The stand-in items** (R-10): `test/browser/fixtures/rail-items.css`, linked by `personal-rail.html` and
  `personal-rail-base.html` and added to the in-process page's head from the same file (`?raw`); in Storybook the same
  rules sit in `storybook/.storybook/stories-layout.css` under `[data-story="rail-items"]`, with a 320 px
  `[data-story="rail-narrow"]` root for the Wrapped story. No `style` attribute anywhere.
- **Dividers read from pixels**, as phase 4: a run of rows (vertical) or columns (horizontal) of the rail's content box
  every pixel of which is the divider's colour.
- **No tests of their own for `identities` and `module`**: both are driver plumbing whose results the scenarios
  assert, and each is shown able to fail through a plant (the `keyed` plant fails US4-5 through `identities`, the
  README `max-width` plant fails US4-10 through `module`).

## Baselines (T046), under operator decision 4

Made in #10's pinned container as #10 designed, `pnpm run visual:update -- --engine docker`: "baselines: wrote 16
files (16 added, 0 changed, 0 removed), 125402 bytes in total", the eight new story-themes in light and dark
(`elements-ocelle-personal-rail--{vertical,horizontal,no-bottom,no-primary,wrapped,host-aria-label,label-and-host-aria-label,blank-host-aria-label}`).
No other baseline changed, so there is no unexpected PNG to report. The Wrapped story's narrow root was then changed
from `inline-size: 320px` to `max-inline-size: 320px` (the story test's 320 × 800 px pass found it scrolling at 320 px
with the story padding); the visual gate still matched all 114 captures afterwards, so the baselines did not change.

The visual plant `fail-token-changed` (color-ink changed in light) was measured on this tree in the pinned container
under docker (the token changed in the working tree, `pnpm run gate:visual -- --engine docker`, the token restored):
"visual: 46 findings in 114 story-themes", the same forty-six light story-themes the plant lists. None of the eight
rail stories shows `color-ink`: the rail is drawn in the chrome ink on the chrome and nothing else in them is text. So
no finding is added; the plant's reason now says so.

No cross-engine comparison was possible: podman is absent here, so `gate:visual` ran under docker alone ("docker
only: no cross-engine comparison"). CI, which runs the gate under docker and podman, confirms these baselines at
landing.

## Gate plants changed by the new element (part of the green commit)

- `gates/plants/manifest/{fail-lost-attribute,fail-undescribed-*}`: their copies of the committed manifest with the
  rail's module merged in (`git merge-file` of the copy, the base's manifest and the new one, each clean);
  `pass-reordered`: the new manifest with every object's keys reversed (that derivation reproduces the copy at the
  phase base byte for byte).
- `gates/plants/storybook-build/fail-empty-index`: the new story file replaced by one with no story export.
- `gates/plants/visual/fail-token-changed`: the reason only (above).
