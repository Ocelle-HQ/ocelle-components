// `ocelle-button` (012 spec US1, FR-001 to FR-003, FR-006, FR-009 to FR-014, FR-018 to FR-020, FR-022, FR-023;
// research.md R-01, R-05, R-06, R-08, R-09, R-12; data-model.md § `ocelle-button`; plan decisions 18, 20, 23 and 26), in
// button mode: one native `<button type="button">` with the part `control` in an open shadow root attached with
// `delegatesFocus`, laid out by mission 005's slot convention (an `icon` slot before the label). The host is
// `display: inline-grid` and the inner control its single stretched grid item, so a host stretched by a flex row or a
// grid has no area outside the control; the inner control is `inline-flex`, so a page rule that makes the host a block
// or a flex container leaves it its own size, and the host guard (src/control.ts) stops any click outside it. Each
// click that passes the inner control while available dispatches `ocelle-button-activate` from the host, from a
// listener on the inner control, so before the click reaches any bubble-phase listener on the host or its ancestors;
// a cancelled activate event cancels the click (`preventDefault()`), which a button still delivers. The inner control
// is always `type="button"`, in a shadow root, so it never submits or resets a form.
//
// Colours follow research.md R-08's tables (items 3, 4, 4a, 5, 8): the variant, the `ground` the host states and the
// state (hover, active, disabled), each rule inside `@media not (forced-colors: active)` and written as
// `:host(:where(...)) .control:where(...)`, so every colour rule has the same specificity and the later rule wins:
// variants, then grounds, then hover and active, then flush, then disabled. Sizes follow R-09: `default` at least
// `--ocelle-target-min` in both dimensions, `compact` at least `--ocelle-space-6` (24 px) with the compact text scale;
// `flush` drops the inline padding, the border and the fill and puts the content at the inline start.
// Importing this module defines `ocelle-button` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { controlStyles, guardHost } from "./control.ts";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";

/**
 * A native button in the Ocelle look: three variants, two sizes, a flush look, the ground it sits on, a label, a
 * disabled state and an icon slot.
 *
 * @tagname ocelle-button
 * @slot - The label.
 * @slot icon - One icon before the label (the slot convention): `--ocelle-icon-size` square, decorative.
 * @csspart control - The inner `<button>`.
 * @fires {CustomEvent<Record<string, never>>} ocelle-button-activate - Dispatched from the element on each activation
 * that delivers a `click` (a pointer click, Enter or Space, `click()`), before the `click` reaches any bubble-phase
 * listener on the element or its ancestors; bubbles, composed and cancelable, `detail` `{}`. Calling
 * `preventDefault()` on it cancels the click's default action (the `click` is still delivered). A disabled button
 * dispatches neither.
 */
