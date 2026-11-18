import { describe, expect, it } from "vitest";
import { OcelleDataTable } from "../src/ocelle-data-table.ts";

// The `ocelle-data-table` entry point (019 FR-040; contracts/ocelle-data-table.md; tasks.md T010): importing only
// src/ocelle-data-table.ts defines `ocelle-data-table` as the class it exports and no other element of the package,
// and the element so defined renders the overflow region's box. This file's own iframe (Vitest browser mode, isolate
// on) holds only what this import defines.
describe("importing src/ocelle-data-table.ts", () => {
  it("defines ocelle-data-table as OcelleDataTable, and neither ocelle-scroller, ocelle-icon nor ocelle-facts; an instance renders .region-box", async () => {
    const others = ["ocelle-scroller", "ocelle-icon", "ocelle-brand-mark", "ocelle-facts", "ocelle-workflow-board", "ocelle-card"].map((tag) => customElements.get(tag));
    const element = document.createElement("ocelle-data-table");
    document.body.append(element);
    await element.updateComplete;
    const box = element.shadowRoot?.querySelector(".region-box") ?? null;
    element.remove();
    expect({ defined: customElements.get("ocelle-data-table"), others, box: box !== null }).toEqual({ defined: OcelleDataTable, others: [undefined, undefined, undefined, undefined, undefined, undefined], box: true });
  });
});
