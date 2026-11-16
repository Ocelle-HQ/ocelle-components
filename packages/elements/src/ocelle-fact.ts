// `ocelle-fact` (013 FR-003, FR-007; research.md R-01, R-03; data-model.md § `ocelle-fact`): one label and value pair.
// Inside `ocelle-facts` the sheet renders the label as its term and assigns the fact to the definition's slot, so the
// fact's shadow root is one `<slot>` and its light-DOM content, the value, shows there unchanged. Outside a sheet it
// shows its label above its value, two blocks with no term or definition role, in the facts type. Where it is is
// decided in `connectedCallback`, since a move into or out of a sheet disconnects and reconnects it. `wrap="anywhere"`
// gives the value, and only the value, `overflow-wrap: anywhere` on its slot, which the value content inherits through
// the flat tree. Importing this module defines `ocelle-fact` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";

/**
 * One label and value pair of an `ocelle-facts` sheet: the label is the `label` attribute and the value is the
 * element's content. Outside a sheet it shows its label above its value.
 *
 * @tagname ocelle-fact
 * @slot - The value.
 * @csspart label - The label, rendered only outside `ocelle-facts`.
 * @cssprop --ocelle-facts-value-size - As on `ocelle-facts`, for a fact outside a sheet: the value's font size, `--ocelle-font-size-fact` by default.
 * @cssprop --ocelle-facts-value-line-height - As on `ocelle-facts`, for a fact outside a sheet: the value's line height, `--ocelle-line-height-normal` by default.
 */
export class OcelleFact extends LitElement {
  static override properties = {
    label: { type: String, reflect: true },
    wrap: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    :host([wrap="anywhere"]) slot {
      overflow-wrap: anywhere;
    }

    [part="label"] {
      display: block;
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-sm);
      font-weight: var(--ocelle-font-weight-medium);
    }

    .value {
      display: block;
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-facts-value-size, var(--ocelle-font-size-fact));
      font-weight: var(--ocelle-font-weight-regular);
      font-variant-numeric: var(--ocelle-figures);
      line-height: var(--ocelle-facts-value-line-height, var(--ocelle-line-height-normal));
    }

    @media not (forced-colors: active) {
      [part="label"] {
        color: var(--ocelle-color-ink-muted);
      }

      .value {
        color: var(--ocelle-color-ink);
      }
    }
  `;

  /**
   * The label (term) of this pair. Unset or empty gives an empty term. Reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * `anywhere` breaks a long identifier value anywhere instead of overflowing. The label keeps word wrapping. Unset
   * wraps between words. Reflected.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  /** Whether the fact is a child of `ocelle-facts`, decided on every connection. */
  // Stryker disable next-line BooleanLiteral: equivalent, connectedCallback sets it before the first render, the only reader
  #inSheet = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#inSheet = this.parentElement?.localName === "ocelle-facts";
    this.requestUpdate();
  }

  protected override render(): unknown {
    if (this.#inSheet) return html`<slot></slot>`;
    return html`<span part="label">${this.label ?? ""}</span><slot class="value"></slot>`;
  }
}

define("ocelle-fact", OcelleFact);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-fact": OcelleFact;
  }
}
