import { describe, expect, it } from "vitest";
import { OcellePageHeader } from "../src/ocelle-page-header.ts";

// The `ocelle-page-header` entry point (011 FR-001, contracts/elements-package.md § Entry points; T027): importing only
// src/ocelle-page-header.ts defines `ocelle-page-header` as the class it exports and no other element, the section
// header included. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-page-header.ts", () => {
  it("defines ocelle-page-header as OcellePageHeader, and not ocelle-section-header, ocelle-card, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      header: customElements.get("ocelle-page-header"),
      others: ["ocelle-section-header", "ocelle-card", "ocelle-icon", "ocelle-brand-mark"].map((tag) => customElements.get(tag)),
    }).toEqual({ header: OcellePageHeader, others: [undefined, undefined, undefined, undefined] });
    expect(OcellePageHeader).toBeTypeOf("function");
  });
});
