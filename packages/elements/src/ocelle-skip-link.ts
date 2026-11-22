import { LitElement, html } from "lit";
import { define } from "./define.ts";

export class OcelleSkipLink extends LitElement {
  static override properties = { target: { attribute: false }, targetSelector: { attribute: "target-selector" } };

  declare target: HTMLElement | null;
  declare targetSelector: string;

  constructor() {
    super();
    this.target = null;
    this.targetSelector = "";
  }

  protected override render(): unknown {
    return html`<button type="button" part="control"><slot>Skip to main content</slot></button>`;
  }
}

define("ocelle-skip-link", OcelleSkipLink);
declare global {
  interface HTMLElementTagNameMap {
    "ocelle-skip-link": OcelleSkipLink;
  }
}
