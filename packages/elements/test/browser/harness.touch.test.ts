import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineStandIns, touchScenarios } from "../scenarios/harness.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The harness self-tests of 008's touch context on the strict-CSP fixture (research.md R-14; tasks.md T002): the touch
// bodies of scenarios/harness.ts on pages opened by `visit(…, { touch: true })`, a separate context with `hasTouch`,
// with the stand-in elements defined in the page through the DevTools protocol. Every test asserts clean recorders
// beside the body's outcome.
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

describe("the harness self-tests of the touch context on the strict-CSP fixture (R-14)", { timeout: 60_000 }, () => {
  it.each(touchScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "icon.html", ["ocelle-elements.js"], { touch: true });
    await page.page.evaluate(defineStandIns);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
