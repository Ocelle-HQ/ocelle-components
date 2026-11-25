import { chromium } from "playwright";
import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import type { Driver, ElementTarget } from "../scenarios/driver.ts";
import { dt, lineBoxes, page as mountTable, region, safe, unmasked, usTable } from "../scenarios/data-table.ts";
import type { Region } from "../scenarios/data-table.ts";
import { layers } from "../scenarios/overflow-block.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The classic-scrollbar half of the block-axis option (019 operator answer Q-A3 (a); contracts/checks.md § Harnesses
// and the "classic scrollbar" oracle; contracts/overflow-region-block-axis.md § Tests; tasks.md T080). Both shared
// harnesses run Chromium with Playwright's `--hide-scrollbars`, so the block-axis scrollbar's room
// (`offsetWidth − clientWidth`) is 0 there. This suite launches Chromium without that argument, as 009's
// test/browser/scrollbar.test.ts does (not edited), so an overflowing box draws a classic scrollbar that takes inline
// room, and drives through `fixtureDriver` the data table's page (data-table.html) and the block-axis test host's
// page (overflow-block.html), with zero CSP violations and no console message. Every body asserts first, as a
// precondition, `data-axis="both"` and a room above 0 (15 px measured, spike-2 § Addendum), so a run that silently
// hides the scrollbars fails. The bodies are file-local: the in-process harness cannot draw a classic scrollbar.
// Guards: the `.box-size` write without the room subtracted (the sticky caption body); `scrollbar-gutter: stable`
// (the RTL lift); the block-scrollbar mask layer written `0px 100%` whatever the room (the mask figure).
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

const boxOf = (id: string): ElementTarget => ({ id, inner: ".region-box" });

/** The precondition of every body: `data-axis="both"` and the block-axis scrollbar's room above 0. */
const precondition = (read: Region | null): unknown => (read === null ? "no region" : { axis: read.axis, room: read.offsetWidth - read.clientWidth > 0 });

/** One animation frame after `settle`: the reading time of the cap (never the task of the change). */
async function later(driver: Driver): Promise<void> {
  await driver.settle();
  await driver.frames(1);
}

const caption = '<span id="ct">Work packages<br>by <a id="cl" href="#c">owner</a></span>';
// Twelve rows in a 200 px bound: unbounded, the page stays shorter than the 800 px viewport, so no page scrollbar
// narrows the host when the bound is lifted.
const stickyTable = (id: string, bound: boolean): string => dt(id, `sticky-header label="Work packages"${bound ? ' data-bound="200"' : ""}`, usTable(`${id}t`, { rows: 12, caption }));

