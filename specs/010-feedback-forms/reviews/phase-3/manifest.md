# Phase 3 manifest generator (T036)

## The input's `value` attribute (research R-05 § Manifest; analysis U6)

`src/ocelle-form-input.ts` observes `value` by hand (`observedAttributes` returns `[...super.observedAttributes,
"value"]`) and declares it with the class JSDoc tag `@attribute {string} [value=""] - <description>`. Raw output of
`@custom-elements-manifest/analyzer` 0.11.0 (`create` with its Lit plugin, as `scripts/manifest.ts` runs it, over
`src/ocelle-form-input.ts` and `src/form-control.ts`, before the generator's fold and normalisation), the
`ocelle-form-input` declaration's attribute entries named `value`:

```json
[
  {
    "name": "value",
    "type": {
      "text": "string"
    },
    "description": "The default value, restored on reset; it sets the current value while the user has not edited it and no script has set `value` since the last reset. The `value` property is the current value.",
    "default": "\"\""
  }
]
```

One described entry, with the type and the default taken from the tag and no `fieldName`: the analyzer merges the tag
with the bare `observedAttributes` name. So, as T036 says, no normaliser change is needed for it; the normaliser keeps
an attribute with no `fieldName` (it drops one only when it is a standard attribute or names a field that is not
public). The same merge was seen on a throwaway pair of modules in a temporary directory before the red commit.

## The base class's members (PLAN-CORRECTNESS-1-004, FR-034, #27)

The same raw run lists two modules, `src/ocelle-form-input.ts` and `src/form-control.ts`. The analyzer marks the
`FormControl` declaration `customElement: true` (it extends `LitElement`), copies its public members and attributes into
`OcelleFormInput` with `inheritedFrom: { name: "FormControl", module: "src/form-control.ts" }`, and gives
`OcelleFormInput` the superclass `{ name: "FormControl", module: "/src/form-control.ts" }`. Left so, the manifest would
gain a module path that is not `src/ocelle-*.ts`, a second custom element (the manifest gate would count five), and two
references to the internal module. `scripts/manifest.ts` therefore:

- analyses every `src/*.ts` module, so that a base class in an internal module is resolved;
- folds the output (`fold()`, before `normalise()`): only the element modules `src/ocelle-*.ts` are kept, the entries
  of each element's lists lose `inheritedFrom`, and a superclass declared in a dropped module is replaced by that
  class's own superclass (here `{ name: "LitElement", package: "lit" }`);
- drops `form`, `aria-invalid`, `aria-required`, `aria-disabled` and `aria-description` with `aria-label`, `role` and
  `hidden` (T022a).

`custom-elements-manifest.config.mjs` (the CLI's configuration) analyses `src/*.ts` too. The base class's statics
(`formAssociated`, `shadowRootOptions`) and the form-associated callbacks (`formResetCallback`,
`formStateRestoreCallback`, `formDisabledCallback`) carry the JSDoc tag `@internal`, which the analyzer leaves out, so
they are not public members in the manifest; the browser calls the callbacks, hosts do not.

`focus()` is declared by an override with a description in `src/form-control.ts` (`super.focus(options)`); the
analyzer gives it as a method with the parameter `options?: FocusOptions` and the return type `void`.

The manifest gate: `manifest: 4 elements checked, no finding`, and `custom-elements.json` regenerates with no diff.
The manifest plants' copies (`gates/plants/manifest/*/tree/packages/elements/custom-elements.json`, eight of them) are
regenerated from the new source as T025 did: each `fail-undescribed-*` copy is the generator's output over the
repository's `src/` with the plant's `src/ocelle-plant.ts` beside it, `fail-lost-attribute` is the committed manifest
without `ocelle-icon`'s `label` attribute, and `pass-reordered` is the committed manifest with every object's keys
reversed. The same procedure, run on a worktree of the phase base `2004e82`, reproduced all eight base copies byte for
byte before it was applied here. `break-not-json`, `break-missing`, `fail-stale-property` and `pass-repository` hold no
copy of the manifest and are unchanged.
