# Phase 1 (Setup): partly exempt from the red step

Constitution VIII, *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it. Phase 1 is only partly exempt.

## Not exempt: T002

T002 (the `styles-browser` Vitest project, the `styles` project's browser exclude, and `styles-browser` in the
mutation-excluded projects) is behaviour: it decides which project runs which test file. It went red first:

- red commit `c7de184` (`test(003-base-styles): phase 1 red — styles-browser project`), task T001, changing only
  `gates/test/vitest-config.test.ts`;
- `red.sh 1 phase` reported `"tests_only": true, "red": true`; `red-phase.log` shows exactly the two new assertions
  failing for the missing project: the mutation-excluded list lacks `styles-browser`, and
  `packages/styles/test/browser/x.test.ts` belongs to `styles`, not to `styles-browser`.

## Exempt: T003 to T005

No test could fail for these, because none of them changes what any code does:

- **T003**, `packages/styles/package.json`: a manifest. The `build` script, the `./base.css` export, `files` and the
  `@ocelle/tokens` peer dependency are package metadata. The `build` script runs the T005 stub, which writes nothing.
  The peer dependency is checked by the existing pins gate (`pnpm run gate:pins`), not by a new test.
- **T004**, root `package.json` and `pnpm-lock.yaml`: an exact pin of `postcss-selector-parser` 7.1.7, the version
  already in the lockfile through stylelint. Nothing imports it yet; phase 2's source-level checks will (research
  R-11). The pins gate checks the pin.
- **T005**, an empty `packages/styles/src/base.css` and a stub `packages/styles/scripts/build.ts`: `buildPlan(css)`
  returns `[]` and `build()` writes nothing. They are neutral stubs with no behaviour. Phase 2 gives them behaviour,
  red first through `packages/styles/test/build.test.ts` and `source.test.ts` (contracts/checks.md § Tests added).
