import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
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
      await driver.press("t", "Enter");
      const one = await driver.submit("f");
      await driver.mount('<form id="f" action="/submit" method="post"><input name="title" id="t" value="Fix lane"><input name="other" id="o"></form>');
      await driver.press("t", "Enter");
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
      await driver.press("t", "End");
      await driver.press("t", "Backspace");
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
      await driver.click("b", { x: 150, y: 30 });
      expect({ points: await page.page.evaluate(() => (globalThis as unknown as { points: unknown }).points), recorded: await page.finish() }).toEqual({ points: [{ x: 150, y: 30 }], recorded: clean });
    });

    it("focusPath() lists the focused element through shadow roots", async () => {
      const { visit: page, driver } = await open();
      await driver.mount('<ocelle-test-field id="f"></ocelle-test-field><input id="t">');
      const empty = await driver.focusPath();
      await page.page.evaluate(() => document.getElementById("f")?.focus());
      expect({ empty, field: await driver.focusPath(), recorded: await page.finish() }).toEqual({ empty: [], field: ["ocelle-test-field#f", "input"], recorded: clean });
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
  });
});
