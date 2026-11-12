// `ocelle-brand-mark` (005 FR-024 to FR-028, FR-034; research.md R-09, R-13; data-model.md § `ocelle-brand-mark`): the
// Ocelle rosette, a broken ring around an ochre spot, drawn inline in its shadow root from tokens only. Variants: the
// default for the main grounds (ring `--ocelle-color-ink`, spot `--ocelle-color-accent`), `ground="chrome"` for the
// chrome grounds (ring `--ocelle-color-chrome-ink`) and `tone="mono"` (ring and spot `currentColor`), which wins over
// `ground`; any other value gives the default. The variant rules sit inside `@media not (forced-colors: active)`, so in
// forced colours only the `currentColor` rules apply and no variant selector outranks them. The box is
// `--ocelle-icon-size` high and as wide as high (`inline-size: max-content` with `aspect-ratio: 1`, so a column flex
// container does not stretch it). Hidden from the accessibility tree unless a `label` or a host `aria-label` names it.
// Importing this module defines `ocelle-brand-mark` and no other element.
import { LitElement, css } from "lit";
import { define } from "./define.ts";
import { accessibleName, expose } from "./naming.ts";
import { rosette } from "./rosette.ts";

/**
 * The Ocelle rosette, inline SVG painted from tokens at the `--ocelle-icon-size` token, decorative unless labelled.
 *
 * @tagname ocelle-brand-mark
 */
export class OcelleBrandMark extends LitElement {
  static override properties = {
    ground: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `aria-label` is observed, not a property: a host `aria-label` names the mark (FR-034), so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: inline-block;
      block-size: var(--ocelle-icon-size);
      inline-size: max-content;
      aspect-ratio: 1;
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

    @media not (forced-colors: active) {
      .ring {
        stroke: var(--ocelle-color-ink);
      }

      .spot {
        fill: var(--ocelle-color-accent);
      }

      :host([ground="chrome"]) .ring {
        stroke: var(--ocelle-color-chrome-ink);
      }

      :host([tone="mono"]) .ring {
        stroke: currentColor;
      }

      :host([tone="mono"]) .spot {
        fill: currentColor;
      }
    }

    @media (forced-colors: active) {
      .ring {
        stroke: currentColor;
      }

      .spot {
        fill: currentColor;
      }
    }
  `;

  /**
   * The ground the mark sits on: `chrome` for the dark chrome grounds (`color-chrome`, `color-chrome-hover`); absent or
   * any other value for the main grounds. Reflected.
   *
   * @default undefined
   */
  declare ground: "chrome" | undefined;

  /**
   * `mono` paints ring and spot in `currentColor`, the colour of the surrounding text, and wins over `ground`; absent
   * or any other value paints the variant of `ground`. Reflected.
   *
   * @default undefined
   */
  declare tone: "mono" | undefined;

  /**
   * The accessible name of the mark, trimmed; empty or whitespace-only counts as none, and without one the mark is
   * hidden from the accessibility tree. Not reflected.
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
    expose(this.#internals, accessibleName(this.label, this.getAttribute("aria-label")), true);
  }

  protected override render(): unknown {
    return rosette;
  }
}

define("ocelle-brand-mark", OcelleBrandMark);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-brand-mark": OcelleBrandMark;
  }
}
