import { describe, expect, it } from "vitest";
import { OcelleEvidenceChain } from "../src/ocelle-evidence-chain.ts";

// The `ocelle-evidence-chain` entry point (019 FR-040; contracts/ocelle-evidence-chain.md; tasks.md T057): importing
// only src/ocelle-evidence-chain.ts defines `ocelle-evidence-chain` as the class it exports and, as a container
// module, its item element `ocelle-evidence-step`, and no other element; a chain so defined renders its list with the
// step assigned. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-evidence-chain.ts", () => {
  it("defines ocelle-evidence-chain as OcelleEvidenceChain and ocelle-evidence-step, and neither ocelle-facts, ocelle-data-table, ocelle-event-timeline nor ocelle-icon; a chain renders its step in a listitem", async () => {
    document.body.innerHTML = '<ocelle-evidence-chain id="c" label="Evidence"><ocelle-evidence-step id="s">Spec</ocelle-evidence-step></ocelle-evidence-chain>';
    const chain = document.getElementById("c") as OcelleEvidenceChain;
    await chain.updateComplete;
    expect({
      chain: customElements.get("ocelle-evidence-chain"),
      step: typeof customElements.get("ocelle-evidence-step"),
      others: ["ocelle-facts", "ocelle-data-table", "ocelle-event-timeline", "ocelle-timeline-event", "ocelle-icon"].map((tag) => customElements.get(tag)),
      assigned: chain.shadowRoot?.querySelector<HTMLSlotElement>('ol > li[role="listitem"] > slot')?.assignedElements().map((each) => each.id),
    }).toEqual({ chain: OcelleEvidenceChain, step: "function", others: [undefined, undefined, undefined, undefined, undefined], assigned: ["s"] });
  });
});
