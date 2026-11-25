// `ocelle-evidence-step` (019 FR-030, FR-034 to FR-036; contracts/ocelle-evidence-step.md; research.md R-12): one step
// of an `ocelle-evidence-chain`.
// - Structure: an open shadow root holding `<span part="content"><slot></slot></span>`, a block inside the
//   inline-block host, so a step's lines leave no gap between them that axe's colour-contrast check reads as an
//   overlap (an inline content box of two lines did, on the long-step story); nothing else. The step's type,
//   colour and chip box come from its container through `::slotted()`, so outside a chain it shows its content as
//   plain text in the page's type, with no marker, ordinal, connector or chip box.
// - `variant` and `wrap` reflect, so the chain's `::slotted()` selectors and its `MutationObserver` see a property set
//   from script. `wrap="anywhere"` breaks long identifiers in the content anywhere.
// Importing this module defines `ocelle-evidence-step` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";

/**
 * One step of an evidence chain: its content, drawn by the chain with a numbered marker or, with `variant="chip"`, as
 * a compact chip. Outside a chain it shows its content as plain text.
 *
 * @tagname ocelle-evidence-step
 * @slot - The step's content.
 * @csspart content - The content.
 */
export class OcelleEvidenceStep extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    wrap: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-block;
    }

    :host([hidden]) {
      display: none;
    }

    [part="content"] {
      display: block;
    }

    :host([wrap="anywhere"]) [part="content"] {
      overflow-wrap: anywhere;
    }
  `;

  /**
   * `chip` draws the step compact inside a chain, with no marker or ordinal; any other value acts as unset. Reflected.
   *
   * @default undefined
   */
  declare variant: "chip" | undefined;

  /**
   * `anywhere` breaks long identifiers in the content anywhere; unset wraps between words. Reflected.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  protected override render(): unknown {
    return html`<span part="content"><slot></slot></span>`;
  }
}

define("ocelle-evidence-step", OcelleEvidenceStep);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-evidence-step": OcelleEvidenceStep;
  }
}
