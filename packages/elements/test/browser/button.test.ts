import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { buttonScenarios } from "../scenarios/button.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-button` in button mode on the strict-CSP fixture with the built browser
// build (012 research.md R-11; tasks.md T018): every shared body of scenarios/button.ts on its own `button.html` page,
// which loads the browser build (it defines `ocelle-button` and `ocelle-icon`), with axe-core's `axe.min.js` served
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

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

describe("ocelle-button on the strict-CSP fixture with the browser build (US1)", { timeout: 120_000 }, () => {
  it.each(buttonScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "button.html", ["ocelle-elements.js", "axe.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
