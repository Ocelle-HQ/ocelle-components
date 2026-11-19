import { describe, expect, it } from "vitest";
import { OcelleActionRow } from "../src/ocelle-action-row.ts";

// The `ocelle-action-row` entry point (012 contracts/elements-package.md § Entry points; tasks.md T051): importing only
// src/ocelle-action-row.ts defines `ocelle-action-row` as the class it exports and no other element, neither
// `ocelle-button`, `ocelle-icon` nor `ocelle-brand-mark`. This file's own iframe (Vitest browser mode, isolate on)
// holds only what this import defines.
describe("importing src/ocelle-action-row.ts", () => {
  it("defines ocelle-action-row as OcelleActionRow and neither ocelle-button, ocelle-icon nor ocelle-brand-mark", () => {
    expect({ row: customElements.get("ocelle-action-row"), button: customElements.get("ocelle-button"), icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({
      row: OcelleActionRow,
      button: undefined,
      icon: undefined,
      mark: undefined,
    });
    expect(OcelleActionRow).toBeTypeOf("function");
  });
});
