# Phase 2 notes for the review

Implementer's notes on phase 2 (User Story 2, `ocelle-empty-state`): where the work departs from the letter of
tasks.md and why, what the red record shows, and what is left open. The plant runs of T034 and T034a are in
`plants.md`.

## Scaffold: constitution VIII exemption (T022)

The scaffold commit (`scaffold.sha`) adds `src/ocelle-empty-state.ts` with its `define` call, `@tagname`, the declared
property `variant` (`"panel" | undefined`, `@default undefined`, not yet reflected) and an empty `render()`, and its
exports (package root, and so the browser build, and `package.json`). It has no behaviour: nothing is rendered,
slotted, observed or reflected, so no test could fail for it; the red commit's tests run against it and fail on their
assertions (`red-phase.log`). This is the exemption contracts/checks.md § Scaffold states.

## Red record

`red-commits` holds one `phase` record (I3: the story-test extension is in the same red commit). `red-phase.log`:
`unit-tests: 115 of 3532 tests failed`, every failure an `AssertionError`, none an import, syntax or setup error:
the 18 bodies in each harness, the entry and root tests, the build test's `::slotted(ocelle-progress)` half, the
manifest declaration, the 39 readme statements, rows and CHANGELOG names, the 21 story tests, and the pinned counts
of the gate tests (5 elements, 50 stories, 100 story-themes and baselines). Tests that pass at red, by design:
- the driver additions' own body (`pressTab` and `focused`) and the AX heading-level command test: they test the
  harness, which the red commit itself adds (contracts/checks.md § Driver additions);
- the root exports test and the build test's import half: the scaffold already exports `OcelleEmptyState` and its
  module imports no element;
- existing tests extended without a behaviour change (the readme's unchanged fragments).

The red commit was not amended.

## Departures from tasks.md, with the reason

- **The AX readers report a heading's level** (`test/commands.ts`, test-only). US2-1, US2-2 and US2-10 assert "a
  heading of level 3", "level 2", "the level 1 heading"; `AxNode` carried only role and name. The readers now add
  `level` to heading nodes only (from Chromium's `level` property), so no existing expectation changes; its own test
  is in `test/commands.test.ts`. Not one of contracts/checks.md's named driver additions.
- **The manifest test, the exports test, the build test and the gate tests' pinned counts** were extended in the red
  commit, as in phase 1: the manifest declaration of `ocelle-empty-state` (T030's oracle), the root exports, the
  module build's imports and its `::slotted(ocelle-progress)` rule (the rule phase 2's stand-in cannot reach; its
  behavioural plant stays in T052), and the counts of `gates/test/manifest.test.ts`,
  `gates/test/integration/{manifest,storybook-build,axe,visual,plant-repo}.test.ts`.
- **The AX reading of the eyebrow is upper case** ("text REFUSED"): Chromium's static text applies the element's
  `text-transform: uppercase`. The bodies assert the element's own outcome, so the light DOM alone ("Refused") fails.
- **US2-7's stand-in** is a `<div role="img" aria-label="Loading">` with `inline-size: 100%`, so the body asserts the
  visual part spans the column (R-04's `align-self: stretch`), the panel's visual-to-heading gap and the AX order; the
  bar's own width (the smaller of the column and `--ocelle-measure-reading`) waits for phase 3.
- **Story ids** chosen for R-08's list: `default`, `panel`, `heading-only`, `actions-only`, `several-actions-narrow`
  (a 320 px wrapper), `refusal-with-eyebrow` and `several-body-paragraphs`; their wrapper widths are `data-story`
  rules in `storybook/.storybook/stories-layout.css`.
- **The default and panel stories' visual** is an `ocelle-icon` (`folder`), so the stories file imports
  `ocelle-icon.ts` beside `ocelle-empty-state.ts`.
- **Plant trees brought up to the repository** (T034 step 2): the eight `manifest` plant manifests gained the
  `ocelle-empty-state` declaration (their committed copies would otherwise be stale against the source),
  `storybook-build/fail-empty-index` replaces the empty-state story file too, and `visual/fail-token-changed` lists
  the six light empty-state story-themes that show `color-ink` (every story with a heading; the actions-only story
  shows none).

## Review note R1-04 (phase 1)

R1-04 suggested a Tab read for the facts link bodies (US1-19, FR-011) once `pressTab()` exists. tasks.md does not place
that change in phase 2 (no phase 2 task touches `scenarios/facts.ts`), so it was not made here; `pressTab()` and
`focused()` are now available for it.

## Visual baselines (T032)

`pnpm run visual:update` in #10's pinned container (docker; `dockerd` started as root, the pinned image already
present): `baselines: wrote 14 files (14 added, 0 changed, 0 removed), 393907 bytes in total` (7 stories, light and
dark). No podman cross-engine check was possible in this container. CI's "Visual regression" captures stay the
record (`storybook/README.md` § Baselines).

## T034 step 2: gate runs

Run on the green tree (`OCELLE_CHROMIUM_PATH` set to Chromium 1243, `OCELLE_VISUAL_ENGINE=docker`):

- `gate:manifest`: `manifest: 5 elements checked, no finding`
- `gate:style-lint`: `style-lint: 15 files checked, no finding`
- `gate:csp`: `csp: 13 files checked, no finding`
- `gate:prefix`: `prefix: 227 files checked, no finding`
- `gate:test-lint`: `test-lint: 194 files checked, no finding`
- `gate:contrast`: `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)` (unchanged)
- `gate:storybook-build`: `storybook-build: built 50 stories`
- `gate:visual`: `visual: 100 captures match their baselines (docker only: no cross-engine comparison)`
- `gate:axe`: `axe: 100 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` (no
  `storybook/a11y-exceptions.json` entry added)
- `gate:plants` (docker only; the gate's default `both` also needs podman, which this container lacks):
  `plants: 304 plants of 17 gates and the registry judged, every plant as expected`
- `gate:mutation -- --base bb27aa5`: the first run left 20 survivors (`22 findings`, two of them no-coverage). Two
  bodies were added for those with observable behaviour (test commit after green): an element with no child, and
  runs of several whitespace characters around a heading; an element moved out and back that still observes its
  slotted content. The rest were removed by simplifying the source without changing its behaviour (the observer is
  always re-targeted on a refresh, the reconnection refresh has no guard, the render is requested on every refresh,
  the text test has no node-type condition, the eyebrow's heading mark is computed only for the eyebrow) or recorded
  as equivalent with the reason (5 `Stryker disable next-line` records: the initial `false` flags, the disconnection
  block and its two calls, the observer's `disconnect()` before re-targeting). Final: `mutation: 81 mutants on the
  changed lines of 2 files, none survived; 2 timeouts, 16 compile errors, 1 zero-mutant entry; 5 equivalent records`.
- `gate:typecheck`, `gate:lint`: no finding; `pnpm test`: `unit-tests: 3536 tests passed in 148 files`.

## Left open

Nothing in phase 2.
