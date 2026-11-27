import { expect, it } from "vitest";
import type { OcelleAnchoredPopover } from "../src/ocelle-anchored-popover.ts";

// Keep the observable assertion runnable against the phase base before this entry exists.
const modules = import.meta.glob<{ OcelleAnchoredPopover: typeof OcelleAnchoredPopover }>(
  "../src/ocelle-anchored-popover.ts",
  { eager: true },
);

it("starts with a blank label and a disabled native standalone trigger", async () => {
  const popover = document.createElement("ocelle-anchored-popover");
  document.body.append(popover);
  try {
    await popover.updateComplete;
    const trigger = popover.shadowRoot?.querySelector("button");
    expect({ label: popover.label, disabled: trigger?.disabled }).toEqual({ label: "", disabled: true });
  } finally {
    popover.remove();
  }
});

it("updates the native trigger when the label attribute is set, removed and set again", async () => {
  const popover = document.createElement("ocelle-anchored-popover");
  document.body.append(popover);
  try {
    await popover.updateComplete;
    const trigger = popover.shadowRoot?.querySelector("button");
    const labelState = () => ({
      label: popover.label,
      name: trigger?.getAttribute("aria-label"),
      disabled: trigger?.disabled,
    });

    popover.setAttribute("label", "Compact controls");
    await popover.updateComplete;
    expect(labelState()).toEqual({ label: "Compact controls", name: "Compact controls", disabled: false });

    popover.removeAttribute("label");
    await popover.updateComplete;
    expect(labelState()).toEqual({ label: "", name: "", disabled: true });

    popover.setAttribute("label", "");
    await popover.updateComplete;
    expect(labelState()).toEqual({ label: "", name: "", disabled: true });

    popover.setAttribute("label", "Quick actions");
    await popover.updateComplete;
    expect(labelState()).toEqual({ label: "Quick actions", name: "Quick actions", disabled: false });
  } finally {
    popover.remove();
  }
});

it("sets the standalone placement property from its above and below attributes", async () => {
  const popover = document.createElement("ocelle-anchored-popover");
  document.body.append(popover);
  try {
    await popover.updateComplete;
    expect(popover.placement).toBe("below");

    popover.setAttribute("placement", "above");
    await popover.updateComplete;
    expect(popover.placement).toBe("above");

    popover.setAttribute("placement", "below");
    await popover.updateComplete;
    expect(popover.placement).toBe("below");
  } finally {
    popover.remove();
  }
});

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
