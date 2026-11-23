# Feature Specification for a multiline form textarea

**Feature Branch**: `codex/074-textarea-pilot`  
**Created**: 2026-11-22  
**Status**: Draft  
**Input**: GitHub #74 and [approved triage](../../triage/026-form-textarea.md).

## User Scenarios & Testing

### User Story 1 – Enter and correct a multiline decision (P1)

A reviewer in Workflow Studio run inspection can type or paste a multiline planning answer, submit it, and correct it in place after validation or a failed save. In a dialog the reviewer can edit using ordinary multiline keys. The Workflow Studio composition issue (#76) supplies the consumer context.

**Why this priority**. It lets reviewers give a decision and its rationale together, including when the host needs a correction.

**Independent test**. Open the editable field in an existing dialog, enter two lines with the keyboard and paste a paragraph. Submit through the form, render a host error, correct the answer and submit again. Check the submitted value, the accessible name and description of the editing control, and the value displayed after each step.

**Acceptance scenarios**

1. Given an initial answer with line breaks and a named field, when the host submits the form in the same task as connecting the field, before the first scheduled render, the submitted data includes the initial answer with native textarea newline normalization. This also works when a script creates the field and sets its name and value as properties. Later submissions preserve line breaks after typing and pasting. Reset restores the configured default and clears the dirty state.
2. Given a dialog with a labelled field, when the reviewer tabs into it, types, uses Enter, pastes text or moves the caret with the keyboard, the field behaves like a native textarea. Enter inserts a line break. The dialog retains its usual focus behavior.
3. Given a required field, when the reviewer submits it empty, native form validation blocks the submission even before the first render. A synchronous edit or reset updates the outcome of the next submission. Given a host-reported failure after a non-empty submission, the new error is announced once politely without moving focus or changing the value. The error is associated with the editing control until cleared. The reviewer can edit and resubmit without re-entering the rest of the answer.
4. Given a read-only field, the reviewer can focus and select its text, and the form includes the value. Read-only fields are barred from constraint validation. A disabled field is omitted from FormData, cannot be edited or focused by tabbing, and is barred from constraint validation.

### Edge cases

- A blank default, a script-set current value, and a default changed after editing follow native dirty-value and reset behavior.
- Disabled participation includes a disabled ancestor fieldset. Removing the disabled state restores ordinary participation.
- The label, help text, and host-rendered error are exposed at the actual editing control across the shadow boundary, including after a host error is cleared.
- A user edit delivers an input notification and the host can read the updated value when handling it. Enter inserts a newline as an edit. The component-specific change event reports the committed value when a changed edit is committed. Initialization, script writes, reset and restore emit neither user notification.
- In a narrow dialog, long answers stay readable and editable with wrapping and a visible keyboard focus indicator.

## Requirements

- **FR-001**. Provide one form-associated `ocelle-form-textarea` for a named multiline string, with current value and default value following the library's form-control conventions.
- **FR-002**. Keep the displayed value, current value and script-visible FormData in step after connecting, user editing, script writes, reset and browser restoration. As with native textarea, each CRLF pair and each lone CR normalize to LF. The field participates with that value when submitted in the same task as connection, including when name and value were set as properties. On the wire, encoding follows native form submission.
- **FR-003**. Match native textarea behavior for required, disabled and read-only participation, validation, focus and editing. Changes to these states or to the value affect submission immediately, including before the first render.
- **FR-004**. Expose the field label, help and current error to assistive technology at the editing control. Provide a usable focus state and distinguish disabled, read-only and invalid states with visible cues that survive forced colours.
- **FR-005**. Preserve textarea keyboard behavior inside an existing dialog and expose input and change events following the existing form-control conventions.
- **FR-006**. The host owns submission, async work and its errors. Displaying or clearing a host error preserves the edited value and focus. Announce a new error politely and remove it from the editing control's description when cleared.
- **FR-007**. Supply a documented per-element export, the custom-elements manifest entry, an example and a minor changelog entry. Provide editable, invalid, read-only and disabled stories and evidence for light and dark rendering, forced colours, accessibility and strict CSP.

## Success criteria

- **SC-001**. Both browser projects attempt a real form submission in the same task as connection, assert that the inner textarea has yet to render, and assert the literal LF-normalized FormData from the submit event. The scenarios also verify values after typing, pasting, host failure and reset. When the strict-CSP fixture checks a URL-encoded request, its decoded bytes match native textarea serialization, with CRLF line endings.
- **SC-002**. Browser scenarios verify native participation, immediate constraint validation, keyboard outcomes, and the accessible name, help and error at the editing control. They also verify one polite announcement for a new host error while focus stays on Submit, and distinguish the editable, read-only, disabled and invalid states in forced colours.
- **SC-003**. The per-element import, manifest, docs and stories with pinned light and dark baselines cover the specified states, and every required merge check passes on the pilot's final code.

## Assumptions

- The existing form controls define the naming and accessibility conventions. Native textarea behavior is the reference for multiline form semantics.
- The pilot can ship independently of #72 and #73. The Workflow Studio composition examples in #76, changes to the select in #59, and host persistence are outside this mission.
