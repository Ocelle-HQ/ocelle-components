// `ocelle-form-input` (specs/010-feedback-forms FR-020 to FR-030; research.md R-05, R-06; data-model.md § Input-only
// fields): a labelled text field that takes part in its form like a native input, on the form-control base class of
// src/form-control.ts. The native `<input part="control">` gets `type` (an unknown value reads `text`, the attribute
// kept as written) and the pass-through attributes of FR-029 unchanged. The `value` attribute is the default value,
// observed by hand: it sets the current value while the value is not dirty and is restored on reset. Each committed
// change dispatches `ocelle-form-input-change` with `{ value }`; Enter commits, then applies HTML's implicit-submission
// rule to the form (FR-030). Each rule a test plant changes is a protected method (data-model.md § Plant seams).
// Importing this module defines `ocelle-form-input` and no other element.
import { html, nothing } from "lit";
import type { PropertyDeclarations, TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";
import { define } from "./define.ts";
import { FormControl } from "./form-control.ts";

/** The input's types. */
export type FormInputType = "text" | "email" | "url" | "tel" | "search" | "password" | "number";

const types: readonly FormInputType[] = ["text", "email", "url", "tel", "search", "password", "number"];

/** The native input types that block implicit submission (HTML § Implicit submission). */
const blockingTypes = ["text", "search", "url", "tel", "email", "password", "date", "month", "week", "time", "datetime-local", "number"];

/** A pass-through value for the field's attribute: the attribute removed when the host's is absent (null or undefined). */
function given(value: string | number | null | undefined): string | number | typeof nothing {
  return value ?? nothing;
}

/** Whether `element` is a submit button: a `<button>` or `<input>` of type `submit`, or an image button. */
function isSubmitButton(element: Element): element is HTMLElement {
  if (element instanceof HTMLButtonElement) return element.type === "submit";
  return element instanceof HTMLInputElement && (element.type === "submit" || element.type === "image");
}

/** Whether `element` is a field that blocks implicit submission: a native input of a blocking type, or an input. */
function blocks(element: Element): boolean {
  if (element instanceof OcelleFormInput) return true;
  return element instanceof HTMLInputElement && blockingTypes.includes(element.type);
}

/**
 * A labelled text field with an optional description and a host-set error, that takes part in its form like a native
 * input: its value is submitted under `name`, validated by the browser's own constraints, restored on reset and on
 * history restore, and disabled by a disabled fieldset.
 *
 * @tagname ocelle-form-input
 * @attribute {string} [value=""] - The default value, restored on reset; it sets the current value while the user has not edited it and no script has set `value` since the last reset. The `value` property is the current value.
 * @fires {CustomEvent<{ value: string }>} ocelle-form-input-change - A committed change of the value by the user (the field left after a change, or Enter), with the value; never for a change by script, reset or restore.
 * @csspart label - The visible label, above the field.
 * @csspart control - The native field.
 * @csspart description - The description, under the label.
 * @csspart error - The error, under the field.
 */
export class OcelleFormInput extends FormControl {
  static override properties: PropertyDeclarations = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} has Lit wrap the element's own accessors, which write the attribute themselves, and reflect nothing
    type: {
      // Stryker disable next-line BooleanLiteral: equivalent, Lit reflects a property only when it is set through Lit's accessor, which noAccessor leaves out; the setter writes the attribute itself
      reflect: true,
      noAccessor: true,
      // `useDefault` keeps Lit from writing the read default into the attribute at the first update.
      useDefault: true,
    },
    placeholder: { type: String, reflect: true },
    autocomplete: { type: String, reflect: true },
    inputMode: { type: String, reflect: true, attribute: "inputmode" },
    pattern: { type: String, reflect: true },
    min: { type: String, reflect: true },
    max: { type: String, reflect: true },
    step: { type: String, reflect: true },
    minLength: { type: Number, reflect: true, attribute: "minlength" },
    maxLength: { type: Number, reflect: true, attribute: "maxlength" },
    readOnly: { type: Boolean, reflect: true, attribute: "readonly" },
  };

  /** The `value` attribute is observed by hand: it is the default value, with no property of its own (FR-021). */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "value"];
  }

  /**
   * The placeholder, shown while the value is empty. Reflected.
   *
   * @default undefined
   */
  declare placeholder: string | undefined;

  /**
   * The autofill hint, passed to the field. Reflected.
   *
   * @default undefined
   */
  declare autocomplete: string | undefined;

  /**
   * The virtual keyboard hint (attribute `inputmode`), passed to the field. Reflected. Its TypeScript type is the
   * `string` of `HTMLElement.inputMode`, which it overrides; absent, it reads `undefined`.
   *
   * @type {string | undefined}
   * @default undefined
   */
  declare inputMode: string;

  /**
   * The pattern the value must match, as the native constraint. Reflected.
   *
   * @default undefined
   */
  declare pattern: string | undefined;

  /**
   * The minimum of a `number` field, as the native constraint. Reflected.
   *
   * @default undefined
   */
  declare min: string | undefined;

  /**
   * The maximum of a `number` field, as the native constraint. Reflected.
   *
   * @default undefined
   */
  declare max: string | undefined;

  /**
   * The step of a `number` field, as the native constraint and for ArrowUp and ArrowDown. Reflected.
   *
   * @default undefined
   */
  declare step: string | undefined;

  /**
   * The minimum length of the value (attribute `minlength`), as the native constraint; absent, no limit. Reflected.
   *
   * @default undefined
   */
  declare minLength: number | undefined;

  /**
   * The maximum length of the value (attribute `maxlength`), as the native constraint; absent, no limit. Reflected.
   *
   * @default undefined
   */
  declare maxLength: number | undefined;

  /**
   * Whether the value can be focused and submitted but not edited (attribute `readonly`). Reflected.
   *
   * @default false
   */
  declare readOnly: boolean;

  constructor() {
    super();
    this.readOnly = false;
  }

  /**
   * The field's type: `text`, `email`, `url`, `tel`, `search`, `password` or `number`; any other value behaves as `text`
   * and the property reads `"text"`, while the attribute keeps the value as written. Reflected.
   *
   * @default "text"
   */
  get type(): "text" | "email" | "url" | "tel" | "search" | "password" | "number" {
    const value = this.getAttribute("type");
    return types.find((type) => type === value) ?? "text";
  }

  set type(value: "text" | "email" | "url" | "tel" | "search" | "password" | "number") {
    // Lit sets the property from a removed attribute as null, which removes it again here.
    if ((value as string | null) === null) this.removeAttribute("type");
    else this.setAttribute("type", value);
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (name === "value") this.defaultChanged();
  }

  protected override control(): HTMLInputElement {
    // The template always renders the field, and the base class asks for it only after a render.
    return this.shadowRoot?.getElementById("control") as HTMLInputElement;
  }

  protected override initialValue(): string {
    return this.getAttribute("value") ?? "";
  }

  protected override dispatchChange(): void {
    this.dispatchEvent(new CustomEvent("ocelle-form-input-change", { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  /** The user typed: the value follows the field before the composed `input` event reaches the host. */
  protected onInput(): void {
    this.edited(this.control().value);
  }

  /** The field's own `change` (not composed): a committed change. */
  protected onChange(): void {
    this.commit();
  }

  /** Enter (not composing): no native `change`, a committed change, then implicit submission (FR-030). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    this.commit();
    this.implicitSubmit();
  }

  /**
   * HTML's implicit submission for the form: a click of its default button (its first submit button), or without one,
   * `requestSubmit()` when the form holds exactly one field that blocks implicit submission.
   */
  protected implicitSubmit(): void {
    const form = this.internals.form;
    if (form === null) return;
    const button = [...form.elements].find(isSubmitButton);
    if (button !== undefined) button.click();
    else if (this.blockingFields(form) === 1) form.requestSubmit();
  }

  /** The fields of `form` that block implicit submission. */
  protected blockingFields(form: HTMLFormElement): number {
    return [...form.elements].filter(blocks).length;
  }

  protected override renderControl(): TemplateResult {
    return html`<input
      part="control"
      id="control"
      class=${classMap({ invalid: this.errorText() !== "" })}
      type=${this.type}
      .value=${live(this.current)}
      placeholder=${given(this.placeholder)}
      autocomplete=${given(this.autocomplete)}
      inputmode=${given(this.inputMode)}
      pattern=${given(this.pattern)}
      min=${given(this.min)}
      max=${given(this.max)}
      step=${given(this.step)}
      minlength=${given(this.minLength)}
      maxlength=${given(this.maxLength)}
      ?readonly=${this.readOnly}
      ?required=${this.required}
      ?disabled=${this.effectivelyDisabled()}
      aria-labelledby="name"
      aria-describedby="description host-description error"
      aria-invalid=${this.invalidForAT() ? "true" : nothing}
      aria-required=${this.requiredForAT() ? "true" : nothing}
      aria-disabled=${this.disabledForAT() ? "true" : nothing}
      @input=${() => {
        this.onInput();
      }}
      @change=${() => {
        this.onChange();
      }}
      @keydown=${(event: KeyboardEvent) => {
        this.onKeydown(event);
      }}
    />`;
  }
}

define("ocelle-form-input", OcelleFormInput);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-form-input": OcelleFormInput;
  }
}
