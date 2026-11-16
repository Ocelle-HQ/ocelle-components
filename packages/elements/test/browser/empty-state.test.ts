import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { emptyStateScenarios } from "../scenarios/empty-state.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 2's browser scenarios, `ocelle-empty-state`, on the strict-CSP fixture with the built browser build (013
// contracts/checks.md § Scenario bodies; tasks.md T025): every shared body of scenarios/empty-state.ts on its own page,
// `empty-state.html` or, for the bodies with `base`, `empty-state-base.html`, with zero CSP violations, no request
// outside the allowed list, no failed request and no console message or uncaught error, asserted in the same test as
// the body's outcome.
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

describe("ocelle-empty-state on the strict-CSP fixture with the browser build (US2)", { timeout: 60_000 }, () => {
  it.each(emptyStateScenarios)("$name", async ({ run, expected, base }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, base === true ? "empty-state-base.html" : "empty-state.html");
    const observed = await run(fixtureDriver(page.page, page.log, base === true));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
