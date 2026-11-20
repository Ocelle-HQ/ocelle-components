import { LitElement } from "lit";
import { define } from "./define.ts";

export class OcelleNavItem extends LitElement {
  declare href: string | undefined;
  declare label: string;
  declare current: string | undefined;
  declare compact: boolean;
}

// Inert scaffold. The shell can supply a temporary presentation without changing the host setting.
export function setNavItemCompact(_item: OcelleNavItem, _compact: boolean | undefined): void {}

define("ocelle-nav-item", OcelleNavItem);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-nav-item": OcelleNavItem;
  }
}
