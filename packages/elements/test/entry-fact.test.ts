import { describe, expect, it } from "vitest";
import { OcelleFact } from "../src/ocelle-fact.ts";

// The `ocelle-fact` entry point (013 contracts/elements.md § Modules and exports; T006): importing only
// src/ocelle-fact.ts defines `ocelle-fact` as the class it exports and no other element. This file's own iframe holds
// only what this import defines.
describe("importing src/ocelle-fact.ts", () => {
  it("defines ocelle-fact as OcelleFact and not ocelle-facts, ocelle-icon or ocelle-brand-mark, and a standalone fact shows its label", async () => {
    document.body.innerHTML = '<ocelle-fact id="f" label="Owner">Ada</ocelle-fact>';
    const fact = document.getElementById("f") as OcelleFact;
    await fact.updateComplete;
    expect({
      fact: customElements.get("ocelle-fact"),
      facts: customElements.get("ocelle-facts"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      label: fact.shadowRoot?.querySelector('[part="label"]')?.textContent,
    }).toEqual({ fact: OcelleFact, facts: undefined, icon: undefined, mark: undefined, label: "Owner" });
  });
});
