import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleListbox } from "../src/ocelle-listbox.ts";

// The `ocelle-listbox` entry point (014 research.md R-16, operator decision PLAN-CORRECTNESS-1-015 (a); contracts
// § Entry points; T017): importing only src/ocelle-listbox.ts defines `ocelle-listbox` and the `ocelle-option` it owns as
// children, and nothing else, and the control works: its option is exposed with role option. This file's own iframe
// (Vitest browser mode, isolate on) holds only what this import defines. Plant: the listbox module not importing the
// option module.
describe("importing src/ocelle-listbox.ts", () => {
  it("defines ocelle-listbox as OcelleListbox and ocelle-option, and not ocelle-icon or ocelle-brand-mark", () => {
    const option = customElements.get("ocelle-option");
    expect({ listbox: customElements.get("ocelle-listbox"), option: typeof option, icon: customElements.get("ocelle-icon"), mark: customElements.get("ocelle-brand-mark") }).toEqual({
      listbox: OcelleListbox,
      option: "function",
      icon: undefined,
      mark: undefined,
    });
  });

  it("gives a working control: the option of a listbox is exposed with role option inside the named listbox", async () => {
    document.body.innerHTML = '<ocelle-listbox id="lb" label="Folders"><ocelle-option value="alpha">alpha</ocelle-option></ocelle-listbox>';
    await (document.getElementById("lb") as unknown as { updateComplete?: Promise<unknown> }).updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const states = await commands.axStates("lb", "subtree");
    expect(states.filter((node) => node.role === "listbox" || node.role === "option").map((node) => [node.role, node.name])).toEqual([
      ["listbox", "Folders"],
      ["option", "alpha"],
    ]);
  });
});
