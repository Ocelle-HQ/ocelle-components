import { describe, expect, it } from "vitest";
import { OcelleBrandMark } from "../src/ocelle-brand-mark.ts";

// The `ocelle-brand-mark` entry point (005 FR-002, US1 scenario 17's runtime half; research.md R-02, R-11, T052):
// importing only src/ocelle-brand-mark.ts defines `ocelle-brand-mark` as the class it exports and no other element.
// This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-brand-mark.ts", () => {
  it("defines ocelle-brand-mark as OcelleBrandMark and not ocelle-icon", () => {
    expect({ mark: customElements.get("ocelle-brand-mark"), icon: customElements.get("ocelle-icon") }).toEqual({ mark: OcelleBrandMark, icon: undefined });
    expect(OcelleBrandMark).toBeTypeOf("function");
  });
});
