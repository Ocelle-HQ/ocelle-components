import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import type { OcelleAnchoredPopover } from "../src/ocelle-anchored-popover.ts";

const modules = import.meta.glob("../src/ocelle-anchored-popover.ts", { eager: true });

interface Fixture {
  readonly host: OcelleAnchoredPopover;
  readonly trigger: HTMLButtonElement;
  readonly panel: HTMLElement;
  readonly first: HTMLButtonElement;
  readonly last: HTMLButtonElement;
  readonly outside: HTMLButtonElement;
  readonly before: HTMLButtonElement;
}

function required<T extends Element>(element: T | null, name: string): T {
  if (element === null) throw new Error(`missing fixture element ${name}`);
  return element;
}

async function mount(label = "Appearance", decoration = "✦", content = ""): Promise<Fixture> {
  const fixture = document.createElement("main");
  fixture.id = "popover-fixture";
  fixture.innerHTML = `
    <button type="button" id="before">Previous</button>
    <ocelle-anchored-popover id="popover">
      <span slot="trigger" aria-hidden="true"></span>
      <button type="button" id="first">Light</button>
      <button type="button" id="disabled" disabled>Unavailable</button>
      <button type="button" id="last">Dark</button>
      ${content}
    </ocelle-anchored-popover>
    <button type="button" id="outside">Next</button>
  `;
  const host = required(fixture.querySelector("ocelle-anchored-popover"), "popover");
  host.label = label;
  required(fixture.querySelector('[slot="trigger"]'), "trigger decoration").textContent = decoration;
  document.body.append(fixture);
  await host.updateComplete;
  const root = host.shadowRoot;
  if (root === null) throw new Error("missing popover shadow root");
  return {
    host,
    trigger: required(root.querySelector<HTMLButtonElement>("button[part=trigger]"), "trigger"),
    panel: required(root.querySelector<HTMLElement>("[part=surface]"), "surface"),
    first: required(fixture.querySelector<HTMLButtonElement>("#first"), "first action"),
    last: required(fixture.querySelector<HTMLButtonElement>("#last"), "last action"),
    outside: required(fixture.querySelector<HTMLButtonElement>("#outside"), "next external button"),
    before: required(fixture.querySelector<HTMLButtonElement>("#before"), "previous external button"),
  };
}

function active(): Element | null {
  let item = document.activeElement;
  while (item?.shadowRoot?.activeElement != null) item = item.shadowRoot.activeElement;
  return item;
}

async function settle(frame = window.requestAnimationFrame.bind(window)): Promise<void> {
  await new Promise<void>((done) => frame(() => frame(() => { done(); })));
}

async function open(fixture: Fixture): Promise<void> {
  fixture.trigger.focus();
  await commands.press("Enter");
  await settle();
}

