import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { actionRowScenarios } from "../scenarios/action-row.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 4's browser scenarios for `ocelle-action-row` on the strict-CSP fixture with the built browser build (012
// research.md R-11; tasks.md T051): every shared body of scenarios/action-row.ts on its own `action-row.html` page,
// which loads the browser build (it defines `ocelle-action-row` and `ocelle-icon`), with axe-core's `axe.min.js` served
// same-origin as `axe.js`; each test asserts zero CSP violations, no request outside the allowed list, no failed
// request and no console message or uncaught error on the page, beside the scenario's outcome.
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

describe("ocelle-action-row on the strict-CSP fixture with the browser build (US4)", { timeout: 120_000 }, () => {
  it.each(actionRowScenarios)("$name", async ({ run, expected }) => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, "action-row.html", ["ocelle-elements.js", "axe.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
