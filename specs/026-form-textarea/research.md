# Research for ocelle-form-textarea

## Form association and timing

The existing input observes its value attribute as a default and calls setFormValue through the shared base before a render. Reuse that path. #59 is a select precedent for why render-time synchronization is too late. Lit's deferred reflection can also omit a name set by property until the next update. Make the textarea's name, required, readonly and disabled accessors reflect immediately. Attribute writes use the same synchronization path. Default property initialization leaves absent attributes absent and does not add attributes during custom-element construction.

Synchronize validity from the textarea's current value and effective required, readonly and disabled states after value or constraint changes, default updates, reset, restoration and the fieldset disabled callback. The only supported constraint is required. An editable empty required textarea sets valueMissing before the first render, while a readonly or effectively disabled textarea clears it. Obtain the localized required message from a native blank required textarea. Pass the rendered shadow textarea as the validity anchor when available. After rendering, verify the native control has the matching flags and can receive focus on reportValidity. This avoids using a stale rendered value or attributes for a same-task requestSubmit. Keep this behavior in the textarea subclass.

A direct Chromium comparison found native APIs and submit-event FormData normalize mixed CRLF, lone CR and LF to LF. Direct setFormValue retains raw separators. Canonicalize once on entry for defaults, scripted value and browser restoration. Reset uses the normalized default and user edits already come from the native textarea. The URL-encoded submit request uses CRLF line breaks after newlines are encoded for transport. Test these as separate exact expectations without converting newlines in the assertions.

For the same-task check, the existing drivers yield to Lit, so use an in-page operation invoked in both projects that installs a submit recorder, inserts the field, checks its still-unrendered shadow DOM, and calls requestSubmit without yielding. Capture FormData in the actual submit handler. Exercise markup attributes and imperative property configuration, and use separate cases for empty required, synchronous correction and reset, readonly and disabled fieldsets.

## Native editing and event ownership

The native control owns text selection, keyboard paths and composition. The form input's explicit Enter submission is input-specific. Enter inserts a newline and native change commits on leaving the field. The host owns async save and its error text. Updating the error must preserve the edited value.

## Accessibility and visual verification

Reuse the existing label, help and error parts and announcement behavior. Assert the computed name and description on the inner editable node. For the focused Submit path, capture live-region behavior after the host sets a new error using the existing form-input announcement probe. Verify one polite announcement, unchanged focus and value, and that clearing the error removes it from the textarea's description.

Use a token-width dashed boundary as a read-only cue without relying on colour. Keep its focus ring and retain the thicker invalid mark and different disabled treatment. The readonly predicate uses the native state, excludes effectively disabled controls, and does not suppress an invalid marker when both states apply. Verify the border style, focus and native participation by switching the same field across states, including under forced colours. Add separate editable, invalid, read-only and disabled light/dark baselines. Exercise real dialog editing at narrow width and the strict-CSP built fixture.
