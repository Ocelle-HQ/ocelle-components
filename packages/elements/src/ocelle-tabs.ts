// `ocelle-tabs` (014 FR-001 to FR-011a, FR-019 to FR-025, FR-021a, FR-006's tabs exception; research.md R-01 to R-05,
// R-15, R-16; data-model.md): a tablist of the `ocelle-tab` children the host writes in its own markup, with their
// `ocelle-tab-panel` panels, paired by order. The children stay in the page's tree scope, beside each other, so nothing
// crosses a shadow root:
// - the host has no role. The shadow root uses manual slot assignment and holds `part="tablist"`, which carries
//   `role="tablist"` and the name from `label` only (trimmed, blank as none; a host `aria-label` is not read, forwarded
//   or observed, and the element writes no attribute on its host, operator decision during phase 3), and beside it
//   `part="panels"`. On each batch the paired tabs are assigned to the tablist's slot and only the selected tab's panel
//   to the panels' slot, so unselected panels and unpaired tabs and panels have no box and no node;
// - the association by generated ids in the page's own scope (R-02): an `id` on each paired tab and panel that has none
//   (`ocelle-tabs-<n>-tab-<i>`, `ocelle-tabs-<n>-panel-<i>`; a child's own id is kept and used), `aria-controls` on
//   every paired tab and `aria-labelledby` on the shown panel only (axe-core 4.14.0 throws in `color-contrast` on a tab
//   named by an unassigned panel, reviews/phase-3/spike.md);
// - the child list from a `MutationObserver` on the host, one batch per microtask checkpoint, through `SelectionModel`
//   (src/selection.ts, kind `tabs`: exactly one tab selected while one is enabled); the tabs write `aria-selected`,
//   `aria-disabled`, `aria-controls` and `tabindex` on their tabs and `aria-labelledby` and `tabindex` on the shown
//   panel, only where they differ, and remove them, and the ids they generated, from children that leave or lose their
//   partner;
// - one tab stop, the selected tab; the keys of `RovingController` (src/roving.ts): ArrowRight and ArrowLeft (swapped
//   under right-to-left) move focus and selection with wrapping, Home and End to the ends; Enter and Space select a
//   focused unselected tab; every other key, and every key pressed in a panel, is left to the page;
// - a click selects an enabled tab; a `mousedown` on a disabled tab has its default prevented, so it takes no focus;
// - the focus record (R-03): a capture-phase `focusin` / `focusout` listener on the host, so a removal or a move of the
//   focused tab keeps focus (or moves it with the selection), and a user leaving by Tab or a click is never brought back;
// - the shown panel is the tab stop after its tab (`tabindex="0"`) only while it holds nothing in the sequential focus
//   order, focusables inside open shadow roots included, re-measured on each batch and on a subtree `MutationObserver`
//   of the shown panel (R-03).
// The tab row wraps onto further rows (FR-022) and is padded by the focus ring's width and offset, so the ring of any
// tab lies inside the element. Importing this module defines `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel`.
import { LitElement, css, html, nothing } from "lit";
import { define } from "./define.ts";
import { accessibleName } from "./naming.ts";
import { OcelleTabPanel } from "./ocelle-tab-panel.ts";
import { OcelleTab } from "./ocelle-tab.ts";
import { RovingController } from "./roving.ts";
import { SelectionModel, childValue } from "./selection.ts";
import type { Entry } from "./selection.ts";

/** The attributes the tabs write on their tabs and on their panels. */
const written = ["aria-selected", "aria-disabled", "aria-controls", "aria-labelledby", "tabindex"];

/** The attributes of a panel's content that change whether it holds a focusable (R-03). */
const focusability = [
  "tabindex",
  // Stryker disable next-line StringLiteral: equivalent, the host's own observer follows `disabled` in the whole subtree
  "disabled",
  "href",
  "hidden",
  "contenteditable",
];

/** The per-document number of the next tabs, for the ids they generate. */
let count = 0;

