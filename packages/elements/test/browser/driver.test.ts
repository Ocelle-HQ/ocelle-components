import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineDriverHelpers, driverAdditionScenarios } from "../scenarios/driver-additions.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served, Visit } from "./serve.ts";

// The fixture driver's own methods, each proven against a plain page (009 research.md R-17; T005, T010): `viewport()`
// resizes the fixture page from the 1280 × 800 it opens at. Since phase 2 (T010) every method the US1 scenarios use,
// as test/driver.test.ts proves them in process: real keys and chords through Playwright's keyboard, a real click and
// wheel through its mouse, the deep active element, the tab walk, `scrollLeft`, the last keydown's `defaultPrevented`,
// reduced motion, the frame record and the two-frame `settle()`, plus `messages()` and `sheets()` (005's; their
// plants are in reviews/phase-2/plants.md). The pages are frames.html (no script) and icon.html (the browser build);
// the shadow host is defined through the protocol with a constructed sheet, so the page's CSP sees no inline style.
// Every test also asserts the page's recorders clean: no CSP violation, no request outside the allowed list, no
// failed request and no console message or uncaught error.
//
// The driver additions of 013 phase 1 on the strict-CSP fixture (contracts/checks.md § Driver additions; tasks.md
// T003): every shared body of scenarios/driver-additions.ts on its own `facts.html` page, its helper elements defined
// through `page.evaluate` (the DevTools protocol, which the page's CSP does not govern), with zero CSP violations, no
// request outside the allowed list, no failed request and no console message, as every fixture test asserts.
const built = inject("elementsFixture");
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

/** Opens a plain fixture page: frames.html, or icon.html with the browser build. */
async function open(page = "frames.html"): Promise<Visit> {
  const { browser, origin } = started();
  return visit(browser, origin, page, page === "frames.html" ? [] : ["ocelle-elements.js"]);
}

/** Defines the shadow host of the shadow targets (an inner `.inner` button and an inner `.scroll` box) on the page. */
async function defineHost(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (customElements.get("driver-host") !== undefined) return;
    customElements.define(
      "driver-host",
      class extends HTMLElement {
        constructor() {
          super();
          const root = this.attachShadow({ mode: "open" });
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(".scroll { inline-size: 200px; overflow-x: auto; } .wide { inline-size: 1000px; block-size: 20px; }");
          root.adoptedStyleSheets = [sheet];
          root.innerHTML = '<button class="inner" type="button">Inner</button><div class="scroll" tabindex="-1"><div class="wide"></div></div>';
        }
      },
    );
  });
}

const plain = { alt: false, ctrl: false, meta: false, shift: false, trusted: true };

