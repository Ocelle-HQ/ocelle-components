import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { contextSidebarScenarios } from "../scenarios/context-sidebar.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// 011 User Story 3's context-sidebar scenarios on the strict-CSP fixture with the built browser build (research.md
// R-13, SC-001, FR-035; T034): every shared body of scenarios/context-sidebar.ts on its own fixture page
// (fixtures/context-sidebar.html, 1280 × 800 px), with zero CSP violations, no request outside the allowed list, no
// failed request and no console message or uncaught error, asserted in the same test as the scenario's positive
// outcome.
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

describe("ocelle-context-sidebar on the strict-CSP fixture with the browser build (011 US3)", { timeout: 60_000 }, () => {
  it.each(contextSidebarScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "context-sidebar.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
