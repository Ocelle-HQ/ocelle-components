import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";

// The two browser commands of the elements project (005 research.md R-11, T012; reviews/phase-2/spike.md § 3):
// `axTree(id)` returns the unignored accessibility nodes of the element with that `id` and of its shadow subtree,
// read from Chromium's full tree of this test's frame, and `emulateForcedColors(mode, palette)` switches forced
// colours and the system palette for this page and back. Plain elements stand in for the icons, so these tests pin
// the commands, not the elements.
afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
  document.body.replaceChildren();
});

class HiddenHost extends HTMLElement {
  constructor() {
    super();
    this.attachInternals().ariaHidden = "true";
    this.attachShadow({ mode: "open" }).append(document.createElement("span"));
  }
}

class NamedHost extends HTMLElement {
  constructor() {
    super();
    const internals = this.attachInternals();
    internals.role = "img";
    internals.ariaLabel = "Named";
    const shadow = this.attachShadow({ mode: "open" });
    const inside = document.createElement("button");
    inside.textContent = "Inside";
    shadow.append(inside);
  }
}

/** An ElementInternals progressbar (013 research.md R-05's B3): determinate with `data-now`, else indeterminate. */
class InternalsBar extends HTMLElement {
  constructor() {
    super();
    const internals = this.attachInternals();
    internals.role = "progressbar";
    internals.ariaLabel = "Internals";
    internals.ariaValueMin = "0";
    internals.ariaValueMax = "12";
    const now = this.getAttribute("data-now");
    if (now !== null) internals.ariaValueNow = now;
    this.attachShadow({ mode: "open" }).append(document.createElement("div"));
  }
}

customElements.define("ocelle-commands-hidden", HiddenHost);
customElements.define("ocelle-commands-bar", InternalsBar);
customElements.define("ocelle-commands-named", NamedHost);

describe("axTree(id)", () => {
  it("gives a plain <button id> one button node with its name, its light-DOM text not counted", async () => {
    document.body.innerHTML = '<p>Before <button id="go">Go</button> after</p>';
    expect(await commands.axTree("go")).toEqual([{ role: "button", name: "Go" }]);
  });

  it("gives the element's own node and the nodes of its shadow subtree, the shadow button's text among them, in tree order", async () => {
    document.body.innerHTML = '<ocelle-commands-named id="named"></ocelle-commands-named>';
    expect(await commands.axTree("named")).toEqual([
      { role: "image", name: "Named" },
      { role: "button", name: "Inside" },
      { role: "StaticText", name: "Inside" },
    ]);
  });

  it("gives no node for an element hidden through its internals, beside an unhidden custom element with an id that gives a generic one", async () => {
    document.body.innerHTML = '<p><ocelle-commands-hidden id="hidden"></ocelle-commands-hidden> <span-host id="plain"></span-host></p>';
    customElements.define("span-host", class extends HTMLElement {});
    expect({ hidden: await commands.axTree("hidden"), plain: await commands.axTree("plain") }).toEqual({
      hidden: [],
      plain: [{ role: "generic", name: "" }],
    });
  });

  it("gives no node for an id that no element has, beside one that has it", async () => {
    document.body.innerHTML = '<button id="here">Here</button>';
    expect({ missing: await commands.axTree("missing"), here: await commands.axTree("here") }).toEqual({
      missing: [],
      here: [{ role: "button", name: "Here" }],
    });
  });
});

describe("axTree(id, \"subtree\") heading levels (013 US2-1, US2-2)", () => {
  it("gives each heading its level, from the element the page wrote, and no level to a paragraph or a button", async () => {
    document.body.innerHTML = '<div id="block"><h1>One</h1><h3>Three</h3><p>Text</p><button>Go</button><div role="heading" aria-level="5">Five</div></div>';
    expect((await commands.axTree("block", "subtree")).filter((node) => node.role !== "StaticText" && node.role !== "generic")).toEqual([
      { role: "heading", name: "One", level: 1 },
      { role: "heading", name: "Three", level: 3 },
      { role: "paragraph", name: "" },
      { role: "button", name: "Go" },
      { role: "heading", name: "Five", level: 5 },
    ]);
  });
});

