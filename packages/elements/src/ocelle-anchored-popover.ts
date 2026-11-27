import { LitElement, html } from "lit";
import { define } from "./define.ts";

/** An anchored surface for compact controls. */
export class OcelleAnchoredPopover extends LitElement {
  static override properties = {
    label: { type: String },
    placement: { type: String },
  };

  declare label: string;
  declare placement: string;

  constructor() {
    super();
    this.label = "";
    this.placement = "below";
  }

  close(): void {
    // The scaffold has no open state.
  }

  override render() {
    return html`
      <button type="button" part="trigger"><slot name="trigger"></slot></button>
      <div id="surface" part="surface" hidden><slot></slot></div>
    `;
  }
}

define("ocelle-anchored-popover", OcelleAnchoredPopover);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-anchored-popover": OcelleAnchoredPopover;
  }
}
