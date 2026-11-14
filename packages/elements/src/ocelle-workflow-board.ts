// `ocelle-workflow-board` (009 FR-012 to FR-016, FR-030; contracts/elements.md § `ocelle-workflow-board`;
// contracts/overflow-region.md; research.md R-04, R-08, R-10): a row of lanes in one box that scrolls in the inline
// direction only, a tab stop and a named `region` landmark only while its lanes overflow it, with the fades, arrow
// keys, focus clearance and focus handover of the overflow-region module, which carries all of that behaviour
// (src/overflow-region.ts, `role: "region"`). The element renders the module's structure and lays its track out as a
// flex row: every slotted child, a lane or not, takes `--ocelle-lane-min-width` as its minimum and flex basis and an
// equal share of any extra space, and has `contain: inline-size`, so its content never feeds the track's intrinsic
// size (R-08). The block ring room is the module's alone. The board paints no ground (R-10). Importing this module
// defines `ocelle-workflow-board` and no other element: not the lane, which a host imports too, or the root.
import { LitElement, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import { OverflowRegion, overflowRegionStyles } from "./overflow-region.ts";

/**
 * A row of lanes that scrolls inside itself, and is a tab stop and a named region, only while the lanes' minimum
 * widths exceed its size.
 *
 * @tagname ocelle-workflow-board
 * @slot - The lanes; any child is laid out as a lane.
 */
export class OcelleWorkflowBoard extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `aria-label` is observed, not a property: a non-blank host `aria-label` names the region, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = [
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      .region-track {
        display: flex;
        gap: var(--ocelle-space-3);
        align-items: stretch;
        min-inline-size: 100%;
      }

      ::slotted(*) {
        box-sizing: border-box;
        flex: 1 1 var(--ocelle-lane-min-width);
        min-inline-size: var(--ocelle-lane-min-width);
        contain: inline-size;
      }
    `,
    overflowRegionStyles,
  ];

  /**
   * The name of the board's region while it overflows, trimmed; empty or whitespace-only counts as none, and without
   * one an overflowing board is a tab stop with no role. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  readonly #region = new OverflowRegion(this, { box: () => this.renderRoot.querySelector<HTMLElement>(".region-box"), role: "region" });

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  protected override render(): unknown {
    return html`<div class="region-frame"><div class="region-box" data-fade=${ifDefined(this.#region.fadeAttribute)}><div class="region-track"><slot></slot></div></div><div class="region-ring" aria-hidden="true"></div><div class="region-edge start" aria-hidden="true"></div><div class="region-edge end" aria-hidden="true"></div></div>`;
  }

  protected override updated(): void {
    this.#region.setLabel(this.label);
  }
}

define("ocelle-workflow-board", OcelleWorkflowBoard);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-workflow-board": OcelleWorkflowBoard;
  }
}
