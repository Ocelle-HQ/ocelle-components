# Phase 3 engine floor check (T041)

The README's floor (`packages/elements/README.md` § Engines): Chromium 120+ and WebKit 16.4+. The features phase 3
adds, each compared with that floor (plan decision 2; analysis G8, I8). `ElementInternals` itself and its `ariaLive`
are phase 2's (`reviews/phase-2/engine-floor.md`).

| Feature | Where | Chromium | WebKit | Against the floor |
|---|---|---|---|---|
| Form-associated custom elements: `static formAssociated` | `src/form-control.ts`, `FormControl` | 77 | 16.4 | at or below |
| `ElementInternals.setFormValue()` | `syncFormValue()` | 77 | 16.4 | at or below |
| `ElementInternals.setValidity()`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()` | `syncValidity()` and the host's getters and methods | 77 | 16.4 | at or below |
| `ElementInternals.form` and `labels` | the `form` and `labels` getters, `computedName()`, `observeLabels()` | 77 | 16.4 | at or below |
| `formResetCallback`, `formStateRestoreCallback`, `formDisabledCallback` | `FormControl` | 77 | 16.4 | at or below |
| `delegatesFocus` (shadow root option) | `FormControl.shadowRootOptions` | 53 | 15 | below |
| `fit-content` for `inline-size` | the label, description and error parts | 57 | 12.1 | below |
| `::placeholder` | the field's placeholder colour | 57 | 10.1 | below |
| `:focus-visible` | the field's focus ring | 86 | 15.4 | at or below |

Sources: MDN browser-compat-data (`api.ElementInternals`, `api.ElementInternals.setFormValue`,
`api.ElementInternals.setValidity`, `api.ElementInternals.form`, `api.ElementInternals.labels`,
`api.ShadowRoot.delegatesFocus`, `css.properties.width.fit-content`, `css.selectors.placeholder`,
`css.selectors.focus-visible`; the form-associated callbacks ship with form-associated custom elements), not
re-measured here. Only Chromium is measured (README § Engines); the suites ran on Chromium 153 (build 1243). WebKit's
form association is named in the README as an open limitation.

No feature is newer than the floor, so the floor is unchanged and no operator stop is needed.
