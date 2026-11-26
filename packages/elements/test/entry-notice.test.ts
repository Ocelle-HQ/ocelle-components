import { describe, expect, it } from "vitest";
import { OcelleNotice } from "../src/ocelle-notice.ts";

// The `ocelle-notice` entry point (specs/010-feedback-forms FR-001, contracts/elements.md; T015): importing only
// src/ocelle-notice.ts defines `ocelle-notice` as the class it exports and no other element. This file's own iframe
// (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-notice.ts", () => {
  it("defines ocelle-notice as OcelleNotice and neither ocelle-icon nor ocelle-brand-mark", () => {
    expect({
      notice: customElements.get("ocelle-notice"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ notice: OcelleNotice, icon: undefined, mark: undefined });
    expect(OcelleNotice).toBeTypeOf("function");
  });
});
