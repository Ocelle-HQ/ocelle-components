// `ocelle-scroller` (009 FR-001 to FR-011, FR-030; contracts/elements.md § `ocelle-scroller`; research.md R-01 to
// R-07): a horizontal strip of slotted content in one box that scrolls in the inline direction only, a tab stop and a
// named `group` only while it overflows, with the fades, arrow keys, focus clearance and focus handover of the
// overflow-region module, which carries all of that behaviour (src/overflow-region.ts). The element renders the
// module's structure, adds the module's stylesheet to its own and passes its `label`; a host `aria-label` is observed,
// so the module reads it, and a blank one counts as absent. Importing this module defines `ocelle-scroller` and no
// other element.
import { LitElement, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import { OverflowRegion, overflowRegionStyles } from "./overflow-region.ts";

/**
 * A horizontal strip that scrolls in the inline direction and is a tab stop and a named group only while it overflows.
 *
 * @tagname ocelle-scroller
 * @slot - The strip's content.
 */
export class OcelleScroller extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `aria-label` is observed, not a property: a non-blank host `aria-label` names the group, so its change updates the element. */
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
    `,
    overflowRegionStyles,
  ];

  /**
   * The name of the strip's group while it overflows, trimmed; empty or whitespace-only counts as none, and without one
   * an overflowing strip is a tab stop with no role. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  readonly #region = new OverflowRegion(this, { box: () => this.renderRoot.querySelector<HTMLElement>(".region-box") });

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

define("ocelle-scroller", OcelleScroller);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-scroller": OcelleScroller;
  }
}
