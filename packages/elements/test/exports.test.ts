import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052): it replaces the skeleton test that asserted the package "exports
// nothing yet". The root exports the two element classes, `OcelleBrandMark` and `OcelleIcon`, and nothing else at run
// time (the `IconName` type is erased).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark and OcelleIcon and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleIcon"]);
    expect([module.OcelleBrandMark, module.OcelleIcon].map((each) => typeof each)).toEqual(["function", "function"]);
  });
});