describe("emulateForcedColors(mode, palette)", () => {
  it('makes (forced-colors: active) and the palette match, and "none" ends it', async () => {
    const before = matchMedia("(forced-colors: active)").matches;
    await commands.emulateForcedColors("active", "dark");
    const dark = [matchMedia("(forced-colors: active)").matches, matchMedia("(prefers-color-scheme: dark)").matches];
    await commands.emulateForcedColors("active", "light");
    const light = [matchMedia("(forced-colors: active)").matches, matchMedia("(prefers-color-scheme: light)").matches];
    await commands.emulateForcedColors("none");
    expect({ before, dark, light, after: matchMedia("(forced-colors: active)").matches }).toEqual({
      before: false,
      dark: [true, true],
      light: [true, true],
      after: false,
    });
  });

  it('"none" after a dark palette leaves the page in the light colour scheme the fixture contexts start in', async () => {
    await commands.emulateForcedColors("active", "dark");
    const during = matchMedia("(prefers-color-scheme: dark)").matches;
    await commands.emulateForcedColors("none");
    expect({
      during,
      forced: matchMedia("(forced-colors: active)").matches,
      dark: matchMedia("(prefers-color-scheme: dark)").matches,
      light: matchMedia("(prefers-color-scheme: light)").matches,
    }).toEqual({ during: true, forced: false, dark: false, light: true });
  });
});

// 013 phase 3 (contracts/checks.md § Driver additions; tasks.md T037): the AX value properties of a range node and the
// reduced-motion emulation. `valuetext` reads "" in Chromium whatever the page sets (reviews/phase-3/spike.md), so it
// is left out of these reads and asserted nowhere.
const values = (nodes: readonly { readonly role: string; readonly name: string; readonly value?: number; readonly valuemin?: number; readonly valuemax?: number }[]): unknown =>
  nodes.map(({ role, name, value, valuemin, valuemax }) => ({ role, name, value, valuemin, valuemax }));

describe("axTree(id) value properties (013 phase 3)", () => {
  it("gives a native <progress> its value, min and max, and an indeterminate one its min and max with no value", async () => {
    document.body.innerHTML = '<progress id="known" value="7" max="12" aria-label="Known"></progress><progress id="unknown" max="12" aria-label="Unknown"></progress>';
    expect({ known: values(await commands.axTree("known")), unknown: values(await commands.axTree("unknown")) }).toEqual({
      known: [{ role: "progressbar", name: "Known", value: 7, valuemin: 0, valuemax: 12 }],
      unknown: [{ role: "progressbar", name: "Unknown", value: undefined, valuemin: 0, valuemax: 12 }],
    });
  });

  it("gives an ElementInternals progressbar its value, min and max, and an indeterminate one its min and max with no value, and a button none of them", async () => {
    document.body.innerHTML = '<ocelle-commands-bar id="known" data-now="7"></ocelle-commands-bar><ocelle-commands-bar id="unknown"></ocelle-commands-bar><button id="go">Go</button>';
    expect({ known: values(await commands.axTree("known")), unknown: values(await commands.axTree("unknown")), button: values(await commands.axTree("go")) }).toEqual({
      known: [{ role: "progressbar", name: "Internals", value: 7, valuemin: 0, valuemax: 12 }],
      unknown: [{ role: "progressbar", name: "Internals", value: undefined, valuemin: 0, valuemax: 12 }],
      button: [{ role: "button", name: "Go", value: undefined, valuemin: undefined, valuemax: undefined }],
    });
  });
});

describe("emulateReducedMotion(mode) (013 phase 3)", () => {
  it('makes (prefers-reduced-motion: reduce) match, keeps it through a later emulateForcedColors call, and "no-preference" ends it', async () => {
    const before = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateReducedMotion("reduce");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateForcedColors("active", "dark");
    const forced = [matchMedia("(prefers-reduced-motion: reduce)").matches, matchMedia("(forced-colors: active)").matches];
    await commands.emulateForcedColors("none");
    const unforced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateReducedMotion("no-preference");
    expect({ before, reduced, forced, unforced, after: matchMedia("(prefers-reduced-motion: reduce)").matches }).toEqual({
      before: false,
      reduced: true,
      forced: [true, true],
      unforced: true,
      after: false,
    });
  });
});
