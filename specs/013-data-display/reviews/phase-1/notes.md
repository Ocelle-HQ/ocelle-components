# Phase 1 notes for the review

Implementer's notes on phase 1 (User Story 1, `ocelle-facts` and `ocelle-fact`): where the work departs from the
letter of tasks.md and why, what the red record shows, and what is left open. The spike is in `spike.md` (§ 9 for
T001b), the plant runs of T021 and T021a in `plants.md`.

## Scaffold: constitution VIII exemption (T002)

The scaffold commit (`scaffold.sha`) adds `src/ocelle-facts.ts` and `src/ocelle-fact.ts` with their `define` calls,
`@tagname`, the declared properties (`density`, `layout`; `label`, `wrap`) and an empty `render()`, and their exports
(package root, `package.json`). It has no behaviour: nothing is rendered, observed, measured or reflected, so no test
could fail for it; the red commit's tests run against it and fail on their assertions (`red-phase.log`). This is the
exemption contracts/checks.md § Scaffold states. `ocelle-facts.ts` already imports `ocelle-fact.ts` there, as T002
asks, so the build test's container-import halves (T007) pass at red; the shipped-tracks half fails.

## Red record

`red-commits` holds one `phase` record (I3: the story-test extension is in the same red commit). Every failing test in
`red-phase.log` fails on an `AssertionError`; none on an import, syntax or setup error. Tests that pass at red, by
design:
- the driver additions' own tests (`test/driver.test.ts`, `test/browser/driver.test.ts`): they test the harness, which
  the red commit itself adds (contracts/checks.md § Driver additions: "tested on its own ... in the red commit");
- the root exports and the browser build's defined tags, and the build test's container-import halves: the scaffold
  already exports and imports what T002 asks;
- existing tests extended without a behaviour change (the readme's unchanged fragments, the `entry-root` first case).

The red commit was amended once before green (commit body): two label-line reads used the label's computed line
height, which is `normal` without `base.css`, and now compare with twice the font size; the FR-009 bound allows 2 px
for the shrink-to-fit grid track's rounding (321.5 against a 322.6 px reference) and the reference reads the values'
tabular figures. In the same amendment, existing tests whose expectations follow the repository were extended, each
stricter or a count: `packages/styles/test/source.test.ts` (the rule table with the two hook declarations and the
pre-upgrade rule), `packages/elements/test/node/manifest.test.ts` (the four element modules and the two new
declarations), and the pinned counts of `gates/test/manifest.test.ts` and `integration/manifest.test.ts` (4 elements),
`integration/storybook-build.test.ts` (43 stories), `integration/axe.test.ts` (86 and 88 story-theme runs),
`integration/visual.test.ts` and `integration/plant-repo.test.ts` (86 story-themes and baselines).

## Departures from tasks.md, with the reason

- **Driver readers added beside the contract's six** (T003): `open(id)` (a dialog's `showModal()` or a popover's
  `showPopover()`, which the shrink-to-fit and round 3 bodies need), `boxes(id, inner)`, `styles(id, inner,
  properties)` and `structure(id, inner)` (the flat-tree `<dl>` children, the per-cell geometry and the computed styles
  of shadow parts). Each is tested with the six in `scenarios/driver-additions.ts`, in both harnesses.
- **No new Vitest command** (T003 names `commands.test.ts`): the in-process viewport is Vitest's `page.viewport()` and
  the copy is `userEvent.copy()`/`paste()`, so no browser command and no `vitest.config.ts` change was needed;
  `commands.test.ts` is unchanged.
- **`copy` reads the pasted text.** During a `copy` event the event's own `clipboardData` is empty (the default action
  fills the clipboard after the event; measured in Chromium 153). The driver performs a user copy (the platform
  shortcut) and returns the `text/plain` of a user paste into a scratch field, which is exactly what the copy put on
  the clipboard; a U+200B in it is kept (its driver test).
- **The layout wait reads after each frame.** `test/layout-wait.ts` waits for an animation frame and then a task before
  each read, so a frame's `ResizeObserver` delivery, and the frame it schedules, come before the next read; it returns
  on the second frame at the earliest when two consecutive reads agree, and rejects after 10. Its driver test shows a
  change made in a frame scheduled from an observer callback is read.
- **The threshold hook is not declared on `:host`.** R-02 says the hook is "set by default in `:host`". A `:host`
  declaration would beat a value the consumer sets on an ancestor (the host's own declaration wins over inheritance),
  so the hook probe reads `var(--ocelle-facts-stack-below, calc(var(--ocelle-space-10) * 6))` instead: the same
  default, and the hook works on the sheet or an ancestor. The README says so.
- **The facts value hooks' styles test is its own file** (`packages/styles/test/browser/facts.test.ts`, T009 names
  `compact.test.ts`), with its own fixture page, beside the pre-upgrade test it shares the page with.