/**
 * A tablist of `ocelle-tab` children and their `ocelle-tab-panel` panels, paired by order; one tab stop, keyboard and
 * pointer selection, selection following focus.
 *
 * @tagname ocelle-tabs
 * @slot - The `ocelle-tab` and `ocelle-tab-panel` children, in any interleaving; they pair by order among their kind.
 * @csspart tablist - The row of the tabs, which wraps onto further rows.
 * @csspart panels - The container of the shown panel, beside the tablist.
 * @fires {CustomEvent<{ value: string }>} ocelle-tabs-change - The user selected another tab (an arrow key, Home, End, Enter, Space or a click); `value` already reads it.
 */
export class OcelleTabs extends LitElement {
  /**
   * Manual slot assignment (research.md R-05): the tabs assign their children to the two slots themselves.
   *
   * @internal
   */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: "manual" };

  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent, `value` is the class's own accessor and its attribute is handled in attributeChangedCallback; the entry names the attribute for Lit and the manifest
    value: { type: String, noAccessor: true },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part="tablist"] {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      padding: calc(var(--ocelle-focus-width) + var(--ocelle-focus-offset));
    }
  `;

  /**
   * The tablist's accessible name, trimmed; empty or whitespace-only counts as none. The tabs' only name source: a host
   * `aria-label` does not name the tablist. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  // Stryker disable next-line AssignmentOperator: equivalent, counting down gives every tabs on the page a distinct number too
  readonly #number = (count += 1);
  /** The ids the tabs generated, per child, so a child's own id is never touched. */
  readonly #generated = new WeakMap<Element, string>();
  readonly #observer = new MutationObserver((records) => {
    this.#apply(this.#model.delivered(removedOf(records), focusLeft()));
  });
  readonly #panelObserver = new MutationObserver(() => {
    this.#measure();
  });
  readonly #model = new SelectionModel<OcelleTab>("tabs", {
    read: () => this.#paired().map((node, index): Entry<OcelleTab> => ({ node, value: childValue(node.getAttribute("value"), index), disabled: node.hasAttribute("disabled") })),
    take: () => removedOf(this.#observer.takeRecords()),
  });
  /** The children the tabs wrote attributes on, so they can remove them from a child that leaves. */
  #owned = new Set<Element>();
  /** The shown panel, observed for its focusables. */
  #shown: OcelleTabPanel | null = null;

  constructor() {
    super();
    new RovingController(this, {
      axis: "inline",
      wrap: true,
      children: () => this.#model.entries.map((entry) => entry.node),
      enabled: (child) => !child.hasAttribute("disabled"),
      choose: (child) => {
        this.#select(child as OcelleTab);
      },
      moved: (child) => {
        this.#select(child as OcelleTab);
      },
    });
    this.addEventListener("focusin", this.#focusin, { capture: true });
    this.addEventListener("focusout", this.#focusout, { capture: true });
    this.addEventListener("mousedown", this.#mousedown);
    this.addEventListener("click", this.#click);
  }

  /**
   * The selected tab's value; `""` only while no tab is enabled. Setting it selects the first enabled tab with the
   * value; `""` or a value no enabled tab has keeps the selection, and a non-empty such value is remembered until a tab
   * with it appears or is enabled. A set never emits an event; setting the current value changes nothing. Not
   * reflected.
   *
   * @default the first enabled tab's value
   */
  get value(): string {
    return this.#model.value;
  }

  set value(value: string) {
    this.#apply(this.#model.set(value, focusLeft()));
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    // Stryker disable next-line ConditionalExpression,BlockStatement,StringLiteral,LogicalOperator: equivalent, Lit's own path sets the same accessor from the attribute, and a removed attribute (null) keeps the selection as "" does
    if (name === "value") {
      // Stryker disable next-line StringLiteral: equivalent, a removed attribute keeps the selection with any value no tab has; only what is remembered differs, and no tab has the replacement value
      this.value = value ?? "";
      return;
    }
    super.attributeChangedCallback(name, old, value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "disabled"] });
    this.#apply(this.#model.batch());
  }

  protected override firstUpdated(): void {
    this.#apply(null);
  }

  protected override render(): unknown {
    const name = accessibleName(this.label, null);
    return html`<div part="tablist" role="tablist" aria-label=${name ?? nothing}><slot></slot></div><div part="panels"><slot></slot></div>`;
  }

  /** The host's children of `kind`, in document order. */
  #children<T extends Element>(kind: string): T[] {
    return [...this.children].filter((child): child is T => child.localName === kind);
  }

  /** The tabs that have a partner panel, in document order. */
  #paired(): OcelleTab[] {
    const panels = this.#children("ocelle-tab-panel").length;
    return this.#children<OcelleTab>("ocelle-tab").slice(0, panels);
  }

  /** The id of `element`: its own, or the one the tabs generate for its place. */
  #idOf(element: Element, id: string): string {
    const generated = this.#generated.get(element);
    if (element.id !== "" && element.id !== generated) return element.id;
    write(element, "id", id);
    this.#generated.set(element, id);
    return id;
  }

  /** Removes what the tabs wrote on a child that left or lost its partner, a generated id included. */
  #release(element: Element): void {
    for (const name of written) element.removeAttribute(name);
    if (element.id === this.#generated.get(element)) element.removeAttribute("id");
  }

  /** Writes the states and the association where they differ, shows the selected panel, then moves focus to `focus`. */
  #apply(focus: OcelleTab | null): void {
    const panels = this.#children<OcelleTabPanel>("ocelle-tab-panel");
    const selected = this.#model.selected;
    const stop = this.#model.tabStop();
    const present = new Set<Element>();
    let shown: OcelleTabPanel | null = null;
    const entries = this.#model.entries;
    panels.forEach((panel, index) => {
      // The entries are the paired tabs; a panel past them has no partner.
      const entry = entries[index];
      if (entry === undefined) return;
      const { node, disabled } = entry;
      present.add(node).add(panel);
      const tabId = this.#idOf(node, `ocelle-tabs-${String(this.#number)}-tab-${String(index)}`);
      const panelId = this.#idOf(panel, `ocelle-tabs-${String(this.#number)}-panel-${String(index)}`);
      write(node, "aria-selected", node === selected ? "true" : "false");
      write(node, "aria-disabled", disabled ? "true" : null);
      write(node, "tabindex", node === stop ? "0" : "-1");
      write(node, "aria-controls", panelId);
      write(panel, "aria-labelledby", node === selected ? tabId : null);
      if (node === selected) shown = panel;
      else write(panel, "tabindex", null);
    });
    for (const node of this.#owned) if (!present.has(node)) this.#release(node);
    this.#owned = present;
    this.#show(shown);
    if (focus !== null && !focus.matches(":focus")) focus.focus();
  }

  /** Assigns the paired tabs and the shown panel to their slots, and observes the shown panel's content. */
  #show(panel: OcelleTabPanel | null): void {
    // Before the element is first connected (a `value` attribute read at upgrade) there is no render root yet.
    const [tablist, panels] = (this.renderRoot as ShadowRoot | undefined)?.querySelectorAll("slot") ?? [];
    tablist?.assign(...this.#model.entries.map((entry) => entry.node));
    panels?.assign(...(panel === null ? [] : [panel]));
    // Stryker disable next-line ConditionalExpression: equivalent, observing the shown panel again changes nothing
    if (panel !== this.#shown) {
      // Stryker disable next-line CallExpression: equivalent, the observer's callback measures the shown panel only, so an old panel still observed changes nothing
      this.#panelObserver.disconnect();
      if (panel !== null) {
        this.#panelObserver.observe(panel, {
          // Stryker disable next-line BooleanLiteral: equivalent, the host's own observer (`childList` with `subtree`) already follows the panel's child lists
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: focusability,
        });
      }
      this.#shown = panel;
    }
    this.#measure();
  }

  /** Makes the shown panel the tab stop after its tab only while it holds nothing focusable (FR-023). */
  #measure(): void {
    const panel = this.#shown;
    if (panel !== null) write(panel, "tabindex", holdsFocusable(panel) ? null : "0");
  }

  /** The tab of the tabs that `target` is, or null. */
  #childOf(target: EventTarget | null): OcelleTab | null {
    return this.#model.entries.find((entry) => entry.node === target)?.node ?? null;
  }

  /** The tab of the tabs an event came from, or null (an event from a panel's content has none). */
  #tabOf(event: Event): OcelleTab | null {
    const entries = this.#model.entries;
    for (const node of event.composedPath()) {
      const found = entries.find((entry) => entry.node === node);
      if (found !== undefined) return found.node;
    }
    return null;
  }

  #isDisabled(tab: OcelleTab): boolean {
    return this.#model.entries.find((entry) => entry.node === tab)?.disabled === true;
  }

  /** A user selection of `tab`, with the change event when it changed the selection. */
  #select(tab: OcelleTab): void {
    const changed = this.#model.select(tab);
    this.#apply(null);
    if (changed) this.dispatchEvent(new CustomEvent("ocelle-tabs-change", { detail: { value: this.#model.value }, bubbles: true, composed: true }));
  }

  readonly #focusin = (event: FocusEvent): void => {
    const tab = this.#childOf(event.target);
    if (tab === null) return;
    this.#model.focusIn(tab);
  };

  readonly #focusout = (event: FocusEvent): void => {
    const tab = this.#childOf(event.target);
    if (tab === null) return;
    if (this.#model.focusOut(tab, event.relatedTarget)) {
      queueMicrotask(() => {
        this.#apply(this.#model.afterBlur(focusLeft()));
      });
    }
  };

  readonly #mousedown = (event: MouseEvent): void => {
    const tab = this.#tabOf(event);
    if (tab !== null && this.#isDisabled(tab)) event.preventDefault();
  };

  readonly #click = (event: MouseEvent): void => {
    const tab = this.#tabOf(event);
    if (tab !== null && !this.#isDisabled(tab)) this.#select(tab);
  };
}

