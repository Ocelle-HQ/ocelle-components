# Phase 2 notes for the review

Implementer's notes on phase 2 (User Story 2, `ocelle-code-block`): where the work departs from the letter of
tasks.md and why, what the red record shows, and what is left open. The operator's decisions are in
`operator-019.md` (T020), `operator-spike-decisions.md` (T021) and `operator-axe-decision.md` (T021a); the spike and
the axe measure are in `spike.md` and `axe-unnamed-scroll.md`; the plant runs (the gate's affected run and the element
plants of T033) are in `plants.md`, the gate runs in § Gates below.

## Scaffold: constitution VIII exemption (T022)

The scaffold commit (`scaffold.sha`) adds `src/ocelle-code-block.ts` with its `define` call, `@tagname`, the declared
properties `overflow`, `label` and `digest` (each `@default undefined`) and an empty `render()`, and its exports (the
package root, which the browser build's entry imports, and `package.json`'s `./ocelle-code-block.js`). It has no
behaviour: nothing is rendered, observed or styled, and it does not import the overflow-region module, so no test could
fail for it; the red commit's tests run against it and fail on their assertions (`red-phase.log`).

## Red record

`red-commits` holds one `phase` record, 45ad758 (I3: the stories file and the story-test extension are in the same red
commit). `red.sh 2 phase`: `"tests_only":true,"red":true,"recorded":true`. `red-phase.log`: 198 of 8153 tests fail,
197 on an `AssertionError`, none on an import, syntax or setup error of a new test:

- the 44 bodies of `test/scenarios/code-block.ts`, in process (`test/code-block.test.ts`) and on the strict-CSP
  fixture (`test/browser/code-block.test.ts`): all 44 fail in each harness. A body that reads a shadow part the
  scaffold does not render returns `{ error }` through `guarded`, so it fails on its assertion. Re-run in process on the
  scaffold to read those values: the 24 such bodies all report a missing part (`no .code`, `no .block` or
  `no .region-box in the shadow root of #<id>`); the other 20 fail on the values they read (no units, no text, an
  inline host, no tab stop);
- the entry test, the root entry's new case and the module build test of `dist/ocelle-code-block.js`;
- the manifest (1), README (21: 15 statements with the Digests rule, its place under § Element conventions, the Entry
  points table and four names under Added) and changelog (2) node tests;
- the 70 story tests of the extension (render in light and dark, reflow for the six wrap-mode stories, keyboard for the
  seven overflowing scroll stories, no animation under both motion settings, the unnamed box);
- the pinned counts of the gate tests that read the committed manifest, the stories or the baselines (`manifest`: 22
  elements, and the three stale-entry cases that list the uncommitted element; `axe`: 432 story-themes; `visual`: 432
  baselines; `plant-repo`: 432 baselines);
- one failure that is not this phase's: `gates/test/integration/plant-repo.test.ts:263` ("fails to build a root whose
  repository's exception entries name a plan file the repository does not hold"), `Error: Hook timed out in 10000ms`.
  The test is unchanged by this phase and passed when run again on the green tree (§ Gates); a timeout under the full
  suite's load.

Tests that pass at red, by design:
- the driver additions' own tests (`test/driver.test.ts`, `test/browser/driver.test.ts`): they test the harness, which
  the red commit itself adds (contracts/checks.md § Driver additions);
- the root exports test and the browser build's defined tags: the scaffold already exports and defines the element;
- `gates/test/integration/storybook-build.test.ts` (216 stories): the stories file is in the red commit.

## Departures from tasks.md, with the reason

- **Two driver readers beside the contract's three additions** (T023), as phase 1 added two: `clientRects(id, inner)`,
  the client rects of every shadow element matching `inner` (the break-position oracle reads one rect per group and
  per prefix; the driver had `lines` for light-DOM elements only), and `characters(id, inner)`, each code point of a
  shadow element's text with the box of a range over it (US2-8's visual order and line starts, US2-9's "no gap inside
  a group"). Each is tested with the three additions in `scenarios/driver-additions.ts`, in both harnesses.
