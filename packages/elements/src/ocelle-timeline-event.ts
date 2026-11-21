// `ocelle-timeline-event` (019 FR-020 to FR-027; contracts/ocelle-timeline-event.md; research.md R-10): one event of an
// `ocelle-event-timeline`, its time above its content. Phase 2 scaffold: the public surface only, no behaviour.
// Importing this module defines `ocelle-timeline-event` and no other element.
import { LitElement } from "lit";
import { define } from "./define.ts";

/**
 * One event of an event timeline: its time (the `time` attribute, or a slotted time) above its content.
 *
 * @tagname ocelle-timeline-event
 * @slot - The event's content.
 * @slot time - The event's time as marked-up nodes, for example a `<time datetime>`.
 * @csspart time - The time, above the content.
 * @csspart content - The content.
 */
export class OcelleTimelineEvent extends LitElement {
  static override properties = {
    time: { type: String, reflect: true },
    wrap: { type: String, reflect: true },
  };

  /**
   * The event's time as the consumer formats it, shown above the content. Reflected.
   *
   * @default undefined
   */
  declare time: string | undefined;

  /**
   * `anywhere` breaks long identifiers in the content anywhere. Reflected.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  protected override render(): unknown {
    return undefined;
  }
}

define("ocelle-timeline-event", OcelleTimelineEvent);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-timeline-event": OcelleTimelineEvent;
  }
}
