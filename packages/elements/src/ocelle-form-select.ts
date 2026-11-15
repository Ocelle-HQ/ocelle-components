// `ocelle-form-select` (specs/010-feedback-forms FR-020 to FR-028, FR-031, FR-032; research.md R-05 to R-07): a labelled
// native select for closed choices that takes part in its form like a native select. Phase 4 scaffold: the class with the
// base class's four abstract members as neutral stubs (so it compiles against the abstract `FormControl`), not defined.
import { html } from "lit";
import type { TemplateResult } from "lit";
import { FormControl } from "./form-control.ts";

/**
 * A labelled native select for closed choices, with an optional description and a host-set error, whose options are its
 * light-DOM `<option>` and `<optgroup>` children, and that takes part in its form like a native select.
 *
 * @tagname ocelle-form-select
 */
export class OcelleFormSelect extends FormControl {
  /** Scaffold stub: the native control. */
  protected control(): HTMLInputElement {
    throw new Error("not implemented");
  }

  /** Scaffold stub: the default value. */
  protected initialValue(): string {
    return "";
  }

  /** Scaffold stub: renders nothing. */
  protected renderControl(): TemplateResult {
    return html``;
  }

  /** Scaffold stub: dispatches nothing. */
  protected dispatchChange(): void {
    return;
  }
}
