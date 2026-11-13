import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";

// The browser commands of the elements project (005 research.md R-11, T012; reviews/phase-2/spike.md § 3; 011
// research.md R-13, T004): `axTree(id)` returns the unignored accessibility nodes of the element with that `id` and of
// its shadow subtree, read from Chromium's full tree of this test's frame, a heading's with its level;
// `emulateForcedColors(mode, palette)` switches forced colours and the system palette for this page and back;
// `scrollWidth()`, `activeElement()` and `textBoxes(id)` read the test frame's document: its scrolling width, the
// focused element through open shadow roots, and the box and clipping ancestors of each text node under an element.
// Plain elements stand in for the icons, so these tests pin the commands, not the elements.
const sheets = document.adoptedStyleSheets;

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await page.viewport(414, 896);
  document.adoptedStyleSheets = sheets;
  document.body.replaceChildren();
});

/** Adds `rules` to the page as an adopted stylesheet, after its own. */
function rules(text: string): void {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(text);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}

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

customElements.define("ocelle-commands-hidden", HiddenHost);
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

describe("axTree(id): heading levels (011 R-13)", () => {
  it("gives an <h3 id> one heading node at level 3 and an <h2 id> one at level 2", async () => {
    document.body.innerHTML = '<h3 id="three">Three</h3><h2 id="two">Two</h2>';
    expect({ three: await commands.axTree("three"), two: await commands.axTree("two") }).toEqual({
      three: [{ role: "heading", name: "Three", level: 3 }],
      two: [{ role: "heading", name: "Two", level: 2 }],
    });
  });

  it("gives the level of a heading in an element's accessibility subtree, and none to a node that is not a heading", async () => {
    document.body.innerHTML = '<section id="part" aria-label="Part"><h4>Four</h4><button>Go</button></section>';
    const nodes = await commands.axTree("part", "subtree");
    expect(nodes.map((node) => ({ role: node.role, level: node.level ?? "none" }))).toEqual([
      { role: "region", level: "none" },
      { role: "heading", level: 4 },
      { role: "StaticText", level: "none" },
      { role: "button", level: "none" },
      { role: "StaticText", level: "none" },
    ]);
  });
});

describe("scrollWidth() (011 R-13)", () => {
  it("reads 400 for a 400 px wide child in a 320 px viewport, and 320 once the child is gone", async () => {
    await page.viewport(320, 600);
    rules("body { margin: 0 } #wide { inline-size: 400px; block-size: 10px }");
    document.body.innerHTML = '<div id="wide"></div>';
    const wide = await commands.scrollWidth();
    document.getElementById("wide")?.remove();
    expect({ wide, narrow: await commands.scrollWidth() }).toEqual({ wide: 400, narrow: 320 });
  });
});

describe("activeElement() (011 R-13)", () => {
  it("reads the focused element through open shadow roots with the hosts on its path, and a document-level one with none", async () => {
    document.body.innerHTML = '<button id="plain">Plain</button><div id="outer"></div>';
    const outer = document.getElementById("outer");
    const middle = document.createElement("div");
    middle.id = "middle";
    outer?.attachShadow({ mode: "open" }).append(middle);
    const inner = document.createElement("button");
    inner.id = "inner";
    inner.textContent = "Inner";
    middle.attachShadow({ mode: "open" }).append(inner);
    inner.focus();
    const deep = await commands.activeElement();
    document.getElementById("plain")?.focus();
    const plain = await commands.activeElement();
    (document.activeElement as HTMLElement | null)?.blur();
    expect({ deep, plain, none: await commands.activeElement() }).toEqual({
      deep: { name: "button", id: "inner", hosts: ["outer", "middle"] },
      plain: { name: "button", id: "plain", hosts: [] },
      none: { name: "body", id: "", hosts: [] },
    });
  });
});

describe("textBoxes(id) (011 R-13)", () => {
  it("reports a text inside an overflow: hidden ancestor that cuts it as clipped, naming that ancestor, and a text that fits as not", async () => {
    rules(`
      body { margin: 0 }
      #clip { overflow: hidden; inline-size: 50px; white-space: nowrap; font: 16px/20px sans-serif }
      #free { inline-size: 300px; font: 16px/20px sans-serif }
    `);
    document.body.innerHTML = '<div id="clip">A run of text far wider than fifty pixels</div><div id="free">Short</div>';
    const [clipped] = await commands.textBoxes("clip");
    const [free] = await commands.textBoxes("free");
    const line = document.getElementById("free")?.getBoundingClientRect();
    const inLine = (box: { x: number; y: number; width: number; height: number } | undefined): boolean =>
      box !== undefined && line !== undefined && box.width > 0 && box.x >= line.x && box.x + box.width <= line.x + 300 && box.y >= line.y && box.y + box.height <= line.y + line.height;
    expect({
      clipped: { text: clipped?.text, wide: (clipped?.box.width ?? 0) > 50, clippers: clipped?.clippers, clipped: clipped?.clipped },
      free: { text: free?.text, inLine: inLine(free?.box), clippers: free?.clippers, clipped: free?.clipped },
    }).toEqual({
      clipped: { text: "A run of text far wider than fifty pixels", wide: true, clippers: ["clip"], clipped: true },
      free: { text: "Short", inLine: true, clippers: [], clipped: false },
    });
  });

  it("follows a slotted text node through the flat tree to a clipping wrapper in the host's shadow root, one entry per text node", async () => {
    rules("body { margin: 0; font: 16px/20px sans-serif }");
    document.body.innerHTML = '<div id="host">First words that run on <b>and on</b></div>';
    const host = document.getElementById("host");
    const shadow = host?.attachShadow({ mode: "open" });
    const wrapper = document.createElement("div");
    wrapper.className = "wrapper";
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(".wrapper { overflow: hidden; inline-size: 40px; white-space: nowrap }");
    if (shadow !== undefined) shadow.adoptedStyleSheets = [sheet];
    wrapper.append(document.createElement("slot"));
    shadow?.append(wrapper);
    const boxes = await commands.textBoxes("host");
    expect(boxes.map((each) => ({ text: each.text, clippers: each.clippers, clipped: each.clipped }))).toEqual([
      { text: "First words that run on ", clippers: ["div"], clipped: true },
      { text: "and on", clippers: ["div"], clipped: true },
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
