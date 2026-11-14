import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { driverCommandScenarios } from "../scenarios/driver-commands.ts";
import { driverRecorderScenarios } from "../scenarios/driver-recorders.ts";
import type { InPage } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The driver commands and recorders of 014 on the strict-CSP fixture (research.md R-07, R-11, T002, T003): the bodies of
// scenarios/driver-commands.ts and scenarios/driver-recorders.ts marked `fixture`, each on its own `driver.html` page,
// which loads the browser build and nothing else; the clipboard observer is installed by the page's init script
// (serve.ts), so a body that calls the clipboard on a fixture page proves it is there. Every test asserts zero CSP
// violations, no request outside the allowed list, no failed request and no console message or uncaught error.
const built = inject("elementsFixture");
const scenarios = [...driverCommandScenarios, ...driverRecorderScenarios].filter((scenario) => scenario.fixture);
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

describe("the driver commands and recorders on the strict-CSP fixture (014 R-11)", { timeout: 60_000 }, () => {
  it("runs the fixture bodies of both scenario lists", () => {
    expect(scenarios.length).toBeGreaterThan(15);
  });

  it.each(scenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "driver.html");
    const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
    const observed = await run(fixtureDriver(page.page, page.log), inPage);
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
