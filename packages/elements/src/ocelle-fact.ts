// `ocelle-fact` (013 FR-003, FR-007; research.md R-01, R-03; data-model.md § `ocelle-fact`): one label and value pair.
// Inside `ocelle-facts` the sheet renders its label as the term and shows its content as the definition; outside, it
// shows its label above its value. Importing this module defines `ocelle-fact` and no other element.
// Phase 1 scaffold: the declared surface only, no behaviour (contracts/checks.md § Scaffold).
import { LitElement, nothing } from "lit";
import { define } from "./define.ts";

/**
 * One label and value pair of an `ocelle-facts` sheet.
 *
 * @tagname ocelle-fact
 */
export class OcelleFact extends LitElement {
  static override properties = {
    label: { type: String },
    wrap: { type: String },
  };

  /**
   * The label (term) of this pair. Unset or empty gives an empty term.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * `anywhere` breaks a long identifier value anywhere instead of overflowing. The label keeps word wrapping. Unset
   * wraps between words.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  protected override render(): unknown {
    return nothing;
  }
}

define("ocelle-fact", OcelleFact);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-fact": OcelleFact;
  }
}
