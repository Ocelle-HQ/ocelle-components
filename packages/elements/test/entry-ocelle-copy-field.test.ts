import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleCopyField } from "../src/ocelle-copy-field.ts";

// The `ocelle-copy-field` entry point (014 research.md R-16, operator decision PLAN-CORRECTNESS-1-015 (a); contracts §
// Entry points; T078): importing only src/ocelle-copy-field.ts defines `ocelle-copy-field` and the `ocelle-icon` it
// renders, and nothing else, and the control works: the field is exposed as a group holding its text and the Copy
// button, and the icon is drawn. This file's own iframe (Vitest browser mode, isolate on) holds only what this import
// defines. Plant: the copy field's module not importing the icon's module.
describe("importing src/ocelle-copy-field.ts", () => {
  it("defines ocelle-copy-field as OcelleCopyField and ocelle-icon, and not ocelle-listbox, ocelle-tabs, ocelle-segmented-choice or ocelle-brand-mark", () => {
    expect({
      field: customElements.get("ocelle-copy-field"),
      icon: typeof customElements.get("ocelle-icon"),
      listbox: customElements.get("ocelle-listbox"),
      tabs: customElements.get("ocelle-tabs"),
      segmented: customElements.get("ocelle-segmented-choice"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ field: OcelleCopyField, icon: "function", listbox: undefined, tabs: undefined, segmented: undefined, mark: undefined });
  });

  it("gives a working control: the field is a group holding its text and the Copy button, and the copy icon is drawn", async () => {
    document.body.innerHTML = '<ocelle-copy-field id="cf" value="pnpm run manifest"></ocelle-copy-field>';
    const field = document.getElementById("cf") as unknown as { updateComplete?: Promise<unknown>; shadowRoot: ShadowRoot | null };
    await field.updateComplete;
    const icon = field.shadowRoot?.querySelector("ocelle-icon") as unknown as { updateComplete?: Promise<unknown>; shadowRoot: ShadowRoot | null } | null;
    await icon?.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const states = await commands.axStates("cf", "subtree");
    expect({
      exposed: states.filter((node) => ["group", "StaticText", "button"].includes(node.role)).map((node) => [node.role, node.name]),
      drawn: icon?.shadowRoot?.querySelector("svg") !== null && icon?.shadowRoot !== undefined && icon.shadowRoot !== null,
    }).toEqual({
      exposed: [
        ["group", ""],
        ["StaticText", "pnpm run manifest"],
        ["button", "Copy"],
      ],
      drawn: true,
    });
  });
});
