import { describe, expect, it } from "vitest";

// The package root's exports (005 FR-032, T021): it replaces the skeleton test that asserted the package "exports
// nothing yet". In phase 2 the root exports `OcelleIcon` and nothing else at run time (the `IconName` type is
// erased); phase 5 adds `OcelleBrandMark`.
describe("@ocelle/elements root exports", () => {
  it("exports OcelleIcon and nothing else", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual(["OcelleIcon"]);
    expect(module.OcelleIcon).toBeTypeOf("function");
  });
});
