import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; specs/010-feedback-forms T015, T016c, T034b, T052b): it replaces
// the skeleton test that asserted the package "exports nothing yet". The root exports the element classes,
// `OcelleBrandMark`, `OcelleFormInput`, `OcelleFormSelect`, `OcelleIcon` and `OcelleNotice`, and nothing else at run
// time (the `IconName` type is erased; the internal `FormControl` base class is not exported). A module namespace object
// lists its keys in code-unit order (research R-11).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleFormInput, OcelleFormSelect, OcelleIcon and OcelleNotice and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleBrandMark", "OcelleFormInput", "OcelleFormSelect", "OcelleIcon", "OcelleNotice"]);
    expect([module.OcelleBrandMark, module.OcelleFormInput, module.OcelleFormSelect, module.OcelleIcon, module.OcelleNotice].map((each) => typeof each)).toEqual([
      "function",
      "function",
      "function",
      "function",
      "function",
    ]);
  });
});
