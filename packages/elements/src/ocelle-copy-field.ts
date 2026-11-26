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
// Grouped identifiers wrap between code-point groups. A compact preview has its own native disclosure, with the full
// identifier available to assistive technology and the visible end groups available to native selection.
// Forced colours: the boundaries are `ButtonBorder`, the icon `ButtonText`, the ring `Highlight`. No transition or
// animation. Importing this module defines `ocelle-copy-field` and `ocelle-icon`.
import { LitElement, css, html, nothing } from "lit";
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
    // `value` and `status` are the accessors below, and their attributes are handled in attributeChangedCallback; the
    // entries name the attributes for Lit and the manifest.
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent, `{}` and `noAccessor: false` make Lit wrap the class's own accessor, which only adds an update request that renders the same template
    value: { type: String, noAccessor: true },
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent, as for `value`: the wrapped `status` accessor adds an update request and the template does not read `status`
    status: { type: String, noAccessor: true },
    copyLabel: { type: String, attribute: "copy-label" },
    grouped: { type: Boolean },
    compact: { type: Boolean },
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

      .field:has(> .reveal) {
        flex-wrap: wrap;
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

      .field:has(> .reveal) > [part="value"] {
        flex-basis: calc(2 * var(--ocelle-measure-cell));
      }

      .identifier {
        display: block;
        text-align: start;
      }

      .identifier > span {
        unicode-bidi: isolate;
      }

      .identifier > span:not(:last-child) {
        margin-inline-end: var(--ocelle-space-1);
      }

      .group {
        white-space: nowrap;
      }

      .full-identifier {
        position: absolute;
        inline-size: var(--ocelle-size-visually-hidden);
        block-size: var(--ocelle-size-visually-hidden);
        overflow: hidden;
        opacity: 0;
        white-space: nowrap;
        user-select: none;
      }

      [part="copy-control"],
      .reveal {
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
        font: inherit;
        outline: none;
      }

      [part="copy-control"] {
        border-start-end-radius: calc(var(--ocelle-radius-2) - var(--ocelle-border-width));
        border-end-end-radius: calc(var(--ocelle-radius-2) - var(--ocelle-border-width));
      }

      .reveal {
        flex-shrink: 1;
        max-inline-size: 100%;
        margin-inline-start: auto;
        overflow-wrap: anywhere;
      }

      .field:has(> .reveal) > [part="copy-control"]:focus-visible,
      .reveal:focus-visible {
        position: relative;
        z-index: 1;
      }

      [part="copy-control"]:focus-visible,
      .reveal:focus-visible,
      .field:focus-visible {
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

        [part="copy-control"],
        .reveal {
          border-inline-start-color: var(--ocelle-color-accent-strong);
          background: var(--ocelle-color-sheet);
          color: var(--ocelle-color-ink);
        }

        [part="copy-control"]:disabled {
          color: var(--ocelle-color-disabled-ink);
        }

        [part="copy-control"]:focus-visible,
        .reveal:focus-visible,
        .field:focus-visible {
          outline-color: var(--ocelle-color-focus);
        }
      }

      @media (forced-colors: active) {
        .field {
          border-color: ButtonBorder;
        }

        [part="copy-control"],
        .reveal {
          border-inline-start-color: ButtonBorder;
          color: ButtonText;
        }

        [part="copy-control"]:focus-visible,
        .reveal:focus-visible,
        .field:focus-visible {
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

  /**
   * Shows identifiers with a separate prefix and groups of four Unicode code points. Values containing internal
   * whitespace use plain rendering. The Copy action still requests the original value.
   *
   * @default false
   */
  declare grouped: boolean;

  /**
   * Shows the ends of a grouped identifier with at least three body groups, with a control that toggles the full
   * display. Changing the value restores the preview.
   *
   * @default false
   */
  declare compact: boolean;

  readonly #internals = attachInternalsTo(this);
  /** The live region's one text node, written only when the text shown changes (R-07). */
  readonly #text = document.createTextNode("");
  #value = "";
  #status = "";
  #revealed = false;
  #focusedDisclosure: Element | null = null;

  constructor() {
    super();
    exposeAsGroup(this.#internals);
    this.copyLabel = "Copy";
    this.grouped = false;
    this.compact = false;
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
    if (value === this.#value) return;
    this.#value = value;
    this.#revealed = false;
    if (this.hasUpdated) this.status = "";
    this.requestUpdate();
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

  protected override willUpdate(): void {
    const active = this.shadowRoot?.activeElement ?? null;
    this.#focusedDisclosure = active?.matches(".reveal") ? active : null;
  }

  protected override updated(): void {
    const disclosure = this.#focusedDisclosure;
    if (disclosure === null || disclosure.isConnected) return;

    const copy = this.renderRoot.querySelector<HTMLButtonElement>('[part="copy-control"]:enabled');
    if (copy !== null) {
      copy.focus();
      return;
    }

    const field = this.renderRoot.querySelector<HTMLElement>(".field");
    if (field !== null) {
      field.tabIndex = -1;
      field.addEventListener("focusout", () => {
        field.removeAttribute("tabindex");
      }, { once: true });
      field.focus();
    }
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

  #toggle = (): void => {
    this.#revealed = !this.#revealed;
    this.requestUpdate();
  };

  protected override render(): unknown {
    const label = trimmedOr(this.copyLabel, "Copy");
    const units = this.grouped ? identifierUnits(this.#value) : null;
    const canReveal = this.compact && units !== null && units.groups.length >= 3;
    const preview = canReveal && !this.#revealed;
    const value = units === null ? this.#value : identifierContent(units, preview);
    const reveal = canReveal
      ? html`<button class="reveal" type="button" aria-expanded=${this.#revealed} aria-controls="identifier" @click=${this.#toggle}>${this.#revealed ? "Show less" : "Show full identifier"}</button>`
      : nothing;
    return html`<div class="field"><span id="identifier" part="value">${value}</span>${reveal}<button part="copy-control" type="button" aria-label=${label} ?disabled=${this.#value === ""} @click=${this.#activate}><span class="icon-row"><span class="icon-slot"><ocelle-icon name="copy"></ocelle-icon></span></span></button></div><span class="status" role="status" aria-live="polite"></span>`;
  }
}

interface IdentifierUnits {
  readonly text: string;
  readonly prefix: string;
  readonly groups: readonly string[];
}

function identifierUnits(value: string): IdentifierUnits | null {
  const text = value.trim();
  if (/\s/.test(text)) return null;
  const cut = text.lastIndexOf(":") + 1;
  const body = Array.from(text.slice(cut));
  const groups: string[] = [];
  for (let at = 0; at < body.length; at += 4) groups.push(body.slice(at, at + 4).join(""));
  return { text, prefix: text.slice(0, cut), groups };
}

function identifierContent({ text, prefix, groups }: IdentifierUnits, preview: boolean) {
  const visible = preview ? [groups[0], "…", groups.at(-1)] : groups;
  const prefixUnit = prefix === "" ? nothing : html`<span>${prefix}</span>`;
  const groupUnits = visible.map((group, index) => html`${prefix !== "" || index > 0 ? html`<wbr>` : nothing}<span class="group">${group}</span>`);
  const full = preview ? html`<bdi class="full-identifier" dir="ltr">${text}</bdi>` : nothing;
  return html`${full}<bdi class="identifier" dir="ltr" aria-hidden=${preview ? "true" : nothing}>${prefixUnit}${groupUnits}</bdi>`;
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
