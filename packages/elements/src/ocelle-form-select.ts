// `ocelle-form-select` (specs/010-feedback-forms FR-020 to FR-028, FR-031, FR-032; research.md R-05 to R-07;
// data-model.md § Select-only fields): a labelled native select for closed choices that takes part in its form like a
// native select, on the form-control base class of src/form-control.ts. The native `<select part="control">` has no
// slot: its options are copies of the host's light-DOM `<option>` and `<optgroup>` children, made again whenever they
// change (a `MutationObserver` on the host: child nodes, their text, and the attributes `value`, `label`, `selected` and
// `disabled`), so the light-DOM children are neither rendered nor exposed. While the choice is not dirty (no user
// choice and no script `value` since the last reset), the select shows the default selection, the last option marked
// `selected` or else the first enabled one; once dirty it keeps the chosen value while an option has it, and otherwise
// falls back to the first enabled option, without an event. A host `value` attribute is ignored. Each committed change
// dispatches `ocelle-form-select-change` with `{ value }`. The open-list indicator is the set's `chevron-down`, drawn by
// src/icon-svg.ts from the data of src/icons.ts at the inline end, with `pointer-events: none`. Each rule a test plant
// changes is a protected member (data-model.md § Plant seams). Importing this module defines `ocelle-form-select` and no
// other element.
import { css, html, nothing } from "lit";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { define } from "./define.ts";
import { FormControl } from "./form-control.ts";
import { iconSvg } from "./icon-svg.ts";
import { icons } from "./icons.ts";

/** A copy of the light-DOM option or option group `child` for the native select, without its ids, which could collide with the shadow root's. */
function mirror(child: Element): Element {
  const copy = child.cloneNode(true) as Element;
  for (const each of [copy, ...copy.querySelectorAll("[id]")]) each.removeAttribute("id");
  return copy;
}

/** Whether `child` is one the native select mirrors: an `<option>` or an `<optgroup>`. */
const mirrored = (child: Element): boolean => child.localName === "option" || child.localName === "optgroup";

/**
 * A labelled native select for closed choices, with an optional description and a host-set error, whose options are its
 * light-DOM `<option>` and `<optgroup>` children, and that takes part in its form like a native select: its value is
 * submitted under `name`, validated by the browser's own constraints, restored on reset and on history restore, and
 * disabled by a disabled fieldset.
 *
 * @tagname ocelle-form-select
 * @fires {CustomEvent<{ value: string }>} ocelle-form-select-change - A committed change of the choice by the user, with the value; never for a change by script, reset, restore or a change of the options.
 * @csspart label - The visible label, above the select.
 * @csspart control - The native select.
 * @csspart description - The description, under the label.
 * @csspart error - The error, under the select.
 */
export class OcelleFormSelect extends FormControl {
  static override styles: CSSResultGroup = [
    FormControl.styles,
    css`
      .field {
        position: relative;
        color: var(--ocelle-color-ink);
      }

      [part="control"] {
        appearance: none;
        padding-inline-end: calc(var(--ocelle-space-3) + var(--ocelle-icon-size) + var(--ocelle-space-2));
      }

      svg {
        position: absolute;
        inset-block: 0;
        inset-inline-end: var(--ocelle-space-3);
        inline-size: var(--ocelle-icon-size);
        block-size: var(--ocelle-icon-size);
        margin-block: auto;
        pointer-events: none;
      }
    `,
  ];

