# Phase 2, review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | fix-1 045bd1f (red-fix-1.log: the 11 new tests fail on assertions, icon off centre and an 8 px margin) | packages/elements/src/ocelle-button.ts (`#readLabel`, the `bare` row class, the text observer); storybook/baselines/elements-ocelle-button--icon-only.{light,dark}.png; packages/elements/README.md; packages/elements/test/scenarios/button.ts ("US1-7, US1-8, icon-only"); packages/elements/test/button.test.ts ("icon gap follows the label text") |
| R1-02 | deferred: a note; the reviewer asks for the plan record "at the next planning touch" and the extra assertion with it, and this fix changes neither the plan nor US1-6 | none | none |
| R1-03 | fixed: the comment of `flushHoverUnchanged` now names dark `neutral-bg` (comment only, no red) | none | packages/elements/test/scenarios/button.ts:136-140 |
| R1-04 | no change (the review requires none) | none | none |
| R1-05 | no change (the review requires none) | none | none |

## R1-01

- **Red (fix-1, 045bd1f, tests only).** A scenario per size (`default`, `compact`) and direction (ltr, rtl), run in
  process and on the strict-CSP fixture: an icon-only button with `label="Close"`, the same with whitespace around the
  icon, and one whose text span sits in an unknown slot each centre the icon on the inner control's inline centre
  within 0.5 px; moving the span into the default slot gives the 8 px gap of US1-8, moving it out centres the icon
  again; a flush icon-only button starts its icon at the inner control's inline start. In process only (the driver
  reaches neither a text node nor a page shadow root): the gap follows the data of a slotted text node, which fires no
  `slotchange` (whitespace, then "Close", then whitespace); an empty slotted `<span>` is no label and one with text is
  one; a label forwarded through another shadow root's `<slot>` is one, and an empty forward is none. `red.sh 2 fix-1`:
  `"recorded": true`, 12 of 3359 failed: the 11 new tests, each on its assertion (`plain`/`whitespace`/`moved`/`again`
  false; margin "8px" where "0px" was expected), and `gates/test/integration/visual.test.ts` "captures the
  repository's 76 story-themes twice under docker", a docker flake unrelated to the change (the first red run of the
  same tests, before the in-process additions, had 9 failures and no visual one; the whole suite has passed twice
  since, 3359 tests).
- **Fix.** "No label" uses FR-031's emptiness of a row slot: no non-whitespace text in the default slot's flattened
  assignment. `ocelle-button` reads it on the default slot's `slotchange` and, through a `MutationObserver` on the host
  (`characterData`, `subtree`), on text changes inside its light children, which fire no `slotchange` (a template's
  text binding). Without a label the row takes the class `bare`, and the button's own rule
  `.icon-row.bare slot[name="icon"]::slotted(*) { margin-inline-end: 0 !important; }` drops the icon's gap; with a
  label the convention's gap applies as before (US1-8 unchanged). `src/icon-slot.ts`, the shared convention, is not
  changed, and no other element uses it, so no other element's look changes.
- **Baselines.** `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container wrote exactly two
  files: `elements-ocelle-button--icon-only.light.png` and `.dark.png` (2 changed, 0 added, 0 removed); viewed: both
  close glyphs centred, the default button 54 px wide and the compact one 38 px (8 px narrower each). No PNG was
  hand-edited or hand-picked. `gate:visual` (docker): 76 captures match.
- **Mutation.** `gate:mutation -- --base 156491e`: 27 mutants on the changed lines of `ocelle-button.ts`, none
  survived; 2 timeouts (the observer's options replaced by `{}` or `characterData: false`, which make `observe()` throw
  in the constructor), 3 compile errors (the `?? []` fallback), 0 equivalent records. A first run found the
  `disconnectedCallback` and an "unchanged" early return unasserted; both were removed (the observer is set up in the
  constructor and holds its target weakly, and the read always requests an update).

## Checks run (after the fix)

`gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:prefix`, `gate:pins`, `gate:config-copies`,
`gate:manifest` (3 elements), `gate:contrast`, `gate:brand-rules`, `gate:csp`, `gate:storybook-build` (38 stories),
`gate:visual` (docker, 76 match), `gate:axe` (76 story-theme runs, 0 serious or critical), `pnpm test` (3359 passed),
`gate:mutation -- --base 156491e` (see above), and `gate:plants` with `OCELLE_VISUAL_ENGINE=docker` on the shards
that build on the repository's stories and baselines: 1 to 3 (the other gates' plants), the visual repo-tree plants
(shards 5, 7, 22, 24, 34, 40 `fail-token-changed`, 49 `pass-repository`) and every axe shard (52 to 76): every plant
as expected.
