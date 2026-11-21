// `ocelle-timeline-event` (019 FR-020 to FR-027; contracts/ocelle-timeline-event.md; research.md R-10; plan gate Q-C,
// Q-E and Q-G (a)): one event of an `ocelle-event-timeline`, its time on its own line above its content.
// - Structure: an open shadow root with the platform's named slot assignment holds `<span part="time">` (only while the
//   event has a time: `hasTime`'s rule, with the `time` property, which Lit reflects after the render) above `<span part="content"><slot></slot></span>`. The time box holds the `time` slot
//   while the event has a slotted time (`hasSlottedTime`: a visible `slot="time"` child with text), else the `time`
//   attribute's text, never both; so while the slot is not rendered an empty, blank or hidden slotted node is
//   unassigned, neither shown nor exposed. The time box comes first in the shadow tree, so the item text is time first
//   wherever the consumer wrote the slotted node.
// - Its own `MutationObserver` (`childList`, `characterData`, `subtree`, and the attributes `slot`, `hidden` and
//   `aria-hidden`) recomputes `hasSlottedTime` per record batch and re-renders when it changed, inside a timeline or
//   outside one. `time` and `wrap` reflect, so the timeline's observer sees a property set from script.
// - Look: the time in `--ocelle-font-size-xs`, medium weight, `--ocelle-color-ink-muted`, tabular figures; a slotted
//   time takes the same type through `slot[name="time"]::slotted(*)` (a consumer rule on it wins); the content in
//   `--ocelle-font-size-sm`, regular weight, `--ocelle-color-ink`; both at `--ocelle-line-height-normal`. Outside a
//   timeline the same boxes show as plain text, with no marker and no list role.
// Importing this module defines `ocelle-timeline-event` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { define } from "./define.ts";
import { hasSlottedTime } from "./timeline-time.ts";

/**
 * One event of an event timeline: its time (the `time` attribute, or a slotted time) above its content. Outside a
 * timeline it shows the same, as plain text.
 *
 * @tagname ocelle-timeline-event
 * @slot - The event's content.
 * @slot time - The event's time as marked-up nodes, for example a `<time datetime>`. It takes precedence over the `time` attribute while one of its nodes is visible (not `hidden` or `aria-hidden="true"`) and has text that is not blank, and takes the time's type through `::slotted()`.
 * @csspart time - The time, on its own line above the content: the slotted time, or the `time` attribute's text. Rendered only while the event has a time.
 * @csspart content - The content.
 */
export class OcelleTimelineEvent extends LitElement {
  static override properties = {
    time: { type: String, reflect: true },
    wrap: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part="time"] {
      display: block;
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-xs);
      font-weight: var(--ocelle-font-weight-medium);
      font-variant-numeric: var(--ocelle-figures);
      line-height: var(--ocelle-line-height-normal);
    }

    slot[name="time"]::slotted(*) {
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-xs);
      font-weight: var(--ocelle-font-weight-medium);
      font-variant-numeric: var(--ocelle-figures);
      line-height: var(--ocelle-line-height-normal);
    }

    slot[name="time"]::slotted([hidden]),
    slot[name="time"]::slotted([aria-hidden="true"]) {
      display: none;
    }

    [part="content"] {
      display: block;
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-sm);
      font-weight: var(--ocelle-font-weight-regular);
      line-height: var(--ocelle-line-height-normal);
    }

    :host([wrap="anywhere"]) [part="content"] {
      overflow-wrap: anywhere;
    }

    @media not (forced-colors: active) {
      [part="time"],
      slot[name="time"]::slotted(*) {
        color: var(--ocelle-color-ink-muted);
      }

      [part="content"] {
        color: var(--ocelle-color-ink);
      }
    }

    @media (forced-colors: active) {
      [part="time"],
      [part="content"],
      slot[name="time"]::slotted(*) {
        color: CanvasText;
      }
    }
  `;

  /**
   * The event's time as the consumer formats it, shown on its own line above the content. Empty or white space counts
   * as no time. Ignored while the event has a slotted time (the `time` slot). Reflected.
   *
   * @default undefined
   */
  declare time: string | undefined;

  /**
   * `anywhere` breaks long identifiers in the content anywhere; the time keeps its own line. Unset wraps between words.
   * Reflected.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  /** Whether the event had a slotted time at its last render. */
  // Stryker disable next-line BooleanLiteral: equivalent, render() sets it before the first change it is compared with can be seen: a record delivered before the first render only requests the update already pending
  #slotted = false;

  readonly #mutations = new MutationObserver(() => {
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, an update with no slotted-time change renders the same time box
    if (hasSlottedTime(this) !== this.#slotted) this.requestUpdate();
  });

  override connectedCallback(): void {
    super.connectedCallback();
    this.#mutations.observe(this, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["slot", "hidden", "aria-hidden"] });
  }

  // Stryker disable next-line BlockStatement: equivalent, the body's two calls are each equivalent (below), so is leaving out both
  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
    super.disconnectedCallback();
    // Stryker disable next-line CallExpression: equivalent, a kept observer re-renders an event out of the document, which shows nothing, and observe() on reconnection replaces its options
    this.#mutations.disconnect();
  }

  protected override render(): unknown {
    this.#slotted = hasSlottedTime(this);
    // `hasTime` of timeline-time.ts, read from the property: Lit reflects `time` to its attribute after this render.
    const timed = this.#slotted || (this.time ?? "").trim() !== "";
    const time = this.#slotted ? html`<slot name="time"></slot>` : this.time;
    return html`${timed ? html`<span part="time">${time}</span>` : nothing}<span part="content"><slot></slot></span>`;
  }
}

define("ocelle-timeline-event", OcelleTimelineEvent);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-timeline-event": OcelleTimelineEvent;
  }
}
