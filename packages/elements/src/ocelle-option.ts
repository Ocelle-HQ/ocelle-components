// `ocelle-option` (014 FR-009, FR-012, FR-018; research.md R-01, R-03, R-10, R-15). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * An option of an `ocelle-listbox`.
 *
 * @tagname ocelle-option
 */
export class OcelleOption extends LitElement {
  static override properties = {
    disabled: { type: Boolean, reflect: true },
  };

  /**
   * Whether the option is disabled.
   *
   * @default false
   */
  declare disabled: boolean;

  /** The option's value. */
  get value(): string {
    return "";
  }

  set value(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-option": OcelleOption;
  }
}
