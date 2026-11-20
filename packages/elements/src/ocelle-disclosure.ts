// `ocelle-disclosure` (020 spec US1, FR-001 to FR-017; research.md R-01 to R-04; data-model.md § `ocelle-disclosure`):
// phase 1 scaffold, the module's signature with no behaviour (tasks.md T002).
import { LitElement, nothing } from "lit";
import { define } from "./define.ts";

/**
 * A disclosure: a summary that opens and closes a panel inline, on native `details` and `summary` semantics.
 *
 * @tagname ocelle-disclosure
 */
export class OcelleDisclosure extends LitElement {
  static override properties = {
    open: { type: Boolean },
  };

  /**
   * Whether the panel is shown.
   *
   * @default undefined
   */
  declare open: boolean | undefined;

  protected override render(): unknown {
    return nothing;
  }
}

define("ocelle-disclosure", OcelleDisclosure);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-disclosure": OcelleDisclosure;
  }
}
