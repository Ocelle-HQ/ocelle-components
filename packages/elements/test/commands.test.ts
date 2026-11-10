import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";

// The two browser commands of the elements project (005 research.md R-11, T012; reviews/phase-2/spike.md § 3):
// `axTree(id)` returns the unignored accessibility nodes of the element with that `id` and of its shadow subtree,
// read from Chromium's full tree of this test's frame, and `emulateForcedColors(mode, palette)` switches forced
// colours and the system palette for this page and back. Plain elements stand in for the icons, so these tests pin
// the commands, not the elements.
afterEach(async () => {
  await commands.emulateForcedColors("none");
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

customElements.define("ocelle-commands-hidden", HiddenHost);
customElements.define("ocelle-commands-named", NamedHost);

describe("axTree(id)", () => {
  it("gives a plain <button id> one button node with its name, its light-DOM text not counted", async () => {
    document.body.innerHTML = '<p>Before <button id="go">Go</button> after</p>';
    expect(await commands.axTree("go")).toEqual([{ role: "button", name: "Go" }]);
  });

  it("gives the element's own node and the nodes of its shadow subtree, in tree order", async () => {
    document.body.innerHTML = '<ocelle-commands-named id="named"></ocelle-commands-named>';
    expect(await commands.axTree("named")).toEqual([
      { role: "image", name: "Named" },
      { role: "button", name: "Inside" },
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
});
