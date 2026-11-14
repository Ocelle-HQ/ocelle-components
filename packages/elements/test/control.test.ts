import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-button.ts";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";

// The control conventions of src/control.ts in button mode (012 research.md R-01, R-05, R-06; data-model.md § Shared:
// the control; plan decisions 4 and 23; tasks.md T017), in process on `ocelle-button`'s source: the open shadow root
// attached with `delegatesFocus`, so the host's `focus()` focuses the inner control; the host's `click()` clicks the
// inner control, so its click passes through the inner control (and a disabled one ignores it); the host guard, the
// `click` and `auxclick` listeners on the host registered when the element is constructed, which stop an event whose
// composed path misses the inner control in every state, before any host listener added after upgrade (a synthetic
// click dispatched on the host is such an event), and every event while the control is not available; and the name
// order of FR-006 in button mode: `label` (trimmed; whitespace-only is none), then content, slotted icons never.
//
// Each "does not" outcome shares its test with the positive outcome it guards; plants (reviews/phase-2/plants.md): no
// host listener (the synthetic and the auxclick cases); `click()` not forwarded; the guard ignoring `disabled`; the
// label not trimmed.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  document.body.innerHTML = "";
});

/** Mounts `markup` and returns the element with `id` and its inner control. */
async function mounted(markup: string, id: string): Promise<{ readonly host: HTMLElement; readonly inner: HTMLElement }> {
  await driver.mount(markup);
  const host = document.getElementById(id);
  const inner = host?.shadowRoot?.querySelector<HTMLElement>('[part="control"]');
  if (host === null || inner === null || inner === undefined) throw new Error(`no #${id} with an inner control`);
  return { host, inner };
}

/** The types of the events that reach `document` in the bubble phase while `act` runs, and whether each was prevented. */
function atDocument(types: readonly string[], act: () => void): { readonly type: string; readonly target: string; readonly prevented: boolean }[] {
  const seen: { type: string; target: string; prevented: boolean }[] = [];
  const listener = (event: Event): void => {
    seen.push({ type: event.type, target: (event.target as Element).localName, prevented: event.defaultPrevented });
  };
  for (const type of types) document.addEventListener(type, listener);
  try {
    act();
  } finally {
    for (const type of types) document.removeEventListener(type, listener);
  }
  return seen;
}

describe("src/control.ts: one inner control in an open shadow root with delegatesFocus", () => {
  it("renders one native <button type=\"button\"> with the part control, focused by the host's focus() while document.activeElement stays the host", async () => {
    const { host, inner } = await mounted('<ocelle-button id="b">Save</ocelle-button>', "b");
    host.focus();
    expect({
      mode: host.shadowRoot?.mode,
      delegates: host.shadowRoot?.delegatesFocus,
      controls: host.shadowRoot?.querySelectorAll('[part="control"]').length,
      tag: inner.localName,
      type: inner.getAttribute("type"),
      focused: host.shadowRoot?.activeElement === inner,
      active: document.activeElement === host,
      hostTabIndex: host.getAttribute("tabindex"),
      hostRole: host.getAttribute("role"),
    }).toEqual({ mode: "open", delegates: true, controls: 1, tag: "button", type: "button", focused: true, active: true, hostTabIndex: null, hostRole: null });
  });

  it("a disabled inner control takes no focus from the host's focus()", async () => {
    const { host } = await mounted('<ocelle-button id="b" disabled>Save</ocelle-button> <ocelle-button id="on">Save</ocelle-button>', "b");
    host.focus();
    const offFocused = host.shadowRoot?.activeElement ?? null;
    document.getElementById("on")?.focus();
    expect({ off: offFocused, on: document.activeElement?.id }).toEqual({ off: null, on: "on" });
  });
});

describe("src/control.ts: click() is forwarded to the inner control", () => {
  it("the host's click() clicks the inner control: its click passes through the inner control and reaches document with the host as target, once", async () => {
    const { host, inner } = await mounted('<ocelle-button id="b">Save</ocelle-button>', "b");
    let innerClicks = 0;
    inner.addEventListener("click", () => {
      innerClicks += 1;
    });
    const seen = atDocument(["click"], () => {
      host.click();
    });
    expect({ innerClicks, seen }).toEqual({ innerClicks: 1, seen: [{ type: "click", target: "ocelle-button", prevented: false }] });
  });

  it("a disabled button's click() delivers nothing, while its enabled twin's delivers one click", async () => {
    const { host } = await mounted('<ocelle-button id="b" disabled>Save</ocelle-button><ocelle-button id="on">Save</ocelle-button>', "b");
    const off = atDocument(["click", "ocelle-button-activate"], () => {
      host.click();
    });
    const on = atDocument(["click", "ocelle-button-activate"], () => {
      document.getElementById("on")?.click();
    });
    expect({ off, on: on.map((each) => each.type) }).toEqual({ off: [], on: ["ocelle-button-activate", "click"] });
  });
});

