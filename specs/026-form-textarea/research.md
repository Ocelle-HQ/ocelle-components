# Research for ocelle-form-textarea

## Form association and timing

The existing input observes its value attribute as a default and calls setFormValue through the shared base before a render. Reuse that path and verify it with an actual same-task submission and payload. #59 is a select precedent for why a render-time update is too late. For an initially empty required textarea, compare same-task validity and submission with a native control. Anchor native validity to the internal textarea once it exists. Check required and read-only changes before and after render where the form effect is observable.

## Native editing and event ownership

The native control owns text selection, keyboard paths and composition. The form input's explicit Enter submission is input-specific. Enter inserts a newline and native change commits on leaving the field. The host owns async save and its error text. Updating the error must preserve the edited value.

## Accessibility and visual verification

Reuse the existing label, help and error parts and announcement behavior. Assert the computed name and description on the inner editable node. Include invalid and read-only states in both themes. Check visible focus and readable states in forced colours. Exercise real dialog editing at narrow width and the strict-CSP built fixture. Use observable DOM, form and accessibility outcomes.
