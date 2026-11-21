import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { tabsScenarios } from "../scenarios/tabs.ts";
import type { InPage } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 2's browser scenarios for `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel` on the strict-CSP fixture
// with the built browser build (014 spec § The strict-CSP fixture; research.md R-11, T043): every shared body of
// scenarios/tabs.ts marked `fixture`, each on its own tabs.html page, which loads the browser build and nothing else;
// the bodies mount tabs and panels with no id or `aria-*` written by the host (SC-003). Each runs with zero CSP
// violations, no request outside the allowed list, no failed request, no console message or uncaught error and no
// clipboard call, asserted in the same test as the scenario's outcome.
const built = inject("elementsFixture");
const scenarios = tabsScenarios.filter((scenario) => scenario.fixture);
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

describe("ocelle-tabs, ocelle-tab and ocelle-tab-panel on the strict-CSP fixture with the browser build (US2)", { timeout: 60_000 }, () => {
  it("runs the fixture bodies of the tabs scenarios", () => {
    expect(scenarios.length).toBeGreaterThan(40);
  });

  // One `it` per body under its full name (`it.each`'s "$name" shortens a long name to 40 characters).
  for (const { name, run, expected } of scenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "tabs.html");
      const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
      const driver = fixtureDriver(page.page, page.log);
      const observed = await run(driver, inPage);
      const clipboard = await driver.clipboardCalls();
      expect({ observed, clipboard, recorded: await page.finish() }).toEqual({ observed: expected, clipboard: [], recorded: clean });
    });
  }
});
