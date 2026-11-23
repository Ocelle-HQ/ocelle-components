import { describe, expect, it } from "vitest";
import { OcelleDisclosure } from "../src/ocelle-disclosure.ts";

// The `ocelle-disclosure` entry point (020 contracts/checks.md § Scenario bodies and harnesses; tasks.md T006):
// importing only src/ocelle-disclosure.ts defines `ocelle-disclosure` as the class it exports and `ocelle-icon` for
// its chevron, and no other element. This file's own iframe (Vitest browser mode, isolate on) holds only what this
// import defines.
describe("importing src/ocelle-disclosure.ts", () => {
  it("defines ocelle-disclosure as OcelleDisclosure and ocelle-icon, and not ocelle-button, ocelle-brand-mark or ocelle-scroller; a closed disclosure renders its summary with the chevron-end icon", async () => {
    document.body.innerHTML = '<ocelle-disclosure id="d"><span slot="summary">Advanced settings</span><p>The retention period is thirty days.</p></ocelle-disclosure>';
    const disclosure = document.getElementById("d") as OcelleDisclosure;
    await disclosure.updateComplete;
    expect({
      disclosure: customElements.get("ocelle-disclosure"),
      icon: typeof customElements.get("ocelle-icon"),
      button: customElements.get("ocelle-button"),
      mark: customElements.get("ocelle-brand-mark"),
      scroller: customElements.get("ocelle-scroller"),
      parts: [...(disclosure.shadowRoot?.querySelectorAll("[part]") ?? [])].map((each) => each.getAttribute("part")),
      chevron: disclosure.shadowRoot?.querySelector("ocelle-icon")?.getAttribute("name") ?? null,
    }).toEqual({ disclosure: OcelleDisclosure, icon: "function", button: undefined, mark: undefined, scroller: undefined, parts: ["details", "summary", "panel"], chevron: "chevron-end" });
  });
});
