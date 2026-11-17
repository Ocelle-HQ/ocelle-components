import { describe, expect, it } from "vitest";
import { OcelleTooltip } from "../src/ocelle-tooltip.ts";

// The `ocelle-tooltip` entry point (008 contracts/elements-overlays.md § Entry points; tasks.md T043): importing only
// src/ocelle-tooltip.ts defines `ocelle-tooltip` as the class it exports and no other element of the package, not
// even `ocelle-icon` (it renders none). This file's own iframe (Vitest browser mode, isolate on) holds only what this
// import defines.
describe("importing src/ocelle-tooltip.ts", () => {
  it("defines ocelle-tooltip as OcelleTooltip, and not ocelle-icon, ocelle-dialog, ocelle-drawer or ocelle-brand-mark", () => {
    expect({
      tooltip: customElements.get("ocelle-tooltip") === OcelleTooltip,
      icon: customElements.get("ocelle-icon"),
      dialog: customElements.get("ocelle-dialog"),
      drawer: customElements.get("ocelle-drawer"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ tooltip: true, icon: undefined, dialog: undefined, drawer: undefined, mark: undefined });
    expect(OcelleTooltip).toBeTypeOf("function");
  });
});
