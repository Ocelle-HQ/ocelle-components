import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineDriverHelpers, driverAdditionScenarios } from "../scenarios/driver-additions.ts";
import type { InsertHow } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served, Visit } from "./serve.ts";

// The driver steps on the strict-CSP fixture pages (specs/010-feedback-forms T001b; contracts/testing.md § Driver
// steps, § Forms): the shared steps of test/driver.test.ts over a page's CDP session and Playwright's input, the
// submission as the request body the fixture server received, `insertInteractive` from a DOMContentLoaded handler of
// a fixture page under `startDocument`, and the fixture-only `navigateAwayAndBack` on a `Cache-Control: no-store`
// route. The test-only elements are those of fixtures/live-regions.js. Every test also asserts zero CSP violations,
// only allowed requests, no failed request and no console message.
//
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
const scripts = ["ocelle-elements.js", "live-regions.js", "submit"];
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

async function open(page = "live.html", allowed: readonly string[] = scripts): Promise<{ readonly visit: Visit; readonly driver: ReturnType<typeof fixtureDriver> }> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const opened = await visit(browser, served.origin, page, allowed);
  return { visit: opened, driver: fixtureDriver(opened.page, opened.log, false, served) };
}

/**
 * Marks each later `evaluate` call of the page in the page: `"start"` when the call's function starts and `"end"`
 * when it has finished, pushed onto `globalThis.ocelleMarks` once a test has set it; at the first start a rendering
 * update is asked for that pushes `"step frame"`. The marks are added through the function's source, which Playwright
 * sends over the DevTools protocol like any `evaluate` (as test/live.ts `runInTasks` does), so the strict CSP sees no
 * script of its own. Returns the page's `evaluate` as it was, unmarked, for the test's own reads.
 */
function marked(page: Page): Page["evaluate"] {
  const evaluate = page.evaluate.bind(page) as (fn: unknown, arg?: unknown) => Promise<unknown>;
  (page as unknown as { evaluate: (fn: unknown, arg?: unknown) => Promise<unknown> }).evaluate = (fn, arg) => {
    if (typeof fn !== "function") return evaluate(fn, arg);
    const source = `async (arg) => {
      const marks = globalThis.ocelleMarks;
      if (marks !== undefined && !marks.includes("start")) requestAnimationFrame(() => marks.push("step frame"));
      marks?.push("start");
      try {
        return await (${String(fn)})(arg);
      } finally {
        marks?.push("end");
      }
    }`;
    const wrapped = (): void => undefined;
    wrapped.toString = () => source;
    return evaluate(wrapped, arg);
  };
  return evaluate as Page["evaluate"];
}

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

