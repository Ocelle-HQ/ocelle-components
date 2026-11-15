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

// 012 phase 3 (research.md R-02 to R-05; data-model.md § Shared: the control; plan decisions 9, 10, 19, 22 and 24;
// tasks.md T032): link mode, the attribute move and its mirrors, the custom states, the references and the name order,
// on `ocelle-button`'s source. Plants (reviews/phase-3/plants.md): no mirror; mirror not restored; `title` not moved.

/** The inner control of the element `id` once rendered. */
function innerOf(host: Element): HTMLElement {
  const found = host.shadowRoot?.querySelector<HTMLElement>('[part="control"]');
  if (found === null || found === undefined) throw new Error("no inner control");
  return found;
}

/** Sets `href` on a fresh button by `setAttribute` (so control characters reach the element as written) and reads the mode. */
async function modeOf(href: string): Promise<{ readonly tag: string; readonly href: string | null }> {
  await driver.mount('<ocelle-button id="b">Go</ocelle-button>');
  const host = document.getElementById("b");
  if (host === null) throw new Error("no button");
  host.setAttribute("href", href);
  await (host as HTMLElementTagNameMap["ocelle-button"]).updateComplete;
  const inner = innerOf(host);
  return { tag: inner.localName, href: inner.getAttribute("href") };
}

describe("src/control.ts: link versus button, by the URL parser (FR-002; research.md R-02's table)", () => {
  /** The decision table, one test: a row that passed alone would be no evidence of the link rows beside it. */
  const table = [
    { case: "empty", href: "", tag: "button", rendered: null },
    { case: "whitespace only", href: " \t\n ", tag: "button", rendered: null },
    { case: "relative", href: "projects/42", tag: "a", rendered: "projects/42" },
    { case: "javascript:", href: "javascript:alert(1)", tag: "button", rendered: null },
    { case: "JavaScript:", href: "JavaScript:alert(1)", tag: "button", rendered: null },
    { case: "JAVASCRIPT:x", href: "JAVASCRIPT:x", tag: "button", rendered: null },
    { case: "java<TAB>script:x", href: "java\tscript:x", tag: "button", rendered: null },
    { case: "a leading control character", href: "\u0001javascript:x", tag: "button", rendered: null },
    { case: "a leading space", href: " javascript:x", tag: "button", rendered: null },
    { case: "unparseable http://[", href: "http://[", tag: "button", rendered: null },
    { case: "data:, as written", href: "data:text/html,x", tag: "a", rendered: "data:text/html,x" },
    { case: "absolute, as written", href: "https://example.test/a?b#c", tag: "a", rendered: "https://example.test/a?b#c" },
  ];
  it("decides each row of the table: the inner control and its href, with no error logged", async () => {
    const found: Record<string, unknown> = {};
    for (const { case: name, href } of table) found[name] = { ...(await modeOf(href)), messages: await driver.messages() };
    expect(found).toEqual(Object.fromEntries(table.map(({ case: name, tag, rendered }) => [name, { tag, href: rendered, messages: [] }])));
  });

  it("switches the inner control when href changes: button, then a link, then a button again when href is removed", async () => {
    const { host } = await mounted('<ocelle-button id="b">Go</ocelle-button>', "b");
    const first = innerOf(host).localName;
    await driver.setAttribute("b", "href", "/a");
    const link = { tag: innerOf(host).localName, href: innerOf(host).getAttribute("href"), controls: host.shadowRoot?.querySelectorAll('[part="control"]').length };
    await driver.setAttribute("b", "href", null);
    expect({ first, link, back: innerOf(host).localName }).toEqual({ first: "button", link: { tag: "a", href: "/a", controls: 1 }, back: "button" });
  });
});

