// `ocelle-link` (014 FR-045 to FR-049; research.md R-08, R-16). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * An inline link in running text that tells the host it was activated.
 *
 * @tagname ocelle-link
 */
export class OcelleLink extends LitElement {
  static override properties = {
    href: { type: String, reflect: true },
    label: { type: String },
  };

  /** The link's target, as written. */
  declare href: string | undefined;

  /** The link's accessible name instead of its text. */
  declare label: string | undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-link": OcelleLink;
  }
}
