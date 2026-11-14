import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; 014 research.md R-16,
// T017): importing only src/index.ts defines every element of the package, `ocelle-icon`, `ocelle-brand-mark`,
// `ocelle-listbox` and `ocelle-option`, each as the class the root exports (analysis F1 (a): the mark joins in phase 5;
// 014 phase 2 adds the listbox and the option). This file's own iframe (Vitest browser mode, isolate on) holds only
// what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon and ocelle-brand-mark as the OcelleIcon and OcelleBrandMark it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark].map((each) => typeof each)).toEqual(["function", "function"]);
    expect({ icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark });
  });

  it("defines ocelle-listbox and ocelle-option as the OcelleListbox and OcelleOption it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleListbox, exported.OcelleOption].map((each) => typeof each)).toEqual(["function", "function"]);
    expect({ listbox: customElements.get("ocelle-listbox"), option: customElements.get("ocelle-option") }).toEqual({ listbox: exported.OcelleListbox, option: exported.OcelleOption });
  });
});
