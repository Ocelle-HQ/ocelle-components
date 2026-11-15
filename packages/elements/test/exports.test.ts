import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052): it replaces the skeleton test that asserted the package "exports
// nothing yet". The root exports the two element classes, `OcelleBrandMark` and `OcelleIcon`, and nothing else at run
// time (the `IconName` type is erased); since 013 (T006) also `OcelleFact` and `OcelleFacts`, and since 013 phase 2
// (T025) `OcelleEmptyState`, and since phase 3 (T040) `OcelleProgress`.
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon and OcelleProgress and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcelleProgress"]);
    expect([module.OcelleBrandMark, module.OcelleEmptyState, module.OcelleFact, module.OcelleFacts, module.OcelleIcon, module.OcelleProgress].map((each) => typeof each)).toEqual(["function", "function", "function", "function", "function", "function"]);
  });
});
