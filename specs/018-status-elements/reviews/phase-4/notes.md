# Phase 4 notes (implementer): User Story 3, the static `ocelle-pill-tag` and the badge

## Commits

- `ff2d9930` scaffold: `src/ocelle-pill-tag.ts` (the class only, no shadow content, no registration), so the red tests
  fail on their assertions, not on a missing module.
- `bc22ea5b` red: T035 to T039 (operator decision I3: story tests, scenario bodies, node tests, token expectations and
  pinned counts in the red commit).
- green: T040 to T044 (the commit that adds this file).

## Red record

`red.sh 4 phase` on `bc22ea5b`: `tests_only: true`, `red: true`, exit 1, **166 of 8054 tests failed**
(`red-phase.log`, sandbox paths redacted to `<home>/`), each on the missing behaviour:

- `pill-tag.test.ts` (38 of 38) and its fixture twin `browser/pill-tag.test.ts` (37 of 37): the element is not
  defined, so the bodies read no shadow root (the static root's elements, the `.pill` box and styles, the label row,
  the tree); `consumers.test.ts` (6: the three pill rows in light and dark, "no `[part=\"pill\"]` in the shadow
  root"); `entry-pill-tag.test.ts`, `entry-root.test.ts`, `exports.test.ts`: the element is not defined or exported;
- node: the manifest declaration, the README section (8 fragments and 10 rules), the entry-points table and
  `package.json` exports, the CHANGELOG names and both statements; build and pack (`dist/ocelle-pill-tag.js`, its
  imports, the root's import, the browser build's definition, the `exports` entry);
- tokens: `line-height-snug` is not in the source, so every test reading the token table against the source fails
  (`themes.test.ts` 6, `values.test.ts` 9, `font.test.ts` 1, `index.test.ts` 2, `source-table.test.ts` 5 with the
  137-token pin, `readme.test.ts` 2), and the token stories' Type list (`stories.test.ts` 3, `render.test.ts` 2);
- story and gate counts: the five story ids in light and dark (10), 204 stories, 408 story-themes and baselines, 410
  axe plant runs, 23 manifest elements (`gates/test/manifest.test.ts`'s five root tests fail on the count line their
  outputs share); and `vitest-mutation-config.test.ts` ("starts source-table.test.ts first"), which counts the modules
  run after the source-table group, which fails here on its 137-token pin, as at phase 2 (a consequence of the red
  token tests; it passes in green).

The first red run (`639b51a6`, before the amend) failed 151 tests, but 8 in-process bodies and 7 fixture bodies passed
on the scaffold: the four stretched-host bodies, the seven names, the static click, the static focus and the sink body
assert only that nothing happens, which an element that never upgrades also satisfies. Each now also reads the
upgraded static pill (its static shadow root's elements; for the stretched host, a visible `.pill` wider than 0 and
narrower than its 200 px host), the red commit was amended, and the second run fails every pill body. No body failed
on a syntax, import or setup error.

## Departures from the plan, and points for the review

- **The icon-only pill's bottom offset is not pinned.** contracts/checks.md § US3 baseline pins the icon-only `bare`
  pill "where T002 measured it". The body pins the spike's top offset (−7.09 px; compact −7.39 px, against the
  surrounding text's top) and its size (29.19 × 50.09 px; compact 27.78 × 40.39 px), both in a paragraph and in a flex
  row, in both harnesses. The spike's bottom offset (+4.09 px; compact +5.39 px) is not pinned: it is the top, the
  height and the surrounding text's box together, and that text box is the font's. The in-process page loads no font
  file (`test/in-process.ts` removes the `@font-face` rules), and there the fallback family's text box is 1 px shorter
  at 14 px, so the bottom reads +5.09 px in process and +4.09 px on the fixture (which serves the font); the top and the
  size read as the spike did in both. The plants the bottom offset stood for are killed by the top (see the plant
  table: `bare` never set and the dropped override both read a top of −4.00 px, as the spike measured).
- **The dropped-override plant kills on the icon-only pill, not on the wrappers' block-starts.** As the phase-1 spike
  recorded (spikes.md § Notes for later phases), `.icon-row { align-items: baseline }` beside `.icon-slot {
  align-self: flex-start }` leaves the two wrappers' block-starts equal, so checks.md's stated reason does not hold;
  the same body kills the plant through the icon-only pill (top −4.00 px, height 39.09 px in the flex row). The plant
  has to sit after `iconSlotStyles` in the element's `styles` (an override before it is overridden by the convention's
  own `.icon-row { align-items: flex-start }` and changes nothing; the first plant run placed it there and it
  survived, which is why the table records the placement).
