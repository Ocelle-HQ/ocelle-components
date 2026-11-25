import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { dataTableTouchScenarios } from "../scenarios/data-table.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// US1-24's no-hover half on the strict-CSP fixture (019 re-analysis A2 (a); tasks.md T010): the shared touch body of
// scenarios/data-table.ts on data-table.html in `visit(…, { touch: true })`, a separate context with `hasTouch`, with
// clean recorders beside the outcome.
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

describe("ocelle-data-table on the strict-CSP fixture, touch context (US1-24)", { timeout: 60_000 }, () => {
  for (const { name, run, expected } of dataTableTouchScenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "data-table.html", ["ocelle-elements.js", "module.js"], { touch: true });
      const observed = await run(fixtureDriver(page.page, page.log, true));
      expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
    });
  }
});
