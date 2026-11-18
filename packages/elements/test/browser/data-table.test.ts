import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { beforeUpgrade, beforeUpgradeExpected, beforeUpgradeMarkup, dataTableScenarios } from "../scenarios/data-table.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// `ocelle-data-table` on the strict-CSP fixture with the browser build and `@ocelle/styles`' base.css (019 US1, the
// Independent Test; contracts/checks.md § Harnesses; tasks.md T010): every shared body of scenarios/data-table.ts on
// data-table.html, with zero CSP violations, no request outside the allowed list, no failed request and no console
// message or uncaught error (a `ResizeObserver` loop error included; the bodies' in-page reads run as the same-origin
// `/module.js`, the one request beside the page's own), asserted in the same test as the body's outcome;
// and the before-upgrade body on data-table-upgrade.html, which links base.css and loads no element script.
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

describe("ocelle-data-table on the strict-CSP fixture with the browser build (US1)", { timeout: 120_000 }, () => {
  it.each(dataTableScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "data-table.html", ["ocelle-elements.js", "module.js"]);
    const observed = await run(fixtureDriver(page.page, page.log, true));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });

  it("before upgrade (data-table-upgrade.html): the table is styled by block 1 (compact cells, eyebrow headers) with no region", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "data-table-upgrade.html", ["module.js"]);
    const driver = fixtureDriver(page.page, page.log, true);
    await driver.mount(beforeUpgradeMarkup, { base: true });
    const observed = await beforeUpgrade(driver);
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: beforeUpgradeExpected, recorded: clean });
  });
});
