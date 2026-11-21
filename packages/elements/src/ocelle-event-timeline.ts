// `ocelle-event-timeline` (019 FR-020 to FR-027; contracts/ocelle-event-timeline.md; research.md R-08 to R-10): an
// event history, one ordered list of its `ocelle-timeline-event` children. Phase 2 scaffold: the public surface only,
// no behaviour. Importing this module defines `ocelle-event-timeline` and, as a container module, its item element
// `ocelle-timeline-event`.
import { LitElement } from "lit";
import { define } from "./define.ts";
import "./ocelle-timeline-event.ts";

/**
 * An event history: one ordered list of its `ocelle-timeline-event` children, in source order.
 *
 * @tagname ocelle-event-timeline
 * @slot - The events, `ocelle-timeline-event` elements, in source order.
 * @csspart list - The ordered list.
 */
export class OcelleEventTimeline extends LitElement {
  static override properties = {
    label: { type: String },
  };

  /**
   * Names the list when the host has no non-blank `aria-label`.
   *
   * @default undefined
   */
  declare label: string | undefined;

  protected override render(): unknown {
    return undefined;
  }
}

define("ocelle-event-timeline", OcelleEventTimeline);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-event-timeline": OcelleEventTimeline;
  }
}
