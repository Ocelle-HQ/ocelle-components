import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { brandMarkScenarios } from "../scenarios/brand-mark.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 4's browser scenarios for `ocelle-brand-mark` on the strict-CSP fixture with the built browser build (005
// spec § The strict-CSP fixture, US4 Independent Test, SC-001; research.md R-11, T052): every shared body of
// scenarios/brand-mark.ts on its own fixture page, with zero CSP violations, no request outside the allowed list, no
// failed request and no console message or uncaught error on the page, asserted in the same test as the scenario's
// positive outcome (spec pairing table, first row).
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

describe("ocelle-brand-mark on the strict-CSP fixture with the browser build (US4)", { timeout: 60_000 }, () => {
  it.each(brandMarkScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "brand-mark.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
