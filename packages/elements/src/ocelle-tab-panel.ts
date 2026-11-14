// `ocelle-tab-panel` (014 FR-019, FR-023, FR-024, Edge Cases; research.md R-01 to R-03, R-05, R-15): one panel of an
// `ocelle-tabs`, in the page's own tree beside its tab. Inside a tabs its role is `tabpanel` (internals, kept under the
// internals symbol axe reads); outside one it has none and renders its content as plain content. The tabs pair it with
// the tab at the same place among their tabs, show it (assign it to their `panels` part) only while that tab is
// selected, and write on it an `id` when it has none, `aria-labelledby` while it is shown and `tabindex="0"` while it
// is shown and holds nothing focusable, so it is then the tab stop after its tab. Its focus ring is an outline of the
// focus tokens. No transition or animation. Importing this module defines `ocelle-tab-panel` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { attachInternalsTo } from "./internals.ts";

/**
 * A panel of an `ocelle-tabs`: its content is shown while the tab at the same place among the tabs is selected.
 *
 * @tagname ocelle-tab-panel
 * @slot - The panel's content.
 */
export class OcelleTabPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      outline: none;
    }

    :host([hidden]) {
      display: none;
    }

    @media not (forced-colors: active) {
      :host(:focus-visible) {
        outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
        outline-offset: var(--ocelle-focus-offset);
      }
    }

    @media (forced-colors: active) {
      :host(:focus-visible) {
        outline: var(--ocelle-focus-width) solid Highlight;
        outline-offset: var(--ocelle-focus-offset);
      }
    }
  `;

  readonly #internals = attachInternalsTo(this);

  override connectedCallback(): void {
    super.connectedCallback();
    this.#internals.role = this.parentElement?.localName === "ocelle-tabs" ? "tabpanel" : null;
  }

  protected override render(): unknown {
    return html`<slot></slot>`;
  }
}

define("ocelle-tab-panel", OcelleTabPanel);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tab-panel": OcelleTabPanel;
  }
}
