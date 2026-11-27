import { describe, expect, it } from "vitest";
import { OcelleStatusIndicator } from "../src/ocelle-status-indicator.ts";

// The `ocelle-status-indicator` entry point (018 contracts/elements-status.md; FR-001; tasks.md T013): importing only
// src/ocelle-status-indicator.ts defines `ocelle-status-indicator` as the class it exports and no other element. This
// file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-status-indicator.ts", () => {
  it("defines ocelle-status-indicator as OcelleStatusIndicator and not ocelle-icon, ocelle-progress or ocelle-tooltip, and an indicator renders its dot", async () => {
    document.body.innerHTML = '<ocelle-status-indicator id="i" tone="success"></ocelle-status-indicator>';
    const indicator = document.getElementById("i") as OcelleStatusIndicator;
    await indicator.updateComplete;
    expect({
      indicator: customElements.get("ocelle-status-indicator"),
      icon: customElements.get("ocelle-icon"),
      progress: customElements.get("ocelle-progress"),
      tooltip: customElements.get("ocelle-tooltip"),
      parts: [...(indicator.shadowRoot?.querySelectorAll("[part]") ?? [])].map((each) => each.getAttribute("part")),
    }).toEqual({ indicator: OcelleStatusIndicator, icon: undefined, progress: undefined, tooltip: undefined, parts: ["dot"] });
  });
});
