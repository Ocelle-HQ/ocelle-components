import { describe, expect, it } from "vitest";
import { OcelleIcon } from "../src/ocelle-icon.ts";

// The `ocelle-icon` entry point (005 FR-002, US1 scenario 17's runtime half; research.md R-02, R-11, T014): importing
// only src/ocelle-icon.ts defines `ocelle-icon` as the class it exports and no other element. This file's own iframe
// (Vitest browser mode, isolate on) holds only what this import defines. Phase 2 has no `ocelle-brand-mark` module, so
// its half holds here from phase 5 on (analysis L11).
describe("importing src/ocelle-icon.ts", () => {
  it("defines ocelle-icon as OcelleIcon and not ocelle-brand-mark", () => {
    expect({ icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({ icon: OcelleIcon, mark: undefined });
    expect(OcelleIcon).toBeTypeOf("function");
  });
});
