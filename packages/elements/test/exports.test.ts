import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a): it replaces the skeleton test that asserted
// the package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleIcon`, since 009
// (T017) `OcelleScroller`, since 009 phase 3 (T034) `OcelleWorkflowBoard` and `OcelleWorkflowLane`, since 009 phase 4
// (T051) `OcelleListDetail`, since 011 `OcelleCard`, `OcelleContextSidebar` (011 T035a), `OcellePageHeader` (011
// T028a), `OcellePersonalRail` (011 T043a) and `OcelleSectionHeader`, since 013 (T006) `OcelleFact` and `OcelleFacts`,
// since 013 phase 2 (T025) `OcelleEmptyState`, and since 013 phase 3 (T040) `OcelleProgress`, in the module
// namespace's sorted order, and nothing else at run time (the `IconName` type is erased; the overflow-region,
// lane-count, tier and list-detail measurement modules are internal and not exported).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleCard, OcelleContextSidebar, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon, OcelleListDetail, OcellePageHeader, OcellePersonalRail, OcelleProgress, OcelleScroller, OcelleSectionHeader, OcelleWorkflowBoard and OcelleWorkflowLane and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleCard", "OcelleContextSidebar", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcelleListDetail", "OcellePageHeader", "OcellePersonalRail", "OcelleProgress", "OcelleScroller", "OcelleSectionHeader", "OcelleWorkflowBoard", "OcelleWorkflowLane"]);
    expect([module.OcelleBrandMark, module.OcelleCard, module.OcelleContextSidebar, module.OcelleEmptyState, module.OcelleFact, module.OcelleFacts, module.OcelleIcon, module.OcelleListDetail, module.OcellePageHeader, module.OcellePersonalRail, module.OcelleProgress, module.OcelleScroller, module.OcelleSectionHeader, module.OcelleWorkflowBoard, module.OcelleWorkflowLane].map((each) => typeof each)).toEqual(["function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function"]);
  });
});
