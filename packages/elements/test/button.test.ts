import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-button.ts";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { buttonScenarios } from "./scenarios/button.ts";

// User Story 1's browser scenarios for `ocelle-button` in button mode, in process on the element source (012
// research.md R-11; tasks.md T018): the shared bodies of scenarios/button.ts on the in-process driver, light and dark,
// forced colours and right to left as each body sets them, with axe on each body's page; the same bodies run on the
// built browser build on the strict-CSP fixture in test/browser/button.test.ts. `ocelle-icon` is imported for the
// bodies that slot one. Forced colours and reduced motion are reset after each test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-button, in process (US1)", { timeout: 60_000 }, () => {
  it.each(buttonScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
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
