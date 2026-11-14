// `ocelle-option` (014 FR-009, FR-012, FR-018, Edge Cases; research.md R-01, R-03, R-06, R-10, R-15; data-model.md
// § Child entry): one option of an `ocelle-listbox`, in the page's own tree beside its siblings. Inside a listbox its
// role is `option` (internals, kept under the internals symbol axe reads); outside one it has none and renders its
// content as plain content. `aria-selected`, `aria-disabled` and `tabindex` are written on the host by the listbox; the
// paint keys on them, so the paint and the exposed state cannot disagree. `value` is reflected as written; with no value
// or a blank one the option's value is its index among its parent's options (FR-009), which is not written to the
// attribute. Styles: the minimum block size is the target size; the label wraps inside the option, which grows; the
// selected bar is a `::before` on the inline-start edge in `--ocelle-color-accent-strong`, `Highlight` in forced
// colours; the focus ring is a raised `::after` (z-index 2, the host not raised), so a hovered neighbour's fill never
// covers it; the `icon` slot follows the slot convention. No transition or animation. Importing this module defines
// `ocelle-option` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import { attachInternalsTo } from "./internals.ts";
import { childValue } from "./selection.ts";

/**
 * An option of an `ocelle-listbox`: its content is its label, with an optional leading icon.
 *
 * @tagname ocelle-option
 * @slot - The option's label.
 * @slot icon - A leading icon, by the slot convention; it adds nothing to the option's name.
 */
export class OcelleOption extends LitElement {
  static override properties = {
    disabled: { type: Boolean, reflect: true },
    // `value` is the accessor below, which writes the attribute itself. Lit wraps an accessor of the class and, at the
    // first update, reflects its initial value; `useDefault` records that value as the default instead, so the index
    // default is never written to the attribute (FR-009).
    value: { type: String, reflect: true, noAccessor: true, useDefault: true },
  };

  static override styles = [
    iconSlotStyles,
    css`
      :host {
        display: flex;
        position: relative;
        align-items: center;
        box-sizing: border-box;
        min-block-size: var(--ocelle-target-min);
        padding-block: var(--ocelle-space-2);
        padding-inline: var(--ocelle-space-3);
        color: var(--ocelle-color-ink);
        overflow-wrap: anywhere;
        cursor: default;
        outline: none;
        scroll-margin: calc(var(--ocelle-focus-width) + var(--ocelle-focus-offset));
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
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: var(--ocelle-bar-width);
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
          background: var(--ocelle-color-accent-strong);
        }

        :host(:focus-visible)::after {
          border-color: var(--ocelle-color-focus);
        }
      }

      @media (forced-colors: active) {
        :host([aria-selected="true"])::before {
          forced-color-adjust: none;
          background: Highlight;
        }

        :host(:focus-visible)::after {
          forced-color-adjust: none;
          border-color: Highlight;
        }
      }
    `,
  ];

  /**
   * Whether the option is disabled: it cannot be selected, the keys and the tab stop skip it, and it stays focusable,
   * so a focused option that becomes disabled keeps focus. Reflected.
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
   * The option's value, reported by the listbox's `value` and events: the `value` attribute as written (not trimmed),
   * or, when it is missing or blank, the option's index among its parent's options, as a string, which is not written
   * to the attribute. Reflected.
   *
   * @default the option's index, as a string
   */
  get value(): string {
    const siblings = [...(this.parentElement?.children ?? [])].filter((child) => child.localName === this.localName);
    return childValue(this.getAttribute("value"), siblings.indexOf(this));
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  /** The `value` attribute is the option's input, read by `value` and by the listbox's observer; it renders nothing. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name !== "value") super.attributeChangedCallback(name, old, value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#internals.role = this.parentElement?.localName === "ocelle-listbox" ? "option" : null;
  }

  protected override render(): unknown {
    return html`<span class="icon-row"><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span></span>`;
  }
}

define("ocelle-option", OcelleOption);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-option": OcelleOption;
  }
}
