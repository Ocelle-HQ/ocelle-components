import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; 014 research.md R-16,
// T017): importing only src/index.ts defines every element of the package, `ocelle-icon`, `ocelle-brand-mark`,
// `ocelle-listbox`, `ocelle-option`, `ocelle-tabs`, `ocelle-tab`, `ocelle-tab-panel`, `ocelle-segmented-choice`, `ocelle-segment`, `ocelle-copy-field` and `ocelle-link`, each as the class the root exports (analysis F1 (a): the mark joins in phase 5;
// 014 phase 2 adds the listbox and the option, phase 3 the tabs, the tab and the panel, phase 4 the segmented choice and the segment, phase 5 the copy field, phase 6 the link). This file's own iframe (Vitest browser mode, isolate on) holds only
// what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon and ocelle-brand-mark as the OcelleIcon and OcelleBrandMark it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark].map((each) => typeof each)).toEqual(["function", "function"]);
    expect({ icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark });
  });

  it("defines ocelle-listbox and ocelle-option as the OcelleListbox and OcelleOption it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleListbox, exported.OcelleOption].map((each) => typeof each)).toEqual(["function", "function"]);
    expect({ listbox: customElements.get("ocelle-listbox"), option: customElements.get("ocelle-option") }).toEqual({ listbox: exported.OcelleListbox, option: exported.OcelleOption });
  });

  it("defines ocelle-tabs, ocelle-tab and ocelle-tab-panel as the OcelleTabs, OcelleTab and OcelleTabPanel it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleTabs, exported.OcelleTab, exported.OcelleTabPanel].map((each) => typeof each)).toEqual(["function", "function", "function"]);
    expect({ tabs: customElements.get("ocelle-tabs"), tab: customElements.get("ocelle-tab"), panel: customElements.get("ocelle-tab-panel") }).toEqual({ tabs: exported.OcelleTabs, tab: exported.OcelleTab, panel: exported.OcelleTabPanel });
  });

  it("defines ocelle-segmented-choice and ocelle-segment as the OcelleSegmentedChoice and OcelleSegment it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleSegmentedChoice, exported.OcelleSegment].map((each) => typeof each)).toEqual(["function", "function"]);
    expect({ group: customElements.get("ocelle-segmented-choice"), segment: customElements.get("ocelle-segment") }).toEqual({ group: exported.OcelleSegmentedChoice, segment: exported.OcelleSegment });
  });

  it("defines ocelle-copy-field as the OcelleCopyField it exports", () => {
    const exported = root as Record<string, unknown>;
    expect(typeof exported.OcelleCopyField).toBe("function");
    expect(customElements.get("ocelle-copy-field")).toEqual(exported.OcelleCopyField);
  });

  it("defines ocelle-link as the OcelleLink it exports", () => {
    const exported = root as Record<string, unknown>;
    expect(typeof exported.OcelleLink).toBe("function");
    expect(customElements.get("ocelle-link")).toEqual(exported.OcelleLink);
  });
});
