// `ocelle-listbox` (014 FR-001 to FR-018, FR-014a; research.md R-01, R-03 to R-05, R-15, R-16, R-18; data-model.md):
// a single-select listbox of the `ocelle-option` children the host writes in its own markup. The options stay in the
// page's tree scope, slotted into the shadow root's `part="list"`, so nothing crosses a shadow root:
// - role `listbox` and the name (`label`, trimmed, or a host `aria-label`, which decides alone) through internals, kept
//   under the internals symbol axe reads;
// - the child list from a `MutationObserver` on the host (child list, and the options' `value` and `disabled`), one
//   batch per microtask checkpoint, through `SelectionModel` (src/selection.ts); the listbox writes `aria-selected`,
//   `aria-disabled` and `tabindex` on its options, only where they differ, and removes them from options that leave;
// - one tab stop (FR-016), the keys of `RovingController` (src/roving.ts): ArrowUp, ArrowDown, Home and End move focus
//   without wrapping and without selecting; Enter and Space select, Enter on the selected enabled option activates;
//   every other key is left to the page;
// - a click selects an enabled option, a double-click activates it; a `mousedown` on a disabled option or on the list
//   part's own padding has its default prevented, so it takes no focus;
// - the focus record (R-03): a capture-phase `focusin` / `focusout` listener on the host, so a removal or a move of the
//   focused option keeps focus (or moves it by FR-011), and a user leaving by Tab or a click is never brought back.
// `part="list"` is the scroll container, padded by the focus ring's width and offset and at `tabindex="-1"`, so the ring
// of any option lies inside it and Chromium's keyboard-focusable scroller never makes it a tab stop. Importing this
// module defines `ocelle-listbox` and `ocelle-option`.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { attachInternalsTo } from "./internals.ts";
import { accessibleName } from "./naming.ts";
import { OcelleOption } from "./ocelle-option.ts";
import { RovingController } from "./roving.ts";
import { SelectionModel, childValue } from "./selection.ts";
import type { Entry } from "./selection.ts";

/** The attributes the listbox writes on its options. */
const written = ["aria-selected", "aria-disabled", "tabindex"];

/**
 * A single-select listbox of `ocelle-option` children, one tab stop, keyboard and pointer selection.
 *
 * @tagname ocelle-listbox
 * @slot - The `ocelle-option` children.
 * @csspart list - The scroll container of the options; a host limits the listbox's height with `max-block-size` on the listbox.
 * @fires {CustomEvent<{ value: string }>} ocelle-listbox-change - The user selected another option (Enter, Space or a click); `value` already reads it.
 * @fires {CustomEvent<{ value: string }>} ocelle-listbox-activate - The user confirmed an option: Enter on the selected enabled option, or a double-click on an enabled option. Not cancelable.
 */
export class OcelleListbox extends LitElement {
  static override properties = {
    label: { type: String },
    value: { type: String, noAccessor: true },
  };

  /** `aria-label` is observed, not a property: a host `aria-label` names the listbox (FR-006), so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    :host([hidden]) {
      display: none;
    }

    [part="list"] {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow: auto;
      padding: calc(var(--ocelle-focus-width) + var(--ocelle-focus-offset));
      outline: none;
    }
  `;

  /**
   * The listbox's accessible name, trimmed; empty or whitespace-only counts as none, and a host `aria-label` decides
   * over it. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  readonly #internals = attachInternalsTo(this);
  readonly #observer = new MutationObserver(() => {
    this.#apply(this.#model.batch());
  });
  readonly #model = new SelectionModel<OcelleOption>("listbox", {
    read: () => this.#options().map((node, index): Entry<OcelleOption> => ({ node, value: childValue(node.getAttribute("value"), index), disabled: node.hasAttribute("disabled") })),
    take: () => this.#observer.takeRecords().map((record) => [...record.removedNodes].filter((node): node is OcelleOption => node instanceof OcelleOption)),
  });
  /** The options this listbox wrote attributes on, so it can remove them from an option that leaves. */
  #owned = new Set<OcelleOption>();

