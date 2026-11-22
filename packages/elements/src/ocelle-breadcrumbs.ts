import { LitElement } from "lit";
import { define } from "./define.ts";

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export class OcelleBreadcrumbs extends LitElement {
  static override properties = { label: {}, items: { attribute: false } };

  declare label: string;
  declare items: readonly BreadcrumbItem[];

  constructor() {
    super();
    this.label = "";
    this.items = [];
  }
}

define("ocelle-breadcrumbs", OcelleBreadcrumbs);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-breadcrumbs": OcelleBreadcrumbs;
  }
}
