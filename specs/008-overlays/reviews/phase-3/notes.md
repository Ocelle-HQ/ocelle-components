# Phase 3 notes: User Story 2, a modal side drawer

Base `4aaf9e4` (`base.sha`). Environment: Chromium 153 (`OCELLE_CHROMIUM_PATH`), Playwright 1.64.1, docker with the
pinned Playwright image; `CI` and `GITHUB_ACTIONS` unset.

## Scaffold and red (T034)

- Scaffold `4b11736` (`scaffold.sha`): `src/ocelle-drawer.ts`, the class `OcelleDrawer extends OcelleOverlay` with its
  event prefix and the declared `side`, `ground` and `headingHidden`, no behaviour, not defined and not exported.
- Red commit `eb71638` (amended twice before green; `red-commits`), test files only; `red.sh 3 phase`: `tests_only`
  true, `red` true. Log: `red-phase.log`, 881 of 4759 tests failed, each by an assertion (691), a bounded poll that names
  the missing events ("2 events not recorded within 1 000 ms", 184) or the missing close control ("no
  [part="close-button"] in #dlg", 6): `ocelle-drawer` is not defined and `drawer-inline` does not exist. By file: the
  drawer rows in process (386) and on the fixture (388), the repeated-Escape and before-definition cases, the entry
  test and the export keys; the eight nested-in-drawer rows in each harness; the manifest entry and the published
  check, the README and CHANGELOG fragments (28), the dist and pack lists (3 + 1); the token tests (expected.ts's row
  shows in `index`, `source-table`, `themes`, `values`, `font` and the CHANGELOG check; the new 320 px test and README
  fragment), and through them the Shell token story tests (`storybook/test/unit/stories.test.ts` × 3,
  `storybook/test/integration/render.test.ts` × 2); the 12 drawer story tests and the gate counts (`storybook-build`
  35 stories, `axe` and `visual` 70 story-themes, the axe plant run 72, the 70 baseline files in `plant-repo` and in
  `visual.test.ts`'s baseline command test), the manifest gate's repository runs (4 elements).
- The first red run (`b02085b`) showed the two nested-in-drawer Tab rows passing: they asserted only the dialog's own
  cycle, which holds with the drawer undefined. The amend (`a407870`) adds the drawer's and the dialog's state and the
  top-layer order (`drw[dialog]` then `inner[dialog]`) to both, so they fail at red for the missing drawer. The second
  run (`a407870`) showed two fixture rows of the panel-border click failing with a CDP `Invalid parameters` error: with
  no panel the computed point was NaN. The amend (`eb71638`) gives the point a finite fallback, so those rows fail on
  their assertions; their expected values are unchanged.
- `gates/test/integration/vitest-mutation-config.test.ts` "starts source-table.test.ts first …" fails at red because
  `packages/tokens/test/source-table.test.ts` fails there (the missing `drawer-inline` token), which stops that ordered
  run after its first module; it passes at green.

## How the inherited rows are built (T030)

- `test/scenarios/dialog.ts` is now one builder, `overlayScenarios({ tag, prefix, entry, settle })`: the dialog's
  bodies with the tag in their markup and the prefix in their events. `dialogScenarios`, `repeatedEscapeScenario` and
  the upgrade exports are the dialog's build, in the same order and with the same names, bodies and expected values as
  before (350 rows), plus T031's eight nested-in-drawer rows after the nested ones; all pass in both harnesses.
- The drawer takes every group matrix § Drawer inherits. Not inherited, as the matrix states: the dialog's long body,
  one-line body and styles rows (`geometryRows`, `styleRows`), its backdrop row (a click does nothing on the dialog),
  and its motion, body and footer rows (`motionRows`, `shortBodyRows`, `unitlessMotionRows`, `footerSlotRows`, and in
  the mixed T025 groups the rows named `Motion…`, `Body (…` and `Footer (…`), which the drawer's own Motion, Long body,
  One-line body and Styles rows replace. The one inherited row that reads the entry keyframes (rapid toggle during the
  entry) takes the drawer's slide (`entry`).
- `settle` (drawer only): before a pointer click in an inherited body, a bounded poll (1 000 ms, fails with a message)
  until no open overlay in the top layer runs its entry animation; a closing one is not waited for, so the clicks of
  "input during the exit" stay during the exit. Reason: the drawer's entry slides the panel (FR-028), so a click at an
  element's centre computed during the slide lands where the element was (measured: 16 inherited rows failed that
  way, focus on the body or the click on the backdrop); the dialog's fade does not move the panel, and its `settle` is
  absent, so its bodies are unchanged.

## Measurements while writing the rows

- `getKeyframes()` serialises the drawer's `translate: "0"` as `"0px"` and keeps `"-100%"` / `"100%"` (Chromium 153).
- The analyzer lists the drawer's own `side`, `ground` and `headingHidden` before the inherited `open`, `label` and
  `closeLabel` (generated into a scratch root outside the repository).
- The accessibility tree of an open drawer whose body holds a focusable element has one unnamed `generic` node beside
  the named ones (also without `heading-hidden`); the heading-hidden row reads the named nodes.
- `token-only` rejects `clip-path: inset(50%)`; the visually hidden heading is a `size-visually-hidden` box with
  `overflow: hidden`, `white-space: nowrap` and `opacity: 0`, still in the tree.
- A click at a fractional point on the panel's 1 px inner border hits the `<dialog>`; `pointerdown` reports the
  fractional `clientX`, `click` the integer one, both inside the border box.

## Green (T035 to T037)

- Green commit `76628c8`: the token, `src/ocelle-drawer.ts`, the base's `requestClose()` (the open-only request the
  close control already made, now also the drawer's backdrop) and `PropertyDeclarations` typing of its properties, the
  export, entry point, manifest, README and CHANGELOGs. The gates' Stryker comments that quote the renamed
  integration test titles name 70 story-themes (comment text only).
- `vitest run` of `elements`, `elements-touch`, `elements-node`, `elements-build`, `elements-browser`, `tokens`,
  `tokens-browser`: 2117 passed. `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`
  (4 elements), `gate:csp`, `gate:prefix`, `gate:config-copies`, `gate:contrast`, `gate:brand-rules`, `gate:pins`: no
  finding.

## Mutation (T037)

### The gate cannot run the elements configuration as it stands (operator decision needed)

`gate:mutation -- --base 4aaf9e4 --files packages/elements/src/ocelle-drawer.ts,packages/elements/src/overlay.ts,packages/elements/src/index.ts`
exits 2 ("Stryker wrote no report … Something went wrong in the initial test run"): Stryker's own log says "Initial
test run timed out!" after its default 5 minutes (`dryRunTimeoutMinutes`). The dry run runs every in-process test of
the `elements` and `elements-touch` projects, whatever `--files` names; with the drawer's rows these are about 760
browser rows, about 2.5 minutes for the dialog's and 3 for the drawer's here. `stryker.elements.config.json` is pinned
by `gates/test/vitest-config.test.ts` ("is stryker.config.json with its own Vitest config and its own report file"),
so raising the limit is a change to the mutation gate's configuration that this phase's design does not make; CI's
shards run the same dry run. Left for the operator: raise `dryRunTimeoutMinutes` in both configurations (with the
pinned test, red first), or another remedy.

To do the phase's mutation work all the same, the runs below drive the gate's own decision (`mutation()` of
`gates/bin/mutation.ts`, its git, read and remove tools unchanged) from a scratch script outside the repository whose
only difference is `--dryRunTimeoutMinutes 30` on Stryker's command line. Output in `mutation.log`.

| Run | Commit | Entries | Mutants on changed lines | Survived | Timeouts | Compile errors | Records |
|---|---|---|---|---|---|---|---|
| 1 | `7ad34c2` | `ocelle-drawer.ts`, `overlay.ts`, `index.ts` (scratch runner) | 83 | 4 | 0 | 17 | 0 |
| 2 | `fae8680` | the same (scratch runner) | 84 | 0 | 0 | 17 | 0 |
| 3 | `fae8680` | the six gate files (comment lines only, zero mutants) and `packages/tokens/src/source.ts` (the gate itself) | 6 | 0 | 0 | 2 | 277 (the gate files' process-boundary records) |

No equivalent-mutant record was added. The own-close count and the toggle path of the base (review phase 2 R1-01) got
no new test from the drawer: no drawer row reaches a case the dialog's rows do not.

### How the findings were resolved, test first

| Finding | Rows (test commit, red log) | Fix |
|---|---|---|
| (before run 1) the border box's right and bottom edges compared with `>`: a press and click on the backdrop's first pixel column beside a start panel (x = 320), or its row below a shortened panel (y = 600), read as inside | nine rows on the panel's first and last pixel columns and rows and the backdrop pixel next to each, the block axis with `::part(panel)` shortening the panel (`e99f5bb`, `red-edges.log`: 2 red) | `7ad34c2`: `>=` (R-07's border box is the half-open area of the panel's pixels); the listeners on the host, reading `composedPath()[0]` |
| run 1, `ocelle-drawer.ts:109` `#pressedOutside = false` → true | a script `click()` on the panel with no press (`c35305c`, with the next three rows) | — (killed) |
| run 1, `:117` `event.button === 0` → true, `\|\|` | a secondary-button press on the backdrop, then a primary click while it is held (Chromium fires one pointerdown, the secondary's, and a click for the primary): nothing (checked by hand against the mutant) | — (killed) |
| run 1, `:117` `event.isPrimary` → true | a second, non-primary pointer (the stand-in's synthetic `pointerdown`) pressed on the backdrop between the primary's press inside and its click outside: nothing | — (killed) |
| the same rows found two faults of `7ad34c2` | a script `click()` after a vetoed backdrop click requested again (the record outlived its click); a non-primary press inside cleared the primary's press outside (`red-press.log`: 2 red) | `fae8680`: only the primary pointer's press is recorded, and a click consumes it |

## Stories and baselines (T039, T040)

- `storybook/stories/drawer.stories.ts`: the six stories of data-model § Stories (start, end, rtl start, chrome
  ground, chrome ground with heading-hidden, long scrolling body). `gate:storybook-build`: built 35 stories.
- Baselines produced in the pinned container with `pnpm run visual:update` (docker): 14 files written, 12 added (the
  drawer's) and 2 changed: `tokens--shell.light.png` and `tokens--shell.dark.png`, because the Tokens/Shell story
  lists every shell token and now shows `--ocelle-drawer-inline` (T035); the pull request must say so (constitution
  V). No cross-engine (podman) comparison was possible in this container: only docker is available (`gate:visual`
  reports "docker only: no cross-engine comparison"). CI's captures win over these.
- `gate:visual`: 70 captures match their baselines.
- `gate:axe`: **2 findings in 70 story-theme runs**: `elements-ocelle-drawer--long-scrolling-body/light` and `/dark`,
  `color-contrast-incomplete: serious: p:nth-child(8)`, the paragraph across the body's scroll edge in the 1280 × 800
  capture. It is the measurement R-16 records for the dialog's long-scrolling-body story in Phase 2, where the
  operator decided an empty `data-story="dialog-scroll-edge"` block across the edge (2026-11-14). That decision names
  the dialog's story; nothing in the design decides the drawer's, so the story is left as data-model § Stories states
  it and the finding goes to the operator (R-16: "stop for the operator"). The other five drawer stories have no
  finding.
- `fail-token-changed`: measured in the pinned container by `gate:plants -- --shard 16` before the lines were added
  (4 unexpected `differs`: the start, end, rtl start and long scrolling body stories in light; the two chrome-ground
  stories show `color-chrome-ink`, not `color-ink`), then the four lines added; shard 16 then judged every plant as
  expected, and so did shard 19 (`visual/pass-repository`). Shard 27 (`axe/pass-repository`) was not run: it audits
  the repository's stories, whose axe finding above is open. The full `gate:plants` was not run (longer than the
  session allows); the other shards are left to CI.
- T040 stays open until the operator decides the long-scrolling-body story's scroll edge.

## Full suite

`pnpm test` at `78e5424`: 2 of 4787 tests failed, both in `gates/test/integration/axe.test.ts`, both from the open
axe finding on the drawer's long-scrolling-body story: "audits the repository's 70 story-themes and exits 0" (exit 1
with the two findings) and "fails a story with an unlabelled button …" (five lines instead of three: the plant's two
and the repository's two, then the summary). Every other test passes, the drawer's and dialog's rows in both harnesses
among them. `tdd-check.sh 3` needs this suite green, so it waits for the operator's decision on that story.
