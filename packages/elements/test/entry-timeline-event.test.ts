import { describe, expect, it } from "vitest";
import { OcelleTimelineEvent } from "../src/ocelle-timeline-event.ts";

// The `ocelle-timeline-event` entry point (019 FR-040; contracts/ocelle-timeline-event.md; tasks.md T034): importing
// only src/ocelle-timeline-event.ts defines `ocelle-timeline-event` as the class it exports and no other element; a
// standalone event so defined shows its time box. This file's own iframe holds only what this import defines.
describe("importing src/ocelle-timeline-event.ts", () => {
  it("defines ocelle-timeline-event as OcelleTimelineEvent and not ocelle-event-timeline, ocelle-facts or ocelle-icon, and a standalone event shows its time", async () => {
    document.body.innerHTML = '<ocelle-timeline-event id="e" time="14:02">Mission created</ocelle-timeline-event>';
    const event = document.getElementById("e") as OcelleTimelineEvent;
    await event.updateComplete;
    expect({
      event: customElements.get("ocelle-timeline-event"),
      others: ["ocelle-event-timeline", "ocelle-facts", "ocelle-icon"].map((tag) => customElements.get(tag)),
      time: event.shadowRoot?.querySelector('[part="time"]')?.textContent.trim(),
    }).toEqual({ event: OcelleTimelineEvent, others: [undefined, undefined, undefined], time: "14:02" });
  });
});
