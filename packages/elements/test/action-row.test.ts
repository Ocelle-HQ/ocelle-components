import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-action-row.ts";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { actionRowScenarios } from "./scenarios/action-row.ts";
import { rowStateScenarios, rowStateSinkScenarios } from "./scenarios/row-states.ts";

// User Story 4's browser scenarios for `ocelle-action-row`, in process on the element source (012 research.md R-11;
// tasks.md T051): the shared bodies of scenarios/action-row.ts on the in-process driver, light and dark, forced colours
// and right to left as each body sets them, with axe on each body's page; the same bodies run on the built browser
// build on the strict-CSP fixture in test/browser/action-row.test.ts. `ocelle-icon` is imported for the bodies that
// slot one. Forced colours are reset after each test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-action-row, in process (US4)", { timeout: 60_000 }, () => {
  it.each(actionRowScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

// User Story 5 (tasks.md T062): the shared bodies of scenarios/row-states.ts (the row's states and the card layout),
// and its in-process link-row bodies on the navigation sink's records.
describe("ocelle-action-row's states and card layout, in process (US5)", { timeout: 60_000 }, () => {
  it.each([...rowStateScenarios, ...rowStateSinkScenarios])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

/** The row with the properties of data-model.md § `ocelle-action-row` that phase 5 gives it, typed here so the test reads them whatever the element declares. */
type Row = HTMLElementTagNameMap["ocelle-action-row"] & {
  rowId?: string | undefined;
  label?: string | undefined;
  layout?: string | undefined;
  presentation?: string | undefined;
  ground?: string | undefined;
  href?: string | undefined;
  target?: string | undefined;
  rel?: string | undefined;
  busy?: boolean;
  current?: string | undefined;
  unavailable?: boolean;
};

function created(): Row {
  const host = document.createElement("ocelle-action-row") as Row;
  host.textContent = "Mission 42";
  document.body.append(host);
  return host;
}

/** The inner control of a row: its local name and the attributes the link tests read, absent ones left out. */
function inner(host: Row): Record<string, string> {
  const found = host.shadowRoot?.querySelector('[part="control"]');
  if (found === null || found === undefined) return { tag: "none" };
  return Object.fromEntries([["tag", found.localName], ...["type", "href", "target", "rel", "aria-busy"].flatMap((name) => (found.hasAttribute(name) ? [[name, found.getAttribute(name) ?? ""] as const] : []))]);
}

// The reflected properties (data-model.md § `ocelle-action-row`; FR-030; tasks.md T056): `rowId` (`row-id`),
// `layout`, `presentation`, `ground`, `href`, `target`, `rel` and `busy` reflect a property set from script to the
// attribute and read the attribute back; `label` is not reflected. In process only: the scenarios set attributes.
describe("ocelle-action-row's reflected properties", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects rowId as row-id, layout, presentation, ground, href, target, rel and busy set as properties, and not label; removes busy when set false and the strings when set to undefined", async () => {
    const host = created();
    await host.updateComplete;
    const initial = { busy: host.busy, attribute: host.hasAttribute("busy") };
    Object.assign(host, { rowId: "m-42", layout: "card", presentation: "flush", ground: "chrome", href: "/missions/42", target: "_self", rel: "next", busy: true, label: "Open mission 42" });
    await host.updateComplete;
    const names = ["row-id", "layout", "presentation", "ground", "href", "target", "rel", "busy", "label"];
    const set = Object.fromEntries(names.map((name) => [name, host.getAttribute(name)]));
    Object.assign(host, { rowId: undefined, layout: undefined, presentation: undefined, ground: undefined, href: undefined, target: undefined, rel: undefined, busy: false });
    await host.updateComplete;
    expect({ initial, set, cleared: names.map((name) => host.hasAttribute(name)) }).toEqual({
      initial: { busy: false, attribute: false },
      set: { "row-id": "m-42", layout: "card", presentation: "flush", ground: "chrome", href: "/missions/42", target: "_self", rel: "next", busy: "", label: null },
      cleared: [false, false, false, false, false, false, false, false, false],
    });
  });

  it("reads row-id, layout, presentation, ground, href, target and rel as strings, busy as a boolean and label from its attribute", async () => {
    document.body.innerHTML = '<ocelle-action-row row-id="m-1" layout="card" presentation="flush" ground="state" href="/a" target="_blank" rel="nofollow" busy label="Open">A</ocelle-action-row><ocelle-action-row>B</ocelle-action-row>';
    const [on, off] = [...document.querySelectorAll("ocelle-action-row")] as Row[];
    await on?.updateComplete;
    await off?.updateComplete;
    expect({
      on: { rowId: on?.rowId, layout: on?.layout, presentation: on?.presentation, ground: on?.ground, href: on?.href, target: on?.target, rel: on?.rel, busy: on?.busy, label: on?.label },
      off: { rowId: off?.rowId, busy: off?.busy, label: off?.label },
    }).toEqual({
      on: { rowId: "m-1", layout: "card", presentation: "flush", ground: "state", href: "/a", target: "_blank", rel: "nofollow", busy: true, label: "Open" },
      off: { rowId: undefined, busy: false, label: undefined },
    });
  });
});