- **The copy methods read the clipboard back from a user paste, in both harnesses**, as the existing `clipboardCopy`
  does, rather than through `navigator.clipboard.readText()`: the paste's `clipboardData` holds the same `text/plain`
  and needs no permission grant in either harness (the in-process harness has no command to grant one, and adding a
  command means changing `vitest.config.ts`, which is not a test file). The sentinel is put on the clipboard by a user
  copy of a scratch field before each copy; the driver test shows that a second copy replaces the first.
- **The in-process `ariaSnapshot` is Vitest's vendored copy of Playwright's generator** (`utils.aria` of
  `vitest/browser`, run in the test's frame), not a new browser command, for the same reason; the fixture harness uses
  Playwright's `locator.ariaSnapshot()`. The driver test gives the same snapshots in both (`- text: sha256:9f86d081`
  for the shadow `pre`, `- text: LIGHTTEXT sha256:9f86d081` for its host), as the spike measured.
- **The test page applies its rules before the code blocks exist.** The scenario page mounts an empty root, adds the
  test rules, then appends the markup, so every block first lays out in its frame. Measured on the first green run:
  with the rules added after the mount, an `rtl` scroll block opened at the line starts of its unframed first layout
  and kept that position when the frame rule narrowed it, which is FR-021's rule (no write after a resize), not a
  fault of the element.
- **US2-19 in scroll mode counts the module's ring room.** The scroll-mode block is one line of `.code` (24.8 px) plus
  `.block`'s padding and border plus the overflow-region module's block ring room on `.region-box` (2 × 5 px, every
  host of the module has it, 009 contract § Stylesheet); `.code` itself is one line high in both modes. The oracle of
  contracts/checks.md names the padding and border only; the body asserts both readings.
- **The unnamed scroll box's CDP node is read at rest.** Measured on the story test's first run: once the unlabelled
  overflowing box has focus, Chromium 156 names the `generic` tab stop from its content in the CDP tree (the whole
  command line); at rest its name is empty, as T021a read it. The story test and US2-7's body read the node before
  focus. The README's "always give a scroll block a `label`" stands.

## Known gaps, recorded, not worked around

- Mission 019's additive change to `src/overflow-region.ts` and the shared-file conflicts (`src/index.ts`,
  `custom-elements.json`, `CHANGELOG.md`, `README.md`, `package.json`, the test drivers, the gate integration counts,
  `storybook/.storybook/stories-layout.css`) are `/ocelle-land`'s (operator decision `operator-019.md`).
- No podman cross-check of the baselines was possible in this environment.
- The late-font opening of an `rtl` scroll block (§ The right-to-left scroll story and a late font).

## Stop for the operator: the DigestScroll exception rows (T028, tasks.md § Stop-and-ask points, "axe")

The axe gate's own `axe()` was run on the repository root with its build narrowed to the 14 code-block stories and the
Prose document (scratch runner, not committed; the Prose document keeps its ten entries from being reported stale),
with the 14 planned entries in `storybook/a11y-exceptions.json`: `axe: 26 findings in 30 story-theme runs`.

- Six of the seven overflowing scroll stories give exactly the planned node in light and dark, each reported as
  excepted: `note: elements-ocelle-code-block--<story>/<theme>: color-contrast-incomplete: serious: ocelle-code-block
  >>> .code excepted (clipped line of the code block's scroll box (`elmPartiallyObscured`))` for `scroll-overflowing`,
  `scroll-middle`, `scroll-end`, `scroll-focused`, `right-to-left-scroll` and `scroll-unlabelled` (12 entries). The
  Prose document's ten notes are unchanged.
- **`elements-ocelle-code-block--digest-scroll` differs from its rows**, in light and in dark. The gate prints no
  `.code` node there: it prints 12 `color-contrast-incomplete` serious nodes per theme, one per digest group that the
  scroll box clips, `ocelle-code-block >>> .group:nth-child(11)`, `(13)`, … `(33)` (the odd children, the groups 5 to
  16 of `sha256:` and 16 groups; the even children are the `<wbr>`s). The two planned `ocelle-code-block >>> .code`
  entries for it match no node, so the gate reports them as `stale-exception` (`storybook/a11y-exceptions.json#18`
  and `#19`), beside the 24 unexcepted nodes.

