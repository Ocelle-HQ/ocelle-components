import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052): it replaces the skeleton test that asserted the package "exports
// nothing yet". The root exports the element classes, `OcelleActionRow` (012, tasks.md T051), `OcelleBrandMark`,
// `OcelleButton` (012, tasks.md T018) and `OcelleIcon`, and nothing else at run time (the `IconName` type is erased).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleActionRow, OcelleBrandMark, OcelleButton and OcelleIcon and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleActionRow", "OcelleBrandMark", "OcelleButton", "OcelleIcon"]);
    expect([module.OcelleActionRow, module.OcelleBrandMark, module.OcelleButton, module.OcelleIcon].map((each) => typeof each)).toEqual(["function", "function", "function", "function"]);
  });
});
