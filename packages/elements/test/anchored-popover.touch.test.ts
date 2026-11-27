import { afterEach, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-anchored-popover.ts";

function tapPoint(element: Element): [number, number] {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2];
}

function settle(): Promise<void> {
  return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => { done(); })));
}

afterEach(() => {
  document.getElementById("popover-touch-fixture")?.remove();
});

it("dismisses on a trusted outside tap while preserving the target's native focus and single activation", async () => {
  const fixture = document.createElement("div");
  fixture.id = "popover-touch-fixture";
  const host = document.createElement("ocelle-anchored-popover");
  host.label = "Profile for Mira";
  const initials = document.createElement("span");
  initials.slot = "trigger";
  initials.setAttribute("aria-hidden", "true");
  initials.textContent = "MK";
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = "Sign out";
  host.append(initials, action);
  const outside = document.createElement("button");
  outside.type = "button";
  outside.textContent = "Outside";
  const reference = document.createElement("button");
  reference.type = "button";
  reference.textContent = "Reference";
  fixture.append(host, outside, reference);
  document.body.append(fixture);
  await host.updateComplete;
  const trigger = host.shadowRoot?.querySelector("button[part=trigger]");
  const panel = host.shadowRoot?.querySelector<HTMLElement>("[part=surface]");
  if (trigger === null || trigger === undefined || panel === null || panel === undefined) throw new Error("missing popover fixture parts");
  Object.assign(panel.style, { position: "fixed", inset: "auto", left: "70px", top: "150px", margin: "0" });
  await commands.touchTap(...tapPoint(reference));
  const focusesNativeButton = document.activeElement === reference;
  const activations: { type: string; trusted: boolean }[] = [];
  outside.addEventListener("pointerdown", (event) => activations.push({ type: event.pointerType, trusted: event.isTrusted }));
  outside.addEventListener("click", (event) => activations.push({ type: event.type, trusted: event.isTrusted }));
  await commands.touchTap(...tapPoint(trigger));
  await settle();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(host.shadowRoot?.activeElement === trigger).toBe(focusesNativeButton);
  await commands.touchTap(...tapPoint(outside));
  await settle();
  expect({
    open: panel.matches(":popover-open"),
    expanded: trigger.getAttribute("aria-expanded"),
    outsideFocus: document.activeElement === outside,
    triggerFocus: host.shadowRoot?.activeElement === trigger,
    activations,
  }).toEqual({
    open: false,
    expanded: "false",
    outsideFocus: focusesNativeButton,
    triggerFocus: false,
    activations: [{ type: "touch", trusted: true }, { type: "click", trusted: true }],
  });
});
