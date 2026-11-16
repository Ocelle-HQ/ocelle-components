# Phase 4 plant run (T056)

Run on 2026-11-16 in this container (Chromium 153 build 1243, through `OCELLE_CHROMIUM_PATH`), at `5908fa7`, the
plants file alone: `vitest run --reporter verbose --project elements packages/elements/test/plants.test.ts`.
"Tests 79 passed (79)" in 85 s: the 76 rows of phases 1 to 3 and the 3 rows of this phase. Each row asserts that its
planted body rejects with the row's message and that the same body with the real element (here `ocelle-form-select`)
resolves, so a row passes only when its plant bites.

The plant classes are in `packages/elements/test/fixtures/form-select-plants.ts`: each is derived from
`OcelleFormSelect` and overrides one protected member of it or of its base class (`src/form-control.ts`), as
contracts/testing.md § Plants, Seams gives it (analysis G11, U7). All three run in process, so
`test/browser/plants.test.ts` and `test/browser/plants-entry.ts` are unchanged.

## The phase 4 rows

| Family | Plant | Seam it overrides | Body it turns red |
|---|---|---|---|
| validity | `setValidity({})` always | `syncValidity()` (`src/form-control.ts`) | US3-5 |
| option mirroring | the option observer misses `characterData` | `optionObservation()` | US3-4 |
| indicator | indicator without `pointer-events: none` | the static `styles` (the `svg` rule) | US3-8 |

At the red commit `43bec71` (`red-phase.log`) the three rows failed: US3-5 on the real element's side (the select
undefined), US3-4 and US3-8 on the planted side, which rejected with the scaffold stub's `not implemented` instead of
the row's message (T049a's note).

## The run's phase 4 lines

```text
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > validity: setValidity({}) always turns US3-5 red 317ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > option mirroring: the option observer misses characterData turns US3-4 red 350ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > indicator: indicator without pointer-events: none turns US3-8 red 250ms
```

## The gate

`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants` at `5908fa7`: exit 0, "plants: 301 plants of 17 gates and the registry
judged, every plant as expected", 60:17 wall-clock. The manifest plants, whose copies of `custom-elements.json` this
phase regenerated (T056), are each as expected: `break-missing`, `break-not-json`, `pass-reordered`, `pass-repository`
and the eight `fail-*`.
