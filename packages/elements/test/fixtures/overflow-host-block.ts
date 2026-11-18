// The overflow-region module's block-axis test host (019 FR-018; contracts/overflow-region-block-axis.md § Tests;
// research.md R-18; tasks.md T079): `ocelle-test-overflow-block`, a Lit element built on `OverflowRegion` with the
// block-axis option, as `ocelle-data-table` with `sticky-header` uses it, and nothing of the data table. It ships in no
// package. Its light-DOM children are slotted into the track in tree order: an optional block standing in for a
// caption (`.cap`, two lines tall by a line break, a link on its second line; re-analysis A1 (c), Q-S2-1 (a)), the pinned
// first box (`.pin`, the page's rules pin it as block 1 pins the `<thead>`: `position: sticky` at
// `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, spike-2 Q-2 (a)), then the
// rows of focusable links. The fixture-only boolean attribute `block-axis` switches the option at run time; the host
// and `.region-frame` are a column flex, so a block bound the page sets on the host reaches the box (as the data
// table's `sticky-header` makes them). The template carries the option's extra `.region-edge block-end`.
import { LitElement, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { OverflowRegion, overflowRegionStyles } from "../../src/overflow-region.ts";

export class OcelleTestOverflowBlock extends LitElement {
  static override properties = {
    label: { type: String },
    blockAxis: { type: Boolean, reflect: true, attribute: "block-axis" },
  };

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-inline-size: 0;
      }

      .region-frame {
        display: flex;
        flex-direction: column;
        min-block-size: 0;
      }

      .region-box {
        min-block-size: 0;
      }
    `,
    overflowRegionStyles,
  ];

  declare label: string | undefined;
  /** Fixture-only: the module's block-axis option, on while present. */
  declare blockAxis: boolean | undefined;

  readonly #region = new OverflowRegion(this, {
    box: () => this.renderRoot.querySelector<HTMLElement>(".region-box"),
    blockAxis: () => this.blockAxis === true,
    blockStartBox: () => this.querySelector(":scope > .pin"),
  });

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
      <div class="region-edge block-end" aria-hidden="true"></div>
    </div>`;
  }

  protected override updated(): void {
    this.#region.setLabel(this.label);
  }
}

if (customElements.get("ocelle-test-overflow-block") === undefined) customElements.define("ocelle-test-overflow-block", OcelleTestOverflowBlock);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-test-overflow-block": OcelleTestOverflowBlock;
  }
}
