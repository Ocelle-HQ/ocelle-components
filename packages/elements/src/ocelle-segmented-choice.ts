// `ocelle-segmented-choice` (014 FR-006, FR-026 to FR-030; research.md R-01, R-03 to R-06). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A toolbar of `ocelle-segment` toggle buttons, exactly one pressed.
 *
 * @tagname ocelle-segmented-choice
 */
export class OcelleSegmentedChoice extends LitElement {
  static override properties = {
    label: { type: String },
    joined: { type: Boolean, reflect: true },
  };

  /**
   * The accessible name.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The joined variant.
   *
   * @default false
   */
  declare joined: boolean;

  /** The pressed segment's value. */
  get value(): string {
    return "";
  }

  set value(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-segmented-choice": OcelleSegmentedChoice;
  }
}
