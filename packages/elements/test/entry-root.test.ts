import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; 011 FR-001, T014):
// importing only src/index.ts defines every element of the package, `ocelle-icon`, `ocelle-brand-mark` and, since 011,
// `ocelle-card`, `ocelle-section-header` and `ocelle-page-header` (T027), each as the class the root exports (analysis F1 (a): the mark joins in
// 005 phase 5). This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark, ocelle-card, ocelle-section-header and ocelle-page-header as the OcelleIcon, OcelleBrandMark, OcelleCard, OcelleSectionHeader and OcellePageHeader it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleCard, exported.OcelleSectionHeader, exported.OcellePageHeader].map((each) => typeof each)).toEqual(["function", "function", "function", "function", "function"]);
    expect({
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      card: customElements.get("ocelle-card"),
      header: customElements.get("ocelle-section-header"),
      page: customElements.get("ocelle-page-header"),
    }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark, card: exported.OcelleCard, header: exported.OcelleSectionHeader, page: exported.OcellePageHeader });
  });
});
