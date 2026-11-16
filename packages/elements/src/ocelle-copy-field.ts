// `ocelle-copy-field` (014 FR-031 to FR-044, Edge Cases; research.md R-07, R-15, R-16; data-model.md § Copy field
// state): a command or identifier the user may copy, with a Copy control flush at its inline end. The field never
// touches the clipboard (constitution I): activating the Copy control asks the host to copy, with
// `ocelle-copy-field-request`, and the host reports the outcome in its own words by setting `status`.
// - The host is a group (internals, kept under the internals symbol axe reads), named by a host `aria-label` and
//   unnamed without one. Its shadow root holds the bordered field (the text, `part="value"`, on the `inset` well, then
//   the Copy control, a native `<button part="copy-control">` showing `ocelle-icon name="copy"`, decorative) and, after
//   it, the polite live region (`role="status"`), present and empty from first render. No slot.
// - The live region's text is one `Text` node the element owns and writes imperatively and synchronously, outside the
//   Lit template, only when the text shown changes (R-07): a repeated set of the same `status` mutates nothing, and a
//   clear followed by the host's set of the same text is a new change of the region.
// - An activation (click, Enter or Space on the control, which all give the button's `click`) captures `value`, clears
//   `status` at once and dispatches the request after the next rendering update (an animation frame, then a task), so
//   the emptied region has reached the accessibility tree before the host's new text (operator decision
//   PLAN-TESTABILITY-1-011 (a); reviews/phase-5/spike.md). Each activation schedules its own request; a field
//   disconnected before the dispatch dispatches nothing. The request is therefore outside the click's task.
// - A `value` change after first render clears `status` too (FR-042); a `status` attribute the host wrote is not
//   reflected and is read again only when it changes. With an empty `value` the control is disabled.
// Styles: the field's outer border is `--ocelle-color-control-border` against the page ground; the one line between the
// well and the control is the control's inline-start border, `--ocelle-border-width` in `--ocelle-color-accent-strong`
// (#5 rule 1 extended: a control on `inset` is bordered with `accent-strong`); the control is filled
// `--ocelle-color-sheet`, at least `--ocelle-target-min` in both dimensions, with the token focus ring as an outline.
// The text wraps anywhere, keeps its whitespace runs, is drawn in the sans with tabular figures and stays selectable.
// Forced colours: the boundaries are `ButtonBorder`, the icon `ButtonText`, the ring `Highlight`. No transition or
// animation. Importing this module defines `ocelle-copy-field` and `ocelle-icon`.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import { attachInternalsTo } from "./internals.ts";
import "./ocelle-icon.ts";

/**
 * A command or identifier with a flush Copy control that asks the host to copy it; the host reports the outcome in
 * `status`, which the field shows in a polite live region.
 *
 * @tagname ocelle-copy-field
 * @csspart value - The text, on the inset well. Public surface: it stays when the Copy control becomes `ocelle-button`.
 * @csspart copy-control - The Copy control. It guarantees its box (its position, its size and the rules a host sets on it), its accessible name and the events its activation leads to, not which element carries it (a native button today, `ocelle-button` later).
 * @fires {CustomEvent<{ text: string }>} ocelle-copy-field-request - The user activated the Copy control (a click, Enter or Space): `text` is `value` at the activation. Dispatched after the next rendering update, outside the activation's task, once the cleared `status` has reached the accessibility tree; not cancelable. The field never writes the clipboard: the host does, and reports the outcome in `status`.
 */
export class OcelleCopyField extends LitElement {
  static override properties = {
    value: { type: String, noAccessor: true },
    status: { type: String, noAccessor: true },
    copyLabel: { type: String, attribute: "copy-label" },
  };

