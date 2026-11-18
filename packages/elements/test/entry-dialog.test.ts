import { describe, expect, it } from "vitest";
import { OcelleDialog } from "../src/ocelle-dialog.ts";

// The `ocelle-dialog` entry point (008 contracts/elements-overlays.md § Entry points; tasks.md T017): importing only
// src/ocelle-dialog.ts defines `ocelle-dialog` as the class it exports and `ocelle-icon`, which it renders, and no other
// element of the package. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-dialog.ts", () => {
  it("defines ocelle-dialog as OcelleDialog and ocelle-icon, and not ocelle-brand-mark", () => {
    expect({
      dialog: customElements.get("ocelle-dialog") === OcelleDialog,
      icon: customElements.get("ocelle-icon") !== undefined,
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ dialog: true, icon: true, mark: undefined });
    expect(OcelleDialog).toBeTypeOf("function");
  });
});