- **`min-inline-size: 0` on `.pill` is an equivalent plant.** checks.md § US3-8 names "`min-inline-size: 0` on the
  static host or `.pill`". On the host it is killed (all four US3-8 bodies). On the `.pill` it changes nothing: the
  `.pill` is a block in the host, not a flex item, so a minimum of 0 does not lower its min-content contribution, and
  the host's automatic minimum in the flex row is still the word; no body can tell it apart (48 of 48 passed with it).
- **The static click inside a link runs in process only** (`pillSinkScenarios`): the fixture driver has no navigation
  sink and a link there navigates for real (`navigations()` rejects on the fixture), as 012's `linkSinkScenarios`. The
  shared static-click body (ancestor listener, `click()`, enabled and disabled, beside a `<span>` twin) runs in both.
- **Non-static pills render nothing in phase 4.** The mode is read from the `interactive` and `href` attributes through
  012's `linkHref` (T041); phase 4 builds no interactive mode (I2), so a pill in button or link mode renders no shadow
  content until phase 5. Only the static side is tested (a pill whose `href` is empty, whitespace only or a
  `javascript:` URL stays static, beside one with no `href`). No body pins what an interactive pill renders: that is
  phase 5's, and pinning "nothing" here would be a test phase 5 must replace. The mutants of the `interactive` half of
  the mode read are therefore not killed in phase 4 (see Mutation).
- **The seven-names body clears the names at its end.** axe reports `aria-allowed-attr` (incomplete, critical) for
  `aria-pressed` left on the host, which has no role, exactly as the spec's Edge Cases say ("where axe may flag them").
  Every in-process body asserts no serious or critical axe result, so the body ends by removing the seven names, as the
  README tells hosts to (the rule T038 asks for), and asserts they are gone; the names are read on the host, as set and
  as changed, before that.
- **SC-001's `title` row reads the host's generic node named by the title.** Chromium names the host's generic node by
  a static pill's `title` (the browser's own behaviour, which the spec's Assumptions leave in place), so the row's tree is
  `generic Blocked since Monday`, `StaticText Blocked`. The US3 bodies read the tree without a title.
- **`href` and `label` defaults.** As in phases 2 and 3 (round 1, R1-01 and R1-06), the manifest declares `href` and
  `label` `undefined` (unset; the repository's convention for optional string properties) where
  contracts/elements-status.md writes `""`; unset and empty behave the same. `interactive` and `disabled` default to
  `false`, as on `ocelle-button`.
- **`label` is declared now.** T038 lists the static members without `label`; T041 adds the `label` attribute and
  property (not reflected, FR-025), so the manifest test declares it too, described as having no effect while static.
- **A layout rule for the `LongTextWraps` story.** The story's narrow block needs a width, and stories take no `style`
  attribute, so `storybook/.storybook/stories-layout.css` gains `[data-story="pill-narrow"]` (160 px from
  `--ocelle-space-10`, capped at 100 %), as the facts and empty-state stories' wrappers do. Not named by T043.
- **`fail-token-changed` gains no line.** T043 says the plant is "extended". None of the five static pill stories shows
  `color-ink`: each pill's text, border and icon are in its status colour (`color-neutral` is its own token, not an
  alias of `color-ink`), and the stories hold no other text. The plant's `why` now says so; its findings are unchanged.
  Not confirmed by a plant run (see `plants.md`).
