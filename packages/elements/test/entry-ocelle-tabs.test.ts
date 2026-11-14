import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleTabs } from "../src/ocelle-tabs.ts";

// The `ocelle-tabs` entry point (014 research.md R-16, operator decision PLAN-CORRECTNESS-1-015 (a); contracts
// § Entry points; T044): importing only src/ocelle-tabs.ts defines `ocelle-tabs` and the `ocelle-tab` and
// `ocelle-tab-panel` it owns as children, and nothing else, and the control works: its tab and its panel are exposed
// with roles tab and tabpanel inside the named tablist. This file's own iframe (Vitest browser mode, isolate on) holds
// only what this import defines. Plant: the tabs module not importing the tab or the panel module.
describe("importing src/ocelle-tabs.ts", () => {
  it("defines ocelle-tabs as OcelleTabs, ocelle-tab and ocelle-tab-panel, and not ocelle-listbox, ocelle-icon or ocelle-brand-mark", () => {
    expect({
      tabs: customElements.get("ocelle-tabs"),
      tab: typeof customElements.get("ocelle-tab"),
      panel: typeof customElements.get("ocelle-tab-panel"),
      listbox: customElements.get("ocelle-listbox"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ tabs: OcelleTabs, tab: "function", panel: "function", listbox: undefined, icon: undefined, mark: undefined });
  });

  it("gives a working control: the tab and its panel are exposed with roles tab and tabpanel beside the named tablist", async () => {
    document.body.innerHTML = '<ocelle-tabs id="tb" label="Mission views"><ocelle-tab value="spec">Spec</ocelle-tab><ocelle-tab-panel><p>Spec content</p></ocelle-tab-panel></ocelle-tabs>';
    await (document.getElementById("tb") as unknown as { updateComplete?: Promise<unknown> }).updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const states = await commands.axStates("tb", "subtree");
    expect(states.filter((node) => ["tablist", "tab", "tabpanel"].includes(node.role)).map((node) => [node.role, node.name])).toEqual([
      ["tablist", "Mission views"],
      ["tab", "Spec"],
      ["tabpanel", "Spec"],
    ]);
  });
});
