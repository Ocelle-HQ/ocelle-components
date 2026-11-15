import { describe, expect, it } from "vitest";
import { OcellePersonalRail } from "../src/ocelle-personal-rail.ts";

// The `ocelle-personal-rail` entry point (011 FR-001, contracts/elements-package.md § Entry points; T042): importing
// only src/ocelle-personal-rail.ts defines `ocelle-personal-rail` as the class it exports and no other element.
// This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-personal-rail.ts", () => {
  it("defines ocelle-personal-rail as OcellePersonalRail, and not ocelle-context-sidebar, ocelle-page-header, ocelle-section-header, ocelle-card, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      rail: customElements.get("ocelle-personal-rail"),
      others: ["ocelle-context-sidebar", "ocelle-page-header", "ocelle-section-header", "ocelle-card", "ocelle-icon", "ocelle-brand-mark"].map((tag) => customElements.get(tag)),
    }).toEqual({ rail: OcellePersonalRail, others: [undefined, undefined, undefined, undefined, undefined, undefined] });
    expect(OcellePersonalRail).toBeTypeOf("function");
  });
});
