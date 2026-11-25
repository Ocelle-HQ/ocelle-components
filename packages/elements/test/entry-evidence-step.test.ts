import { describe, expect, it } from "vitest";
import { OcelleEvidenceStep } from "../src/ocelle-evidence-step.ts";

// The `ocelle-evidence-step` entry point (019 FR-040; contracts/ocelle-evidence-step.md; tasks.md T057): importing only
// src/ocelle-evidence-step.ts defines `ocelle-evidence-step` as the class it exports and no other element; a
// standalone step so defined renders its content part. This file's own iframe holds only what this import defines.
describe("importing src/ocelle-evidence-step.ts", () => {
  it("defines ocelle-evidence-step as OcelleEvidenceStep and not ocelle-evidence-chain, ocelle-facts or ocelle-icon, and a standalone step renders its content part with the slot", async () => {
    document.body.innerHTML = '<ocelle-evidence-step id="s">Spec</ocelle-evidence-step>';
    const step = document.getElementById("s") as OcelleEvidenceStep;
    await step.updateComplete;
    expect({
      step: customElements.get("ocelle-evidence-step"),
      others: ["ocelle-evidence-chain", "ocelle-facts", "ocelle-icon"].map((tag) => customElements.get(tag)),
      content: step.shadowRoot?.querySelector('[part="content"] > slot') !== null && step.shadowRoot !== null,
    }).toEqual({ step: OcelleEvidenceStep, others: [undefined, undefined, undefined], content: true });
  });
});
