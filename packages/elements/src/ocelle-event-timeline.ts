// `ocelle-event-timeline` (019 FR-001, FR-016, FR-020 to FR-027; contracts/ocelle-event-timeline.md; research.md R-08
// to R-10; reviews/phase-2/spike.md): an event history, one ordered list of its `ocelle-timeline-event` children.
// - Structure (R-08): an open shadow root with manual slot assignment renders, with one or more visible events (direct
//   children with the item tag, neither `hidden` nor `aria-hidden="true"`, in source order), one `<ol part="list"
//   role="list">` with a `<li role="listitem">` per event holding the decorative marker (`.marker-line`, aria-hidden,
//   around the `.marker` dot), a decorative `.connector` span (aria-hidden; none on the last item) and a slot the
//   event is assigned to after each render. With no visible event nothing is rendered. The explicit roles keep the
//   list semantics in WebKit, which drops an unstyled list's role.
// - Name (R-09): `resolveName(host aria-label, label)` of the overflow-region module, on the `<ol>`; a blank host
//   `aria-label` counts as absent.
// - Classes (R-10): `has-time` on an item whose event has a time and `next-has-time` on one whose next visible event
//   has one, both from the internal `hasTime`, which counts a slotted time. One `MutationObserver` watches the events'
//   subtrees (`childList`, `characterData`, and the attributes `hidden`, `aria-hidden`, `time` and `slot`) and
//   re-renders, so an event added, removed, hidden or shown and a slotted time filled, emptied, hidden or moved all
//   re-decide them.
// - Look (R-10; spike Q3 (a)): each item a grid of the `--ocelle-size-dot` marker column and the event, a
//   `--ocelle-space-3` gap; the dot centred on the event's first line in a `1lh` wrapper set to the time's type or the
//   content's; the dot a round `--ocelle-size-dot` box drawn by one whole border side (`border-block-start`, so no
//   unpainted centre and forced colours draw it); the connector a `--ocelle-border-width` inline-start border in
//   `--ocelle-color-rule-strong` (decorative), gapped `--ocelle-space-1` from both dots by `calc()` insets over the two
//   items' types. Every position is logical, so `dir="rtl"` mirrors it; in forced colours both marks are `CanvasText`.
// Importing this module defines `ocelle-event-timeline` and, as a container module, its item element
// `ocelle-timeline-event`.
import { LitElement, css, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import "./ocelle-timeline-event.ts";
import { resolveName } from "./overflow-region.ts";
import { hasTime } from "./timeline-time.ts";

/** Whether a child of the timeline is one of its visible events: an `ocelle-timeline-event` neither `hidden` nor `aria-hidden="true"`. */
function isEvent(child: Element): boolean {
  return child.localName === "ocelle-timeline-event" && !child.hasAttribute("hidden") && child.getAttribute("aria-hidden") !== "true";
}

/**
 * An event history: one ordered list of its `ocelle-timeline-event` children, in source order, each with a dot on a
 * line that joins the events.
 *
 * @tagname ocelle-event-timeline
 * @slot - The events, `ocelle-timeline-event` elements, in source order. Other children, and events with `hidden` or `aria-hidden="true"`, are not shown.
 * @csspart list - The ordered list.
 */
export class OcelleEventTimeline extends LitElement {
  /** Manual slot assignment: the timeline assigns each event to its item's slot (internal). @ignore */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: "manual" };

  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `aria-label` is observed, not a property: a non-blank host `aria-label` names the list, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    ol {
      display: grid;
      row-gap: var(--ocelle-space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      position: relative;
      display: grid;
      grid-template-columns: var(--ocelle-size-dot) minmax(0, 1fr);
      column-gap: var(--ocelle-space-3);
      align-items: start;
    }

    ::slotted(*) {
      min-inline-size: 0;
    }

    .marker-line {
      display: flex;
      align-items: center;
      block-size: 1lh;
      font-size: var(--ocelle-font-size-sm);
      line-height: var(--ocelle-line-height-normal);
    }

    li.has-time .marker-line {
      font-size: var(--ocelle-font-size-xs);
    }

    .marker {
      box-sizing: border-box;
      inline-size: var(--ocelle-size-dot);
      block-size: var(--ocelle-size-dot);
      border-block-start: var(--ocelle-size-dot) solid var(--ocelle-color-ink-muted);
      border-radius: 50%;
    }

    .connector {
      position: absolute;
      inset-block-start: calc((var(--ocelle-font-size-sm) * var(--ocelle-line-height-normal) + var(--ocelle-size-dot)) / 2 + var(--ocelle-space-1));
      inset-block-end: calc(var(--ocelle-space-1) - var(--ocelle-space-3) - (var(--ocelle-font-size-sm) * var(--ocelle-line-height-normal) - var(--ocelle-size-dot)) / 2);
      inset-inline-start: calc((var(--ocelle-size-dot) - var(--ocelle-border-width)) / 2);
      inline-size: 0;
      border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-rule-strong);
    }

    li.has-time .connector {
      inset-block-start: calc((var(--ocelle-font-size-xs) * var(--ocelle-line-height-normal) + var(--ocelle-size-dot)) / 2 + var(--ocelle-space-1));
    }

    li.next-has-time .connector {
      inset-block-end: calc(var(--ocelle-space-1) - var(--ocelle-space-3) - (var(--ocelle-font-size-xs) * var(--ocelle-line-height-normal) - var(--ocelle-size-dot)) / 2);
    }

    @media (forced-colors: active) {
      .marker,
      .connector {
        border-color: CanvasText;
      }
    }
  `;

  /**
   * Names the list when the host has no non-blank `aria-label`; not shown. Trimmed; empty or white space counts as
   * absent.
   *
   * @default undefined
   */
  declare label: string | undefined;

  readonly #mutations = new MutationObserver(() => {
    this.requestUpdate();
  });

  override connectedCallback(): void {
    super.connectedCallback();
    this.#mutations.observe(this, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "time", "slot"] });
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
    super.disconnectedCallback();
    // Stryker disable next-line CallExpression: equivalent, a kept observer re-renders a timeline out of the document, which shows nothing, and observe() on reconnection replaces its options
    this.#mutations.disconnect();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, an update for another attribute, with no property changed, renders the same list
    if (name === "aria-label") this.requestUpdate();
  }

  #events(): Element[] {
    return [...this.children].filter(isEvent);
  }

  protected override render(): unknown {
    const events = this.#events();
    if (events.length === 0) return nothing;
    const name = resolveName(this.getAttribute("aria-label"), this.label);
    const items = events.map((event, at) => {
      const next = events[at + 1];
      const classes = classMap({ "has-time": hasTime(event), "next-has-time": next !== undefined && hasTime(next) });
      const connector = next === undefined ? nothing : html`<span class="connector" aria-hidden="true"></span>`;
      return html`<li role="listitem" class=${classes}><span class="marker-line" aria-hidden="true"><span class="marker"></span></span>${connector}<slot></slot></li>`;
    });
    return html`<ol part="list" role="list" aria-label=${ifDefined(name)}>${items}</ol>`;
  }

  protected override updated(): void {
    const slots = this.renderRoot.querySelectorAll<HTMLSlotElement>("li > slot");
    this.#events().forEach((event, at) => {
      slots[at]?.assign(event);
    });
  }
}

define("ocelle-event-timeline", OcelleEventTimeline);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-event-timeline": OcelleEventTimeline;
  }
}
