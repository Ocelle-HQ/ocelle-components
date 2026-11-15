import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-action-row.ts";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { actionRowScenarios } from "./scenarios/action-row.ts";

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