- **Tests added in green (strengthening, no red test changed).** The first mutation run read 18 surviving mutants in
  `ocelle-pill-tag.ts`, each a gap in phase 4's own surface, and four bodies were added to `scenarios/pill-tag.ts`
  (both harnesses): "Mode read" (a pill with `interactive`, a link-mode `href` or both does not render the static
  shadow root, beside static twins, and removing `interactive` makes it static again; it reads the mode only, not
  what an interactive pill renders, so it stays true in phase 5), "Reflection" (`interactive` and `disabled` default
  to false with no attribute, and `interactive`, `href` and `disabled` reflect and read back), "Attribute changes"
  (`status`, `variant` and `density` each changed alone after the first render) and the forwarded-slot and
  empty-nodes read of the label (`flatten`, `join`). Each of the 18 mutants applied by hand fails exactly one of them
  (the plant script's mutant table, below); each fails on the scaffold too, which renders nothing.
- **A wrapped pill keeps the pill radius.** `LongTextWraps` shows a wrapped static pill as a rounded block whose first
  and last lines run close to the curved corners (its radius is `--ocelle-radius-pill` in every variant and mode,
  operator decision SPEC-1-04). Nothing is clipped (`US3-5` reads every character inside the box and unclipped); the
  look is the spec's, recorded for the review.
- **The baseline body's wrapping twins.** checks.md asks for "a long text that wraps, whose first text line is on the
  baseline of its own line". A wrapping static pill is at its cap and alone on its line in a paragraph, with no text
  beside it to compare with, so the body reads it twice: in a 150 px `align-items: baseline` flex row beside "Name" (the
  first line's bottom on "Name"'s, within 0.5 px), and in a 120 px paragraph (its first line at the same offset from
  the pill's top as a one-line pill's).

## Guard plants (T044), each run once in process (`test/pill-tag.test.ts`, `test/consumers.test.ts`, 48 tests), the source restored after each

| Plant (contracts/checks.md § US3 bodies and more) | Change to `src/ocelle-pill-tag.ts` | Result |
|---|---|---|
| a click guard on the static host | a host `click` listener calling `preventDefault()` and `stopPropagation()` | 2 failed: static click, static click in a link (sink) |
| `delegatesFocus` set | `shadowRootOptions` with `delegatesFocus: true` | 1 failed: static focus |
| `overflow-wrap: anywhere` | `.label`'s `break-word` → `anywhere` | 4 failed: US3-8 in each variant and density |
| `min-inline-size: 0` on the static host | added to `:host` | 4 failed: US3-8 in each variant and density |
| `min-inline-size: 0` on `.pill` | added to `.pill:not(.control)` | **none failed: equivalent** (see above) |
| the static host `inline-grid` | `:host { display: inline-grid }` | 5 failed: US3-8 ×4, hidden (its visible twin reads `display: inline-grid` where `inline-block` is expected) |
| the `.icon-row` cap removed | the `.icon-row { max-inline-size: 100% }` rule deleted | 4 failed: US3-8 ×4 |
| `box-sizing: border-box` removed | deleted from `.pill:not(.control)` | 4 failed: US3-8 ×4 (the capped `.pill` sticks out of its host and container) |
| `inline-size: fit-content` removed | deleted from `.pill:not(.control)` | 4 failed: the stretched host in each variant and density |
| the text wrapper without the `label` class | `<span class="text">` | 15 failed: the structure, US3-4 ×2, US3-5, US3-6 ×2, US3-8 ×4, baseline ×4, empty pill |
| `bare` on every row | `class="icon-row bare"` | 10 failed: the structure, US3-4 ×2, US3-6 ×2, baseline ×4 (offset −3.09 px), empty pill |
| `bare` never set | `class="icon-row"` | 5 failed: baseline ×4 (the icon-only pill's top −4.00 px, hanging below the line), empty pill |
| the dropped override | `.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }` after `iconSlotStyles` | 4 failed: baseline ×4 (the icon-only pill's top −4.00 px; placed before `iconSlotStyles` it changes nothing, see above) |
| `:host([hidden])` removed | the rule deleted | 1 failed: hidden |
| the label observer without `characterData`, `childList` or `subtree` | each option `false` in turn | 1 failed each: the empty pill (text arriving later) |
| the `slotchange` listener removed | `<slot></slot>` | 9 failed: the structure, US3-4 ×2, US3-6 ×2, baseline ×4 |
| the seven names handed to 012's `MovedAttributes.handle()` while static | the seven names observed and handed to `handle()` | 4 failed: seven names, US3-7, SC-001's `title` row in light and dark |

The first runs were on the 38 in-process bodies of the red commit and SC-001's rows (48 tests); the mutants of the
first mutation run were then applied one by one to the 42 bodies of the green commit (52 tests with SC-001's rows):

| Mutant (line of `ocelle-pill-tag.ts` at the first mutation run) | Failed |
|---|---|
| 55 `interactive` `reflect: false`; `{}` | Reflection |
| 56 `href` `{}`; `reflect: false` | Reflection |
| 57 `disabled` `reflect: false` | Reflection |
| 229 `this.disabled = true` | Reflection |
| 281 the link test `true`; `&&` → `\|\|`; the `interactive` test `true`; `getAttribute("")`; `hasAttribute("")` | Mode read |
| 293 the static guard `false` | Mode read |
| 64 `"status"`, `"variant"`, `"density"` → `""`, each | Attribute changes |
| 287 `assignedNodes({})`; `{ flatten: false }`; `join("Stryker was here!")` | the forwarded-slot and empty-nodes read |

## Gates (T044)

Node 26.13.0 (`/opt/node26/bin` first on PATH), `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
one heavy job at a time; per `reviews/operator-ci-first.md` the fast gates, this phase's tests, the phase's baselines
and mutation locally, the full suites left to CI:

- `gate:typecheck`: no type error; `gate:lint`: 475 files, no finding; `gate:style-lint`: 45 files, no finding;
  `gate:test-lint`: 352 files, no finding; `gate:manifest`: 23 elements, no finding; `gate:config-copies`: identical;
  `gate:csp`: 48 files, no finding (after the elements build); `gate:prefix`: 504 files, no finding; `gate:pins`: 5
  manifests, no finding; `gate:contrast`: 207 pairs in light, 215 in dark (196 required per theme; the new token is a
  line height, with no pair); `gate:brand-rules`: 7 rules checked. `gate:signoff`: on the commit range, after this
  commit.
- `gate:storybook-build`: built 204 stories.
- This phase's tests and the tests whose pins changed: `pill-tag.test.ts` (42), `browser/pill-tag.test.ts` (41),
  `consumers.test.ts`, `entry-pill-tag.test.ts`, `entry-root.test.ts`, `exports.test.ts`, every `test/node` and
  `test/build` file of `@ocelle/elements` and every test file of `@ocelle/tokens` (projects `tokens` and
  `tokens-browser`): 31 files, 1136 tests passed (before the four bodies added in green; with them, 42 and 41 passed);
  `storybook/test/unit/stories.test.ts`, `storybook/test/integration/render.test.ts`,
  `storybook/test/integration/elements-stories.test.ts`, `gates/test/manifest.test.ts`,
  `gates/test/integration/manifest.test.ts`, `gates/test/integration/plant-repo.test.ts` and
  `gates/test/integration/vitest-mutation-config.test.ts`: 7 files, 654 tests passed.
- Not run locally, left to CI (`reviews/operator-ci-first.md`): `gate:visual` and `gate:axe` over all 408
  story-themes and their integration tests (`gates/test/integration/{visual,axe,storybook-build}.test.ts`, which rerun
  those gates with the new pins), and the rest of `gate:unit-tests`. The baseline run below captured every story-theme
  in the pinned container and changed no baseline but the twelve listed; every in-process pill body asserts no serious
  or critical axe result on its page.
- `gate:mutation -- --base 19448a1f…`: the first run read 18 survivors in `ocelle-pill-tag.ts` (above: Tests added
  in green); the second run reads **87 mutants on the changed lines of 3 files, none survived**; 1 timeout
  (`ocelle-pill-tag.ts:230`, the label observer's options replaced by `{}`, which throws in `observe()` in every
  constructor), 15 compile errors (`ocelle-pill-tag.ts:63`, `:239`, `:252`, `:253` ×2, `:265`, `:266` ×2, `:280`,
  `:287` ×3, `:291`; `source.ts:172` ×2), 1 zero-mutant entry (`index.ts`); 1 equivalent record (the `label`
  property's `{ type: String }`, `ocelle-pill-tag.ts:58`, as on `ocelle-button`: `{}` gives Lit's default options,
  which are type String's). The CSS in the `css` templates is not mutated by Stryker; the plants above cover its rules.
- Plants: `--affected` selects every plant; recorded with `--list` per `reviews/operator-plants.md` (`plants.md`).

## Baselines

Written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container (dockerd running;
`docker info` checked first): `baselines: wrote 12 files (10 added, 2 changed, 0 removed)`, the five pill stories in
light and dark, and `tokens--type` in light and dark, whose list of type tokens gains `--ocelle-line-height-snug`.
None was hand-edited or hand-picked; no cross-engine comparison.

## Operator rounds 2 and 3 fix (T044a; `round-2.md` O2-01, `round-3.md` O3-01, option A; label fix-1)

Commits: `ccd9c5a5` (the test-only change), then the fix commit that adds this section. Base `2f6a3245`. No element
source, story, baseline or other test changed.

**The change.** `scenarios/pill-tag.ts` exports `pillScenarios(harness)`, with `PillHarness { fontLoaded }` passed by
each runner as the other runners pass their options (`test/pill-tag.test.ts`: `pillScenarios({ fontLoaded: false })`;
`test/browser/pill-tag.test.ts`: `pillScenarios({ fontLoaded: true })`). The four Baseline bodies are one body
(`baselineScenarios(harness)`, listed after the other static bodies), not a fork: every assertion except the icon-only
pill's is the same in both harnesses. For `only-p` and `only-r`, in each density:

- fixture (`fontLoaded: true`): the row `icon-row bare` and T002's pin, unchanged (`top`, `[height, width]`, the
  `iconOnly` table written by hand);
- in process (`fontLoaded: false`): `row` `icon-row bare`; `aboveText` (the pill's top minus the surrounding text's
  top below 0); `width` (within 0.5 px of 2 × the inline padding + 2 × `border-width` + the icon + `space-2`);
  `wrapperTop` (the `.icon-slot` box's top within 0.5 px of the pill's top + `border-width` + the block padding);
  `heightAtLeast` (the height at least 2 × the block padding + 2 × `border-width` + the icon). The padding is the
  density's from the token table (`sizes`), the icon is one line (`1lh`, the density's `font-size` × `line-height`
  tokens, the same `lineHeight` the one-line height uses). The lower bound has a 0.02 px allowance, the same as the
  one-line `height` check, for the 1/64 px layout unit (26.09375 px renders 26.1); no pixel value is written.

**(1) The font.** Measured at `ccd9c5a5` with a scratch test file (not committed) that mounts the Baseline body's
icon-only paragraph (`<p class="around">`, 14 px, line height 1.15) and reads `document.fonts` after
`document.fonts.ready`:

- fixture (`vitest run --project elements-browser`, the page `pill-tag.html`, the built browser build): the pill's
  `.pill` family `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif`; 1 `@font-face` rule in the
  page's sheets; `document.fonts` = `Schibsted Grotesk 400 900 loaded`; `document.fonts.check('14px "Schibsted
  Grotesk"')` true; the icon-only pill top −7.09375 px against "Before", 29.1875 × 50.09375 px, so T002's pin
  (−7.09, 29.19 × 50.09) exactly;
- in process (`vitest run --project elements`): 0 `@font-face` rules in the document's and its adopted sheets,
  `document.fonts` empty, so the text uses the machine's fallback font (`check()` is true there too, but vacuously:
  with no face for the family it reports nothing to load). Here the sandbox's fallback happens to measure the same
  box (−7.09375, 29.1875 × 50.09375, the wrapper 5 px below the pill's top), which is why the pin held in the
  sandbox and failed on the runner.

**The CI failure, reproduced and fixed.** A scratch copy of the scenario (not committed) adds `:root {
--ocelle-font-sans: "FreeSans"; }` to the Baseline body's rules, then `vitest run --project elements
test/pill-tag.test.ts -t Baseline`:

- before (the scenario and runner of `2f6a3245`): 4 of 4 Baseline bodies fail, on the icon-only pill only: top
  −10.09 px and height 30.19 px (compact −9.39 px) against the pinned −7.09 / 29.19 (compact −7.39), the width 50.09
  unchanged, the four bodies the CI shard named;
- after (`ccd9c5a5`): 4 of 4 pass.

**(2) Red.** `red.sh 4 fix-1` on `ccd9c5a5`: `tests_only: true`, `red: false`, `recorded: false`, exit 2, after 90
minutes (`red-fix-1.log`; the focused runner selected 388 test files, the changed scenario module being shared). The
evidence is `invalid` with no failing assertion of the changed tests: the one failure is `gates/test/integration/
axe.test.ts` (the whole-repository axe gate, left to CI by `reviews/operator-ci-first.md`), unrelated to this change.
This change cannot be red on a commit: it is behaviour-neutral and test-only, the element is correct and unchanged,
and the new assertions hold on it (the in-process facts are true of the merged pill in every font measured), so no
commit of tests alone fails for the defect, which was in the test. `red-commits` gains no line. Instead each plant was
hand-applied to `src/ocelle-pill-tag.ts` at `ccd9c5a5`, the four Baseline bodies run in both harnesses
(`vitest run --project elements test/pill-tag.test.ts -t Baseline`, `vitest run --project elements-browser
test/browser/pill-tag.test.ts -t Baseline`) and the source restored with `git checkout` after each (the tree clean):

| Plant (applied to `src/ocelle-pill-tag.ts`) | In process (`elements`) | Fixture (`elements-browser`) |
|---|---|---|
| `bare` never set: the row `class=${"icon-row"}` | 4 of 4 failed: `only-p`, `only-r` `row` `icon-row` and `wrapperTop` false | 4 of 4 failed: `only-p`, `only-r` `row` `icon-row`, `top` −4 (and the size 39.09 / 35.39 px high) |
| `bare` on every row: the row `class=${"icon-row bare"}` | 4 of 4 failed: `onBaseline` false for the four one-line pills (`in-p-plain`, `in-r-plain`, `in-p-icon`, `in-r-icon`), `firstLineOnBaseline` false for `wrap`; the icon-only facts hold (its row is `bare` anyway) | 4 of 4 failed: the same `onBaseline` and `firstLineOnBaseline`, and the one-line `height` false |
| the dropped override: `` css`.icon-row { align-items: baseline; } .icon-slot { align-self: flex-start; }` `` after `iconSlotStyles` | 4 of 4 failed: `only-p`, `only-r` `wrapperTop` false | 4 of 4 failed: `only-p`, `only-r` `top` −4 (and the height) |

Every plant is killed in both harnesses; none survives either. The killing assertions are also in `plants.md`.

**Gates** (Node 26, `OCELLE_CHROMIUM_PATH` as above, one heavy job at a time): `pill-tag.test.ts` 42 of 42 and
`browser/pill-tag.test.ts` 41 of 41 passed; project `elements-node` 10 files, 1351 tests passed; `gate:typecheck`,
`gate:lint` (750 files), `gate:style-lint` (88), `gate:test-lint` (574), `gate:manifest` (52 elements),
`gate:config-copies`, `gate:prefix` (872), `gate:pins` (5), `gate:contrast` (207 / 215 pairs), `gate:brand-rules` (7),
`gate:sandbox-paths` and `gate:signoff`: no finding; `gate:mutation -- --base 2f6a3245`: exit 0, "nothing to mutate: no package or gate source line changed since 2f6a3245" (the change is test-only). `tdd-check.sh
4` is not run here (left to the orchestrator).
