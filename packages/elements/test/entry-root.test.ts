import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014): importing only src/index.ts
// defines every element of the package and exports its class. In phase 2 that is `ocelle-icon` alone (no
// `ocelle-brand-mark` module exists, not even a stub, analysis F1 (a)); T052 extends this file to both elements in
// phase 5. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon as the OcelleIcon it exports", () => {
    expect(root.OcelleIcon).toBeTypeOf("function");
    expect(customElements.get("ocelle-icon")).toBe(root.OcelleIcon);
  });
});
