import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";

// The browser commands of the elements project (005 research.md R-11, T012; reviews/phase-2/spike.md § 3; 011
// research.md R-13, T004): `axTree(id)` returns the unignored accessibility nodes of the element with that `id` and of
// its shadow subtree, read from Chromium's full tree of this test's frame, a heading's with its level;
// `emulateForcedColors(mode, palette)` switches forced colours and the system palette for this page and back;
// `scrollWidth()`, `activeElement()` and `textBoxes(id)` read the test frame's document: its scrolling width, the
// focused element through open shadow roots, and the box and clipping ancestors of each text node under an element;
// `emulateReducedMotion(mode)` (013 phase 3) switches `prefers-reduced-motion` for this page and back, and `axTree`
// reports a heading's level (013 US2-1, US2-2) and a range node's value properties (013 phase 3). 008 adds (research.md
// R-14; tasks.md T003): `axTree` also gives a node's description and its modal flag where Chromium reports them;
// `pointerPath(steps)` moves the real pointer through points of this test's frame, pressing and releasing where a step
// says so. `touchTap` needs a touch context and is tested in commands.touch.test.ts. Reduced motion is 013's
// `emulateReducedMotion(mode)`: forced colours leave it alone. The elements project's viewport is 1280 × 800 (008
// R-14), so each test ends by restoring it. Plain elements stand in for the icons, so these tests pin the commands, not
// the elements.
const sheets = document.adoptedStyleSheets;

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await page.viewport(1280, 800);
  document.adoptedStyleSheets = sheets;
  await commands.emulateReducedMotion("no-preference");
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

describe("axTree(id) description, modal and level", () => {
  it("gives a modal dialog's modal flag, a heading's level and a described button's description beside role and name", async () => {
    document.body.innerHTML = '<dialog id="dlg" aria-label="Panel"><h3 id="h">Title</h3><button id="b" aria-describedby="d">Go</button><p id="d">More</p></dialog>';
    (document.getElementById("dlg") as HTMLDialogElement).showModal();
    expect({ dialog: await commands.axTree("dlg"), heading: await commands.axTree("h"), button: await commands.axTree("b") }).toEqual({
      dialog: [{ role: "dialog", name: "Panel", modal: true }],
      heading: [{ role: "heading", name: "Title", level: 3 }],
      button: [{ role: "button", name: "Go", description: "More" }],
    });
  });
});

describe("emulateReducedMotion(mode) (008 R-14)", () => {
  it('makes (prefers-reduced-motion: reduce) match, and "no-preference" ends it', async () => {
    const before = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateReducedMotion("reduce");
    const on = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateReducedMotion("no-preference");
    expect({ before, on, off: matchMedia("(prefers-reduced-motion: reduce)").matches }).toEqual({ before: false, on: true, off: false });
  });
});

/** Puts a button of 80 × 40 px at (`left`, 100) of this frame, so its centre is at (`left` + 40, 120). */
function placed(id: string, left: number): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = id;
  button.textContent = id;
  Object.assign(button.style, { position: "fixed", left: `${String(left)}px`, top: "100px", width: "80px", height: "40px", margin: "0" });
  document.body.append(button);
  return button;
}

/** Records `<id> <type> <pointerType> <clientX> <clientY>` for each pointerdown and pointerup on `targets`. */
function pointerLog(...targets: HTMLElement[]): string[] {
  const log: string[] = [];
  for (const target of targets) {
    for (const type of ["pointerdown", "pointerup"]) {
      target.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        log.push(`${target.id} ${pointer.type} ${pointer.pointerType} ${String(Math.round(pointer.clientX))} ${String(Math.round(pointer.clientY))}`);
      });
    }
  }
  return log;
}

describe("pointerPath(steps)", () => {
  it("presses and releases on the first button at its centre in this frame's coordinates, then stops on the second, which alone is :hover", async () => {
    const one = placed("one", 100);
    const two = placed("two", 300);
    const log = pointerLog(one, two);
    await commands.pointerPath([{ x: 140, y: 120, down: true }, { x: 140, y: 120, up: true }, { x: 340, y: 120 }]);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect({ log, one: one.matches(":hover"), two: two.matches(":hover") }).toEqual({
      log: ["one pointerdown mouse 140 120", "one pointerup mouse 140 120"],
      one: false,
      two: true,
    });
  });

  it("a press on the first button released on the second gives the release to the second", async () => {
    const one = placed("one", 100);
    const two = placed("two", 300);
    const log = pointerLog(one, two);
    await commands.pointerPath([{ x: 140, y: 120, down: true }, { x: 340, y: 120, up: true }]);
    expect(log).toEqual(["one pointerdown mouse 140 120", "two pointerup mouse 340 120"]);
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