describe("src/control.ts: a disabled link and the noopener rule (FR-003, FR-021; research.md R-02)", () => {
  it("renders a disabled link without href, target, rel, download or tabindex, with role link and aria-disabled, not focusable by the host's focus(), while its enabled twin takes focus", async () => {
    const { host } = await mounted('<ocelle-button id="d" href="/a" target="_blank" rel="next" download="f" disabled>A</ocelle-button><ocelle-button id="e" href="/a">A</ocelle-button>', "d");
    const inner = innerOf(host);
    host.focus();
    const focused = host.shadowRoot?.activeElement ?? null;
    const twin = document.getElementById("e");
    twin?.focus();
    expect({
      tag: inner.localName,
      attributes: inner.getAttributeNames().filter((name) => !["part", "class"].includes(name)).sort(),
      role: inner.getAttribute("role"),
      disabled: inner.getAttribute("aria-disabled"),
      focused,
      twin: twin?.shadowRoot?.activeElement?.localName,
    }).toEqual({ tag: "a", attributes: ["aria-disabled", "role"], role: "link", disabled: "true", focused: null, twin: "a" });
  });

  it.each([
    { case: 'target="_blank" and no rel: rel="noopener"', markup: '<ocelle-button id="b" href="/a" target="_blank">A</ocelle-button>', rel: "noopener" },
    { case: 'target="_blank" and rel="nofollow": the host\'s rel', markup: '<ocelle-button id="b" href="/a" target="_blank" rel="nofollow">A</ocelle-button>', rel: "nofollow" },
    { case: 'target="_self" and no rel: no rel', markup: '<ocelle-button id="b" href="/a" target="_self">A</ocelle-button>', rel: null },
    { case: "no target and no rel: no rel", markup: '<ocelle-button id="b" href="/a">A</ocelle-button>', rel: null },
  ])("$case", async ({ markup, rel }) => {
    const { inner } = await mounted(markup, "b");
    expect({ tag: inner.localName, rel: inner.getAttribute("rel") }).toEqual({ tag: "a", rel });
  });
});

/** The host attributes of `host` other than `id`, sorted, as name=value. */
function hostAttributes(host: Element): string[] {
  return host
    .getAttributeNames()
    .filter((name) => name !== "id")
    .sort()
    .map((name) => `${name}=${String(host.getAttribute(name))}`);
}

