import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDriverHelpers, driverAdditionScenarios } from "./scenarios/driver-additions.ts";

// The driver's own methods, in process, each proven against a plain page (009 research.md R-17; T005, T010).
// `viewport()` resizes the test's iframe from the elements project's 1280 × 800 (vitest.config.ts, since 008). Since
// phase 2 (T010) every method the US1 scenarios use: real keys and chords (`chord()`), a real click at a point
// (`clickAt()`) and wheel, the deep active element, the tab walk, `scrollLeft`, the last keydown's `defaultPrevented`,
// reduced motion, the frame record and the two-frame `settle()`, plus `messages()` and `sheets()` (which 005 added; their plants are in reviews/phase-2/plants.md). The pages are plain
// markup and a shadow host defined below; each test observes the page itself, not through the method it proves.
// test/browser/driver.test.ts proves the fixture driver's.
// The driver additions of 013 phase 1 in process (contracts/checks.md § Driver additions; tasks.md T003): the shared
// bodies of scenarios/driver-additions.ts on the in-process driver, with their helper elements defined in this file's
// frame. The same bodies run on the strict-CSP fixture in test/browser/driver.test.ts.
const driver = inProcessDriver();
defineDriverHelpers();

afterEach(async () => {
  await driver.reducedMotion("no-preference").catch(() => undefined);
});

/**
 * A shadow host for the shadow targets: an inner `.inner` button and an inner `.scroll` box with wider content, kept
 * out of the tab order (`tabindex="-1"`, so Chromium does not make the overflowing box a tab stop of its own).
 */
class DriverHost extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(".scroll { inline-size: 200px; overflow-x: auto; } .wide { inline-size: 1000px; block-size: 20px; }");
    root.adoptedStyleSheets = [sheet];
    root.innerHTML = '<button class="inner" type="button">Inner</button><div class="scroll" tabindex="-1"><div class="wide"></div></div>';
  }
}
if (customElements.get("driver-host") === undefined) customElements.define("driver-host", DriverHost);

/** The keydowns the window saw, modifiers left out: key, the four modifier flags and whether the event is trusted. */
function recordKeys(): { key: string; alt: boolean; ctrl: boolean; meta: boolean; shift: boolean; trusted: boolean }[] {
  const seen: { key: string; alt: boolean; ctrl: boolean; meta: boolean; shift: boolean; trusted: boolean }[] = [];
  window.addEventListener("keydown", (event) => {
    if (!["Alt", "Control", "Meta", "Shift"].includes(event.key)) seen.push({ key: event.key, alt: event.altKey, ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey, trusted: event.isTrusted });
  });
  return seen;
}

const plain = { alt: false, ctrl: false, meta: false, shift: false, trusted: true };

