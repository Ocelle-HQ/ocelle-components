import { describe, expect, it } from "vitest";
import { OcelleProgress } from "../src/ocelle-progress.ts";

// The `ocelle-progress` entry point (013 contracts/elements.md § Modules and exports; T040): importing only
// src/ocelle-progress.ts defines `ocelle-progress` as the class it exports and no other element. This file's own
// iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-progress.ts", () => {
  it("defines ocelle-progress as OcelleProgress and not ocelle-empty-state, ocelle-facts, ocelle-fact, ocelle-icon or ocelle-brand-mark, and a bar renders its track and fill", async () => {
    document.body.innerHTML = '<ocelle-progress id="p" value="7" max="12" label="Tasks done"></ocelle-progress>';
    const bar = document.getElementById("p") as OcelleProgress;
    await bar.updateComplete;
    expect({
      progress: customElements.get("ocelle-progress"),
      state: customElements.get("ocelle-empty-state"),
      facts: customElements.get("ocelle-facts"),
      fact: customElements.get("ocelle-fact"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      parts: [...(bar.shadowRoot?.querySelectorAll("[part]") ?? [])].map((each) => each.getAttribute("part")),
    }).toEqual({ progress: OcelleProgress, state: undefined, facts: undefined, fact: undefined, icon: undefined, mark: undefined, parts: ["track", "fill"] });
  });
});
