import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { buttonScenarios } from "../scenarios/button.ts";
import { linkNavigationScenarios, linkScenarios } from "../scenarios/link.ts";
import type { Navigation, Outcome } from "../scenarios/link.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served, Visit } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-button` in button mode on the strict-CSP fixture with the built browser
// build (012 research.md R-11; tasks.md T018): every shared body of scenarios/button.ts on its own `button.html` page,
// which loads the browser build (it defines `ocelle-button` and `ocelle-icon`), with axe-core's `axe.min.js` served
// same-origin as `axe.js`; each test asserts zero CSP violations, no request outside the allowed list, no failed
// request and no console message or uncaught error on the page, beside the scenario's outcome.
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

function started(): { readonly browser: Browser; readonly origin: string; readonly served: Served } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin, served };
}

describe("ocelle-button on the strict-CSP fixture with the browser build (US1)", { timeout: 120_000 }, () => {
  it.each(buttonScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "button.html", ["ocelle-elements.js", "axe.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

describe("ocelle-button in link mode and its ARIA passthrough on the strict-CSP fixture with the browser build (US2)", { timeout: 120_000 }, () => {
  it.each(linkScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "button.html", ["ocelle-elements.js", "axe.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

/** The longest wait, in milliseconds, for an action to navigate the page or open a tab before it counts as neither. */
const quiet = 1500;

/**
 * The fixture's real navigation (scenarios/link.ts `Navigation`): the page's URL, the tabs its context opened (serve.ts
 * `Visit.tabs`) and the server's visits of `link-target.html` (`Served.visits`), since the last outcome.
 */
function navigation(opened: Visit, served: Served, origin: string): Navigation {
  const start = `${origin}/button.html`;
  let visits = served.visits().length;
  let tabs = opened.tabs.length;
  const path = (url: string): string => (url.startsWith(`${origin}/`) ? url.slice(origin.length + 1) : url);
  return {
    outcome: async (): Promise<Outcome> => {
      const deadline = Date.now() + quiet;
      while (Date.now() < deadline && opened.page.url() === start && opened.tabs.length === tabs && served.visits().length === visits) await new Promise((resolve) => setTimeout(resolve, 50));
      // A navigation, a tab or a download has started (or none came): give it time to finish, so its visit is counted.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await opened.page.waitForLoadState("load");
      const added = opened.tabs.slice(tabs);
      for (const tab of added) await tab.waitForLoadState("load");
      const outcome: Outcome = { page: path(opened.page.url()), tabs: added.map((tab) => path(tab.url())), visits: served.visits().length - visits };
      for (const tab of added) await tab.close();
      if (opened.page.url() !== start) await opened.page.goto(start, { waitUntil: "load" });
      visits = served.visits().length;
      tabs = opened.tabs.length;
      return outcome;
    },
  };
}

describe("ocelle-button's link navigation on the strict-CSP fixture with the browser build (US2-1, US2-3)", { timeout: 120_000 }, () => {
  it.each(linkNavigationScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin, served } = started();
    const page = await visit(browser, origin, "button.html", ["ocelle-elements.js", "axe.js", "link-target.html"]);
    const observed = await run(fixtureDriver(page.page, page.log), navigation(page, served, origin));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
