# Phase 4, review round 2: fixes

Operator round at landing (PR #44), tasks T050 and T051 (`reviews/landing/round-1-tasks.md`), one red commit and one
fix commit.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: in `packages/elements/src/ocelle-context-sidebar.ts` the section rule and the first-section rule also exclude `template` and `script` (`::slotted(:not([slot]):not([hidden]):not(template, script))` and `::slotted(:nth-child(1 of :not([slot]):not([hidden]):not(template, script)))`), so a `<template>` or `<script>` in the default slot keeps the user agent's `display: none`, gets no padding or divider and is skipped as "the first section"; it still counts as content (the slot state is unchanged). The README's sidebar section gains the statement after the hidden-section paragraph; "A page rule does not change a section's padding, inline margins, divider or display" stays as it is. No story slots a `template`, so no story or baseline changes. Pairing and R-17 style plants in `plants.md` § Review round 2 fix. | `fix-2` 4da65c9 (tests only), recorded by `red.sh 4 fix-2` (`red-fix-2.log`: "4 of 3600 tests failed", every one an `AssertionError`): the new scenario "US3-3, template and script (phase 4 review R2-01)" of `test/scenarios/context-sidebar.ts` in `test/context-sidebar.test.ts` (`elements`) and `test/browser/context-sidebar.test.ts` (`elements-browser`), the templates and scripts drawn as blocks (`block`, 320 px wide, 32 to 51 px tall) with dividers of their own where none is expected, and the fixture's CSP, request and console record clean (the JSON data blocks raise no CSP violation); and `test/node/readme.test.ts`'s new fragment, on `toContain`. | packages/elements/src/ocelle-context-sidebar.ts; packages/elements/README.md; packages/elements/test/scenarios/context-sidebar.ts, test/node/readme.test.ts (fix-2); reviews/phase-4/plants.md |
| R2-02 | fixed: `"stripInternal": true` in `compilerOptions` of `packages/elements/tsconfig.json` only (not `tsconfig.base.json`). The emitted `dist/ocelle-context-sidebar.d.ts` and `dist/ocelle-personal-rail.d.ts` no longer declare `readonly [internalsKey]: ElementInternals` or import `internalsKey`, and `dist/naming.d.ts` no longer declares the `internalsKey` export; the JavaScript, `custom-elements.json` (`gate:manifest` passes, unchanged), the README and the CHANGELOG are unchanged. `@internal` is still carried only by `src/naming.ts`'s `internalsKey` and the internals fields of `src/ocelle-context-sidebar.ts` and `src/ocelle-personal-rail.ts` (`grep -rn @internal src/`: three lines), so nothing else leaves the declarations. research.md R-11 was corrected by the planner (f7fe243). Declarations plants in `plants.md` § Review round 2 fix. | `fix-2` 4da65c9, the same red commit: `test/build/build.test.ts` "the module build's type declarations" (`elements-build`), an `AssertionError` on the `internalsKey` declarations present, after a successful build. | packages/elements/tsconfig.json; packages/elements/test/build/build.test.ts (fix-2); reviews/phase-4/plants.md |

## Checks at the fix

| Check | Result |
|---|---|
| `pnpm exec vitest run --project elements --project elements-browser test/context-sidebar.test.ts test/browser/context-sidebar.test.ts` | 52 passed |
| `pnpm exec vitest run --project elements-build test/build/build.test.ts` | 13 passed |
| `pnpm exec vitest run --project elements-node` | the phase 4 fragment passes (the two failures in the run are phase 5's T052 red assertions, written next and not part of this commit) |
| `gate:typecheck`, `gate:lint` (304 files), `gate:style-lint` (19 files), `gate:test-lint` (207 files), `gate:csp` (24 files), `gate:prefix` (298 files), `gate:manifest` (7 elements, unchanged) | pass |

`pnpm test`, `gate:storybook-build`, `gate:visual -- --engine docker`, `gate:axe` and `gate:mutation` run at the end of
the landing fix rounds; their results are in the round's report.

T050 and T051 were not ticked in `tasks.md` by the fix commit 749125b; the ticks were added afterwards in a bookkeeping commit, their work checked present first.