// Link mode (FR-002, FR-021, FR-030; data-model.md § Shared: the control; tasks.md T056): a row with an `href` that
// parses as a URL and is not a `javascript:` URL renders an inner `<a>` with the `href` as written, its `target` and
// `rel`, and `rel="noopener"` for `target="_blank"` without `rel`; otherwise an inner `<button type="button">` with
// none of them. In process only: the fixture's link bodies are phase 6's (US5-1, US5-2).
// User Story 5's reflected properties (data-model.md § `ocelle-action-row`; FR-030, FR-037, FR-039; tasks.md T062):
// `current` reflects as written and `unavailable` as a boolean, false by default; the inner control follows each.
describe("ocelle-action-row's reflected current and unavailable properties", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects current as written and unavailable as a boolean (false by default), each followed by the inner control, and removes them when set to undefined and false", async () => {
    const host = created();
    await host.updateComplete;
    const initial = { unavailable: host.unavailable, attribute: host.hasAttribute("unavailable") };
    Object.assign(host, { current: "page", unavailable: true });
    await host.updateComplete;
    const control = (): Element | null | undefined => host.shadowRoot?.querySelector('[part="control"]');
    const set = { current: host.getAttribute("current"), unavailable: host.getAttribute("unavailable"), ariaCurrent: control()?.getAttribute("aria-current") ?? null, ariaDisabled: control()?.getAttribute("aria-disabled") ?? null };
    Object.assign(host, { current: undefined, unavailable: false });
    await host.updateComplete;
    const cleared = { current: host.hasAttribute("current"), unavailable: host.hasAttribute("unavailable"), ariaCurrent: control()?.hasAttribute("aria-current"), ariaDisabled: control()?.hasAttribute("aria-disabled") };
    document.body.innerHTML = '<ocelle-action-row current="true" unavailable>A</ocelle-action-row>';
    const parsed = document.querySelector("ocelle-action-row") as Row;
    await parsed.updateComplete;
    expect({ initial, set, cleared, parsed: { current: parsed.current, unavailable: parsed.unavailable } }).toEqual({
      initial: { unavailable: false, attribute: false },
      set: { current: "page", unavailable: "", ariaCurrent: "page", ariaDisabled: "true" },
      cleared: { current: false, unavailable: false, ariaCurrent: false, ariaDisabled: false },
      parsed: { current: "true", unavailable: true },
    });
  });
});

describe("ocelle-action-row's link mode", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders an inner <a> with href, target and rel in link mode, noopener for _blank without rel, and an inner <button> with none of them otherwise", async () => {
    document.body.innerHTML =
      '<ocelle-action-row id="a" href="/missions/42" target="_self" rel="next">A</ocelle-action-row>' +
      '<ocelle-action-row id="b" href="/missions/42" target="_blank">B</ocelle-action-row>' +
      '<ocelle-action-row id="c" href="/missions/42" target="_blank" rel="nofollow">C</ocelle-action-row>' +
      '<ocelle-action-row id="j" href="javascript:alert(1)" target="_blank">J</ocelle-action-row>' +
      '<ocelle-action-row id="e" href="  " rel="next">E</ocelle-action-row>' +
      '<ocelle-action-row id="n">N</ocelle-action-row>';
    const hosts = [...document.querySelectorAll("ocelle-action-row")] as Row[];
    await Promise.all(hosts.map((host) => host.updateComplete));
    expect(Object.fromEntries(hosts.map((host) => [host.id, inner(host)]))).toEqual({
      a: { tag: "a", href: "/missions/42", target: "_self", rel: "next" },
      b: { tag: "a", href: "/missions/42", target: "_blank", rel: "noopener" },
      c: { tag: "a", href: "/missions/42", target: "_blank", rel: "nofollow" },
      j: { tag: "button", type: "button" },
      e: { tag: "button", type: "button" },
      n: { tag: "button", type: "button" },
    });
  });

  it("follows an href set and removed later, and reports aria-busy on the inner link while busy", async () => {
    const host = created();
    await host.updateComplete;
    const before = inner(host);
    host.href = "/missions/42";
    host.busy = true;
    await host.updateComplete;
    const linked = inner(host);
    host.href = undefined;
    host.busy = false;
    await host.updateComplete;
    expect({ before, linked, after: inner(host) }).toEqual({ before: { tag: "button", type: "button" }, linked: { tag: "a", href: "/missions/42", "aria-busy": "true" }, after: { tag: "button", type: "button" } });
  });
});