- **Stacked gaps.** In the stacked layout the label-to-value gap is the row gap `--ocelle-space-1` and each value's
  `margin-block-end` makes up the gap to the next pair (`--ocelle-space-3`, or none in compact), so the `<dl>`'s
  computed row gap is `--ocelle-space-1` in compact in both layouts (US1-9).
- **The two-column CSS grid `auto` track case agrees with a fresh load with the chosen content** (spike § 9): its
  stacked size no longer fits beside the 300 px neighbour. The unobserved-change bodies assert the consumer's remedy as
  planned, and the README keeps the narrowing (it stands for content whose stacked sheet fits there).

## Visual baselines (T019)

`dockerd` started as root in this container and #10's pinned image pulled by digest; `pnpm run visual:update` printed
`baselines: wrote 44 files (44 added, 0 changed, 0 removed), 859831 bytes in total` (22 stories, light and dark), and
`pnpm run gate:visual` printed `visual: 86 captures match their baselines (docker only: no cross-engine comparison)`.
No podman cross-engine check was possible in this container. CI's "Visual regression" captures stay the record
(`storybook/README.md` § Baselines).

## T021 after the operator's plant decision (2026-11-14)

Operator decision (b) "Add test, keep R-03" (`operator-plant-decisions.md`). The unbroken-value body landed in a test
commit (`3578f88`); it passes against the source and bites under the redefined plant (`plants.md`). Then step 2:

- `gate:contrast`: `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)` (unchanged).
- `gate:plants` (with `OCELLE_VISUAL_ENGINE=docker`: the gate's default `both` also needs podman, which this
  container lacks; without it the 46 visual plants are "not run (no container engine)"): the first full run gave
  `plants: 1 problem in 304 plants`, after the plant trees were brought up to the repository (below); the one problem,
  `visual/fail-token-changed`, listed the 22 light facts story-themes as unexpected `differs`, which its `why` asks a
  later story to add. With them added, its shard 16 gave `plants: shard 16 of 28: 3 plants judged, every plant as
  expected`, and after the last source change shards 1 to 3 (the other gates' 231 plants) each gave `77 plants
  judged, every plant as expected`. The plant trees brought up to the repository: the eight `manifest` plant
  manifests gained the two facts declarations (their committed copies were stale against the source); the two
  `style-lint` element-property plant manifests declare the three facts hooks the facts source references;
  `storybook-build/fail-empty-index` replaces the facts story file too.
- `gate:mutation -- --base 30e5130`: the first run left 37 survivors. Bodies were added for those with observable
  behaviour (test commits `f05c389` and `c932aec`): a standalone fact without a label, aria-hidden, lang and dir
  changed after render, the content-box measure, the threshold boundaries, a moved sheet's hook, a reconnection with
  changed children (in process only), and three token-only cases. The rest are recorded as equivalent in the source
  (16 `Stryker disable next-line` records with reasons: the disconnection cleanup of a sheet out of the document,
  the observer's render-or-measure choice and frame coalescing, which only add idempotent passes, re-observing
  probes, the initial `#inSheet`, and `cols-2` below the threshold, which `cols-1` overrides). Final:
  `mutation: 300 mutants on the changed lines of 4 files, none survived; 0 timeouts, 66 compile errors, 1 zero-mutant
  entry; 16 equivalent records`. The only source change besides the records is `#mutated`'s `else if` split into
  `if … return` and `if`, so a record can sit above the measure branch.
- `pnpm test`: 3429 tests passed.

## Gate lines recorded so far (T021 step 3, partial)

Run before the plant stop, on the green tree: `axe: 86 story-theme runs, 0 serious or critical; 10 notes (0 incomplete,
10 excepted)` (no `storybook/a11y-exceptions.json` entry added); `visual: 86 captures match their baselines (docker
only: no cross-engine comparison)`; the `storybook-build` integration test, `storybook-build: built 43 stories`; the
`visual:update` line above. Also `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`
(4 elements), `gate:prefix` and `gate:csp` with no finding, and `pnpm test` with every test passing (3412). Not run,
because the phase stopped at T021 step 1 (`plants.md`): `gate:contrast`, `gate:plants` and `gate:mutation`.

## Left open

Nothing in phase 1. T021 was stopped at step 1 (the value-track plant) until the operator's decision above.
