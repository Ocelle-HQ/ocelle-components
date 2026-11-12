import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052): importing only
// src/index.ts defines every element of the package, `ocelle-icon` and `ocelle-brand-mark`, each as the class the root
// exports (analysis F1 (a): the mark joins in phase 5). This file's own iframe (Vitest browser mode, isolate on) holds
// only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon and ocelle-brand-mark as the OcelleIcon and OcelleBrandMark it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark].map((each) => typeof each)).toEqual(["function", "function"]);
    expect({ icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark });
  });
});
