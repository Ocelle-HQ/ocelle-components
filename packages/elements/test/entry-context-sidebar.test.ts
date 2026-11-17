import { describe, expect, it } from "vitest";
import { OcelleContextSidebar } from "../src/ocelle-context-sidebar.ts";

// The `ocelle-context-sidebar` entry point (011 FR-001, contracts/elements-package.md § Entry points; T034): importing
// only src/ocelle-context-sidebar.ts defines `ocelle-context-sidebar` as the class it exports and no other element.
// This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-context-sidebar.ts", () => {
  it("defines ocelle-context-sidebar as OcelleContextSidebar, and not ocelle-page-header, ocelle-section-header, ocelle-card, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      sidebar: customElements.get("ocelle-context-sidebar"),
      others: ["ocelle-page-header", "ocelle-section-header", "ocelle-card", "ocelle-icon", "ocelle-brand-mark"].map((tag) => customElements.get(tag)),
    }).toEqual({ sidebar: OcelleContextSidebar, others: [undefined, undefined, undefined, undefined, undefined] });
    expect(OcelleContextSidebar).toBeTypeOf("function");
  });
});
