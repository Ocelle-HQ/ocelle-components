// The overflow-region module's test host (009 spec US1 scenario 16, FR-011, SC-008; contracts/overflow-region.md
// § Use; research.md R-17; T015): `ocelle-test-overflow-host`, a Lit element built on `OverflowRegion` exactly as the
// contract writes it, with its own template of the contract's structure and the module's default `group` role, and
// nothing of `ocelle-scroller`. It ships in no package. test/overflow-host.test.ts runs US1 scenarios 1, 3, 4 and 12
// against it, so the module, not the scroller element, is shown to carry the behaviour.
import { LitElement, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { OverflowRegion, overflowRegionStyles } from "../../src/overflow-region.ts";

export class OcelleTestOverflowHost extends LitElement {
  static override properties = {
    label: { type: String },
  };

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = [
    css`
      :host {
        display: block;
      }
    `,
    overflowRegionStyles,
  ];

  declare label: string | undefined;

  readonly #region = new OverflowRegion(this, { box: () => this.renderRoot.querySelector<HTMLElement>(".region-box") });

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  protected override render(): unknown {
    return html`<div class="region-frame">
      <div class="region-box" data-fade=${ifDefined(this.#region.fadeAttribute)}>
        <div class="region-track"><slot></slot></div>
      </div>
      <div class="region-ring" aria-hidden="true"></div>
      <div class="region-edge start" aria-hidden="true"></div>
      <div class="region-edge end" aria-hidden="true"></div>
    </div>`;
  }

  protected override updated(): void {
    this.#region.setLabel(this.label);
  }
}

if (customElements.get("ocelle-test-overflow-host") === undefined) customElements.define("ocelle-test-overflow-host", OcelleTestOverflowHost);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-test-overflow-host": OcelleTestOverflowHost;
  }
}
