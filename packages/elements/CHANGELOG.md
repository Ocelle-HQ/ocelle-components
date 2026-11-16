# Changelog

All notable changes to `@ocelle/elements` are recorded here. The public surface is the custom-elements manifest, the
entry points and the browser build's file path (constitution VII).

## Unreleased

### Added

- `ocelle-icon`, an icon of the set drawn inline in `currentColor` at the `--ocelle-icon-size` token, decorative
  unless a `label` or a host `aria-label` names it; its properties `name` (reflected) and `label`.
- The icon set, thirteen names: `chevron-start`, `chevron-end`, `chevron-up`, `chevron-down`, `arrow-start`,
  `arrow-end`, `menu`, `close`, `folder`, `file`, `search`, `table` and `copy`; `chevron-start`, `chevron-end`,
  `arrow-start` and `arrow-end` are mirrored under right-to-left text.
- `ocelle-brand-mark`, the Ocelle rosette drawn inline from tokens at the `--ocelle-icon-size` token, for the main
  grounds, the chrome (`ground="chrome"`) or in one colour (`tone="mono"`), decorative unless a `label` or a host
  `aria-label` names it; its properties `ground` and `tone` (reflected) and `label`.
- `ocelle-notice`, a message box whose look follows its tone (`info`, `success`, `warning`, `danger`, `neutral`), with
  an optional heading and a regular or compact size, that announces its text once through a live region of its own
  when `announce` or a host `role` of `alert` or `status` asks for it; its properties `tone`, `size` and `announce`
  (reflected); the slots `heading` and the default slot (the body), the CSS parts `heading` and `body`, and no event;
  its entry point `@ocelle/elements/ocelle-notice.js`.
- `ocelle-form-input`, a labelled text field with an optional description and a host-set error that takes part in its
  form like a native input (form-associated, through `ElementInternals`); its attributes and reflected properties
  `name`, `label`, `description`, `error`, `required`, `disabled`, `type`, `placeholder`, `autocomplete`, `inputmode`,
  `pattern`, `min`, `max`, `step`, `minlength`, `maxlength` and `readonly`; the `value` attribute (its default value),
  the properties `value`, `form`, `labels`, `validity`, `validationMessage` and `willValidate` and the methods
  `checkValidity()`, `reportValidity()` and `focus()`; the event `ocelle-form-input-change` with `detail: { value }`,
  no slot, and the CSS parts `label`, `control`, `description` and `error`; its entry point
  `@ocelle/elements/ocelle-form-input.js`.
- `ocelle-form-select`, a labelled native select for closed choices with an optional description and a host-set error
  that takes part in its form like a native select (form-associated, through `ElementInternals`), with its options
  from its light-DOM `<option>` and `<optgroup>` children and the `chevron-down` open-list indicator; its attributes
  and reflected properties `name`, `label`, `description`, `error`, `required` and `disabled`; the properties `value`,
  `form`, `labels`, `validity`, `validationMessage` and `willValidate` and the methods `checkValidity()`,
  `reportValidity()` and `focus()`; the event `ocelle-form-select-change` with `detail: { value }`, no slot, and the
  CSS parts `label`, `control`, `description` and `error`; its entry point `@ocelle/elements/ocelle-form-select.js`.
- In the README, the form-control convention that later form-like elements follow: form association, naming,
  description, error and its announcement, host ARIA, events and implicit submission.
- In the README, the slot convention for icons in controls that later controls follow: the `icon` and `trailing`
  slots, their size, alignment, gap and colour rules and the naming rule.
- Entry points: `@ocelle/elements` (the package root, defines every element), `@ocelle/elements/ocelle-icon.js`
  (defines `ocelle-icon` only), `@ocelle/elements/ocelle-brand-mark.js` (defines `ocelle-brand-mark` only),
  `@ocelle/elements/browser.js` (the browser build) and `@ocelle/elements/custom-elements.json` (the manifest, also
  named by the `customElements` field).
- The browser build's file, `dist/browser/ocelle-elements.js`: Lit inside, imports nothing, for hosts without a
  bundler, which copy it out of the package and serve it by path.
- `custom-elements.json`, the generated custom-elements manifest.
- `@ocelle/tokens` as a peer dependency (`workspace:0.0.0`); the elements read its tokens.
- `lit` 3.3.3 as the runtime dependency of the module build.
- `NOTICE` in the package, with the trademark note for "Ocelle" and the rosette mark.
