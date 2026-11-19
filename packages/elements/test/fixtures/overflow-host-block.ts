// The overflow-region module's block-axis test host (019 FR-018; contracts/overflow-region-block-axis.md § Tests;
// research.md R-18; tasks.md T079): `ocelle-test-overflow-block`, a Lit element built on `OverflowRegion` with the
// block-axis option, as `ocelle-data-table` with `sticky-header` uses it, and nothing of the data table. It ships in no
// package. Its light-DOM children are slotted into the track in tree order: an optional block standing in for a
// caption (`.cap`, two lines tall by a line break, a link on its second line; re-analysis A1 (c), Q-S2-1 (a)), the pinned
// first box (`.pin`, the page's rules pin it as block 1 pins the `<thead>`: `position: sticky` at
// `inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, spike-2 Q-2 (a)), then the
// rows of focusable links. The fixture-only boolean attribute `block-axis` switches the option at run time; the host
// and `.region-frame` are a column flex, so a block bound the page sets on the host reaches the box (as the data
// table's `sticky-header` makes them). The template carries the option's extra `.region-edge block-end`. The
// fixture-only attribute `current="none"` hands the module no box, so it lets go of the rendered one, which stays in the
// shadow root; removing it hands the same box back (T025, the module's release). `ocelle-test-overflow-plain` is the
// same host built without the option (no `blockAxis`, no `blockStartBox`), as 009's hosts are (T025).
import { LitElement, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { OverflowRegion, overflowRegionStyles } from "../../src/overflow-region.ts";

export class OcelleTestOverflowBlock extends LitElement {
  static override properties = {
    label: { type: String },
    blockAxis: { type: Boolean, reflect: true, attribute: "block-axis" },
    current: { type: String },
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
  /** Fixture-only: `none` hands the module no box; unset, the rendered box. */
  declare current: string | undefined;

  readonly #region = this.region();

  /** The module this host is built on: with the block-axis option, as the data table's `sticky-header` uses it. */
  protected region(): OverflowRegion {
    return new OverflowRegion(this, {
      box: () => (this.current === "none" ? null : this.renderRoot.querySelector<HTMLElement>(".region-box")),
      blockAxis: () => this.blockAxis === true,
      blockStartBox: () => this.querySelector(":scope > .pin"),
    });
  }

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

/** The same host built without the block-axis option, as 009's hosts are: the module's default for an absent option. */
export class OcelleTestOverflowPlain extends OcelleTestOverflowBlock {
  protected override region(): OverflowRegion {
    return new OverflowRegion(this, { box: () => this.renderRoot.querySelector<HTMLElement>(".region-box") });
  }
}

if (customElements.get("ocelle-test-overflow-block") === undefined) customElements.define("ocelle-test-overflow-block", OcelleTestOverflowBlock);
if (customElements.get("ocelle-test-overflow-plain") === undefined) customElements.define("ocelle-test-overflow-plain", OcelleTestOverflowPlain);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-test-overflow-block": OcelleTestOverflowBlock;
    "ocelle-test-overflow-plain": OcelleTestOverflowPlain;
  }
}