function point(element: Element): { x: number; y: number } {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** Put the surface at a stable viewport position independent of the Phase 2 placement algorithm. */
function positionPanel(panel: HTMLElement): void {
  Object.assign(panel.style, { position: "fixed", inset: "auto", left: "70px", top: "150px", width: "300px", margin: "0" });
}

const triggerSelector = "button[part=trigger]";

afterEach(() => {
  document.getElementById("foreground")?.remove();
  document.getElementById("popover-fixture")?.remove();
});

describe("anchored popover interaction", () => {
  // Report the exact missing dependency during collection on the pre-scaffold base.
  if (!Object.hasOwn(modules, "../src/ocelle-anchored-popover.ts")) {
    throw new Error("Cannot find module '../src/ocelle-anchored-popover.ts'");
  }

  it.each([
    { name: "Appearance", decoration: "✦" },
    { name: "Profile for Mira", decoration: "MK" },
  ])("exposes a named native disclosure button for $name", async ({ name, decoration }) => {
    const { trigger, panel } = await mount(name, decoration);
    const nodes = await commands.axTree("popover", "subtree");
    const button = nodes.find((node) => node.role === "button");
    expect({
      role: button?.role,
      name: button?.name,
      type: trigger.type,
      collapsed: trigger.getAttribute("aria-expanded"),
      controlsSurface: trigger.getAttribute("aria-controls") === panel.id && panel.id !== "",
    }).toEqual({ role: "button", name, type: "button", collapsed: "false", controlsSurface: true });
  });

  it.each(["", " \t "])("disables the trigger when its label is blank (%j)", async (label) => {
    const { trigger, panel } = await mount(label);
    await commands.pointer("click", "popover", { inner: triggerSelector, button: "left" });
    expect({ disabled: trigger.disabled, open: panel.matches(":popover-open") }).toEqual({ disabled: true, open: false });
  });

  it.each(["Enter", "Space"])("toggles through native %s activation and retains focus", async (key) => {
    const { trigger, panel } = await mount();
    const events: string[] = [];
    panel.addEventListener("toggle", (event) => events.push(event.newState));
    trigger.focus();
    await commands.press(key);
    await settle();
    expect({
      open: panel.matches(":popover-open"), expanded: trigger.getAttribute("aria-expanded"), focus: active() === trigger, events,
    }).toEqual({ open: true, expanded: "true", focus: true, events: ["open"] });
    await commands.press(key);
    await settle();
    expect({
      open: panel.matches(":popover-open"), expanded: trigger.getAttribute("aria-expanded"), focus: active() === trigger, events,
    }).toEqual({ open: false, expanded: "false", focus: true, events: ["open", "closed"] });
  });

  it("matches standalone native button pointer focus and reopens after Escape from the trigger", async () => {
    const { trigger, panel, before } = await mount();
    await commands.pointer("click", "before", { button: "left" });
    const focusesNativeButton = active() === before;
    const trusted: boolean[] = [];
    trigger.addEventListener("click", (event) => trusted.push(event.isTrusted));
    await commands.pointer("click", "popover", { inner: triggerSelector, button: "left" });
    await settle();
    expect({ open: panel.matches(":popover-open"), focused: active() === trigger, trusted })
      .toEqual({ open: true, focused: focusesNativeButton, trusted: [true] });
    trigger.focus();
    await commands.press("Escape");
    await settle();
    expect({ open: panel.matches(":popover-open"), focused: active() === trigger, expanded: trigger.getAttribute("aria-expanded") })
      .toEqual({ open: false, focused: true, expanded: "false" });
    await commands.press("Enter");
    await settle();
    expect({ open: panel.matches(":popover-open"), expanded: trigger.getAttribute("aria-expanded") })
      .toEqual({ open: true, expanded: "true" });
  });

  it("follows native forward and reverse Tab order through the projected actions", async () => {
    const fixture = await mount();
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    const order = [];
    await commands.press("Tab");
    order.push(active() === fixture.first);
    await commands.press("Tab");
    order.push(active() === fixture.last);
    await commands.press("Tab", ["Shift"]);
    order.push(active() === fixture.first);
    await commands.press("Tab", ["Shift"]);
    order.push(active() === fixture.trigger);
    expect({ order, open: fixture.panel.matches(":popover-open") }).toEqual({ order: [true, true, true, true], open: true });
    await commands.press("Tab", ["Shift"]);
    await settle();
    expect({ focus: active() === fixture.before, open: fixture.panel.matches(":popover-open") }).toEqual({ focus: true, open: false });
  });

  it("uncovers the next external focus stop without moving that focus", async () => {
    const fixture = await mount();
    positionPanel(fixture.panel);
    Object.assign(fixture.outside.style, { position: "fixed", left: "75px", top: "154px" });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    const { x, y } = point(fixture.outside);
    expect(document.elementFromPoint(x, y)).not.toBe(fixture.outside);
    const focusArrivals: { open: boolean; expanded: string | null; trusted: boolean }[] = [];
    fixture.outside.addEventListener("focusin", (event) => {
      focusArrivals.push({
        open: fixture.panel.matches(":popover-open"),
        expanded: fixture.trigger.getAttribute("aria-expanded"),
        trusted: event.isTrusted,
      });
    }, { once: true });
    fixture.last.focus();
    await commands.press("Tab");
    await settle();
    expect(focusArrivals).toEqual([{ open: false, expanded: "false", trusted: true }]);
    expect({
      open: fixture.panel.matches(":popover-open"),
      focus: active() === fixture.outside,
      hit: document.elementFromPoint(x, y) === fixture.outside,
      focusVisible: fixture.outside.matches(":focus-visible"),
    }).toEqual({ open: false, focus: true, hit: true, focusVisible: true });
  });

  it("keeps the surface open when a host action moves focus outside without Tab", async () => {
    const fixture = await mount();
    fixture.first.addEventListener("click", () => { fixture.outside.focus(); }, { once: true });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    await commands.press("Tab");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.first })
      .toEqual({ open: true, focus: true });
    await commands.press("Enter");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.outside })
      .toEqual({ open: true, focus: true });
  });

  it("respects a Tab canceled by the host after it moves focus", async () => {
    const fixture = await mount();
    fixture.host.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      fixture.outside.focus();
      event.preventDefault();
    });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.press("Tab");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.outside })
      .toEqual({ open: true, focus: true });
  });

  it("dismisses after Tab even when a host intercepts focusin, and stops scheduling frames", async () => {
    const fixture = await mount();
    const observeFrame = window.requestAnimationFrame.bind(window);
    const requests = vi.spyOn(window, "requestAnimationFrame");
    const listener = new AbortController();
    const intercepted: boolean[] = [];
    let requestsAtClose: number | undefined;
    window.addEventListener("focusin", (event) => {
      if (event.target !== fixture.outside) return;
      intercepted.push(event.isTrusted);
      event.stopPropagation();
    }, { capture: true, signal: listener.signal });
    fixture.panel.addEventListener("beforetoggle", (event) => {
      if (event.newState === "closed") requestsAtClose = requests.mock.calls.length;
    });
    try {
      await open(fixture);
      expect(fixture.panel.matches(":popover-open")).toBe(true);
      const requestsWhileOpen = requests.mock.calls.length;
      await settle(observeFrame);
      expect(requests.mock.calls.length).toBeGreaterThan(requestsWhileOpen);
      fixture.last.focus();
      await commands.press("Tab");
      await settle(observeFrame);
      expect({ intercepted, focus: active() === fixture.outside, open: fixture.panel.matches(":popover-open") })
        .toEqual({ intercepted: [true], focus: true, open: false });
      expect(requestsAtClose).toBe(requests.mock.calls.length);
    } finally {
      listener.abort();
      requests.mockRestore();
    }
  });

  it("preserves Tab focus when it enters a separate foreground dialog", async () => {
    const fixture = await mount();
    const foreground = document.createElement("dialog");
    foreground.id = "foreground";
    foreground.setAttribute("closedby", "closerequest");
    foreground.innerHTML = '<button type="button">Continue</button>';
    fixture.outside.before(foreground);
    foreground.show();
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.last.focus();
    await commands.press("Tab");
    await settle();
    expect({ focus: active() === foreground.firstElementChild, popover: fixture.panel.matches(":popover-open") })
      .toEqual({ focus: true, popover: true });
    await commands.press("Escape");
    await settle();
    expect({ foreground: foreground.open, popover: fixture.panel.matches(":popover-open") })
      .toEqual({ foreground: false, popover: true });
  });

  it.each([false, true])("leaves a foreground modal to handle its own Escape (portaled %s)", async (portaled) => {
    const fixture = await mount();
    const modal = document.createElement("dialog");
    modal.id = "foreground";
    modal.innerHTML = '<button type="button" id="modal-action" autofocus>Continue</button>';
    (portaled ? document.body : fixture.host).append(modal);
    fixture.first.addEventListener("click", () => { modal.showModal(); });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.press("Enter");
    expect({ modal: modal.matches(":modal"), scope: active()?.id, popover: fixture.panel.matches(":popover-open") })
      .toEqual({ modal: true, scope: "modal-action", popover: true });
    await commands.press("Escape");
    await settle();
    expect({ modal: modal.open, popover: fixture.panel.matches(":popover-open"), focus: active() === fixture.first })
      .toEqual({ modal: false, popover: true, focus: true });
    await commands.press("Escape");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.trigger }).toEqual({ open: false, focus: true });
  });

  it.each([
    { closedBy: "closerequest", leavesPopoverOpen: true },
    { closedBy: "any", leavesPopoverOpen: true },
    { closedBy: "none", leavesPopoverOpen: false },
  ])("honors a nested nonmodal dialog's Escape behavior when closedby=$closedBy", async ({ closedBy, leavesPopoverOpen }) => {
    const fixture = await mount();
    const foreground = document.createElement("dialog");
    foreground.id = "foreground";
    foreground.setAttribute("closedby", closedBy);
    foreground.innerHTML = '<button type="button" autofocus>Continue</button>';
    fixture.host.append(foreground);
    fixture.first.addEventListener("click", () => { foreground.show(); }, { once: true });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.press("Enter");
    expect({ open: foreground.open, modal: foreground.matches(":modal"), focus: active() === foreground.firstElementChild })
      .toEqual({ open: true, modal: false, focus: true });
    await commands.press("Escape");
    await settle();
    expect({
      dialog: foreground.open,
      popover: fixture.panel.matches(":popover-open"),
      focus: active() === (leavesPopoverOpen ? fixture.first : fixture.trigger),
    }).toEqual({ dialog: !leavesPopoverOpen, popover: leavesPopoverOpen, focus: true });
  });

  it("lets a nested native auto popover handle its own Escape and focus return", async () => {
    const fixture = await mount();
    const foreground = document.createElement("div");
    foreground.id = "foreground";
    foreground.popover = "auto";
    foreground.innerHTML = '<button type="button" autofocus>Continue</button>';
    fixture.host.append(foreground);
    fixture.first.addEventListener("click", () => { foreground.showPopover(); }, { once: true });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.press("Enter");
    expect({ foreground: foreground.matches(":popover-open"), focus: active() === foreground.firstElementChild })
      .toEqual({ foreground: true, focus: true });
    await commands.press("Escape");
    await settle();
    expect({ foreground: foreground.matches(":popover-open"), popover: fixture.panel.matches(":popover-open"), focus: active() === fixture.first })
      .toEqual({ foreground: false, popover: true, focus: true });
  });

  it("owns Escape from a nested native manual popover and restores trigger focus", async () => {
    const fixture = await mount();
    const foreground = document.createElement("div");
    foreground.id = "foreground";
    foreground.popover = "manual";
    foreground.innerHTML = '<button type="button" autofocus>Continue</button>';
    fixture.host.append(foreground);
    fixture.first.addEventListener("click", () => { foreground.showPopover(); }, { once: true });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.press("Enter");
    expect({ foreground: foreground.matches(":popover-open"), focus: active() === foreground.firstElementChild })
      .toEqual({ foreground: true, focus: true });
    await commands.press("Escape");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), expanded: fixture.trigger.getAttribute("aria-expanded"), focus: active() === fixture.trigger })
      .toEqual({ open: false, expanded: "false", focus: true });
  });

  it("consumes Escape from a populated text field before it reaches the containing modal", async () => {
    const fixture = await mount("Appearance", "✦", '<div id="editor-host"></div>');
    const editorHost = required(fixture.host.querySelector("#editor-host"), "editor host");
    const editorRoot = editorHost.attachShadow({ mode: "open" });
    editorRoot.innerHTML = '<input type="text" value="Light">';
    const editor = required(editorRoot.querySelector("input"), "text field");
    const modal = document.createElement("dialog");
    modal.id = "foreground";
    const stage = required(document.getElementById("popover-fixture"), "popover fixture");
    stage.before(modal);
    modal.append(stage);
    modal.showModal();
    const keydowns: KeyboardEvent[] = [];
    const bubbled: boolean[] = [];
    const cancellations: boolean[] = [];
    editor.addEventListener("keydown", (event) => {
      if (event.key === "Escape") keydowns.push(event);
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") bubbled.push(event.isTrusted);
    });
    modal.addEventListener("cancel", (event) => { cancellations.push(event.isTrusted); });
    await open(fixture);
    expect({ modal: modal.matches(":modal"), popover: fixture.panel.matches(":popover-open") })
      .toEqual({ modal: true, popover: true });
    editor.focus();
    await commands.press("Escape");
    await settle();
    expect({
      keydowns: keydowns.map(({ isTrusted, defaultPrevented }) => ({ isTrusted, defaultPrevented })),
      value: editor.value,
      bubbled,
      cancellations,
      modal: modal.open,
      popover: fixture.panel.matches(":popover-open"),
      focus: active() === fixture.trigger,
    }).toEqual({
      keydowns: [{ isTrusted: true, defaultPrevented: true }], value: "Light", bubbled: [], cancellations: [],
      modal: true, popover: false, focus: true,
    });
    await open(fixture);
    editor.focus();
    await commands.press("Tab");
    await settle();
    expect({ modal: modal.open, popover: fixture.panel.matches(":popover-open"), focus: active() === fixture.outside })
      .toEqual({ modal: true, popover: false, focus: true });
    await commands.press("Escape");
    await settle();
    expect({ modal: modal.open, bubbled, cancellations })
      .toEqual({ modal: false, bubbled: [true], cancellations: [true] });
  });

  it("preserves an already handled Escape in a projected action", async () => {
    const fixture = await mount();
    fixture.first.addEventListener("keydown", (event) => { event.preventDefault(); }, { once: true });
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.press("Escape");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.first }).toEqual({ open: true, focus: true });
    await commands.press("Escape");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.trigger }).toEqual({ open: false, focus: true });
  });

  it("lets a native search clear on first Escape only when editable and populated", async () => {
    const fixture = await mount("Appearance", "✦", '<input id="editable" type="search" value="Light"><input id="readonly" type="search" value="Dark" readonly>');
    const editable = required(fixture.host.querySelector<HTMLInputElement>("#editable"), "editable search");
    const readonly = required(fixture.host.querySelector<HTMLInputElement>("#readonly"), "readonly search");
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    editable.focus();
    await commands.press("Escape");
    await settle();
    expect({ value: editable.value, open: fixture.panel.matches(":popover-open"), focus: active() === editable })
      .toEqual({ value: "", open: true, focus: true });
    await commands.press("Escape");
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.trigger }).toEqual({ open: false, focus: true });
    await open(fixture);
    readonly.focus();
    await commands.press("Escape");
    await settle();
    expect({ value: readonly.value, open: fixture.panel.matches(":popover-open"), focus: active() === fixture.trigger })
      .toEqual({ value: "Dark", open: false, focus: true });
  });

  it("lets the host close from a projected action or preserve focus already moved elsewhere", async () => {
    document.createElement("ocelle-anchored-popover").close();
    const fixture = await mount();
    fixture.host.close();
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.addEventListener("click", () => { fixture.host.close(); }, { once: true });
    fixture.first.focus();
    const before = { x: window.scrollX, y: window.scrollY };
    await commands.press("Enter");
    await settle();
    expect({
      open: fixture.panel.matches(":popover-open"), focus: active() === fixture.trigger, scroll: { x: window.scrollX, y: window.scrollY },
    }).toEqual({ open: false, focus: true, scroll: before });
    await open(fixture);
    fixture.first.focus();
    fixture.outside.focus();
    fixture.host.close();
    fixture.host.close();
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.outside }).toEqual({ open: false, focus: true });
  });

  it("dismisses on trusted primary outside activation and preserves that target's click and focus", async () => {
    const fixture = await mount();
    positionPanel(fixture.panel);
    const clicks: boolean[] = [];
    fixture.outside.addEventListener("click", (event) => clicks.push(event.isTrusted));
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    fixture.first.focus();
    await commands.pointer("click", "outside", { button: "left" });
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.outside, clicks })
      .toEqual({ open: false, focus: true, clicks: [true] });
  });

  it("keeps captured outside-to-inside release open when the physical hit lies inside", async () => {
    const fixture = await mount();
    positionPanel(fixture.panel);
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    const outside = point(fixture.outside);
    const inside = point(fixture.first);
    expect(document.elementFromPoint(outside.x, outside.y)).toBe(fixture.outside);
    expect(fixture.first.contains(fixture.host.shadowRoot?.elementFromPoint(inside.x, inside.y) ?? null)).toBe(true);
    const releases: { trusted: boolean; target: boolean; captured: boolean; inside: boolean }[] = [];
    fixture.outside.addEventListener("pointerdown", (event) => {
      fixture.outside.setPointerCapture(event.pointerId);
    }, { once: true });
    fixture.outside.addEventListener("pointerup", (event) => {
      const hit = fixture.host.shadowRoot?.elementFromPoint(event.clientX, event.clientY);
      releases.push({
        trusted: event.isTrusted,
        target: event.target === fixture.outside,
        captured: fixture.outside.hasPointerCapture(event.pointerId),
        inside: fixture.first.contains(hit ?? null),
      });
    }, { once: true });
    await commands.pointerPath([{ ...outside, down: true }, inside, { ...inside, up: true }]);
    await settle();
    expect(releases).toEqual([{ trusted: true, target: true, captured: true, inside: true }]);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    await commands.pointer("click", "outside", { button: "left" });
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), focus: active() === fixture.outside }).toEqual({ open: false, focus: true });
  });

  it("keeps boundary-crossing and cancelled primary gestures open", async () => {
    const fixture = await mount();
    positionPanel(fixture.panel);
    await open(fixture);
    expect(fixture.panel.matches(":popover-open")).toBe(true);
    const outside = point(fixture.outside);
    const inside = point(fixture.first);
    const insideDown: boolean[] = [];
    fixture.first.addEventListener("pointerdown", (event) => insideDown.push(event.isTrusted), { once: true });
    await commands.pointerPath([{ ...inside, down: true }, outside, { ...outside, up: true }]);
    await settle();
    expect({ open: fixture.panel.matches(":popover-open"), insideDown }).toEqual({ open: true, insideDown: [true] });
    let pressed: PointerEvent | undefined;
    fixture.outside.addEventListener("pointerdown", (event) => { pressed = event; }, { once: true });
    await commands.pointerPath([{ ...outside, down: true }]);
    expect(pressed?.isTrusted).toBe(true);
    fixture.outside.dispatchEvent(new PointerEvent("pointercancel", {
      bubbles: true, composed: true, pointerId: pressed?.pointerId ?? -1, pointerType: "mouse", isPrimary: true,
    }));
    await commands.pointerPath([{ ...outside, up: true }]);
    await settle();
    expect(fixture.panel.matches(":popover-open")).toBe(true);
  });
});
