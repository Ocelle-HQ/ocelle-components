import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";

// The two browser commands of the elements project (005 research.md R-11, T012; reviews/phase-2/spike.md § 3):
// `axTree(id)` returns the unignored accessibility nodes of the element with that `id` and of its shadow subtree,
// read from Chromium's full tree of this test's frame, and `emulateForcedColors(mode, palette)` switches forced
// colours and the system palette for this page and back. Plain elements stand in for the icons, so these tests pin
// the commands, not the elements. 008 adds (research.md R-14; tasks.md T003): `axTree` also gives a node's description,
// its modal flag and its level where Chromium reports them; `emulateReducedMotion(on)` sets and resets
// `prefers-reduced-motion`, and ending forced colours also ends it; `pointerPath(steps)` moves the real pointer through
// points of this test's frame, pressing and releasing where a step says so. `touchTap` needs a touch context and is
// tested in commands.touch.test.ts.
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

describe("emulateReducedMotion(on)", () => {
  it("makes (prefers-reduced-motion: reduce) match, and false ends it", async () => {
    const before = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateReducedMotion(true);
    const on = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateReducedMotion(false);
    expect({ before, on, off: matchMedia("(prefers-reduced-motion: reduce)").matches }).toEqual({ before: false, on: true, off: false });
  });

  it('emulateForcedColors("none") ends reduced motion too, so the reset helper leaves neither behind', async () => {
    await commands.emulateReducedMotion(true);
    const on = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await commands.emulateForcedColors("none");
    expect({ on, after: matchMedia("(prefers-reduced-motion: reduce)").matches }).toEqual({ on: true, after: false });
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
