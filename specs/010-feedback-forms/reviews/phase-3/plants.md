# Phase 3 plant run (T040)

Run on 2026-11-15 in this container (Chromium 153 build 1243, through `OCELLE_CHROMIUM_PATH`), at `b76d4ee`, the
plants file alone: `vitest run --reporter verbose --project elements packages/elements/test/plants.test.ts`.
"Tests 76 passed (76)" in 87 s: phase 1's and phase 2's 52 rows and the 24 rows of this phase. Each row asserts that
its planted body rejects with the row's message and that the same body with the real element (`ocelle-notice` or
`ocelle-form-input`) resolves, so a row passes only when its plant bites.

The plant classes are in `packages/elements/test/fixtures/form-input-plants.ts`: each is derived from
`OcelleFormInput` and overrides one protected method of it or of its base class (`src/form-control.ts`), or its
`createAnnouncer()` returns a class derived from phase 2's `Announcer` with one protected step overridden
(contracts/testing.md § Plants, Seams; analysis U7). Every US2 cell of contracts/testing.md § Plants is in process:
the US2 bodies that run under `liveCapture.startDocument` on the fixture pages (US2-18, US2-22 first loaded hidden)
run under `registerFirstLoad` here, so `test/browser/plants.test.ts` and `test/browser/plants-entry.ts` are unchanged.

## The phase 3 rows

| Family | Plant | Body it turns red |
|---|---|---|
| insertion announcement | announcer created already holding the error (no empty wait) | US2-20 innerHTML |
| reveal baseline | the re-check also applies to insertion and reveal | US2-22 first loaded hidden; US2-22 announced, hidden and revealed |
| first load | the constructor's `isConnected` rule | US2-20 innerHTML, template, domparser |
| first load | announces on first load | US2-18 |
| move | move flag never set | US2-20 move |
| hidden | announces while hidden (the `hidden` attribute ignored) | US2-22 inserted hidden; US2-22 first loaded hidden |
| validity | `setValidity({})` always | US2-5; US2-6 |
| error baseline | clearing does not reset the baseline; no whitespace normalisation | US2-10 (each) |
| host ARIA | ignores host `aria-invalid="true"`; lets host `"false"` clear the element's own state | US2-23 (each) |
| naming | name span not hidden; name not recomputed on label text change | US2-1; US2-13 rename |
| change event | no last-committed guard | US2-3 |
| implicit submission | never submits; submits ignoring the one-field rule | US2-21 button; US2-21 two fields |
| form value | forgets `setFormValue`; reset keeps the typed value; restore ignored | US2-2; US2-4; SC-003 restore in process |

## The run's phase 3 lines

```text
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the e… turns US2-20 innerHTML red 1100ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US2-22 first loaded hidden red 950ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US2-22 announced, hidden and revealed red 2266ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US2-20 innerHTML red 950ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US2-20 template red 950ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US2-20 domparser red 967ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: announces on first load turns US2-18 red 1583ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > move: move flag never set turns US2-20 move red 1350ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US2-22 inserted hidden red 1817ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US2-22 first loaded hidden red 966ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > validity: setValidity({}) always turns US2-5 red 283ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > validity: setValidity({}) always turns US2-6 red 1216ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > error baseline: clearing does not reset the baseline turns US2-10 red 2367ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > error baseline: no whitespace normalisation turns US2-10 red 2433ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > host ARIA: ignores host aria-invalid="true" turns US2-23 red 183ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > host ARIA: lets host "false" clear the element's o… turns US2-23 red 167ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > naming: name span not hidden turns US2-1 red 333ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > naming: name not recomputed on label text change turns US2-13 rename red 83ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > change event: no last-committed guard turns US2-3 red 484ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > implicit submission: never submits turns US2-21 button red 433ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > implicit submission: submits ignoring the one-field rule turns US2-21 two fields red 400ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > form value: forgets setFormValue turns US2-2 red 150ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > form value: reset keeps the typed value turns US2-4 red 250ms
✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > form value: restore ignored turns SC-003 restore in process red 83ms
```

## The gate

`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants` at `b76d4ee`: exit 0, "plants: 301 plants of 17 gates and the registry
judged, every plant as expected", 67:33 wall-clock. The manifest plants, whose copies of `custom-elements.json` this
phase regenerated (`manifest.md`), are each as expected: `break-missing`, `break-not-json`, `pass-reordered`,
`pass-repository` and the eight `fail-*`.
