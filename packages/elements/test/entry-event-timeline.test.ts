import { describe, expect, it } from "vitest";
import { OcelleEventTimeline } from "../src/ocelle-event-timeline.ts";

// The `ocelle-event-timeline` entry point (019 FR-040; contracts/ocelle-event-timeline.md; tasks.md T034): importing
// only src/ocelle-event-timeline.ts defines `ocelle-event-timeline` as the class it exports and, as a container module,
// its item element `ocelle-timeline-event`, and no other element; a timeline so defined renders its list with the
// event assigned. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-event-timeline.ts", () => {
  it("defines ocelle-event-timeline as OcelleEventTimeline and ocelle-timeline-event, and neither ocelle-facts, ocelle-data-table, ocelle-scroller nor ocelle-icon; a timeline renders its event in a listitem", async () => {
    document.body.innerHTML = '<ocelle-event-timeline id="t" label="Mission history"><ocelle-timeline-event id="e" time="14:02">Mission created</ocelle-timeline-event></ocelle-event-timeline>';
    const timeline = document.getElementById("t") as OcelleEventTimeline;
    await timeline.updateComplete;
    expect({
      timeline: customElements.get("ocelle-event-timeline"),
      event: typeof customElements.get("ocelle-timeline-event"),
      others: ["ocelle-facts", "ocelle-data-table", "ocelle-scroller", "ocelle-icon", "ocelle-evidence-chain"].map((tag) => customElements.get(tag)),
      assigned: timeline.shadowRoot?.querySelector<HTMLSlotElement>('ol > li[role="listitem"] > slot')?.assignedElements().map((each) => each.id),
    }).toEqual({ timeline: OcelleEventTimeline, event: "function", others: [undefined, undefined, undefined, undefined, undefined], assigned: ["e"] });
  });
});