describe("the block-axis option with classic scrollbars, on the strict-CSP fixture (Q-A3 (a))", { timeout: 120_000 }, () => {
  it("the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "data-table.html", ["ocelle-elements.js", "module.js"]);
    const driver = fixtureDriver(page.page, page.log, true);
    await mountTable(driver, stickyTable("s", true), 320);
    await later(driver);
    const read = async (): Promise<unknown> => {
      const box = await region(driver, "s");
      if (box === null) return "no region";
      const size = await safe(async () => (await driver.box("s", ".box-size")).width);
      const written = await safe(async () => (await driver.shadowComputed("s", ".region-track", "--data-table-box-size")).trim());
      const { left, right } = unmasked(box);
      const lines = await lineBoxes(driver, "ct");
      return {
        room: box.offsetWidth - box.clientWidth,
        cap: typeof size === "number" && typeof written === "string" && Math.abs(Number.parseFloat(written) - (size - (box.offsetWidth - box.clientWidth))) <= 0.01 ? "measured less the room" : `${written} against ${String(size)}`,
        written,
        lines: lines.length,
        inside: lines.every((line) => line.left >= left - 0.5 && line.right <= right + 0.5),
      };
    };
    const first = await region(driver, "s");
    const bounded = { precondition: precondition(first), read: await read() };
    await driver.setAttribute("s", "data-bound", null);
    await later(driver);
    const liftedRegion = await region(driver, "s");
    const lifted = { axis: liftedRegion === null ? "no region" : liftedRegion.axis, read: await read() };
    await driver.setAttribute("s", "data-bound", "200");
    await later(driver);
    const again = await read();
    const observed = { bounded, lifted, again };
    expect({ observed, recorded: await page.finish() }).toEqual({
      observed: {
        bounded: { precondition: { axis: "both", room: true }, read: { room: 15, cap: "measured less the room", written: "305px", lines: 2, inside: true } },
        lifted: { axis: null, read: { room: 0, cap: "measured less the room", written: "320px", lines: 2, inside: true } },
        again: { room: 15, cap: "measured less the room", written: "305px", lines: 2, inside: true },
      },
      recorded: clean,
    });
  });

  it("the RTL lift: a sticky table under dir=rtl overflowing both ways at 320 px has scrollLeft 0 and data-fade end at rest; at the far end of scrollWidth − clientWidth data-fade start with the last column inside within 0.5 px; scrollLeft 0 and data-fade end after the bound is lifted and after it is set again", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "data-table.html", ["ocelle-elements.js", "module.js"]);
    const driver = fixtureDriver(page.page, page.log, true);
    await mountTable(driver, `<div dir="rtl">${dt("r", 'sticky-header label="Work packages" data-bound="200"', usTable("rt", { rows: 12 }))}</div>`, 320);
    const first = await region(driver, "r");
    const state = (read: Region | null): unknown => (read === null ? "no region" : { scrollLeft: read.scrollLeft, fade: read.fade });
    const rest = state(first);
    let far: unknown = "no region";
    if (first !== null) {
      const range = first.scrollWidth - first.clientWidth;
      await driver.setScrollLeft(boxOf("r"), -range);
      const now = await region(driver, "r");
      const last = await driver.box("rt-h4");
      far = now === null ? "no region" : { reached: Math.abs(Math.abs(now.scrollLeft) - range) <= 1, fade: now.fade, lastInside: last.x >= now.x + (now.width - now.clientWidth) - 0.5 };
      await driver.setScrollLeft(boxOf("r"), 0);
    }
    await driver.setAttribute("r", "data-bound", null);
    await later(driver);
    const lifted = state(await region(driver, "r"));
    await driver.setAttribute("r", "data-bound", "200");
    await later(driver);
    const again = state(await region(driver, "r"));
    const observed = { precondition: precondition(first), rest, far, lifted, again };
    expect({ observed, recorded: await page.finish() }).toEqual({
      observed: {
        precondition: { axis: "both", room: true },
        rest: { scrollLeft: 0, fade: "end" },
        far: { reached: true, fade: "start", lastInside: true },
        lifted: { scrollLeft: 0, fade: "end" },
        again: { scrollLeft: 0, fade: "end" },
      },
      recorded: clean,
    });
  });

  it("the mask figure on the block-axis test host overflowing both ways, in LTR and under dir=rtl: four mask-size layers, the first <room>px 100% at the inline end in LTR and at the left in RTL, the fade layers <clientWidth>px <clientHeight>px, mask-composite add, add, intersect, add; 009's two layers once the bound is lifted", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "overflow-block.html", ["ocelle-test-overflow-block.js", "module.js"]);
    const driver = fixtureDriver(page.page, page.log);
    const hostRules = [
      "ocelle-test-overflow-block { font-family: sans-serif; font-size: 16px; line-height: 24px; inline-size: 320px; }",
      '[data-bound="300"] { max-block-size: 300px; }',
      ".pin { position: sticky; inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width))); block-size: 27px; inline-size: 600px; background-color: var(--ocelle-color-canvas); }",
      ".row { block-size: 30px; inline-size: 600px; }",
    ].join("\n");
    const rows = Array.from({ length: 20 }, (_, index) => `<div class="row"><a href="#r">r${String(index)}</a></div>`).join("");
    const host = (id: string): string => `<ocelle-test-overflow-block id="${id}" label="Rows" block-axis data-bound="300"><div class="pin"><a href="#p">pin</a></div>${rows}</ocelle-test-overflow-block>`;
    await driver.viewport(1280, 800);
    await driver.mount(`${host("l")}<div dir="rtl">${host("r")}</div>`);
    await driver.rules(hostRules);
    await driver.settle();
    const figure = async (id: string): Promise<unknown> => {
      const regionRead = await region(driver, id);
      if (regionRead === null) return "no region";
      const roomPx = regionRead.offsetWidth - regionRead.clientWidth;
      return {
        precondition: { axis: regionRead.axis, room: roomPx > 0 },
        size: layers(await driver.computed(id, "mask-size", ".region-box")),
        expectedSize: [`${String(roomPx)}px 100%`, `100% ${String(regionRead.offsetHeight - regionRead.clientHeight)}px`, `${String(regionRead.clientWidth)}px ${String(regionRead.clientHeight)}px`, `${String(regionRead.clientWidth)}px ${String(regionRead.clientHeight)}px`],
        first: layers(await driver.computed(id, "mask-position", ".region-box"))[0],
        composite: layers(await driver.computed(id, "mask-composite", ".region-box")),
      };
    };
    const ltr = await figure("l");
    const rtl = await figure("r");
    await driver.setAttribute("l", "data-bound", null);
    await driver.settle();
    const lifted = layers(await driver.computed("l", "mask-size", ".region-box")).length;
    const pick = (read: unknown): unknown => {
      if (typeof read !== "object" || read === null) return read;
      const { precondition: pre, size, expectedSize, first, composite } = read as { precondition: unknown; size: string[]; expectedSize: string[]; first: string; composite: string[] };
      return { precondition: pre, sizeMatches: JSON.stringify(size) === JSON.stringify(expectedSize) ? "room, inline scrollbar, client, client" : size, first, composite };
    };
    const observed = { ltr: pick(ltr), rtl: pick(rtl), lifted };
    expect({ observed, recorded: await page.finish() }).toEqual({
      observed: {
        ltr: { precondition: { axis: "both", room: true }, sizeMatches: "room, inline scrollbar, client, client", first: "100% 0%", composite: ["add", "add", "intersect", "add"] },
        rtl: { precondition: { axis: "both", room: true }, sizeMatches: "room, inline scrollbar, client, client", first: "0% 0%", composite: ["add", "add", "intersect", "add"] },
        lifted: 2,
      },
      recorded: clean,
    });
  });
});
