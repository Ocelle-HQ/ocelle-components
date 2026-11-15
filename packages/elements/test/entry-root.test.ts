import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; specs/010-feedback-forms
// T015, T033, T051): importing only src/index.ts defines every element of the package, `ocelle-icon`,
// `ocelle-brand-mark`, `ocelle-notice`, `ocelle-form-input` and `ocelle-form-select`, each as the class the root exports
// (analysis F1 (a): the mark joins in phase 5; the notice in 010 phase 2, the input in 010 phase 3, the select in 010
// phase 4). This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark, ocelle-notice, ocelle-form-input and ocelle-form-select as the OcelleIcon, OcelleBrandMark, OcelleNotice, OcelleFormInput and OcelleFormSelect it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleNotice, exported.OcelleFormInput, exported.OcelleFormSelect].map((each) => typeof each)).toEqual([
      "function",
      "function",
      "function",
      "function",
      "function",
    ]);
    expect({
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      notice: customElements.get("ocelle-notice"),
      input: customElements.get("ocelle-form-input"),
      select: customElements.get("ocelle-form-select"),
    }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark, notice: exported.OcelleNotice, input: exported.OcelleFormInput, select: exported.OcelleFormSelect });
  });
});
