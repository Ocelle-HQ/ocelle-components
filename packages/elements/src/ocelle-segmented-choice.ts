// `ocelle-segmented-choice` (014 FR-001 to FR-011a, FR-026 to FR-030; research.md R-01, R-03 to R-06, R-15, R-16;
// data-model.md): a toolbar of the `ocelle-segment` toggle buttons the host writes in its own markup, exactly one of
// them pressed. The segments stay in the page's tree scope, slotted into the shadow root, so nothing crosses a shadow
// root:
// - role `toolbar`, horizontal, and the name (`label`, trimmed, or a host `aria-label`, which decides alone) through
//   internals, kept under the internals symbol axe reads;
// - the child list from a `MutationObserver` on the host (child list, and the segments' `value` and `disabled`), one
//   batch per microtask checkpoint, through `SelectionModel` (src/selection.ts, kind `segments`: exactly one segment
//   pressed while one is enabled); the group writes `aria-pressed`, `aria-disabled` and `tabindex` on its segments, only
//   where they differ, and removes them from segments that leave;
// - one tab stop, the pressed segment; the keys of `RovingController` (src/roving.ts): the arrows (Right and Down
//   forward, Left and Up back, Left and Right swapped under right-to-left) move focus only, with wrapping, Home and End
//   to the ends; Enter and Space press the focused segment; every other key is left to the page;
// - a click presses an enabled segment; a `mousedown` on a disabled segment has its default prevented, so it takes no
//   focus;
// - the focus record (R-03): a capture-phase `focusin` / `focusout` listener on the host, so a removal or a move of the
//   focused segment keeps focus (or moves it with the press), and a user leaving by Tab or a click is never brought back;
// - `joined` (R-06): one `ResizeObserver` on the group and every segment while joined, observed again after each batch,
//   so a resize of the group, a segment's size change at the same group size and a child-list change all regroup at
//   the delivery of the frame that renders them. The
//   segments are put in rows by their `offsetTop`, and each gets its row states through the segment's feature-checked
//   internal method (`rowStates`). No `style` attribute is ever written. The states change only radii, so a regroup
//   never moves a row break and the observer never loops.
// The group pads its block-start and inline-start sides by one border width while joined, as the segments' negative
// margins overlap their lines. Importing this module defines `ocelle-segmented-choice` and `ocelle-segment`.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { attachInternalsTo, rowStates } from "./internals.ts";
import { accessibleName } from "./naming.ts";
import { OcelleSegment } from "./ocelle-segment.ts";
import { RovingController } from "./roving.ts";
import { SelectionModel, childValue } from "./selection.ts";
import type { Row } from "./ocelle-segment.ts";
import type { Entry } from "./selection.ts";

/** The attributes the group writes on its segments. */
const written = ["aria-pressed", "aria-disabled", "tabindex"];

/**
 * A toolbar of `ocelle-segment` toggle buttons, exactly one pressed; one tab stop, keyboard and pointer pressing, and a
 * joined variant that rounds each row's ends itself.
 *
 * @tagname ocelle-segmented-choice
 * @slot - The `ocelle-segment` children.
 * @fires {CustomEvent<{ value: string }>} ocelle-segmented-choice-change - The user pressed another segment (Enter, Space or a click); `value` already reads it.
 */
