import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import type { Navigation, Outcome } from "../scenarios/link.ts";
import { pillInteractiveNavigationScenarios, pillInteractiveScenarios } from "../scenarios/pill-tag-interactive.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served, Visit } from "./serve.ts";

// User Story 4's browser scenarios, the interactive `ocelle-pill-tag`, on the strict-CSP fixture with the built browser
// build (018 contracts/checks.md § Scenarios, § US4 bodies; tasks.md T047): every shared body of
// scenarios/pill-tag-interactive.ts on its own `pill-tag.html` page, which links base.css (a fresh context, so no forced
// colours carry over), with axe-core's `axe.min.js` served same-origin as `axe.js`; and the link-mode bodies on real
// navigation to the fixture's `link-target.html`, the new tabs and the server's visits (`pillInteractiveNavigationScenarios`).
// The allowed list holds `module.js`, the same-origin module of the driver's `module()` (as personal-rail.test.ts has it),
// for the body that makes pills by `document.createElement` and switches their mode in one task (review round 1, R1-01).
// Each test asserts zero CSP violations, no request outside the allowed list, no failed request and no console message
// or uncaught error, beside the body's outcome.
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

describe("ocelle-pill-tag, interactive, on the strict-CSP fixture with the browser build (US4)", { timeout: 120_000 }, () => {
  it.each(pillInteractiveScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "pill-tag.html", ["ocelle-elements.js", "axe.js", "module.js"]);
    const observed = await run(fixtureDriver(page.page, page.log, true));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

/** The longest wait, in milliseconds, for an action to navigate the page or open a tab before it counts as neither. */
const quiet = 1500;

/**
 * The fixture's real navigation (scenarios/link.ts `Navigation`), as test/browser/button.test.ts implements it for
 * `pill-tag.html`: the page's URL, the tabs its context opened and the server's visits of `link-target.html`.
 */
function navigation(opened: Visit, at: Served, origin: string): Navigation {
  const start = `${origin}/pill-tag.html`;
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

describe("ocelle-pill-tag's link navigation on the strict-CSP fixture with the browser build (US4-3, US4-5)", { timeout: 120_000 }, () => {
  it.each(pillInteractiveNavigationScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin, served } = started();
    const page = await visit(browser, origin, "pill-tag.html", ["ocelle-elements.js", "axe.js", "link-target.html"]);
    const observed = await run(fixtureDriver(page.page, page.log, true), navigation(page, served, origin));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
