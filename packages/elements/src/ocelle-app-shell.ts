import { LitElement } from "lit";
import { define } from "./define.ts";

export type AppShellTier = "expanded" | "collapsed" | "narrow";

export class OcelleAppShell extends LitElement {
  declare layout: string | undefined;
  declare productName: string;
  declare menuLabel: string;
  declare railLabel: string;
  declare sidebarLabel: string;
  declare narrowBelow: string | undefined;
  declare collapseBelow: string | undefined;
  declare flushBlockEnd: boolean;
  declare flushInlineEnd: boolean;

  get tier(): AppShellTier {
    return "expanded";
  }

  get contentTarget(): HTMLElement | null {
    return null;
  }

  remeasure(): void {}
}

define("ocelle-app-shell", OcelleAppShell);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-app-shell": OcelleAppShell;
  }
}
