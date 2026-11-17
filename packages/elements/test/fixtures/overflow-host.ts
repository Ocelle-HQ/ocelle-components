// The overflow-region module's test host (009 spec US1 scenario 16, FR-011, SC-008; contracts/overflow-region.md
// § Use; research.md R-17; T015): `ocelle-test-overflow-host`, a Lit element built on `OverflowRegion` exactly as the
// contract writes it, with its own template of the contract's structure and the module's default `group` role, and
// nothing of `ocelle-scroller`. It ships in no package. test/overflow-host.test.ts runs US1 scenarios 1, 3, 4 and 12
// against it, so the module, not the scroller element, is shown to carry the behaviour.
//
// Since 009 phase 2's operator round 3 (O3-03, T069; contracts/overflow-region.md § Lifecycle `hostUpdated`): a
// fixture-only `current` attribute renders two frames, each with its own box (`data-box="a"` and `"b"`, whose tracks
// hold the named slots `a` and `b`), and `box()` returns the one `current` names, or none for any other value. So a
// host can hand the module a new box in place of the old one, or none, while the replaced box stays rendered in the
// shadow root, outside the frame of the box the module follows, where it can still be measured. Without `current` the
// host renders the contract's structure once, as the shared scenarios use it.
import { LitElement, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { OverflowRegion, overflowRegionStyles } from "../../src/overflow-region.ts";

export class OcelleTestOverflowHost extends LitElement {
  static override properties = {
    label: { type: String },
    current: { type: String },
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
  /** Fixture-only: the box the module follows, `a` or `b` (any other value, none); unset, the one box of the contract. */
  declare current: string | undefined;

  readonly #region = new OverflowRegion(this, {
    box: () => this.renderRoot.querySelector<HTMLElement>(this.current === undefined ? ".region-box" : `.region-box[data-box="${this.current}"]`),
  });

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  protected override render(): unknown {
    if (this.current !== undefined) return ["a", "b"].map((name) => this.#frame(name));
    return html`<div class="region-frame">
      <div class="region-box" data-fade=${ifDefined(this.#region.fadeAttribute)}>
        <div class="region-track"><slot></slot></div>
      </div>
      <div class="region-ring" aria-hidden="true"></div>
      <div class="region-edge start" aria-hidden="true"></div>
      <div class="region-edge end" aria-hidden="true"></div>
    </div>`;
  }

  /** A frame of the two-box mode: its box `name` holds the slot `name`, and shows the fade only while it is followed. */
  #frame(name: string): unknown {
    return html`<div class="region-frame">
      <div class="region-box" data-box=${name} data-fade=${ifDefined(this.current === name ? this.#region.fadeAttribute : undefined)}>
        <div class="region-track"><slot name=${name}></slot></div>
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
