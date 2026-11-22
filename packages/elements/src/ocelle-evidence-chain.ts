// `ocelle-evidence-chain` (019 FR-030 to FR-036; contracts/ocelle-evidence-chain.md; research.md R-08, R-09, R-12): an
// evidence chain, one ordered list of its `ocelle-evidence-step` children. Phase 3 scaffold: the public surface only,
// no behaviour. Importing this module defines `ocelle-evidence-chain` and, as a container module, its item element
// `ocelle-evidence-step`.
import { LitElement } from "lit";
import { define } from "./define.ts";
import "./ocelle-evidence-step.ts";

/**
 * An evidence chain: one ordered list of its `ocelle-evidence-step` children, in source order.
 *
 * @tagname ocelle-evidence-chain
 * @slot - The steps, `ocelle-evidence-step` elements, in source order.
 * @csspart list - The ordered list.
 */
export class OcelleEvidenceChain extends LitElement {
  static override properties = {
    label: { type: String },
  };

  /**
   * Names the list when the host has no non-blank `aria-label`; not shown.
   *
   * @default undefined
   */
  declare label: string | undefined;

  protected override render(): unknown {
    return undefined;
  }
}

define("ocelle-evidence-chain", OcelleEvidenceChain);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-evidence-chain": OcelleEvidenceChain;
  }
}
