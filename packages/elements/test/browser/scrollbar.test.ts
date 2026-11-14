import { chromium } from "playwright";
import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { difference } from "../pixels.ts";
import type { Pixels } from "../pixels.ts";
import { tokenColour } from "../scenarios/icon.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The platform's horizontal scrollbar (009 spec FR-001, FR-007, US1-4, US1-7, US1-13; research.md R-04, R-05, R-07;
// operator decisions PLAN-FRESH-1-003 (a), PLAN-FRESH-2-001 (a); T016). Headless Chromium hides scrollbars
// (`--hide-scrollbars`, which Playwright adds), so every other test sees overlay scrollbars of 0 px. This suite launches
// Chromium without that argument, so an overflowing box draws a classic scrollbar that takes block space, and checks on
// the strict-CSP fixture with the browser build:
// - the box's block size is its content's, plus the 5 px ring room on each side, plus the scrollbar's thickness
//   (measured, more than 0), with the ring room above the scrollbar;
// - at a faded edge the scrollbar's pixels equal those of a twin plain `overflow-x: auto` box of the same size,
//   content, padding and `scrollLeft`, within 005's pixel rule (`equal`, test/pixels.ts), while the content just above
//   it is faded;
// - when the scrollbar appears (the content grows past the box) the mask's size follows within the same observer
//   delivery: the fade layer is the client height, the opaque layer the scrollbar's thickness;
// - the handover ring of the frame shows over the scrollbar band.
// Plant: the fade layer sized to the whole box (no measured block size), which fades the scrollbar.
const built = inject("elementsFixture");
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch({ ...(executablePath === undefined || executablePath === "" ? {} : { executablePath }), ignoreDefaultArgs: ["--hide-scrollbars"] });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

const rules = [
  '[data-test="strip"] { inline-size: 300px; background-color: var(--ocelle-color-canvas); }',
  ".item { display: inline-block; inline-size: 80px; block-size: 24px; margin-inline-end: 4px; vertical-align: top; }",
  ".solid { display: inline-block; inline-size: 1000px; block-size: 24px; vertical-align: top; background-color: rgb(0, 0, 255); }",
  ".twin { inline-size: 300px; overflow-x: auto; overflow-y: hidden; padding-block: 5px; background-color: var(--ocelle-color-canvas); }",
  ".twin-track { inline-size: max-content; min-inline-size: 100%; box-sizing: border-box; padding-inline: 5px; }",
].join("\n");

/** The rectangle `x`, `y`, `width`, `height` of an image. */
function crop(image: Pixels, x: number, y: number, width: number, height: number): Pixels {
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      for (let k = 0; k < 4; k++) data[(row * width + column) * 4 + k] = image.data[((y + row) * image.width + x + column) * 4 + k] ?? 0;
    }
  }
  return { width, height, data };
}

/** An image's pixel at `x`, `y` as RGB. */
function pixel(image: Pixels, x: number, y: number): number[] {
  const index = (y * image.width + x) * 4;
  return [image.data[index] ?? 0, image.data[index + 1] ?? 0, image.data[index + 2] ?? 0];
}

const near = (a: number[], b: number[]): boolean => a.every((channel, index) => Math.abs(channel - (b[index] ?? 0)) <= 8);
const rgb = (text: string): number[] => (text.match(/\d+/g) ?? []).map(Number);