export class OcelleButton extends LitElement {
  /** @internal The open shadow root delegates focus to the inner control (research.md R-01). */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    flush: { type: Boolean, reflect: true },
    ground: { type: String, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = [
    css`
      :host {
        display: inline-grid;
      }

      :host([hidden]) {
        display: none;
      }

      .control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-block-size: var(--ocelle-target-min);
        min-inline-size: var(--ocelle-target-min);
        margin: 0;
        padding-block: 0;
        padding-inline: var(--ocelle-space-4);
        border-style: solid;
        border-width: var(--ocelle-border-width);
        border-radius: var(--ocelle-radius-2);
        font: inherit;
        font-size: var(--ocelle-font-size-md);
        line-height: var(--ocelle-line-height-normal);
        cursor: pointer;
      }

      .control:disabled {
        cursor: default;
      }

      .label {
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }

      :host([size="compact"]) .control {
        min-block-size: var(--ocelle-space-6);
        min-inline-size: var(--ocelle-space-6);
        padding-inline: var(--ocelle-space-2);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-compact);
      }

      :host([flush]) .control {
        justify-content: flex-start;
        padding-inline: 0;
        border-style: none;
      }

      @media not (forced-colors: active) {
        :host .control {
          background-color: var(--ocelle-color-sheet);
          border-color: var(--ocelle-color-control-border);
          color: var(--ocelle-color-ink);
        }

        :host(:where([variant="quiet"])) .control {
          background-color: transparent;
        }

        :host(:where([variant="primary"])) .control {
          background-color: var(--ocelle-color-accent);
          border-color: var(--ocelle-color-accent-strong);
          color: var(--ocelle-color-on-accent);
        }

        :host(:where([ground="accent-low"], [ground="inset"], [ground="hover-bg"], [ground="state"])) .control {
          border-color: var(--ocelle-color-accent-strong);
        }

        :host(:where([ground="chrome"]:not([variant="primary"]))) .control {
          background-color: transparent;
          border-color: var(--ocelle-color-chrome-muted);
          color: var(--ocelle-color-chrome-ink);
        }

        :host .control:where(:hover) {
          background-color: var(--ocelle-color-hover-bg);
          border-color: var(--ocelle-color-hover-border);
        }

        :host .control:where(:active) {
          background-color: var(--ocelle-color-active-bg);
          border-color: var(--ocelle-color-hover-border);
        }

        :host(:where([variant="primary"])) .control:where(:hover) {
          background-color: var(--ocelle-color-accent-hover);
        }

        :host(:where([variant="primary"])) .control:where(:active) {
          background-color: var(--ocelle-color-accent);
        }

        :host(:where([ground="chrome"])) .control:where(:hover, :active) {
          border-color: var(--ocelle-color-chrome-ink);
        }

        :host(:where([ground="chrome"]:not([variant="primary"]))) .control:where(:hover) {
          background-color: var(--ocelle-color-chrome-hover);
        }

        :host(:where([ground="chrome"]:not([variant="primary"]))) .control:where(:active) {
          background-color: var(--ocelle-color-chrome-active);
        }

        :host(:where([flush])) .control {
          background-color: transparent;
          color: var(--ocelle-color-ink);
        }

        :host(:where([flush][ground="chrome"])) .control {
          color: var(--ocelle-color-chrome-ink);
        }

        :host(:where([flush])) .control:where(:hover) {
          background-color: var(--ocelle-color-hover-bg);
        }

        :host(:where([flush])) .control:where(:active) {
          background-color: var(--ocelle-color-active-bg);
        }

        :host(:where([flush][ground="chrome"])) .control:where(:hover) {
          background-color: var(--ocelle-color-chrome-hover);
        }

        :host(:where([flush][ground="chrome"])) .control:where(:active) {
          background-color: var(--ocelle-color-chrome-active);
        }

        :host(:where([disabled])) .control {
          background-color: var(--ocelle-color-disabled-bg);
          border-color: var(--ocelle-color-disabled-ink);
          color: var(--ocelle-color-disabled-ink);
        }

        :host(:where([disabled][variant="quiet"], [disabled][flush], [disabled][ground="chrome"]:not([variant="primary"]))) .control {
          background-color: transparent;
        }
      }

      @media (forced-colors: active) {
        :host([flush]) .control:where(:hover, :active) {
          outline-style: dashed;
          outline-width: var(--ocelle-focus-width);
          outline-color: Highlight;
          outline-offset: var(--ocelle-focus-offset);
        }

        :host([flush]) .control:focus-visible {
          outline-style: solid;
        }

        :host([flush]) .control:disabled {
          outline-style: none;
        }
      }
    `,
    controlStyles,
    iconSlotStyles,
  ];

  /**
   * The look: `primary` (filled), `secondary` (bordered on a surface) or `quiet` (bordered, no fill); absent or any
   * other value renders `secondary`. Reflected.
   *
   * @default undefined
   */
  declare variant: "primary" | "secondary" | "quiet" | undefined;

  /**
   * `default` (at least `--ocelle-target-min` in both dimensions) or `compact` (the compact text scale, at least 24 px
   * in both dimensions); absent or any other value renders `default`. Reflected.
   *
   * @default undefined
   */
  declare size: "default" | "compact" | undefined;

  /**
   * No inline padding, no border and no fill: a text-like control whose content starts at its inline start, with only
   * its hover surface and focus ring. Reflected.
   *
   * @default false
   */
  declare flush: boolean;

  /**
   * The ground the button sits on: `accent-low`, `inset`, `hover-bg` or `state` (a state ground) give a bordered
   * variant an `--ocelle-color-accent-strong` border; `chrome` gives the chrome look for the chrome grounds; absent or
   * any other value means the other main grounds. Reflected.
   *
   * @default undefined
   */
  declare ground: "accent-low" | "inset" | "hover-bg" | "state" | "chrome" | undefined;

  /**
   * The accessible name of the button, trimmed; empty or whitespace-only counts as none, and the name is then the
   * content. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Disabled: out of the tab order, reported disabled and not activated (no `click`, no `ocelle-button-activate`).
   * Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  constructor() {
    super();
    this.flush = false;
    this.disabled = false;
    guardHost(this, () => this.#control(), () => !this.disabled);
  }

  /** The inner `<button>`, once rendered. */
  #control(): HTMLButtonElement | null {
    return this.renderRoot.querySelector<HTMLButtonElement>(".control");
  }

  /**
   * Clicks the inner control, so the click passes through it and is guarded like any other: a disabled button ignores
   * it.
   */
  override click(): void {
    this.#control()?.click();
  }

  /** Dispatches `ocelle-button-activate` for a click on the available inner control; a cancelled one cancels the click. */
  #activate(event: MouseEvent): void {
    if (this.disabled) return;
    const proceed = this.dispatchEvent(new CustomEvent("ocelle-button-activate", { bubbles: true, composed: true, cancelable: true, detail: {} }));
    if (!proceed) event.preventDefault();
  }

  protected override render(): unknown {
    const label = this.label?.trim() ?? "";
    return html`<button part="control" class="control" type="button" ?disabled=${this.disabled} aria-label=${label === "" ? nothing : label} @click=${this.#activate}><span class="icon-row"><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span></span></button>`;
  }
}

define("ocelle-button", OcelleButton);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-button": OcelleButton;
  }
}
