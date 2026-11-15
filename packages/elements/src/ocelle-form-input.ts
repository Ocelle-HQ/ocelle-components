// `ocelle-form-input` (specs/010-feedback-forms FR-020 to FR-030; research.md R-05, R-06; data-model.md § Input-only
// fields): a labelled text field that takes part in its form like a native input. Phase 3 scaffold: the class without
// members, not defined.
import { FormControl } from "./form-control.ts";

/**
 * A labelled text field with an optional description and a host-set error, that takes part in its form like a native
 * input: its value is submitted under `name`, validated by the browser's own constraints, restored on reset and on
 * history restore, and disabled by a disabled fieldset.
 *
 * @tagname ocelle-form-input
 */
export class OcelleFormInput extends FormControl {}
