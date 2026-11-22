import { css, html, nothing } from "lit";
import type { CSSResultGroup, PropertyDeclaration, PropertyDeclarations, TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";
import { define } from "./define.ts";
import { FormControl } from "./form-control.ts";

/** The value and script-visible form data use the native textarea's LF line endings. */
function normalize(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

const requiredField = document.createElement("textarea");
requiredField.required = true;

/**
 * A labelled multiline field with native editing, form participation, validation, reset and restoration.
 *
 * @tagname ocelle-form-textarea
 * @attribute {string} [value=""] - The default value. The value property is the current answer. Both use LF line endings.
 * @fires {CustomEvent<{ value: string }>} ocelle-form-textarea-change - A committed user edit, with the current value.
 * @csspart label - The visible label.
 * @csspart control - The native textarea.
 * @csspart description - The description beneath the label.
 * @csspart error - The host error beneath the control.
 */
export class OcelleFormTextarea extends FormControl {
  // These form-critical properties reflect during requestUpdate(), before the next browser render.
  static override properties: PropertyDeclarations = {
    name: { type: String, useDefault: true },
    required: { type: Boolean },
    disabled: { type: Boolean },
    readOnly: { type: Boolean, attribute: "readonly" },
  };

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "value"];
  }

  static override styles: CSSResultGroup = [
    FormControl.styles,
    css`
      [part="control"] {
        resize: vertical;
        overflow-wrap: anywhere;
      }

      [part="control"]:read-only:not(:disabled) {
        border-style: dashed;
      }

      @media (forced-colors: active) {
        [part="control"]:disabled {
          border-color: GrayText;
        }
      }
    `,
  ];

  /**
   * Whether the answer can be focused, selected and submitted but cannot be edited (attribute `readonly`).
   *
   * @default false
   */
  declare readOnly: boolean;

  constructor() {
    super();
    this.readOnly = false;
    this.addEventListener("invalid", () => {
      // Interactive validation may need the focus anchor in the connection task, before Lit renders.
      if (!this.hasUpdated) this.performUpdate();
    });
  }

  /** @internal Synchronizes form-critical reflection before scheduling the Lit update. */
  override requestUpdate(property?: PropertyKey, old?: unknown, options?: PropertyDeclaration, useNewValue?: boolean, newValue?: unknown): void {
    super.requestUpdate(property, old, options, useNewValue, newValue);
    if (property === "name" && this.name !== (this.getAttribute("name") ?? "")) {
      this.setAttribute("name", this.name);
    }
    if (property === "required" || property === "disabled" || property === "readOnly") {
      const attribute = property === "readOnly" ? "readonly" : property;
      this.toggleAttribute(attribute, this[property]);
      this.syncValidity();
    }
  }

  override get value(): string {
    return super.value;
  }

  override set value(value: string) {
    super.value = normalize(value);
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (name === "value") this.defaultChanged();
  }

  /** @internal A disabled fieldset immediately changes constraint participation. */
  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.syncValidity();
  }

  protected override initialValue(): string {
    return normalize(this.getAttribute("value") ?? "");
  }

  protected override restoreValue(state: unknown): void {
    super.restoreValue(normalize(String(state)));
  }

  protected override control(): HTMLTextAreaElement {
    // The template supplies this control before it can dispatch input.
    return this.shadowRoot?.getElementById("control") as HTMLTextAreaElement;
  }

  protected override syncFormValue(): void {
    super.syncFormValue();
    this.syncValidity();
  }

  protected override syncValidity(): void {
    if (this.required && !this.readOnly && !this.effectivelyDisabled() && this.current === "") {
      const anchor = this.shadowRoot?.querySelector<HTMLTextAreaElement>("#control") ?? undefined;
      this.internals.setValidity({ valueMissing: true }, requiredField.validationMessage, anchor);
    } else {
      this.internals.setValidity({});
    }
  }

  protected override dispatchChange(): void {
    this.dispatchEvent(new CustomEvent("ocelle-form-textarea-change", { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  protected override renderControl(): TemplateResult {
    return html`<textarea
      part="control"
      id="control"
      class=${classMap({ invalid: this.errorText() !== "" })}
      .value=${live(this.current)}
      ?readonly=${this.readOnly}
      ?required=${this.required}
      ?disabled=${this.effectivelyDisabled()}
      aria-labelledby="name"
      aria-describedby="description host-description error"
      aria-invalid=${this.invalidForAT() ? "true" : nothing}
      aria-required=${this.requiredForAT() ? "true" : nothing}
      aria-disabled=${this.disabledForAT() ? "true" : nothing}
      @input=${() => {
        this.edited(this.control().value);
      }}
      @change=${() => {
        this.commit();
      }}
    ></textarea>`;
  }
}

define("ocelle-form-textarea", OcelleFormTextarea);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-form-textarea": OcelleFormTextarea;
  }
}