  constructor() {
    super();
    exposeAs(this.#internals, "listbox");
    new RovingController(this, {
      axis: "block",
      wrap: false,
      children: () => this.#model.entries.map((entry) => entry.node),
      enabled: (child) => !child.hasAttribute("disabled"),
      choose: (child, key) => {
        this.#choose(child as OcelleOption, key);
      },
    });
    this.addEventListener("focusin", this.#focusin, { capture: true });
    this.addEventListener("focusout", this.#focusout, { capture: true });
    this.addEventListener("mousedown", this.#mousedown);
    this.addEventListener("click", this.#click);
    this.addEventListener("dblclick", this.#dblclick);
  }

  /**
   * The selected option's value, `""` when none. Setting it selects the first enabled option with the value; `""` or a
   * value no enabled option has clears the selection, and a non-empty such value is remembered until an option with it
   * appears or is enabled. A set never emits an event; setting the current value changes nothing. Not reflected.
   *
   * @default ""
   */
  get value(): string {
    return this.#model.value;
  }

  set value(value: string) {
    this.#model.set(value);
    this.#apply(null);
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "value") {
      if (old !== value) this.value = value ?? "";
      return;
    }
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "disabled"] });
    this.#apply(this.#model.batch());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  protected override updated(): void {
    this.#internals.ariaLabel = accessibleName(this.label, this.getAttribute("aria-label")) ?? null;
  }

  protected override render(): unknown {
    return html`<div part="list" tabindex="-1"><slot></slot></div>`;
  }

  /** The host's `ocelle-option` children, in document order. */
  #options(): OcelleOption[] {
    return [...this.children].filter((child): child is OcelleOption => child.localName === "ocelle-option");
  }

  /** Writes the states on the options where they differ, then moves focus to `focus` when it does not have it. */
  #apply(focus: OcelleOption | null): void {
    const stop = this.#model.tabStop();
    const present = new Set<OcelleOption>();
    for (const { node, disabled } of this.#model.entries) {
      present.add(node);
      write(node, "aria-selected", node === this.#model.selected ? "true" : "false");
      write(node, "aria-disabled", disabled ? "true" : null);
      write(node, "tabindex", node === stop ? "0" : "-1");
    }
    for (const node of this.#owned) if (!present.has(node)) for (const name of written) node.removeAttribute(name);
    this.#owned = present;
    if (focus !== null && !focus.matches(":focus")) focus.focus();
  }

  /** The option of the listbox an event came from, or null. */
  #optionOf(event: Event): OcelleOption | null {
    const entries = this.#model.entries;
    for (const node of event.composedPath()) {
      const found = entries.find((entry) => entry.node === node);
      if (found !== undefined) return found.node;
    }
    return null;
  }

  #isDisabled(option: OcelleOption): boolean {
    return this.#model.entries.find((entry) => entry.node === option)?.disabled === true;
  }

  /** A user selection of `option`, with the change event when it changed the selection. */
  #select(option: OcelleOption): void {
    const changed = this.#model.select(option);
    this.#apply(null);
    if (changed) this.#emit("change", this.#model.value);
  }

  #emit(action: "change" | "activate", value: string): void {
    this.dispatchEvent(valueEvent(`ocelle-listbox-${action}`, value));
  }

  #choose(option: OcelleOption, key: "Enter" | " "): void {
    if (this.#isDisabled(option)) return;
    if (key === "Enter" && option === this.#model.selected) this.#emit("activate", option.value);
    else this.#select(option);
  }

  readonly #focusin = (event: FocusEvent): void => {
    const option = this.#optionOf(event);
    if (option === null || event.target !== option) return;
    this.#model.focusIn(option);
    this.#apply(null);
  };

  readonly #focusout = (event: FocusEvent): void => {
    const option = this.#optionOf(event);
    if (option === null || event.target !== option) return;
    if (this.#model.focusOut(option, event.relatedTarget)) {
      queueMicrotask(() => {
        const active = document.activeElement;
        this.#apply(this.#model.afterBlur(active === null || active === document.body));
      });
    }
  };

  readonly #mousedown = (event: MouseEvent): void => {
    const option = this.#optionOf(event);
    const onList = event.composedPath()[0] === this.renderRoot.querySelector('[part="list"]');
    if (onList || (option !== null && this.#isDisabled(option))) event.preventDefault();
  };

  readonly #click = (event: MouseEvent): void => {
    const option = this.#optionOf(event);
    if (option !== null && !this.#isDisabled(option)) this.#select(option);
  };

  readonly #dblclick = (event: MouseEvent): void => {
    const option = this.#optionOf(event);
    if (option !== null && !this.#isDisabled(option)) this.#emit("activate", option.value);
  };
}

/** Sets the element's role through its internals. */
function exposeAs(internals: ElementInternals, role: string): void {
  internals.role = role;
}

/** The listbox's events: `detail` `{ value }`, bubbling and composed, not cancelable. */
function valueEvent(name: string, value: string): CustomEvent<{ value: string }> {
  return new CustomEvent(name, { detail: { value }, bubbles: true, composed: true });
}

/** Sets (or with null removes) an attribute of `element` only when it differs, so a no-op writes nothing. */
function write(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

define("ocelle-listbox", OcelleListbox);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-listbox": OcelleListbox;
  }
}
