import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052; specs/010-feedback-forms T015, T016c, T034b, T052b; 013 T006,
// T025, T040): it replaces the skeleton test that asserted the package "exports nothing yet". The root exports the
// element classes, `OcelleBrandMark`, `OcelleEmptyState`, `OcelleFact`, `OcelleFacts`, `OcelleFormInput`,
// `OcelleFormSelect`, `OcelleIcon`, `OcelleNotice` and `OcelleProgress`, and nothing else at run time (the `IconName`
// type is erased; the internal `FormControl` base class is not exported). A module namespace object lists its keys in
// code-unit order (research R-11).
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleFormInput, OcelleFormSelect, OcelleIcon, OcelleNotice and OcelleProgress and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual([
      "OcelleBrandMark",
      "OcelleEmptyState",
      "OcelleFact",
      "OcelleFacts",
      "OcelleFormInput",
      "OcelleFormSelect",
      "OcelleIcon",
      "OcelleNotice",
      "OcelleProgress",
    ]);
    expect(
      [
        module.OcelleBrandMark,
        module.OcelleEmptyState,
        module.OcelleFact,
        module.OcelleFacts,
        module.OcelleFormInput,
        module.OcelleFormSelect,
        module.OcelleIcon,
        module.OcelleNotice,
        module.OcelleProgress,
      ].map((each) => typeof each),
    ).toEqual(["function", "function", "function", "function", "function", "function", "function", "function", "function"]);
  });
});
