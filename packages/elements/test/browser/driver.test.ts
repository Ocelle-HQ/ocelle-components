import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The fixture driver's own methods, each proven against a plain page (009 research.md R-17; T005): `viewport()`
// resizes the fixture page from the 1280 × 800 it opens at. test/driver.test.ts proves the in-process driver's.
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

describe("the fixture driver", { timeout: 60_000 }, () => {
  it("viewport(width, height) sets the page's innerWidth and innerHeight", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "frames.html", []);
    const driver = fixtureDriver(page.page, page.log);
    const size = (): Promise<number[]> => page.page.evaluate(() => [window.innerWidth, window.innerHeight]);
    await driver.viewport(320, 640);
    const narrow = await size();
    await driver.viewport(1000, 700);
    const wide = await size();
    expect({ observed: [narrow, wide], recorded: await page.finish() }).toEqual({
      observed: [
        [320, 640],
        [1000, 700],
      ],
      recorded: clean,
    });
  });
});
