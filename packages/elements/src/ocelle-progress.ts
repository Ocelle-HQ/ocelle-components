// `ocelle-progress` (013 FR-030 to FR-039; research.md R-05, R-06; data-model.md § `ocelle-progress`): a progress
// bar, determinate or indeterminate, named through ElementInternals. Importing this module defines `ocelle-progress`
// and no other element.
// Phase 3 scaffold: the declared surface only, no behaviour (contracts/checks.md § Scaffold).
import { LitElement, nothing } from "lit";
import { define } from "./define.ts";

/**
 * A progress bar: determinate with a value, indeterminate without one.
 *
 * @tagname ocelle-progress
 */
export class OcelleProgress extends LitElement {
  static override properties = {
    value: { type: Number },
    max: { type: Number },
    valueText: { attribute: "value-text" },
    label: {},
    showLabel: { type: Boolean, attribute: "show-label" },
    size: {},
    ground: {},
  };

  /**
   * The current amount. Unset means indeterminate.
   *
   * @default undefined
   */
  declare value: number | undefined;

  /**
   * The maximum. Unset means 100.
   *
   * @default undefined
   */
  declare max: number | undefined;

  /**
   * Words for the current value, for example "7 of 12".
   *
   * @default undefined
   */
  declare valueText: string | undefined;

  /**
   * The accessible name, as text.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Shows the label (and the value text) as text.
   *
   * @default undefined
   */
  declare showLabel: boolean | undefined;

  /**
   * `compact` is a thin bar. Unset gives the default size.
   *
   * @default undefined
   */
  declare size: "compact" | undefined;

  /**
   * `tinted` draws the track boundary for a tinted ground. Unset is for the main grounds.
   *
   * @default undefined
   */
  declare ground: "tinted" | undefined;

  protected override render(): unknown {
    return nothing;
  }
}

define("ocelle-progress", OcelleProgress);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-progress": OcelleProgress;
  }
}