/** Opens a plain fixture page (009's `open`, named `openPlain` beside 010's `open` at the landing's second merge): frames.html, or icon.html with the browser build. */
async function openPlain(page = "frames.html"): Promise<Visit> {
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

describe("the driver steps on the strict-CSP fixture pages", { timeout: 60_000 }, () => {
  const markup = '<ocelle-test-probe id="p" data-x="1"><span>child</span> text</ocelle-test-probe>';
  it.each([
    ["innerHTML", true],
    ["template", true],
    ["domparser", true],
    ["createElement", false],
  ] as const)("insert with %s puts the markup into the container, the element constructed connected: %s", async (how: InsertHow, connected) => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"></main>');
    await driver.insert("c", markup, how);
    const seen = await page.page.evaluate(() => {
      const probe: (HTMLElement & { constructedConnected?: boolean }) | null = document.getElementById("p");
      return { html: document.getElementById("c")?.innerHTML, upgraded: probe?.matches(":defined"), connected: probe?.constructedConnected, document: probe?.ownerDocument === document };
    });
    expect({ seen, recorded: await page.finish() }).toEqual({ seen: { html: markup, upgraded: true, connected, document: true }, recorded: clean });
  });

  // The page records when the step's own page work started and ended (`marked`), so the assertion is on the page's
  // order at the step's return, not on a later read: two CDP round trips leave the page time to run the message and the
  // frame whatever the step did (review phase-1 round-1 R1-01). A rendering update is asked for when the step's page
  // work starts, so the step must also span a rendering update of its own, posted after the previous step (contract).
  it("laterTask() returns after a message posted before it and a rendering update of its own", async () => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, "live.html", scripts);
    const evaluate = marked(page.page);
    const driver = fixtureDriver(page.page, page.log, false, served);
    await driver.mount('<main id="c"><span id="s"></span></main>');
    await evaluate(() => {
      const marks: string[] = [];
      const channel = new MessageChannel();
      channel.port1.onmessage = () => marks.push("message");
      document.getElementById("s")?.remove();
      channel.port2.postMessage(0);
      requestAnimationFrame(() => marks.push("frame"));
      (globalThis as unknown as { ocelleMarks: string[] }).ocelleMarks = marks;
    });
    await driver.laterTask();
    const marks = await evaluate(() => [...(globalThis as unknown as { ocelleMarks: string[] }).ocelleMarks]);
    const end = marks.lastIndexOf("end");
    expect({
      before: end < 0 ? null : marks.slice(0, end).filter((mark) => mark !== "start" && mark !== "end").sort(),
      returned: end < 0 ? null : marks.slice(end),
      recorded: await page.finish(),
    }).toEqual({ before: ["frame", "message", "step frame"], returned: ["end"], recorded: clean });
  });

  it("insertInteractive(containerId, markup) inserts from a DOMContentLoaded handler under startDocument, the element defined by the browser build", async () => {
    const { visit: page, driver } = await open("live.html", [...scripts, "interactive.html", "interactive.js"]);
    const at = await driver.insertInteractive("c", '<ocelle-icon id="i" name="chevron-down" label="Open"></ocelle-icon>');
    const seen = await page.page.evaluate(() => ({ inserted: (globalThis as unknown as { ocelleInserted?: unknown }).ocelleInserted, now: performance.now() }));
    const snapshots = await driver.liveCapture.stop();
    expect({ inserted: seen.inserted, before: at <= seen.now, hosts: { first: snapshots[0]?.hosts ?? null, final: snapshots.at(-1)?.hosts.map(({ host }) => host) ?? null } }).toEqual({
      inserted: { readyState: "interactive", defined: true, tags: ["ocelle-icon"], at, upgraded: true },
      before: true,
      hosts: { first: [], final: ["i"] },
    });
    expect(await page.finish()).toEqual(clean);
  });

  it("after(ms) returns no earlier than ms after the previous step's end, with the gap measured in the page", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"></main>');
    const before = await page.page.evaluate(() => performance.now());
    const gap = await driver.after(100);
    const after = await page.page.evaluate(() => performance.now());
    expect({ atLeast: gap >= 100, matches: Math.abs(after - before - gap) < 30, recorded: await page.finish() }).toEqual({ atLeast: true, matches: true, recorded: clean });
  });

  it("the H in force is the shipped hold, 5000 ms (specs/010-feedback-forms phase 2)", async () => {
    const { visit: page, driver } = await open();
    expect({ H: driver.H, recorded: await page.finish() }).toEqual({ H: 5000, recorded: clean });
  });

  it("the W in force is Chromium's: 300 ms loaded, 700 ms loading", async () => {
    const { visit: page, driver } = await open();
    expect({ W: driver.W, recorded: await page.finish() }).toEqual({ W: { loaded: 300, loading: 700 }, recorded: clean });
  });

  it("hostRole(id) reads the role of a host in the final snapshot of the last capture", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"><ocelle-test-alert id="a" role="alert">Alert</ocelle-test-alert><ocelle-test-alert id="s" role="status">Status</ocelle-test-alert></main>');
    await driver.liveCapture.start("c");
    await driver.setAttribute("a", "data-changed", "");
    await driver.liveCapture.stop();
    expect({ roles: [await driver.hostRole("a"), await driver.hostRole("s")], recorded: await page.finish() }).toEqual({ roles: ["alert", "status"], recorded: clean });
  });

  // The phase 2 steps (specs/010-feedback-forms T011), as test/driver.test.ts tests them in process.
  it("batch(operations) runs every operation in order in one task: one MutationObserver delivery holds all their records", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"><span id="s">old</span><input id="i"><div id="from"><b id="m">moved</b></div><div id="to"></div><i id="r">gone</i></main>');
    await page.page.evaluate(() => {
      const deliveries: number[] = [];
      const container = document.getElementById("c");
      if (container === null) throw new Error("no #c on the page");
      new MutationObserver((records) => deliveries.push(records.length)).observe(container, { childList: true, characterData: true, attributes: true, subtree: true });
      (globalThis as unknown as { ocelleDeliveries: number[] }).ocelleDeliveries = deliveries;
    });
    await driver.batch([
      { op: "insert", container: "c", markup: '<p id="new">fresh</p>' },
      { op: "text", id: "s", text: "new" },
      { op: "attribute", id: "s", name: "data-x", value: "1" },
      { op: "property", id: "i", name: "value", value: "typed" },
      { op: "move", id: "m", to: "to" },
      { op: "remove", id: "r" },
      { op: "focus", id: "i" },
    ]);
    const seen = await page.page.evaluate(() => ({
      deliveries: [...(globalThis as unknown as { ocelleDeliveries: number[] }).ocelleDeliveries],
      inserted: document.getElementById("new")?.textContent ?? null,
      text: document.getElementById("s")?.textContent ?? null,
      attribute: document.getElementById("s")?.getAttribute("data-x") ?? null,
      value: (document.getElementById("i") as HTMLInputElement).value,
      moved: document.getElementById("m")?.parentElement?.id ?? null,
      removed: document.getElementById("r") === null,
      focused: document.activeElement?.id ?? null,
    }));
    expect({ seen, recorded: await page.finish() }).toEqual({
      seen: { deliveries: [6], inserted: "fresh", text: "new", attribute: "1", value: "typed", moved: "to", removed: true, focused: "i" },
      recorded: clean,
    });
  });

  it("property(id, name) reads a property as the page has it", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<input id="i" value="x" type="checkbox" checked>');
    expect({ read: [await driver.property("i", "value"), await driver.property("i", "checked"), await driver.property("i", "tabIndex")], recorded: await page.finish() }).toEqual({ read: ["x", true, 0], recorded: clean });
  });

  it("computedIn(id, inner, property) reads a computed value in the element's shadow root, and \"\" without the element", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<ocelle-test-region id="r"></ocelle-test-region>');
    expect({ read: [await driver.computedIn("r", "div", "display"), await driver.computedIn("r", "p", "display")], recorded: await page.finish() }).toEqual({ read: ["block", ""], recorded: clean });
  });

  it("contentBox(id, inner) is the shadow element's border box less its borders and padding", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<ocelle-test-field id="f"></ocelle-test-field>');
    const box = await driver.box("f", "input");
    const px = await page.page.evaluate(() => {
      const input = document.getElementById("f")?.shadowRoot?.querySelector("input");
      const style = input === null || input === undefined ? null : getComputedStyle(input);
      const read = (property: string): number => Number.parseFloat(style?.getPropertyValue(property) ?? "0");
      return { left: read("border-left-width") + read("padding-left"), right: read("border-right-width") + read("padding-right"), top: read("border-top-width") + read("padding-top"), bottom: read("border-bottom-width") + read("padding-bottom") };
    });
    const content = await driver.contentBox("f", "input");
    expect({ content, positive: content.width > 0, recorded: await page.finish() }).toEqual({
      content: { x: box.x + px.left, y: box.y + px.top, width: box.width - px.left - px.right, height: box.height - px.top - px.bottom },
      positive: true,
      recorded: clean,
    });
  });

  it("firstLoad(containerId, markup, tag) navigates afresh under startDocument and the parser writes the markup with the tag, while the document is loading", async () => {
    const { visit: page, driver } = await open("first-load.html", ["first-load.html", "first-load.js", "live-regions.js", "ocelle-elements.js"]);
    await driver.firstLoad("c", '<ocelle-first-load id="f"></ocelle-first-load>', "ocelle-test-probe");
    const seen = await page.page.evaluate(() => {
      const found = document.getElementById("f");
      const readyState = found === null ? undefined : (Reflect.get(found, "connectedReadyState") as string | undefined);
      return { name: found?.localName ?? null, readyState: readyState ?? null, parent: found?.parentElement?.id ?? null };
    });
    const snapshots = await driver.liveCapture.stop();
    expect({ seen, first: snapshots[0]?.loaded ?? null, recorded: await page.finish() }).toEqual({
      seen: { name: "ocelle-test-probe", readyState: "loading", parent: "c" },
      first: false,
      recorded: clean,
    });
  });

  it("defineSecond(tag) defines a free tag and leaves a defined tag's first class in place without throwing", async () => {
    const { visit: page, driver } = await open();
    const first = await page.page.evaluate(() => {
      (globalThis as unknown as { ocelleFirst: unknown }).ocelleFirst = customElements.get("ocelle-test-region");
      return customElements.get("ocelle-test-region") !== undefined;
    });
    await driver.defineSecond("ocelle-test-second");
    await driver.defineSecond("ocelle-test-region");
    const seen = await page.page.evaluate(() => ({
      defined: customElements.get("ocelle-test-second") !== undefined,
      kept: customElements.get("ocelle-test-region") === (globalThis as unknown as { ocelleFirst: unknown }).ocelleFirst,
    }));
    expect({ first, seen, recorded: await page.finish() }).toEqual({ first: true, seen: { defined: true, kept: true }, recorded: clean });
  });

  describe("forms", () => {
    const form = '<form id="f" action="/submit" method="post"><input name="title" id="t" value="draft"><input name="note" id="n"><button id="go" name="via" value="button">Go</button></form>';

    it("formData(formId) returns the form's entries", async () => {
      const { visit: page, driver } = await open();
      await driver.mount(form);
      expect({ data: await driver.formData("f"), recorded: await page.finish() }).toEqual({
        data: [
          ["title", "draft"],
          ["note", ""],
        ],
        recorded: clean,
      });
    });

    it("submit(formId) submits through the form's submitter and returns the request body the server received", async () => {
      const { visit: page, driver } = await open();
      await driver.mount(form);
      const submitted = await driver.submit("f");
      expect({ submitted, url: page.page.url().endsWith("/live.html"), recorded: await page.finish() }).toEqual({
        submitted: [
          ["title", "draft"],
          ["note", ""],
          ["via", "button"],
        ],
        url: true,
        recorded: clean,
      });
    });

    it("submit(formId) returns null when no request arrives (a required field empty)", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<form id="f" action="/submit" method="post"><input name="title" id="t" required><input name="x" value="1"><button>Go</button></form>');
      const empty = await driver.submit("f");
      await driver.setProperty("t", "value", "Fix lane");
      expect({ empty, filled: await driver.submit("f"), recorded: await page.finish() }).toEqual({
        empty: null,
        filled: [
          ["title", "Fix lane"],
          ["x", "1"],
        ],
        recorded: clean,
      });
    });

    it("after a key step, submit(formId) takes that step's submission, or null when it made none", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<form id="f" action="/submit" method="post"><input name="title" id="t" value="Fix lane"></form>');
      await driver.pressOn("t", "Enter");
      const one = await driver.submit("f");
      await driver.mount('<form id="f" action="/submit" method="post"><input name="title" id="t" value="Fix lane"><input name="other" id="o"></form>');
      await driver.pressOn("t", "Enter");
      expect({ one, two: await driver.submit("f"), recorded: await page.finish() }).toEqual({ one: [["title", "Fix lane"]], two: null, recorded: clean });
    });

    it("reset(formId) resets the form", async () => {
      const { visit: page, driver } = await open();
      await driver.mount(form);
      await driver.setProperty("t", "value", "Fix lane");
      await driver.reset("f");
      expect({ value: await page.page.evaluate(() => (document.getElementById("t") as HTMLInputElement).value), recorded: await page.finish() }).toEqual({ value: "draft", recorded: clean });
    });

    it("type(id, text) focuses the control and types the text key by key", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<input id="t">');
      await page.page.evaluate(() => {
        const inputs: string[] = [];
        const input = document.getElementById("t") as HTMLInputElement;
        input.addEventListener("input", () => inputs.push(input.value));
        (globalThis as unknown as { inputs: string[] }).inputs = inputs;
      });
      await driver.type("t", "Fix {lane}");
      const seen = await page.page.evaluate(() => ({
        value: (document.getElementById("t") as HTMLInputElement).value,
        inputs: (globalThis as unknown as { inputs: string[] }).inputs.length,
        focused: document.activeElement?.id,
      }));
      expect({ seen, recorded: await page.finish() }).toEqual({ seen: { value: "Fix {lane}", inputs: 10, focused: "t" }, recorded: clean });
    });

    it("press(id, key) focuses the element and presses the key", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<input id="t" value="ab">');
      await page.page.evaluate(() => {
        const keys: string[] = [];
        document.getElementById("t")?.addEventListener("keydown", (event) => keys.push(event.key));
        (globalThis as unknown as { keys: string[] }).keys = keys;
      });
      await driver.pressOn("t", "End");
      await driver.pressOn("t", "Backspace");
      const seen = await page.page.evaluate(() => ({
        keys: (globalThis as unknown as { keys: string[] }).keys,
        value: (document.getElementById("t") as HTMLInputElement).value,
        focused: document.activeElement?.id,
      }));
      expect({ seen, recorded: await page.finish() }).toEqual({ seen: { keys: ["End", "Backspace"], value: "a", focused: "t" }, recorded: clean });
    });

    it("blur() moves focus away from the focused element, through shadow roots", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<ocelle-test-field id="f"></ocelle-test-field>');
      const focused = await page.page.evaluate(() => {
        const host = document.getElementById("f");
        host?.focus();
        const blurred: string[] = [];
        host?.shadowRoot?.querySelector("input")?.addEventListener("blur", () => blurred.push("input"));
        (globalThis as unknown as { blurred: string[] }).blurred = blurred;
        return document.activeElement?.id;
      });
      await driver.blur();
      const seen = await page.page.evaluate(() => ({ blurred: (globalThis as unknown as { blurred: string[] }).blurred, body: document.activeElement === document.body }));
      expect({ focused, seen, recorded: await page.finish() }).toEqual({ focused: "f", seen: { blurred: ["input"], body: true }, recorded: clean });
    });

    it("click(id, at) clicks at that point of the element's box", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<button id="b">Wide button</button>');
      await driver.rules("#b { width: 200px; height: 40px; }");
      await page.page.evaluate(() => {
        const points: { x: number; y: number }[] = [];
        const button = document.getElementById("b");
        button?.addEventListener("click", (event) => {
          const rect = button.getBoundingClientRect();
          points.push({ x: Math.round(event.clientX - rect.x), y: Math.round(event.clientY - rect.y) });
        });
        (globalThis as unknown as { points: unknown }).points = points;
      });
      await driver.clickPoint("b", { x: 150, y: 30 });
      expect({ points: await page.page.evaluate(() => (globalThis as unknown as { points: unknown }).points), recorded: await page.finish() }).toEqual({ points: [{ x: 150, y: 30 }], recorded: clean });
    });

    it("focusPath() lists the focused element through shadow roots", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<ocelle-test-field id="f"></ocelle-test-field><input id="t">');
      const empty = await driver.focusChain();
      await page.page.evaluate(() => document.getElementById("f")?.focus());
      expect({ empty, field: await driver.focusChain(), recorded: await page.finish() }).toEqual({ empty: [], field: ["ocelle-test-field#f", "input"], recorded: clean });
    });

    it("call(id, method, ...args) calls the element's method with the arguments and returns its plain result", async () => {
      const { visit: page, driver } = await open();
      await driver.mount(form);
      const results = [await driver.call("f", "checkValidity"), await driver.call("t", "getAttribute", "value"), await driver.call("t", "focus")];
      expect({ results, recorded: await page.finish() }).toEqual({ results: [true, "draft", null], recorded: clean });
    });

    it("call(id, method) rejects when the element has no such method, rather than reading undefined (phase 3 review round 1, R1-06)", async () => {
      const { visit: page, driver } = await open();
      await driver.mount(form);
      await expect(driver.call("t", "noSuchMethod")).rejects.toThrow("call: #t has no method noSuchMethod");
      expect(await page.finish()).toEqual(clean);
    });

    it("navigateAwayAndBack() on a no-store route shows the page again from the network and returns pageshow.persisted", async () => {
      const { visit: page, driver } = await open("live.html", [...scripts, "no-store/live.html"]);
      const response = await page.page.request.get(new URL("/no-store/live.html", page.page.url()).href);
      const route = { status: response.status(), cacheControl: response.headers()["cache-control"] };
      expect(route).toEqual({ status: 200, cacheControl: "no-store" });
      await page.page.goto(new URL("/no-store/live.html", page.page.url()).href, { waitUntil: "load" });
      await driver.mount('<form id="f" action="/submit" method="post"><input name="title" id="t" value="draft"></form>');
      await page.page.evaluate(() => {
        (globalThis as unknown as { marker: string }).marker = "before";
      });
      const persisted = await driver.navigateAwayAndBack();
      const seen = await page.page.evaluate(() => ({ marker: (globalThis as unknown as { marker?: string }).marker ?? null, url: location.pathname }));
      expect({ persisted, seen, recorded: await page.finish() }).toEqual({ persisted: false, seen: { marker: null, url: "/no-store/live.html" }, recorded: clean });
    });

    it("after a key step, navigateAwayAndBack() leaves no key step: submit(formId) submits the page shown again", async () => {
      const { visit: page, driver } = await open("form-restore.html", [...scripts, "no-store/form-restore.html", "about:blank"]);
      await page.page.goto(new URL("/no-store/form-restore.html", page.page.url()).href, { waitUntil: "load" });
      await driver.pressOn("n", "ArrowDown");
      await driver.navigateAwayAndBack();
      await page.page.fill("#n", "Fix lane");
      expect({ submitted: await driver.submit("g"), recorded: await page.finish() }).toEqual({ submitted: [["title", "Fix lane"]], recorded: clean });
    });
  });
});

