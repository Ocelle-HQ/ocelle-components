import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-button.ts";
import "../src/ocelle-icon.ts";
import "./fixtures/shadow-controls.ts";
import { inProcessDriver } from "./in-process.ts";
import { busyScenarios, busySinkScenarios } from "./scenarios/busy.ts";
import { chromeActionScenarios, initialsScenarios, initialsAfterWhitespaceUpdate, initialsWhitespaceCases, buttonScenarios, forwardedIconScenarios } from "./scenarios/button.ts";
import { linkScenarios, linkSinkScenarios } from "./scenarios/link.ts";

// User Story 1's browser scenarios for `ocelle-button` in button mode, in process on the element source (012
// research.md R-11; tasks.md T018): the shared bodies of scenarios/button.ts on the in-process driver, light and dark,
// forced colours and right to left as each body sets them, with axe on each body's page; the same bodies run on the
// built browser build on the strict-CSP fixture in test/browser/button.test.ts. `ocelle-icon` is imported for the
// bodies that slot one, and the test-only controls for op 022's forwarded icon slot. Forced colours and reduced motion
// are reset after each test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-button, in process (US1)", { timeout: 60_000 }, () => {
  it.each([...buttonScenarios, ...chromeActionScenarios])("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect(observed, "settled drawing and interaction").toEqual(expected);
  });
});

// Op 022 (#57): the pin with a forwarded icon slot, in process only (scenarios/button.ts `forwardedIconScenarios`).
describe("ocelle-button with an icon slot forwarded from another shadow root, in process (op 022)", { timeout: 60_000 }, () => {
  it.each(forwardedIconScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

// User Story 2 (tasks.md T033): the shared link and passthrough bodies of scenarios/link.ts, and its in-process link
// bodies on the navigation sink's records.
describe("ocelle-button in link mode and its ARIA passthrough, in process (US2)", { timeout: 60_000 }, () => {
  it.each([...linkScenarios, ...linkSinkScenarios])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

// User Story 3 (tasks.md T043): the shared busy bodies of scenarios/busy.ts, with reduced motion and forced colours as
// each body sets them, and its in-process busy link body on the navigation sink's records.
describe("a busy ocelle-button, in process (US3)", { timeout: 60_000 }, () => {
  it.each([...busyScenarios, ...busySinkScenarios])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

// `busy` reflects (data-model.md § `ocelle-button`; FR-015; tasks.md T043): set from script it reaches the host's
// attribute and the inner control's busy state, and the attribute reads back as a boolean, false by default.
describe("ocelle-button's reflected busy property", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is false by default, reflects true as the busy attribute and the inner control's aria-busy, and removes both when set false", async () => {
    const host = document.createElement("ocelle-button") as HTMLElementTagNameMap["ocelle-button"] & { busy?: boolean };
    host.textContent = "Save";
    document.body.append(host);
    await host.updateComplete;
    const initial = { busy: host.busy, attribute: host.hasAttribute("busy") };
    host.busy = true;
    await host.updateComplete;
    const set = { attribute: host.getAttribute("busy"), inner: host.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-busy") ?? null };
    host.busy = false;
    await host.updateComplete;
    const cleared = { attribute: host.hasAttribute("busy"), inner: host.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-busy") ?? null };
    expect({ initial, set, cleared }).toEqual({ initial: { busy: false, attribute: false }, set: { attribute: "", inner: "true" }, cleared: { attribute: false, inner: null } });
  });

  it("reads the busy attribute as a boolean", async () => {
    document.body.innerHTML = '<ocelle-button busy>Save</ocelle-button><ocelle-button>Save</ocelle-button>';
    const [on, off] = [...document.querySelectorAll("ocelle-button")] as (HTMLElementTagNameMap["ocelle-button"] & { busy?: boolean })[];
    await on?.updateComplete;
    await off?.updateComplete;
    expect({ on: on?.busy, off: off?.busy }).toEqual({ on: true, off: false });
  });
});

// The link properties reflect (data-model.md § `ocelle-button`; tasks.md T036): `href`, `target`, `rel` and `download`
// set from script reach the host's attributes and the inner link, and read the attributes back.
/** The button with its link properties, typed here so the test reads them whatever the element declares. */
type Linkable = HTMLElementTagNameMap["ocelle-button"] & { href?: string | undefined; target?: string | undefined; rel?: string | undefined; download?: string | undefined };

describe("ocelle-button's reflected link properties", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects href, target, rel and download set as properties, renders them on the inner link, and removes the attributes when set to undefined", async () => {
    const host = document.createElement("ocelle-button") as Linkable;
    host.textContent = "Projects";
    document.body.append(host);
    host.href = "/projects";
    host.target = "_blank";
    host.rel = "nofollow";
    host.download = "list.csv";
    await host.updateComplete;
    const link = host.shadowRoot?.querySelector('[part="control"]');
    const set = { href: host.getAttribute("href"), target: host.getAttribute("target"), rel: host.getAttribute("rel"), download: host.getAttribute("download") };
    const rendered = { tag: link?.localName, href: link?.getAttribute("href"), target: link?.getAttribute("target"), rel: link?.getAttribute("rel"), download: link?.getAttribute("download") };
    host.href = undefined;
    host.target = undefined;
    host.rel = undefined;
    host.download = undefined;
    await host.updateComplete;
    expect({ set, rendered, cleared: ["href", "target", "rel", "download"].map((name) => host.hasAttribute(name)), mode: host.shadowRoot?.querySelector('[part="control"]')?.localName }).toEqual({
      set: { href: "/projects", target: "_blank", rel: "nofollow", download: "list.csv" },
      rendered: { tag: "a", href: "/projects", target: "_blank", rel: "nofollow", download: "list.csv" },
      cleared: [false, false, false, false],
      mode: "button",
    });
  });

  it("reads href, target, rel and download from the attributes", async () => {
    document.body.innerHTML = '<ocelle-button href="/a" target="_self" rel="next" download="">A</ocelle-button>';
    const host = document.querySelector<Linkable>("ocelle-button");
    await host?.updateComplete;
    expect({ href: host?.href, target: host?.target, rel: host?.rel, download: host?.download }).toEqual({ href: "/a", target: "_self", rel: "next", download: "" });
  });
});

// The reflected properties (data-model.md § `ocelle-button`; tasks.md T025): `variant`, `size`, `flush`, `ground`
// and `disabled` reflect a property set from script to the attribute, and the boolean ones read an attribute as a
// boolean; `label` is not reflected (test/control.test.ts). Added after the mutation run of T029, which found the
// reflection unasserted: the scenarios set attributes only.
describe("ocelle-button's reflected properties", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects variant, size, flush, ground and disabled set as properties, and removes flush and disabled when set false", async () => {
    const host = document.createElement("ocelle-button");
    host.textContent = "Save";
    document.body.append(host);
    host.variant = "quiet";
    host.size = "compact";
    host.flush = true;
    host.ground = "chrome";
    host.disabled = true;
    await host.updateComplete;
    const set = { variant: host.getAttribute("variant"), size: host.getAttribute("size"), flush: host.getAttribute("flush"), ground: host.getAttribute("ground"), disabled: host.getAttribute("disabled") };
    host.flush = false;
    host.disabled = false;
    await host.updateComplete;
    expect({ set, cleared: { flush: host.hasAttribute("flush"), disabled: host.hasAttribute("disabled") } }).toEqual({
      set: { variant: "quiet", size: "compact", flush: "", ground: "chrome", disabled: "" },
      cleared: { flush: false, disabled: false },
    });
  });

  it("reads the flush and disabled attributes as booleans, and variant, size and ground as strings", async () => {
    document.body.innerHTML = '<ocelle-button id="b" flush disabled variant="primary" size="compact" ground="state">Save</ocelle-button>';
    const host = document.querySelector("ocelle-button");
    await host?.updateComplete;
    expect({ flush: host?.flush, disabled: host?.disabled, variant: host?.variant, size: host?.size, ground: host?.ground }).toEqual({ flush: true, disabled: true, variant: "primary", size: "compact", ground: "state" });
  });
});

