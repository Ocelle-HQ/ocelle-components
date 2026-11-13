import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { frameCases, measureFrame } from "../scenarios/frames.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The tested frames of 009 on the strict-CSP fixture (research.md R-17, PLAN-TESTABILITY-1-008; T005): each frame's
// `[data-frame]` box on `frames.html`, which links `tokens.css` and test/fixtures/frames.css same-origin and loads no
// script, measured at its viewport with the page's `innerWidth` asserted beside it. Every test also asserts zero CSP
// violations, no request outside the allowed list, no failed request and no console message or uncaught error.
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

describe("the frames on the strict-CSP fixture", { timeout: 60_000 }, () => {
  it.each(frameCases)("Frame $frame measures $inlineSize px at a $viewport.width px viewport", async (frame) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "frames.html", []);
    const inlineSize = await measureFrame(fixtureDriver(page.page, page.log), frame);
    const observed = { innerWidth: await page.page.evaluate(() => window.innerWidth), inlineSize };
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: { innerWidth: frame.viewport.width, inlineSize: frame.inlineSize }, recorded: clean });
  });
});