describe("src/control.ts: the attribute move (FR-004, FR-009; research.md R-03)", () => {
  const moved = ["aria-expanded", "aria-controls", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "aria-labelledby", "aria-describedby", "title"] as const;

  it("moves every listed attribute present in markup parsed before the element is upgraded, into a mirror each, and onto the inner control", async () => {
    await driver.mount('<div id="spot"></div><div id="p">Panel</div><span id="l">Label</span><span id="d">Description</span>');
    const doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = '<ocelle-button id="b" aria-expanded="true" aria-controls="p" aria-current="step" aria-haspopup="menu" aria-pressed="true" aria-label="Close" aria-labelledby="l" aria-describedby="d" title="Tip">Save</ocelle-button>';
    const parsed = doc.body.firstElementChild;
    if (parsed === null) throw new Error("no parsed element");
    const before = hostAttributes(parsed).length;
    const host = document.adoptNode(parsed) as HTMLElementTagNameMap["ocelle-button"];
    document.getElementById("spot")?.append(host);
    await host.updateComplete;
    const inner = innerOf(host);
    expect({
      before,
      host: hostAttributes(host),
      inner: ["aria-expanded", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "title"].map((name) => inner.getAttribute(name)),
      controls: inner.ariaControlsElements?.map((each) => each.id),
      labelledBy: inner.ariaLabelledByElements?.map((each) => each.id),
      describedBy: inner.ariaDescribedByElements?.map((each) => each.id),
    }).toEqual({
      before: 9,
      host: ["data-ocelle-moved-aria-controls=p", "data-ocelle-moved-aria-current=step", "data-ocelle-moved-aria-describedby=d", "data-ocelle-moved-aria-expanded=true", "data-ocelle-moved-aria-haspopup=menu", "data-ocelle-moved-aria-label=Close", "data-ocelle-moved-aria-labelledby=l", "data-ocelle-moved-aria-pressed=true", "data-ocelle-moved-title=Tip"],
      inner: ["true", "step", "menu", "true", null, "Tip"],
      controls: ["p"],
      labelledBy: ["l"],
      describedBy: ["d"],
    });
  });

  it.each(moved)("moves %s set later, keeps a value as written (untrimmed), clears it with an empty or whitespace-only value, and ignores removeAttribute after the move", async (name) => {
    const { host } = await mounted('<ocelle-button id="b">Save</ocelle-button>', "b");
    const element = host as HTMLElementTagNameMap["ocelle-button"];
    const mirror = `data-ocelle-moved-${name}`;
    host.setAttribute(name, " v ");
    await element.updateComplete;
    const set = { host: host.getAttribute(name), mirror: host.getAttribute(mirror) };
    host.removeAttribute(name);
    await element.updateComplete;
    const removed = host.getAttribute(mirror);
    host.setAttribute(name, " \t ");
    await element.updateComplete;
    const blank = { host: host.getAttribute(name), mirror: host.getAttribute(mirror) };
    host.setAttribute(name, "w");
    host.setAttribute(name, "");
    await element.updateComplete;
    expect({ set, removed, blank, empty: { host: host.getAttribute(name), mirror: host.getAttribute(mirror) } }).toEqual({
      set: { host: null, mirror: " v " },
      removed: " v ",
      blank: { host: null, mirror: null },
      empty: { host: null, mirror: null },
    });
  });

  it('applies the off values: aria-expanded="false" and aria-pressed="false" stay on the inner control as "false", aria-current="false" leaves it; each mirror reads "false"', async () => {
    const { host, inner } = await mounted('<ocelle-button id="b" aria-expanded="false" aria-pressed="false" aria-current="false">Save</ocelle-button>', "b");
    expect({ inner: ["aria-expanded", "aria-pressed", "aria-current"].map((name) => inner.getAttribute(name)), host: hostAttributes(host) }).toEqual({
      inner: ["false", "false", null],
      host: ["data-ocelle-moved-aria-current=false", "data-ocelle-moved-aria-expanded=false", "data-ocelle-moved-aria-pressed=false"],
    });
  });

  it("leaves an aria-* attribute it does not list on the host", async () => {
    const { host, inner } = await mounted('<ocelle-button id="b" aria-busy="true" aria-expanded="true">Save</ocelle-button>', "b");
    expect({ host: hostAttributes(host), inner: inner.getAttribute("aria-busy") }).toEqual({ host: ["aria-busy=true", "data-ocelle-moved-aria-expanded=true"], inner: null });
  });

  it("sets the custom states from the moved values: expanded and pressed while \"true\", current while set to anything but \"false\"", async () => {
    const { host } = await mounted('<ocelle-button id="b" aria-expanded="true" aria-pressed="true" aria-current="date">Save</ocelle-button>', "b");
    const element = host as HTMLElementTagNameMap["ocelle-button"];
    const read = (): string[] => ["expanded", "pressed", "current"].filter((state) => host.matches(`:state(${state})`));
    const on = read();
    host.setAttribute("aria-expanded", "mixed");
    host.setAttribute("aria-pressed", "mixed");
    host.setAttribute("aria-current", "false");
    await element.updateComplete;
    const off = read();
    host.setAttribute("aria-current", "true");
    await element.updateComplete;
    expect({ on, off, again: read() }).toEqual({ on: ["expanded", "pressed", "current"], off: [], again: ["current"] });
  });
});

