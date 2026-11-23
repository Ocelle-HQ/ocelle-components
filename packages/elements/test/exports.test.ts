import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 011 FR-001, T016a; specs/010-feedback-forms T015, T016c, T034b,
// T052b): it replaces the skeleton test that asserted the package "exports nothing yet". The root exports the element
// classes, `OcelleBrandMark`, `OcelleIcon`, since 009 (T017) `OcelleScroller`, since 009 phase 3 (T034)
// `OcelleWorkflowBoard` and `OcelleWorkflowLane`, since 009 phase 4 (T051) `OcelleListDetail`, since 011 `OcelleCard`,
// `OcelleContextSidebar` (011 T035a), `OcellePageHeader` (011 T028a), `OcellePersonalRail` (011 T043a) and
// `OcelleSectionHeader`, since 008 `OcelleDialog` (008 T017), `OcelleDrawer` (008 T032) and `OcelleTooltip` (008 T043),
// since 010 `OcelleNotice`, `OcelleFormInput` and `OcelleFormSelect`, since 012 `OcelleButton` (012 tasks.md T018) and
// `OcelleActionRow` (012 tasks.md T051), since 013 (T006) `OcelleFact` and `OcelleFacts`, since 013 phase 2 (T025)
// `OcelleEmptyState`, since 013 phase 3 (T040) `OcelleProgress`, and since 014 (phases 2 to 6) `OcelleListbox`,
// `OcelleOption`, `OcelleTabs`, `OcelleTab`, `OcelleTabPanel`, `OcelleSegmentedChoice`, `OcelleSegment`,
// `OcelleCopyField` and `OcelleLink`, and since 020 (T006) `OcelleDisclosure` and (T026) `OcelleCodeBlock`, in the
// module namespace's sorted order, code-unit order (010 research R-11), and
// nothing else at run time (the `IconName` type is erased; the overflow-region, lane-count, tier and list-detail
// measurement modules, the overlays' internal base and the form controls' internal `FormControl` base class are
// internal and not exported).
describe("@ocelle/elements root exports", () => {
  it("exports exactly the public element classes in code-point order", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    const names = ["OcelleActionRow", "OcelleAppShell", "OcelleBrandMark", "OcelleBreadcrumbs", "OcelleButton", "OcelleCard", "OcelleCodeBlock", "OcelleContextSidebar", "OcelleCopyField", "OcelleDialog", "OcelleDisclosure", "OcelleDrawer", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleFormInput", "OcelleFormSelect", "OcelleIcon", "OcelleLink", "OcelleListDetail", "OcelleListbox", "OcelleNavItem", "OcelleNavPill", "OcelleNotice", "OcelleOption", "OcellePageHeader", "OcellePersonalRail", "OcelleProgress", "OcelleScroller", "OcelleSectionHeader", "OcelleSegment", "OcelleSegmentedChoice", "OcelleSkipLink", "OcelleTab", "OcelleTabPanel", "OcelleTabs", "OcelleTooltip", "OcelleTopBar", "OcelleWorkflowBoard", "OcelleWorkflowLane"];
    expect(Object.keys(module)).toEqual(names);
    expect(names.map((name) => typeof module[name])).toEqual(names.map(() => "function"));
    expect([customElements.get("ocelle-listbox"), customElements.get("ocelle-option")]).toEqual([module.OcelleListbox, module.OcelleOption]);
    expect([customElements.get("ocelle-tab"), customElements.get("ocelle-tab-panel"), customElements.get("ocelle-tabs")]).toEqual([module.OcelleTab, module.OcelleTabPanel, module.OcelleTabs]);
    expect([customElements.get("ocelle-segment"), customElements.get("ocelle-segmented-choice")]).toEqual([module.OcelleSegment, module.OcelleSegmentedChoice]);
    expect(customElements.get("ocelle-copy-field")).toEqual(module.OcelleCopyField);
    expect(customElements.get("ocelle-link")).toEqual(module.OcelleLink);
  });
});
