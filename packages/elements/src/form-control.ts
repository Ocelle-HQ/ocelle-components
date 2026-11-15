// The form-control base class (specs/010-feedback-forms FR-020 to FR-028; research.md R-05, R-06; data-model.md § Form
// control): what `ocelle-form-input`, `ocelle-form-select` and the form-like elements of #14 share. Internal, not an
// entry point: not exported from index.ts or browser.ts, and its members reach the manifest through the elements
// derived from it. Phase 3 scaffold: the class without members.
import { LitElement } from "lit";

/**
 * A form-associated control: its native control, label, description and error in one open shadow root, its value,
 * validity, reset, restore and disabled state through `ElementInternals`.
 */
export class FormControl extends LitElement {}
