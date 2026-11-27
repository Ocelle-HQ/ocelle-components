// `ocelle-metric` (018 spec US2, FR-020 to FR-024, FR-042; research.md R-05; data-model.md § `ocelle-metric`): a label
// and its value, exposed as one term and its definition. The shadow root is a `dl` holding one pair, the `dt` (part
// `label`) and the `dd` (part `value`), in that order in both layouts, so the label is read first. The label is drawn
// twice in the `dt` (operator decision on PLAN-A11Y-SECURITY-1-001, (a)): an `aria-hidden` eyebrow span set in 011's
// eyebrow tokens, used as merged (FR-042), and upper-cased by style, which Chromium would expose upper-cased; and a copy
// as written, hidden visually by token-only CSS, which names the term. Find in page therefore matches the label twice,
// a recorded limitation (R-05). Both strings are bound as Lit text, never as markup (FR-021). The value is in
// `--ocelle-figures` and the metric sets `--ocelle-font-sans` itself, so it is Schibsted Grotesk without base.css too
// (FR-023). `stack`, the default, is block flow; `row` makes the pair a wrapping flex row (FR-024). `overflow-wrap:
// break-word` breaks a word only where it would overflow, so a flex row around the metric does not shrink it below its
// longest word (US2-7) while a long value in a block still breaks inside it; in `row` the `dt` and `dd` take
// `min-inline-size: 0` as flex items so a long value shrinks to the pair and breaks. An empty value keeps one line's
// height (`min-block-size: 1lh`); in `row` an empty, zero-width inline block before the value gives an empty `dd` a
// line box, so its baseline is that line's and the pair keeps the height it has with a one-line value (an empty flex
// item would otherwise align its bottom edge with the label's baseline). `layout` is an attribute-backed accessor (R-02's pattern): an unknown value stays in
// the attribute as written and the property reads `"stack"`. Importing this module defines `ocelle-metric` and no other
// element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";

/**
 * A label and its value, shown as an eyebrow label above (or, in a row, before) a value in tabular figures, and exposed
 * as one term and its definition.
 *
 * @tagname ocelle-metric
 * @attr {"stack" | "row"} layout - How the label and the value sit: `stack`, the default, the label above the value; `row`, both on one line, label first, wrapping onto two lines when there is not room. Any other value is `stack` and stays in the attribute as written.
 * @csspart label - The term: the label, shown uppercase in the eyebrow style and read as written.
 * @csspart value - The definition: the value, in tabular figures, shown as given.
 */
export class OcelleMetric extends LitElement {
  static override properties = {
    label: { type: String, reflect: true },
    displayValue: { type: String, reflect: true, attribute: "display-value" },
  };

  /** `layout` is observed, not a Lit property: its accessor parses the attribute, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "layout"];
  }

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .metric {
      margin: 0;
      font-family: var(--ocelle-font-sans);
    }

    dt,
    dd {
      margin: 0;
      overflow-wrap: break-word;
    }

    dt {
      position: relative;
      font-size: var(--ocelle-font-size-eyebrow);
      font-weight: var(--ocelle-font-weight-eyebrow);
      letter-spacing: var(--ocelle-tracking-eyebrow);
    }

    .eyebrow {
      text-transform: uppercase;
    }

    .written {
      position: absolute;
      inline-size: 0;
      block-size: 0;
      overflow: hidden;
      white-space: nowrap;
    }

    dd {
      min-block-size: 1lh;
      font-variant-numeric: var(--ocelle-figures);
    }

    .layout-row .pair {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: var(--ocelle-space-2);
    }

    .layout-row .pair > * {
      min-inline-size: 0;
    }

    .layout-row dd::before {
      content: "";
      display: inline-block;
    }

    @media not (forced-colors: active) {
      .eyebrow {
        color: var(--ocelle-color-eyebrow);
      }

      dd {
        color: var(--ocelle-color-ink);
      }
    }
  `;

  /**
   * The label, shown in the eyebrow style and uppercase, and read by assistive technology as written, as the term's
   * name. Text only, never parsed as markup. Reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The value, a string the host has formatted: shown as given in tabular figures, as the term's definition, with no
   * number formatting and no unit added. Text only, never parsed as markup; empty or unset shows no placeholder.
   * Reflected as `display-value`.
   *
   * @default undefined
   */
  declare displayValue: string | undefined;

  /**
   * How the label and the value sit: the `layout` attribute when it is `row`, else `stack`. Setting it writes the
   * attribute as given.
   *
   * @default "stack"
   */
  get layout(): "stack" | "row" {
    return this.getAttribute("layout") === "row" ? "row" : "stack";
  }

  set layout(value: string) {
    this.setAttribute("layout", value);
  }

  /** Every observed attribute requests an update, as `ocelle-status-indicator` does; `layout`, not a Lit property, needs it. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  protected override render(): unknown {
    const label = this.label ?? "";
    return html`<dl class="metric layout-${this.layout}"><div class="pair"><dt part="label"><span class="eyebrow" aria-hidden="true">${label}</span><span class="written">${label}</span></dt><dd part="value">${this.displayValue ?? ""}</dd></div></dl>`;
  }
}

define("ocelle-metric", OcelleMetric);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-metric": OcelleMetric;
  }
}
