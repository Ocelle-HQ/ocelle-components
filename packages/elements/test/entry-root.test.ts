import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; specs/010-feedback-forms
// T015): importing only src/index.ts defines every element of the package, `ocelle-icon`, `ocelle-brand-mark` and
// `ocelle-notice`, each as the class the root exports (analysis F1 (a): the mark joins in phase 5; the notice in 010
// phase 2). This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark and ocelle-notice as the OcelleIcon, OcelleBrandMark and OcelleNotice it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleNotice].map((each) => typeof each)).toEqual(["function", "function", "function"]);
    expect({
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      notice: customElements.get("ocelle-notice"),
    }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark, notice: exported.OcelleNotice });
  });
});
