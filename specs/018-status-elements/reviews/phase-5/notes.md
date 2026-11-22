# Phase 5 notes (implementer): User Story 4, the interactive pill

## Commits

- `a95d5772` scaffold: `MovedAttributes.capture()`, `release()` and `adoptMirrors()` as empty methods and `guardHost`'s
  additive, defaulted `active` parameter, accepted and not read; nothing calls them. With `reviews/phase-5/base.sha`.
- `3968024a` red: T045 to T049 (operator decision I3: story tests, scenario bodies, node tests, token expectations and
  pinned counts in the red commit).
- green: T050 to T055 (the commit that adds this file).

## Red record

`red.sh 5 phase` on `3968024a` (the amended red commit): `tests_only: true`, `red: true`, `recorded: true`, exit 1,
**217 of 8241 tests failed** (`red-phase.log`, sandbox paths redacted to `<home>/`). By file:

- `pill-tag-interactive.test.ts` (65 of 65) and its fixture twin `browser/pill-tag-interactive.test.ts` (62 of 62): the
  scaffold's interactive pill renders no shadow content, so each body fails on its assertions, on the driver's "no
  `.control` in the shadow root" or on Playwright's "Element is outside of the viewport" for a click on the zero-size
  host (the log's classifier shortens these driver errors to `Error: empty`). Each is the missing interactive render,
  not a syntax, import or setup error.
- `control.test.ts` (5): the scaffold's empty `capture()`, `release()`, `adoptMirrors()` and the unread `active`.
- node: `readme.test.ts` (26: 17 fragments, 8 rules, the `ocelle-pill-tag-activate` name under Added), `manifest.test.ts`
  (1), `changelog.test.ts` (2).
- tokens: `target-small` is not in the source, so every test reading the token table fails (`themes.test.ts` 6,
  `values.test.ts` 9, `font.test.ts` 1, `index.test.ts` 2, `source-table.test.ts` 5 with the 138 pin, `readme.test.ts`
  2), and the token stories (`stories.test.ts` 3, `render.test.ts` 2); `vitest-mutation-config.test.ts` (1) fails on
  the source-table group as at phases 2 and 4.
- stories and gates: the nine story ids in light and dark (18), 213 stories, 426 story-themes and baselines, 428 axe
  plant runs (`axe` 2, `plant-repo` 1, `storybook-build` 1, `visual` 3).

The first red run (`2f277d8f`, before the amend) failed 218 tests, but one shared body passed on the scaffold in both
harnesses: "US4-8, same task" read only the end state (`aria-label="New"` on the host, no mirror), which a pill that
moves nothing also has. It now reads first that both pills hold "Old" as moved. That run also had three 60 s timeouts in
suites this phase does not touch (`browser/dialog.test.ts`, `browser/drawer.test.ts`, the static `browser/pill-tag.test.ts`
"Attribute changes" body), under load; the second run has none. The amend also carries the test changes made while
going green, all test files (listed under Departures). The red commit was amended, as the flow allows, and `red.sh`
run again.

## Open operator question (stop-and-ask, contracts/checks.md § US4-7)

**Q-P5-1. The corner clicks of § US4-7 contradict the pill radius.** contracts/checks.md § US4-7 asks that "on a
one-character compact badge a click at each corner inset 1 px delivers one `click` and one `ocelle-pill-tag-activate`".
Chromium hit-tests a box with `border-radius` by its rounded shape. Measured before the red commit on a stand-in
(`<button>` 24 × 24 px with `border-radius: 999px`, `min-block-size` / `min-inline-size` 24 px, inside an `inline-grid`
host): of the clicks at (1, 1), (23, 1), (1, 23) and (23, 23) none reached the button (the first went to the host, which
012's guard stops; the others to the paragraph and the body), while the clicks at the top and the start edge's
midpoints inset 1 px did. Every pill takes `--ocelle-radius-pill` (SPEC-1-04, constitution II; phase 4 R1-01: a wrapped
pill keeps the pill radius), so the clause cannot pass as written. The red commit leaves it out; the body that is there
pins the 24 × 24 px control box and one click and one activate event at each edge's midpoint inset 1 px, and none 1 px
outside. T046 stays open on this clause only. Options:

- **(a)** Keep the pill radius; read US4-7's "the area that takes a pointer click is at least 24 px by 24 px" as the
  control's box being at least `--ocelle-target-small` in each axis, proven by clicks at each edge's midpoint inset 1 px
  (as the red commit does); the rounded corners take no click, as on any round control; drop the corner clause from
  contracts/checks.md § US4-7. No source change.
- **(b)** Keep the pill radius and make the square box take clicks: a click that lands on the host inside the control's
  border box but outside its rounded shape is forwarded to the control instead of being stopped by 012's guard (a
  pill-only change to how the guard is used; 012's `guardHost` and `ocelle-button` unchanged).
- **(c)** Draw the interactive pill's corners with a radius small enough for the corners inset 1 px to hit the control
  (a departure from SPEC-1-04's every-variant-and-mode reading of constitution II).

## Departures from the plan, and points for the review

- **The corner clicks of § US4-7 are not in the tests** (Q-P5-1 above); T046 stays open on that clause.
- **The tooltip half of § US4-10 is phase 6's.** Phase 5 does not wrap the control in `ocelle-tooltip` (tasks T059
  does, with the `./ocelle-tooltip.js` import), so the body pins focus and ring after the switch, not the shown tooltip.
  The refocus is queued in a microtask as R-08 and the phase-1 spike require; its plant "the refocus in `updated()`
  (not queued)" survives in phase 5 because without the tooltip there is no `slotchange` to race (recorded below);
  phase 6's tooltip body kills it.
- **The `min-inline-size: 0` chain and the disabled text's `overflow-wrap: anywhere` are left to phase 6.** R-07 puts
  them in the interactive host sheet for truncation (US5); no phase-5 body can observe them while every interactive
  pill wraps, so they would be untested source here. The host sheet holds `inline-grid`, the cap and the ring margin.
  The control's own minimum inline size is `--ocelle-target-small`, not 0 (FR-043), which still lets a flex row shrink it.
- **The mode transitions run in `attributeChangedCallback`, the refocus is noted there too.** R-08 notes the focus in
  `willUpdate`; a property set reflects the attribute inside Lit's update, after `willUpdate`, so the note is taken in
  the `interactive`/`href` callback where the old control is still in place. The host sheet is adopted and removed in
  `updated()`.
- **Test changes made while going green, carried into the amended red commit (no assertion weakened).** Two bodies failed only on axe's
  `label-content-name-mismatch` (serious): their names did not contain the visible text. The label and references
  bodies now use names that contain it ("Mine filter", "Mine, by reference", "Blocked, by reference"), each still
  distinct from the text, so every name source is still told apart.
- **Tests strengthened for the first mutation run** (19 survivors, then 1, then 0), also in the amended red commit: the control test reads
  `changed` for a mirror read back; US4-1 reads that mounting takes no focus; the label body reads the inner
  `aria-label` (none under `aria-labelledby` or for a blank `label`); the references body reads that a reference with
  no element sets no content attribute and that a reference to a later id resolves on reconnection; US4-10 reads that an
  unfocused pill takes no focus at a switch and that a later update does not refocus; US4-12 reads an interactive
  pill's own `title` winning over its mirror and a mirror written after the upgrade staying through a reconnection.
  The manifest test's event order follows the analyzer (the dispatched `ocelle-pill-tag-activate`, then the
  JSDoc-only `click`), equally strict.
- **Equivalent code removed in green:** `capture()`'s null check (`handle()` ignores a null value) and the pill's
  selective `changed` callback (every path already requests an update; it now resolves the references on any change).
  One equivalent record: `connectedCallback`'s static test (see Mutation).
- **Gates not run locally** (orchestrator's CI-first rule): `gate:unit-tests` in full, `pins`, `contrast`,
  `brand-rules`, `storybook-build`, `visual`, `axe`; CI judges them. T055 is ticked on that basis.
- **Plants**: `--affected` selects 116 of 317 this phase; only `--list` was run, per the orchestrator's rule, although
  `operator-plants.md` would have the narrower selection run (see `plants.md`).
- **`href` and `label` defaults** stay `undefined` in the manifest, as at phases 2 to 4 (R1-01, R1-06).

## Plants

Each plant was applied once to the green source (a copy restored after), and only the bodies its guard sits in were
run in process (`vitest --project elements <file> -t <pattern>`):

| Plant | Test file | Bodies | Result | Verdict |
|---|---|---|---|---|
| capture reads no mirror back | control.test.ts | `reads back the mirror` | 1 failed | killed |
| release leaves the mirrors | control.test.ts | `release` | 1 failed | killed |
| release writes a cleared value back (an empty attribute for each name not held) | control.test.ts | `release` | 1 failed | killed |
| adoptMirrors overwrites the host's own attribute | control.test.ts | `adoptMirrors` | 1 failed | killed |
| adoptMirrors leaves the mirrors | control.test.ts | `adoptMirrors` | 1 failed | killed |
| guardHost's active check dropped | control.test.ts | `active parameter` | 1 failed | killed |
| label property-only | pill-tag-interactive.test.ts | `label attribute` | 1 failed | killed |
| an aria-pressed value filter | pill-tag-interactive.test.ts | `US4-4: aria-pressed` | 1 failed | killed |
| border-width changed by a state | pill-tag-interactive.test.ts | `Equal boxes` | 1 failed | killed |
| resting border removed | pill-tag-interactive.test.ts | `Looks, resting` | 2 failed | killed |
| badge fill removed | pill-tag-interactive.test.ts | `Looks, hover` | 2 failed | killed |
| disabled border rule removed | pill-tag-interactive.test.ts | `US4-5, disabled look` | 2 failed | killed |
| the :host([disabled]) .control forced-colours rule removed | pill-tag-interactive.test.ts | `Forced colours \(` | 2 failed | killed |
| the forced-colours pressed rule removed | pill-tag-interactive.test.ts | `Forced colours, pressed` | 2 failed | killed |
| the forced-colours pressed rule's :not([disabled]) dropped | pill-tag-interactive.test.ts | `Forced colours, pressed` | 2 failed | killed |
| the control class dropped from the button | pill-tag-interactive.test.ts | `focus ring` | 2 failed | killed |
| min-block-size removed | pill-tag-interactive.test.ts | `US4-7` | 5 failed | killed |
| min-inline-size removed | pill-tag-interactive.test.ts | `US4-7` | 3 failed | killed |
| the host not inline-grid | pill-tag-interactive.test.ts | `stretched host` | 1 failed | killed |
| the static .pill sizing selected as .pill | pill-tag-interactive.test.ts | `stretched host` | 1 failed | killed |
| the interactive text wrapper without the label class | pill-tag-interactive.test.ts | `Baseline, interactive` | 4 failed | killed |
| bare on every row | pill-tag-interactive.test.ts | `Baseline, interactive` | 4 failed | killed |
| release() deferred to the update | pill-tag-interactive.test.ts | `same task` | 1 failed | killed |
| the mode read from Lit properties | pill-tag-interactive.test.ts | `attribute order` | 1 failed | killed |
| capture() not called | pill-tag-interactive.test.ts | `US4-9` | 2 failed | killed |
| the guard active while static | pill-tag-interactive.test.ts | `Interactive click` | 1 failed | killed |
| delegatesFocus set | pill-tag-interactive.test.ts | `Interactive focus` | 1 failed | killed |
| the static guard in attributeChangedCallback removed | pill-tag-interactive.test.ts | `Seven names, interactive` | 2 failed | killed |
| no refocus after a button/link switch | pill-tag-interactive.test.ts | `US4-10, focus` | 1 failed | killed |
| the refocus in updated() (not queued) | pill-tag-interactive.test.ts | `US4-10, focus` | 1 passed | 64 skipped (65) | **survived** |
| adoptMirrors() not called | pill-tag-interactive.test.ts | `US4-12` | 1 failed | killed |
| release() not called | pill-tag-interactive.test.ts | `US4-8` | 3 failed | killed |
| the host sheet not removed on -> static | pill-tag-interactive.test.ts | `interactive host sheet` | 1 failed | killed |
| the ring's inline margin removed | pill-tag-interactive.test.ts | `clearance` | 1 failed | killed |
| pressed in link mode (the mode check dropped) | pill-tag-interactive.test.ts | `Custom states|US4-10:` | 2 failed | killed |
| activate on a modifier link click | pill-tag-interactive.test.ts | `sink` | 1 failed | killed |
| the cancel not forwarded | pill-tag-interactive.test.ts | `cancelled` | 5 failed | killed |
| activate while disabled | pill-tag-interactive.test.ts | `US4-5` | 2 failed | killed |

The one survivor, "the refocus in `updated()` (not queued)", is the ordering against `ocelle-tooltip`'s `slotchange`,
which phase 5 has no tooltip to show (above); phase 6's § US4-10 tooltip body is its guard. "No refocus at all" is
killed. Every other plant makes its guard fail; none stops the phase.

## Gates run locally

- `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest` (23 elements, no finding),
  `gate:config-copies`, `gate:csp` (48 files), `gate:prefix`, `gate:signoff -- --range <base>..HEAD` (2 commits at the
  time; the green commit is signed off too): all pass.
- This phase's own suites: in process `pill-tag-interactive.test.ts` (65), `pill-tag.test.ts` (42),
  `control.test.ts` (48), and 012's `button.test.ts`, `action-row.test.ts` with `consumers`, `entry-*`, `exports`
  (221), unchanged and passing; on the fixture `browser/pill-tag-interactive.test.ts` (62), `browser/pill-tag.test.ts`
  (41), `browser/button.test.ts` and `browser/action-row.test.ts` (174); `elements-node`, `tokens`, `elements-build`,
  `storybook` (1121); `tokens-browser` (35); `storybook-integration` for the pill and token stories (44).
- Baselines: `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` (`docker info` checked first): `baselines: wrote 20
  files (18 added, 2 changed, 0 removed)`, the nine new stories in light and dark and `tokens--size` light and dark,
  whose size list gains `--ocelle-target-small`. None hand-picked or hand-edited; no conflict to regenerate.
- `gate:mutation -- --base <base>`: first run 283 mutants, 19 survivors (above); second run 271 mutants, 1 survivor
  (`ocelle-pill-tag.ts:498`, equivalent, recorded with a `Stryker disable` comment); the confirming run on those lines
  reads 15 mutants, none survived, 1 equivalent record. 2 timeouts and 68 compile errors on the changed lines of the
  second full run. The CSS in the `css` templates is not mutated; the plants above cover its rules.
