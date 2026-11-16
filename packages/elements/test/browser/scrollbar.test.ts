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

/** The scripts scroller.html loads: the browser build and the test-only slotted controls. */
const scripts = ["ocelle-elements.js", "ocelle-test-controls.js"];

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
    const page = await visit(browser, origin, "scroller.html", scripts);
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
    const page = await visit(browser, origin, "scroller.html", scripts);
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
    const page = await visit(browser, origin, "scroller.html", scripts);
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
      // While nothing fades the box has one mask layer, `none`, and Chromium gives the computed mask-size one size
      // per layer; once it overflows, the two layers' sizes.
      observed: { thickness: true, sizes: [`resize: 100% ${String(client)}px`, `resize: 100% ${String(client)}px, 100% ${String(thickness)}px`] },
      recorded: clean,
    });
  });

  it("the frame's handover ring shows over the scrollbar band once the content overflows again (US1-4, R-07)", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "scroller.html", scripts);
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

// Since 009 phase 2's operator round 3 (O3-02, T068; landing review L1-02): the one case where only the box's border
// box changes. A board in Frame W at 1280 px holds five lanes that fit; a card's inner block in the last lane grows to
// 600 px. The lanes are contained (FR-014), so neither the track nor the box's content box changes, but the classic
// scrollbar that appears adds its thickness to the box's block size, so its border box changes, and the module's
// observer of the border box sees it: the box becomes a tab stop and a `region` named "Board", with a scroll range of
// 443 px. Plant: the box observed without `{ box: "border-box" }` (its content box), which leaves the overflowing
// board with no tab stop and no role (reviews/phase-2/plants.md).
describe("ocelle-workflow-board with the platform's classic scrollbar (O3-02, FR-014)", { timeout: 120_000 }, () => {
  it("a card's inner block that grows past the board's end makes the board a tab stop and a region named \"Board\", scrollable by 443 px, though only the box's border box changed", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "board.html");
    const driver = fixtureDriver(page.page, page.log);
    await driver.viewport(1280, 800);
    const laneOf = (index: number, inner: string): string => `<ocelle-workflow-lane id="l${String(index)}" label="Lane ${String(index + 1)}"><p>${inner}</p></ocelle-workflow-lane>`;
    const lanes = [0, 1, 2, 3].map((index) => laneOf(index, "Card")).join("") + laneOf(4, '<span id="grow" class="grow"></span>');
    await driver.mount(`<div data-frame="W"><ocelle-workflow-board id="b" label="Board">${lanes}</ocelle-workflow-board></div>`);
    await driver.rules(".grow { display: block; inline-size: 20px; block-size: 20px; }");
    await driver.settle();
    const state = (): Promise<unknown> =>
      page.page.evaluate(() => {
        const box = document.getElementById("b")?.shadowRoot?.querySelector<HTMLElement>(".region-box");
        return {
          tabindex: box?.getAttribute("tabindex") ?? null,
          role: box?.getAttribute("role") ?? null,
          name: box?.getAttribute("aria-label") ?? null,
          range: (box?.scrollWidth ?? 0) - (box?.clientWidth ?? 0),
          bar: (box?.offsetHeight ?? 0) - (box?.clientHeight ?? 0) > 0,
        };
      });
    // The scroll range, 443 px within 1 px: as 443 when it is, else as measured.
    const within = (observed: unknown): unknown => {
      const { range, ...rest } = observed as { range: number };
      return { ...rest, range: Math.abs(range - 443) <= 1 ? 443 : range };
    };
    const fitting = await state();
    await driver.style("grow", "inline-size", "600px");
    await driver.settle();
    const grown = await state();
    expect({ observed: { fitting, grown: within(grown) }, recorded: await page.finish() }).toEqual({
      observed: {
        fitting: { tabindex: null, role: null, name: null, range: 0, bar: false },
        grown: { tabindex: "0", role: "region", name: "Board", range: 443, bar: true },
      },
      recorded: clean,
    });
  });
});
