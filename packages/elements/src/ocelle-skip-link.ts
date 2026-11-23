import { LitElement, css, html } from "lit";
import { define } from "./define.ts";

/**
 * A keyboard shortcut to programmatically focus the start of the page content.
 *
 * @tagname ocelle-skip-link
 * @slot - The localized shortcut label.
 * @csspart control - The native keyboard control.
 */
export class OcelleSkipLink extends LitElement {
  static override properties = { target: { attribute: false }, targetSelector: { attribute: "target-selector" } };

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    button {
      position: absolute;
      z-index: 1;
      inset-block-start: 0;
      inset-inline-start: 0;
      box-sizing: border-box;
      max-inline-size: 100%;
      min-block-size: var(--ocelle-target-min);
      padding-block: var(--ocelle-space-2);
      padding-inline: var(--ocelle-space-3);
      border: var(--ocelle-border-width) solid currentColor;
      border-radius: var(--ocelle-radius-2);
      background: var(--ocelle-color-sheet);
      color: var(--ocelle-color-ink);
      font: inherit;
      overflow-wrap: anywhere;
    }

    button:not(:focus-visible) {
      inline-size: var(--ocelle-size-visually-hidden);
      block-size: var(--ocelle-size-visually-hidden);
      min-block-size: 0;
      padding: 0;
      border: 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
    }

    button:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset-inset);
    }

    @media (forced-colors: active) {
      button:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /** Explicit target, which takes precedence even when it cannot receive focus. */
  declare target: HTMLElement | null;
  /** Selector evaluated in the control's containing root at activation. */
  declare targetSelector: string;

  constructor() {
    super();
    this.target = null;
    this.targetSelector = "";
  }

  protected override render(): unknown {
    return html`<button type="button" part="control" @click=${this.#transferFocus}><slot>Skip to main content</slot></button>`;
  }

  #transferFocus(): void {
    // Native focus leaves the active control alone when the destination cannot be focused.
    (this.target ?? this.#match())?.focus();
  }

  #match(): HTMLElement | null {
    // The containing root of an element is a document, fragment, or element, each supporting querySelector.
    const root = this.getRootNode() as ParentNode;
    try {
      const match = root.querySelector(this.targetSelector);
      return match instanceof HTMLElement ? match : null;
    } catch {
      return null;
    }
  }
}

define("ocelle-skip-link", OcelleSkipLink);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-skip-link": OcelleSkipLink;
  }
}
