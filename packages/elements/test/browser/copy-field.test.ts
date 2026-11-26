import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { copyFieldScenarios } from "../scenarios/copy-field.ts";
import type { InPage } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 4's browser scenarios for `ocelle-copy-field` on the strict-CSP fixture with the built browser build (014
// spec § The strict-CSP fixture; research.md R-07, R-11, T078): every shared body of scenarios/copy-field.ts marked
// `fixture`, each on its own copy-field.html page, which loads the browser build and nothing else. Each runs with zero
// CSP violations, no request outside the allowed list, no failed request, no console message or uncaught error and no
// clipboard call (the clipboard observer is installed on every fixture page before any page script; SC-006), asserted
// in the same test as the scenario's outcome.
const built = inject("elementsFixture");
const scenarios = copyFieldScenarios.filter((scenario) => scenario.fixture);
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

describe("ocelle-copy-field on the strict-CSP fixture with the browser build (US4)", { timeout: 60_000 }, () => {
  it("runs the fixture bodies of the copy-field scenarios", () => {
    expect(scenarios.length).toBeGreaterThan(20);
  });

  // One `it` per body under its full name (`it.each`'s "$name" shortens a long name to 40 characters).
  for (const { name, run, expected } of scenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "copy-field.html");
      const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
      const driver = fixtureDriver(page.page, page.log);
      const observed = await run(driver, inPage);
      const clipboard = await driver.clipboardCalls();
      expect({ observed, clipboard, recorded: await page.finish() }).toEqual({ observed: expected, clipboard: [], recorded: clean });
    });
  }
});
