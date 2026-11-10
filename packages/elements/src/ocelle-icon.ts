// `ocelle-icon` (005 FR-011 to FR-016, FR-034; research.md R-04, R-13; data-model.md § `ocelle-icon`): one icon of the
// set drawn inline in its shadow root, sized by the `--ocelle-icon-size` token, painted in `currentColor`, hidden from
// the accessibility tree unless a `label` or a host `aria-label` names it. An unknown, empty or missing name draws
// nothing and keeps the box. Importing this module defines `ocelle-icon` and no other element.
import { LitElement, css, html, nothing, svg } from "lit";
import type { SVGTemplateResult } from "lit";
import { define } from "./define.ts";
import { iconOf } from "./icons.ts";
import type { IconName, Shape } from "./icons.ts";
import { accessibleName, expose } from "./naming.ts";

export type { IconName } from "./icons.ts";

/** One shape as SVG; the stroke style is the `svg`'s, inherited. */
function shape(part: Shape): SVGTemplateResult {
  return svg`<line x1=${part.x1} y1=${part.y1} x2=${part.x2} y2=${part.y2}></line>`;
}

/**
 * An icon of the set, inline SVG in `currentColor` at the `--ocelle-icon-size` token, decorative unless labelled.
 *
 * @tagname ocelle-icon
 */
export class OcelleIcon extends LitElement {
  static override properties = {
    name: { type: String, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `aria-label` is observed, not a property: a host `aria-label` names the icon (FR-034), so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: inline-block;
      inline-size: var(--ocelle-icon-size);
      block-size: var(--ocelle-icon-size);
      vertical-align: middle;
      flex: none;
    }

    :host([hidden]) {
      display: none;
    }

    svg {
      display: block;
      inline-size: 100%;
      block-size: 100%;
    }
  `;

  /**
   * The icon's name, one of the set; any other value draws nothing and keeps the box. Reflected.
   *
   * @default undefined
   */
  declare name: IconName | undefined;

  /**
   * The accessible name of a standalone meaningful icon, trimmed; empty or whitespace-only counts as none, and
   * without one the icon is hidden from the accessibility tree. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  readonly #internals = this.attachInternals();

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  protected override updated(): void {
    expose(this.#internals, accessibleName(this.label, this.getAttribute("aria-label")), iconOf(this.name) !== undefined);
  }

  protected override render(): unknown {
    const icon = iconOf(this.name);
    if (icon === undefined) return nothing;
    return html`<svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >${icon.shapes.map(shape)}</svg>`;
  }
}

define("ocelle-icon", OcelleIcon);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-icon": OcelleIcon;
  }
}
