import { LitElement } from "lit";
import { define } from "./define.ts";

export class OcelleTopBar extends LitElement {
  declare productName: string;
  declare showMenu: boolean;
  declare menuLabel: string;
  declare menuExpanded: boolean;
}

define("ocelle-top-bar", OcelleTopBar);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-top-bar": OcelleTopBar;
  }
}
