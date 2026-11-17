import { describe, expect, it } from "vitest";
import { OcelleWorkflowBoard } from "../src/ocelle-workflow-board.ts";

// The `ocelle-workflow-board` entry point (009 FR-030; contracts/elements.md § Entry points; T034): importing only
// src/ocelle-workflow-board.ts defines `ocelle-workflow-board` as the class it exports and no other element of the
// package; the board module does not define the lane, so a host imports both or the root. This file's own iframe
// (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-workflow-board.ts", () => {
  it("defines ocelle-workflow-board as OcelleWorkflowBoard, and neither ocelle-workflow-lane, ocelle-scroller, ocelle-icon nor ocelle-brand-mark", () => {
    expect({
      board: customElements.get("ocelle-workflow-board"),
      lane: customElements.get("ocelle-workflow-lane"),
      scroller: customElements.get("ocelle-scroller"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ board: OcelleWorkflowBoard, lane: undefined, scroller: undefined, icon: undefined, mark: undefined });
    expect(OcelleWorkflowBoard).toBeTypeOf("function");
  });
});
