import { describe, expect, it } from "vitest";
import { OcelleTab } from "../src/ocelle-tab.ts";

// The `ocelle-tab` entry point (014 research.md R-16; contracts § Entry points; T044): importing only src/ocelle-tab.ts
// defines `ocelle-tab` as the class it exports, and not the tabs, which own tabs but are not owned by them, nor the
// panel. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-tab.ts", () => {
  it("defines ocelle-tab as OcelleTab and not ocelle-tabs or ocelle-tab-panel", () => {
    expect({ tab: customElements.get("ocelle-tab"), tabs: customElements.get("ocelle-tabs"), panel: customElements.get("ocelle-tab-panel") }).toEqual({ tab: OcelleTab, tabs: undefined, panel: undefined });
  });
});