**Answered** (`operator-digest-axe-decision.md`, 2026-11-21): (a), 24 per-group rows, applied to plan.md by the
planner in 0df133c. `storybook/a11y-exceptions.json` now holds 36 code-block entries (12 `.code`, 24
`.group:nth-child(<n>)` for n = 11, 13, … 33 in light and dark), matching plan.md's rows; the axe gate's excepted list in
`gates/test/integration/axe.test.ts` follows (46 notes). The same narrowed run of the gate's `axe()` then gave `axe: 30
story-theme runs, 0 serious or critical; 46 notes (0 incomplete, 46 excepted)`: no stale entry, no unexcepted node, and
the notes in the run order the integration test lists.

## The right-to-left scroll story and a late font (T032)

The first `visual:update` showed the RightToLeftScroll story off its line starts (`cd /srv/app` showed only its last
letter, `ls` was out of view). The story rendered before the vendored web font arrived: the element opened the box at
the line starts of the fallback face, once, at its first layout, and kept that position when the font widened the
lines, as FR-021 says (no write after a resize). The story now has a Storybook loader that loads the
`--ocelle-font-sans` face before it renders, so its first layout is in the real font and the baseline shows the
element's own opening write (line starts in view, fade at the right). The element is unchanged. **For the operator:**
on a page whose web font arrives after an `rtl` scroll block first lays out, the block opens short of its line starts;
FR-021's "no write after a resize" rules out a second write, so a change would be a spec decision.

## Gates (T033), run locally on the green working tree

By the operator's CI-first decision (`reviews/operator-ci-first.md`), run locally: the fast gates, the affected plants,
the tests this phase changes, and `gate:axe` on the code-block stories (above):
- `gate:typecheck`, `gate:lint` (459 files), `gate:style-lint` (43 files), `gate:test-lint` (338 files),
  `gate:prefix` (484 files), `gate:config-copies`: no finding; `gate:manifest`: `manifest: 22 elements checked, no
  finding`; `gate:csp` (after `pnpm -r run build`): `csp: 48 files checked, no finding`; `gate:contrast`: `contrast:
  207 pairs checked in light, 215 in dark (196 required per theme)` (no new pair). `gate:signoff --range <base>..HEAD` after
  the green commit: no finding.
- The phase's tests: `test/code-block.test.ts`, the entry, root entry, exports and driver tests in process (107
  passed); `test/browser/code-block.test.ts` and `test/browser/driver.test.ts` on the fixture (99 passed); the node and
  build projects (813 passed); the story-test extension's 70 code-block tests (passed); `gates/test/manifest.test.ts`
  and the manifest, plant-repo and storybook-build integration tests: 54 passed (after the baselines); the story tests
  again after the story's loader: 70 passed.
- `gate:storybook-build`: `storybook-build: built 216 stories`. `gate:axe` on the code-block stories and the Prose
  document: § Stop for the operator, answered.
- `gate:plants -- --affected <base>`: the full set (not mapped), stopped after 221 plant times with no finding
  (`plants.md`); left to CI. The 12 element plants of contracts/checks.md all bite (`plants.md`).
- Left to CI: `pnpm test` (the full unit-tests gate; `red.sh` ran the whole suite at the red commit), the full plant
  set, `gate:visual` and `gate:axe` on the full Storybook (432 story-themes), the mutation shards, and the axe and
  visual gates' integration tests.
- T032: `pnpm run visual:update` in #10's pinned container under docker (the daemon restarted, then `pnpm run
  setup:online`): `baselines: wrote 28 files (28 added, 0 changed, 0 removed), 379683 bytes in total` (14 stories x 2
  themes, 432 baselines). The two RightToLeftScroll baselines of that run were removed and regenerated after the story's
  loader (above): `baselines: wrote 2 files (2 added, 0 changed, 0 removed), 28452 bytes in total`; a further run wrote
  nothing: `baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total` (each run captures every
  story-theme twice). No PNG was picked by hand. No podman cross-check was possible in this environment.
- Scope guards (SC-007, SC-008): `git diff 8ebbe439b08562e3832fbe996645d4ff714f0874 --` over
  `src/overflow-region.ts`, `specs/009-workflow-layouts/contracts/`, `src/focusable.ts`, `src/overlay.ts` and mission
  013's element sources, stories, scenario, harness and fixture files is empty. Mission 019 is not on this branch, so it
  has no file to diff.
