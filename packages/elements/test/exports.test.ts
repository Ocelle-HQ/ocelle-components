import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a): it replaces the skeleton test that asserted
// the package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleCard`,
// `OcelleContextSidebar` (011 T035a), `OcelleIcon`, `OcellePageHeader` (011 T028a), `OcellePersonalRail` (011 T043a)
// and `OcelleSectionHeader`, and since 013 (T006) also `OcelleFact` and `OcelleFacts`, since 013 phase 2 (T025)
// `OcelleEmptyState`, and since 013 phase 3 (T040) `OcelleProgress`, in the module namespace's sorted order, and
// nothing else at run time (the `IconName` type is erased).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleCard, OcelleContextSidebar, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon, OcellePageHeader, OcellePersonalRail, OcelleProgress and OcelleSectionHeader and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleCard", "OcelleContextSidebar", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcellePageHeader", "OcellePersonalRail", "OcelleProgress", "OcelleSectionHeader"]);
    expect([module.OcelleBrandMark, module.OcelleCard, module.OcelleContextSidebar, module.OcelleEmptyState, module.OcelleFact, module.OcelleFacts, module.OcelleIcon, module.OcellePageHeader, module.OcellePersonalRail, module.OcelleProgress, module.OcelleSectionHeader].map((each) => typeof each)).toEqual(["function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function"]);
  });
});
