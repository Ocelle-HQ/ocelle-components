// The test host of the slot convention (005 FR-023; research.md R-10, R-11; T042): `ocelle-test-host`, a Lit element
// that follows the convention as a control of #7 or #12 will, and ships in no package. Its shadow root holds the row,
// an inner `<button class="icon-row">` with a 1 px border and no padding of its own, and in it the icon wrapper, the
// label and the trailing wrapper of R-10. It adopts `iconSlotStyles` after its own styles. `label`, when set, is the
// button's `aria-label` (an icon-only control names its inner control, FR-023); `disabled` disables the button (US3-8).
// The row sets no type: the button inherits the host's font and colour, so a test sets the type on the host. The
// in-process tests import this module from source; the fixture suites load its bundle, built with its own copy of Lit
// by global-setup.ts, beside the browser build, which defines every `ocelle-icon` on those pages.
import { LitElement, css, html, nothing } from "lit";
import { iconSlotStyles } from "../../src/icon-slot.ts";

export class OcelleTestHost extends LitElement {
  static override properties = {
    label: { type: String },
    disabled: { type: Boolean },
  };

  static override styles = [
    css`
      :host {
        display: inline-block;
      }

      button {
        margin: 0;
        padding: 0;
        border: 1px solid;
        font: inherit;
        color: inherit;
        background: none;
      }
    `,
    iconSlotStyles,
  ];

  declare label: string | undefined;
  declare disabled: boolean | undefined;

  protected override render(): unknown {
    return html`<button class="icon-row" type="button" aria-label=${this.label ?? nothing} ?disabled=${this.disabled === true}><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span><span class="icon-slot trailing"><slot name="trailing"></slot></span></button>`;
  }
}

if (customElements.get("ocelle-test-host") === undefined) customElements.define("ocelle-test-host", OcelleTestHost);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-test-host": OcelleTestHost;
  }
}
