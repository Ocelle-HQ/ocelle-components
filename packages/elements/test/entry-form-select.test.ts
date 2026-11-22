import { describe, expect, it } from "vitest";
import { OcelleFormSelect } from "../src/ocelle-form-select.ts";

// The `ocelle-form-select` entry point (specs/010-feedback-forms FR-001, contracts/elements.md, research.md R-07; T051;
// PLAN-CORRECTNESS-1-003 (a)): importing only src/ocelle-form-select.ts defines `ocelle-form-select` as the class it
// exports and no other element: the select draws its indicator itself and does not define `ocelle-icon`. This file's own
// iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-form-select.ts", () => {
  it("defines ocelle-form-select as OcelleFormSelect and neither ocelle-icon, ocelle-brand-mark, ocelle-notice nor ocelle-form-input", () => {
    expect({
      select: customElements.get("ocelle-form-select"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      notice: customElements.get("ocelle-notice"),
      input: customElements.get("ocelle-form-input"),
    }).toEqual({ select: OcelleFormSelect, icon: undefined, mark: undefined, notice: undefined, input: undefined });
    expect(OcelleFormSelect).toBeTypeOf("function");
  });
});
