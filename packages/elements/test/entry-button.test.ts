import { describe, expect, it } from "vitest";
import { OcelleButton } from "../src/ocelle-button.ts";

// The `ocelle-button` entry point (012 contracts/elements-package.md § Entry points; tasks.md T018): importing only
// src/ocelle-button.ts defines `ocelle-button` as the class it exports and no other element, neither `ocelle-icon` nor
// `ocelle-brand-mark`. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-button.ts", () => {
  it("defines ocelle-button as OcelleButton and neither ocelle-icon nor ocelle-brand-mark", () => {
    expect({ button: customElements.get("ocelle-button"), icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({
      button: OcelleButton,
      icon: undefined,
      mark: undefined,
    });
    expect(OcelleButton).toBeTypeOf("function");
  });
});
