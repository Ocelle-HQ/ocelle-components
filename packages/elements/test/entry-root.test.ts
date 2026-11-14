import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052): importing only
// src/index.ts defines every element of the package, each as the class the root exports (analysis F1 (a): the mark
// joins in phase 5). Since 009 (T017) `ocelle-scroller` is one of them. This file's own iframe (Vitest browser mode,
// isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark and ocelle-scroller as the OcelleIcon, OcelleBrandMark and OcelleScroller it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleScroller].map((each) => typeof each)).toEqual(["function", "function", "function"]);
    expect({ icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark"), scroller: customElements.get("ocelle-scroller") }).toEqual({
      icon: exported.OcelleIcon,
      mark: exported.OcelleBrandMark,
      scroller: exported.OcelleScroller,
    });
  });
});