describe("the fixture driver", { timeout: 60_000 }, () => {
  it("viewport(width, height) sets the page's innerWidth and innerHeight", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    const size = (): Promise<number[]> => page.page.evaluate(() => [window.innerWidth, window.innerHeight]);
    await driver.viewport(320, 640);
    const narrow = await size();
    await driver.viewport(1000, 700);
    const wide = await size();
    expect({ observed: [narrow, wide], recorded: await page.finish() }).toEqual({
      observed: [
        [320, 640],
        [1000, 700],
      ],
      recorded: clean,
    });
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
  ])("press($key) sends one trusted keydown of the key with exactly its modifiers", async ({ key, seen }) => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<button id="a" type="button">A</button>');
    await page.page.evaluate(() => {
      const seen: unknown[] = [];
      (window as unknown as { seen: unknown[] }).seen = seen;
      document.getElementById("a")?.focus();
      window.addEventListener("keydown", (event) => {
        if (!["Alt", "Control", "Meta", "Shift"].includes(event.key)) seen.push({ key: event.key, alt: event.altKey, ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey, trusted: event.isTrusted });
      });
    });
    await driver.press(key);
    const keys = await page.page.evaluate(() => (window as unknown as { seen: unknown[] }).seen);
    expect({ keys, recorded: await page.finish() }).toEqual({ keys: [seen], recorded: clean });
  });

  it("press(Tab) and press(Shift+Tab) move focus with real input, so the focused button matches :focus-visible", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    const focused = (): Promise<unknown> => page.page.evaluate(() => ({ id: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }));
    await page.page.evaluate(() => document.getElementById("a")?.focus());
    await driver.press("Tab");
    const forward = await focused();
    await driver.press("Shift+Tab");
    expect({ observed: [forward, await focused()], recorded: await page.finish() }).toEqual({
      observed: [
        { id: "b", visible: true },
        { id: "a", visible: true },
      ],
      recorded: clean,
    });
  });

  it("click(target, point) clicks at that point of the box with a trusted event, on a light-DOM and a shadow target, and a clicked button does not match :focus-visible", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<button id="a" type="button">A</button><div id="pad"></div><driver-host id="h"></driver-host>');
    await driver.rules("#pad { inline-size: 100px; block-size: 40px; }");
    await page.page.evaluate(() => {
      const clicks: unknown[] = [];
      (window as unknown as { clicks: unknown[] }).clicks = clicks;
      document.addEventListener("click", (event) => {
        const target = event.composedPath()[0] as Element;
        const box = target.getBoundingClientRect();
        clicks.push({ target: target.id === "" ? target.className : target.id, x: Math.round(event.clientX - box.left), y: Math.round(event.clientY - box.top), trusted: event.isTrusted });
      });
    });
    await driver.click("pad", { x: 30, y: 10 });
    await driver.click({ id: "h", inner: ".inner" }, { x: 4, y: 4 });
    await driver.click("a", { x: 2, y: 2 });
    const observed = await page.page.evaluate(() => ({ clicks: (window as unknown as { clicks: unknown[] }).clicks, focused: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }));
    expect({ observed, recorded: await page.finish() }).toEqual({
      observed: {
        clicks: [
          { target: "pad", x: 30, y: 10, trusted: true },
          { target: "inner", x: 4, y: 4, trusted: true },
          { target: "a", x: 2, y: 2, trusted: true },
        ],
        focused: "a",
        visible: false,
      },
      recorded: clean,
    });
  });

  it("wheel(target, deltaX) sends a trusted wheel event over the target that scrolls it deltaX to the right, on a light-DOM and a shadow target", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<div id="box"><div id="wide"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; } #wide { inline-size: 1000px; block-size: 20px; }");
    await page.page.evaluate(() => {
      const wheels: unknown[] = [];
      (window as unknown as { wheels: unknown[] }).wheels = wheels;
      document.addEventListener("wheel", (event) => {
        const target = event.composedPath()[0] as Element;
        wheels.push({ target: target.className === "" ? target.id : target.className, deltaX: event.deltaX, trusted: event.isTrusted });
      });
    });
    await driver.wheel("box", 120);
    await driver.wheel({ id: "h", inner: ".scroll" }, 80);
    const observed = await page.page.evaluate(() => ({
      wheels: (window as unknown as { wheels: unknown[] }).wheels,
      scrollLeft: [document.getElementById("box")?.scrollLeft, document.getElementById("h")?.shadowRoot?.querySelector(".scroll")?.scrollLeft],
    }));
    expect({ observed, recorded: await page.finish() }).toEqual({
      observed: {
        wheels: [
          { target: "wide", deltaX: 120, trusted: true },
          { target: "wide", deltaX: 80, trusted: true },
        ],
        scrollLeft: [120, 80],
      },
      recorded: clean,
    });
  });

  it("call(id, name) calls the element's method with no argument, then settles: focus() of a button focuses it, and the call returns after at least two animation frames (009 phase 4)", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    await page.page.evaluate(() => {
      const counted = window as unknown as { ocelleFrames: number };
      counted.ocelleFrames = 0;
      const count = (): void => {
        counted.ocelleFrames += 1;
        requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
    });
    await driver.call("b", "focus");
    const observed = await page.page.evaluate(() => ({ active: document.activeElement?.id, settled: (window as unknown as { ocelleFrames: number }).ocelleFrames >= 2 }));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { active: "b", settled: true }, recorded: clean });
  });

  it("activeElement() names the deep active element: a shadow node under its host's id, a light-DOM element by id, else body", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<button id="a" type="button">A</button><driver-host id="h"></driver-host>');
    const atRest = await driver.activeElement();
    await page.page.evaluate(() => document.getElementById("a")?.focus());
    const light = await driver.activeElement();
    await page.page.evaluate(() => (document.getElementById("h")?.shadowRoot?.querySelector(".inner") as HTMLElement | null)?.focus());
    expect({ observed: [atRest, light, await driver.activeElement()], recorded: await page.finish() }).toEqual({ observed: ["body", "a", "h >> button.inner"], recorded: clean });
  });

  it("tabWalk(from, to) lists the deep active element after each Tab from `from` to `to`, and with `backward` after each Shift+Tab", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<button id="before" type="button">0</button><button id="b1" type="button">1</button><driver-host id="h"></driver-host><button id="after" type="button">2</button>');
    const forward = await driver.tabWalk("before", "after");
    const backward = await driver.tabWalk("after", "before", true);
    expect({ observed: [forward, backward], recorded: await page.finish() }).toEqual({
      observed: [
        ["b1", "h >> button.inner", "after"],
        ["h >> button.inner", "b1", "before"],
      ],
      recorded: clean,
    });
  });

  it("focus(target) focuses a light-DOM and a shadow target by script, matching :focus-visible after keyboard input and not after a pointer click", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button><driver-host id="h"></driver-host>');
    await page.page.evaluate(() => document.getElementById("a")?.focus());
    await driver.press("Tab");
    await driver.focus({ id: "h", inner: ".inner" });
    const afterKeys = { active: await driver.activeElement(), visible: await page.page.evaluate(() => document.getElementById("h")?.shadowRoot?.activeElement?.matches(":focus-visible")) };
    await driver.click("a", { x: 2, y: 2 });
    await driver.focus("b");
    const afterClick = { active: await driver.activeElement(), visible: await page.page.evaluate(() => document.activeElement?.matches(":focus-visible")) };
    expect({ observed: [afterKeys, afterClick], recorded: await page.finish() }).toEqual({
      observed: [
        { active: "h >> button.inner", visible: true },
        { active: "b", visible: false },
      ],
      recorded: clean,
    });
  });

  it("scrollLeft(target) reads and setScrollLeft(target, value) writes an instant scroll, on a light-DOM box with smooth scroll-behavior and on a shadow box", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<div id="box"><div id="wide"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; scroll-behavior: smooth; } #wide { inline-size: 1000px; block-size: 20px; }");
    const before = [await driver.scrollLeft("box"), await driver.scrollLeft({ id: "h", inner: ".scroll" })];
    await page.page.evaluate(() => {
      const at: number[] = [];
      (window as unknown as { at: number[] }).at = at;
      const box = document.getElementById("box");
      box?.addEventListener("scroll", () => at.push(box.scrollLeft));
    });
    await driver.setScrollLeft("box", 120);
    await driver.setScrollLeft({ id: "h", inner: ".scroll" }, 300);
    const observed = {
      before,
      after: [await driver.scrollLeft("box"), await driver.scrollLeft({ id: "h", inner: ".scroll" })],
      inner: await page.page.evaluate(() => document.getElementById("h")?.shadowRoot?.querySelector(".scroll")?.scrollLeft),
      scrolls: await page.page.evaluate(() => (window as unknown as { at: number[] }).at),
    };
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { before: [0, 0], after: [120, 300], inner: 300, scrolls: [120] }, recorded: clean });
  });

  it("lastKeyPrevented() is false after mount, true after a key the page prevents and false after one it does not", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<button id="a" type="button">A</button>');
    await page.page.evaluate(() => {
      const button = document.getElementById("a");
      button?.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") event.preventDefault();
      });
      button?.focus();
    });
    const atMount = await driver.lastKeyPrevented();
    await driver.press("ArrowRight");
    const prevented = await driver.lastKeyPrevented();
    await driver.press("ArrowLeft");
    expect({ observed: [atMount, prevented, await driver.lastKeyPrevented()], recorded: await page.finish() }).toEqual({ observed: [false, true, false], recorded: clean });
  });

  it("reducedMotion(mode) switches prefers-reduced-motion between reduce and no-preference", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount("<p>motion</p>");
    const matches = (): Promise<boolean[]> => page.page.evaluate(() => [matchMedia("(prefers-reduced-motion: reduce)").matches, matchMedia("(prefers-reduced-motion: no-preference)").matches]);
    await driver.reducedMotion("reduce");
    const on = await matches();
    await driver.reducedMotion("no-preference");
    expect({ observed: [on, await matches()], recorded: await page.finish() }).toEqual({
      observed: [
        [true, false],
        [false, true],
      ],
      recorded: clean,
    });
  });

  it("frameRecord(target, read) records the reading at the start, each keydown and the reading in every frame after, until stop()", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<div id="box" tabindex="0"><div id="wide"></div></div>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; } #wide { inline-size: 1000px; block-size: 20px; }");
    await page.page.evaluate(() => {
      const box = document.getElementById("box");
      box?.addEventListener("keydown", (event) => {
        event.preventDefault();
        box.scrollLeft += 40;
      });
      box?.focus();
    });
    const recorder = await driver.frameRecord("box", { property: "scrollLeft" });
    await driver.press("ArrowRight");
    const record = await recorder.stop();
    const frames = record.filter((each) => !each.startsWith("resize: "));
    const key = frames.indexOf("keydown");
    const observed = { first: record[0], keys: frames.filter((each) => each === "keydown").length, before: [...new Set(frames.slice(0, key))], after: [...new Set(frames.slice(key + 1))], frames: frames.length - key - 1 >= 2, resizes: record.filter((each) => each.startsWith("resize: ")) };
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { first: "0", keys: 1, before: ["0"], after: ["40"], frames: true, resizes: ["resize: 0"] }, recorded: clean });
  });

  it('frameRecord(target, read) reads computed styles and attributes, and records "resize: <reading>" in each callback of its ResizeObserver on the target', async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<div id="box"></div>');
    await driver.rules("#box { inline-size: 200px; block-size: 10px; }");
    const width = await driver.frameRecord("box", { computed: "inline-size" });
    const attribute = await driver.frameRecord("box", { attribute: "data-state" });
    await driver.style("box", "inline-size", "120px");
    await driver.setAttribute("box", "data-state", "on");
    const [widths, states] = [await width.stop(), await attribute.stop()];
    const observed = { widths: [widths[0], widths.at(-1)], states: [states[0], states.at(-1)], resizes: widths.filter((each) => each.startsWith("resize: ")) };
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { widths: ["200px", "120px"], states: ["null", "on"], resizes: ["resize: 200px", "resize: 120px"] }, recorded: clean });
  });

  it("frameRecord(target, read) with `of` reads another element, and its ResizeObserver runs after one the page registered before, in the same delivery", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<div id="box"></div><p id="note"></p>');
    await driver.rules("#box { inline-size: 200px; block-size: 10px; }");
    await page.page.evaluate(() => {
      const note = document.getElementById("note");
      new ResizeObserver(([entry]) => note?.setAttribute("data-width", String(entry?.contentRect.width))).observe(document.getElementById("box") as Element);
    });
    await driver.settle();
    const recorder = await driver.frameRecord("box", { attribute: "data-width", of: "note" });
    await driver.style("box", "inline-size", "120px");
    const resizes = (await recorder.stop()).filter((each) => each.startsWith("resize: "));
    expect({ resizes, recorded: await page.finish() }).toEqual({ resizes: ["resize: 200", "resize: 120"], recorded: clean });
  });

  it("computed(target, property) reads the computed style of a light-DOM and of a shadow target", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<div id="box"></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 150px; }");
    const observed = [await driver.computed("box", "inline-size"), await driver.computed({ id: "h", inner: ".scroll" }, "inline-size"), await driver.computed({ id: "h", inner: ".scroll" }, "overflow-x")];
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: ["150px", "200px", "auto"], recorded: clean });
  });

  it("settle() waits at least two animation frames, then for every ocelle-* element to render", async () => {
    const page = await open("icon.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<ocelle-icon id="i"></ocelle-icon>');
    await page.page.evaluate(() => {
      const state = window as unknown as { frames: number };
      state.frames = 0;
      const count = (): void => {
        state.frames += 1;
        requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
      (document.getElementById("i") as unknown as { name: string }).name = "close";
    });
    const before = await page.page.evaluate(() => (window as unknown as { frames: number }).frames);
    await driver.settle();
    const observed = await page.page.evaluate((before) => ({ frames: (window as unknown as { frames: number }).frames - before >= 2, drawn: (document.getElementById("i")?.shadowRoot?.querySelector("svg")?.children.length ?? 0) > 0 }), before);
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { frames: true, drawn: true }, recorded: clean });
  });

  it("messages() lists the console messages since the last mount, and a mount starts a new list", async () => {
    const page = await open();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount("<p>one</p>");
    await page.page.evaluate(() => {
      console.warn("before the mount");
    });
    await driver.mount("<p>two</p>");
    await page.page.evaluate(() => {
      console.warn("driver message");
    });
    await page.page.waitForTimeout(100);
    const messages = await driver.messages();
    const recorded = await page.finish();
    expect({ messages, console: recorded.console }).toEqual({ messages: ["console.warning: driver message"], console: ["console.warning: before the mount", "console.warning: driver message"] });
  });

  it("sheets(selector) counts the adopted sheets per shadow root, the distinct sheets and the <style> elements", async () => {
    const page = await open("icon.html");
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<ocelle-icon name="close"></ocelle-icon><ocelle-icon name="menu"></ocelle-icon><driver-host></driver-host>');
    const observed = [await driver.sheets("ocelle-icon"), await driver.sheets("driver-host, ocelle-icon")];
    expect({ observed, recorded: await page.finish() }).toEqual({
      observed: [
        { elements: 2, perRoot: [1], distinct: 1, styleElements: 0 },
        { elements: 3, perRoot: [1], distinct: 2, styleElements: 0 },
      ],
      recorded: clean,
    });
  });
});

describe("the driver additions on the strict-CSP fixture (013 T003)", { timeout: 60_000 }, () => {
  it.each(driverAdditionScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "facts.html");
    await page.page.evaluate(defineDriverHelpers);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
