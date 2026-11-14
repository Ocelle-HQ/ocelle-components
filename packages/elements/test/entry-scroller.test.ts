import { describe, expect, it } from "vitest";
import { OcelleScroller } from "../src/ocelle-scroller.ts";

// The `ocelle-scroller` entry point (009 FR-030; contracts/elements.md § Entry points; T017): importing only
// src/ocelle-scroller.ts defines `ocelle-scroller` as the class it exports and no other element of the package. This
// file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-scroller.ts", () => {
  it("defines ocelle-scroller as OcelleScroller, and neither ocelle-icon nor ocelle-brand-mark", () => {
    expect({ scroller: customElements.get("ocelle-scroller"), icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({ scroller: OcelleScroller, icon: undefined, mark: undefined });
    expect(OcelleScroller).toBeTypeOf("function");
  });
});
