import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a): it replaces the skeleton test that asserted
// the package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleCard`,
// `OcelleContextSidebar` (011 T035a), `OcelleDialog` (008 T017), `OcelleDrawer` (008 T032), `OcelleIcon`,
// `OcellePageHeader` (011 T028a), `OcellePersonalRail` (011 T043a), `OcelleSectionHeader` and `OcelleTooltip` (008
// T043), and since 013 (T006) also `OcelleFact` and `OcelleFacts`, since 013 phase 2 (T025) `OcelleEmptyState`, and
// since 013 phase 3 (T040) `OcelleProgress`, in the module namespace's sorted order, and nothing else at run time (the
// `IconName` type is erased; the overlays' internal base is not exported).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleCard, OcelleContextSidebar, OcelleDialog, OcelleDrawer, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon, OcellePageHeader, OcellePersonalRail, OcelleProgress, OcelleSectionHeader and OcelleTooltip and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    const names = ["OcelleBrandMark", "OcelleCard", "OcelleContextSidebar", "OcelleDialog", "OcelleDrawer", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcellePageHeader", "OcellePersonalRail", "OcelleProgress", "OcelleSectionHeader", "OcelleTooltip"];
    expect(Object.keys(module)).toEqual(names);
    expect(names.map((name) => typeof module[name])).toEqual(names.map(() => "function"));
  });
});
