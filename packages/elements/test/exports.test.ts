import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052): it replaces the skeleton test that asserted the package "exports
// nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleIcon`, since 009 (T017)
// `OcelleScroller`, since 009 phase 3 (T034) `OcelleWorkflowBoard` and `OcelleWorkflowLane` and since 009 phase 4 (T051)
// `OcelleListDetail`, and nothing else at run time (the `IconName` type is erased; the overflow-region, lane-count,
// tier and list-detail measurement modules are internal and not exported).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleIcon, OcelleListDetail, OcelleScroller, OcelleWorkflowBoard and OcelleWorkflowLane and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleIcon", "OcelleListDetail", "OcelleScroller", "OcelleWorkflowBoard", "OcelleWorkflowLane"]);
    expect([module.OcelleBrandMark, module.OcelleIcon, module.OcelleListDetail, module.OcelleScroller, module.OcelleWorkflowBoard, module.OcelleWorkflowLane].map((each) => typeof each)).toEqual([
      "function",
      "function",
      "function",
      "function",
      "function",
      "function",
    ]);
  });
});
