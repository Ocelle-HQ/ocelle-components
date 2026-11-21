import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleLink } from "../src/ocelle-link.ts";

// The `ocelle-link` entry point (014 research.md R-16; contracts § Entry points; T094): importing only
// src/ocelle-link.ts defines `ocelle-link` and nothing else (the link renders no other element), and the control works:
// the link is exposed as a link named by its text and emits its event on a click. This file's own iframe (Vitest
// browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-link.ts", () => {
  it("defines ocelle-link as OcelleLink, and not ocelle-icon, ocelle-listbox, ocelle-tabs, ocelle-segmented-choice, ocelle-copy-field or ocelle-brand-mark", () => {
    expect({
      link: customElements.get("ocelle-link"),
      others: ["ocelle-icon", "ocelle-listbox", "ocelle-tabs", "ocelle-segmented-choice", "ocelle-copy-field", "ocelle-brand-mark"].map((tag) => customElements.get(tag)),
    }).toEqual({ link: OcelleLink, others: [undefined, undefined, undefined, undefined, undefined, undefined] });
  });

  it("gives a working control: the link is exposed as a link named by its text inside the paragraph, and a click on it emits ocelle-link-activate", async () => {
    document.body.innerHTML = '<p id="para">See <ocelle-link id="link">the mission log</ocelle-link>.</p>';
    const link = document.getElementById("link") as unknown as { updateComplete?: Promise<unknown>; shadowRoot: ShadowRoot | null };
    await link.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const events: unknown[] = [];
    document.addEventListener("ocelle-link-activate", (event) => events.push((event as CustomEvent<unknown>).detail), { once: true });
    link.shadowRoot?.querySelector<HTMLElement>('[part~="anchor"]')?.click();
    const states = await commands.axStates("para", "subtree");
    expect({ exposed: states.filter((node) => node.role === "link").map((node) => [node.role, node.name]), events }).toEqual({ exposed: [["link", "the mission log"]], events: [{ href: null }] });
  });
});
