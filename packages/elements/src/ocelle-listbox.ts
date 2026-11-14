// `ocelle-listbox` (014 FR-010 to FR-018, FR-014a; research.md R-01, R-03 to R-05, R-18). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A single-select listbox of `ocelle-option` children.
 *
 * @tagname ocelle-listbox
 */
export class OcelleListbox extends LitElement {
  static override properties = {
    label: { type: String },
  };

  /**
   * The accessible name.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /** The selected option's value. */
  get value(): string {
    return "";
  }

  set value(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-listbox": OcelleListbox;
  }
}
