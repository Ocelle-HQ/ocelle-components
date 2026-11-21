import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleSegmentedChoice } from "../src/ocelle-segmented-choice.ts";

// The `ocelle-segmented-choice` entry point (014 research.md R-16, operator decision PLAN-CORRECTNESS-1-015 (a);
// contracts § Entry points; T063): importing only src/ocelle-segmented-choice.ts defines `ocelle-segmented-choice` and
// the `ocelle-segment` it owns as children, and nothing else, and the control works: its segment is exposed as a pressed
// toggle button inside the named toolbar. This file's own iframe (Vitest browser mode, isolate on) holds only what this
// import defines. Plant: the segmented choice's module not importing the segment's module.
describe("importing src/ocelle-segmented-choice.ts", () => {
  it("defines ocelle-segmented-choice as OcelleSegmentedChoice and ocelle-segment, and not ocelle-listbox, ocelle-tabs, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      group: customElements.get("ocelle-segmented-choice"),
      segment: typeof customElements.get("ocelle-segment"),
      listbox: customElements.get("ocelle-listbox"),
      tabs: customElements.get("ocelle-tabs"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ group: OcelleSegmentedChoice, segment: "function", listbox: undefined, tabs: undefined, icon: undefined, mark: undefined });
  });

  it("gives a working control: the segment is exposed as a pressed toggle button inside the named toolbar", async () => {
    document.body.innerHTML = '<ocelle-segmented-choice id="sc" label="Lane filter"><ocelle-segment value="all">All</ocelle-segment></ocelle-segmented-choice>';
    await (document.getElementById("sc") as unknown as { updateComplete?: Promise<unknown> }).updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const states = await commands.axStates("sc", "subtree");
    expect(states.filter((node) => ["toolbar", "button"].includes(node.role)).map((node) => [node.role, node.name, node.pressed === true])).toEqual([
      ["toolbar", "Lane filter", false],
      ["button", "All", true],
    ]);
  });
});
