import { describe, expect, it } from "vitest";
import { OcelleOption } from "../src/ocelle-option.ts";

// The `ocelle-option` entry point (014 research.md R-16; contracts § Entry points; T017): importing only
// src/ocelle-option.ts defines `ocelle-option` as the class it exports, and not the listbox, which owns options but is
// not owned by them. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-option.ts", () => {
  it("defines ocelle-option as OcelleOption and not ocelle-listbox", () => {
    expect({ option: customElements.get("ocelle-option"), listbox: customElements.get("ocelle-listbox") }).toEqual({ option: OcelleOption, listbox: undefined });
  });
});
