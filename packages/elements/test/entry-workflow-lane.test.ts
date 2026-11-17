import { describe, expect, it } from "vitest";
import { OcelleWorkflowLane } from "../src/ocelle-workflow-lane.ts";

// The `ocelle-workflow-lane` entry point (009 FR-030; contracts/elements.md § Entry points; T034): importing only
// src/ocelle-workflow-lane.ts defines `ocelle-workflow-lane` as the class it exports and no other element of the
// package. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-workflow-lane.ts", () => {
  it("defines ocelle-workflow-lane as OcelleWorkflowLane, and neither ocelle-workflow-board, ocelle-scroller, ocelle-icon nor ocelle-brand-mark", () => {
    expect({
      lane: customElements.get("ocelle-workflow-lane"),
      board: customElements.get("ocelle-workflow-board"),
      scroller: customElements.get("ocelle-scroller"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ lane: OcelleWorkflowLane, board: undefined, scroller: undefined, icon: undefined, mark: undefined });
    expect(OcelleWorkflowLane).toBeTypeOf("function");
  });
});
