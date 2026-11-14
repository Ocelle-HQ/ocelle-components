import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { listboxScenarios } from "../scenarios/listbox.ts";
import type { InPage } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-listbox` and `ocelle-option` on the strict-CSP fixture with the built
// browser build (014 spec § The strict-CSP fixture; research.md R-11, T015): every shared body of scenarios/listbox.ts
// marked `fixture`, each on its own listbox.html page, which loads the browser build and nothing else, with zero CSP
// violations, no request outside the allowed list, no failed request, no console message or uncaught error and no
// clipboard call, asserted in the same test as the scenario's outcome.
const built = inject("elementsFixture");
const scenarios = listboxScenarios.filter((scenario) => scenario.fixture);
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

describe("ocelle-listbox and ocelle-option on the strict-CSP fixture with the browser build (US1)", { timeout: 60_000 }, () => {
  it("runs the fixture bodies of the listbox scenarios", () => {
    expect(scenarios.length).toBeGreaterThan(30);
  });

  it.each(scenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "listbox.html");
    const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
    const driver = fixtureDriver(page.page, page.log);
    const observed = await run(driver, inPage);
    const clipboard = await driver.clipboardCalls();
    expect({ observed, clipboard, recorded: await page.finish() }).toEqual({ observed: expected, clipboard: [], recorded: clean });
  });
});