export class OcelleSegmentedChoice extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    joined: { type: Boolean, reflect: true },
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent, {} is the default options of type String (attribute "value", the default converter) and without `noAccessor` Lit wraps the class's own accessor, which it still calls
    value: { type: String, noAccessor: true },
  };

  /** `aria-label` is observed, not a property: a host `aria-label` names the toolbar (FR-006), so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: var(--ocelle-space-2);
    }

    :host([hidden]) {
      display: none;
    }

    :host([joined]) {
      gap: 0;
      padding-block-start: var(--ocelle-border-width);
      padding-inline-start: var(--ocelle-border-width);
    }
  `;

  /**
   * The toolbar's accessible name, trimmed; empty or whitespace-only counts as none, and a host `aria-label` decides
   * over it. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The joined variant: the segments touch with one shared line between neighbours and between rows, and only each
   * row's first and last segments have rounded outer corners, recomputed by the element when it wraps. Reflected.
   *
   * @default false
   */
  declare joined: boolean;

  readonly #internals = attachInternalsTo(this);
  readonly #observer = new MutationObserver((records) => {
    this.#apply(this.#model.delivered(removedOf(records), focusLeft()));
  });
  readonly #sizes = new ResizeObserver(() => {
    this.#regroup();
  });
  readonly #model = new SelectionModel<OcelleSegment>("segments", {
    read: () => this.#segments().map((node, index): Entry<OcelleSegment> => ({ node, value: childValue(node.getAttribute("value"), index), disabled: node.hasAttribute("disabled") })),
    take: () => removedOf(this.#observer.takeRecords()),
  });
  /** The segments this group wrote attributes on, so it can remove them from a segment that leaves. */
  #owned = new Set<OcelleSegment>();

  constructor() {
    super();
    this.joined = false;
    exposeAs(this.#internals, "toolbar");
    new RovingController(this, {
      axis: "both",
      wrap: true,
      children: () => this.#model.entries.map((entry) => entry.node),
      enabled: (child) => !child.hasAttribute("disabled"),
      choose: (child) => {
        this.#press(child as OcelleSegment);
      },
    });
    this.addEventListener("focusin", this.#focusin, { capture: true });
    this.addEventListener("focusout", this.#focusout, { capture: true });
    this.addEventListener("mousedown", this.#mousedown);
    this.addEventListener("click", this.#click);
  }

  /**
   * The pressed segment's value; `""` only while no segment is enabled. Setting it presses the first enabled segment
   * with the value; `""` or a value no enabled segment has keeps the press, and a non-empty such value is remembered
   * until a segment with it appears or is enabled. A set never emits an event; setting the current value changes
   * nothing. Not reflected.
   *
   * @default the first enabled segment's value
   */
  get value(): string {
    return this.#model.value;
  }

  // The `value` attribute reaches this setter through Lit's own attribute path; a removed attribute arrives as null,
  // which no segment has, so the press is kept and nothing is remembered.
  set value(value: string) {
    this.#apply(this.#model.set(value, focusLeft()));
  }

  /** A change of a host `aria-label`, which no property follows, updates the element too, so the name follows it (FR-006). */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "disabled"] });
    this.#apply(this.#model.batch());
  }

  protected override updated(): void {
    // Stryker disable next-line StringLiteral: equivalent in Chromium, which names the host from a present aria-label, blank or not, whatever the internals say (WebKit is not measured)
    this.#internals.ariaLabel = accessibleName(this.label, this.getAttribute("aria-label")) ?? null;
    this.#observe();
    this.#regroup();
  }

  protected override render(): unknown {
    return html`<slot></slot>`;
  }

  /** The host's `ocelle-segment` children, in document order. */
  #segments(): OcelleSegment[] {
    return [...this.children].filter((child): child is OcelleSegment => child.localName === "ocelle-segment");
  }

  /** Writes the states on the segments where they differ, observes their sizes, then moves focus to `focus` when it does not have it. */
  #apply(focus: OcelleSegment | null): void {
    const stop = this.#model.tabStop();
    const present = new Set<OcelleSegment>();
    for (const { node, disabled } of this.#model.entries) {
      present.add(node);
      write(node, "aria-pressed", node === this.#model.selected ? "true" : "false");
      write(node, "aria-disabled", disabled ? "true" : null);
      write(node, "tabindex", node === stop ? "0" : "-1");
    }
    for (const node of this.#owned) {
      if (present.has(node)) continue;
      for (const name of written) node.removeAttribute(name);
      setRows(node, null);
    }
    this.#owned = present;
    // Observing the segments again also delivers their sizes at the next rendering, and that delivery regroups: a child
    // batch that moves a row break at the same group size (a text change, a segment added or removed) is rounded in the
    // frame that renders it.
    this.#observe();
    if (focus !== null && !focus.matches(":focus")) focus.focus();
  }

  /**
   * While joined and connected, observes the group's content box and every segment's border box (a host rule that
   * changes only a segment's padding or border moves a row break too); otherwise nothing.
   */
  #observe(): void {
    // Stryker disable next-line CallExpression: equivalent, observing a target again restarts its observation anyway; the call only drops the observations of segments that left and of a group no longer joined, whose deliveries regroup the group's own segments to the states they have
    this.#sizes.disconnect();
    // Stryker disable next-line ConditionalExpression,LogicalOperator: equivalent, observing a group that is not joined, or not connected, only delivers sizes whose regroup sets no state (`setRows(…, null)` on segments that have none)
    if (!this.joined || !this.isConnected) return;
    this.#sizes.observe(this);
    for (const { node } of this.#model.entries) this.#sizes.observe(node, { box: "border-box" });
  }

  /** Puts the segments in rows by their `offsetTop` and sets each one's row states (R-06). */
  #regroup(): void {
    const segments = this.#model.entries.map((entry) => entry.node);
    const tops = segments.map((node) => node.offsetTop);
    segments.forEach((node, index) => {
      const top = tops[index];
      setRows(node, this.joined ? { start: tops[index - 1] !== top, end: tops[index + 1] !== top } : null);
    });
  }

  /** The segment of the group that `target` is, or null. */
  #childOf(target: EventTarget | null): OcelleSegment | null {
    return this.#model.entries.find((entry) => entry.node === target)?.node ?? null;
  }

  /** The segment of the group an event came from, or null. */
  #segmentOf(event: Event): OcelleSegment | null {
    const entries = this.#model.entries;
    for (const node of event.composedPath()) {
      const found = entries.find((entry) => entry.node === node);
      if (found !== undefined) return found.node;
    }
    return null;
  }

  #isDisabled(segment: OcelleSegment): boolean {
    return this.#model.entries.find((entry) => entry.node === segment)?.disabled === true;
  }

  /** A user press of `segment`, with the change event when it changed the press. */
  #press(segment: OcelleSegment): void {
    const changed = this.#model.select(segment);
    this.#apply(null);
    if (changed) this.dispatchEvent(new CustomEvent("ocelle-segmented-choice-change", { detail: { value: this.#model.value }, bubbles: true, composed: true }));
  }

  readonly #focusin = (event: FocusEvent): void => {
    const segment = this.#childOf(event.target);
    if (segment === null) return;
    this.#model.focusIn(segment);
  };

  readonly #focusout = (event: FocusEvent): void => {
    const segment = this.#childOf(event.target);
    if (segment === null) return;
    if (this.#model.focusOut(segment, event.relatedTarget)) {
      queueMicrotask(() => {
        this.#apply(this.#model.afterBlur(focusLeft()));
      });
    }
  };

  readonly #mousedown = (event: MouseEvent): void => {
    const segment = this.#segmentOf(event);
    if (segment !== null && this.#isDisabled(segment)) event.preventDefault();
  };

  readonly #click = (event: MouseEvent): void => {
    const segment = this.#segmentOf(event);
    if (segment !== null && !this.#isDisabled(segment)) this.#press(segment);
  };
}

