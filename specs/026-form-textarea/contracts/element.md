# Public element contract

Import `@ocelle/elements/ocelle-form-textarea.js` to register `ocelle-form-textarea`. The field supports the existing form-control properties and attributes for name, label, description, error, required and disabled, plus `readOnly` / `readonly`. The `value` attribute sets the default. The `value` property gets or sets the current answer. Form association, validity and the label and control parts follow the library's form-control convention.

A user edit delivers a bubbling, composed native `input` notification after the current and form values are synchronized. A user-committed change delivers `ocelle-form-textarea-change`, bubbling and composed, with `detail: { value: string }`. Enter inserts a newline without implicit submission.
