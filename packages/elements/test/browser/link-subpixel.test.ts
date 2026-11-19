import { chromium } from "playwright";
import type { Browser } from "playwright";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import type { InPage } from "../scenarios/driver.ts";
import { linkScenarios } from "../scenarios/link.ts";
import type { Navigation } from "../scenarios/link.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// US5-7 under subpixel (LCD) text (014 phase 6 operator round 3, O3-01; landing review L1-01; research.md R-15
// "Amendment: text antialiasing under the ring samples"; T115). CI's Chromium draws text with subpixel antialiasing,
// while the local default draws grayscale text (the headless-shell wrapper passes `--disable-lcd-text`, and the
// container's fontconfig is grayscale). US5-7 samples the ring 3.5 px outside the link, so the coloured fringe of a
// neighbouring glyph can move a sample under the translucent Highlight ring: it passed locally and failed in CI. This
// suite launches its own Chromium with a committed fontconfig (subpixel/fonts.conf: the system configuration, with
// `rgba` `rgb`) so that the CI condition shows on every machine:
// - a precondition: black text on white in this browser has coloured pixels, so the body below cannot pass vacuously
//   on a browser that draws grayscale text;
// - US5-7's shared body, found by name in scenarios/link.ts and run unchanged on link.html, as browser/link.test.ts
//   runs it. US5-7 does not navigate, so its navigation throws.
// No other suite's launch changes.
const built = inject("elementsFixture");
const fontconfig = fileURLToPath(new URL("./subpixel/fonts.conf", import.meta.url));
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch({
    ...(executablePath === undefined || executablePath === "" ? {} : { executablePath }),
    env: { ...process.env, FONTCONFIG_FILE: fontconfig },
  });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

/** A navigation whose every member throws: US5-7 does not navigate. */
const noNavigation: Navigation = {
  get host(): string {
    throw new Error("US5-7 does not navigate");
  },
  click: () => Promise.reject(new Error("US5-7 does not navigate")),
  press: () => Promise.reject(new Error("US5-7 does not navigate")),
  back: () => Promise.reject(new Error("US5-7 does not navigate")),
  opened: () => Promise.reject(new Error("US5-7 does not navigate")),
  dialogs: () => Promise.reject(new Error("US5-7 does not navigate")),
};

describe("ocelle-link's US5-7 with subpixel text (O3-01, landing L1-01)", { timeout: 90_000 }, () => {
  it("precondition: this browser draws subpixel text, so black text on white has coloured pixels", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "link.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<p id="sample">Subpixel text: the quick brown fox jumps over the lazy dog.</p>');
    await driver.rules("#sample { display: inline-block; margin: 0; padding: 4px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); font-size: 16px; }");
    const image = await driver.pixels("sample");
    let coloured = 0;
    for (let index = 0; index < image.data.length; index += 4) {
      const [r = 0, g = 0, b = 0] = [image.data[index], image.data[index + 1], image.data[index + 2]];
      if (Math.max(r, g, b) - Math.min(r, g, b) > 8) coloured++;
    }
    const recorded = await page.finish();
    expect(
      coloured,
      "the browser draws no subpixel text (FONTCONFIG_FILE=subpixel/fonts.conf had no effect), for example because OCELLE_CHROMIUM_PATH points at a wrapper that passes --disable-lcd-text such as chrome-headless-shell; use chrome-linux64/chrome (quickstart.md)",
    ).toBeGreaterThan(0);
    expect(recorded).toEqual(clean);
  });

  // Exactly one body may match; the test asserts it before it runs the body.
  const bodies = linkScenarios.filter((scenario) => scenario.name.startsWith("US5-7:"));
  const [body] = bodies;

  it(body?.name ?? "US5-7: (no body of the link scenarios matches)", async () => {
    expect(bodies.length, "exactly one body of the link scenarios is US5-7").toBe(1);
    if (body === undefined) return;
    const { browser, origin } = started();
    const page = await visit(browser, origin, "link.html", ["ocelle-elements.js", "link-target.html"]);
    const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
    const driver = fixtureDriver(page.page, page.log);
    const observed = await body.run(driver, inPage, noNavigation);
    const clipboard = await driver.clipboardCalls();
    expect({ observed, clipboard, recorded: await page.finish() }).toEqual({ observed: body.expected, clipboard: [], recorded: clean });
  });
});
