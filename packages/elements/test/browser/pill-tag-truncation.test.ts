import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { pillTruncationScenarios } from "../scenarios/pill-tag-truncation.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 5's browser scenarios, truncation and the full-text tooltip of the interactive `ocelle-pill-tag`, on the
// strict-CSP fixture with the built browser build (018 contracts/checks.md § Scenarios, § US5 bodies, the tooltip half
// of § US4-10; tasks.md T057): every shared body of scenarios/pill-tag-truncation.ts on its own
// `pill-tag-truncation.html` page, which links base.css and the 300 ms test delay of fixtures/tooltip-delay.css (a fresh
// context, so no state carries over), with axe-core's `axe.min.js` served same-origin as `axe.js` and the `module.js`
// the forwarded slot's `slotchange` body runs through `driver.module` (review round 1, R1-05). Each test asserts zero
// CSP violations, no request outside the allowed list, no failed request and no console message or uncaught error,
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

describe("ocelle-pill-tag, truncation and the full-text tooltip, on the strict-CSP fixture with the browser build (US5)", { timeout: 120_000 }, () => {
  it.each(pillTruncationScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "pill-tag-truncation.html", ["ocelle-elements.js", "axe.js", "module.js"]);
    const observed = await run(fixtureDriver(page.page, page.log, true));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