describe("ocelle-scroller with the platform's classic scrollbar (US1-4, US1-7, US1-13)", { timeout: 120_000 }, () => {
  it("the block size is the content's plus the ring room on each side plus the measured scrollbar, with the ring room above the scrollbar (FR-001)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "scroller.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount(`<div data-test="strip"><ocelle-scroller id="s" label="Strip">${Array.from({ length: 12 }, (_, i) => `<a id="k${String(i)}" class="item" href="#k">k</a>`).join("")}</ocelle-scroller></div>`);
    await driver.rules(rules);
    const figures = await page.page.evaluate(() => {
      const box = document.getElementById("s")?.shadowRoot?.querySelector<HTMLElement>(".region-box");
      const track = box?.querySelector(".region-track");
      const item = document.getElementById("k0");
      if (box === null || box === undefined || track === null || track === undefined || item === null) throw new Error("no scroller");
      const top = box.getBoundingClientRect().top;
      return { offset: box.offsetHeight, client: box.clientHeight, track: track.getBoundingClientRect().height, ringBottom: item.getBoundingClientRect().bottom + 5 - top };
    });
    const bar = figures.offset - figures.client;
    expect({ observed: { bar: bar > 0, block: figures.offset === figures.track + 10 + bar, ringAboveBar: figures.ringBottom <= figures.client }, recorded: await page.finish() }).toEqual({
      observed: { bar: true, block: true, ringAboveBar: true },
      recorded: clean,
    });
  });

  it("at a faded edge the scrollbar's pixels equal a twin plain box's, while the content just above the scrollbar is faded (FR-007)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "scroller.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<div data-test="strip"><ocelle-scroller id="s" label="Strip"><span class="solid"></span></ocelle-scroller></div><div id="twin" class="twin"><div class="twin-track"><span class="solid"></span></div></div>');
    await driver.rules(rules);
    const observe = async (): Promise<unknown> => {
      const client = await page.page.evaluate(() => document.getElementById("s")?.shadowRoot?.querySelector<HTMLElement>(".region-box")?.clientHeight ?? 0);
      const [scroller, twin] = [await driver.pixels("s"), await driver.pixels("twin")];
      const band = (image: Pixels): Pixels => crop(image, image.width - 40, client, 40, image.height - client);
      const ground = rgb(tokenColour("color-canvas", "light"));
      const row = Math.floor(client / 2);
      return {
        sameSize: [scroller.width, scroller.height].join() === [twin.width, twin.height].join(),
        bandDiffers: difference(band(scroller), band(twin)).over32,
        contentFaded: near(pixel(scroller, scroller.width - 1, row), ground) && near(pixel(twin, twin.width - 1, row), [0, 0, 255]),
      };
    };
    const atStart = await observe();
    await driver.setScrollLeft({ id: "s", inner: ".region-box" }, 300);
    await driver.setScrollLeft("twin", 300);
    const inMiddle = await observe();
    const faded = { sameSize: true, bandDiffers: 0, contentFaded: true };
    expect({ observed: { atStart, inMiddle }, recorded: await page.finish() }).toEqual({ observed: { atStart: faded, inMiddle: faded }, recorded: clean });
  });

  it("when the scrollbar appears, the mask's size follows in the observer delivery that sees it: the fade layer the client height, the opaque layer the scrollbar (R-05)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "scroller.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<div data-test="strip"><ocelle-scroller id="s" label="Strip"><span id="w" class="item"></span></ocelle-scroller></div>');
    await driver.rules(rules);
    const box = { id: "s", inner: ".region-box" };
    const record = await driver.frameRecord(box, { computed: "mask-size" });
    await driver.style("w", "inline-size", "1000px");
    const sizes = (await record.stop()).filter((each) => each.startsWith("resize: "));
    const bar = await page.page.evaluate(() => {
      const element = document.getElementById("s")?.shadowRoot?.querySelector<HTMLElement>(".region-box");
      return [element?.clientHeight ?? 0, (element?.offsetHeight ?? 0) - (element?.clientHeight ?? 0)];
    });
    const [client = 0, thickness = 0] = bar;
    expect({ observed: { thickness: thickness > 0, sizes }, recorded: await page.finish() }).toEqual({
      observed: { thickness: true, sizes: [`resize: 100% ${String(client)}px, 100% 0px`, `resize: 100% ${String(client)}px, 100% ${String(thickness)}px`] },
      recorded: clean,
    });
  });

  it("the frame's handover ring shows over the scrollbar band once the content overflows again (US1-4, R-07)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "scroller.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount('<button id="before" type="button">before</button><div data-test="strip"><ocelle-scroller id="s" label="Strip"><span id="w" class="solid"></span></ocelle-scroller></div>');
    await driver.rules(rules);
    await driver.tabWalk("before", "s >> div.region-box");
    await driver.style("w", "inline-size", "100px");
    const handed = await driver.activeElement();
    await driver.style("w", "inline-size", "1000px");
    const image = await driver.pixels("s");
    const focus = rgb(tokenColour("color-focus", "light"));
    const bar = await page.page.evaluate(() => {
      const element = document.getElementById("s")?.shadowRoot?.querySelector<HTMLElement>(".region-box");
      return (element?.offsetHeight ?? 0) - (element?.clientHeight ?? 0);
    });
    const bottom = image.height - 2;
    expect({
      observed: { handed, bar: bar > 0, ring: [pixel(image, 1, bottom - 4), pixel(image, image.width / 2, bottom), pixel(image, image.width - 2, bottom - 4)].map((each) => near(each, focus)) },
      recorded: await page.finish(),
    }).toEqual({ observed: { handed: "s >> div.region-frame", bar: true, ring: [true, true, true] }, recorded: clean });
  });
});
