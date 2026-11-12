import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { iconSetScenarios } from "../scenarios/icon-set.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 2's browser scenarios, the icon set, on the strict-CSP fixture with the built browser build (005 spec
// § The strict-CSP fixture; research.md R-11, T033): every shared body of scenarios/icon-set.ts on its own fixture
// page, with zero CSP violations, no request outside the allowed list, no failed request and no console message or
// uncaught error on the page, asserted in the same test as the scenario's outcome.
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

describe("ocelle-icon's set on the strict-CSP fixture with the browser build (US2)", { timeout: 120_000 }, () => {
  it.each(iconSetScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "icon.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
