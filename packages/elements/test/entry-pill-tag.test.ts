import { describe, expect, it } from "vitest";
import { OcellePillTag } from "../src/ocelle-pill-tag.ts";

// The `ocelle-pill-tag` entry point (018 contracts/elements-status.md; FR-001; tasks.md T036): importing only
// src/ocelle-pill-tag.ts defines `ocelle-pill-tag` as the class it exports and neither of the feature's other elements
// nor `ocelle-button`, whose control conventions it shares (of 012 phase 4 uses only `linkHref`). Phase 6 (FR-034;
// research.md R-09; tasks.md T057): it also defines the `ocelle-tooltip` an interactive pill renders, read by its class
// name so this file imports nothing that defines it. This file's own iframe (Vitest browser mode, isolate on) holds only
// what this import defines.
describe("importing src/ocelle-pill-tag.ts", () => {
  it("defines ocelle-pill-tag as OcellePillTag and the ocelle-tooltip it renders, and not ocelle-status-indicator, ocelle-metric or ocelle-button, and a static pill renders its pill part", async () => {
    document.body.innerHTML = '<ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag>';
    const pill = document.getElementById("p") as OcellePillTag;
    await pill.updateComplete;
    expect({
      pill: customElements.get("ocelle-pill-tag"),
      indicator: customElements.get("ocelle-status-indicator"),
      metric: customElements.get("ocelle-metric"),
      button: customElements.get("ocelle-button"),
      tooltip: customElements.get("ocelle-tooltip")?.name,
      parts: [...(pill.shadowRoot?.querySelectorAll("[part]") ?? [])].map((each) => each.getAttribute("part")),
    }).toEqual({ pill: OcellePillTag, indicator: undefined, metric: undefined, button: undefined, tooltip: "OcelleTooltip", parts: ["pill"] });
  });
});
