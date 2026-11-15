// The form-control base class (specs/010-feedback-forms FR-020 to FR-028; research.md R-05, R-06; data-model.md § Form
// control, § Error announcement transitions, § Plant seams): what `ocelle-form-input`, `ocelle-form-select` and the
// form-like elements of #14 share. The element is form-associated: its native control (rendered by the subclass as
// `part="control"`), the visible label, the description and the error live in one open shadow root with
// `delegatesFocus`, so every ID reference among them stays inside it, and the host takes part in its form through
// `ElementInternals` (value, validity mirrored from the native control, reset, history restore, fieldset disabling,
// external labels). The control is named by `aria-labelledby` to a `hidden` span holding the name of FR-022 and
// described by `aria-describedby` to the description, a `hidden` span holding a host `aria-description`, and the error;
// a referenced element that is empty adds nothing. A host-set `error` is announced politely through the announcer of
// src/live.ts, a separate live region after the parts. Each rule a test plant changes is a protected method. Internal,
// not an entry point: not exported from index.ts or browser.ts, and its members reach the manifest through the elements
// derived from it (scripts/manifest.ts folds them in).
import { LitElement, css, html } from "lit";
import type { PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { registering } from "./define.ts";
import { Announcer, afterTask, collapse, readyState } from "./live.ts";
import type { Politeness, Reading } from "./live.ts";

/** The host ARIA attributes the element observes and combines with its own (FR-022, R-05). */
const hostAria = ["aria-label", "aria-invalid", "aria-required", "aria-disabled", "aria-description"];

/** The error announcer's politeness: a form control's error is announced politely (FR-027). */
const politeness: Politeness = "polite";

/** The text of an external `<label>`, without the text of the control it labels (a label may wrap its control). */
function labelText(label: Node, control: Node): string {
  if (label === control) return "";
  if (label instanceof Text) return label.data;
  return [...label.childNodes].map((child) => labelText(child, control)).join("");
}

/**
 * A form-associated control: its native control, label, description and error in one open shadow root, its value,
 * validity, reset, restore and disabled state through `ElementInternals`.
 */
export abstract class FormControl extends LitElement {
  /** @internal The element is form-associated (FR-020). */
  static formAssociated = true;

  /** @internal An open shadow root that delegates focus to the native control. */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties: PropertyDeclarations = {
    name: { type: String, reflect: true, useDefault: true },
    label: { type: String, reflect: true, useDefault: true },
    description: { type: String, reflect: true, useDefault: true },
    error: { type: String, reflect: true, useDefault: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  /** The host ARIA attributes and `hidden` are observed, not properties (FR-022, FR-027, FR-034). */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, ...hostAria, "hidden"];
  }

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part="label"],
    [part="description"],
    [part="error"] {
      display: block;
      inline-size: fit-content;
      max-inline-size: 100%;
      font-size: var(--ocelle-font-size-sm);
      line-height: var(--ocelle-line-height-normal);
      overflow-wrap: anywhere;
    }

    [part="label"] {
      font-weight: var(--ocelle-font-weight-strong);
      color: var(--ocelle-color-ink);
      margin-block-end: var(--ocelle-space-1);
    }

    [part="description"] {
      color: var(--ocelle-color-ink-muted);
      margin-block-end: var(--ocelle-space-1);
    }

    [part="error"] {
      color: var(--ocelle-color-danger);
      margin-block-start: var(--ocelle-space-1);
    }

    [part="label"][hidden],
    [part="description"][hidden],
    [part="error"][hidden] {
      display: none;
    }

    [part="control"] {
      box-sizing: border-box;
      display: block;
      inline-size: 100%;
      min-block-size: var(--ocelle-target-min);
      margin: 0;
      padding-block: var(--ocelle-space-2);
      padding-inline: var(--ocelle-space-3);
      font: inherit;
      color: var(--ocelle-color-ink);
      background-color: var(--ocelle-color-sheet);
      border: var(--ocelle-border-width) solid var(--ocelle-color-control-border);
      border-radius: var(--ocelle-radius-2);
    }

    [part="control"]::placeholder {
      color: var(--ocelle-color-ink-muted);
      opacity: 1;
    }

    [part="control"]:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset);
    }

    [part="control"].invalid {
      border-width: var(--ocelle-bar-width);
    }

    .announcer {
      position: absolute;
      inline-size: var(--ocelle-border-width);
      block-size: var(--ocelle-border-width);
      margin: calc(-1 * var(--ocelle-border-width));
      padding: 0;
      border: 0;
      overflow: hidden;
      color: transparent;
      forced-color-adjust: none;
      white-space: nowrap;
    }

    @media not (forced-colors: active) {
      [part="control"].invalid {
        border-color: var(--ocelle-color-danger);
      }

      [part="control"]:disabled {
        color: var(--ocelle-color-disabled-ink);
        background-color: var(--ocelle-color-disabled-bg);
      }
    }

    @media (forced-colors: active) {
      [part="control"] {
        border-color: CanvasText;
      }

      [part="control"]:focus-visible {
        outline-color: Highlight;
      }

      [part="error"] {
        color: CanvasText;
      }
    }
  `;

  /**
   * The name the value is submitted under; without one the value is not in the form data. Reflected.
   *
   * @default ""
   */
  declare name: string;

  /**
   * The visible label, drawn above the control; it names the control after any external `<label>`. Reflected.
   *
   * @default ""
   */
  declare label: string;

  /** The description, drawn under the label and the control's accessible description. Reflected.
   *
   * @default ""
   */
  declare description: string;

  /**
   * The error the host sets: shown under the control, it marks the control invalid for assistive technology, is added
   * to its description and is announced politely once each time it changes to a new text; it does not block
   * submission. Whitespace is collapsed and trimmed. Reflected.
   *
   * @default ""
   */
  declare error: string;

  /**
   * Whether a value is required, as the native constraint. Reflected.
   *
   * @default false
   */
  declare required: boolean;

  /**
   * Whether the control is disabled: not focusable, not editable and not in the form data. Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  /** The element's internals: the form value, the validity, the form, the labels and the disabled state of a fieldset. */
  protected readonly internals: ElementInternals;
  /** The error announcer: the live region after the parts and its steps. */
  protected readonly announcer: Announcer;
  /** The current value. */
  protected current = "";
  /** The value the last change event carried, or that a connection, reset, restore or script set without one. */
  protected lastCommitted = "";
  /** Whether the user edited the value, or a script set it, since the last reset. */
  protected dirty = false;
  /** Whether a disabled fieldset disables the control. */
  protected formDisabled = false;
  /** Set on disconnect, cleared in a later task: a connection while it is set is a move. */
  protected moving = false;
  /** Whether the element was constructed by the registration of its definition (first load). */
  protected readonly upgraded: boolean;
  #connected = false;
  readonly #labels = new MutationObserver(() => {
    this.requestUpdate();
  });

  constructor() {
    super();
    this.upgraded = registering();
    this.internals = this.attachInternals();
    this.name = "";
    this.label = "";
    this.description = "";
    this.error = "";
    this.required = false;
    this.disabled = false;
    this.announcer = this.createAnnouncer(() => this.reading());
    this.announcer.live(politeness);
    this.syncFormValue();
    this.addEventListener("focusin", () => {
      this.requestUpdate();
    });
  }

  /**
   * The current value: what the user typed or chose, or what a script, a reset or a restore set. Not reflected.
   *
   * @default ""
   */
  get value(): string {
    return this.current;
  }

  set value(value: string) {
    this.current = value;
    this.dirty = true;
    this.lastCommitted = this.current;
    this.syncFormValue();
    this.requestUpdate();
  }

  /** The form the control belongs to, or null, as a native control's. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** The `<label>` elements associated with the control, as a native control's. */
  get labels(): NodeList {
    return this.internals.labels;
  }

  /** The control's validity, the native control's constraint validation. */
  get validity(): ValidityState {
    return this.internals.validity;
  }

  /** The browser's validation message for the native control, or empty when it is valid. */
  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  /** Whether the control takes part in constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Whether the control satisfies its constraints; when not, it fires `invalid` at the host. */
  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  /** As `checkValidity()`, and when invalid the browser focuses the native control and shows its message. */
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /** Focuses the native control; the host is not a tab stop of its own. */
  override focus(options?: FocusOptions): void {
    super.focus(options);
  }

  /** The native control (the subclass renders it as `part="control"`). */
  protected abstract control(): HTMLInputElement;

  /** The control's default value, restored on reset (not `defaultValue`, which the element does not expose). */
  protected abstract initialValue(): string;

  /** The native control, rendered with the shared attributes the subclass passes on. */
  protected abstract renderControl(): TemplateResult;

  /** Dispatches the element's change event with the current value. */
  protected abstract dispatchChange(): void;

  /** The announcer of this control. */
  protected createAnnouncer(read: () => Reading): Announcer {
    return new Announcer(read);
  }

  /** What the control announces: its error as written (the announcer normalises it), politely. */
  protected reading(): Reading {
    return { text: this.error, politeness };
  }

  /** The error, whitespace collapsed and trimmed. */
  protected errorText(): string {
    return collapse(this.error);
  }

  /** The value as the form submits and restores it. */
  protected syncFormValue(): void {
    this.internals.setFormValue(this.current, this.current);
  }

  /** The validity: the native control's flags and message, anchored on it (FR-023). */
  protected syncValidity(): void {
    const control = this.control();
    this.internals.setValidity(control.validity, control.validationMessage, control);
  }

  /**
   * The control's name (FR-022): a host `aria-label` that is not blank, else the text of each external label, then
   * `label`, joined by one space; whitespace collapsed and trimmed, so a missing part adds nothing.
   */
  protected computedName(): string {
    const host = collapse(this.getAttribute("aria-label") ?? "");
    if (host !== "") return host;
    return collapse([...[...this.internals.labels].map((label) => labelText(label, this)), this.label].join(" "));
  }

  /** The `hidden` span that holds the control's name for its `aria-labelledby`. */
  protected nameHolder(name: string): unknown {
    return html`<span id="name" hidden>${name}</span>`;
  }

  /**
   * Observes the text of the external labels, so a changed label renames the control without a focus. A label observed
   * once stays observed: a change of one no longer associated only renders the same name again.
   */
  protected observeLabels(): void {
    for (const label of this.internals.labels) this.#labels.observe(label, { childList: true, characterData: true, subtree: true });
  }

  /** Whether the control is invalid for assistive technology: an error, or a host `aria-invalid="true"`. */
  protected invalidForAT(): boolean {
    return this.errorText() !== "" || this.getAttribute("aria-invalid") === "true";
  }

  /** Whether the control has `aria-required="true"`: a host `aria-required="true"` (only `required` sets the constraint). */
  protected requiredForAT(): boolean {
    return this.getAttribute("aria-required") === "true";
  }

  /** Whether the control has `aria-disabled="true"`: a host `aria-disabled="true"`, the control staying focusable. */
  protected disabledForAT(): boolean {
    return this.getAttribute("aria-disabled") === "true";
  }

  /** Whether the control is disabled, by `disabled` or by a disabled fieldset. */
  protected effectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** Whether the value changed since the last change event. */
  protected uncommitted(): boolean {
    return this.current !== this.lastCommitted;
  }

  /** A committed change: the change event, when the value changed since the last one. */
  protected commit(): void {
    if (!this.uncommitted()) return;
    this.lastCommitted = this.current;
    this.dispatchChange();
  }

  /** The user edited the value: the form value and the validity follow it. */
  protected edited(value: string): void {
    this.current = value;
    this.dirty = true;
    this.syncFormValue();
    this.syncValidity();
  }

  /** A form reset: the default value, not dirty, with no event. */
  protected resetValue(): void {
    this.dirty = false;
    this.current = this.initialValue();
    this.lastCommitted = this.current;
    this.syncFormValue();
    this.requestUpdate();
  }

  /** A history restore: the restored value, with no event. */
  protected restoreValue(state: unknown): void {
    this.current = String(state);
    this.dirty = true;
    this.lastCommitted = this.current;
    this.syncFormValue();
    this.requestUpdate();
  }

  /** The default value changed: it becomes the current value while the value is not dirty. */
  protected defaultChanged(): void {
    // Called from attributeChangedCallback(), which has requested the update that shows the value.
    if (this.dirty) return;
    this.current = this.initialValue();
    this.lastCommitted = this.current;
    this.syncFormValue();
  }

  /** @internal The form was reset. */
  formResetCallback(): void {
    this.resetValue();
  }

  /** @internal The browser restores the state the form value recorded (history restore). */
  formStateRestoreCallback(state: unknown): void {
    this.restoreValue(state);
  }

  /** @internal A fieldset disabled or enabled the control. */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.requestUpdate();
  }

  /** The first-load query: constructed by the registration, or connected while the document is loading (R-02). */
  protected isFirstLoad(): boolean {
    return this.upgraded || readyState() === "loading";
  }

  /** The move query: connected while the move flag is set. */
  protected isMove(): boolean {
    return this.moving;
  }

  /** On disconnect: the move flag set. */
  protected startMove(): void {
    this.moving = true;
  }

  /** In the task after a disconnect: the move flag cleared, and a control still removed cancels. */
  protected endMove(): void {
    this.moving = false;
    if (this.isConnected) return;
    this.announcer.cancel();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.onConnect();
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, LitElement's disconnectedCallback() tells reactive controllers, which the control has none of, and disconnects its template's async directives, which it uses none of (class-map and live are synchronous)
    super.disconnectedCallback();
    this.startMove();
    afterTask(() => {
      this.endMove();
    });
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
    if (old === value) return;
    if (name === "hidden") this.onHidden(value !== null);
    else if (name === "error") this.onError();
  }

  /** A connection: a move, the first load, or an insertion after parsing, which announces the error. */
  protected onConnect(): void {
    if (this.isMove()) return;
    const first = !this.#connected;
    this.#connected = true;
    this.announcer.shown();
    if (first && this.isFirstLoad()) {
      this.announcer.takeBaseline();
      return;
    }
    if (!this.hidden) this.announcer.trigger(true);
  }

  /** `hidden` set or removed: a cancel, or a reveal announced as an insertion. */
  protected onHidden(hidden: boolean): void {
    if (hidden) {
      this.announcer.cancel();
      return;
    }
    this.announcer.shown();
    this.announcer.trigger(true);
  }

  /** An `error` change: cleared, it resets the baseline; to a new text while shown, it is announced. */
  protected onError(): void {
    if (this.errorText() === "") this.clearError();
    else if (!this.hidden && !this.announcer.sameText(this.error)) this.announcer.trigger(false);
  }

  /** The error cleared: any pending announcement cancelled and the baseline empty. */
  protected clearError(): void {
    this.announcer.cancel();
    this.announcer.takeBaseline();
  }

  protected override updated(changed: PropertyValues): void {
    // Stryker disable next-line CallExpression: equivalent, LitElement's updated() does nothing
    super.updated(changed);
    this.observeLabels();
    this.syncValidity();
  }

  protected override render(): unknown {
    const label = collapse(this.label);
    const description = collapse(this.description);
    const error = this.errorText();
    return html`<label part="label" for="control" ?hidden=${label === ""}>${label}</label
      ><div part="description" id="description" ?hidden=${description === ""}>${description}</div
      >${this.renderControl()}<div part="error" id="error" ?hidden=${error === ""}>${error}</div
      >${this.nameHolder(this.computedName())}<span id="host-description" hidden>${collapse(this.getAttribute("aria-description") ?? "")}</span
      >${this.announcer.region}`;
  }
}
