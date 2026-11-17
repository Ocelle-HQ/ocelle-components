import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a; 014 T011): it replaces the skeleton test that
// asserted the package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleIcon`,
// since 009 (T017) `OcelleScroller`, since 009 phase 3 (T034) `OcelleWorkflowBoard` and `OcelleWorkflowLane`, since 009
// phase 4 (T051) `OcelleListDetail`, since 011 `OcelleCard`, `OcelleContextSidebar` (011 T035a), `OcellePageHeader` (011
// T028a), `OcellePersonalRail` (011 T043a) and `OcelleSectionHeader`, since 008 `OcelleDialog` (008 T017),
// `OcelleDrawer` (008 T032) and `OcelleTooltip` (008 T043), since 013 (T006) `OcelleFact` and `OcelleFacts`, since 013
// phase 2 (T025) `OcelleEmptyState`, since 013 phase 3 (T040) `OcelleProgress`, and since 014 (phases 2 to 6)
// `OcelleListbox`, `OcelleOption`, `OcelleTabs`, `OcelleTab`, `OcelleTabPanel`, `OcelleSegmentedChoice`,
// `OcelleSegment`, `OcelleCopyField` and `OcelleLink`, in the module namespace's sorted order, and nothing else at run
// time (the `IconName` type is erased; the overflow-region, lane-count, tier and list-detail measurement modules and the
// overlays' internal base are internal and not exported).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleCard, OcelleContextSidebar, OcelleCopyField, OcelleDialog, OcelleDrawer, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon, OcelleLink, OcelleListDetail, OcelleListbox, OcelleOption, OcellePageHeader, OcellePersonalRail, OcelleProgress, OcelleScroller, OcelleSectionHeader, OcelleSegment, OcelleSegmentedChoice, OcelleTab, OcelleTabPanel, OcelleTabs, OcelleTooltip, OcelleWorkflowBoard and OcelleWorkflowLane and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    const names = ["OcelleBrandMark", "OcelleCard", "OcelleContextSidebar", "OcelleCopyField", "OcelleDialog", "OcelleDrawer", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcelleLink", "OcelleListDetail", "OcelleListbox", "OcelleOption", "OcellePageHeader", "OcellePersonalRail", "OcelleProgress", "OcelleScroller", "OcelleSectionHeader", "OcelleSegment", "OcelleSegmentedChoice", "OcelleTab", "OcelleTabPanel", "OcelleTabs", "OcelleTooltip", "OcelleWorkflowBoard", "OcelleWorkflowLane"];
    expect(Object.keys(module)).toEqual(names);
    expect(names.map((name) => typeof module[name])).toEqual(names.map(() => "function"));
    expect([customElements.get("ocelle-listbox"), customElements.get("ocelle-option")]).toEqual([module.OcelleListbox, module.OcelleOption]);
    expect([customElements.get("ocelle-tab"), customElements.get("ocelle-tab-panel"), customElements.get("ocelle-tabs")]).toEqual([module.OcelleTab, module.OcelleTabPanel, module.OcelleTabs]);
    expect([customElements.get("ocelle-segment"), customElements.get("ocelle-segmented-choice")]).toEqual([module.OcelleSegment, module.OcelleSegmentedChoice]);
    expect(customElements.get("ocelle-copy-field")).toEqual(module.OcelleCopyField);
    expect(customElements.get("ocelle-link")).toEqual(module.OcelleLink);
  });
});
