import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; 014 T011): it replaces the skeleton test that asserted the
// package "exports nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleIcon`, `OcelleListbox`,
// `OcelleOption`, `OcelleTab`, `OcelleTabPanel` and `OcelleTabs` (014 phase 3), and nothing else at run time (the `IconName` type is erased).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleIcon, OcelleListbox, OcelleOption, OcelleTab, OcelleTabPanel and OcelleTabs and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleIcon", "OcelleListbox", "OcelleOption", "OcelleTab", "OcelleTabPanel", "OcelleTabs"]);
    expect([module.OcelleBrandMark, module.OcelleIcon, module.OcelleListbox, module.OcelleOption].map((each) => typeof each)).toEqual(["function", "function", "function", "function"]);
    expect([customElements.get("ocelle-listbox"), customElements.get("ocelle-option")]).toEqual([module.OcelleListbox, module.OcelleOption]);
    expect([module.OcelleTab, module.OcelleTabPanel, module.OcelleTabs].map((each) => typeof each)).toEqual(["function", "function", "function"]);
    expect([customElements.get("ocelle-tab"), customElements.get("ocelle-tab-panel"), customElements.get("ocelle-tabs")]).toEqual([module.OcelleTab, module.OcelleTabPanel, module.OcelleTabs]);
  });
});
