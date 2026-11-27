import { describe, expect, it } from "vitest";
import { OcelleMetric } from "../src/ocelle-metric.ts";

// The `ocelle-metric` entry point (018 contracts/elements-status.md; FR-001; tasks.md T025): importing only
// src/ocelle-metric.ts defines `ocelle-metric` as the class it exports and no other element. This file's own iframe
// (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-metric.ts", () => {
  it("defines ocelle-metric as OcelleMetric and not ocelle-status-indicator, ocelle-fact or ocelle-tooltip, and a metric renders its label and value parts", async () => {
    document.body.innerHTML = '<ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric>';
    const metric = document.getElementById("m") as OcelleMetric;
    await metric.updateComplete;
    expect({
      metric: customElements.get("ocelle-metric"),
      indicator: customElements.get("ocelle-status-indicator"),
      fact: customElements.get("ocelle-fact"),
      tooltip: customElements.get("ocelle-tooltip"),
      parts: [...(metric.shadowRoot?.querySelectorAll("[part]") ?? [])].map((each) => each.getAttribute("part")),
    }).toEqual({ metric: OcelleMetric, indicator: undefined, fact: undefined, tooltip: undefined, parts: ["label", "value"] });
  });
});
