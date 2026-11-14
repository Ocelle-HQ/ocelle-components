// `ocelle-tabs` (014 FR-006, FR-019 to FR-025, FR-021a; research.md R-01 to R-05). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A tablist of `ocelle-tab` children and their `ocelle-tab-panel` panels, paired by order.
 *
 * @tagname ocelle-tabs
 */
export class OcelleTabs extends LitElement {
  static override properties = {
    label: { type: String },
  };

  /**
   * The accessible name.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /** The selected tab's value. */
  get value(): string {
    return "";
  }

  set value(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tabs": OcelleTabs;
  }
}
