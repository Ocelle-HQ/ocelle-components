import { describe, expect, it } from "vitest";
import { OcelleEmptyState } from "../src/ocelle-empty-state.ts";

// The `ocelle-empty-state` entry point (013 contracts/elements.md § Modules and exports; T025): importing only
// src/ocelle-empty-state.ts defines `ocelle-empty-state` as the class it exports and no other element. This file's
// own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-empty-state.ts", () => {
  it("defines ocelle-empty-state as OcelleEmptyState and not ocelle-facts, ocelle-fact, ocelle-icon or ocelle-brand-mark, and an empty state renders its heading slot", async () => {
    document.body.innerHTML = '<ocelle-empty-state id="e"><h2 slot="heading">No missions yet</h2></ocelle-empty-state>';
    const state = document.getElementById("e") as OcelleEmptyState;
    await state.updateComplete;
    expect({
      state: customElements.get("ocelle-empty-state"),
      facts: customElements.get("ocelle-facts"),
      fact: customElements.get("ocelle-fact"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      heading: state.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="heading"]')?.assignedElements().map((each) => each.textContent),
    }).toEqual({ state: OcelleEmptyState, facts: undefined, fact: undefined, icon: undefined, mark: undefined, heading: ["No missions yet"] });
  });
});
