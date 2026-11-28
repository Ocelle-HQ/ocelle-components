import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { personalRailScenarios, initialsRailScenarios } from "../scenarios/personal-rail.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// 011 User Story 4's personal-rail scenarios on the strict-CSP fixture with the built browser build (research.md
// R-10, R-13, SC-001, FR-035; T042): every shared body of scenarios/personal-rail.ts on its own fixture page,
// fixtures/personal-rail.html or, for the bodies with base.css, fixtures/personal-rail-base.html (1280 × 800 px). Each
// page links the same-origin stand-in item stylesheet fixtures/rail-items.css; US4-10 also loads the README's
// orientation example as the same-origin module `/module.js`. Every test asserts zero CSP violations, no request
// outside the allowed list, no failed request and no console message or uncaught error, beside the scenario's outcome.
const built = inject("elementsFixture");
const allowed = ["ocelle-elements.js", "rail-items.css", "module.js"];
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

describe("ocelle-personal-rail on the strict-CSP fixture with the browser build (011 US4)", { timeout: 60_000 }, () => {
  it.each(personalRailScenarios)("$name", async ({ run, expected, base }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, base ? "personal-rail-base.html" : "personal-rail.html", allowed);
    const observed = await run(fixtureDriver(page.page, page.log, base));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

describe("Initials in the personal rail on the strict-CSP fixture", { timeout: 60_000 }, () => {
  it.each(initialsRailScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "personal-rail.html", allowed);
    const observed = await run(fixtureDriver(page.page, page.log));
    const recorded = await page.finish();
    expect(observed, "rail geometry, keyboard focus and initials").toEqual(expected);
    expect(recorded).toEqual(clean);
  });
});
