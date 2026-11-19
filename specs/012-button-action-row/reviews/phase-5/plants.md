# Phase 5 plants (T059): the plants of T050 to T054, each run once

Each element plant was applied to the source in the working tree, and the in-process tests were run once:
`pnpm exec vitest run --project elements packages/elements/test/action-row.test.ts`, 43 tests, all passing without a
plant. The source was then restored with `git checkout`.

- Run on 2026-11-15 on 1274bbd (the phase's element source) in Chromium 156 (`chromium-1248`).
- Every plant made the tests fail.
- The script is scratch and not committed; each row below gives the change.
- The fixture run (`test/browser/action-row.test.ts`) shares the same bodies on the built browser build. The plants
  were not rebuilt into it.

| Plant | Change | Result | Failing tests |
|---|---|---|---|
| description wrapper back inside the inner control (decision 30) | the `[part=description]` wrapper rendered inside the inner control, after the title | 2 failed, 41 passed (43) | US4-3 (the subtree's text and axe `label-content-name-mismatch`); US4-12 |
| hit layer positioned against the inner control (decision 30) | `.control { position: relative; }` | 16 failed, 27 passed | US4-15 (the layer's box), US4-15 (the clicks beside the control), US4-1 and US4-10 (pointer clicks), US4-17, US4-8, … |
| siblings without `pointer-events: none` (decision 30) | every `pointer-events: none` removed (the groups' and the siblings') | 1 failed, 42 passed | US4-15, the clicks on the description, a tag and the trailing icon |
| sibling colours removed (decision 30) | the description, tags and trailing ink rules removed (main, chrome and forced colours) | 8 failed, 35 passed | US4-8 (default and flush, light and dark), US4-17 (light and dark), forced colours (both palettes) |
| the raw assigned elements referenced (decision 25) | `description` and `tags` hold every assigned element, not only those with text | 3 failed, 40 passed | US4-6 (ltr, rtl), US4-16 |
| no `MutationObserver` (decision 25) | the observer never observes the host | 3 failed, 40 passed | US4-6 (ltr, rtl), US4-16 |
| wrappers hidden from the raw assigned elements (decision 25) | the wrappers' `hidden` follows every assigned element; the description still keeps only those with text | 2 failed, 41 passed | US4-6 (ltr, rtl) |
| the flush hover token changed (decision 6) | the flush hover fill `--ocelle-color-active-bg` | 2 failed, 41 passed | US4-8 flush (light, dark) |
| no ring (decision 21, US4-9) | the `.control:focus-visible .hit` outline rule removed | 4 failed, 39 passed | US4-9 (light, dark), forced colours (both palettes) |
| host restored to `display: block` (decision 18) | `:host { display: block; }` | 1 failed, 42 passed | US4-15 (the layer's box) |
| `title` not moved (decision 22) | `title` dropped from the moved list | 2 failed, 41 passed | US4-16; decision 19's mirrors |
| no mirror (decision 19) | `MovedAttributes` writes no mirror (src/control.ts) | 3 failed, 40 passed | decision 19's mirrors; decision 24's morph; US4-16 |
| mirror not restored (decision 24) | `MovedAttributes.handle` restores no mirror (src/control.ts) | 1 failed, 42 passed | decision 24's morph |
| `chrome` treated as unknown (decision 20) | every `[ground="chrome"]` selector of the row made `[ground="chrome-x"]` | 6 failed, 37 passed | US4-8 (default and flush, light and dark), US4-17 (light, dark) |
| no host listener (decision 23) | the row registers no host guard | 1 failed, 42 passed | the host guard test (a click dispatched on the host is stopped) |

Two plants of contracts/checks.md and the scenario header have no row:
- **"name from content"** belonged to the design before decision 30, which labelled the inner control by its title
  wrapper. Since decision 30 the name comes from the content by design. The plant that guards "the name is exactly
  the title" is now the first row: the description wrapper back inside the inner control.
- **"the layer positioned against the inner control"** is the second row.

## Gate plants

- `visual/fail-token-changed` gains the twelve light story-themes of the row stories that show `color-ink` (every
  story but chrome). Its shard, `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 40`, first gave
  "not-caught: findings differ: unexpected …" naming exactly those twelve. With them added it gave "shard 40 of 76: 1
  plant judged, every plant as expected" in 194.0 s (5b0917c).
- `storybook-build/fail-empty-index`: its tree gains an empty `action-row.stories.ts` (1274bbd).
- The manifest plants' committed-manifest copies gain the `ocelle-action-row` module (in `pass-reordered` with its
  keys reversed) (the commit after 1274bbd).
