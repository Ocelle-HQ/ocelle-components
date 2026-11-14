// `ocelle-empty-state` (013 FR-020 to FR-026; research.md R-04; data-model.md § `ocelle-empty-state`): an empty or
// loading panel, the consumer's heading, body and actions in one centred column. Importing this module defines
// `ocelle-empty-state` and no other element.
// Phase 2 scaffold: the declared surface only, no behaviour (contracts/checks.md § Scaffold).
import { LitElement, nothing } from "lit";
import { define } from "./define.ts";

/**
 * An empty or loading panel: the consumer's own heading, body and actions in one centred column.
 *
 * @tagname ocelle-empty-state
 */
export class OcelleEmptyState extends LitElement {
  static override properties = {
    variant: { type: String },
  };

  /**
   * `panel` fills a list or inspector panel with a larger rhythm and a lighter heading. Unset gives the default variant.
   *
   * @default undefined
   */
  declare variant: "panel" | undefined;

  protected override render(): unknown {
    return nothing;
  }
}

define("ocelle-empty-state", OcelleEmptyState);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-empty-state": OcelleEmptyState;
  }
}
