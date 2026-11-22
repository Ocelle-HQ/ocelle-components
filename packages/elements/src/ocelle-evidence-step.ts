// `ocelle-evidence-step` (019 FR-030, FR-034 to FR-036; contracts/ocelle-evidence-step.md; research.md R-12): one step
// of an `ocelle-evidence-chain`. Phase 3 scaffold: the public surface only, no behaviour.
// Importing this module defines `ocelle-evidence-step` and no other element.
import { LitElement } from "lit";
import { define } from "./define.ts";

/**
 * One step of an evidence chain: its content, drawn by the chain with a numbered marker or, with `variant="chip"`, as
 * a compact chip.
 *
 * @tagname ocelle-evidence-step
 * @slot - The step's content.
 * @csspart content - The content.
 */
export class OcelleEvidenceStep extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    wrap: { type: String, reflect: true },
  };

  /**
   * `chip` draws the step compact inside a chain, with no marker or ordinal; any other value acts as unset. Reflected.
   *
   * @default undefined
   */
  declare variant: "chip" | undefined;

  /**
   * `anywhere` breaks long identifiers in the content anywhere. Reflected.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  protected override render(): unknown {
    return undefined;
  }
}

define("ocelle-evidence-step", OcelleEvidenceStep);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-evidence-step": OcelleEvidenceStep;
  }
}
