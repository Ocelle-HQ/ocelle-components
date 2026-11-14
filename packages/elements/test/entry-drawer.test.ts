import { describe, expect, it } from "vitest";
import { OcelleDrawer } from "../src/ocelle-drawer.ts";

// The `ocelle-drawer` entry point (008 contracts/elements-overlays.md § Entry points; tasks.md T032): importing only
// src/ocelle-drawer.ts defines `ocelle-drawer` as the class it exports and `ocelle-icon`, which it renders, and no other
// element of the package. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-drawer.ts", () => {
  it("defines ocelle-drawer as OcelleDrawer and ocelle-icon, and not ocelle-dialog or ocelle-brand-mark", () => {
    expect({
      drawer: customElements.get("ocelle-drawer") === OcelleDrawer,
      icon: customElements.get("ocelle-icon") !== undefined,
      dialog: customElements.get("ocelle-dialog"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ drawer: true, icon: true, dialog: undefined, mark: undefined });
    expect(OcelleDrawer).toBeTypeOf("function");
  });
});
