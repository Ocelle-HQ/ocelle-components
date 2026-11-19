import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { actionRowScenarios } from "../scenarios/action-row.ts";
import type { Navigation, Outcome } from "../scenarios/link.ts";
import { rowStateNavigationScenarios, rowStateScenarios } from "../scenarios/row-states.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served, Visit } from "./serve.ts";

// User Story 4's browser scenarios for `ocelle-action-row` on the strict-CSP fixture with the built browser build (012
// research.md R-11; tasks.md T051): every shared body of scenarios/action-row.ts on its own `action-row.html` page,
// which loads the browser build (it defines `ocelle-action-row` and `ocelle-icon`), with axe-core's `axe.min.js` served
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

describe("ocelle-action-row on the strict-CSP fixture with the browser build (US4)", { timeout: 120_000 }, () => {
  it.each(actionRowScenarios)("$name", async ({ run, expected }) => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, "action-row.html", ["ocelle-elements.js", "axe.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

// User Story 5 (tasks.md T062): the shared bodies of scenarios/row-states.ts on the built browser build, and its link-row
// bodies on real navigation (the fixture's `link-target.html` allowed, as for the button's link navigation bodies).
describe("ocelle-action-row's states and card layout on the strict-CSP fixture with the browser build (US5)", { timeout: 120_000 }, () => {
  it.each(rowStateScenarios)("$name", async ({ run, expected }) => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, "action-row.html", ["ocelle-elements.js", "axe.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

/** The longest wait, in milliseconds, for an action to navigate the page or open a tab before it counts as neither. */
const quiet = 1500;

/**
 * The fixture's real navigation (scenarios/link.ts `Navigation`), as test/browser/button.test.ts implements it for
 * `action-row.html`: the page's URL, the tabs its context opened and the server's visits of `link-target.html`.
 */
function navigation(opened: Visit, at: Served, origin: string): Navigation {
  const start = `${origin}/action-row.html`;
  let visits = at.visits().length;
  let tabs = opened.tabs.length;
  const path = (url: string): string => (url.startsWith(`${origin}/`) ? url.slice(origin.length + 1) : url);
  return {
    outcome: async (): Promise<Outcome> => {
      const deadline = Date.now() + quiet;
      while (Date.now() < deadline && opened.page.url() === start && opened.tabs.length === tabs && at.visits().length === visits) await new Promise((resolve) => setTimeout(resolve, 50));
      // A navigation, a tab or a download has started (or none came): give it time to finish, so its visit is counted.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await opened.page.waitForLoadState("load");
      const added = opened.tabs.slice(tabs);
      for (const tab of added) await tab.waitForLoadState("load");
      const outcome: Outcome = { page: path(opened.page.url()), tabs: added.map((tab) => path(tab.url())), visits: at.visits().length - visits };
      for (const tab of added) await tab.close();
      if (opened.page.url() !== start) await opened.page.goto(start, { waitUntil: "load" });
      visits = at.visits().length;
      tabs = opened.tabs.length;
      return outcome;
    },
  };
}

describe("ocelle-action-row's link navigation on the strict-CSP fixture with the browser build (US5-1, US5-2, US5-6)", { timeout: 120_000 }, () => {
  it.each(rowStateNavigationScenarios)("$name", async ({ run, expected }) => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, "action-row.html", ["ocelle-elements.js", "axe.js", "link-target.html"]);
    const observed = await run(fixtureDriver(page.page, page.log), navigation(page, served, served.origin));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