describe("the fixture driver", { timeout: 60_000 }, () => {
  it("viewport(width, height) sets the page's innerWidth and innerHeight", async () => {
    const page = await openPlain();
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
  ])("chord($key) sends one trusted keydown of the key with exactly its modifiers", async ({ key, seen }) => {
    const page = await openPlain();
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
    await driver.chord(key);
    const keys = await page.page.evaluate(() => (window as unknown as { seen: unknown[] }).seen);
    expect({ keys, recorded: await page.finish() }).toEqual({ keys: [seen], recorded: clean });
  });

  it("chord(Tab) and chord(Shift+Tab) move focus with real input, so the focused button matches :focus-visible", async () => {
    const page = await openPlain();
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    const focused = (): Promise<unknown> => page.page.evaluate(() => ({ id: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }));
    await page.page.evaluate(() => document.getElementById("a")?.focus());
    await driver.chord("Tab");
    const forward = await focused();
    await driver.chord("Shift+Tab");
    expect({ observed: [forward, await focused()], recorded: await page.finish() }).toEqual({
      observed: [
        { id: "b", visible: true },
        { id: "a", visible: true },
      ],
      recorded: clean,
    });
  });

  it("clickAt(target, point) clicks at that point of the box with a trusted event, on a light-DOM and a shadow target, and a clicked button does not match :focus-visible", async () => {
    const page = await openPlain();
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
    await driver.clickAt("pad", { x: 30, y: 10 });
    await driver.clickAt({ id: "h", inner: ".inner" }, { x: 4, y: 4 });
    await driver.clickAt("a", { x: 2, y: 2 });
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
    const page = await openPlain();
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
    const page = await openPlain();
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

  it("deepActive() names the deep active element: a shadow node under its host's id, a light-DOM element by id, else body", async () => {
    const page = await openPlain();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<button id="a" type="button">A</button><driver-host id="h"></driver-host>');
    const atRest = await driver.deepActive();
    await page.page.evaluate(() => document.getElementById("a")?.focus());
    const light = await driver.deepActive();
    await page.page.evaluate(() => (document.getElementById("h")?.shadowRoot?.querySelector(".inner") as HTMLElement | null)?.focus());
    expect({ observed: [atRest, light, await driver.deepActive()], recorded: await page.finish() }).toEqual({ observed: ["body", "a", "h >> button.inner"], recorded: clean });
  });

  it("tabWalk(from, to) lists the deep active element after each Tab from `from` to `to`, and with `backward` after each Shift+Tab", async () => {
    const page = await openPlain();
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
    const page = await openPlain();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button><driver-host id="h"></driver-host>');
    await page.page.evaluate(() => document.getElementById("a")?.focus());
    await driver.chord("Tab");
    await driver.focus({ id: "h", inner: ".inner" });
    const afterKeys = { active: await driver.deepActive(), visible: await page.page.evaluate(() => document.getElementById("h")?.shadowRoot?.activeElement?.matches(":focus-visible")) };
    await driver.clickAt("a", { x: 2, y: 2 });
    await driver.focus("b");
    const afterClick = { active: await driver.deepActive(), visible: await page.page.evaluate(() => document.activeElement?.matches(":focus-visible")) };
    expect({ observed: [afterKeys, afterClick], recorded: await page.finish() }).toEqual({
      observed: [
        { active: "h >> button.inner", visible: true },
        { active: "b", visible: false },
      ],
      recorded: clean,
    });
  });

  it("scrollLeft(target) reads and setScrollLeft(target, value) writes an instant scroll, on a light-DOM box with smooth scroll-behavior and on a shadow box", async () => {
    const page = await openPlain();
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
    const page = await openPlain();
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
    await driver.chord("ArrowRight");
    const prevented = await driver.lastKeyPrevented();
    await driver.chord("ArrowLeft");
    expect({ observed: [atMount, prevented, await driver.lastKeyPrevented()], recorded: await page.finish() }).toEqual({ observed: [false, true, false], recorded: clean });
  });

  it("reducedMotion(mode) switches prefers-reduced-motion between reduce and no-preference", async () => {
    const page = await openPlain();
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
    const page = await openPlain();
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
    await driver.chord("ArrowRight");
    const record = await recorder.stop();
    const frames = record.filter((each) => !each.startsWith("resize: "));
    const key = frames.indexOf("keydown");
    const observed = { first: record[0], keys: frames.filter((each) => each === "keydown").length, before: [...new Set(frames.slice(0, key))], after: [...new Set(frames.slice(key + 1))], frames: frames.length - key - 1 >= 2, resizes: record.filter((each) => each.startsWith("resize: ")) };
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { first: "0", keys: 1, before: ["0"], after: ["40"], frames: true, resizes: ["resize: 0"] }, recorded: clean });
  });

  it('frameRecord(target, read) reads computed styles and attributes, and records "resize: <reading>" in each callback of its ResizeObserver on the target', async () => {
    const page = await openPlain();
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
    const page = await openPlain();
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
    const page = await openPlain();
    const driver = fixtureDriver(page.page, page.log);
    await defineHost(page.page);
    await driver.mount('<div id="box"></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 150px; }");
    const observed = [await driver.computed("box", "inline-size"), await driver.computed({ id: "h", inner: ".scroll" }, "inline-size"), await driver.computed({ id: "h", inner: ".scroll" }, "overflow-x")];
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: ["150px", "200px", "auto"], recorded: clean });
  });

  it("settle() waits at least two animation frames, then for every ocelle-* element to render", async () => {
    const page = await openPlain("icon.html");
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
    const page = await openPlain();
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
    const page = await openPlain("icon.html");
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

// The driver additions of 013 phase 1 on the strict-CSP fixture (contracts/checks.md § Driver additions; tasks.md
// T003): every shared body of scenarios/driver-additions.ts on its own `facts.html` page, its helper elements defined
// through `page.evaluate` (the DevTools protocol, which the page's CSP does not govern), with zero CSP violations, no
// request outside the allowed list, no failed request and no console message, as every fixture test asserts.
describe("the driver additions on the strict-CSP fixture (013 T003)", { timeout: 60_000 }, () => {
  it.each(driverAdditionScenarios)("$name", async ({ run, expected }) => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, "facts.html");
    await page.page.evaluate(defineDriverHelpers);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
