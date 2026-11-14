// `ocelle-tab-panel` (014 FR-019, FR-023, FR-024; research.md R-01 to R-03, R-05). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A panel of an `ocelle-tabs`.
 *
 * @tagname ocelle-tab-panel
 */
export class OcelleTabPanel extends LitElement {}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tab-panel": OcelleTabPanel;
  }
}
