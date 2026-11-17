import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { progressScenarios } from "../scenarios/progress.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 3's browser scenarios, `ocelle-progress`, on the strict-CSP fixture with the built browser build (013
// contracts/checks.md § Scenario bodies; tasks.md T040): every shared body of scenarios/progress.ts on its own
// `progress.html` page (a fresh context, so no reduced motion or forced colours carries over and every page is a new
// loading episode), with zero CSP violations (a determinate bar's fill is sized through the CSSOM, which the policy
// does not govern), no request outside the allowed list, no failed request and no console message or uncaught error,
// asserted in the same test as the body's outcome.
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

describe("ocelle-progress on the strict-CSP fixture with the browser build (US3)", { timeout: 60_000 }, () => {
  it.each(progressScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "progress.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
