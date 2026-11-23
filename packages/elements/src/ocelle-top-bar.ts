import { LitElement, css, html, nothing } from "lit";
import { define } from "./define.ts";
import { accessibleName } from "./naming.ts";
import { SlotState } from "./slot-state.ts";
import "./ocelle-brand-mark.ts";
import "./ocelle-icon.ts";

/**
 * The application's brand, product name, host actions and optional navigation menu trigger.
 *
 * @tagname ocelle-top-bar
 * @slot actions - Host-owned controls, shown after the product name.
 * @csspart bar - The chrome container.
 * @csspart brand - The decorative rosette and product name.
 * @csspart actions - The host actions region, hidden while empty.
 * @csspart menu-button - The native menu trigger.
 * @fires {CustomEvent<{ expanded: boolean }>} ocelle-top-bar-menu-request - Requests the next menu state. Bubbles
 * and is composed. The host applies the resulting state with `menuExpanded`.
 */
export class OcelleTopBar extends LitElement {
  static override properties = {
    productName: { type: String, attribute: "product-name" },
    showMenu: { type: Boolean, attribute: "show-menu" },
    menuLabel: { type: String, attribute: "menu-label" },
    menuExpanded: { type: Boolean, attribute: "menu-expanded" },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]),
    [part="actions"][hidden] {
      display: none;
    }

    [part="bar"] {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas: "menu brand actions";
      align-items: center;
      box-sizing: border-box;
      min-block-size: var(--ocelle-shell-topbar-height);
      padding-inline: var(--ocelle-space-3);
      font-family: var(--ocelle-font-sans);
      line-height: var(--ocelle-line-height-normal);
    }

    [part="brand"] {
      grid-area: brand;
      display: flex;
      align-items: center;
      gap: var(--ocelle-space-2);
      min-inline-size: 0;
      font-size: var(--ocelle-font-size-md);
      font-weight: var(--ocelle-font-weight-strong);
    }

    .product {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    [part="actions"] {
      grid-area: actions;
      display: flex;
      flex-wrap: wrap;
      justify-content: end;
      align-items: center;
      gap: var(--ocelle-space-2);
      margin-inline-start: var(--ocelle-space-2);
    }

    [part="menu-button"] {
      grid-area: menu;
      display: inline-grid;
      place-items: center;
      box-sizing: border-box;
      min-inline-size: var(--ocelle-target-min);
      min-block-size: var(--ocelle-target-min);
      margin-inline-end: var(--ocelle-space-2);
      padding: 0;
      border: var(--ocelle-border-width) solid transparent;
      border-radius: var(--ocelle-radius-2);
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    [part="menu-button"]:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset-inset);
    }

    @media not (forced-colors: active) {
      [part="bar"] {
        background: var(--ocelle-color-chrome);
        color: var(--ocelle-color-chrome-ink);
      }

      [part="menu-button"]:hover {
        background: var(--ocelle-color-chrome-hover);
      }
    }

    @media (forced-colors: active) {
      [part="bar"] {
        border-color: CanvasText;
      }

      [part="menu-button"] {
        border-color: ButtonText;
        color: ButtonText;
      }

      [part="menu-button"]:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /** The product name displayed beside the mark. */
  declare productName: string;

  /** Whether to expose the menu trigger. */
  declare showMenu: boolean;

  /** Localized accessible name for the menu trigger. */
  declare menuLabel: string;

  /** Whether the host has expanded navigation. */
  declare menuExpanded: boolean;

  readonly #slots = new SlotState(this);

  constructor() {
    super();
    this.productName = "";
    this.showMenu = false;
    this.menuLabel = "Open navigation";
    this.menuExpanded = false;
  }

  protected override render(): unknown {
    return html`
      <div part="bar">
        ${this.showMenu ? html`
          <button part="menu-button" type="button" aria-label=${accessibleName(this.menuLabel, null) ?? "Open navigation"}
            aria-expanded=${String(this.menuExpanded)} @click=${this.#requestMenu}>
            <ocelle-icon name="menu"></ocelle-icon>
          </button>
        ` : nothing}
        <div part="brand">
          <ocelle-brand-mark ground="chrome"></ocelle-brand-mark>
          <span class="product">${this.productName}</span>
        </div>
        <div part="actions" ?hidden=${this.#slots.empty("actions")}><slot name="actions"></slot></div>
      </div>
    `;
  }

  #requestMenu(): void {
    this.dispatchEvent(new CustomEvent("ocelle-top-bar-menu-request", {
      detail: { expanded: !this.menuExpanded },
      bubbles: true,
      composed: true,
    }));
  }
}

define("ocelle-top-bar", OcelleTopBar);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-top-bar": OcelleTopBar;
  }
}