  static override styles = [
    iconSlotStyles,
    css`
      :host {
        display: block;
        font-family: var(--ocelle-font-sans);
        font-variant-numeric: var(--ocelle-figures);
        color: var(--ocelle-color-ink);
      }

      :host([hidden]) {
        display: none;
      }

      .field {
        display: flex;
        align-items: stretch;
        border: var(--ocelle-border-width) solid;
        border-radius: var(--ocelle-radius-2);
      }

      [part="value"] {
        flex: 1 1 auto;
        min-inline-size: 0;
        padding-block: var(--ocelle-space-2);
        padding-inline: var(--ocelle-space-3);
        border-start-start-radius: calc(var(--ocelle-radius-2) - var(--ocelle-border-width));
        border-end-start-radius: calc(var(--ocelle-radius-2) - var(--ocelle-border-width));
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      [part="copy-control"] {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-inline-size: var(--ocelle-target-min);
        min-block-size: var(--ocelle-target-min);
        margin: 0;
        padding-block: 0;
        padding-inline: var(--ocelle-space-2);
        border: none;
        border-inline-start: var(--ocelle-border-width) solid;
        border-start-end-radius: calc(var(--ocelle-radius-2) - var(--ocelle-border-width));
        border-end-end-radius: calc(var(--ocelle-radius-2) - var(--ocelle-border-width));
        font: inherit;
        outline: none;
      }

      [part="copy-control"]:focus-visible {
        outline: var(--ocelle-focus-width) solid;
        outline-offset: var(--ocelle-focus-offset);
      }

      .status {
        display: block;
        text-align: end;
      }

      .status:not(:empty) {
        margin-block-start: var(--ocelle-space-1);
      }

      @media not (forced-colors: active) {
        .field {
          border-color: var(--ocelle-color-control-border);
        }

        [part="value"] {
          background: var(--ocelle-color-inset);
        }

        [part="copy-control"] {
          border-inline-start-color: var(--ocelle-color-accent-strong);
          background: var(--ocelle-color-sheet);
          color: var(--ocelle-color-ink);
        }

        [part="copy-control"]:disabled {
          color: var(--ocelle-color-disabled-ink);
        }

        [part="copy-control"]:focus-visible {
          outline-color: var(--ocelle-color-focus);
        }
      }

      @media (forced-colors: active) {
        .field {
          border-color: ButtonBorder;
        }

        [part="copy-control"] {
          border-inline-start-color: ButtonBorder;
          color: ButtonText;
        }

        [part="copy-control"]:focus-visible {
          outline-color: Highlight;
        }
      }
    `,
  ];

  /**
   * The Copy control's accessible name, trimmed; empty or whitespace-only gives the default. Not reflected.
   *
   * @default "Copy"
   */
  declare copyLabel: string;

  readonly #internals = attachInternalsTo(this);
  /** The live region's one text node, written only when the text shown changes (R-07). */
  readonly #text = document.createTextNode("");
  #value = "";
  #status = "";

  constructor() {
    super();
    exposeAsGroup(this.#internals);
    this.copyLabel = "Copy";
  }

  /**
   * The text shown and requested, as written. A change after first render clears `status`. With an empty value the
   * Copy control is disabled and emits nothing. Not reflected.
   *
   * @default ""
   */
  get value(): string {
    return this.#value;
  }

  set value(value: string) {
    const old = this.#value;
    if (value === old) return;
    this.#value = value;
    if (this.hasUpdated) this.status = "";
    this.requestUpdate("value", old);
  }

  /**
   * The host's outcome text, shown as the content of the field's polite live region; blank shows nothing. The field
   * clears it (the property then reads `""`) when a request starts and when `value` changes after first render.
   * Setting the text the region already holds changes nothing. Not reflected: a `status` attribute stays as written.
   *
   * @default ""
   */
  get status(): string {
    return this.#status;
  }

  set status(status: string) {
    this.#status = status;
    const shown = this.#status.trim() === "" ? "" : this.#status;
    if (this.#text.data !== shown) this.#text.data = shown;
  }

  /** A removed `value` or `status` attribute reads as `""`; the other attributes go through Lit. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "value") this.value = value ?? "";
    else if (name === "status") this.status = value ?? "";
    else super.attributeChangedCallback(name, old, value);
  }

  protected override firstUpdated(): void {
    this.renderRoot.querySelector(".status")?.append(this.#text);
  }

  /** An activation of the Copy control: clears `status` now and requests the copy after the next rendering update. */
  #activate = (): void => {
    const text = this.#value;
    this.status = "";
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (this.isConnected) this.dispatchEvent(new CustomEvent("ocelle-copy-field-request", { bubbles: true, composed: true, detail: { text } }));
      }, 0);
    });
  };

  protected override render(): unknown {
    const label = trimmedOr(this.copyLabel, "Copy");
    return html`<div class="field"><span part="value">${this.#value}</span><button part="copy-control" type="button" aria-label=${label} ?disabled=${this.#value === ""} @click=${this.#activate}><span class="icon-row"><span class="icon-slot"><ocelle-icon name="copy"></ocelle-icon></span></span></button></div><span class="status" role="status" aria-live="polite"></span>`;
  }
}

/** `value` trimmed when it is a string with a non-whitespace character, else `fallback` (a removed attribute reads `null`). */
function trimmedOr(value: unknown, fallback: string): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed === "" ? fallback : trimmed;
}

/** Gives the field its role through its internals (a helper, so the manifest does not read the role as a member). */
function exposeAsGroup(internals: ElementInternals): void {
  internals.role = "group";
}

define("ocelle-copy-field", OcelleCopyField);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-copy-field": OcelleCopyField;
  }
}