/** Sets the element's role through its internals (a toolbar is horizontal unless it says otherwise). */
function exposeAs(internals: ElementInternals, role: string): void {
  internals.role = role;
}

/**
 * Sets a segment's row states through its internal method, when it has one (an upgraded segment of this copy): its
 * place in its row while the group is joined, null otherwise.
 */
function setRows(segment: OcelleSegment, row: Row | null): void {
  const method = (segment as Partial<Record<typeof rowStates, unknown>>)[rowStates];
  if (typeof method === "function") (method as (row: Row | null) => void).call(segment, row);
}

/** The segments each record removed, one list per record. */
function removedOf(records: readonly MutationRecord[]): OcelleSegment[][] {
  return records.map((record) => [...record.removedNodes].filter((node): node is OcelleSegment => node instanceof OcelleSegment));
}

/** Whether focus has left for nowhere: `document.activeElement` is the body or null (research R-03). */
function focusLeft(): boolean {
  const active = document.activeElement;
  // Stryker disable next-line ConditionalExpression,LogicalOperator: equivalent in Chromium, which reports the body, never null, when nothing has focus (phase 2 review round 1, R1-03); kept for engines that report null
  return active === null || active === document.body;
}

/** Sets (or with null removes) an attribute of `element` only when it differs, so a no-op writes nothing. */
function write(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

define("ocelle-segmented-choice", OcelleSegmentedChoice);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-segmented-choice": OcelleSegmentedChoice;
  }
}