// The host guard (FR-001; plan decision 23; src/control.ts `guardHost`): a click dispatched on the host itself does
// not pass through the inner control, so the row stops it and dispatches no activate event, while its own `click()`
// passes through the inner control and activates it. In process only: the driver dispatches no synthetic event.
describe("ocelle-action-row's host guard", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("stops a click dispatched on the host (no activate event, no click at the document), and its click() activates it once", async () => {
    const host = created();
    await host.updateComplete;
    const seen: string[] = [];
    const record = (event: Event): void => {
      seen.push(event.type);
    };
    document.addEventListener("click", record);
    document.addEventListener("ocelle-action-row-activate", record);
    host.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
    const synthetic = [...seen];
    seen.length = 0;
    host.click();
    const clicked = [...seen].sort();
    document.removeEventListener("click", record);
    document.removeEventListener("ocelle-action-row-activate", record);
    expect({ synthetic, clicked }).toEqual({ synthetic: [], clicked: ["click", "ocelle-action-row-activate"] });
  });
});

// Added after the mutation run of T059 (operator decision at phase 5, 2026-11-16, option (a); reviews/phase-5/notes.md):
// behaviours the scenarios left unasserted, one test per surviving behaviour. In process only: they read the inner
// control's attributes, change a text node's data, forward a slot through another shadow root and move a row between
// trees, none of which the driver does.

/** Waits for the row to render, then for a frame, and again, as the driver's settle does. */
async function settled(host: Row): Promise<void> {
  await host.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await host.updateComplete;
}

/** The page's element with `id`. */
function byId(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found;
}

/** The inner control of a row. */
function controlOf(host: Element): Element {
  const found = host.shadowRoot?.querySelector('[part="control"]');
  if (found === null || found === undefined) throw new Error("no inner control");
  return found;
}

