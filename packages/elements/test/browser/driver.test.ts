import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineDriverHelpers, driverAdditionScenarios } from "../scenarios/driver-additions.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The driver additions of 013 phase 1 on the strict-CSP fixture (contracts/checks.md § Driver additions; tasks.md
// T003): every shared body of scenarios/driver-additions.ts on its own `facts.html` page, its helper elements defined
// through `page.evaluate` (the DevTools protocol, which the page's CSP does not govern), with zero CSP violations, no
// request outside the allowed list, no failed request and no console message, as every fixture test asserts.
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

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

describe("the driver additions on the strict-CSP fixture (013 T003)", { timeout: 60_000 }, () => {
  it.each(driverAdditionScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "facts.html");
    await page.page.evaluate(defineDriverHelpers);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
