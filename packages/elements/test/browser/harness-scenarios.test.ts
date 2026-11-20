import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { axeScenarios, axScenarios, eventScenarios, interactionScenarios } from "../scenarios/harness-scenarios.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The harness self-tests on the strict-CSP fixture (012 research.md R-11; tasks.md T001 to T005): every shared body of
// scenarios/harness-scenarios.ts on its own page, `button.html` (the browser build only) or, for a body with the test host,
// `slot.html` (the browser build and the test host's bundle), with axe-core's `axe.min.js` served same-origin as
// `axe.js`; and the fixture body of the navigation scenarios (T003), real navigation to `link-target.html`, whose
// visits the server records, and a new tab recorded by `context.on("page")`. Every test asserts zero CSP violations,
// no request outside the allowed list, no failed request and no console message or uncaught error, beside its outcome.
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

function started(): { readonly browser: Browser; readonly served: Served } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, served };
}

/** The page of a body and the scripts it may load. */
function pageOf(host: boolean): { readonly page: string; readonly scripts: readonly string[] } {
  return host
    ? { page: "slot.html", scripts: ["ocelle-elements.js", "ocelle-test-host.js", "axe.js"] }
    : { page: "button.html", scripts: ["ocelle-elements.js", "axe.js"] };
}

describe("the harness methods on the strict-CSP fixture (T001, T002, T004, T005)", { timeout: 60_000 }, () => {
  it.each([...interactionScenarios, ...eventScenarios, ...axScenarios, ...axeScenarios])("$name", async ({ run, expected, host }) => {
    const { browser, served } = started();
    const { page, scripts } = pageOf(host);
    const opened = await visit(browser, served.origin, page, scripts);
    const observed = await run(fixtureDriver(opened.page, opened.log));
    expect({ observed, recorded: await opened.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

describe("navigation on the strict-CSP fixture (T003)", { timeout: 60_000 }, () => {
  it("opens link-target.html in a new tab for a Ctrl-click and navigates the page to it for a plain click, each visit recorded by the server", async () => {
    const { browser, served } = started();
    const opened = await visit(browser, served.origin, "button.html", ["ocelle-elements.js", "link-target.html"]);
    const driver = fixtureDriver(opened.page, opened.log);
    await driver.mount('<a id="link" href="link-target.html">Target</a>');
    const before = served.visits();
    await driver.click("link", { modifiers: ["Control"] });
    await expect.poll(() => opened.tabs.length).toBe(1);
    await opened.tabs[0]?.waitForLoadState("load");
    const tab = { url: opened.tabs[0]?.url(), page: opened.page.url(), visits: served.visits() };
    await driver.click("link");
    await opened.page.waitForURL(`${served.origin}/link-target.html`);
    expect({ before, tab, after: { page: opened.page.url(), tabs: opened.tabs.length, visits: served.visits() }, recorded: await opened.finish() }).toEqual({
      before: [],
      tab: { url: `${served.origin}/link-target.html`, page: `${served.origin}/button.html`, visits: ["link-target.html"] },
      after: { page: `${served.origin}/link-target.html`, tabs: 1, visits: ["link-target.html", "link-target.html"] },
      recorded: clean,
    });
  });

  it("opens a new tab for a middle click, which the page gets as auxclick, and the page stays", async () => {
    const { browser, served } = started();
    const opened = await visit(browser, served.origin, "button.html", ["ocelle-elements.js", "link-target.html"]);
    const driver = fixtureDriver(opened.page, opened.log);
    await driver.mount('<a id="link" href="link-target.html">Target</a>');
    await driver.events("link", ["click", "auxclick"]);
    await driver.click("link", { button: "middle" });
    await expect.poll(() => opened.tabs.length).toBe(1);
    await opened.tabs[0]?.waitForLoadState("load");
    const types = (await driver.takeEvents()).filter((each) => each.at === "a#link").map((each) => each.type);
    expect({ types, tab: opened.tabs[0]?.url(), page: opened.page.url(), recorded: await opened.finish() }).toEqual({
      types: ["auxclick"],
      tab: `${served.origin}/link-target.html`,
      page: `${served.origin}/button.html`,
      recorded: clean,
    });
  });
});