describe("ocelle-action-row's name and description sources, in process", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("leaves no empty ARIA attribute on the inner control: no aria-labelledby or aria-describedby without a reference or a texted slot, no aria-label for a whitespace label or beside a host aria-labelledby; and sets each when it has a source", async () => {
    document.body.innerHTML =
      '<p id="owner">Mission 42 by Ana</p>' +
      '<ocelle-action-row id="plain">Mission 42</ocelle-action-row>' +
      '<ocelle-action-row id="blank" label="   ">Mission 42</ocelle-action-row>' +
      '<ocelle-action-row id="both" aria-labelledby="owner" label="Open" aria-label="Open it">Mission 42</ocelle-action-row>' +
      '<ocelle-action-row id="described">Mission 42<span slot="description">Due Friday</span></ocelle-action-row>';
    for (const host of [...document.querySelectorAll("ocelle-action-row")] as Row[]) await settled(host);
    const attributes = (id: string): Record<string, string | null> => {
      const inner = controlOf(document.getElementById(id) as Element);
      return Object.fromEntries(["aria-label", "aria-labelledby", "aria-describedby"].map((name) => [name, inner.getAttribute(name)]));
    };
    expect({ plain: attributes("plain"), blank: attributes("blank"), both: attributes("both"), described: attributes("described") }).toEqual({
      plain: { "aria-label": null, "aria-labelledby": null, "aria-describedby": null },
      blank: { "aria-label": null, "aria-labelledby": null, "aria-describedby": null },
      both: { "aria-label": null, "aria-labelledby": "", "aria-describedby": null },
      described: { "aria-label": null, "aria-labelledby": null, "aria-describedby": "" },
    });
  });

  it("describes the row once text is written into the data of a slotted element's text node, which fires no slotchange and changes no child list", async () => {
    document.body.innerHTML = '<ocelle-action-row id="r">Mission 42<span slot="description"> </span></ocelle-action-row>';
    const host = document.getElementById("r") as Row;
    await settled(host);
    const before = controlOf(host).ariaDescribedByElements?.length ?? 0;
    const text = host.querySelector("span")?.firstChild as Text;
    text.data = "Due Friday";
    await settled(host);
    expect({ before, after: controlOf(host).ariaDescribedByElements?.map((element) => element.textContent) ?? null }).toEqual({ before: 0, after: ["Due Friday"] });
  });

  it("reads a description forwarded through another shadow root's slot (the flattened assignment)", async () => {
    document.body.innerHTML = '<div id="outer"><span id="due">Due Friday</span></div>';
    const outer = byId("outer");
    outer.attachShadow({ mode: "open" }).innerHTML = '<ocelle-action-row>Mission 42<slot slot="description"></slot></ocelle-action-row>';
    const host = outer.shadowRoot?.querySelector("ocelle-action-row") as Row;
    await settled(host);
    expect(controlOf(host).ariaDescribedByElements?.map((element) => element.id) ?? null).toEqual(["due"]);
  });

  it("resolves a moved aria-labelledby when it was moved before the row was connected, and again when the row is connected in another tree", async () => {
    document.body.innerHTML = '<p id="owner">Mission 42 by Ana</p><div id="other"></div>';
    const early = document.createElement("ocelle-action-row") as Row;
    early.textContent = "Mission 42";
    early.setAttribute("aria-labelledby", "owner");
    document.body.append(early);
    await settled(early);
    const connected = controlOf(early).ariaLabelledByElements?.map((element) => element.textContent) ?? null;
    const root = byId("other").attachShadow({ mode: "open" });
    root.innerHTML = '<p id="owner">Mission 42 by Ben</p>';
    root.append(early);
    await settled(early);
    expect({ connected, moved: controlOf(early).ariaLabelledByElements?.map((element) => element.textContent) ?? null }).toEqual({ connected: ["Mission 42 by Ana"], moved: ["Mission 42 by Ben"] });
  });
});

describe("ocelle-action-row's end group takes no space when empty", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shrink-wraps a title-only row to its title and its inline padding (13 px a side, the border included), and shows the tags of a row without a trailing icon", async () => {
    document.body.innerHTML =
      '<div id="wrap"><ocelle-action-row id="t"><span id="title">Mission 42</span></ocelle-action-row></div>' +
      '<ocelle-action-row id="g">Mission 43<span id="tag" slot="tags">Blocked</span></ocelle-action-row>';
    byId("wrap").style.display = "inline-block";
    const [titled, tagged] = [document.getElementById("t") as Row, document.getElementById("g") as Row];
    await settled(titled);
    await settled(tagged);
    const host = titled.getBoundingClientRect();
    const title = byId("title").getBoundingClientRect();
    const tag = byId("tag").getBoundingClientRect();
    expect({ width: Math.abs(host.width - (title.width + 26)) <= 0.5, tag: tag.width > 0 }).toEqual({ width: true, tag: true });
  });
});

// A modifier click on a button-mode row (FR-033, data-model.md § Event `ocelle-action-row-activate`: any click in
// button mode activates; only link mode ignores Ctrl, Meta, Shift and Alt clicks). Added after the red commit for the
// surviving mutant at src/ocelle-action-row.ts's modifier check (operator decision at phase 6, 2026-11-16, option (a)).
describe("ocelle-action-row's modifier clicks in button mode", { timeout: 60_000 }, () => {
  it("dispatches exactly one click and one ocelle-action-row-activate for each Ctrl, Meta, Shift and Alt click on a button-mode row", async () => {
    await driver.mount('<div id="wrap"><ocelle-action-row id="r" row-id="m-42">Mission 42</ocelle-action-row></div>');
    await driver.events("r", ["click", "ocelle-action-row-activate"]);
    const found: Record<string, unknown> = {};
    for (const modifier of ["Control", "Meta", "Shift", "Alt"] as const) {
      await driver.click("r", { modifiers: [modifier] });
      const records = (await driver.takeEvents()).filter((record) => record.target === "ocelle-action-row#r");
      found[modifier] = Object.fromEntries(["click", "ocelle-action-row-activate"].map((type) => [type, new Set(records.filter((record) => record.type === type).map((record) => record.serial)).size]));
    }
    const once = { click: 1, "ocelle-action-row-activate": 1 };
    expect(found).toEqual({ Control: once, Meta: once, Shift: once, Alt: once });
  });
});
