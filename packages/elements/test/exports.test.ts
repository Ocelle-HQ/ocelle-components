import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021, T052): it replaces the skeleton test that asserted the package "exports
// nothing yet". The root exports the element classes, `OcelleBrandMark`, `OcelleDialog` (008 T017), `OcelleDrawer` (008 T032), `OcelleIcon` and `OcelleTooltip` (008 T043),
// sorted, and nothing else at run time (the `IconName` type is erased; the overlays' internal base is not exported);
// since 013 (T006) also `OcelleFact` and `OcelleFacts`, since 013 phase 2 (T025) `OcelleEmptyState`, and since phase 3
// (T040) `OcelleProgress`.
describe("@ocelle/elements root exports", () => {
  it("exports OcelleBrandMark, OcelleDialog, OcelleDrawer, OcelleEmptyState, OcelleFact, OcelleFacts, OcelleIcon, OcelleProgress and OcelleTooltip and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    const names = ["OcelleBrandMark", "OcelleDialog", "OcelleDrawer", "OcelleEmptyState", "OcelleFact", "OcelleFacts", "OcelleIcon", "OcelleProgress", "OcelleTooltip"];
    expect(Object.keys(module)).toEqual(names);
    expect(names.map((name) => typeof module[name])).toEqual(names.map(() => "function"));
  });
});
