// `ocelle-tab` (014 FR-009, FR-019, FR-020, FR-025, Edge Cases; research.md R-01, R-03, R-06, R-10, R-15;
// data-model.md § Child entry): one tab of an `ocelle-tabs`, in the page's own tree beside its siblings and its panel.
// Inside a tabs its role is `tab` (internals, kept under the internals symbol axe reads); outside one it has none and
// renders its content as plain content. `aria-selected`, `aria-disabled`, `aria-controls`, `tabindex` and, when it has
// none, an `id` are written on the host by the tabs; the paint keys on `aria-selected`, so the paint and the exposed
// state cannot disagree. `value` is reflected as written; with no value or a blank one the tab's value is its index
// among its parent's tabs (FR-009), which is not written to the attribute. Styles: the minimum block size is the target
// size; the label wraps inside the tab, which grows; the selected bar is a `::before` on the block-end edge, drawn as
// that pseudo-element's block-end border in `--ocelle-color-accent-strong`, `Highlight` in forced colours (a border,
// not a background: axe-core 4.14.0 counts an absolutely positioned pseudo-element with a background as covering the
// label, and a short label's text then gets a serious `color-contrast` incomplete, reviews/phase-3/notes.md); the focus ring is a raised `::after` (z-index 2, the
// host not raised), so a hovered neighbour's fill never covers it; the `icon` slot follows the slot convention. No
// transition or animation. Importing this module defines `ocelle-tab` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import { attachInternalsTo } from "./internals.ts";
import { childValue } from "./selection.ts";

/**
 * A tab of an `ocelle-tabs`: its content is its label, with an optional leading icon; it pairs with the panel at the
 * same place among the tabs' panels.
 *
 * @tagname ocelle-tab
 * @slot - The tab's label.
 * @slot icon - A leading icon, by the slot convention; it adds nothing to the tab's name.
 */
export class OcelleTab extends LitElement {
  static override properties = {
    disabled: { type: Boolean, reflect: true },
    // `value` is the accessor below, which writes the attribute itself (as on `ocelle-option`): `useDefault` keeps Lit
    // from reflecting the index default at the first update (FR-009). `reflect` and `noAccessor` describe the accessor
    // for the manifest.
    // Stryker disable next-line BooleanLiteral,ObjectLiteral: equivalent, the accessor's setter writes the attribute and the attribute's changes are not passed to Lit; without `reflect` Lit writes no initial value either
    value: { type: String, reflect: true, noAccessor: true, useDefault: true },
  };

  static override styles = [
    iconSlotStyles,
    css`
      :host {
        display: flex;
        position: relative;
        flex: 0 1 auto;
        align-items: center;
        box-sizing: border-box;
        min-inline-size: 0;
        min-block-size: var(--ocelle-target-min);
        padding-block: var(--ocelle-space-2);
        padding-inline: var(--ocelle-space-3);
        color: var(--ocelle-color-ink);
        overflow-wrap: anywhere;
        cursor: default;
        outline: none;
      }

      :host([hidden]) {
        display: none;
      }

      .icon-row {
        min-inline-size: 0;
      }

      .label {
        min-inline-size: 0;
      }

      slot:not([name])::slotted(*) {
        inline-size: auto !important;
        block-size: auto !important;
        flex: initial !important;
      }

      :host([aria-selected="true"])::before {
        content: "";
        position: absolute;
        inset-inline: 0;
        inset-block-end: 0;
        border-block-end: var(--ocelle-bar-width) solid;
      }

      :host(:focus-visible)::after {
        content: "";
        position: absolute;
        inset: calc(-1 * (var(--ocelle-focus-width) + var(--ocelle-focus-offset)));
        border: var(--ocelle-focus-width) solid;
        pointer-events: none;
        z-index: 2;
      }

      @media not (forced-colors: active) {
        :host(:hover:not([aria-disabled="true"])) {
          background: var(--ocelle-color-hover-bg);
        }

        :host([aria-disabled="true"]) {
          color: var(--ocelle-color-disabled-ink);
        }

        :host([aria-selected="true"])::before {
          border-block-end-color: var(--ocelle-color-accent-strong);
        }

        :host(:focus-visible)::after {
          border-color: var(--ocelle-color-focus);
        }
      }

      @media (forced-colors: active) {
        :host([aria-selected="true"])::before {
          forced-color-adjust: none;
          border-block-end-color: Highlight;
        }

        :host(:focus-visible)::after {
          forced-color-adjust: none;
          border-color: Highlight;
        }
      }
    `,
  ];

  /**
   * Whether the tab is disabled: it cannot be selected, the keys skip it, and it stays focusable, so a focused tab that
   * becomes disabled keeps focus until the selection moves. Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  readonly #internals = attachInternalsTo(this);

  constructor() {
    super();
    this.disabled = false;
  }

  /**
   * The tab's value, reported by the tabs' `value` and events: the `value` attribute as written (not trimmed), or, when
   * it is missing or blank, the tab's index among its parent's tabs, as a string, which is not written to the
   * attribute. Reflected.
   *
   * @default the tab's index, as a string
   */
  get value(): string {
    const siblings = [...(this.parentElement?.children ?? [])].filter((child) => child.localName === this.localName);
    return childValue(this.getAttribute("value"), siblings.indexOf(this));
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  /** The `value` attribute is the tab's input, read by `value` and by the tabs' observer; it renders nothing. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    // Stryker disable next-line ConditionalExpression,StringLiteral: equivalent, Lit would set the `value` accessor from the attribute, whose setter writes the same attribute value back
    if (name !== "value") super.attributeChangedCallback(name, old, value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#internals.role = this.parentElement?.localName === "ocelle-tabs" ? "tab" : null;
  }

  protected override render(): unknown {
    return html`<span class="icon-row"><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span></span>`;
  }
}

define("ocelle-tab", OcelleTab);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tab": OcelleTab;
  }
}
