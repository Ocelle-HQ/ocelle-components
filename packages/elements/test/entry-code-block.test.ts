import { describe, expect, it } from "vitest";
import { OcelleCodeBlock } from "../src/ocelle-code-block.ts";

// The `ocelle-code-block` entry point (020 contracts/checks.md § Scenario bodies and harnesses; tasks.md T026):
// importing only src/ocelle-code-block.ts defines `ocelle-code-block` as the class it exports and no other element (the
// overflow-region module it uses is not an element). This file's own iframe (Vitest browser mode, isolate on) holds
// only what this import defines.
describe("importing src/ocelle-code-block.ts", () => {
  it("defines ocelle-code-block as OcelleCodeBlock, and not ocelle-scroller, ocelle-icon or ocelle-disclosure; a code block renders its parts block and code with its text", async () => {
    document.body.innerHTML = '<ocelle-code-block id="c">git push origin main</ocelle-code-block>';
    const block = document.getElementById("c") as OcelleCodeBlock;
    await block.updateComplete;
    expect({
      block: customElements.get("ocelle-code-block"),
      scroller: customElements.get("ocelle-scroller"),
      icon: customElements.get("ocelle-icon"),
      disclosure: customElements.get("ocelle-disclosure"),
      parts: [...(block.shadowRoot?.querySelectorAll("[part]") ?? [])].map((each) => each.getAttribute("part")),
      text: block.shadowRoot?.querySelector('[part="code"]')?.textContent ?? null,
    }).toEqual({ block: OcelleCodeBlock, scroller: undefined, icon: undefined, disclosure: undefined, parts: ["block", "code"], text: "git push origin main" });
  });
});
