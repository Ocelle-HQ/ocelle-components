# Textarea state

- The value attribute carries the default. The non-reflected value property carries the current string. While pristine, a default change updates the current value. User edits and property writes make it dirty. Reset restores the latest default and clears dirty state. Browser form-state restoration restores the current value without a user event.
- Synchronize the form value before notification or submission. Preserve native textarea newline semantics when transferring text between the current value and FormData.
- Required, read-only and disabled have native effects. An ancestor disabled fieldset has the same participation effect as explicit disabled. The library's label, description and host error properties retain their independent roles.
- Keep committed and current value separate. Typing produces input events. A user commit that changes the value emits one component-specific change event. Script writes, reset and restore remain silent.
