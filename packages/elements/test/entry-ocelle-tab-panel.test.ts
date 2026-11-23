import { describe, expect, it } from "vitest";
import { OcelleTabPanel } from "../src/ocelle-tab-panel.ts";

// The `ocelle-tab-panel` entry point (014 research.md R-16; contracts § Entry points; T044): importing only
// src/ocelle-tab-panel.ts defines `ocelle-tab-panel` as the class it exports, and not the tabs or the tab. This file's
// own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-tab-panel.ts", () => {
  it("defines ocelle-tab-panel as OcelleTabPanel and not ocelle-tabs or ocelle-tab", () => {
    expect({ panel: customElements.get("ocelle-tab-panel"), tabs: customElements.get("ocelle-tabs"), tab: customElements.get("ocelle-tab") }).toEqual({ panel: OcelleTabPanel, tabs: undefined, tab: undefined });
  });
});