  readonly #options = new MutationObserver((records) => {
    this.optionsChanged(records);
  });

  constructor() {
    super();
    this.#options.observe(this, this.optionObservation());
  }

  /**
   * The current choice: the value of the option the user chose, or that a script, a reset or a restore selected; a
   * value no option has selects nothing and reads `""`. Not reflected; a host `value` attribute is ignored.
   *
   * @default ""
   */
  override get value(): string {
    return super.value;
  }

  override set value(value: string) {
    super.value = value;
    if (this.hasUpdated) this.showChoice();
  }

  /** What the option observer watches: the host's light-DOM subtree, its text and the options' mirrored attributes. */
  protected optionObservation(): MutationObserverInit {
    return { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "selected", "disabled"] };
  }

  /** The light DOM changed: the options are mirrored again, unless only the host's own attributes changed. */
  protected optionsChanged(records: readonly MutationRecord[]): void {
    if (!this.hasUpdated) return;
    if (records.some((record) => record.type !== "attributes" || record.target !== this)) this.mirrorOptions();
  }

  /**
   * The native select's options made again from the light DOM, in order; the choice kept while an option has it, else
   * (once dirty) the first enabled option, else the default selection.
   */
  protected mirrorOptions(): void {
    const select = this.control();
    select.replaceChildren(...[...this.children].filter(mirrored).map(mirror));
    if (this.dirty && ![...select.options].some((each) => each.value === this.current)) {
      select.selectedIndex = this.firstEnabled([...select.options]);
      this.chosen();
    } else this.showChoice();
    this.syncValidity();
  }

  /** The native select shows the choice: the current value once dirty, the default selection otherwise. */
  protected showChoice(): void {
    const select = this.control();
    if (this.dirty) select.value = this.current;
    else select.selectedIndex = this.defaultIndex([...select.options]);
    this.chosen();
  }

  /** The value is what the native select shows, with no event; the form value follows it. */
  protected chosen(): void {
    const value = this.control().value;
    if (value !== this.current) {
      this.current = value;
      this.lastCommitted = value;
    }
    this.syncFormValue();
  }

  /** The index of the first enabled option of `options`, or -1. */
  protected firstEnabled(options: readonly HTMLOptionElement[]): number {
    return options.findIndex((each) => !each.matches(":disabled"));
  }

  /** The default selection among `options`: the last option marked `selected`, else the first enabled option, else none (-1). */
  protected defaultIndex(options: readonly HTMLOptionElement[]): number {
    const marked = options.findLastIndex((each) => each.defaultSelected);
    return marked === -1 ? this.firstEnabled(options) : marked;
  }

  /**
   * The options a native select with the host's light-DOM children lists, in tree order: each `<option>` child and each
   * `<option>` of an `<optgroup>` child, the ones the native select mirrors.
   */
  protected listedOptions(): HTMLOptionElement[] {
    return [...this.querySelectorAll<HTMLOptionElement>(":scope > option, :scope > optgroup > option")];
  }

  /** The value as the form submits it: none while no option is selected, as for a native select; the state is the value. */
  protected override syncFormValue(): void {
    const selected = this.hasUpdated && this.control().selectedIndex !== -1;
    this.internals.setFormValue(selected ? this.current : null, this.current);
  }

  protected override control(): HTMLSelectElement {
    // The template always renders the select, and every caller runs once it has rendered: the option observer, the
    // `value` setter and `syncFormValue()` wait for the first update, and the steps a form can call before it (a reset
    // or a restore in the task of the insertion) do not ask for the select: `initialValue()` reads the light DOM.
    return this.shadowRoot?.getElementById("control") as HTMLSelectElement;
  }

  /**
   * The default value, read from the light-DOM options as a native select reads its own, so that a form reset before
   * the first render (in the task of the insertion) has it without the native select (FR-024; O2-01).
   */
  protected override initialValue(): string {
    const options = this.listedOptions();
    return options[this.defaultIndex(options)]?.value ?? "";
  }

  protected override dispatchChange(): void {
    this.dispatchEvent(new CustomEvent("ocelle-form-select-change", { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  /** The user chose: the value follows the select before the composed `input` event reaches the host. */
  protected onInput(): void {
    this.edited(this.control().value);
  }

  protected override firstUpdated(): void {
    this.mirrorOptions();
  }

  protected override updated(changed: PropertyValues): void {
    this.showChoice();
    super.updated(changed);
  }

  protected override renderControl(): TemplateResult {
    // The box's class follows the disabled state although no style reads it: Chromium keeps the disabled state of a
    // select first rendered disabled inside a box in its accessibility tree after the select is enabled, and a changed
    // class on the box makes it read the select's state again (measured on Chromium 153; US2-11).
    return html`<div class=${classMap({ field: true, off: this.effectivelyDisabled() })}><select
      part="control"
      id="control"
      class=${classMap({ invalid: this.errorText() !== "" })}
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
        this.commit();
      }}
    ></select>${iconSvg(icons["chevron-down"])}</div>`;
  }
}

define("ocelle-form-select", OcelleFormSelect);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-form-select": OcelleFormSelect;
  }
}
