// `ocelle-tab` (014 FR-009, FR-019, FR-020, FR-025; research.md R-01, R-03, R-06, R-10, R-15). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A tab of an `ocelle-tabs`.
 *
 * @tagname ocelle-tab
 */
export class OcelleTab extends LitElement {
  static override properties = {
    disabled: { type: Boolean, reflect: true },
  };

  /**
   * Whether the tab is disabled.
   *
   * @default false
   */
  declare disabled: boolean;

  /** The tab's value. */
  get value(): string {
    return "";
  }

  set value(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tab": OcelleTab;
  }
}
