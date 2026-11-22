# Feature Specification for a multiline form textarea

**Feature Branch**: `codex/074-form-textarea`  
**Created**: 2026-11-22  
**Status**: Draft  
**Input**: GitHub #74 and [approved triage](../../triage/026-form-textarea.md).

## User Scenarios & Testing

### User Story 1 – Enter and correct a multiline decision (P1)

A reviewer in Workflow Studio run inspection can type or paste a multiline planning answer, submit it, and correct it in place after validation or a failed save. In a dialog the reviewer can edit using ordinary multiline keys. The Workflow Studio composition issue (#76) supplies the consumer context.

**Why this priority**. It lets reviewers give a decision and its rationale together, including when the host needs a correction.

**Independent test**. Open the editable field in an existing dialog, enter two lines with the keyboard and paste a paragraph. Submit through the form, render a host error, correct the answer and submit again. Check the submitted value, the accessible name and description of the editing control, and the value displayed after each step.

**Acceptance scenarios**

1. Given an initial answer with line breaks and a named field, when the host submits the form in the same task as connecting the field, before the first scheduled render, the submitted data includes the exact initial answer. Later submissions preserve line breaks after typing and pasting. Reset restores the configured default and clears the dirty state.
2. Given a dialog with a labelled field, when the reviewer tabs into it, types, uses Enter, pastes text or moves the caret with the keyboard, the field behaves like a native textarea. Enter inserts a line break. The dialog retains its usual focus behavior.
3. Given a required field, when the reviewer submits it empty, native form validation blocks the submission. Given a host-reported failure after a non-empty submission, rendering the error retains the answer and associates the error with the editing control. The reviewer can edit and resubmit without re-entering the rest of the answer.
4. Given a read-only field, the reviewer can focus and select its text, and the form includes the value. Read-only fields are barred from constraint validation. A disabled field is omitted from FormData, cannot be edited or focused by tabbing, and is barred from constraint validation.

### Edge cases

- A blank default, a script-set current value, and a default changed after editing follow native dirty-value and reset behavior.
- Disabled participation includes a disabled ancestor fieldset. Removing the disabled state restores ordinary participation.
- The label, help text, and host-rendered error are exposed at the actual editing control across the shadow boundary, including after a host error is cleared.
- A user edit delivers an input notification and the host can read the updated value when handling it. Enter inserts a newline as an edit. The component-specific change event reports the committed value when a changed edit is committed. Initialization, script writes, reset and restore emit neither user notification.
- In a narrow dialog, long answers stay readable and editable with wrapping and a visible keyboard focus indicator.

## Requirements

- **FR-001**. Provide one form-associated `ocelle-form-textarea` for a named multiline string, with current value and default value following the library's form-control conventions.
- **FR-002**. Keep submitted and displayed values in step after connecting, user editing, script writes and reset. Include the exact initial value and its newline content in the submitted data when the host submits in the same task as connection, before the first scheduled render.
- **FR-003**. Match native textarea behavior for required, disabled and read-only participation, validation, focus and editing.
- **FR-004**. Expose the field label, help and current error to assistive technology at the editing control. Provide a usable focus state and distinguish disabled, read-only and invalid states using existing component and token conventions.
- **FR-005**. Preserve textarea keyboard behavior inside an existing dialog and expose input and change events following the existing form-control conventions.
- **FR-006**. The host owns submission, async work and its errors. Displaying or clearing a host error preserves the edited value.
- **FR-007**. Supply a documented per-element export, the custom-elements manifest entry, an example and a minor changelog entry. Provide editable, invalid and read-only stories and evidence for light and dark rendering, forced colours, accessibility and strict CSP.

## Success criteria

- **SC-001**. Browser scenarios attempt a real form submission in the same task as connection, before first render, and verify the exact submitted string including line breaks. They also verify the submitted values after typing and pasting, after a host failure and after reset.
- **SC-002**. Browser scenarios verify the native participation and keyboard outcomes and the accessible name, help and error at the editing control.
- **SC-003**. The per-element import, manifest, docs and all three story states are present, and every required merge check passes on the pilot's final code.

## Assumptions

- The existing form controls define the naming and accessibility conventions. Native textarea behavior is the reference for multiline form semantics.
- The pilot can ship independently of #72 and #73. The Workflow Studio composition examples in #76, changes to the select in #59, and host persistence are outside this mission.