describe("src/control.ts: the host guard", () => {
  it.each([
    { state: "available", markup: '<ocelle-button id="b">Save</ocelle-button>' },
    { state: "disabled", markup: '<ocelle-button id="b" disabled>Save</ocelle-button>' },
  ])("$state: a click and an auxclick dispatched on the host (their composed path misses the inner control) are prevented and reach neither document nor a host listener added after upgrade, while the inner control's click reaches both when available", async ({ state, markup }) => {
    const { host, inner } = await mounted(markup, "b");
    const atHost: string[] = [];
    for (const type of ["click", "auxclick"]) {
      host.addEventListener(type, (event) => {
        atHost.push(event.type);
      });
    }
    const synthetic = ["click", "auxclick"].map((type) => new MouseEvent(type, { bubbles: true, composed: true, cancelable: true }));
    const outside = atDocument(["click", "auxclick"], () => {
      for (const event of synthetic) host.dispatchEvent(event);
    });
    const outsideAtHost = atHost.splice(0);
    const through = atDocument(["click"], () => {
      inner.click();
    });
    expect({ outside, outsideAtHost, prevented: synthetic.map((event) => event.defaultPrevented), through: through.map((each) => each.type), throughAtHost: atHost }).toEqual({
      outside: [],
      outsideAtHost: [],
      prevented: [true, true],
      through: state === "available" ? ["click"] : [],
      throughAtHost: state === "available" ? ["click"] : [],
    });
  });

  it("stops every click while the control is not available: a click dispatched on a disabled button's inner control reaches neither document nor the activate event, while one dispatched on its enabled twin's inner control gives one activate event and one click", async () => {
    const { inner: off } = await mounted('<ocelle-button id="b" disabled>Save</ocelle-button><ocelle-button id="on">Save</ocelle-button>', "b");
    const on = document.getElementById("on")?.shadowRoot?.querySelector('[part="control"]');
    const dispatch = (target: Element | null | undefined): void => {
      target?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
    };
    const disabled = atDocument(["click", "ocelle-button-activate"], () => {
      dispatch(off);
    });
    const enabled = atDocument(["click", "ocelle-button-activate"], () => {
      dispatch(on);
    });
    expect({ disabled, enabled: enabled.map((each) => each.type) }).toEqual({ disabled: [], enabled: ["ocelle-button-activate", "click"] });
  });

  it("is registered when the element is constructed: an element created by document.createElement and connected later guards its host before a listener the page adds", async () => {
    await driver.mount("<div id=\"spot\"></div>");
    const host = document.createElement("ocelle-button");
    host.textContent = "Save";
    let heard = 0;
    host.addEventListener("click", () => {
      heard += 1;
    });
    document.getElementById("spot")?.append(host);
    await host.updateComplete;
    const event = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    host.dispatchEvent(event);
    const afterSynthetic = heard;
    host.click();
    expect({ afterSynthetic, prevented: event.defaultPrevented, afterClick: heard }).toEqual({ afterSynthetic: 0, prevented: true, afterClick: 1 });
  });
});

describe("src/control.ts: the name of the inner control in button mode (FR-006, FR-013)", () => {
  it.each([
    { case: "label, trimmed", markup: '<ocelle-button id="b" label="  Close  ">Save</ocelle-button>', name: "Close", ariaLabel: "Close" },
    { case: "a whitespace-only label counts as none: the content", markup: '<ocelle-button id="b" label=" \t ">Save</ocelle-button>', name: "Save", ariaLabel: null },
    { case: "an empty label counts as none: the content", markup: '<ocelle-button id="b" label="">Save</ocelle-button>', name: "Save", ariaLabel: null },
    { case: "no label: the content, the slotted icon adding nothing", markup: '<ocelle-button id="b"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>', name: "Open project", ariaLabel: null },
  ])("$case", async ({ markup, name, ariaLabel }) => {
    const { inner } = await mounted(markup, "b");
    expect({ name: (await driver.axState("b", '[part="control"]')).name, ariaLabel: inner.getAttribute("aria-label") }).toEqual({ name, ariaLabel });
  });

  it("follows a label set and cleared as a property", async () => {
    const { host } = await mounted('<ocelle-button id="b">Save</ocelle-button>', "b");
    await driver.setProperty("b", "label", "Store");
    const set = (await driver.axState("b", '[part="control"]')).name;
    await driver.setProperty("b", "label", undefined);
    expect({ set, cleared: (await driver.axState("b", '[part="control"]')).name, reflected: host.hasAttribute("label") }).toEqual({ set: "Store", cleared: "Save", reflected: false });
  });
});
