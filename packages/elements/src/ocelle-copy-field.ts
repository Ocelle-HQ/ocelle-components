// `ocelle-copy-field` (014 FR-031 to FR-044; research.md R-07, R-16). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A command or identifier with a Copy control that asks the host to copy it.
 *
 * @tagname ocelle-copy-field
 */
export class OcelleCopyField extends LitElement {
  static override properties = {
    value: { type: String },
    copyLabel: { type: String, attribute: "copy-label" },
  };

  /**
   * The text shown and requested.
   *
   * @default ""
   */
  declare value: string;

  /**
   * The Copy control's accessible name.
   *
   * @default "Copy"
   */
  declare copyLabel: string;

  /** The host's outcome text. */
  get status(): string {
    return "";
  }

  set status(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-copy-field": OcelleCopyField;
  }
}
