import { describe, expect, it } from "vitest";
import { OcelleFacts } from "../src/ocelle-facts.ts";

// The `ocelle-facts` entry point (013 contracts/elements.md § Modules and exports, PLAN-CORRECTNESS-1-012 (a); T006):
// importing only src/ocelle-facts.ts defines `ocelle-facts` as the class it exports and, as a container module, its
// item element `ocelle-fact`, and no other element. This file's own iframe (Vitest browser mode, isolate on) holds only
// what this import defines.
describe("importing src/ocelle-facts.ts", () => {
  it("defines ocelle-facts as OcelleFacts and ocelle-fact, but not ocelle-icon or ocelle-brand-mark, and a sheet renders its pair as a term", async () => {
    document.body.innerHTML = '<ocelle-facts id="s"><ocelle-fact label="Owner">Ada</ocelle-fact></ocelle-facts>';
    const sheet = document.getElementById("s") as OcelleFacts;
    await sheet.updateComplete;
    expect({
      facts: customElements.get("ocelle-facts"),
      fact: typeof customElements.get("ocelle-fact"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      term: sheet.shadowRoot?.querySelector("dt")?.textContent,
    }).toEqual({ facts: OcelleFacts, fact: "function", icon: undefined, mark: undefined, term: "Owner" });
  });
});