describe("src/control.ts: the mirrors (research.md R-03; plan decisions 19 and 24)", () => {
  /** The names of the host attributes that changed while `act` ran, one per mutation, sorted. */
  async function mutations(host: HTMLElementTagNameMap["ocelle-button"], act: () => void): Promise<string[]> {
    const seen: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) seen.push(String(record.attributeName));
    });
    observer.observe(host, { attributes: true });
    act();
    await host.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    observer.disconnect();
    return seen.sort();
  }

  it("writes the mirror once per set (its own write ignored, no loop), restores a mirror removed or overwritten while it holds the value, and leaves a mirror written while it holds none", async () => {
    const { host } = await mounted('<ocelle-button id="b">Save</ocelle-button>', "b");
    const element = host as HTMLElementTagNameMap["ocelle-button"];
    const mirror = "data-ocelle-moved-aria-label";
    const set = await mutations(element, () => {
      host.setAttribute("aria-label", "Close");
    });
    const afterSet = host.getAttribute(mirror);
    const removed = await mutations(element, () => {
      host.removeAttribute(mirror);
    });
    const afterRemoval = host.getAttribute(mirror);
    const overwritten = await mutations(element, () => {
      host.setAttribute(mirror, "Open");
    });
    const afterOverwrite = host.getAttribute(mirror);
    const unheld = await mutations(element, () => {
      host.setAttribute("data-ocelle-moved-aria-current", "page");
    });
    expect({
      set,
      afterSet,
      removed,
      afterRemoval,
      overwritten,
      afterOverwrite,
      unheld,
      unheldValue: host.getAttribute("data-ocelle-moved-aria-current"),
      name: (await driver.axState("b", '[part="control"]')).name,
      current: innerOf(host).getAttribute("aria-current"),
    }).toEqual({
      set: ["aria-label", "aria-label", mirror],
      afterSet: "Close",
      removed: [mirror, mirror],
      afterRemoval: "Close",
      overwritten: [mirror, mirror],
      afterOverwrite: "Close",
      unheld: ["data-ocelle-moved-aria-current"],
      unheldValue: "page",
      name: "Close",
      current: null,
    });
  });

  it("reads a mirror back at upgrade for an attribute the host does not set, and a host attribute set at upgrade wins over its mirror", async () => {
    await driver.mount('<div id="spot"></div>');
    const doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = '<ocelle-button id="a" data-ocelle-moved-aria-label="Close" data-ocelle-moved-aria-current="page">Save</ocelle-button><ocelle-button id="w" data-ocelle-moved-aria-label="Old" aria-label="New">Save</ocelle-button>';
    const spot = document.getElementById("spot");
    for (const each of [...doc.body.children]) spot?.append(document.adoptNode(each));
    const [a, w] = ["a", "w"].map((id) => document.getElementById(id) as HTMLElementTagNameMap["ocelle-button"]);
    if (a === undefined || w === undefined) throw new Error("no buttons");
    await a.updateComplete;
    await w.updateComplete;
    expect({
      a: { label: innerOf(a).getAttribute("aria-label"), current: innerOf(a).getAttribute("aria-current"), state: a.matches(":state(current)"), host: hostAttributes(a) },
      w: { label: innerOf(w).getAttribute("aria-label"), host: hostAttributes(w) },
    }).toEqual({
      a: { label: "Close", current: "page", state: true, host: ["data-ocelle-moved-aria-current=page", "data-ocelle-moved-aria-label=Close"] },
      w: { label: "New", host: ["data-ocelle-moved-aria-label=New"] },
    });
  });
});

