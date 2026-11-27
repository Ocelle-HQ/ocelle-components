import { expect, it } from "vitest";
import type { OcelleAnchoredPopover } from "../src/ocelle-anchored-popover.ts";

// Keep the observable assertion runnable against the phase base before this entry exists.
const modules = import.meta.glob<{ OcelleAnchoredPopover: typeof OcelleAnchoredPopover }>(
  "../src/ocelle-anchored-popover.ts",
  { eager: true },
);

it("registers and opens the standalone anchored popover without registering sibling elements", async () => {
  const exported = modules["../src/ocelle-anchored-popover.ts"]?.OcelleAnchoredPopover;
  const popover = document.createElement("ocelle-anchored-popover");
  popover.setAttribute("label", "Compact controls");
  document.body.append(popover);
  try {
    await popover.updateComplete;
    const trigger = popover.shadowRoot?.querySelector("button");
    const surface = popover.shadowRoot?.querySelector('[part="surface"]');
    trigger?.click();
    await popover.updateComplete;
    const registered = customElements.get("ocelle-anchored-popover");
    expect({
      exported: typeof exported,
      registered,
      opened: surface?.matches(":popover-open") ?? false,
      siblings: ["ocelle-button", "ocelle-dialog", "ocelle-icon", "ocelle-tooltip"].map((tag) => customElements.get(tag)),
    }).toEqual({ exported: "function", registered: exported, opened: true, siblings: [undefined, undefined, undefined, undefined] });
  } finally {
    popover.remove();
  }
});