describe("the in-process driver", () => {
  it("viewport(width, height) sets the page's innerWidth and innerHeight", async () => {
    await driver.viewport(1280, 800);
    const wide = [window.innerWidth, window.innerHeight];
    await driver.viewport(320, 640);
    expect([wide, [window.innerWidth, window.innerHeight]]).toEqual([
      [1280, 800],
      [320, 640],
    ]);
  });

  it.each([
    { key: "ArrowLeft", seen: { key: "ArrowLeft", ...plain } },
    { key: "ArrowRight", seen: { key: "ArrowRight", ...plain } },
    { key: "Home", seen: { key: "Home", ...plain } },
    { key: "End", seen: { key: "End", ...plain } },
    { key: "Alt+ArrowLeft", seen: { key: "ArrowLeft", ...plain, alt: true } },
    { key: "Ctrl+ArrowRight", seen: { key: "ArrowRight", ...plain, ctrl: true } },
    { key: "Meta+ArrowRight", seen: { key: "ArrowRight", ...plain, meta: true } },
    { key: "Shift+ArrowRight", seen: { key: "ArrowRight", ...plain, shift: true } },
  ])("chord($key) sends one trusted keydown of the key with exactly its modifiers", async ({ key, seen }) => {
    await driver.mount('<button id="a" type="button">A</button>');
    document.getElementById("a")?.focus();
    const keys = recordKeys();
    await driver.chord(key);
    expect(keys).toEqual([seen]);
  });

  it("chord(Tab) and chord(Shift+Tab) move focus with real input, so the focused button matches :focus-visible", async () => {
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    document.getElementById("a")?.focus();
    await driver.chord("Tab");
    const forward = { id: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") };
    await driver.chord("Shift+Tab");
    expect([forward, { id: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }]).toEqual([
      { id: "b", visible: true },
      { id: "a", visible: true },
    ]);
  });

  it("clickAt(target, point) clicks at that point of the box with a trusted event, on a light-DOM and a shadow target, and a clicked button does not match :focus-visible", async () => {
    await driver.mount('<button id="a" type="button">A</button><div id="pad"></div><driver-host id="h"></driver-host>');
    await driver.rules("#pad { inline-size: 100px; block-size: 40px; }");
    const clicks: { target: string; x: number; y: number; trusted: boolean }[] = [];
    document.addEventListener("click", (event) => {
      const target = event.composedPath()[0] as Element;
      const box = target.getBoundingClientRect();
      clicks.push({ target: target.id === "" ? target.className : target.id, x: Math.round(event.clientX - box.left), y: Math.round(event.clientY - box.top), trusted: event.isTrusted });
    });
    await driver.clickAt("pad", { x: 30, y: 10 });
    await driver.clickAt({ id: "h", inner: ".inner" }, { x: 4, y: 4 });
    await driver.clickAt("a", { x: 2, y: 2 });
    expect({ clicks, focused: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }).toEqual({
      clicks: [
        { target: "pad", x: 30, y: 10, trusted: true },
        { target: "inner", x: 4, y: 4, trusted: true },
        { target: "a", x: 2, y: 2, trusted: true },
      ],
      focused: "a",
      visible: false,
    });
  });

  it("wheel(target, deltaX) sends a trusted wheel event over the target that scrolls it deltaX to the right, on a light-DOM and a shadow target", async () => {
    await driver.mount('<div id="box"><div id="wide"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; } #wide { inline-size: 1000px; block-size: 20px; }");
    const wheels: { target: string; deltaX: number; trusted: boolean }[] = [];
    document.addEventListener("wheel", (event) => wheels.push({ target: (event.composedPath()[0] as Element).className || (event.composedPath()[0] as Element).id, deltaX: event.deltaX, trusted: event.isTrusted }));
    await driver.wheel("box", 120);
    await driver.wheel({ id: "h", inner: ".scroll" }, 80);
    expect({ wheels, scrollLeft: [document.getElementById("box")?.scrollLeft, document.getElementById("h")?.shadowRoot?.querySelector(".scroll")?.scrollLeft] }).toEqual({
      wheels: [
        { target: "wide", deltaX: 120, trusted: true },
        { target: "wide", deltaX: 80, trusted: true },
      ],
      scrollLeft: [120, 80],
    });
  });

  it("call(id, name) calls the element's method with no argument, then settles: focus() of a button focuses it, and the call returns after at least two animation frames (009 phase 4)", async () => {
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    let frames = 0;
    const count = (): void => {
      frames += 1;
      requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    await driver.call("b", "focus");
    expect({ active: document.activeElement?.id, settled: frames >= 2 }).toEqual({ active: "b", settled: true });
  });

  it("deepActive() names the deep active element: a shadow node under its host's id, a light-DOM element by id, else body", async () => {
    await driver.mount('<button id="a" type="button">A</button><driver-host id="h"></driver-host><span id="plain"></span>');
    const atRest = await driver.deepActive();
    document.getElementById("a")?.focus();
    const light = await driver.deepActive();
    (document.getElementById("h")?.shadowRoot?.querySelector(".inner") as HTMLElement | null)?.focus();
    expect([atRest, light, await driver.deepActive()]).toEqual(["body", "a", "h >> button.inner"]);
  });

  it("tabWalk(from, to) lists the deep active element after each Tab from `from` to `to`, and with `backward` after each Shift+Tab", async () => {
    await driver.mount('<button id="before" type="button">0</button><button id="b1" type="button">1</button><driver-host id="h"></driver-host><button id="after" type="button">2</button>');
    const forward = await driver.tabWalk("before", "after");
    expect([forward, await driver.tabWalk("after", "before", true)]).toEqual([
      ["b1", "h >> button.inner", "after"],
      ["h >> button.inner", "b1", "before"],
    ]);
  });

  it("focus(target) focuses a light-DOM and a shadow target by script, matching :focus-visible after keyboard input and not after a pointer click", async () => {
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button><driver-host id="h"></driver-host>');
    document.getElementById("a")?.focus();
    await driver.chord("Tab");
    await driver.focus({ id: "h", inner: ".inner" });
    const afterKeys = { active: await driver.deepActive(), visible: document.getElementById("h")?.shadowRoot?.activeElement?.matches(":focus-visible") };
    await driver.clickAt("a", { x: 2, y: 2 });
    await driver.focus("b");
    expect([afterKeys, { active: await driver.deepActive(), visible: document.activeElement?.matches(":focus-visible") }]).toEqual([
      { active: "h >> button.inner", visible: true },
      { active: "b", visible: false },
    ]);
  });

  it("scrollLeft(target) reads and setScrollLeft(target, value) writes an instant scroll, on a light-DOM box with smooth scroll-behavior and on a shadow box", async () => {
    await driver.mount('<div id="box"><div id="wide"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; scroll-behavior: smooth; } #wide { inline-size: 1000px; block-size: 20px; }");
    const before = [await driver.scrollLeft("box"), await driver.scrollLeft({ id: "h", inner: ".scroll" })];
    const at: number[] = [];
    document.getElementById("box")?.addEventListener("scroll", () => at.push(document.getElementById("box")?.scrollLeft ?? -1));
    await driver.setScrollLeft("box", 120);
    await driver.setScrollLeft({ id: "h", inner: ".scroll" }, 300);
    expect({
      before,
      after: [await driver.scrollLeft("box"), await driver.scrollLeft({ id: "h", inner: ".scroll" })],
      inner: document.getElementById("h")?.shadowRoot?.querySelector(".scroll")?.scrollLeft,
      scrolls: at,
    }).toEqual({ before: [0, 0], after: [120, 300], inner: 300, scrolls: [120] });
  });

  // 019 T079: the block-axis readers of the overflow-region module's block-axis option, as scrollLeft and setScrollLeft.
  it("scrollTop(target) reads and setScrollTop(target, value) writes an instant scroll, on a light-DOM box with smooth scroll-behavior and on a shadow box", async () => {
    await driver.mount('<div id="box"><div id="tall"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { block-size: 100px; overflow-y: auto; scroll-behavior: smooth; } #tall { inline-size: 20px; block-size: 1000px; }");
    const before = [await driver.scrollTop("box"), await driver.scrollTop({ id: "h", inner: ".scroll" })];
    const at: number[] = [];
    document.getElementById("box")?.addEventListener("scroll", () => at.push(document.getElementById("box")?.scrollTop ?? -1));
    await driver.setScrollTop("box", 120);
    expect({ before, after: await driver.scrollTop("box"), scrolls: at, left: document.getElementById("box")?.scrollLeft }).toEqual({ before: [0, 0], after: 120, scrolls: [120], left: 0 });
  });

  it("lastKeyPrevented() is false after mount, true after a key the page prevents and false after one it does not", async () => {
    await driver.mount('<button id="a" type="button">A</button>');
    const button = document.getElementById("a");
    button?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") event.preventDefault();
    });
    button?.focus();
    const atMount = await driver.lastKeyPrevented();
    await driver.chord("ArrowRight");
    const prevented = await driver.lastKeyPrevented();
    await driver.chord("ArrowLeft");
    expect([atMount, prevented, await driver.lastKeyPrevented()]).toEqual([false, true, false]);
  });

  it("reducedMotion(mode) switches prefers-reduced-motion between reduce and no-preference", async () => {
    await driver.mount("<p>motion</p>");
    await driver.reducedMotion("reduce");
    const on = [matchMedia("(prefers-reduced-motion: reduce)").matches, matchMedia("(prefers-reduced-motion: no-preference)").matches];
    await driver.reducedMotion("no-preference");
    expect([on, [matchMedia("(prefers-reduced-motion: reduce)").matches, matchMedia("(prefers-reduced-motion: no-preference)").matches]]).toEqual([
      [true, false],
      [false, true],
    ]);
  });

  it("frameRecord(target, read) records the reading at the start, each keydown and the reading in every frame after, until stop()", async () => {
    await driver.mount('<div id="box" tabindex="0"><div id="wide"></div></div>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; } #wide { inline-size: 1000px; block-size: 20px; }");
    const box = document.querySelector<HTMLElement>("#box") ?? document.body;
    box.addEventListener("keydown", (event) => {
      event.preventDefault();
      box.scrollLeft += 40;
    });
    box.focus();
    const recorder = await driver.frameRecord("box", { property: "scrollLeft" });
    await driver.chord("ArrowRight");
    const record = await recorder.stop();
    const frames = record.filter((each) => !each.startsWith("resize: "));
    const key = frames.indexOf("keydown");
    expect({ first: record[0], keys: frames.filter((each) => each === "keydown").length, before: [...new Set(frames.slice(0, key))], after: [...new Set(frames.slice(key + 1))], frames: frames.length - key - 1 >= 2, resizes: record.filter((each) => each.startsWith("resize: ")) }).toEqual({
      first: "0",
      keys: 1,
      before: ["0"],
      after: ["40"],
      frames: true,
      resizes: ["resize: 0"],
    });
  });

  it('frameRecord(target, read) reads computed styles and attributes, and records "resize: <reading>" in each callback of its ResizeObserver on the target', async () => {
    await driver.mount('<div id="box"></div>');
    await driver.rules("#box { inline-size: 200px; block-size: 10px; }");
    const width = await driver.frameRecord("box", { computed: "inline-size" });
    const attribute = await driver.frameRecord("box", { attribute: "data-state" });
    await driver.style("box", "inline-size", "120px");
    await driver.setAttribute("box", "data-state", "on");
    const [widths, states] = [await width.stop(), await attribute.stop()];
    expect({ widths: [widths[0], widths.at(-1)], states: [states[0], states.at(-1)], resizes: widths.filter((each) => each.startsWith("resize: ")) }).toEqual({ widths: ["200px", "120px"], states: ["null", "on"], resizes: ["resize: 200px", "resize: 120px"] });
  });

  it("frameRecord(target, read) with `of` reads another element, and its ResizeObserver runs after one the page registered before, in the same delivery", async () => {
    await driver.mount('<div id="box"></div><p id="note"></p>');
    await driver.rules("#box { inline-size: 200px; block-size: 10px; }");
    const box = document.getElementById("box");
    const note = document.getElementById("note");
    new ResizeObserver(([entry]) => note?.setAttribute("data-width", String(entry?.contentRect.width))).observe(box as Element);
    await driver.settle();
    const recorder = await driver.frameRecord("box", { attribute: "data-width", of: "note" });
    await driver.style("box", "inline-size", "120px");
    expect((await recorder.stop()).filter((each) => each.startsWith("resize: "))).toEqual(["resize: 200", "resize: 120"]);
  });

  it("computed(target, property) reads the computed style of a light-DOM and of a shadow target", async () => {
    await driver.mount('<div id="box"></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 150px; }");
    expect([await driver.computed("box", "inline-size"), await driver.computed({ id: "h", inner: ".scroll" }, "inline-size"), await driver.computed({ id: "h", inner: ".scroll" }, "overflow-x")]).toEqual(["150px", "200px", "auto"]);
  });

  it("settle() waits at least two animation frames, then for every ocelle-* element to render", async () => {
    await driver.mount('<ocelle-icon id="i"></ocelle-icon>');
    let frames = 0;
    const count = (): void => {
      frames += 1;
      requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    (document.getElementById("i") as unknown as { name: string }).name = "close";
    await driver.settle();
    expect({ frames: frames >= 2, drawn: (document.getElementById("i")?.shadowRoot?.querySelector("svg")?.children.length ?? 0) > 0 }).toEqual({ frames: true, drawn: true });
  });

  it("messages() lists the console messages since the last mount, and a mount starts a new list", async () => {
    await driver.mount("<p>one</p>");
    console.warn("before the mount");
    await driver.mount("<p>two</p>");
    console.warn("driver message");
    expect(await driver.messages()).toEqual(["console.warn: driver message"]);
  });

  it("sheets(selector) counts the adopted sheets per shadow root, the distinct sheets and the <style> elements", async () => {
    await driver.mount('<ocelle-icon name="close"></ocelle-icon><ocelle-icon name="menu"></ocelle-icon><driver-host></driver-host>');
    expect([await driver.sheets("ocelle-icon"), await driver.sheets("driver-host, ocelle-icon")]).toEqual([
      { elements: 2, perRoot: [1], distinct: 1, styleElements: 0 },
      { elements: 3, perRoot: [1], distinct: 2, styleElements: 0 },
    ]);
  });
});

describe("the driver additions, in process (013 T003)", () => {
  it.each(driverAdditionScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
