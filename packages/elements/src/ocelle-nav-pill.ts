import { LitElement } from "lit";
import { define } from "./define.ts";

export interface NavPillItem {
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
}

export class OcelleNavPill extends LitElement {
  static override properties = { label: {}, items: { attribute: false } };

  declare label: string;
  declare items: readonly NavPillItem[];

  constructor() {
    super();
    this.label = "";
    this.items = [];
  }
}

define("ocelle-nav-pill", OcelleNavPill);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-nav-pill": OcelleNavPill;
  }
}