// The icon-only gap (review round 1, R1-01; research.md R-09): with no label content the slotted icon takes no gap and
// is centred in the inner control. A template that renders the label as a text binding changes the data of the text
// node it already slotted, which fires no `slotchange`; the gap must still follow the text. "No label" is no
// non-whitespace text in the default slot's flattened assignment, as FR-031 defines an empty row slot, so an empty
// `<span>` is no label and a label forwarded through another shadow root's `<slot>` is one. In process only: the
// driver reaches no text node and no shadow root of the page's own.
describe("ocelle-button's icon gap follows the label text", () => {
  /** The slotted icon's inline-end margin and whether its centre is the inner control's inline centre within 0.5 px. */
  function layout(host: HTMLElement): { readonly margin: string; readonly centred: boolean } {
    const icon = host.querySelector("ocelle-icon");
    const inner = host.shadowRoot?.querySelector('[part="control"]');
    if (icon === null || inner === null || inner === undefined) throw new Error("no icon or inner control");
    const [glyph, box] = [icon.getBoundingClientRect(), inner.getBoundingClientRect()];
    return { margin: getComputedStyle(icon).marginInlineEnd, centred: Math.abs(glyph.x + glyph.width / 2 - (box.x + box.width / 2)) <= 0.5 };
  }

  const frame = (): Promise<unknown> => new Promise((resolve) => requestAnimationFrame(resolve));

  it("drops the gap while the default slot's only text is whitespace and brings it back when text is written into that text node, and drops it when the text is emptied again", async () => {
    await driver.mount('<ocelle-button id="b" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon> </ocelle-button>');
    const host = document.querySelector("ocelle-button");
    if (host === null) throw new Error("no button");
    await host.updateComplete;
    await frame();
    const text = host.lastChild as Text;
    const whitespace = layout(host);
    text.data = "Close";
    await frame();
    await host.updateComplete;
    const written = layout(host);
    text.data = "  ";
    await frame();
    await host.updateComplete;
    const emptied = layout(host);
    expect({ whitespace, written: written.margin, emptied }).toEqual({ whitespace: { margin: "0px", centred: true }, written: "8px", emptied: { margin: "0px", centred: true } });
  });

  it("treats a slotted element with no text as no label (the icon is centred), and one with text as a label (the gap stays)", async () => {
    await driver.mount(
      '<ocelle-button id="e" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon><span> </span></ocelle-button>' +
        '<ocelle-button id="t" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon><span>Close</span></ocelle-button>',
    );
    const [empty, texted] = [document.getElementById("e"), document.getElementById("t")];
    if (empty === null || texted === null) throw new Error("no buttons");
    expect({ empty: layout(empty), texted: layout(texted).margin }).toEqual({ empty: { margin: "0px", centred: true }, texted: "8px" });
  });

  // Review round 2, R2-01 (FR-031's scenario, spec.md:456-458): text written into, or removed from, a slotted element
  // is a child-list change inside it; the default slot's assignment is unchanged, so it fires no `slotchange`.
  it("brings the gap back when text is written into an empty slotted element (a text node, textContent, a nested element) and centres the icon again when it is removed", async () => {
    await driver.mount(
      '<ocelle-button id="n" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon><span></span></ocelle-button>' +
        '<ocelle-button id="c" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon><span></span></ocelle-button>' +
        '<ocelle-button id="d" label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon><span><b></b></span></ocelle-button>',
    );
    const hosts = ["n", "c", "d"].map((id) => {
      const host = document.getElementById(id);
      if (host === null) throw new Error(`no #${id}`);
      return host as HTMLElementTagNameMap["ocelle-button"];
    });
    const [node, content, nested] = hosts as [HTMLElementTagNameMap["ocelle-button"], HTMLElementTagNameMap["ocelle-button"], HTMLElementTagNameMap["ocelle-button"]];
    const span = (host: HTMLElement): HTMLElement => {
      const found = host.querySelector("span");
      if (found === null) throw new Error("no span");
      return found;
    };
    const deep = span(nested).querySelector("b");
    if (deep === null) throw new Error("no nested element");
    const settle = async (): Promise<void> => {
      await frame();
      await Promise.all(hosts.map((host) => host.updateComplete));
      await frame();
    };
    await settle();
    const before = hosts.map(layout);
    const inserted = document.createTextNode("Close");
    span(node).append(inserted);
    span(content).textContent = "Close";
    const deepText = document.createTextNode("Close");
    deep.append(deepText);
    await settle();
    const written = hosts.map((host) => layout(host).margin);
    inserted.remove();
    span(content).textContent = "";
    deepText.remove();
    await settle();
    const removed = hosts.map(layout);
    const centred = { margin: "0px", centred: true };
    expect({ before, written, removed }).toEqual({ before: [centred, centred, centred], written: ["8px", "8px", "8px"], removed: [centred, centred, centred] });
  });

  it("reads a label forwarded through another shadow root's slot (the flattened assignment): a forwarded text keeps the gap, none centres the icon", async () => {
    await driver.mount('<div id="t">Close</div><div id="e"></div>');
    const forward = (id: string): HTMLElementTagNameMap["ocelle-button"] => {
      const outer = document.getElementById(id);
      if (outer === null) throw new Error(`no #${id}`);
      outer.attachShadow({ mode: "open" }).innerHTML = '<ocelle-button label="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon><slot></slot></ocelle-button>';
      const host = outer.shadowRoot?.querySelector("ocelle-button");
      if (host === null || host === undefined) throw new Error("no button");
      return host;
    };
    const [texted, empty] = [forward("t"), forward("e")];
    await frame();
    await texted.updateComplete;
    await empty.updateComplete;
    await frame();
    expect({ texted: layout(texted).margin, empty: layout(empty) }).toEqual({ texted: "8px", empty: { margin: "0px", centred: true } });
  });
});

describe("Initials account button in process", { timeout: 60_000 }, () => {
  it.each(initialsScenarios)("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect(observed, "named button and visible initials").toEqual(expected);
  });
});

describe("Unicode whitespace boundaries of initials in process", { timeout: 60_000 }, () => {
  it.each(initialsWhitespaceCases)("$name", async ({ inputs, expectedText }) => {
    const observed = await initialsAfterWhitespaceUpdate(driver, inputs);
    expect(observed, "Unicode White_Space trimming and full-cluster visibility").toEqual(inputs.map(() => ({ before: "W", text: expectedText, plate: expectedText !== null, name: "Account actions" })));
  });
});
