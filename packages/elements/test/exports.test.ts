import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a): it replaces the skeleton test that asserted
// the package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleIcon`, since 009
// (T017) `OcelleScroller`, since 009 phase 3 (T034) `OcelleWorkflowBoard` and `OcelleWorkflowLane`, since 009 phase 4
// (T051) `OcelleListDetail`, since 011 `OcelleCard`, `OcelleContextSidebar` (011 T035a), `OcellePageHeader` (011
// T028a), `OcellePersonalRail` (011 T043a) and `OcelleSectionHeader`, since 008 `OcelleDialog` (008 T017),
// `OcelleDrawer` (008 T032) and `OcelleTooltip` (008 T043), since 012 `OcelleButton` (tasks.md T018) and
// `OcelleActionRow` (tasks.md T051), since 013 (T006) `OcelleFact` and `OcelleFacts`, since 013 phase 2 (T025)
// `OcelleEmptyState`, since 013 phase 3 (T040) `OcelleProgress`, and since 020 (T006) `OcelleDisclosure` and (T026)
// `OcelleCodeBlock`, in the module namespace's sorted order, and
// nothing else at run time (the `IconName` type is erased; the overflow-region, lane-count, tier and list-detail
// measurement modules and the overlays' internal base are internal and not exported).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleActionRow, OcelleBrandMark, OcelleButton, OcelleCard, OcelleCodeBlock, OcelleContextSidebar, OcelleDialog, OcelleDisclosure, OcelleDrawer, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon, OcelleListDetail, OcellePageHeader, OcellePersonalRail, OcelleProgress, OcelleScroller, OcelleSectionHeader, OcelleTooltip, OcelleWorkflowBoard and OcelleWorkflowLane and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    const names = ["OcelleActionRow", "OcelleBrandMark", "OcelleButton", "OcelleCard", "OcelleCodeBlock", "OcelleContextSidebar", "OcelleDialog", "OcelleDisclosure", "OcelleDrawer", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcelleListDetail", "OcellePageHeader", "OcellePersonalRail", "OcelleProgress", "OcelleScroller", "OcelleSectionHeader", "OcelleTooltip", "OcelleWorkflowBoard", "OcelleWorkflowLane"];
    expect(Object.keys(module)).toEqual(names);
    expect(names.map((name) => typeof module[name])).toEqual(names.map(() => "function"));
  });
});
