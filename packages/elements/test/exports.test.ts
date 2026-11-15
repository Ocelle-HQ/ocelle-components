import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a): it replaces the skeleton test that asserted
// the package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleCard`,
// `OcelleContextSidebar` (011 T035a), `OcelleIcon`, `OcellePageHeader` (011 T028a), `OcellePersonalRail` (011 T043a)
// and `OcelleSectionHeader`, in the module namespace's sorted order, and nothing else at run time (the `IconName` type
// is erased).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleCard, OcelleContextSidebar, OcelleIcon, OcellePageHeader, OcellePersonalRail and OcelleSectionHeader and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleCard", "OcelleContextSidebar", "OcelleIcon", "OcellePageHeader", "OcellePersonalRail", "OcelleSectionHeader"]);
    expect([module.OcelleBrandMark, module.OcelleCard, module.OcelleContextSidebar, module.OcelleIcon, module.OcellePageHeader, module.OcellePersonalRail, module.OcelleSectionHeader].map((each) => typeof each)).toEqual(["function", "function", "function", "function", "function", "function", "function"]);
  });
});
