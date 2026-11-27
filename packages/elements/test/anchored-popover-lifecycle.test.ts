import { afterEach, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-anchored-popover.ts";

function fixture(): HTMLElement {
  const root = document.createElement("main");
  root.id = "popover-lifecycle-fixture";
  document.body.append(root);
  return root;
}

function button(label: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  return element;
}

async function mount(parent: HTMLElement | ShadowRoot) {
  const host = document.createElement("ocelle-anchored-popover");
  host.label = "Appearance";
  const decoration = document.createElement("span");
  decoration.slot = "trigger";
  decoration.textContent = "✦";
  const action = button("Use system appearance");
  host.append(decoration, action);
  parent.append(host);
  await host.updateComplete;
  const trigger = host.shadowRoot?.querySelector<HTMLButtonElement>("[part=trigger]");
  const panel = host.shadowRoot?.querySelector<HTMLElement>("[part=surface]");
  if (!trigger || !panel) throw new Error("missing rendered popover parts");
  Object.assign(panel.style, { position: "fixed", inset: "auto", left: "70px", top: "150px", margin: "0" });
  return { host, trigger, panel, action };
}

function point(element: Element): { x: number; y: number } {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
}

afterEach(() => {
  document.getElementById("popover-lifecycle-fixture")?.remove();
});

it("clears the disclosure on detach and reconnects it closed", async () => {
  const root = fixture();
  const { host, trigger, panel } = await mount(root);
  const outside = button("Outside");
  root.append(outside);
  const connections: string[] = [];
  host.addController({
    hostConnected: () => { connections.push("connected"); },
    hostDisconnected: () => { connections.push("disconnected"); },
  });
  outside.focus();
  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");

  host.remove();
  expect(panel.matches(":popover-open")).toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(connections).toEqual(["connected", "disconnected"]);
  expect(document.activeElement).toBe(outside);

  root.append(host);
  expect(panel.matches(":popover-open")).toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(connections).toEqual(["connected", "disconnected", "connected"]);
  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});

it("publishes the collapsed state in the same turn as a native close", async () => {
  const { trigger, panel } = await mount(fixture());
  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");

  panel.hidePopover();
  expect(panel.matches(":popover-open")).toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");

  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});

it("keeps a canceled native opening collapsed and allows the next opening", async () => {
  const { trigger, panel } = await mount(fixture());
  panel.addEventListener("beforetoggle", (event) => {
    event.preventDefault();
  }, { capture: true, once: true });

  trigger.click();
  expect(panel.matches(":popover-open")).toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");

  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});

it("restores focus to a scrolled-out trigger without moving its scroll container", async () => {
  const root = fixture();
  const outside = button("Outside");
  const scroller = document.createElement("div");
  Object.assign(scroller.style, { height: "60px", overflow: "auto" });
  const spacer = document.createElement("div");
  spacer.style.height = "320px";
  scroller.append(spacer);
  root.append(outside, scroller);
  const { host, trigger, panel, action } = await mount(scroller);
  outside.focus();
  // Opening through the native invoker leaves the previously focused control outside the panel.
  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  expect(document.activeElement).toBe(outside);
  action.focus({ preventScroll: true });
  expect(document.activeElement).toBe(action);
  expect(trigger.getBoundingClientRect().top).toBeGreaterThan(scroller.getBoundingClientRect().bottom);
  expect(scroller.scrollTop).toBe(0);

  host.close();
  expect(panel.matches(":popover-open")).toBe(false);
  expect(host.shadowRoot?.activeElement).toBe(trigger);
  expect(scroller.scrollTop).toBe(0);
});

it("uses the physical hit in a containing closed root when an outside control captures the release", async () => {
  const root = fixture();
  const shell = document.createElement("div");
  const closedRoot = shell.attachShadow({ mode: "closed" });
  const scope = document.createElement("div");
  const scopeRoot = scope.attachShadow({ mode: "open" });
  closedRoot.append(scope);
  root.append(shell);
  const { trigger, panel, action } = await mount(scopeRoot);
  const outside = button("Outside in the shadow root");
  scopeRoot.append(outside);
  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);

  const start = point(outside);
  const end = point(action);
  expect(document.elementFromPoint(end.x, end.y)).toBe(shell);
  expect(closedRoot.elementFromPoint(end.x, end.y)).toBe(scope);
  expect(scopeRoot.elementFromPoint(end.x, end.y)).toBe(action);
  expect(scopeRoot.elementFromPoint(start.x, start.y)).toBe(outside);
  const releases: { trusted: boolean; captured: boolean; target: EventTarget | null }[] = [];
  outside.addEventListener("pointerdown", (event) => { outside.setPointerCapture(event.pointerId); }, { once: true });
  outside.addEventListener("pointerup", (event) => {
    releases.push({ trusted: event.isTrusted, captured: outside.hasPointerCapture(event.pointerId), target: event.target });
  }, { once: true });
  await commands.pointerPath([{ ...start, down: true }, end, { ...end, up: true }]);
  expect(releases).toEqual([{ trusted: true, captured: true, target: outside }]);
  expect(panel.matches(":popover-open")).toBe(true);

  await commands.pointerPath([{ ...start, down: true }, { ...start, up: true }]);
  expect(panel.matches(":popover-open")).toBe(false);
});

it("keeps the surface open when a captured release has no hit inside a shadow host's own box", async () => {
  const root = fixture();
  const { trigger, panel } = await mount(root);
  const outside = button("Outside");
  const boundary = document.createElement("div");
  const shadow = boundary.attachShadow({ mode: "open" });
  Object.assign(boundary.style, { width: "60px", height: "60px", background: "Canvas" });
  root.append(outside, boundary);
  trigger.click();
  expect(panel.matches(":popover-open")).toBe(true);
  const start = point(outside);
  const end = point(boundary);
  expect(document.elementFromPoint(end.x, end.y)).toBe(boundary);
  expect([null, boundary]).toContain(shadow.elementFromPoint(end.x, end.y));

  const releases: { trusted: boolean; captured: boolean }[] = [];
  outside.addEventListener("pointerdown", (event) => { outside.setPointerCapture(event.pointerId); }, { once: true });
  outside.addEventListener("pointerup", (event) => {
    releases.push({ trusted: event.isTrusted, captured: outside.hasPointerCapture(event.pointerId) });
  }, { once: true });
  await commands.pointerPath([{ ...start, down: true }, end, { ...end, up: true }]);
  expect(releases).toEqual([{ trusted: true, captured: true }]);
  expect(panel.matches(":popover-open")).toBe(true);
});