describe("src/control.ts: ID references by element reflection, in the host's own tree (FR-005; research.md R-04)", () => {
  it("resolves ids in the document, in order, missing ones skipped, for aria-controls, aria-labelledby and aria-describedby", async () => {
    const { inner } = await mounted('<p id="one">One</p><p id="two">Two</p><ocelle-button id="b" aria-controls="two nope one" aria-labelledby="one two" aria-describedby="nope two">Save</ocelle-button>', "b");
    expect({ controls: inner.ariaControlsElements?.map((each) => each.id), labelledBy: inner.ariaLabelledByElements?.map((each) => each.id), describedBy: inner.ariaDescribedByElements?.map((each) => each.id) }).toEqual({
      controls: ["two", "one"],
      labelledBy: ["one", "two"],
      describedBy: ["two"],
    });
  });

  it("resolves ids in the shadow root the host is in, and leaves an element in another shadow root unresolved, with no error", async () => {
    await driver.mount('<div id="outer"></div><div id="other"></div><p id="doc-panel">Document</p>');
    const other = document.getElementById("other")?.attachShadow({ mode: "open" });
    if (other === undefined) throw new Error("no shadow root");
    other.innerHTML = '<p id="elsewhere">Elsewhere</p>';
    const root = document.getElementById("outer")?.attachShadow({ mode: "open" });
    if (root === undefined) throw new Error("no shadow root");
    root.innerHTML = '<p id="panel">Panel</p><ocelle-button id="in" aria-controls="panel">In</ocelle-button><ocelle-button id="out" aria-controls="elsewhere doc-panel">Out</ocelle-button>';
    const [inside, outside] = ["in", "out"].map((id) => root.getElementById(id) as HTMLElementTagNameMap["ocelle-button"] | null);
    if (inside === null || inside === undefined || outside === null || outside === undefined) throw new Error("no buttons");
    await inside.updateComplete;
    await outside.updateComplete;
    expect({ inside: innerOf(inside).ariaControlsElements?.map((each) => each.id), outside: innerOf(outside).ariaControlsElements?.map((each) => each.id) ?? [], messages: await driver.messages() }).toEqual({
      inside: ["panel"],
      outside: [],
      messages: [],
    });
  });

  it("resolves the ids again when the element is connected: set while disconnected, related once connected", async () => {
    await driver.mount('<p id="panel">Panel</p><div id="spot"></div>');
    const host = document.createElement("ocelle-button");
    host.textContent = "Save";
    host.setAttribute("aria-controls", "panel");
    document.getElementById("spot")?.append(host);
    await host.updateComplete;
    expect(innerOf(host).ariaControlsElements?.map((each) => each.id)).toEqual(["panel"]);
  });

  // Added in the green step (phase 3 plants, reviews/phase-3/plants.md): the first connection resolves through the
  // mirrors' read-back as well, so only a later connection shows the resolution at connectedCallback.
  it("resolves the ids again at every connection: moved from the document into a shadow root, the reference follows the tree it is in", async () => {
    const { host } = await mounted('<p id="panel">Document</p><ocelle-button id="b" aria-controls="panel">Save</ocelle-button><div id="outer"></div>', "b");
    const before = innerOf(host).ariaControlsElements?.map((each) => each.textContent);
    const root = document.getElementById("outer")?.attachShadow({ mode: "open" });
    if (root === undefined) throw new Error("no shadow root");
    root.innerHTML = '<p id="panel">Shadow</p>';
    root.append(host);
    await (host as HTMLElementTagNameMap["ocelle-button"]).updateComplete;
    expect({ before, after: innerOf(host).ariaControlsElements?.map((each) => each.textContent) }).toEqual({ before: ["Document"], after: ["Shadow"] });
  });
});

describe("src/control.ts: the name order (FR-006; research.md R-05)", () => {
  /** The name sources, one test: the label and content rows alone would pass before the passthrough exists. */
  const order = [
    { case: "aria-labelledby over aria-label, label and content", markup: '<span id="n">Archive</span><ocelle-button id="b" aria-labelledby="n" aria-label="Remove" label="Delete">Save</ocelle-button>', name: "Archive" },
    { case: "aria-label over label and content", markup: '<ocelle-button id="b" aria-label="Remove" label="Delete">Save</ocelle-button>', name: "Remove" },
    { case: "label over content", markup: '<ocelle-button id="b" label="Delete">Save</ocelle-button>', name: "Delete" },
    { case: "content", markup: '<ocelle-button id="b">Save</ocelle-button>', name: "Save" },
    { case: "aria-labelledby with no element found: aria-label", markup: '<ocelle-button id="b" aria-labelledby="nope" aria-label="Remove" label="Delete">Save</ocelle-button>', name: "Remove" },
    { case: "a title only names an icon-only button", markup: '<ocelle-button id="b" title="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon></ocelle-button>', name: "Close" },
  ];
  it("names the inner control from the first source present, in that order, each row on its own page", async () => {
    const found: Record<string, string> = {};
    for (const { case: name, markup } of order) {
      await mounted(markup, "b");
      found[name] = (await driver.axState("b", '[part="control"]')).name;
    }
    expect(found).toEqual(Object.fromEntries(order.map(({ case: name, name: expected }) => [name, expected])));
  });
});