/** The tabs each record removed, one list per record. */
function removedOf(records: readonly MutationRecord[]): OcelleTab[][] {
  return records.map((record) => [...record.removedNodes].filter((node): node is OcelleTab => node instanceof OcelleTab));
}

/** Whether focus has left for nowhere: `document.activeElement` is the body or null (research R-03). */
function focusLeft(): boolean {
  const active = document.activeElement;
  // Stryker disable next-line ConditionalExpression,LogicalOperator: equivalent in Chromium, which reports the body, never null, when nothing has focus (phase 2 review round 1, R1-03); kept for engines that report null
  return active === null || active === document.body;
}

/**
 * Whether `element` is in the sequential focus order by itself: not disabled; an editing host with no `tabindex` (its
 * `tabIndex` reads -1 in Chromium, yet Tab reaches it); not an anchor without `href` or `tabindex` (whose `tabIndex`
 * reads 0 in Chromium, yet Tab passes it); else a non-negative tab index. Read from the element, not from layout: a
 * panel's content may not be rendered yet when the tabs measure it (its own shadow root renders in a later microtask).
 */
function sequential(element: HTMLElement): boolean {
  if (element.matches(":disabled")) return false;
  const tabindex = element.hasAttribute("tabindex");
  if (element.isContentEditable && !tabindex) return true;
  if (element.localName === "a" && !element.hasAttribute("href") && !tabindex) return false;
  return element.tabIndex >= 0;
}

/**
 * Whether `parent` (the panel, then each descendant) holds an element in the sequential focus order, through open
 * shadow roots too (R-03). A `hidden` subtree is left out, and so is a child of a shadow host that is assigned to no
 * slot (a nested tabs' unselected panel); the panel's own children are counted before its slot has rendered.
 */
function holdsFocusable(parent: Element | ShadowRoot, panel = true): boolean {
  for (const child of parent.children) {
    if (child.hasAttribute("hidden")) continue;
    if (!panel && parent instanceof Element && parent.shadowRoot !== null && child.assignedSlot === null) continue;
    if (child instanceof HTMLElement && sequential(child)) return true;
    // Stryker disable next-line BooleanLiteral: equivalent, the children of a shadow root have no shadow host as their parent, so the slot check never applies to them
    if (child.shadowRoot !== null && holdsFocusable(child.shadowRoot, false)) return true;
    if (holdsFocusable(child, false)) return true;
  }
  return false;
}

/** Sets (or with null removes) an attribute of `element` only when it differs, so a no-op writes nothing. */
function write(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

define("ocelle-tabs", OcelleTabs);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tabs": OcelleTabs;
  }
}
