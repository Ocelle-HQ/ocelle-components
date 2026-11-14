import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052): importing only
// src/index.ts defines every element of the package, `ocelle-icon` and `ocelle-brand-mark`, each as the class the root
// exports (analysis F1 (a): the mark joins in phase 5). This file's own iframe (Vitest browser mode, isolate on) holds
// only what this import defines. 012 (tasks.md T018) adds `ocelle-button` and its class `OcelleButton`.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark and ocelle-button as the OcelleIcon, OcelleBrandMark and OcelleButton it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleButton].map((each) => typeof each)).toEqual(["function", "function", "function"]);
    expect({ icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark"), button: customElements.get("ocelle-button") }).toEqual({
      icon: exported.OcelleIcon,
      mark: exported.OcelleBrandMark,
      button: exported.OcelleButton,
    });
  });
});
