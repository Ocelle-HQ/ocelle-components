import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineDialogStandIns, defineTooltipStandIns, tooltipTouchScenarios } from "../scenarios/tooltip.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The touch rows of `ocelle-tooltip` on the strict-CSP fixture (008 tasks.md T042; contracts/checks.md § Tooltip
// "Touch"; research.md R-14): the bodies of scenarios/tooltip.ts's `tooltipTouchScenarios` on `tooltip.html` opened by
// `visit(…, { touch: true })`, a separate context with `hasTouch`, with clean recorders beside each outcome. Each test
// is named by its row's full name.
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

describe("ocelle-tooltip on the strict-CSP fixture, touch context (US3-10)", { timeout: 60_000 }, () => {
  for (const { name, run, expected } of tooltipTouchScenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "tooltip.html", ["ocelle-elements.js"], { touch: true });
      await page.page.evaluate(defineDialogStandIns);
      await page.page.evaluate(defineTooltipStandIns);
      const observed = await run(fixtureDriver(page.page, page.log));
      expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
    });
  }
});
