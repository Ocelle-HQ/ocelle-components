import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { pillScenarios } from "../scenarios/pill-tag.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 3's browser scenarios, the static `ocelle-pill-tag` and the badge, on the strict-CSP fixture with the built
// browser build (018 contracts/checks.md § Scenarios, § US3 bodies; tasks.md T036): every shared body of
// scenarios/pill-tag.ts on its own `pill-tag.html` page, which links base.css (a fresh context, so no forced colours carry
// over), with zero CSP violations, no request outside the allowed list, no failed request and no console message or
// uncaught error, asserted in the same test as the body's outcome. The static click inside a link is in process only
// (scenarios/pill-tag.ts `pillSinkScenarios`): a link here navigates for real.
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

describe("ocelle-pill-tag, static, on the strict-CSP fixture with the browser build (US3)", { timeout: 60_000 }, () => {
  it.each(pillScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "pill-tag.html");
    const observed = await run(fixtureDriver(page.page, page.log, true));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
