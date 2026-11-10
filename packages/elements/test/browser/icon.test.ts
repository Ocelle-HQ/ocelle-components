import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { expectedDrawing } from "../icons-expected.ts";
import { iconScenarios, iconSize } from "../scenarios/icon.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-icon` on the strict-CSP fixture with the built browser build (005 spec
// § The strict-CSP fixture; research.md R-11, T015): every shared body of scenarios/icon.ts on its own fixture page,
// with zero CSP violations, no request outside the allowed list, no failed request and no console message or uncaught
// error on the page, asserted in the same test as the scenario's positive outcome (spec pairing table, first row; US1-8's
// "no console message at all, Lit's development-mode warning included" and US1-14's "no request outside the allowed
// list" hold on every page). Then the fixture-only cases: US1-10 (two module-build bundles, then the browser build),
// US1-15 (server HTML upgrades); the first test also shows, on the control page, that the collector records an inline
// style.
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

describe("the fixture", { timeout: 60_000 }, () => {
  it("the global setup built the browser build and the two module-build bundles, and the control page's collector records the one violation of an inline style attribute", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "control.html", []);
    const recorded = await page.finish();
    expect({ built, violations: recorded.violations, outside: recorded.outside, failed: recorded.failed }).toEqual({
      built: { dir: expect.any(String) as unknown },
      violations: [{ directive: "style-src-attr", blocked: "inline" }],
      outside: [],
      failed: [],
    });
  });
});

describe("ocelle-icon on the strict-CSP fixture with the browser build (US1)", { timeout: 60_000 }, () => {
  it.each(iconScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "icon.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });

  it("US1-10: after two module-build bundles and the browser build, the first bundle's class is kept, nothing throws, and close is drawn at the icon size (FR-006)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "define-twice.html", ["bundle-a.js", "bundle-b.js", "ocelle-elements.js"]);
    const driver = fixtureDriver(page.page, page.log);
    const registry = await page.page.evaluate(() => {
      const bundles = (globalThis as { ocelleBundles?: unknown[] }).ocelleBundles ?? [];
      return {
        bundles: bundles.length,
        classes: bundles.every((each) => typeof each === "function"),
        distinct: new Set(bundles).size,
        firstKept: bundles.length > 0 && customElements.get("ocelle-icon") === bundles[0],
      };
    });
    const icon = { drawing: await driver.drawing("icon"), box: await driver.box("icon") };
    expect({ registry, drawing: icon.drawing, size: [icon.box.width, icon.box.height], recorded: await page.finish() }).toEqual({
      registry: { bundles: 2, classes: true, distinct: 2, firstKept: true },
      drawing: expectedDrawing("close"),
      size: [iconSize, iconSize],
      recorded: clean,
    });
  });

  it("US1-15: an icon in the server HTML before the browser build loads upgrades and draws close at the icon size, with no inline script or style and no import map (FR-002, FR-004, FR-033)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "upgrade.html");
    const driver = fixtureDriver(page.page, page.log);
    const inline = await page.page.evaluate(() => document.querySelectorAll('script:not([src]), script[type="importmap"], style, [style]').length);
    const box = await driver.box("icon");
    expect({ inline, drawing: await driver.drawing("icon"), size: [box.width, box.height, box.display], recorded: await page.finish() }).toEqual({
      inline: 0,
      drawing: expectedDrawing("close"),
      size: [iconSize, iconSize, "inline-block"],
      recorded: clean,
    });
  });
});
