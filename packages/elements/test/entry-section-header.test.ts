import { describe, expect, it } from "vitest";
import { OcelleSectionHeader } from "../src/ocelle-section-header.ts";

// The `ocelle-section-header` entry point (011 FR-001, contracts/elements-package.md § Entry points; T014): importing
// only src/ocelle-section-header.ts defines `ocelle-section-header` as the class it exports and no other element, the
// card included, although the header reads the card's slot. This file's own iframe (Vitest browser mode, isolate on)
// holds only what this import defines.
describe("importing src/ocelle-section-header.ts", () => {
  it("defines ocelle-section-header as OcelleSectionHeader, and not ocelle-card, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      header: customElements.get("ocelle-section-header"),
      others: ["ocelle-card", "ocelle-icon", "ocelle-brand-mark"].map((tag) => customElements.get(tag)),
    }).toEqual({ header: OcelleSectionHeader, others: [undefined, undefined, undefined] });
    expect(OcelleSectionHeader).toBeTypeOf("function");
  });
});
