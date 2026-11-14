// `ocelle-facts` (013 FR-003 to FR-014; research.md R-01 to R-03; data-model.md § `ocelle-facts`): a label and value
// sheet, one description list of its `ocelle-fact` children. Importing this module defines `ocelle-facts` and, as a
// container module, its item element `ocelle-fact` (PLAN-CORRECTNESS-1-012 (a)), and no other element.
// Phase 1 scaffold: the declared surface only, no behaviour (contracts/checks.md § Scaffold).
import { LitElement, nothing } from "lit";
import { define } from "./define.ts";
import "./ocelle-fact.ts";

/**
 * A label and value sheet: one description list of its `ocelle-fact` children.
 *
 * @tagname ocelle-facts
 */
export class OcelleFacts extends LitElement {
  static override properties = {
    density: { type: String },
    layout: { type: String },
  };

  /**
   * Row spacing: `compact` tightens the gaps for dense screens. Unset gives the default spacing.
   *
   * @default undefined
   */
  declare density: "compact" | undefined;

  /**
   * `columns` keeps two columns and `stacked` one column at any size; `grid` shows each pair as a cell. Unset switches
   * automatically on the sheet's own two-column inline size.
   *
   * @default undefined
   */
  declare layout: "columns" | "stacked" | "grid" | undefined;

  protected override render(): unknown {
    return nothing;
  }
}

define("ocelle-facts", OcelleFacts);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-facts": OcelleFacts;
  }
}
