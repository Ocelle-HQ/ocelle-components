import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052): importing only
// src/index.ts defines every element of the package, each as the class the root exports (analysis F1 (a): the mark
// joins in phase 5). Since 009 (T017) `ocelle-scroller` is one of them, and since 009 phase 3 (T034)
// `ocelle-workflow-board` and `ocelle-workflow-lane`, and since 009 phase 4 (T051) `ocelle-list-detail`; and since 013
// (contracts/elements.md § Modules and exports, T006, T025) `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state` and
// `ocelle-progress`. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark, ocelle-scroller, ocelle-workflow-board, ocelle-workflow-lane and ocelle-list-detail as the OcelleIcon, OcelleBrandMark, OcelleScroller, OcelleWorkflowBoard, OcelleWorkflowLane and OcelleListDetail it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleScroller, exported.OcelleWorkflowBoard, exported.OcelleWorkflowLane, exported.OcelleListDetail].map((each) => typeof each)).toEqual([
      "function",
      "function",
      "function",
      "function",
      "function",
      "function",
    ]);
    expect({
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      scroller: customElements.get("ocelle-scroller"),
      board: customElements.get("ocelle-workflow-board"),
      lane: customElements.get("ocelle-workflow-lane"),
      listDetail: customElements.get("ocelle-list-detail"),
    }).toEqual({
      icon: exported.OcelleIcon,
      mark: exported.OcelleBrandMark,
      scroller: exported.OcelleScroller,
      board: exported.OcelleWorkflowBoard,
      lane: exported.OcelleWorkflowLane,
      listDetail: exported.OcelleListDetail,
    });
  });

  it("defines ocelle-facts and ocelle-fact as the OcelleFacts and OcelleFact it exports, and a sheet renders its pair (013)", async () => {
    const exported = root as Record<string, unknown>;
    document.body.innerHTML = '<ocelle-facts id="s"><ocelle-fact label="Owner">Ada</ocelle-fact></ocelle-facts>';
    await (document.getElementById("s") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect({
      facts: customElements.get("ocelle-facts"),
      fact: customElements.get("ocelle-fact"),
      term: document.getElementById("s")?.shadowRoot?.querySelector("dt")?.textContent,
    }).toEqual({ facts: exported.OcelleFacts, fact: exported.OcelleFact, term: "Owner" });
  });

  it("defines ocelle-empty-state as the OcelleEmptyState it exports, and an empty state renders its heading slot (013)", async () => {
    const exported = root as Record<string, unknown>;
    document.body.innerHTML = '<ocelle-empty-state id="e"><h2 slot="heading">No missions yet</h2></ocelle-empty-state>';
    await (document.getElementById("e") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect({
      type: typeof exported.OcelleEmptyState,
      state: customElements.get("ocelle-empty-state"),
      heading: document.getElementById("e")?.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="heading"]')?.assignedElements().map((each) => each.textContent),
    }).toEqual({ type: "function", state: exported.OcelleEmptyState, heading: ["No missions yet"] });
  });

  it("defines ocelle-progress as the OcelleProgress it exports, and a bar renders its track (013 phase 3)", async () => {
    const exported = root as Record<string, unknown>;
    document.body.innerHTML = '<ocelle-progress id="p" value="7" max="12" label="Tasks done"></ocelle-progress>';
    await (document.getElementById("p") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect({
      type: typeof exported.OcelleProgress,
      progress: customElements.get("ocelle-progress"),
      track: document.getElementById("p")?.shadowRoot?.querySelector('[part="track"]') !== null && document.getElementById("p")?.shadowRoot !== null,
    }).toEqual({ type: "function", progress: exported.OcelleProgress, track: true });
  });
});
