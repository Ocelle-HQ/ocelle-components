import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineDialogStandIns, defineTooltipStandIns, tooltipScenarios } from "../scenarios/tooltip.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 3's browser scenarios for `ocelle-tooltip` on the strict-CSP fixture with the built browser build (008
// tasks.md T042): every shared body of scenarios/tooltip.ts (contracts/checks.md § Tooltip), each on a fresh page
// `tooltip.html`, which links the test delay stylesheet (300 ms, R-15), with the stand-ins defined in the page through
// the DevTools protocol, which the page's policy does not govern. Every test asserts the recorders beside the body's
// outcome: zero CSP violations, only allowed requests, no failed request and no console message or uncaught error.
// Each test is named by its row's full name (tasks.md Rules § Full test names).
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

describe("ocelle-tooltip on the strict-CSP fixture with the browser build (US3)", { timeout: 60_000 }, () => {
  for (const { name, run, expected } of tooltipScenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "tooltip.html");
      await page.page.evaluate(defineDialogStandIns);
      await page.page.evaluate(defineTooltipStandIns);
      const observed = await run(fixtureDriver(page.page, page.log));
      expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
    });
  }
});
