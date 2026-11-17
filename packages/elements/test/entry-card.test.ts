import { describe, expect, it } from "vitest";
import { OcelleCard } from "../src/ocelle-card.ts";

// The `ocelle-card` entry point (011 FR-001, contracts/elements-package.md § Entry points; T014): importing only
// src/ocelle-card.ts defines `ocelle-card` as the class it exports and not `ocelle-section-header`, which a page that
// slots one imports itself (research.md R-05: the card matches headers by local name and never imports their class).
// This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-card.ts", () => {
  it("defines ocelle-card as OcelleCard, and not ocelle-section-header, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      card: customElements.get("ocelle-card"),
      others: ["ocelle-section-header", "ocelle-icon", "ocelle-brand-mark"].map((tag) => customElements.get(tag)),
    }).toEqual({ card: OcelleCard, others: [undefined, undefined, undefined] });
    expect(OcelleCard).toBeTypeOf("function");
  });
});
