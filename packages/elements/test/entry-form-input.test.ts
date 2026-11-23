import { describe, expect, it } from "vitest";
import { OcelleFormInput } from "../src/ocelle-form-input.ts";

// The `ocelle-form-input` entry point (specs/010-feedback-forms FR-001, contracts/elements.md; T033): importing only
// src/ocelle-form-input.ts defines `ocelle-form-input` as the class it exports and no other element. This file's own
// iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-form-input.ts", () => {
  it("defines ocelle-form-input as OcelleFormInput and neither ocelle-icon, ocelle-brand-mark nor ocelle-notice", () => {
    expect({
      input: customElements.get("ocelle-form-input"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      notice: customElements.get("ocelle-notice"),
    }).toEqual({ input: OcelleFormInput, icon: undefined, mark: undefined, notice: undefined });
    expect(OcelleFormInput).toBeTypeOf("function");
  });
});
