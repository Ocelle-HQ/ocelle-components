# Gates of phase 1 (T022)

Run on 2026-11-18 and 19, one heavy job at a time, with `OCELLE_VISUAL_ENGINE=docker` (podman is absent), on the green
commit 7c9a166 with the storybook/a11y-exceptions.json entries of 4b45256 (operator decision (a) at the stop T022,
`operator-stop-decisions.md`). Every gate exits 0.

| Gate | Exit | Summary line |
|---|---|---|
| `gate:unit-tests` | 0 | `unit-tests: 7351 tests passed in 231 files` (with the exceptions, and again at ef50a1b after the plant fixtures of T023) |
| `gate:typecheck` | 0 | `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | 0 | `lint: 439 files checked, no finding` |
| `gate:style-lint` | 0 | `style-lint: 38 files checked, no finding` |
| `gate:test-lint` | 0 | `test-lint: 323 files checked, no finding` |
| `gate:csp` | 0 | `csp: 36 files checked, no finding` |
| `gate:prefix` | 0 | `prefix: 445 files checked, no finding` |
| `gate:manifest` | 0 | `manifest: 19 elements checked, no finding` |
| `gate:contrast` | 0 | `contrast: 169 pairs checked in light, 177 in dark (158 required per theme)` |
| `gate:brand-rules` | 0 | `brand-rules: 7 rules checked` |
| `gate:storybook-build` | 0 | `storybook-build: built 164 stories` |
| `gate:visual` | 0 | `visual: 328 captures match their baselines (docker only: no cross-engine comparison)` |
| `gate:axe` | 0 | `axe: 328 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` |

The Storybook gates' summary lines:

```text
storybook-build: built 164 stories
visual: 328 captures match their baselines (docker only: no cross-engine comparison)
axe: 328 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)
```

The `visual:update` line of T020 (green commit 7c9a166, #10's pinned container under docker):

```text
baselines: wrote 42 files (42 added, 0 changed, 0 removed), 1699732 bytes in total
```

## gate:axe and the exceptions

Before the entries, `gate:axe` exited 1 with 74 findings in 328 story-theme runs, the same 74 nodes in two runs (the
green run and a rerun at d5b9550): `color-contrast-incomplete` (serious, `elmPartiallyObscured`) on the second column
of rows 1 to 4 in `overflows-named-by-label`, `overflows-named-by-caption`, `overflows-unnamed`,
`overflows-named-by-host-aria-label`, `overflows-blank-host-aria-label`, `right-to-left` and `width-320`, on row 10's
four cells in `sticky-header-bounded` and on row 3's four cells in `sticky-header-room-rule`, each in both themes; and
`th-has-data-cells-incomplete` (serious) on `ocelle-data-table > table` in `empty-body`, both themes. Each node is now
an entry with its row in plan.md § Complexity Tracking ("axe exceptions under FR-029"), and the gate reports the 74 as
excepted notes beside 006's ten. The axe integration test (`gates/test/integration/axe.test.ts`) expects the 84 notes,
and its unlabelled-button run count follows the stories (288 to 330, missed at green).

## SC-007: test files changed since the phase base

`git diff --stat $(cat specs/019-data-records/reviews/phase-1/base.sha) -- packages/elements/test`:

```text
 .../test/browser/data-table-scrollbar.test.ts      |  186 +++
 packages/elements/test/browser/data-table.test.ts  |   49 +
 .../elements/test/browser/data-table.touch.test.ts |   39 +
 packages/elements/test/browser/driver.test.ts      |   24 +
 packages/elements/test/browser/driver.ts           |   21 +-
 .../test/browser/fixtures/data-table-upgrade.html  |   10 +
 .../elements/test/browser/fixtures/data-table.html |   11 +
 .../test/browser/fixtures/overflow-block.html      |   10 +
 packages/elements/test/browser/global-setup.ts     |   17 +-
 .../test/browser/overflow-region-block.test.ts     |   39 +
 packages/elements/test/browser/serve.ts            |    3 +-
 packages/elements/test/build/build.test.ts         |   13 +
 packages/elements/test/data-table-upgrade.test.ts  |   16 +
 packages/elements/test/data-table.test.ts          |   54 +
 packages/elements/test/data-table.touch.test.ts    |   22 +
 packages/elements/test/define.test.ts              |   23 +
 packages/elements/test/driver.test.ts              |   11 +
 packages/elements/test/entry-data-table.test.ts    |   18 +
 packages/elements/test/entry-root.test.ts          |   13 +-
 packages/elements/test/exports.test.ts             |    6 +-
 .../elements/test/fixtures/overflow-host-block.ts  |   84 ++
 packages/elements/test/in-process.ts               |    5 +
 packages/elements/test/node/manifest.test.ts       |    2 +-
 packages/elements/test/node/readme.test.ts         |   84 +-
 packages/elements/test/node/records-pairs-check.ts |   77 +
 packages/elements/test/node/records-pairs.test.ts  |   24 +
 .../elements/test/overflow-region-block.test.ts    |   64 +
 packages/elements/test/scenarios/data-table.ts     | 1589 ++++++++++++++++++++
 packages/elements/test/scenarios/driver.ts         |    4 +
 packages/elements/test/scenarios/overflow-block.ts |  630 ++++++++
 30 files changed, 3135 insertions(+), 13 deletions(-)
```

No test of 009's overflow-region module, `ocelle-scroller` or `ocelle-workflow-board`, and no test of mission 013's
elements, is changed: every changed test file is new, or `test/node/readme.test.ts`, or one of the shared files the red
commit 6d6dacb names with its reason (the driver additions `scrollTop` and `setScrollTop` in `test/scenarios/driver.ts`,
`test/in-process.ts`, `test/browser/driver.ts` and the two driver tests; the block-axis host's bundle in
`test/browser/global-setup.ts` and `serve.ts`; the exact registry lists of `exports.test.ts` and
`node/manifest.test.ts`, which gain the new element), or a package-wide file that gains a new body for the data table
without a change to its existing ones (`build/build.test.ts`, `define.test.ts`, `entry-root.test.ts` with one header
comment line; T010). 009's baselines do not
move (`gate:visual` above).
