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
